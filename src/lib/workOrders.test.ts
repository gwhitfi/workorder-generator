import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatWorkOrderAddress, isOverdue, isWorkOrderFilter, WORK_ORDER_SORTS } from "./workOrders";
import { sortRows } from "./sorting";

describe("WORK_ORDER_SORTS", () => {
    const workOrder = {
        title: "Fix sink",
        status: "SENT" as const,
        dueDate: null,
        contractorName: "Marcus Hill",
        contractor: { firstName: "Marcus", lastName: "Hill" },
        property: { addressLine1: "12 Oak St" },
        unit: null,
    };

    it("sorts statuses in workflow order, not alphabetically", () => {
        const statuses = ["CANCELLED", "CLOSED", "COMPLETED", "DRAFT", "IN_PROGRESS", "SENT"] as const;
        const rows = statuses.map((status) => ({ ...workOrder, status }));
        const sorted = sortRows(rows, WORK_ORDER_SORTS, { key: "status", dir: "asc" });
        expect(sorted.map((row) => row.status)).toEqual([
            "DRAFT",
            "SENT",
            "IN_PROGRESS",
            "COMPLETED",
            "CLOSED",
            "CANCELLED",
        ]);
    });

    it("sorts the property by street, number, then unit", () => {
        expect(WORK_ORDER_SORTS.property.value(workOrder)).toEqual(["Oak St", 12, null]);
        expect(WORK_ORDER_SORTS.property.value({ ...workOrder, unit: { name: "Main", isDefault: true } })).toEqual([
            "Oak St",
            12,
            null,
        ]);
        expect(WORK_ORDER_SORTS.property.value({ ...workOrder, unit: { name: "2B", isDefault: false } })).toEqual([
            "Oak St",
            12,
            "2B",
        ]);
    });

    it("sorts the contractor by last name, falling back to the name on the work order", () => {
        expect(WORK_ORDER_SORTS.contractor.value(workOrder)).toEqual(["Hill", "Marcus"]);
        expect(WORK_ORDER_SORTS.contractor.value({ ...workOrder, contractor: null })).toEqual(["Marcus Hill", null]);
        expect(
            WORK_ORDER_SORTS.contractor.value({
                ...workOrder,
                contractorName: "Acme Plumbing",
                contractor: { firstName: null, lastName: null },
            }),
        ).toEqual(["Acme Plumbing", null]);
    });
});

describe("formatWorkOrderAddress", () => {
    const property = { addressLine1: "12 Oak St", city: "Greenville", state: "SC", zipCode: "29601" };

    it("formats the address without a unit", () => {
        expect(formatWorkOrderAddress(property, null)).toBe("12 Oak St, Greenville, SC 29601");
    });

    it("leaves out the default unit", () => {
        expect(formatWorkOrderAddress(property, { name: "Main", isDefault: true })).toBe(
            "12 Oak St, Greenville, SC 29601",
        );
    });

    it("includes a named unit", () => {
        expect(formatWorkOrderAddress(property, { name: "2B", isDefault: false })).toBe(
            "12 Oak St, Unit 2B, Greenville, SC 29601",
        );
    });
});

describe("isWorkOrderFilter", () => {
    it("accepts every filter key", () => {
        for (const key of ["draft", "active", "completed", "overdue", "closed", "archived"]) {
            expect(isWorkOrderFilter(key)).toBe(true);
        }
    });

    it("rejects unknown keys and non-strings", () => {
        expect(isWorkOrderFilter("open")).toBe(false);
        expect(isWorkOrderFilter("")).toBe(false);
        expect(isWorkOrderFilter(undefined)).toBe(false);
        expect(isWorkOrderFilter(["draft"])).toBe(false);
    });

    it("rejects inherited object keys", () => {
        expect(isWorkOrderFilter("toString")).toBe(false);
        expect(isWorkOrderFilter("constructor")).toBe(false);
    });
});

describe("isOverdue", () => {
    const yesterday = new Date("2026-10-01");
    const today = new Date("2026-10-02");

    beforeEach(() => {
        vi.stubEnv("APP_TIMEZONE", "UTC");
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllEnvs();
    });

    it("is overdue when an open work order was due before today", () => {
        expect(isOverdue({ status: "DRAFT", dueDate: yesterday })).toBe(true);
        expect(isOverdue({ status: "SENT", dueDate: yesterday })).toBe(true);
        expect(isOverdue({ status: "IN_PROGRESS", dueDate: yesterday })).toBe(true);
    });

    it("is not overdue on the due date itself", () => {
        expect(isOverdue({ status: "SENT", dueDate: today })).toBe(false);
    });

    it("is never overdue once completed, closed or cancelled", () => {
        expect(isOverdue({ status: "COMPLETED", dueDate: yesterday })).toBe(false);
        expect(isOverdue({ status: "CLOSED", dueDate: yesterday })).toBe(false);
        expect(isOverdue({ status: "CANCELLED", dueDate: yesterday })).toBe(false);
    });

    it("is not overdue without a due date", () => {
        expect(isOverdue({ status: "SENT", dueDate: null })).toBe(false);
    });
});
