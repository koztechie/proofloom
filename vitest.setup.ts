import "@testing-library/jest-dom/vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

import { beforeAll, afterEach, afterAll } from "vitest";
import { setupTestDb, truncateTestDb, teardownTestDb } from "./__tests__/utils/test-db";

export const server = setupServer(
  http.post("https://bedrock-runtime.*.amazonaws.com/*", () => {
    // Return a mocked success response from Bedrock
    return HttpResponse.json({
      body: Buffer.from(JSON.stringify({ score: 85, comment: "Mocked MSW Comment" })).toString("base64"),
      contentType: "application/json",
    });
  })
);

beforeAll(async () => {
  server.listen({ onUnhandledRequest: "warn" });
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
