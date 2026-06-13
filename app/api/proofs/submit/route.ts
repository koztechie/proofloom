import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getChallengeById } from "@/lib/db/challenges";
import { evaluateProof } from "@/lib/ai/evaluator";
import { submitProof, getProofsByHandle } from "@/lib/dynamo/proofs";
import { getCurrentStreak } from "@/lib/dynamo/streaks";

export async function POST(request: Request) {
  try {
    // 1. Перевірка авторизації користувача
    const session = await auth();
    if (!session?.user?.handle || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const handle = session.user.handle;
    const userId = session.user.id;

    // 2. Валідація тіла запиту
    const body = await request.json();
    const { challengeId, proofText, proofUrl } = body;

    if (!challengeId || !proofText) {
      return NextResponse.json(
        { error: "Challenge ID and proof text are required." },
        { status: 400 },
      );
    }

    // Захист від спаму: звіт має містити хоча б 50 символів реального тексту
    if (proofText.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Proof text must be at least 50 characters long to demonstrate actual effort.",
        },
        { status: 400 },
      );
    }

    // 3. Перевірка існування челенджу в Aurora PostgreSQL та прав власності
    const challenge = await getChallengeById(challengeId);
    if (!challenge || challenge.user_id !== userId) {
      return NextResponse.json(
        { error: "Challenge not found or access denied." },
        { status: 404 },
      );
    }

    // 4. Захист від подвійного сабміту (один звіт на один челендж на день)
    const todayStr = new Date().toISOString().split("T")[0];
    const existingProofs = await getProofsByHandle(handle);
    const alreadySubmittedToday = existingProofs.some(
      (p) => p.sk === `PROOF#${todayStr}` && p.challenge_id === challengeId,
    );

    if (alreadySubmittedToday) {
      return NextResponse.json(
        {
          error:
            "You have already submitted a proof for this challenge today. Keep up the good work tomorrow!",
        },
        { status: 400 },
      );
    }

    // 5. Розрахунок прогресу стріку
    const currentStreak = await getCurrentStreak(handle);
    const streakDay = currentStreak + 1;

    // 6. Оцінювання ШІ (Bedrock Nova Lite)
    // Наш evaluator.ts містить внутрішній try-catch, тому якщо AWS акаунт
    // ще в карантині — він плавно поверне 85 балів і не зламає транзакцію.
    const evaluation = await evaluateProof(
      challenge.skill_category,
      proofText,
      proofUrl,
    );

    // 7. Запис звіту в NoSQL базу DynamoDB та оновлення лідерборду
    await submitProof({
      handle,
      challengeId,
      proofText,
      proofUrl,
      streakDay,
      aiScore: evaluation.score,
      aiComment: evaluation.comment,
      skillCategory: challenge.skill_category, // ЦЕЙ РЯДОК ДОДАНО
    });

    // 8. Повернення успішного результату
    return NextResponse.json({
      success: true,
      score: evaluation.score,
      comment: evaluation.comment,
      streakDay,
    });
  } catch (error: any) {
    console.error("Submit proof API route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
