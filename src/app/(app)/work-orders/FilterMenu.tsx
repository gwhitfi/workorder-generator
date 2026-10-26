"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export type FilterOption = { label: string; href: string; active: boolean };

// The work order filters, folded into one button that shows the active filter. Opens on hover with a mouse,
// and on click or tap otherwise. Closes on picking a filter, clicking outside, Escape, or tabbing away.
export default function FilterMenu({ options }: { options: FilterOption[] }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    // A hover already opened it, so the click that usually follows shouldn't close it again.
    const openedByHover = useRef(false);
    const menuId = useId();

    const current = options.find((option) => option.active) ?? options[0];
    const filtered = current !== options[0];

    useEffect(() => {
        if (!open) return;

        function onPointerDown(event: PointerEvent) {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        }
        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== "Escape") return;
            setOpen(false);
            buttonRef.current?.focus();
        }

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return (
        <div
            ref={rootRef}
            className="relative"
            onPointerEnter={(event) => {
                if (event.pointerType !== "mouse" || open) return;
                openedByHover.current = true;
                setOpen(true);
            }}
            onPointerLeave={(event) => {
                if (event.pointerType !== "mouse") return;
                openedByHover.current = false;
                setOpen(false);
            }}
            onBlur={(event) => {
                if (!rootRef.current?.contains(event.relatedTarget)) setOpen(false);
            }}
        >
            <button
                ref={buttonRef}
                type="button"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => {
                    if (openedByHover.current) {
                        openedByHover.current = false;
                        return;
                    }
                    setOpen(!open);
                }}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:cursor-pointer ${
                    filtered
                        ? "border-accent bg-accent text-on-accent"
                        : "border-line-strong text-muted hover:border-subtle hover:text-foreground"
                }`}
            >
                <span className="sr-only">Filter: </span>
                {current.label}
                <span aria-hidden className="text-xs">
                    ▾
                </span>
            </button>

            {open && (
                <div className="absolute left-0 top-full z-20 pt-1">
                    <ul id={menuId} className="min-w-44 rounded-lg border border-line bg-surface py-1 shadow-lg">
                        {options.map((option) => (
                            <li key={option.label}>
                                <Link
                                    href={option.href}
                                    aria-current={option.active ? "page" : undefined}
                                    onClick={() => setOpen(false)}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface-hover hover:text-foreground ${
                                        option.active ? "text-foreground" : "text-muted"
                                    }`}
                                >
                                    <span aria-hidden className="w-3 text-accent">
                                        {option.active && "✓"}
                                    </span>
                                    {option.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
