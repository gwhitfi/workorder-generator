import { describe, expect, it } from "vitest";
import { escapeHtml } from "./shared";

describe("escapeHtml", () => {
    it("escapes HTML special characters", () => {
        expect(escapeHtml(`<a href="x">Tom's & Co</a>`)).toBe(
            "&lt;a href=&quot;x&quot;&gt;Tom&#39;s &amp; Co&lt;/a&gt;",
        );
    });

    it("leaves plain text unchanged", () => {
        expect(escapeHtml("Fix the leaking toilet")).toBe("Fix the leaking toilet");
    });

    it("escapes existing entities instead of passing them through", () => {
        expect(escapeHtml("&lt;script&gt;")).toBe("&amp;lt;script&amp;gt;");
    });
});
