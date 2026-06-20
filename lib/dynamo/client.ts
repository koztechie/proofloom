/**
 * lib/dynamo/client.ts
 *
 * Singleton DynamoDB clients with exponential-backoff retry for
 * ProvisionedThroughputExceededException.
 *
 * Exports:
 *   docClient  — DynamoDBDocumentClient used by all lib/dynamo modules
 *   sendWithRetry<T>(command) — resilient send wrapper (auto-retries on throttling)
 */

import {
  DynamoDBClient,
  type DynamoDBClientConfig,
  ProvisionedThroughputExceededException,
  RequestLimitExceeded,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";

// ── Singleton construction ───────────────────────────────────────────────────

const clientConfig: DynamoDBClientConfig = {
  region: process.env.AWS_REGION ?? "us-east-1",
};

// Use static credentials when provided; otherwise fall back to IAM Role
// (Vercel OIDC federation or EC2/Lambda instance profile).
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const rawClient = new DynamoDBClient(clientConfig);

export const docClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: {
    /** Prevent errors when writing empty strings (DynamoDB rejects them). */
    convertEmptyValues: true,
    /** Strip undefined values so optional fields don't create null DDB attributes. */
    removeUndefinedValues: true,
  },
});

// ── Exponential-backoff retry wrapper ────────────────────────────────────────

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 100;

/**
 * Wraps a DynamoDBDocumentClient send() call with exponential backoff.
 * Retries on ProvisionedThroughputExceededException and RequestLimitExceeded.
 * All other errors are re-thrown immediately.
 *
 * @param command  Any DynamoDB Document command (Get/Put/Query/Update/…).
 * @returns        The resolved command output.
 */
export async function sendWithRetry<TOutput = any>(command: any): Promise<TOutput> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await docClient.send(command) as TOutput;
    } catch (err) {
      const isThrottled =
        err instanceof ProvisionedThroughputExceededException ||
        err instanceof RequestLimitExceeded;

      if (!isThrottled || attempt === MAX_RETRIES) {
        throw err;
      }

      // Full-jitter exponential backoff: delay in [0, 2^attempt * BASE_DELAY_MS]
      const cap = BASE_DELAY_MS * Math.pow(2, attempt);
      const delay = Math.random() * cap;
      lastError = err;

      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
