// Praedium in Geist SemiBold (600), with the green check replacing the "u".
// Use the app's loaded Geist font and theme colors for both light and dark modes.
// Size it with a height class, e.g. "h-6 w-auto".
export default function Logo({ className }: { className?: string }): React.ReactElement {
    return (
        <svg viewBox="0 0 440 110" role="img" aria-label="Praedium" className={className}>
            <g
                fill="currentColor"
                style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                fontSize={100}
                fontWeight={600}
                letterSpacing={-3.5}
            >
                <text x={0} y={90}>
                    Praedi
                </text>
                <text x={346} y={90}>
                    m
                </text>
            </g>
            <path
                d="M 298 45 L 308 86 L 340 25"
                fill="none"
                strokeWidth={8.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-accent"
            />
        </svg>
    );
}
