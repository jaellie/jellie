import {
  Activity,
  AdaptiveQuestion,
  GoalCandidate,
  Journey,
  JourneySummary,
} from "./types";
import { tokenizeTitle } from "./journeyGrouping";

// AI service abstraction. The interface is provider-agnostic so a real
// model-backed implementation could be swapped in later; the MVP ships a
// local, deterministic heuristic implementation that runs entirely offline
// (no accounts, no cloud calls, nothing leaves the device) and never
// hard-codes topic-specific options — it only reasons over whatever
// activity evidence it's given.
//
// The AI is always framed as an assistant, never an authority: candidates
// are phrased as possibilities ("You may have been exploring...") and the
// caller is responsible for always offering "Something else" alongside
// whatever this generates.

export class AIUnavailableError extends Error {
  constructor(message = "AI unavailable") {
    super(message);
    this.name = "AIUnavailableError";
  }
}

export interface AIService {
  isAvailable(): Promise<boolean>;
  generateGoalCandidates(activities: Activity[]): Promise<GoalCandidate[]>;
  generateFollowUpQuestion(
    selected: GoalCandidate,
    activities: Activity[],
    questionsAskedSoFar: number
  ): Promise<AdaptiveQuestion | null>;
  generateSummary(
    journey: Journey,
    activities: Activity[],
    unrelated: Activity[]
  ): Promise<JourneySummary>;
}

const MAX_FOLLOWUP_QUESTIONS = 2; // + the initial question = 3 absolute max

function titleCase(word: string): string {
  return word.length === 0 ? word : word[0].toUpperCase() + word.slice(1);
}

function topKeywords(
  activities: Activity[],
  minCount = 2
): Array<[string, number]> {
  const freq = new Map<string, number>();
  for (const a of activities) {
    for (const w of new Set(tokenizeTitle(a.title))) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  return Array.from(freq.entries())
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1]);
}

function phraseFromKeywords(keywords: string[]): string {
  return keywords.map(titleCase).join(" ");
}

function uniqueDomains(activities: Activity[]): string[] {
  return Array.from(new Set(activities.map((a) => a.domain)));
}

function activitiesContainingAnyKeyword(
  activities: Activity[],
  keywords: string[]
): Activity[] {
  const set = new Set(keywords);
  return activities.filter((a) =>
    tokenizeTitle(a.title).some((w) => set.has(w))
  );
}

