import React from "react";

type MindMapLoaderVariant = "page" | "inline" | "canvas";

interface MindMapLoaderProps {
  label: string;
  variant?: MindMapLoaderVariant;
}

export default function MindMapLoader({
  label,
  variant = "inline",
}: MindMapLoaderProps) {
  return (
    <div
      className={`mindcard-loader mindcard-loader--${variant}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className="mindcard-loader__graphic"
        data-testid="mindmap-loader-graphic"
        viewBox="0 0 180 100"
        aria-hidden="true"
      >
        <circle className="mindcard-loader__halo" cx="90" cy="50" r="16" />
        <circle className="mindcard-loader__spark" r="2.75">
          <animateMotion
            dur="2.2s"
            repeatCount="indefinite"
            path="M90 14a72 36 0 1 1 0 72a72 36 0 1 1 0-72"
          />
        </circle>
        <path
          className="mindcard-loader__branch is-one"
          pathLength={1}
          d="M70 46C62 42 58 34 51 30"
        />
        <path
          className="mindcard-loader__branch is-two"
          pathLength={1}
          d="M70 54C61 60 56 68 48 72"
        />
        <path
          className="mindcard-loader__branch is-three"
          pathLength={1}
          d="M110 46C119 39 124 32 132 29"
        />
        <path
          className="mindcard-loader__branch is-four"
          pathLength={1}
          d="M110 54C120 60 128 67 137 70"
        />
        <path
          className="mindcard-loader__branch is-five"
          pathLength={1}
          d="M142 68C151 63 157 56 164 49"
        />
        <rect
          className="mindcard-loader__root"
          x="70"
          y="40"
          width="40"
          height="20"
          rx="10"
        />
        <circle className="mindcard-loader__node is-one" cx="47" cy="28" r="5" />
        <circle className="mindcard-loader__node is-two" cx="44" cy="74" r="5" />
        <circle className="mindcard-loader__node is-three" cx="136" cy="27" r="5" />
        <circle className="mindcard-loader__node is-four" cx="141" cy="72" r="5" />
        <circle className="mindcard-loader__node is-five" cx="168" cy="46" r="4" />
      </svg>
      <span className="mindcard-loader__label">{label}</span>
    </div>
  );
}
