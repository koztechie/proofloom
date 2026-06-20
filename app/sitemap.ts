import { MetadataRoute } from "next";
import pool from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://proofloom.vercel.app";

  const { rows: users } = await pool.query(
    `SELECT handle FROM users LIMIT 25000`
  );
  const { rows: challenges } = await pool.query(
    `SELECT id FROM challenges WHERE is_public = true LIMIT 25000`
  );

  const sitemap: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  for (const user of users) {
    sitemap.push({
      url: `${baseUrl}/u/${user.handle}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  for (const challenge of challenges) {
    sitemap.push({
      url: `${baseUrl}/challenge/${challenge.id}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    });
  }

  return sitemap;
}
