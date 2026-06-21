import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";

export const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
