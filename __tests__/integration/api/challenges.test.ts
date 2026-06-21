import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/challenges/route";
import { NextRequest } from "next/server";
import { userFactory } from "../../fixtures";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

describe("POST /api/challenges", () => {
  let user: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    user = await userFactory();
    (auth as any).mockResolvedValue({
      user: { id: user.id, handle: user.handle, role: "USER", isActive: true }
    });
  });

  it("should create a challenge successfully", async () => {
    const req = new NextRequest("http://localhost/api/challenges", {
      method: "POST",
      body: JSON.stringify({
        title: "Learn Rust",
        skillCategory: "rust",
        targetDays: 30,
        isPublic: true
      }),
      headers: { "Content-Type": "application/json" }
    });

    const res = await POST(req, {});
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.challenge.title).toBe("Learn Rust");
    expect(data.challenge.userId).toBe(user.id);
  });

  it("should return 400 validation error for target_days out of bounds", async () => {
    const req = new NextRequest("http://localhost/api/challenges", {
      method: "POST",
      body: JSON.stringify({
        title: "Learn Rust",
        skillCategory: "rust",
        targetDays: 5, // Invalid, < 7
        isPublic: true
      }),
      headers: { "Content-Type": "application/json" }
    });

    const res = await POST(req, {});
    expect(res.status).toBe(400);
  });
});
