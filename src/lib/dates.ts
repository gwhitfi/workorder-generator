// Server-side date formatting. Uses a fixed locale so output is identical wherever it runs.

const LOCALE = "en-US";
const DATE_STYLE: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

let warnedMissingTimeZone = false;

export function appTimeZone() {
    const timeZone = process.env.APP_TIMEZONE;
    if (!timeZone) {
        if (!warnedMissingTimeZone) {
            console.warn("APP_TIMEZONE is not set; formatting dates in UTC");
            warnedMissingTimeZone = true;
        }
        return "UTC";
    }
    return timeZone;
}

// Due dates are calendar dates stored at UTC midnight (from <input type="date">), so always format them in UTC.
export function formatDueDate(date: Date, options: { weekday?: boolean } = {}) {
    return date.toLocaleDateString(LOCALE, {
        ...DATE_STYLE,
        ...(options.weekday ? { weekday: "short" } : {}),
        timeZone: "UTC",
    });
}

// Real moments in time (completedAt, closedAt) are shown in the app's time zone, not the server's.
export function formatTimestamp(date: Date) {
    return date.toLocaleDateString(LOCALE, { ...DATE_STYLE, timeZone: appTimeZone() });
}

// Today's calendar date in the app's time zone, as UTC midnight so it compares directly with due dates.
export function todayInAppTimeZone() {
    // en-CA formats as YYYY-MM-DD, which Date parses as UTC midnight.
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: appTimeZone() }).format(new Date());
    return new Date(today);
}
