// Sensitive-site protection: pages matching these are never tracked by
// default — no title, no URL, no interaction data is stored, and they are
// never sent to the AI layer or included in a journey.

export const DEFAULT_EXCLUDED_DOMAINS: string[] = [
  // Webmail
  "mail.google.com",
  "outlook.live.com",
  "outlook.office.com",
  "outlook.office365.com",
  "mail.yahoo.com",
  "protonmail.com",
  "mail.proton.me",
  // Google account / auth
  "accounts.google.com",
  "myaccount.google.com",
  // Banking / payments (major US + common international)
  "chase.com",
  "bankofamerica.com",
  "wellsfargo.com",
  "citibank.com",
  "capitalone.com",
  "usbank.com",
  "paypal.com",
  "venmo.com",
  "stripe.com",
  "wise.com",
  // Password managers
  "vault.bitwarden.com",
  "my.1password.com",
  "lastpass.com",
  "dashlane.com",
  // Private messaging
  "web.whatsapp.com",
  "messages.google.com",
  "www.messenger.com",
  "web.telegram.org",
  "signal.org",
  // Health / medical
  "mychart.com",
  "webmd.com",
  "healthline.com",
  "patient.info",
];

const SENSITIVE_PATH_KEYWORDS = [
  "login",
  "signin",
  "sign-in",
  "checkout",
  "payment",
  "billing",
  "account/security",
  "wp-admin",
];

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function domainMatches(hostname: string, listed: string): boolean {
  const h = hostname.replace(/^www\./, "");
  const l = listed.replace(/^www\./, "");
  return h === l || h.endsWith(`.${l}`);
}

export function isSensitiveUrl(
  url: string,
  customExcludedDomains: string[] = []
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return true; // unparsable URL: fail closed, don't track
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return true; // chrome://, file://, extension pages, etc.
  }

  const hostname = parsed.hostname;
  const allExcluded = [...DEFAULT_EXCLUDED_DOMAINS, ...customExcludedDomains];
  if (allExcluded.some((d) => domainMatches(hostname, d))) {
    return true;
  }

  const path = parsed.pathname.toLowerCase();
  if (SENSITIVE_PATH_KEYWORDS.some((kw) => path.includes(kw))) {
    return true;
  }

  return false;
}
