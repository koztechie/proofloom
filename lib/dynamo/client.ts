import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const clientConfig: any = {
  region: process.env.AWS_REGION || "us-east-1",
};

// Антикрихкість: якщо статичні ключі прописані, використовуємо їх.
// Інакше SDK автоматично підхопить IAM Role від Vercel OIDC.
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const client = new DynamoDBClient(clientConfig);

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true, // Попереджує краш бази при записі порожніх/необов'язкових полів
  },
});
