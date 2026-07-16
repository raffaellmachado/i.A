import React, { useEffect, useState } from "react";
// Import the generated high-resolution JPG image
// @ts-ignore
import logoImage from "../assets/images/extractta_logo_1784164236234.jpg";

interface ExtracttaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function ExtracttaLogo({
  className = "",
  size = "md",
}: ExtracttaLogoProps) {
  const [transparentLogo, setTransparentLogo] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoImage;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Loop through pixels and make white/near-white background transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate pixel lightness
        const avg = (r + g + b) / 3;
        
        if (avg > 235) {
          if (avg > 248) {
            // Fully white pixels become completely transparent
            data[i + 3] = 0;
          } else {
            // Semi-transparent edge for smooth anti-aliased transition
            const ratio = (248 - avg) / 13; // 0 to 1
            data[i + 3] = Math.round(ratio * 255);
          }
        }
      }

      // Put the modified image data back
      ctx.putImageData(imgData, 0, 0);

      // Convert to a transparent PNG data URL
      try {
        setTransparentLogo(canvas.toDataURL("image/png"));
      } catch (err) {
        console.error("Error creating transparent logo:", err);
      }
    };
  }, []);

  const imgSizeClasses = {
    sm: "h-8 object-contain",
    md: "h-12 object-contain",
    lg: "h-20 object-contain",
    xl: "h-28 object-contain",
  }[size];

  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <img
        src={transparentLogo || logoImage}
        alt="Extractta Logo"
        className={imgSizeClasses}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
