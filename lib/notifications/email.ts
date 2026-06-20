import nodemailer from "nodemailer";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const { to, subject, html, text } = params;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    // Fallback if no SMTP is configured
    console.log(`\n================= EMAIL MOCK =================`);
    console.log(`To: ${to}\nSubject: ${subject}\nText:\n${text}`);
    console.log(`HTML:\n${html}`);
    console.log(`==============================================\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort || 587,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"ProofLoom" <noreply@proofloom.vercel.app>',
    to,
    subject,
    text,
    html,
  });
}

export function welcomeEmail(user: { display_name: string | null; handle: string }) {
  const name = user.display_name || user.handle;
  return {
    subject: "Welcome to ProofLoom!",
    text: `Hi ${name},\nWelcome to ProofLoom! We are excited to see what skills you build. Start your first challenge today!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Welcome to ProofLoom, ${name}!</h2>
        <p>We are excited to see what skills you build.</p>
        <p>Start your first challenge today and build your verifiable track record.</p>
      </div>
    `,
  };
}

export function streakReminder(user: { email: string; handle: string; display_name: string | null }, challenge: { title: string }) {
  const name = user.display_name || user.handle;
  return {
    subject: "Your streak is about to break! 🔥",
    text: `Hi ${name},\nYour streak for "${challenge.title}" is 24 hours away from breaking. Submit your proof now to keep it alive!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
        <h2 style="color: #ef4444;">Keep your streak alive! 🔥</h2>
        <p>Hi ${name},</p>
        <p>Your streak for the challenge <strong>"${challenge.title}"</strong> is less than 24 hours away from breaking.</p>
        <p>Submit your proof for today to keep your momentum going.</p>
        <a href="https://proofloom.vercel.app" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px;">Submit Proof Now</a>
      </div>
    `,
  };
}

export function weeklyReportReady(user: { email: string; handle: string; display_name: string | null }, report: any) {
  const name = user.display_name || user.handle;
  return {
    subject: "Your Weekly AI Coach Report is Ready 📊",
    text: `Hi ${name},\nYour weekly AI Coach report is ready. Check out your progress and personalized feedback on your profile!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
        <h2 style="color: #10b981;">Your Weekly AI Coach Report is Ready! 📊</h2>
        <p>Hi ${name},</p>
        <p>We've analyzed your progress over the past week. Here's a quick summary:</p>
        <blockquote style="border-left: 4px solid #10b981; padding-left: 10px; color: #3f3f46;">
          ${report.aiSummary || "Check your profile for full details."}
        </blockquote>
        <p>Visit your profile to see your strengths, areas for improvement, and actionable recommendations.</p>
        <a href="https://proofloom.vercel.app/u/${user.handle}" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px;">View Report</a>
      </div>
    `,
  };
}
