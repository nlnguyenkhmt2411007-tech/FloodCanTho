import React from "react";

type NPLogoProps = {
  size?: number;
};

export default function NPLogo({ size = 44 }: NPLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Logo NP - Nguyên và Phúc"
    >
      <defs>
        <linearGradient id="npGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        <filter id="npGlow">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      <rect
        width="100"
        height="100"
        rx="24"
        fill="#081b35"
      />

      {/* Chữ N */}
      <path
        d="M20 75 V25 L53 75 V25"
        fill="none"
        stroke="url(#npGradient)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Chữ P */}
      <path
        d="M53 75 V25 H68 C91 25 91 54 68 54 H53"
        fill="none"
        stroke="url(#npGradient)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dòng nước phát sáng */}
      <path
        d="M14 65 C35 40 56 83 86 48"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.45"
        filter="url(#npGlow)"
      />

      <path
        d="M14 65 C35 40 56 83 86 48"
        fill="none"
        stroke="#67e8f9"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="18 120"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="138"
          to="0"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>

      {/* Các ô dữ liệu raster */}
      <g fill="#67e8f9">
        <rect x="72" y="59" width="5" height="5" rx="1">
          <animate
            attributeName="opacity"
            values="0.25;1;0.25"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </rect>

        <rect x="80" y="66" width="5" height="5" rx="1">
          <animate
            attributeName="opacity"
            values="1;0.25;1"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </rect>
      </g>
    </svg>
  );
}