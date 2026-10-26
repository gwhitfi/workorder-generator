// Sorting for the list pages. The sort lives in the URL (?sort=due&dir=desc), and rows are sorted
// in code after the query because the lists aren't paginated.

export type SortDir = "asc" | "desc";
export type SortState<K extends string> = { key: K; dir: SortDir };
export type SearchParams = Record<string, string | string[] | undefined>;

type SortValue = string | number | Date | null | undefined;

export type SortColumn<T> = {
    // Rows sort by the first value; any later values break ties.
    value: (row: T) => SortValue | SortValue[];
    // The direction of the first click. Defaults to "asc".
    firstDir?: SortDir;
};

export type SortColumns<T, K extends string> = Record<K, SortColumn<T>>;

type ColumnDirs<K extends string> = Record<K, { firstDir?: SortDir }>;

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function isBlank(value: SortValue): boolean {
    return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function compareValues(a: SortValue, b: SortValue): number {
    if (isBlank(a) || isBlank(b)) return Number(isBlank(a)) - Number(isBlank(b));
    if (typeof a === "string" && typeof b === "string") return collator.compare(a.trim(), b.trim());
    return Number(a) - Number(b);
}

// Reads ?sort and ?dir. Unknown columns mean no sort; a missing or unknown dir uses the column's first direction.
export function parseSort<K extends string>(params: SearchParams, columns: ColumnDirs<K>): SortState<K> | null {
    const { sort, dir } = params;
    if (typeof sort !== "string" || !Object.hasOwn(columns, sort)) return null;
    const key = sort as K;
    return { key, dir: dir === "asc" || dir === "desc" ? dir : (columns[key].firstDir ?? "asc") };
}

// The link for a column header: the column's first direction, or the reverse if the list is already sorted by it.
// Other query params (filters, archived) are kept.
export function sortHref<K extends string>(
    path: string,
    params: SearchParams,
    columns: ColumnDirs<K>,
    key: K,
    current: SortState<K> | null,
): string {
    const dir = current?.key === key ? (current.dir === "asc" ? "desc" : "asc") : (columns[key].firstDir ?? "asc");
    const query = new URLSearchParams();
    for (const [name, value] of Object.entries(params)) {
        if (name === "sort" || name === "dir" || value === undefined) continue;
        for (const item of Array.isArray(value) ? value : [value]) query.append(name, item);
    }
    query.set("sort", key);
    query.set("dir", dir);
    return `${path}?${query}`;
}

// A column header for ListHeader. `sorted` is the current direction if the list is sorted by this column.
export type SortLabel = { label: string; href: string; sorted: SortDir | null };

// Returns a function that builds the sortable header labels for one list.
export function sortLabels<K extends string>(
    path: string,
    params: SearchParams,
    columns: ColumnDirs<K>,
    current: SortState<NoInfer<K>> | null,
): (label: string, key: K) => SortLabel {
    return (label, key) => ({
        label,
        href: sortHref(path, params, columns, key, current),
        sorted: current?.key === key ? current.dir : null,
    });
}

// A link that keeps the current sort, for filters and toggles such as "Show archived".
export function hrefWithSort<K extends string>(
    path: string,
    sort: SortState<K> | null,
    params: Record<string, string> = {},
): string {
    const query = new URLSearchParams(params);
    if (sort) {
        query.set("sort", sort.key);
        query.set("dir", sort.dir);
    }
    const search = query.toString();
    return search ? `${path}?${search}` : path;
}

// Returns the rows sorted by the chosen column, or unchanged without a sort. Rows with a blank value go last
// in both directions, and ties keep their original order.
export function sortRows<T, K extends string>(rows: T[], columns: SortColumns<T, K>, sort: SortState<K> | null): T[] {
    if (!sort) return rows;
    const sign = sort.dir === "asc" ? 1 : -1;
    const keyed = rows.map((row) => {
        const value = columns[sort.key].value(row);
        return { row, values: Array.isArray(value) ? value : [value] };
    });

    keyed.sort((a, b) => {
        const blank = Number(isBlank(a.values[0])) - Number(isBlank(b.values[0]));
        if (blank !== 0) return blank;
        for (let i = 0; i < Math.max(a.values.length, b.values.length); i++) {
            const result = compareValues(a.values[i], b.values[i]);
            if (result !== 0) return result * sign;
        }
        return 0;
    });

    return keyed.map((item) => item.row);
}

// "1150 Pelham Rd" sorts as street "Pelham Rd", then number 1150, so buildings on one street stay together.
// Lines without a leading number sort by the whole line.
export function streetSortKey(addressLine: string): [string, number | null] {
    const match = addressLine.trim().match(/^(\d+)\S*\s+(.+)$/);
    if (!match) return [addressLine, null];
    return [match[2], Number(match[1])];
}

// Last name, then first name. Contacts without a last name (such as a company) sort by their display name.
export function contactSortName(contact: {
    firstName: string | null;
    lastName: string | null;
    displayName: string;
}): [string, string | null] {
    return contact.lastName?.trim() ? [contact.lastName, contact.firstName] : [contact.displayName, null];
}
