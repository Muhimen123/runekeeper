import React from "react";

interface ProgressItem {
  id: string;
  name: string;
  percentage: number; // e.g. 10, 30, 50, 70, etc.
}

export default function ProgressTracker() {
  // Read-only progress list representing completion percentages
  const progressList: ProgressItem[] = [
    { id: "1", name: "Ch1", percentage: 10 },
    { id: "2", name: "Ch2", percentage: 30 },
    { id: "3", name: "Ch3", percentage: 50 },
    { id: "4", name: "Ch4", percentage: 0 },
    { id: "5", name: "Mordanality", percentage: 70 },
    { id: "6", name: "Ch1", percentage: 0 },
  ];

  return (
    <div className="progress-tracker-container">
      {progressList.map((item) => {
        // Calculate number of filled hearts out of 10 based on percentage
        const filledHeartsCount = Math.round(item.percentage / 10);

        return (
          <div key={item.id} className="progress-row">
            <div className="progress-header-info">
              <img src="/assets/magic_openbook.png" alt="Magic Book Icon" className="progress-book-icon" />
              <span className="progress-label">{item.name}</span>
            </div>
            <div className="progress-hearts-row">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isFilled = idx < filledHeartsCount;
                return (
                  <img
                    key={idx}
                    src={isFilled ? "/assets/heart.png" : "/assets/heart_empty.png"}
                    alt={isFilled ? "Heart Filled" : "Heart Empty"}
                    className="progress-heart-icon"
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
