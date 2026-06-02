import Image from "next/image";
import GemCounter from "./GemCounter";

interface CourseTopBarProps {
  courseName: string;
  level: string;
  gems: number;
  onBack?: () => void;
  onBookClick?: () => void;
}

export default function CourseTopBar({
  courseName,
  level,
  gems,
  onBack,
  onBookClick,
}: CourseTopBarProps) {
  return (
    <div className="topbar">
      {/* Left: back arrow text + level */}
      <button className="back-btn" onClick={onBack}>
        <span className="arrow-text">←</span>
        <span className="level-text">{level}</span>
      </button>

      {/* Center: course name */}
      <span className="course-name">{courseName}</span>

      {/* Right: gems + book */}
      <div className="right">
        <GemCounter count={gems} />
        <button className="icon-btn" onClick={onBookClick}>
          <Image src="/assets/book-open-mark.png" alt="book" width={36} height={36} />
        </button>
      </div>

      <style jsx>{`
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 64px;
          padding: 0 16px;
          box-sizing: border-box;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 12px; /* Marginally widened to handle the massive arrow asset size */
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .arrow-text {
          font-family: "Press Start 2P", monospace;
          font-size: 28px; /* Increased from 20px to make it distinctly larger */
          color: #e8c84a;
          transform: translateY(-2px); /* Slightly adjusted alignment offset for the massive size */
          line-height: 1;
        }
        .level-text {
          font-family: "Press Start 2P", monospace;
          font-size: 16px;
          color: #e8c84a;
          line-height: 1;
        }
        .course-name {
          font-family: "Press Start 2P", monospace;
          font-size: 18px;
          color: #e8c84a;
          letter-spacing: 3px;
          text-shadow: 0 2px 4px #00000088;
        }
        .right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}