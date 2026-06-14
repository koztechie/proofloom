import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const clientConfig: any = {
  region: process.env.AWS_REGION || "us-east-1",
};

// Антикрихкість: використовуємо статичні ключі, якщо вони є.
// Інакше SDK підхопить IAM Role від Vercel OIDC.
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const client = new BedrockRuntimeClient(clientConfig);

export interface WeeklyReport {
  summary: string;
  strengths: string;
  gaps: string;
  recommendation: string;
}

export async function generateWeeklyReport(params: {
  skillCategory: string;
  challengeTitle: string;
  proofs: Array<{ date: string; proofText: string; aiScore: number }>;
  avgScore: number;
  consistency: number;
}): Promise<WeeklyReport> {
  // Обрізаємо кожний звіт до 200 символів, щоб захистити контекст від переповнення
  const proofDigest = params.proofs
    .map((p) => `[${p.date}, score ${p.aiScore}]: ${p.proofText.slice(0, 200)}`)
    .join("\n");

  const prompt = `You are an expert skill development coach analyzing a week of practice submissions.

Skill category: ${params.skillCategory}
Challenge: ${params.challengeTitle}
Week consistency: ${params.consistency}% (${params.proofs.length}/7 days)
Average proof score: ${params.avgScore}/100

Submissions this week:
${proofDigest}

Write a concise weekly coaching report. Respond ONLY in valid JSON, no other text:
{
  "summary": "<2-3 sentences: overall assessment of the week's work>",
  "strengths": "<1-2 sentences: what the person did well, citing specific evidence from submissions>",
  "gaps": "<1-2 sentences: concrete weaknesses or missing depth observed this week>",
  "recommendation": "<1 specific, actionable task for next week — not generic advice>"
}`;

  try {
    const response = await client.send(
      new InvokeModelCommand({
        // КРИТИЧНО ДЛЯ US-EAST-1: Використовуємо Cross-Region Inference Profile
        modelId: "us.amazon.nova-lite-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          messages: [{ role: "user", content: [{ text: prompt }] }],
          inferenceConfig: { maxTokens: 400, temperature: 0.4 },
        }),
      }),
    );

    const body = JSON.parse(new TextDecoder().decode(response.body));
    const text = body.output?.message?.content?.[0]?.text || "{}";

    // Антикрихкий парсер: видаляємо можливу markdown-обгортку ```json ... ```
    let cleanText = text.trim();
    if (cleanText.includes("```")) {
      const match = cleanText.match(/```(?:json)?([\s\S]*?)```/);
      if (match && match[1]) {
        cleanText = match[1].trim();
      }
    }

    const parsed = JSON.parse(cleanText);

    return {
      summary: parsed.summary || "Weekly analysis completed.",
      strengths: parsed.strengths || "Consistent submission maintained.",
      gaps: parsed.gaps || "Deeper technical detail recommended.",
      recommendation:
        parsed.recommendation || "Focus on one core concept next week.",
    };
  } catch (error) {
    console.warn(
      "Amazon Bedrock failed during weekly coach generation, using fallback. Error details:",
      error,
    );
    // Розумний fallback-сценарій
    return {
      summary: "Weekly report generation temporarily unavailable.",
      strengths: "You submitted proofs this week.",
      gaps: "Analysis pending.",
      recommendation: "Continue your daily practice.",
    };
  }
}
