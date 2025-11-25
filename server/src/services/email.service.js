import { createTransport } from "nodemailer";
import { getEmailConfig } from "../config/env.js";
import { pool } from "../db/pool.js";

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const config = getEmailConfig();
    
    if (!config.enabled) {
      console.log("Email service is disabled");
      return null;
    }

    transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    console.log("Email transporter initialized");
  }

  return transporter;
}

export async function sendAppointmentConfirmation({ patientEmail, patientName, appointmentDate, appointmentTime, doctorName, reason }) {
  const transport = getTransporter();
  
  if (!transport) {
    console.log("Email not sent (service disabled):", { patientEmail, appointmentDate });
    return { success: false, message: "Email service is disabled" };
  }

  try {
    const config = getEmailConfig();
    
    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: patientEmail,
      subject: "Appointment Confirmation",
      html: generateAppointmentEmailHTML({
        patientName,
        appointmentDate,
        appointmentTime,
        doctorName,
        reason,
      }),
      text: generateAppointmentEmailText({
        patientName,
        appointmentDate,
        appointmentTime,
        doctorName,
        reason,
      }),
    };

    const info = await transport.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
}

// Process pending emails from trigger log
export async function processPendingEmails() {
  const transport = getTransporter();
  
  if (!transport) {
    return;
  }

  try {
    // Get pending emails from trigger log
    const [pendingEmails] = await pool.query(
      `SELECT * FROM appointment_email_log 
       WHERE email_sent = FALSE 
       ORDER BY created_at ASC 
       LIMIT 20`
    );

    if (pendingEmails.length > 0) {
      console.log(`Processing ${pendingEmails.length} pending appointment emails`);
    }

    for (const emailLog of pendingEmails) {
      try {
        // Send email
        const result = await sendAppointmentConfirmation({
          patientEmail: emailLog.patient_email,
          patientName: emailLog.patient_name,
          appointmentDate: emailLog.appointment_date,
          appointmentTime: emailLog.appointment_time,
          doctorName: emailLog.doctor_name,
          reason: emailLog.reason,
        });

        if (result.success) {
          // Mark as sent in database
          await pool.query(
            `UPDATE appointment_email_log 
             SET email_sent = TRUE, 
                 email_sent_at = NOW() 
             WHERE log_id = ?`,
            [emailLog.log_id]
          );
          console.log(`✓ Appointment email sent to ${emailLog.patient_email} (Appointment #${emailLog.appointment_id})`);
        } else {
          throw new Error(result.error || result.message);
        }
      } catch (error) {
        console.error(`✗ Failed to send email for log_id ${emailLog.log_id}:`, error.message);
        
        // Log error in database
        await pool.query(
          `UPDATE appointment_email_log 
           SET email_error = ? 
           WHERE log_id = ?`,
          [error.message, emailLog.log_id]
        );
      }
    }
  } catch (error) {
    console.error("Error processing email log:", error);
  }
}

// Start email processor
export function startEmailProcessor() {
  console.log("Starting email processor for appointment confirmations...");
  
  // Process immediately on startup
  processPendingEmails();
  
  // Then process every 10 seconds
  setInterval(() => {
    processPendingEmails();
  }, 10000); // 10 seconds
}

function generateAppointmentEmailHTML({ patientName, appointmentDate, appointmentTime, doctorName, reason }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .appointment-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #4f46e5; }
    .detail-row { margin: 12px 0; display: flex; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: bold; color: #6b7280; min-width: 120px; }
    .detail-value { color: #111827; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="header"><h1 style="margin: 0;">Appointment Confirmed</h1></div>
  <div class="content">
    <p>Dear ${patientName},</p>
    <p>Your appointment has been successfully scheduled. Please find the details below:</p>
    <div class="appointment-details">
      <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${appointmentDate}</span></div>
      <div class="detail-row"><span class="detail-label">Time:</span><span class="detail-value">${appointmentTime}</span></div>
      ${doctorName ? `<div class="detail-row"><span class="detail-label">Provider:</span><span class="detail-value">Dr. ${doctorName}</span></div>` : ""}
      ${reason ? `<div class="detail-row"><span class="detail-label">Reason:</span><span class="detail-value">${reason}</span></div>` : ""}
    </div>
    <p><strong>Important Reminders:</strong></p>
    <ul>
      <li>Please arrive 15 minutes before your scheduled appointment time</li>
      <li>Bring your insurance card and a valid ID</li>
      <li>If you need to reschedule or cancel, please contact us at least 24 hours in advance</li>
    </ul>
    <p>If you have any questions, please don't hesitate to contact our office.</p>
    <p>We look forward to seeing you!</p>
    <p>Best regards,<br><strong>Clinic Staff</strong></p>
  </div>
  <div class="footer"><p>This is an automated message. Please do not reply to this email.</p></div>
</body>
</html>`;
}

function generateAppointmentEmailText({ patientName, appointmentDate, appointmentTime, doctorName, reason }) {
  return `
Appointment Confirmation

Dear ${patientName},

Your appointment has been successfully scheduled. Please find the details below:

Date: ${appointmentDate}
Time: ${appointmentTime}
${doctorName ? `Provider: Dr. ${doctorName}` : ""}
${reason ? `Reason: ${reason}` : ""}

Important Reminders:
- Please arrive 15 minutes before your scheduled appointment time
- Bring your insurance card and a valid ID
- If you need to reschedule or cancel, please contact us at least 24 hours in advance

If you have any questions, please don't hesitate to contact our office.

We look forward to seeing you!

Best regards,
Clinic Staff

---
This is an automated message. Please do not reply to this email.`;
}