import { escapeHtml } from "./shared";
import { formatTimestamp } from "@/lib/dates";

type CompletedEmailInput = {
    organizationName: string;
    contractorName: string | null;
    contractorEmail: string | null;
    title: string | null;
    address: string;
    completedAt: Date;
    completionNotes: string | null;
    areas: {
        name: string;
        lineItems: { description: string; completed: boolean; contractorNotes: string | null }[];
    }[];
    url: string;
};

export function completedEmail(input: CompletedEmailInput) {
    const title = input.title ?? "Work order";
    const who = input.contractorName ?? "The contractor";
    const date = formatTimestamp(input.completedAt);

    const items = input.areas.flatMap((area) => area.lineItems.map((item) => ({ area: area.name, ...item })));
    const doneCount = items.filter((i) => i.completed).length;
    const unchecked = items.filter((i) => !i.completed);
    const withNotes = items.filter((i) => i.contractorNotes);

    const subject = `Completed: ${title} — ${input.address}`;
    const summary = `${who} marked this work order complete on ${date}.`;
    const progress = `${doneCount} of ${items.length} ${items.length === 1 ? "item" : "items"} done`;

    const text = [
        summary,
        "",
        title,
        input.address,
        progress,
        unchecked.length
            ? `\nNot checked off:\n${unchecked.map((i) => `- ${i.area}: ${i.description}`).join("\n")}`
            : null,
        `\nCompletion notes:\n${input.completionNotes ?? "None"}`,
        withNotes.length
            ? `\nContractor notes:\n${withNotes.map((i) => `- ${i.area}: ${i.description}\n  ${i.contractorNotes}`).join("\n")}`
            : null,
        "",
        `Review the work order:`,
        input.url,
    ]
        .filter((line) => line !== null)
        .join("\n");

    const label = (value: string) =>
        `<p style="margin:16px 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#737373">${value}</p>`;

    const list = (rows: string[]) =>
        `<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.5;color:#171717">${rows.join("")}</ul>`;

    const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;border:1px solid #e5e5e5">
        <tr><td style="padding:24px 24px 8px">
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:#15803d">Completed</p>
          <h1 style="margin:0 0 4px;font-size:20px;color:#171717">${escapeHtml(title)}</h1>
          <p style="margin:0;font-size:14px;color:#525252">${escapeHtml(input.address)}</p>
        </td></tr>
        <tr><td style="padding:16px 24px">
          <p style="margin:0;font-size:14px;color:#171717">${escapeHtml(summary)}</p>
          <p style="margin:4px 0 0;font-size:14px;color:#525252">${escapeHtml(progress)}</p>
          ${
              unchecked.length
                  ? `${label("Not checked off")}${list(
                        unchecked.map(
                            (i) => `<li style="color:#b45309">${escapeHtml(i.area)}: ${escapeHtml(i.description)}</li>`,
                        ),
                    )}`
                  : ""
          }
          ${label("Completion notes")}
          <p style="margin:0;font-size:14px;line-height:1.5;color:#171717;white-space:pre-line">${
              input.completionNotes ? escapeHtml(input.completionNotes) : '<span style="color:#737373">None</span>'
          }</p>
          ${
              withNotes.length
                  ? `${label("Contractor notes")}${list(
                        withNotes.map(
                            (i) =>
                                `<li style="margin-bottom:6px">${escapeHtml(i.area)}: ${escapeHtml(i.description)}` +
                                `<br><span style="color:#525252;white-space:pre-line">${escapeHtml(i.contractorNotes ?? "")}</span></li>`,
                        ),
                    )}`
                  : ""
          }
        </td></tr>
        <tr><td style="padding:8px 24px 24px">
          <a href="${escapeHtml(input.url)}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:6px">Review work order</a>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #e5e5e5;font-size:12px;color:#737373">
          Sent by ${escapeHtml(input.organizationName)}'s work order system.${
              input.contractorEmail ? " Reply to this email to reach the contractor." : ""
          }
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    return { subject, html, text };
}
