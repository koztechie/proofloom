import { NextResponse } from "next/server";
import pool from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows } = await pool.query("SELECT * FROM notifications");
    return NextResponse.json({ success: true, count: rows.length, rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
