"use client";

import { useEffect, useRef } from "react";

export default function LandingVideo({ src, poster, title }: { src: string; poster: string; title: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let visible = false;
        let manuallyPaused = false;
        let automaticPause = false;

        const syncPlayback = () => {
            if (!visible || document.hidden || motion.matches) {
                if (!video.paused) {
                    automaticPause = true;
                    video.pause();
                }
            } else if (!manuallyPaused) {
                void video.play().catch(() => {
                    // Native controls remain available when autoplay is blocked.
                });
            }
        };
        const onPause = () => {
            if (!automaticPause) manuallyPaused = true;
            automaticPause = false;
        };
        const onPlay = () => {
            manuallyPaused = false;
        };
        const observer = new IntersectionObserver(
            ([entry]) => {
                visible = entry.isIntersecting;
                syncPlayback();
            },
            { threshold: 0.25 },
        );
        observer.observe(video);
        video.addEventListener("pause", onPause);
        video.addEventListener("play", onPlay);
        motion.addEventListener("change", syncPlayback);
        document.addEventListener("visibilitychange", syncPlayback);

        return () => {
            observer.disconnect();
            video.removeEventListener("pause", onPause);
            video.removeEventListener("play", onPlay);
            motion.removeEventListener("change", syncPlayback);
            document.removeEventListener("visibilitychange", syncPlayback);
        };
    }, []);

    return (
        <video
            ref={videoRef}
            src={src}
            poster={poster}
            aria-label={`${title} demonstration`}
            width={1280}
            height={800}
            muted
            loop
            playsInline
            controls
            preload="none"
            className="aspect-[16/10] w-full rounded-lg border border-line bg-neutral-950"
        >
            <a href={src}>Watch: {title}</a>
        </video>
    );
}
