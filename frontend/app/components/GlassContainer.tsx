"use client";

import { ReactNode } from "react";

interface GlassContainerProps {
    children: ReactNode;
    className?: string;
}

export default function GlassContainer({
    children,
    className = "",
}: GlassContainerProps) {
    return (
        <div
            className={`
        bg-[rgba(30,35,25,0.4)]
        border-2
        border-[#CEA864]
        rounded-xl
        backdrop-blur-sm
        shadow-[0_10px_30px_rgba(0,0,0,0.8)]
        p-6
        ${className}
      `}
        >
            {children}
        </div>
    );
}