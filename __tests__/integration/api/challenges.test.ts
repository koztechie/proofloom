import { describe, test, expect } from "vitest";
import { userFactory } from "../../fixtures";

describe("POST /api/challenges", () => {
  test("should create a challenge successfully", async () => {
    const user = await userFactory();

    // Передаємо camelCase параметри для успішного проходження Zod-валідації [E1, 31]
    const payload = {
      title: "Learn Rust",
      skillCategory: "Web Dev",
      targetDays: 30,
      isPublic: true,
    };

    // Оскільки ми в інтеграційному тесті, передаємо ідентифікатор сесії (або мокуємо її)
    // Наша Next.js 16 API-обгортка безпечно зчитає її
    const res = await fetch("http://localhost:3000/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Тимчасово очікуємо або редірект на логін, або успішний запис залежно від сесії,
    // але для нашого тесту ми очікуємо 200, якщо сесія промокована
    expect(res.status).toBe(200);
  });

  test("should return 400 validation error for target_days out of bounds", async () => {
    const payload = {
      title: "Learn Rust",
      skillCategory: "Web Dev",
      targetDays: 5, // Невалідна кількість днів (має бути від 7 до 365) [31]
      isPublic: true,
    };

    const res = await fetch("http://localhost:3000/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(400);
  });
});
