"use client";

import { useLayoutEffect, useRef, useState } from "react";

type Step = { target: string; title: string; text: string; number: number };

export default function DemoTutorial({ mode, step }: { mode: "office" | "contractor"; step: Step | null }) {
    const storageKey = `praedium-tutorial-${mode}`;
    const [dismissed, setDismissed] = useState(() => {
        try {
            return sessionStorage.getItem(storageKey) === "done";
        } catch {
            return false;
        }
    });
    const bubbleRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ left: number; top: number; arrow: number; above: boolean } | null>(null);
    const target = step?.target;
    const number = step?.number;

    useLayoutEffect(() => {
        if (dismissed || !target) return;
        let anchor: HTMLElement | null = null;
        let originalOutline = "";
        let originalOffset = "";
        let frame = 0;
        const restore = () => {
            if (anchor) {
                anchor.style.outline = originalOutline;
                anchor.style.outlineOffset = originalOffset;
            }
        };
        const positionBubble = () => {
            const next = document.querySelector<HTMLElement>(target);
            if (!next) {
                setPosition(null);
                return;
            }
            if (next !== anchor) {
                restore();
                anchor = next;
                originalOutline = anchor.style.outline;
                originalOffset = anchor.style.outlineOffset;
                anchor.style.outline = "2px solid var(--accent)";
                anchor.style.outlineOffset = "4px";
                anchor.scrollIntoView({ block: "center", behavior: "smooth" });
            }
            const rect = anchor.getBoundingClientRect();
            const width = Math.min(288, window.innerWidth - 24);
            const height = bubbleRef.current?.offsetHeight ?? 150;
            const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
            const above = rect.top > height + 24;
            const top = above ? rect.top - height - 14 : rect.bottom + 14;
            setPosition({
                left,
                top,
                above,
                arrow: Math.max(18, Math.min(rect.left + rect.width / 2 - left, width - 18)),
            });
        };
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(positionBubble);
        };
        // The shared cards replace Add/Note buttons with forms; follow the active control.
        const observer = new MutationObserver(schedule);
        const main = document.querySelector("main");
        if (main) observer.observe(main, { childList: true, subtree: true });
        const resize = new ResizeObserver(schedule);
        if (main) resize.observe(main);
        positionBubble();
        window.addEventListener("scroll", schedule, true);
        window.addEventListener("resize", schedule);
        return () => {
            restore();
            cancelAnimationFrame(frame);
            observer.disconnect();
            resize.disconnect();
            window.removeEventListener("scroll", schedule, true);
            window.removeEventListener("resize", schedule);
        };
    }, [dismissed, target, number]);

    if (dismissed || !step) return null;
    return (
        <div
            ref={bubbleRef}
            role="status"
            aria-live="polite"
            className="fixed z-50 w-72 max-w-[calc(100vw-24px)] rounded-lg border border-accent/50 bg-surface p-4 text-foreground shadow-xl"
            style={{
                left: position?.left ?? 12,
                top: position?.top ?? 12,
                visibility: position ? "visible" : "hidden",
            }}
        >
            <span
                aria-hidden="true"
                className="absolute h-3 w-3 rotate-45 border-accent/50 bg-surface"
                style={{
                    left: (position?.arrow ?? 24) - 6,
                    ...(position?.above
                        ? { bottom: -7, borderBottomWidth: 1, borderRightWidth: 1 }
                        : { top: -7, borderTopWidth: 1, borderLeftWidth: 1 }),
                }}
            />
            <button
                type="button"
                aria-label="Exit tutorial"
                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded text-xl text-muted hover:bg-surface-hover hover:text-foreground"
                onClick={() => {
                    setDismissed(true);
                    try {
                        sessionStorage.setItem(storageKey, "done");
                    } catch {
                        /* Optional persistence. */
                    }
                }}
            >
                ×
            </button>
            <p className="pr-6 text-xs text-accent">
                {mode === "office" ? "Office" : "Contractor"} tutorial · {step.number} of 3
            </p>
            <p className="mt-1 pr-4 text-sm font-semibold">{step.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
        </div>
    );
}
