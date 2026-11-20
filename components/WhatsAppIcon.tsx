import React from "react";

interface WhatsAppIconProps {
  size?: number;
  className?: string;
  badgeColor?: string;
  phoneColor?: string;
}

export default function WhatsAppIcon({
  size = 22,
  className = "",
  badgeColor = "var(--accent-primary, #ff5a1f)",
  phoneColor = "#ffffff",
}: WhatsAppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      {/* Authentic WhatsApp Speech Bubble */}
      <path
        d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.84.5 3.56 1.38 5.04L2.06 21.94l4.98-1.31a9.96 9.96 0 0 0 4.964 1.374c5.524 0 10.004-4.48 10.004-10.004C22.008 6.48 17.528 2 12.004 2z"
        fill={badgeColor}
      />
      {/* Authentic Crisp Proportioned Telephone Handset */}
      <path
        d="M17.472 14.382c-.298-.149-1.764-.87-2.037-.97-.273-.099-.472-.149-.671.149-.199.298-.77.97-.944 1.169-.174.199-.348.224-.646.075-.298-.149-1.26-.464-2.4-1.482-.888-.792-1.488-1.77-1.662-2.068-.174-.298-.018-.46.13-.608.134-.134.298-.348.447-.522.149-.174.199-.298.298-.497.099-.199.05-.373-.025-.522-.075-.149-.671-1.616-.92-2.213-.242-.58-.487-.502-.671-.511l-.572-.01c-.199 0-.522.075-.795.373-.273.298-1.043 1.019-1.043 2.486s1.068 2.883 1.217 3.082c.149.199 2.102 3.209 5.093 4.498.711.307 1.266.49 1.699.627.714.227 1.363.195 1.877.118.573-.086 1.764-.72 2.012-1.416.248-.696.248-1.292.174-1.416-.075-.124-.273-.199-.571-.348z"
        fill={phoneColor}
      />
    </svg>
  );
}
