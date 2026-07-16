import React from "react";
// Import the generated high-resolution JPG image as a high-fidelity rendering option
// @ts-ignore
import logoImage from "../assets/images/extractta_logo_1784164236234.jpg";

interface ExtracttaLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "vector" | "image";
}

export default function ExtracttaLogo({
  className = "",
  showText = true,
  size = "md",
  variant = "vector",
}: ExtracttaLogoProps) {
  
  if (variant === "image") {
    const imgSizeClasses = {
      sm: "h-6 object-contain",
      md: "h-10 object-contain",
      lg: "h-16 object-contain",
      xl: "h-24 object-contain",
    }[size];

    return (
      <div className={`flex items-center justify-center select-none ${className}`}>
        <img
          src={logoImage}
          alt="Extractta Logo"
          className={imgSizeClasses}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Vector SVG configuration
  const dimensions = {
    sm: { svg: "h-6 w-12", text: "text-sm", gap: "gap-1.5" },
    md: { svg: "h-9 w-18", text: "text-lg", gap: "gap-2" },
    lg: { svg: "h-14 w-28", text: "text-2xl", gap: "gap-3" },
    xl: { svg: "h-20 w-40", text: "text-4xl", gap: "gap-4" },
  }[size];

  return (
    <div className={`flex items-center justify-center ${dimensions.gap} select-none ${className}`}>
      {/* Precise SVG rendering of the gradient wing */}
      <svg
        className={`${dimensions.svg} shrink-0`}
        viewBox="0 0 160 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="extractta-grad-1" x1="160" y1="40" x2="0" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00A896" />
            <stop offset="40%" stopColor="#028090" />
            <stop offset="100%" stopColor="#05668D" />
          </linearGradient>
        </defs>

        {/* Outer Feather Layer 1 */}
        <path
          d="M 155 58 C 120 54, 70 38, 25 10 C 15 6, 12 12, 28 20 C 65 38, 115 54, 155 58 Z"
          fill="url(#extractta-grad-1)"
        />
        
        {/* Layer 2 (Slightly lower and offset) */}
        <path
          d="M 155 63 C 120 60, 75 48, 38 25 C 28 19, 26 25, 42 33 C 78 50, 118 61, 155 63 Z"
          fill="url(#extractta-grad-1)"
          opacity="0.9"
        />

        {/* Layer 3 */}
        <path
          d="M 154 68 C 122 66, 82 56, 48 38 C 40 33, 38 39, 53 46 C 85 60, 120 67, 154 68 Z"
          fill="url(#extractta-grad-1)"
          opacity="0.8"
        />

        {/* Layer 4 (Bottom-most small curve) */}
        <path
          d="M 151 72 C 124 71, 92 63, 62 48 C 55 44, 54 49, 68 55 C 94 66, 123 71, 151 72 Z"
          fill="url(#extractta-grad-1)"
          opacity="0.7"
        />
      </svg>

      {showText && (
        <span className={`font-sans font-black tracking-widest ${dimensions.text} uppercase flex items-center`}>
          <span className="text-[#00A896] dark:text-[#00c5b0]">EX</span>
          <span className="text-[#0B2545] dark:text-zinc-100">TRACTTA</span>
        </span>
      )}
    </div>
  );
}
