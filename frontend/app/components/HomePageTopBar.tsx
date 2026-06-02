import Image from "next/image";
import GemCounter from "./GemCounter";

interface HomepageTopBarProps {
  gems: number;
  onFrameClick?: () => void;
}

export default function HomePageTopBar({ gems, onFrameClick }: HomepageTopBarProps) {
  return (
    <div className="topbar">
      {/* Left: Runekeeper title */}
      <span className="title">Runekeeper</span>

      {/* Right: gems + frame/achievement icon */}
      <div className="right">
        <GemCounter count={gems} />
        <button className="icon-btn" onClick={onFrameClick}>
          <Image src="/assets/frame-1.png" alt="achievements" width={32} height={32} />
        </button>
      </div>

      <style jsx>{`
.topbar {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 52px;
          background: transparent;
          padding: 0 14px;
          box-sizing: border-box;
        }
        .title {
  font-family: "Press Start 2P", monospace;
  font-size: 18px;
  color: #323921;
  letter-spacing: 2px;
  text-shadow: 2px 2px 0 #CFA965, 0 2px 2px #00000099;
}
        .right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          z-index:2;
        }
      `}</style>
    </div>
  );
}