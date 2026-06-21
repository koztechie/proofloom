import { describe, test, expect, vi } from "vitest";
import { userFactory } from "../../fixtures";
import { POST } from "@/app/api/challenges/route";
import { NextRequest } from "next/server";

// 1. Мокуємо сесію NextAuth для нашого тесту [21, 30]
const MOCK_USER_ID = "36584e43-267c-4f60-a115-d2829a833f46"; // Валідний UUID
const MOCK_HANDLE = "koztechie_test_mock";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "36584e43-267c-4f60-a115-d2829a833f46",
      handle: "koztechie_test_mock",
    },
  }),
}));

describe("POST /api/challenges", () => {
  test("should create a challenge successfully", async () => {
    // Створюємо користувача з тими ж даними, що поверне мок сесії [E2]
    await userFactory({ id: MOCK_USER_ID, handle: MOCK_HANDLE });

    const payload = {
      title: "Learn Rust",
      skillCategory: "Web Dev", // camelCase Zod-схема! [31]
      targetDays: 30,
      isPublic: true,
    };

    const req = new NextRequest("http://localhost:3000/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Прямий виклик хендлера API без потреби запускати сервер! [E6]
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.challenge.title).toBe("Learn Rust");
    expect(data.challenge.userId).toBe(MOCK_USER_ID);
  });

  test("should return 400 validation error for target_days out of bounds", async () => {
    const payload = {
      title: "Learn Rust",
      skillCategory: "Web Dev",
      targetDays: 5, // Невалідна кількість днів
      isPublic: true,
    };

    const req = new NextRequest("http://localhost:3000/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
