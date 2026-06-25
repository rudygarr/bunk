// CampHQ mark — a simple tent/cabin in the brand pine. Inline SVG so it themes
// with CSS and ships in the bundle (no asset round-trip).
export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--pine)" />
      {/* tent */}
      <path d="M16 7 L25 24 H7 Z" fill="var(--surface)" opacity="0.95" />
      <path d="M16 7 L16 24" stroke="var(--pine)" strokeWidth="1.6" />
      <path d="M16 15 L11 24 H21 Z" fill="var(--amber)" />
    </svg>
  );
}
