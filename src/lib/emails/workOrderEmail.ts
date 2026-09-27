type WorkOrderEmailInput = {
    organization: { name: string; phone: string | null; email: string | null };
    title: string | null;
    address: string;
    dueDate: Date | null;
    notes: string | null;
    itemCount: number;
    url: string;
    isResend: boolean;
};

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Due dates are stored at UTC midnight, so format in UTC to avoid showing the day before.
function formatDueDate(date: Date) {
    return date.toLocaleDateString("en-US", {
        timeZone: "UTC",
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function workOrderEmail(input: WorkOrderEmailInput) {
    const title = input.title ?? "Work order";
    const org = input.organization;
    const due = input.dueDate ? formatDueDate(input.dueDate) : null;
    const items = `${input.itemCount} ${input.itemCount === 1 ? "item" : "items"}`;
    const contact = [org.phone, org.email].filter(Boolean) as string[];

    const subject = `${input.isResend ? "Reminder" : "New work order"}: ${title} — ${input.address}`;

    const text = [
        `${org.name} sent you a work order.`,
        "",
        title,
        input.address,
        due ? `Due: ${due}` : null,
        `Work items: ${items}`,
        input.notes ? `\nNotes:\n${input.notes}` : null,
        "",
        `View the work order and check off items as you go:`,
        input.url,
        "",
        contact.length ? `Questions? Contact ${org.name}: ${contact.join(" · ")}` : null,
    ]
        .filter((line) => line !== null)
        .join("\n");

    const row = (label: string, value: string) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#737373;white-space:nowrap;vertical-align:top">${label}</td>` +
        `<td style="padding:4px 0;color:#171717">${value}</td></tr>`;

    const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;border:1px solid #e5e5e5">
        <tr><td style="padding:24px 24px 8px">
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:#737373">${escapeHtml(org.name)}</p>
          <h1 style="margin:0 0 4px;font-size:20px;color:#171717">${escapeHtml(title)}</h1>
          <p style="margin:0;font-size:14px;color:#525252">${escapeHtml(input.address)}</p>
        </td></tr>
        <tr><td style="padding:16px 24px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">
            ${due ? row("Due", escapeHtml(due)) : ""}
            ${row("Work items", escapeHtml(items))}
          </table>
          ${
              input.notes
                  ? `<p style="margin:16px 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#737373">Notes</p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#171717;white-space:pre-line">${escapeHtml(input.notes)}</p>`
                  : ""
          }
        </td></tr>
        <tr><td style="padding:8px 24px 24px">
          <a href="${escapeHtml(input.url)}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:6px">View work order</a>
          <p style="margin:12px 0 0;font-size:12px;color:#737373">Or open this link: <a href="${escapeHtml(input.url)}" style="color:#525252;word-break:break-all">${escapeHtml(input.url)}</a></p>
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
