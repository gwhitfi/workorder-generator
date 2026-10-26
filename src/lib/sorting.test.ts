import { describe, expect, it } from "vitest";
import {
    contactSortName,
    hrefWithSort,
    parseSort,
    sortHref,
    sortLabels,
    sortRows,
    streetSortKey,
    type SortColumns,
} from "./sorting";

type Row = { id: number; name: string | null; due: Date | null; count: number };

const columns: SortColumns<Row, "name" | "due" | "count"> = {
    name: { value: (row) => row.name },
    due: { value: (row) => row.due, firstDir: "desc" },
    count: { value: (row) => [row.count, row.name], firstDir: "desc" },
};

const ids = (rows: Row[]) => rows.map((row) => row.id);

describe("parseSort", () => {
    it("returns null without a known column", () => {
        expect(parseSort({}, columns)).toBeNull();
        expect(parseSort({ sort: "nope" }, columns)).toBeNull();
        expect(parseSort({ sort: "toString" }, columns)).toBeNull();
        expect(parseSort({ sort: ["name", "due"] }, columns)).toBeNull();
    });

    it("uses the dir when valid", () => {
        expect(parseSort({ sort: "name", dir: "desc" }, columns)).toEqual({ key: "name", dir: "desc" });
        expect(parseSort({ sort: "due", dir: "asc" }, columns)).toEqual({ key: "due", dir: "asc" });
    });

    it("falls back to the column's first direction", () => {
        expect(parseSort({ sort: "name" }, columns)).toEqual({ key: "name", dir: "asc" });
        expect(parseSort({ sort: "due", dir: "sideways" }, columns)).toEqual({ key: "due", dir: "desc" });
    });
});

describe("sortHref", () => {
    it("starts a new column in its first direction", () => {
        expect(sortHref("/x", {}, columns, "name", null)).toBe("/x?sort=name&dir=asc");
        expect(sortHref("/x", {}, columns, "due", { key: "name", dir: "desc" })).toBe("/x?sort=due&dir=desc");
    });

    it("reverses the current column", () => {
        expect(sortHref("/x", {}, columns, "name", { key: "name", dir: "asc" })).toBe("/x?sort=name&dir=desc");
        expect(sortHref("/x", {}, columns, "due", { key: "due", dir: "desc" })).toBe("/x?sort=due&dir=asc");
    });

    it("keeps other params and replaces the old sort", () => {
        const params = { status: "overdue", sort: "name", dir: "asc", tag: ["a", "b"], empty: undefined };
        expect(sortHref("/x", params, columns, "due", { key: "name", dir: "asc" })).toBe(
            "/x?status=overdue&tag=a&tag=b&sort=due&dir=desc",
        );
    });
});

describe("sortLabels", () => {
    it("marks only the sorted column", () => {
        const label = sortLabels("/x", {}, columns, { key: "due", dir: "desc" });
        expect(label("Due", "due")).toEqual({ label: "Due", href: "/x?sort=due&dir=asc", sorted: "desc" });
        expect(label("Name", "name")).toEqual({ label: "Name", href: "/x?sort=name&dir=asc", sorted: null });
    });
});

describe("hrefWithSort", () => {
    it("adds the sort to the other params", () => {
        expect(hrefWithSort("/x", { key: "due", dir: "asc" }, { archived: "1" })).toBe(
            "/x?archived=1&sort=due&dir=asc",
        );
        expect(hrefWithSort("/x", { key: "due", dir: "asc" })).toBe("/x?sort=due&dir=asc");
    });

    it("leaves a bare path without a sort or params", () => {
        expect(hrefWithSort("/x", null)).toBe("/x");
        expect(hrefWithSort("/x", null, { archived: "1" })).toBe("/x?archived=1");
    });
});

