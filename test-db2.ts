import pool from "./lib/db/client";

async function test() {
  try {
    const { rows } = await pool.query("SELECT * FROM notifications;");
    console.log("Notifications count:", rows.length);
    console.log("Notifications:", JSON.stringify(rows, null, 2));

    // Also check weekly reports
    const { rows: reports } = await pool.query("SELECT * FROM weekly_reports;");
    console.log("Weekly reports count:", reports.length);

  } catch(e: any) {
    console.error("Error:", e.message);
  }
  process.exit();
}
test();
