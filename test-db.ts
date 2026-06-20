import pool from "./lib/db/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
async function test() {
  try {
    const res = await pool.query("SELECT * FROM notifications;");
    console.log("Table exists! Rows:", res.rowCount);
  } catch(e: any) {
    console.error("Error:", e.message);
  }
  process.exit();
}
test();
