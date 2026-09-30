"use client";

import { useState } from "react";

export default function FavoriteToggle({ favorite, onToggle }: { favorite: boolean; onToggle: () => Promise<void> }) {
    const [pending, setPending] = useState(false);

    async function handleClick() {
        setPending(true);
        try {
            await onToggle();
        } finally {
            setPending(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            aria-pressed={favorite}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            title={favorite ? "Remove from favorites" : "Add to favorites"}
            className={`ml-2 align-middle text-xl leading-none hover:cursor-pointer disabled:opacity-40 ${
                favorite ? "text-amber-400 hover:text-amber-300" : "text-neutral-600 hover:text-amber-400"
            }`}
        >
            {favorite ? "★" : "☆"}
        </button>
    );
}
