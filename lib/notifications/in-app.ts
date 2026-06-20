import pool from "@/lib/db/client";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  priority?: "low" | "normal" | "high";
}) {
  const { userId, type, title, message, link, priority = "normal" } = params;

  await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, link, priority)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, type, title, message, link || null, priority]
  );
}

export async function getUnreadNotifications(userId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1 AND is_read = false
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function markAsRead(notificationId: string, userId: string) {
  await pool.query(
    `UPDATE notifications
     SET is_read = true
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
}
