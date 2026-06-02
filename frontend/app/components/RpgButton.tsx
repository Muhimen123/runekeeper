"use client";

interface RpgButtonProps {
  text: string;
  onClick?: () => void;
  variant?: "green" | "cream";
  width?: string;
}

export default function RpgButton({
  text,
  onClick,
  variant = "green",
  width = "340px",
}: RpgButtonProps) {
  const isCream = variant === "cream";

  return (
    <div
      className="relative inline-block p-[5px]"
      style={{
        width,
        background: "#4F3310",
        clipPath: `polygon(
          10px 0%,
          calc(100% - 10px) 0%,
          100% 10px,
          100% calc(100% - 10px),
          calc(100% - 10px) 100%,
          10px 100%,
          0% calc(100% - 10px),
          0% 10px
        )`,
      }}
    >
      {/* Equivalent to .rpg-dark-btn-wrap::before */}
      <div
        className="absolute inset-[2px]"
        style={{
          background: isCream ? "#906930" : "#8a6a3a",
          clipPath: `polygon(
            8px 0%,
            calc(100% - 8px) 0%,
            100% 8px,
            100% calc(100% - 8px),
            calc(100% - 8px) 100%,
            8px 100%,
            0% calc(100% - 8px),
            0% 8px
          )`,
        }}
      />

      <button
        onClick={onClick}
        className="relative z-10 w-full border-none cursor-pointer"
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          padding: "12px 0",
          textAlign: "center",
          whiteSpace: "nowrap",

          color: isCream ? "#78AD19" : "#CEA864",

          background: isCream ? "#E8C493" : "#33391F",

          textShadow: isCream
            ? "1px 1px 0 #275300"
            : `
                2px 2px 0 #1a0f05,
                -1px -1px 0 #1a0f05,
                1px -1px 0 #1a0f05,
                -1px 1px 0 #1a0f05
              `,

          clipPath: `polygon(
            14px 0%,
            calc(100% - 14px) 0%,
            100% 14px,
            100% calc(100% - 14px),
            calc(100% - 14px) 100%,
            14px 100%,
            0% calc(100% - 14px),
            0% 14px
          )`,

          filter: `
            drop-shadow(0 0 3px #1f2414)
            drop-shadow(0 0 6px #3b4225)
            drop-shadow(0 3px 6px rgba(0,0,0,.6))
          `,

          transition: "filter 80ms, transform 80ms",
        }}
      >
        {/* Equivalent to .rpg-dark-btn::before */}
        <div
          className="absolute inset-[6px] pointer-events-none"
          style={{
            border: `2px solid ${
              isCream ? "#a08040" : "#a08040"
            }`,
            clipPath: `polygon(
              6px 0%,
              calc(100% - 6px) 0%,
              100% 6px,
              100% calc(100% - 6px),
              calc(100% - 6px) 100%,
              6px 100%,
              0% calc(100% - 6px),
              0% 6px
            )`,
          }}
        />

        {/* Equivalent to .rpg-dark-btn::after */}
        <div
          className="absolute inset-[5px] pointer-events-none"
          style={{
            background: isCream
              ? `
                radial-gradient(circle,#6b8c2a 2px,transparent 2px) 0 0 / 10px 10px no-repeat,
                radial-gradient(circle,#6b8c2a 2px,transparent 2px) 100% 0 / 10px 10px no-repeat,
                radial-gradient(circle,#6b8c2a 2px,transparent 2px) 0 100% / 10px 10px no-repeat,
                radial-gradient(circle,#6b8c2a 2px,transparent 2px) 100% 100% / 10px 10px no-repeat
              `
              : `
                radial-gradient(circle,#6b8c2a 2px,transparent 2px) 0 0 / 10px 10px no-repeat,
                radial-gradient(circle,#6b8c2a 2px,transparent 2px) 100% 0 / 10px 10px no-repeat,
                radial-gradient(circle,#6b8c2a 2px,transparent 2px) 0 100% / 10px 10px no-repeat,
                radial-gradient(circle,#6b8c2a 2px,transparent 2px) 100% 100% / 10px 10px no-repeat
              `,
          }}
        />

        <span className="relative z-20">{text}</span>
      </button>
    </div>
  );
}