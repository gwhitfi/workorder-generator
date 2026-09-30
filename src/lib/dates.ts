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

export function formatDueDate(date: Date, options: { weekday?: boolean } = {}) {
    return date.toLocaleDateString(LOCALE, {
        ...DATE_STYLE,
        ...(options.weekday ? { weekday: "short" } : {}),
        timeZone: "UTC",
    });
}

export function formatTimestamp(date: Date) {
    return date.toLocaleDateString(LOCALE, { ...DATE_STYLE, timeZone: appTimeZone() });
}

export function todayInAppTimeZone() {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: appTimeZone() }).format(new Date());
    return new Date(today);
}
