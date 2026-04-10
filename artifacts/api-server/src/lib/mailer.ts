import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendApprovalEmail({
  approverEmail,
  username,
  role,
  token,
  apiBaseUrl,
}: {
  approverEmail: string;
  username: string;
  role: string;
  token: string;
  apiBaseUrl: string;
}) {
  const approveUrl = `${apiBaseUrl}/api/users/approve/${token}`;
  const rejectUrl = `${apiBaseUrl}/api/users/reject/${token}`;

  await resend.emails.send({
    from: "Asset Manager <onboarding@resend.dev>",
    to: approverEmail,
    subject: `User Approval Request: ${username}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">New User Approval Request</h2>
        <p>A new user account has been requested:</p>
        <table style="width:100%; margin: 16px 0;">
          <tr><td><b>Username:</b></td><td>${username}</td></tr>
          <tr><td><b>Role:</b></td><td>${role}</td></tr>
        </table>
        <div style="margin-top: 24px;">
          <a href="${approveUrl}" style="background:#22c55e; color:white; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">
            ✅ Approve
          </a>
          &nbsp;&nbsp;
          <a href="${rejectUrl}" style="background:#ef4444; color:white; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">
            ❌ Reject
          </a>
        </div>
        <p style="margin-top: 24px; color: #888; font-size: 12px;">
          This link will expire once used. If you did not expect this email, please ignore it.
        </p>
      </div>
    `,
  });
}