export class LocalHeuristicAIService implements AIService {
  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateGoalCandidates(
    activities: Activity[]
  ): Promise<GoalCandidate[]> {
    if (activities.length === 0) {
      throw new AIUnavailableError("No activity evidence to reason about");
    }

    const candidates: GoalCandidate[] = [];
    const keywordEntries = topKeywords(activities);
    const primaryKeywords = keywordEntries.slice(0, 3).map(([w]) => w);
    const primaryPhrase = phraseFromKeywords(primaryKeywords);
    const domains = uniqueDomains(activities);
    const allIds = activities.map((a) => a.id);

    if (primaryPhrase) {
      candidates.push({
        id: "explore",
        text: `Exploring ${primaryPhrase}`,
        rationale: `${activities.length} pages in this trail mention "${primaryPhrase.toLowerCase()}".`,
        needsNarrowing: true,
        supportingActivityIds: allIds,
      });
    }

    if (primaryPhrase && domains.length >= 2) {
      const supporting = activitiesContainingAnyKeyword(
        activities,
        primaryKeywords
      );
      candidates.push({
        id: "compare",
        text: `Comparing options related to ${primaryPhrase}`,
        rationale: `You visited ${domains.length} different sites touching on "${primaryPhrase.toLowerCase()}".`,
        needsNarrowing: false,
        supportingActivityIds: supporting.map((a) => a.id),
      });
    }

    const secondaryKeywords = keywordEntries
      .slice(3, 6)
      .map(([w]) => w)
      .filter((w) => !primaryKeywords.includes(w));
    if (secondaryKeywords.length > 0) {
      const secondaryPhrase = phraseFromKeywords(secondaryKeywords.slice(0, 2));
      const supporting = activitiesContainingAnyKeyword(
        activities,
        secondaryKeywords
      );
      candidates.push({
        id: "research-secondary",
        text: `Researching ${secondaryPhrase}`,
        rationale: `A smaller cluster of pages centers on "${secondaryPhrase.toLowerCase()}".`,
        needsNarrowing: false,
        supportingActivityIds: supporting.map((a) => a.id),
      });
    }

    const domainFreq = new Map<string, number>();
    for (const a of activities) {
      domainFreq.set(a.domain, (domainFreq.get(a.domain) ?? 0) + 1);
    }
    const topDomain = Array.from(domainFreq.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (topDomain && topDomain[1] >= 2) {
      candidates.push({
        id: "domain-focus",
        text: `Following up on ${topDomain[0]}`,
        rationale: `Most of this trail (${topDomain[1]} pages) was on ${topDomain[0]}.`,
        needsNarrowing: false,
        supportingActivityIds: activities
          .filter((a) => a.domain === topDomain[0])
          .map((a) => a.id),
      });
    }

    if (candidates.length < 3) {
      candidates.push({
        id: "general-browsing",
        text: "Just exploring these pages without one clear focus yet",
        rationale:
          "This trail doesn't have one dominant keyword or site — it may span more than one thing.",
        needsNarrowing: false,
        supportingActivityIds: allIds,
      });
    }

    return candidates.slice(0, 5);
  }

  async generateFollowUpQuestion(
    selected: GoalCandidate,
    activities: Activity[],
    questionsAskedSoFar: number
  ): Promise<AdaptiveQuestion | null> {
    if (!selected.needsNarrowing) return null;
    if (questionsAskedSoFar >= MAX_FOLLOWUP_QUESTIONS) return null;

    const supporting = activities.filter((a) =>
      selected.supportingActivityIds.includes(a.id)
    );
    if (supporting.length < 2) return null;

    const domainFreq = new Map<string, number>();
    for (const a of supporting) {
      domainFreq.set(a.domain, (domainFreq.get(a.domain) ?? 0) + 1);
    }
    const sortedDomains = Array.from(domainFreq.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const topDomain = sortedDomains[0]?.[0];
    const groupA = supporting.filter((a) => a.domain === topDomain);
    const groupB = supporting.filter((a) => a.domain !== topDomain);

    if (groupA.length === 0 || groupB.length === 0) return null;

    const groupBKeywords = topKeywords(groupB, 1).slice(0, 2).map(([w]) => w);
    const labelA = `mainly on ${topDomain}`;
    const labelB = groupBKeywords.length
      ? `looking into ${phraseFromKeywords(groupBKeywords)}`
      : "spread across other sources";

    return {
      id: `followup-${questionsAskedSoFar + 1}`,
      text: "Were you mainly focused on one of these, or both?",
      allowFreeText: true,
      options: [
        {
          id: "a",
          text: titleCase(labelA),
          activityIds: groupA.map((a) => a.id),
        },
        {
          id: "b",
          text: titleCase(labelB),
          activityIds: groupB.map((a) => a.id),
        },
        {
          id: "both",
          text: "Both, roughly equally",
          activityIds: supporting.map((a) => a.id),
        },
      ],
    };
  }

  async generateSummary(
    journey: Journey,
    activities: Activity[],
    unrelated: Activity[]
  ): Promise<JourneySummary> {
    const goalText = journey.goal?.text ?? journey.title;
    const domains = uniqueDomains(activities);
    const explored = Array.from(
      new Set(
        activities.map((a) => a.title || a.domain).filter((t) => t.length > 0)
      )
    ).slice(0, 8);

    const narrative =
      activities.length > 0
        ? `You explored ${activities.length} page${
            activities.length === 1 ? "" : "s"
          } related to "${goalText}" across ${domains.length} site${
            domains.length === 1 ? "" : "s"
          }.`
        : `No activity is recorded for "${goalText}" yet.`;

    const potentiallyUnrelated = Array.from(
      new Set(unrelated.map((a) => a.title || a.domain))
    ).slice(0, 6);

    return {
      narrative,
      explored,
      potentiallyUnrelated,
      generatedAt: Date.now(),
    };
  }
}

export const aiService: AIService = new LocalHeuristicAIService();
