// КРИТИЧНО ДЛЯ WORKER THREADS: Завантажуємо змінні оточення у першій лінії запуску воркера!
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import {
  setupTestDb,
  truncateTestDb,
  teardownTestDb,
} from "./__tests__/utils/test-db";

// Ініціалізуємо порожній MSW-сервер для перехоплення HTTP-запитів [10]
export const server = setupServer();

beforeAll(async () => {
  // КРИТИЧНО ДЛЯ AWS SDK: Змушуємо MSW пропускати (bypass) всі виклики,
  // які ми не мокали явно (наприклад, запити RDS Signer до AWS STS), щоб уникнути PAM помилок [10, 24]
  server.listen({ onUnhandledRequest: "bypass" });
  await setupTestDb();
});

afterEach(async () => {
  server.resetHandlers();
  await truncateTestDb();
});

afterAll(async () => {
  server.close();
  await teardownTestDb();
});
