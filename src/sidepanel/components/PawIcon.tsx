import React from "react";

export default function PawIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="16" r="5" />
      <circle cx="5" cy="9" r="2.4" />
      <circle cx="10" cy="5.5" r="2.4" />
      <circle cx="14" cy="5.5" r="2.4" />
      <circle cx="19" cy="9" r="2.4" />
    </svg>
  );
}
