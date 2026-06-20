import { NextRequest } from "next/server";
import { withApiErrorHandler } from "@/app/api/error-handler";
import { successResponse } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { UnauthorizedApiError } from "@/lib/api/errors";
import { getUnreadNotifications } from "@/lib/notifications/in-app";

export const dynamic = "force-dynamic";

export const GET = withApiErrorHandler(
  async (req: NextRequest, _ctx, requestId) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new UnauthorizedApiError(
        "You must be logged in to view notifications."
      );
    }

    const notifications = await getUnreadNotifications(session.user.id);
    
    console.log("NOTIFICATIONS API DEBUG: userId =", session.user.id, "found count =", notifications.length);

    return successResponse(
      { notifications, debug_userId: session.user.id, debug_count: notifications.length },
      undefined,
      200,
      requestId
    );
  }
);
