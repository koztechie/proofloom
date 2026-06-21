import { NextResponse } from "next/server";
import pool from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { rows } = await pool.query("SELECT id, handle, email FROM users");
    return NextResponse.json({ success: true, users: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
