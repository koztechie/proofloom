import { create as createUser, NewUser } from "@/lib/db/repositories/user.repository";
import { create as createChallenge, NewChallenge } from "@/lib/db/repositories/challenge.repository";
import { submitProof, NewProof } from "@/lib/db/repositories/proof.repository";

export async function userFactory(overrides: Partial<NewUser> = {}) {
  const defaultUser: NewUser = {
    handle: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    email: `test_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`,
    passwordHash: "hashed_password",
    displayName: "Test User",
    role: "USER",
    isActive: true,
  };
  return await createUser({ ...defaultUser, ...overrides });
}

export async function challengeFactory(userId: string, overrides: Partial<NewChallenge> = {}) {
  const defaultChallenge: NewChallenge = {
    userId,
    title: "Test Challenge",
    skillCategory: "typescript",
    targetDays: 30,
    isPublic: true,
  };
  return await createChallenge({ ...defaultChallenge, ...overrides });
}

export async function proofFactory(userId: string, challengeId: string, overrides: Partial<NewProof> = {}) {
  const defaultProof: NewProof = {
    userId,
    challengeId,
    content: "This is a test proof.",
    url: "https://example.com/proof",
    score: 85,
    aiComment: "Good job!",
  };
  return await submitProof({ ...defaultProof, ...overrides });
}
