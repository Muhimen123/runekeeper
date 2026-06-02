"use client";

import React from "react";
import "./RpgButton.css";

interface RpgButtonProps {
  text: string;
  onClick?: () => void;
  variant?: "green" | "cream";
  width?: string;
}

export default function RpgButtonV2({
  text,
  onClick,
  variant = "green",
  width = "340px",
}: RpgButtonProps) {
  const isGreen = variant === "green";

  return (
    <div
      className="rpg-wood-btn-wrap"
      style={{ width }}
    >
      <button
        className={isGreen ? "rpg-green-button rpg-wood-btn" : "rpg-wood-btn"}
        onClick={onClick}
      >
        {text}
      </button>
    </div>
  );
}
