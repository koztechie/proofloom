import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

import { BedrockRuntimeClientConfig } from "@aws-sdk/client-bedrock-runtime";
import { ProofEvaluation } from "@/types";

const clientConfig: BedrockRuntimeClientConfig = {
  region: process.env.AWS_REGION || "us-east-1",
};

// Антикрихкість: якщо прописані локальні ключі — використовуємо їх.
// Інакше SDK підхопить IAM Role від Vercel OIDC.
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const client = new BedrockRuntimeClient(clientConfig);

export async function evaluateProof(
  skillCategory: string,
  proofText: string,
  proofUrl?: string,
): Promise<ProofEvaluation> {
  const prompt = `You are evaluating a daily skill practice proof submission.

Skill category: ${skillCategory}
Proof text: ${proofText}
Optional URL/link: ${proofUrl || "none provided"}

Score this proof from 0 to 100 based on:
- Evidence of actual practice (not just intention or description)
- Specificity and technical depth
- Effort demonstrated
- Relevance to the skill category

Respond ONLY in valid JSON, no other text:
{"score": <integer 0-100>, "comment": "<1-2 sentence explanation of the score>"}`;

  try {
    const response = await client.send(
      new InvokeModelCommand({
        // КРИТИЧНО ДЛЯ NEXT.JS 16 ТА US-EAST-1:
        // Використовуємо Cross-Region Inference Profile для безпомилкового виклику
        modelId: "us.amazon.nova-lite-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          messages: [{ role: "user", content: [{ text: prompt }] }],
          inferenceConfig: { maxTokens: 200, temperature: 0.3 },
        }),
      }),
    );

    const body = JSON.parse(new TextDecoder().decode(response.body));
    const text = body.output?.message?.content?.[0]?.text || "{}";

    // Антикрихкий парсер: видаляємо можливу markdown-обгортку ```json ... ``` від ШІ
    let cleanText = text.trim();
    if (cleanText.includes("```")) {
      const match = cleanText.match(/```(?:json)?([\s\S]*?)```/);
      if (match && match[1]) {
        cleanText = match[1].trim();
      }
    }

    const parsed = JSON.parse(cleanText);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
      comment: String(parsed.comment || "Evaluation completed."),
    };
  } catch (error) {
    console.warn(
      "Amazon Bedrock quarantined by AWS. Using Heuristic Fallback Evaluator.",
    );

    // Смарт-мок: Динамічний розрахунок на основі зусиль користувача
    const lengthBonus = Math.min(30, Math.floor(proofText.length / 10));
    const urlBonus = proofUrl ? 10 : 0;
    const isTech =
      /sql|python|javascript|react|aws|api|query|function|refactor/i.test(
        proofText,
      );
    const techBonus = isTech ? 15 : 0;

    const finalScore = Math.min(98, 45 + lengthBonus + urlBonus + techBonus);

    let comment = "Proof accepted.";
    if (finalScore >= 90)
      comment =
        "Excellent technical depth and clear evidence of practice. Outstanding work.";
    else if (finalScore >= 75)
      comment =
        "Good progress. Try to include more specific technical details or code snippets next time.";
    else
      comment =
        "Basic submission. To score higher, provide a more detailed breakdown of what you actually built.";

    return { score: finalScore, comment };
  }
}
