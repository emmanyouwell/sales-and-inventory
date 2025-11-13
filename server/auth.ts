import express, { Request, Response } from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// ✅ Load environment variables early
dotenv.config();

interface VerificationData {
  code: number;
  expiresAt: number;
}

const router = express.Router();
const verificationCodes = new Map<string, VerificationData>();

//  Ensure Gmail credentials are loaded
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error(" Missing Gmail credentials in .env file");
  throw new Error("Missing Gmail credentials in environment variables");
}

// ✅ Configure the transporter with Gmail + debug logging
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
  logger: true, // logs SMTP details in the console
  debug: true,  // enables detailed debugging output
});

// ✅ Verify the transporter connection (optional but very helpful)
transporter.verify((error, success) => {
  if (error) {
    console.error(" Gmail transporter connection failed:", error);
  } else {
    console.log("✅ Gmail transporter ready to send emails");
  }
});

// ✅ Route: Send Verification Code
router.post("/send-code", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000); // 6-digit code
    const expiresAt = Date.now() + 5 * 60 * 1000; // expires in 5 minutes

    verificationCodes.set(email, { code, expiresAt });

    // ✅ Email message
    const mailOptions = {
      from: `"Your App" <${GMAIL_USER}>`,
      to: email,
      subject: "Email Verification Code",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color:#4F46E5;font-size:2em">${code}</h1>
          <p>This code expires in <strong>5 minutes</strong>.</p>
        </div>
      `,
    };

    // ✅ Send email
    await transporter.sendMail(mailOptions);

    console.log(` Verification code ${code} sent to ${email}`);
    res.json({ message: "Verification code sent successfully" });
  } catch (err: any) {
    console.error(" Failed to send email:", err);
    res.status(500).json({ message: "Error sending verification code" });
  }
});

// ✅ Route: Verify Code
router.post("/verify-code", (req: Request, res: Response): void => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400).json({ verified: false, message: "Email and code are required" });
    return;
  }

  const record = verificationCodes.get(email);

  if (!record) {
    res.status(400).json({ verified: false, message: "No code found or expired" });
    return;
  }

  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(email);
    res.status(400).json({ verified: false, message: "Code expired" });
    return;
  }

  if (parseInt(code, 10) === record.code) {
    verificationCodes.delete(email);
    console.log(` ${email} verified successfully`);
    res.json({ verified: true, message: "Email verified successfully" });
  } else {
    console.warn(` Invalid code entered for ${email}`);
    res.status(400).json({ verified: false, message: "Invalid code" });
  }
});

export default router;
