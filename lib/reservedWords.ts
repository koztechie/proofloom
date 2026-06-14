const RESERVED_WORDS_CATEGORIES = {
  administrative: [
    "admin",
    "administrator",
    "root",
    "system",
    "sys",
    "superuser",
    "moderator",
    "moderators",
    "owner",
    "support",
    "staff",
    "help",
    "security",
    "abuse",
    "contact",
    "info",
    "welcome",
  ],
  routing: [
    "dashboard",
    "leaderboard",
    "pricing",
    "auth",
    "login",
    "register",
    "signup",
    "signin",
    "signout",
    "api",
    "cron",
    "setup",
    "seed",
    "challenge",
    "challenges",
    "proof",
    "proofs",
    "u",
  ],
  technical: [
    "localhost",
    "mail",
    "email",
    "webmaster",
    "hostmaster",
    "postmaster",
    "ftp",
    "smtp",
    "pop3",
    "imap",
    "ssl",
    "secure",
    "test",
    "dev",
    "demo",
    "public",
    "private",
    "static",
    "null",
    "undefined",
    "void",
  ],
  brand: [
    "proofloom",
    "proofloomadmin",
    "proofloomstaff",
    "h0",
    "h0hackathon",
    "aws",
    "amazon",
    "vercel",
  ],
};

// Конвертуємо всі категорії в єдиний плаский Set для миттєвого пошуку O(1)
const RESERVED_WORDS_SET = new Set(
  Object.values(RESERVED_WORDS_CATEGORIES)
    .flat()
    .map((w) => w.toLowerCase()),
);

export function isReservedHandle(handle: string): boolean {
  const normalized = handle.trim().toLowerCase();

  // 1. Перевірка на точний збіг із чорного списку
  if (RESERVED_WORDS_SET.has(normalized)) {
    return true;
  }

  // 2. Превентивний захист від створення фейкових брендових акаунтів (частковий збіг)
  if (
    normalized.startsWith("proofloom") ||
    normalized.startsWith("vercel") ||
    normalized.startsWith("aws_") ||
    normalized.startsWith("amazon")
  ) {
    return true;
  }

  return false;
}
