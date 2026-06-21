import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, requireRole, requireOwnership, UnauthorizedError, ForbiddenError } from "@/lib/auth/guards";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import * as navigation from "next/navigation";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireAuth", () => {
    it("should throw UnauthorizedError and redirect if no session", async () => {
      (auth as any).mockResolvedValueOnce(null);

      await expect(requireAuth()).rejects.toThrow(UnauthorizedError);
      expect(navigation.redirect).toHaveBeenCalledWith("/auth/login");
    });

    it("should return user if session is valid", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "123", handle: "tester", email: "test@ex.com", role: "USER", isActive: true }
      });

      const user = await requireAuth();
      expect(user.id).toBe("123");
      expect(user.handle).toBe("tester");
    });

    it("should throw if user is inactive", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "123", handle: "tester", isActive: false }
      });

      await expect(requireAuth()).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("requireRole", () => {
    it("should throw ForbiddenError if user role is insufficient", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "123", handle: "tester", role: "USER", isActive: true }
      });

      await expect(requireRole(Role.ADMIN)).rejects.toThrow(ForbiddenError);
    });

    it("should allow if user role is sufficient", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "123", handle: "tester", role: "ADMIN", isActive: true }
      });

      const user = await requireRole(Role.MODERATOR);
      expect(user.role).toBe("ADMIN");
    });
  });

  describe("requireOwnership", () => {
    it("should allow if user is owner", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "user_1", handle: "tester", role: "USER", isActive: true }
      });

      const user = await requireOwnership("user_1");
      expect(user.id).toBe("user_1");
    });

    it("should allow if user is admin but not owner", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "admin_1", handle: "admin", role: "ADMIN", isActive: true }
      });

      const user = await requireOwnership("user_1");
      expect(user.id).toBe("admin_1");
    });

    it("should throw ForbiddenError if not owner and not admin", async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: "user_2", handle: "tester2", role: "USER", isActive: true }
      });

      await expect(requireOwnership("user_1")).rejects.toThrow(ForbiddenError);
    });
  });
});
