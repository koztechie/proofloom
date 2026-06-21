import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import {
  setupTestDb,
  truncateTestDb,
  teardownTestDb,
} from "./__tests__/utils/test-db";

export const server = setupServer();

beforeAll(async () => {
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
