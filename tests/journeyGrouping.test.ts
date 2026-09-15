import { describe, it, expect } from "vitest";
import {
  findJourneyCandidates,
  keywordOverlapScore,
  tokenizeTitle,
} from "../src/shared/journeyGrouping";
import { Activity } from "../src/shared/types";

let counter = 0;
function makeActivity(overrides: Partial<Activity> = {}): Activity {
  counter++;
  return {
    id: `a${counter}`,
    url: `https://example.com/${counter}`,
    domain: "example.com",
    title: "Untitled",
    timestamp: Date.now(),
    durationMs: 65_000,
    interactionTypes: ["click"],
    ...overrides,
  };
}

describe("keywordOverlapScore / tokenizeTitle", () => {
  it("tokenizes and strips stopwords", () => {
    expect(tokenizeTitle("The HCI Master's Programs List")).toEqual(
      expect.arrayContaining(["hci", "master", "programs", "list"])
    );
  });

  it("scores identical keyword sets as 1", () => {
    const a = tokenizeTitle("HCI Master's Programs");
    const b = tokenizeTitle("HCI Master's Programs");
    expect(keywordOverlapScore(a, b)).toBe(1);
  });

  it("scores disjoint sets as 0", () => {
    expect(keywordOverlapScore(["alpha"], ["beta"])).toBe(0);
  });
});

describe("findJourneyCandidates", () => {
  const now = Date.now();

  it("2 qualifying related activities -> no journey", () => {
    const activities = [
      makeActivity({
        title: "HCI Master's Programs Overview",
        domain: "university.edu",
        timestamp: now,
      }),
      makeActivity({
        title: "HCI Master's Programs Requirements",
        domain: "university.edu",
        timestamp: now + 60_000,
      }),
    ];
    expect(findJourneyCandidates(activities)).toHaveLength(0);
  });

  it("3 qualifying related activities -> possible journey", () => {
    const activities = [
      makeActivity({
        title: "HCI Master's Programs Overview",
        domain: "google.com",
        timestamp: now,
      }),
      makeActivity({
        title: "HCI Master's Programs Faculty",
        domain: "university.edu",
        timestamp: now + 5 * 60_000,
      }),
      makeActivity({
        title: "HCI Master's Programs Discussion",
        domain: "reddit.com",
        timestamp: now + 10 * 60_000,
      }),
    ];
    const candidates = findJourneyCandidates(activities);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toHaveLength(3);
  });

  it("3 unrelated activities -> no journey", () => {
    const activities = [
      makeActivity({
        title: "Best Pizza Recipes",
        domain: "cooking.com",
        timestamp: now,
      }),
      makeActivity({
        title: "Quarterly Financial Report Analysis",
        domain: "news.com",
        timestamp: now + 3 * 60 * 60 * 1000,
      }),
      makeActivity({
        title: "Vintage Guitar Restoration Tips",
        domain: "music.com",
        timestamp: now + 6 * 60 * 60 * 1000 + 10 * 60_000,
      }),
    ];
    expect(findJourneyCandidates(activities)).toHaveLength(0);
  });

  it("same domain alone (different topics) does not cluster", () => {
    const activities = [
      makeActivity({
        title: "HCI Lecture Notes",
        domain: "youtube.com",
        timestamp: now,
      }),
      makeActivity({
        title: "Christmas Music Playlist",
        domain: "youtube.com",
        timestamp: now + 60_000,
      }),
      makeActivity({
        title: "Piano Cover Compilation",
        domain: "youtube.com",
        timestamp: now + 2 * 60_000,
      }),
    ];
    // Same domain + same time window, but zero keyword overlap between any
    // pair: keyword overlap is a hard gate, so same-domain/close-timing
    // alone must never cluster these into one journey.
    expect(findJourneyCandidates(activities)).toHaveLength(0);
  });
});
