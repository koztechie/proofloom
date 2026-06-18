/**
 * app/api/admin/route.ts
 *
 * Placeholder admin API route group. Every handler in this file (and
 * sub-directories) is protected by `requireRole(Role.ADMIN)`.
 *
 * Extend this with real admin operations (e.g. ban users, purge content)
 * as the product grows.
 */

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { Role } from "@/lib/auth/roles";

export async function GET() {
  try {
    const admin = await requireRole(Role.ADMIN);

    return NextResponse.json({
      ok: true,
      message: "Admin API is operational.",
      adminId: admin.id,
    });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };

    const status = error.statusCode ?? 500;
    return NextResponse.json(
      { ok: false, error: error.message ?? "Internal server error." },
      { status },
    );
  }
}
