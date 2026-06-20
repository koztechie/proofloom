import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();

  // Basic admin check - adjust according to exact auth structure if requireRole isn't universally exported
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Path parameter is required" },
      { status: 400 },
    );
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path, now: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: "Error revalidating path" },
      { status: 500 },
    );
  }
}
