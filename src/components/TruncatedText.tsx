"use client";

import { useEffect, useRef, useState } from "react";

// One line of text cut off with "…". When it's cut off, hovering it (or focusing the link around it) shows
// the full text in a themed tooltip. Screen readers already get the full text, so the tooltip is hidden from them.
export default function TruncatedText({ text }: { text: string }) {
    const textRef = useRef<HTMLSpanElement>(null);
    const [truncated, setTruncated] = useState(false);

    useEffect(() => {
        const element = textRef.current;
        if (!element) return;
        const observer = new ResizeObserver(() => setTruncated(element.scrollWidth > element.clientWidth));
        observer.observe(element);
        return () => observer.disconnect();
    }, [text]);

    return (
        <span className="group/tip relative block">
            <span ref={textRef} className="block truncate">
                {text}
            </span>
            {truncated && (
                <span
                    aria-hidden
                    className="pointer-events-none invisible absolute bottom-full left-0 z-30 mb-1.5 w-max max-w-xs rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-foreground opacity-0 shadow-lg transition-[opacity,visibility] group-hover/tip:visible group-hover/tip:opacity-100 group-hover/tip:delay-300 in-focus-visible:visible in-focus-visible:opacity-100"
                >
                    {text}
                </span>
            )}
        </span>
    );
}
