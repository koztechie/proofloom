import { NextResponse } from "next/server";
import pool from "@/lib/db/client";
import bcrypt from "bcryptjs";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "@/lib/dynamo/client";

export const dynamic = "force-dynamic";

const PROOFS_DATA = [
  {
    daysAgo: 8,
    score: 85,
    text: "Completed Task 1: Basic database setup and initialization. Configured PostgreSQL instance, set up pgAdmin, and executed foundational CREATE TABLE scripts for users and orders.",
    comment:
      "Solid foundational work. Environment is ready for complex queries.",
  },
  {
    daysAgo: 7,
    score: 82,
    text: "Completed Task 2: Data population and basic querying. Wrote INSERT scripts for 1000 mock records. Executed simple SELECT, WHERE, and ORDER BY queries to verify data integrity.",
    comment:
      "Good data generation practices. Queries show basic operational understanding.",
  },
  {
    daysAgo: 6,
    score: 88,
    text: "Completed Task 3: wrote 3 SQL queries using JOIN, GROUP BY with HAVING, and NOT EXISTS pattern. Query 1 joined orders and customers tables to find top buyers. Query 2 aggregated sales by region. Query 3 found products never ordered using NOT EXISTS subquery.",
    comment:
      "Strong evidence of practical SQL work with specific query patterns mentioned. Code-level detail confirms actual implementation rather than description.",
  },
  {
    daysAgo: 5,
    score: 90,
    text: "Completed Task 4: Implemented subqueries and verified execution plans using EXPLAIN ANALYZE on Aurora PostgreSQL. Found a missing index on the orders table.",
    comment:
      "Great use of performance profiling tools to identify bottlenecks.",
  },
  {
    daysAgo: 4,
    score: 88,
    text: "Completed Task 5: Configured transaction isolation levels and tested concurrent writes to prevent race conditions during order placement.",
    comment: "Strong understanding of ACID properties and concurrency control.",
  },
  {
    daysAgo: 3,
    score: 85,
    text: "Completed Task 6: Created database triggers to automatically archive deleted challenges for audit purposes. Tested trigger execution on DELETE cascades.",
    comment:
      "Practical implementation of database automation and audit trails.",
  },
  {
    daysAgo: 2,
    score: 94,
    text: "Completed Task 7: Wrote optimized recursive CTE queries to traverse hierarchical skill trees in our challenges database.",
    comment:
      "Outstanding work with CTEs. Very high technical complexity shown.",
  },
  {
    daysAgo: 1,
    score: 89,
    text: "Completed Task 8: Implemented full-text search indexing on challenge titles to enable fast client-side autocomplete. Verified index usage.",
    comment:
      "Excellent feature addition. Indexes are properly configured for text search.",
  },
  {
    daysAgo: 0,
    score: 95,
    text: "Completed Task 9: Finalized PostgreSQL pool configuration with SSL mode and benchmarked connection limits under load using pgbench.",
    comment: "Perfect database scaling and security practices demonstrated.",
  },
];

export async function GET() {
  try {
    // 1. Створюємо користувача koztechie
    const handle = "koztechie";
    const email = "koztechie@tuta.io";
    const passwordHash = await bcrypt.hash("StrongPass123", 10);

    const userInsertQuery = `
      INSERT INTO users (handle, email, password_hash, display_name, bio)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (handle) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id;
    `;
    const userResult = await pool.query(userInsertQuery, [
      handle,
      email,
      passwordHash,
      "Євгеній Козловський",
      "Kyiv-based webmaster & e-commerce ecosystem architect. Building ProofLoom for H0 Hackathon.",
    ]);
    const userId = userResult.rows[0].id;

    // 2. Створюємо челендж "SQL Mastery — 30 Days"
    const challengeInsertQuery = `
      INSERT INTO challenges (user_id, title, skill_category, target_days)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
      RETURNING id;
    `;
    const challengeResult = await pool.query(challengeInsertQuery, [
      userId,
      "SQL Mastery — 30 Days",
      "SQL",
      30,
    ]);

    let challengeId = challengeResult.rows[0]?.id;
    if (!challengeId) {
      const existingChallenge = await pool.query(
        "SELECT id FROM challenges WHERE user_id = $1 AND title = $2 LIMIT 1;",
        [userId, "SQL Mastery — 30 Days"],
      );
      challengeId = existingChallenge.rows[0].id;
    }

    // 3. Записуємо 9 послідовних звітів у DynamoDB
    const now = new Date();
    for (const p of PROOFS_DATA) {
      const proofDate = new Date();
      proofDate.setDate(now.getDate() - p.daysAgo);
      const dateStr = proofDate.toISOString().split("T")[0];

      await docClient.send(
        new PutCommand({
          TableName: "StreakProofs",
          Item: {
            pk: `USER#${handle}`,
            sk: `PROOF#${dateStr}`,
            challenge_id: challengeId,
            proof_text: p.text,
            proof_url: "https://github.com/koztechie/proofloom",
            streak_day: 9 - p.daysAgo,
            ai_score: p.score,
            ai_comment: p.comment,
            submitted_at: proofDate.toISOString(),
          },
        }),
      );
    }

    // 4. Оновлюємо лідерборд
    const totalScore = PROOFS_DATA.reduce((sum, p) => sum + p.score, 0);
    await docClient.send(
      new PutCommand({
        TableName: "StreakProofs",
        Item: {
          pk: "LEADERBOARD",
          sk: `SCORE#${handle}#SQL`,
          handle,
          category: "SQL",
          total_score: totalScore,
        },
      }),
    );

    return NextResponse.json({
      success: true,
      message: `Database successfully seeded for ${handle}! Created SQL challenge and generated ${PROOFS_DATA.length}-day unbroken streak.`,
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
