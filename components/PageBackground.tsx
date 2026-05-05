// components/PageBackground.tsx
// Global ink-splash background — replaces the plain white/fafaf9 bg site-wide.
// Usage: wrap any page's <main> content inside <PageBackground> instead of bg-[#fafaf9]

export default function PageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen" style={{ background: "#fafaf9" }}>
      {/* Fixed full-page ink splash SVG — sits behind ALL content */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Gooey liquid filter */}
            <filter id="pg-goo" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
              <feColorMatrix in="b" mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -9"
                result="goo" />
            </filter>
            {/* Soft ambient blur */}
            <filter id="pg-soft" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
          </defs>

          {/* Ambient soft glow layer */}
          <g filter="url(#pg-soft)">
            <ellipse cx="8%"  cy="12%" rx="18%" ry="14%" fill="#00c8ff" opacity="0.10" />
            <ellipse cx="92%" cy="8%"  rx="16%" ry="12%" fill="#ff6bff" opacity="0.09" />
            <ellipse cx="50%" cy="30%" rx="22%" ry="16%" fill="#ffe135" opacity="0.07" />
            <ellipse cx="5%"  cy="55%" rx="14%" ry="18%" fill="#ff7a00" opacity="0.09" />
            <ellipse cx="88%" cy="50%" rx="18%" ry="14%" fill="#00ffb3" opacity="0.08" />
            <ellipse cx="30%" cy="75%" rx="20%" ry="15%" fill="#ff3c7e" opacity="0.09" />
            <ellipse cx="70%" cy="80%" rx="16%" ry="18%" fill="#c77dff" opacity="0.08" />
            <ellipse cx="50%" cy="95%" rx="24%" ry="12%" fill="#ffe135" opacity="0.07" />
          </g>

          {/* Fluid gooey blobs */}
          <g filter="url(#pg-goo)">
            <ellipse cx="6%"   cy="10%" rx="12%" ry="10%" fill="#00c8ff" opacity="0.18" />
            <ellipse cx="90%"  cy="6%"  rx="11%" ry="9%"  fill="#ff6bff" opacity="0.16" />
            <ellipse cx="48%"  cy="28%" rx="14%" ry="10%" fill="#ffe135" opacity="0.14" />
            <ellipse cx="4%"   cy="52%" rx="10%" ry="12%" fill="#ff7a00" opacity="0.16" />
            <ellipse cx="87%"  cy="48%" rx="12%" ry="10%" fill="#00ffb3" opacity="0.14" />
            <ellipse cx="28%"  cy="74%" rx="13%" ry="10%" fill="#ff3c7e" opacity="0.15" />
            <ellipse cx="72%"  cy="78%" rx="11%" ry="12%" fill="#c77dff" opacity="0.14" />
            <ellipse cx="52%"  cy="94%" rx="15%" ry="9%"  fill="#ffe135" opacity="0.13" />
            {/* Satellite droplets */}
            <ellipse cx="18%"  cy="5%"  rx="4%"  ry="3%"  fill="#ff6bff" opacity="0.20" />
            <ellipse cx="78%"  cy="18%" rx="3%"  ry="4%"  fill="#00c8ff" opacity="0.18" />
            <ellipse cx="15%"  cy="38%" rx="3%"  ry="3%"  fill="#ffe135" opacity="0.18" />
            <ellipse cx="95%"  cy="62%" rx="4%"  ry="3%"  fill="#ff3c7e" opacity="0.16" />
            <ellipse cx="40%"  cy="88%" rx="3%"  ry="4%"  fill="#00ffb3" opacity="0.17" />
            <ellipse cx="62%"  cy="60%" rx="3%"  ry="3%"  fill="#c77dff" opacity="0.15" />
          </g>
        </svg>
      </div>

      {/* Page content sits on top */}
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}