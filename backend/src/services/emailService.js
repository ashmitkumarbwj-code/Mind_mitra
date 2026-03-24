import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter;
let isSandboxMode = true;

const setupTransporter = async () => {
    try {
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            // Production Branch: Real outbound email transmission
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: parseInt(process.env.SMTP_PORT) === 465, 
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
            isSandboxMode = false;
            console.log("[EMAIL SERVICE] Production SMTP Router Ready.");
        } else {
            // Development Branch: Silent Ethereal Sandbox fallback
            let testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false, 
                auth: {
                    user: testAccount.user, 
                    pass: testAccount.pass, 
                },
            });
            console.log("[EMAIL SERVICE] Nodemailer Sandbox Active (Keys not found).");
        }
    } catch (err) {
        console.error("[EMAIL SERVICE] Critical Failure initializing transporter:", err);
    }
};

setupTransporter();

export const sendProactiveEmail = async (user, type) => {
    if (!transporter) {
        console.warn("[EMAIL SERVICE] Transporter not ready yet, skipping email for:", user.email || user.id);
        return;
    }

    try {
        let subject = "";
        let htmlBody = "";

        if (type === '24_HOUR_REMINDER') {
            subject = "Hey, just checking in on you 💙";
            htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; border-radius: 12px; background: #0f172a; color: #f8fafc; border: 1px solid #334155;">
                <h2 style="color: #a5b4fc;">Hey ${user.email ? user.email.split('@')[0] : 'there'},</h2>
                <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                    We noticed you haven't checked in with <b>MindMitra</b> in over 24 hours. College can be overwhelming, and it's easy to forget to take a breath.
                </p>
                <div style="background: rgba(139, 92, 246, 0.1); border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #e2e8f0; font-size: 15px;">
                        💡 <b>Quick reminder:</b> Drink a glass of water, drop your shoulders, and take one deep breath right now.
                    </p>
                </div>
                <p style="color: #cbd5e1; font-size: 16px;">
                    Whenever you're ready to talk, I'm here to listen. No pressure, just support.
                </p>
                <a href="http://localhost:5173/checkin" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">
                    Check-In Now
                </a>
            </div>
            `;
        } else if (type === 'INACTIVITY_ESCALATION') {
            subject = "⚠️ MindMitra Welfare Escalation";
            htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; border-radius: 12px; background: #0f172a; color: #f8fafc; border: 1px solid #7f1d1d;">
                <h2 style="color: #f87171;">Urgent Welfare Concern</h2>
                <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                    The user associated with <b>${user.email || user.id}</b> has been completely inactive for over 15 days following a period of activity.
                </p>
                <p style="color: #cbd5e1; font-size: 16px;">
                    This is an automated system escalation to their emergency contact (${user.emergency_contact_phone}). Please reach out to them personally to ensure their safety.
                </p>
                <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #334155; font-size: 12px; color: #64748b;">
                    Sent automatically by the MindMitra Clinical Proactive System.
                </div>
            </div>
            `;
        }

        // Send mail with defined transport object
        let info = await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL || '"MindMitra Proactive AI" <support@mindmitra.edu>',
            to: user.email || "anonymous_student@mindmitra.edu",
            subject: subject,
            html: htmlBody,
        });

        console.log("-----------------------------------------");
        console.log(`✉️ [EMAIL SENT] | Type: ${type} | To: ${user.email || user.id}`);
        if (isSandboxMode) {
            console.log(`🔗 Preview Sandbox URL: ${nodemailer.getTestMessageUrl(info)}`);
        } else {
            console.log(`✅ Message Handed Off to Production Carrier: ${info.messageId}`);
        }
        console.log("-----------------------------------------");
        
    } catch (err) {
        console.error("[EMAIL SERVICE ERROR]", err);
    }
};
