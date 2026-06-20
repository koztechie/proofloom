/**
 * lib/dynamo/migrations/create-table.ts
 *
 * Programmatic database migration script to create the StreakProofs table.
 * Implements Single-Table Design with two Global Secondary Indexes.
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export async function createTable() {
  const command = new CreateTableCommand({
    TableName: "StreakProofs",
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" },
      { AttributeName: "gsi2pk", AttributeType: "S" },
      { AttributeName: "gsi2sk", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi1pk-gsi1sk-index",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "gsi2pk-gsi2sk-index",
        KeySchema: [
          { AttributeName: "gsi2pk", KeyType: "HASH" },
          { AttributeName: "gsi2sk", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  });

  try {
    const response = await client.send(command);
    console.log("Table creation initiated successfully:", response.TableDescription?.TableStatus);
  } catch (error) {
    if (error instanceof ResourceInUseException) {
      console.log("Table 'StreakProofs' already exists. Skipping creation.");
    } else {
      console.error("Error creating table:", error);
      throw error;
    }
  }
}

// Allow running directly
if (typeof require !== 'undefined' && require.main === module) {
  createTable().catch((err) => {
    process.exit(1);
  });
}
