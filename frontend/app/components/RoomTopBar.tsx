import Image from "next/image";
import GemCounter from "./GemCounter";

interface RoomTopBarProps {
  roomCode: string | number;
  level: string;
  gems: number;
  onBack?: () => void;
  onBookClick?: () => void;
}

export default function RoomTopBar({
  roomCode,
  level,
  gems,
  onBack,
  onBookClick,
}: RoomTopBarProps) {
  return (
    <div className="topbar">
      {/* Left side items container */}
      <div className="left-section">
        <button className="back-arrow-btn" onClick={onBack}>
          ←
        </button>
        
        <div className="room-code-badge">
          <div className="scroll-image-wrapper">
            <Image 
              src="/assets/map.png" 
              alt="map" 
              width={38} 
              height={38} 
              className="pixelated-icon"
            />
          </div>
          <span className="room-label">Room Code:{roomCode}</span>
        </div>
      </div>

      {/* Center: level badge */}
      <span className="level-text">{level}</span>

      {/* Right side items container */}
      <div className="right-section">
        <GemCounter count={gems} />
        <button className="book-icon-btn" onClick={onBookClick}>
          <Image 
            src="/assets/book-open-mark.png" 
            alt="book" 
            width={40} 
            height={40} 
            className="pixelated-icon"
          />
        </button>
      </div>

      <style jsx>{`
        /* 1. Clear transparent topbar layout structure */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 64px;
          padding: 0 10px;
          box-sizing: border-box;
          background: transparent; /* Removed dark background */
          border-bottom: none;       /* Removed harsh border line */
        }

        .left-section,
        .right-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* 2. Arrow styling matching the mockup color scheme */
        .back-arrow-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: "Press Start 2P", monospace;
          font-size: 28px;
          color: #A3926B;
          text-shadow: 2px 2px 0px #000;
          line-height: 1;
          transition: transform 0.1s ease;
        }
        .back-arrow-btn:hover {
          transform: scale(1.1);
          color: #CEA864;
        }

        /* 3. Room Code Badge styling matching the Gem Counter box design */
        .room-code-badge {
          display: flex;
          align-items: center;
          position: relative;
          padding-left: 24px; /* Space allowance for the hanging asset icon overlay */
        }

        .scroll-image-wrapper {
          position: absolute;
          left: -12px; /* Hangs off the left wall margin border line */
          z-index: 2;
          display: flex;
          align-items: center;
        }

        .room-label {
          font-family: "Press Start 2P", monospace;
          font-size: 13px;
          color: #000000; /* Rich solid text contrast */
          font-weight: bold;
          background: #D1A869; /* Warm brown tan backdrop matched to screenshot */
          padding: 8px 16px 8px 28px;
          border-radius: 6px;
          box-shadow: inset -2px -2px 0px rgba(0,0,0,0.25);
          line-height: 1;
        }

        /* 4. Center Area Level Indicator Text adjustment */
        .level-text {
          font-family: "Press Start 2P", monospace;
          font-size: 20px;
          color: #D1A869; /* Off-white color palette from the mockup graphics */
          letter-spacing: 1px;
          text-shadow: 2px 2px 0px #000000;
        }

        /* 5. Utility button styles for action icons */
        .book-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          transition: transform 0.1s ease;
        }
        .book-icon-btn:hover {
          transform: scale(1.05);
        }

        :global(.pixelated-icon) {
          image-rendering: pixelated;
          filter: drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.6));
        }
      `}</style>
    </div>
  );
}