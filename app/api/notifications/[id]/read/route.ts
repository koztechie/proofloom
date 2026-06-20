import { NextRequest } from "next/server";
import { withApiErrorHandler } from "@/app/api/error-handler";
import { successResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { UnauthorizedApiError } from "@/lib/api/errors";
import { markAsRead } from "@/lib/notifications/in-app";

export const POST = withApiErrorHandler(
  async (
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
    requestId
  ) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new UnauthorizedApiError(
        "You must be logged in to update notifications."
      );
    }

    const { id } = await ctx.params;

    await markAsRead(id, session.user.id);

    return successResponse(
      { success: true },
      "Notification marked as read.",
      200,
      requestId
    );
  }
);
