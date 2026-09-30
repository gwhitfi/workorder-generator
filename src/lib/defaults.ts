export const PROPERTY_TYPE_LABELS: Record<string, string> = {
    HOUSE: "House",
    DUPLEX: "Duplex",
    TOWNHOUSE: "Townhouse",
    CONDO: "Condo",
    APARTMENT: "Apartment",
    COMMERCIAL: "Commercial",
    LAND: "Land",
};

export const MULTI_UNIT = ["DUPLEX", "APARTMENT", "CONDO", "TOWNHOUSE", "COMMERCIAL"];

export const CONTACT_TYPE_LABELS: Record<string, string> = {
    CONTRACTOR: "Contractor",
    TENANT: "Tenant",
    OTHER: "Other",
};

export const inputClass =
    "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 " +
    "placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400";

export const labelClass = "block text-sm font-medium text-neutral-300 mb-1";

export const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft",
    SENT: "Sent",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    CLOSED: "Closed",
    CANCELLED: "Cancelled",
};

export const STATUS_COLORS: Record<keyof typeof WORK_ORDER_STATUS_LABELS, string> = {
    DRAFT: "border-neutral-700 text-neutral-400", // Default look
    SENT: "border-amber-700 text-amber-400", // Amber / Orange-tint
    IN_PROGRESS: "border-yellow-600 text-yellow-400", // Yellowish
    COMPLETED: "border-green-700 text-green-400", // Green
    CLOSED: "border-blue-700 text-blue-400", // Blue
    CANCELLED: "border-neutral-700 text-neutral-500 line-through", // Dim: work stopped
};

export const PRIORITY_LABELS: Record<string, string> = {
    EMERGENCY: "Emergency",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
};

export const PRIORITY_STYLES: Record<string, string> = {
    EMERGENCY: "border-red-700 text-red-400",
    HIGH: "border-amber-700 text-amber-400",
};
