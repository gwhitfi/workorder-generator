export const DEFAULT_SPACES = [
    "Entire Property",
    "Inside",
    "Outside",
    "Kitchen",
    "Living Room",
    "Master Bedroom",
    "Downstairs Bedroom",
    "Upstairs Bedroom",
    "Master Bathroom",
    "Downstairs Bathroom",
    "Upstairs Bathroom",
    "Hallway",
    "Closet",
    "Yard",
    "Dining Room",
    "Garage",
    "Laundry Room",
    "Stairway",
    "Porch",
    "Attic",
    "Crawlspace",
    "Deck",
    "Patio",
    "Basement",
    "Den",
    "Flower Bed",
    "Bonus Room",
    "Mud Room",
    "Outbuilding",
    "Sunroom",
    "Pool",
    "Dock",
];

export const DEFAULT_TAGS = [
    "Electrical",
    "Plumbing",
    "HVAC",
    "Flooring",
    "Painting",
    "Drywall Repair",
    "Cleaning",
    "Insulation",
    "Appliance",
    "Siding",
    "Fascia",
    "Trim/Molding",
    "Roofing",
    "Landscaping",
    "Pest Control",
    "General",
    "Decorating",
    "Staging",
    "Window",
    "Door",
    "Driveway",
    "Walkway",
    "Fencing",
    "Mailbox",
    "Cabinets",
    "Countertops",
];

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
