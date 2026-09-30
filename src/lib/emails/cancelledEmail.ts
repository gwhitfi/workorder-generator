import { escapeHtml } from "./shared";

type CancelledEmailInput = {
    organization: { name: string; phone: string | null; email: string | null };
    title: string | null;
    jobNumber: string;
    address: string;
};

export function cancelledEmail(input: CancelledEmailInput) {
    const title = input.title ?? "Work order";
    const org = input.organization;
    const contact = [org.phone, org.email].filter(Boolean) as string[];

    const subject = `Cancelled #${input.jobNumber}: ${title} — ${input.address}`;
    const summary = `${org.name} has cancelled this work order. No further work is needed, and the link you received no longer works.`;

    const text = [
        summary,
        "",
        title,
        input.address,
        "",
        contact.length ? `Questions? Contact ${org.name}: ${contact.join(" · ")}` : null,
    ]
        .filter((line) => line !== null)
        .join("\n");

    const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;border:1px solid #e5e5e5">
        <tr><td style="padding:24px 24px 8px">
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:#b91c1c">Cancelled</p>
          <h1 style="margin:0 0 4px;font-size:20px;color:#171717">${escapeHtml(title)}</h1>
          <p style="margin:0;font-size:14px;color:#525252">${escapeHtml(input.address)}</p>
        </td></tr>
        <tr><td style="padding:16px 24px 24px">
          <p style="margin:0;font-size:14px;line-height:1.5;color:#171717">${escapeHtml(summary)}</p>
        </td></tr>
        ${
            contact.length
                ? `<tr><td style="padding:16px 24px;border-top:1px solid #e5e5e5;font-size:12px;color:#737373">
          Questions? Contact ${escapeHtml(org.name)}: ${contact.map(escapeHtml).join(" · ")}
        </td></tr>`
                : ""
        }
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    return { subject, html, text };
}
