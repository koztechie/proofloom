import { NextResponse } from "next/server";
import pool from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows } = await pool.query("SELECT id, handle, email FROM users");
    return NextResponse.json({ success: true, users: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
