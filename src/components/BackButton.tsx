"use client";
import { useRouter } from "next/navigation";

export default function BackButton({ fallback = "/" }: { fallback?: string }) {
    const router = useRouter();

    function goBack() {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push(fallback);
        }
    }

    return (
        <button onClick={goBack} className="text-sm text-neutral-400 hover:text-neutral-100 hover:cursor-pointer">
            ← Back
        </button>
    );
}
