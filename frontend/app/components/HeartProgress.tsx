import React from "react";

interface HeartProgressProps {
  percentage: number; // e.g. 0, 10, 30, 50, 70, etc.
}

export default function HeartProgress({ percentage }: HeartProgressProps) {
  const filledHeartsCount = Math.round(percentage / 10);

  return (
    <div className="progress-hearts-row">
      {Array.from({ length: 10 }).map((_, idx) => {
        const isFilled = idx < filledHeartsCount;
        return (
          <img
            key={idx}
            src={isFilled ? "/assets/heart.png" : "/assets/heart_empty.png"}
            alt={isFilled ? "Heart" : "Empty Heart"}
            className="progress-heart-icon"
          />
        );
      })}
    </div>
  );
}
