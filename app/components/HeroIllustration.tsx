export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 480 240"
      className="h-full w-full text-foreground/80"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="hero-line" x1="0" y1="0" x2="480" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="hsl(var(--accent))" />
          <stop offset="1" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
        </linearGradient>
        <filter id="hero-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* faint horizon lines */}
      {[40, 80, 120, 160, 200].map((y, i) => (
        <line
          key={i}
          x1="0"
          y1={y}
          x2="480"
          y2={y}
          stroke="currentColor"
          strokeOpacity={0.05}
          strokeWidth="1"
        />
      ))}

      {/* glow under the route line */}
      <path
        d="M30 180 Q 130 60, 240 130 T 450 70"
        stroke="hsl(var(--accent))"
        strokeOpacity="0.6"
        strokeWidth="6"
        filter="url(#hero-glow)"
        fill="none"
      />

      {/* the route line, dashed and animated */}
      <path
        d="M30 180 Q 130 60, 240 130 T 450 70"
        stroke="url(#hero-line)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="8 8"
        fill="none"
        className="animate-dash"
      />

      {/* origin pin */}
      <g className="animate-float" style={{ transformOrigin: "30px 180px" }}>
        <circle cx="30" cy="180" r="9" fill="hsl(var(--accent))" />
        <circle cx="30" cy="180" r="3" fill="hsl(var(--background))" />
      </g>

      {/* mid markers */}
      {[
        { x: 130, y: 105 },
        { x: 240, y: 130 },
        { x: 345, y: 100 },
      ].map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3.5"
          fill="hsl(var(--foreground))"
          fillOpacity={0.4}
        />
      ))}

      {/* destination pin */}
      <g className="animate-float" style={{ transformOrigin: "450px 70px", animationDelay: "1s" }}>
        <circle cx="450" cy="70" r="9" fill="hsl(var(--accent))" />
        <circle cx="450" cy="70" r="3" fill="hsl(var(--background))" />
      </g>
    </svg>
  );
}