describe("sortRows", () => {
    const rows: Row[] = [
        { id: 1, name: "banana", due: new Date("2026-03-01"), count: 2 },
        { id: 2, name: null, due: null, count: 0 },
        { id: 3, name: "Apple", due: new Date("2026-01-15"), count: 2 },
        { id: 4, name: "cherry", due: new Date("2026-02-10"), count: 5 },
        { id: 5, name: "  ", due: null, count: 2 },
    ];

    it("returns the rows unchanged without a sort", () => {
        expect(sortRows(rows, columns, null)).toBe(rows);
    });

    it("sorts text case-insensitively and keeps blanks last in both directions", () => {
        expect(ids(sortRows(rows, columns, { key: "name", dir: "asc" }))).toEqual([3, 1, 4, 2, 5]);
        expect(ids(sortRows(rows, columns, { key: "name", dir: "desc" }))).toEqual([4, 1, 3, 2, 5]);
    });

    it("sorts dates", () => {
        expect(ids(sortRows(rows, columns, { key: "due", dir: "desc" }))).toEqual([1, 4, 3, 2, 5]);
        expect(ids(sortRows(rows, columns, { key: "due", dir: "asc" }))).toEqual([3, 4, 1, 2, 5]);
    });

    it("breaks ties with later values, then keeps the original order", () => {
        expect(ids(sortRows(rows, columns, { key: "count", dir: "desc" }))).toEqual([4, 5, 1, 3, 2]);
        expect(ids(sortRows(rows, columns, { key: "count", dir: "asc" }))).toEqual([2, 3, 1, 5, 4]);
    });

    it("compares numbers inside text as numbers", () => {
        const units = ["Unit 10", "Unit 2", "Unit 1"].map((name, id) => ({ id, name, due: null, count: 0 }));
        const sorted = sortRows(units, columns, { key: "name", dir: "asc" });
        expect(sorted.map((row) => row.name)).toEqual(["Unit 1", "Unit 2", "Unit 10"]);
    });

    it("doesn't change the original array", () => {
        const copy = [...rows];
        sortRows(rows, columns, { key: "name", dir: "asc" });
        expect(rows).toEqual(copy);
    });
});

describe("streetSortKey", () => {
    it("splits the street from the number", () => {
        expect(streetSortKey("1150 Pelham Rd")).toEqual(["Pelham Rd", 1150]);
        expect(streetSortKey("  205 Pelham Rd ")).toEqual(["Pelham Rd", 205]);
        expect(streetSortKey("12B Oak St")).toEqual(["Oak St", 12]);
        expect(streetSortKey("100-4 Main St")).toEqual(["Main St", 100]);
    });

    it("uses the whole line without a leading number", () => {
        expect(streetSortKey("Lot 7, Highway 11")).toEqual(["Lot 7, Highway 11", null]);
        expect(streetSortKey("1150")).toEqual(["1150", null]);
    });

    it("keeps one street together, in number order", () => {
        const lines = ["1150 Pelham Rd", "14 Oak St", "205 Pelham Rd", "12 Oak St"];
        const rows = lines.map((name, id) => ({ id, name, due: null, count: 0 }));
        const byStreet: SortColumns<Row, "address"> = { address: { value: (row) => streetSortKey(row.name ?? "") } };
        const sorted = sortRows(rows, byStreet, { key: "address", dir: "asc" });
        expect(sorted.map((row) => row.name)).toEqual(["12 Oak St", "14 Oak St", "205 Pelham Rd", "1150 Pelham Rd"]);
    });
});

describe("contactSortName", () => {
    it("uses last name, then first name", () => {
        expect(contactSortName({ firstName: "Marcus", lastName: "Hill", displayName: "Marcus Hill" })).toEqual([
            "Hill",
            "Marcus",
        ]);
    });

    it("falls back to the display name without a last name", () => {
        expect(contactSortName({ firstName: null, lastName: null, displayName: "Acme Plumbing" })).toEqual([
            "Acme Plumbing",
            null,
        ]);
        expect(contactSortName({ firstName: "Cher", lastName: " ", displayName: "Cher" })).toEqual(["Cher", null]);
    });
});
