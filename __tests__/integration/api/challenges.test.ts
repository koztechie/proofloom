import { describe, test, expect, vi, beforeEach } from "vitest";
import { userFactory } from "../../fixtures";
import { POST } from "@/app/api/challenges/route";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

describe("POST /api/challenges", () => {
  let user: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    user = await userFactory();

    // Динамічно мокуємо сесію, використовуючи реальний UUID створеного користувача! [E2, 31]
    (auth as any).mockResolvedValue({
      user: {
        id: user.id,
        handle: user.handle,
        role: "USER",
        isActive: true,
      },
    });
  });

  test("should create a challenge successfully", async () => {
    const payload = {
      title: "Learn Rust",
      skillCategory: "SQL", // Використовуємо ЛЕГІТИМНУ категорію з Zod-схеми! [31]
      targetDays: 30,
      isPublic: true,
    };

    const req = new NextRequest("http://localhost:3000/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Next.js 16: другий аргумент має містити params як Promise [22]
    const res = await POST(req, { params: Promise.resolve({}) });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.data.title).toBe("Learn Rust");
    expect(data.data.user_id).toBe(user.id);
  });

  test("should return 400 validation error for target_days out of bounds", async () => {
    const payload = {
      title: "Learn Rust",
      skillCategory: "SQL",
      targetDays: 5, // Невалідна кількість днів (менше 7) [31]
      isPublic: true,
    };

    const req = new NextRequest("http://localhost:3000/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
  });
});
