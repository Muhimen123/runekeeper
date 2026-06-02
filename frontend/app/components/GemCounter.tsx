import Image from "next/image";

interface GemCounterProps {
  count: number;
}

export default function GemCounter({ count }: GemCounterProps) {
  return (
    <div className="gem-counter-wrapper">
      {/* The gem image sits slightly detached to overlap the left side */}
      <div className="gem-image-container">
        <Image 
          src="/assets/diamond.png" 
          alt="gems" 
          width={42} /* Increased size slightly to match the prominent image look */
          height={42} 
          className="pixelated-gem"
        />
      </div>
      
      {/* The tan background badge badge container */}
      <div className="gem-badge-bg">
        <span className="gem-badge-text">{count}</span>
      </div>

      <style jsx>{`
        .gem-counter-wrapper {
          display: flex;
          align-items: center;
          position: relative;
          /* Adjust this value if you need to push the entire counter left/right */
          padding-left: 20px; 
        }

        .gem-image-container {
          position: absolute;
          left: 0;
          z-index: 2;
          /* Smooth out crisp retro edges if necessary */
          display: flex;
          align-items: center;
        }

        :global(.pixelated-gem) {
          image-rendering: pixelated;
          filter: drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.5));
        }

        .gem-badge-bg {
          background: #D1A869; /* Matches the exact warm tan color from your screenshot */
          border-radius: 6px; /* Rounded right corners matching the asset */
          /* Creates space on the left side of the text box so the gem doesn't block numbers */
          padding: 8px 16px 8px 32px; 
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 90px;
          height: 32px;
          box-shadow: inset -2px -2px 0px rgba(0,0,0,0.2);
        }

        .gem-badge-text {
          font-family: "Press Start 2P", monospace;
          font-size: 14px;
          color: #000000;
          font-weight: bold;
          letter-spacing: 0.05em;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}