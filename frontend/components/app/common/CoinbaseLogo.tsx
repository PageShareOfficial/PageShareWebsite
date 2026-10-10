type CoinbaseLogoProps = Readonly<{ className?: string }>;

/** Coinbase logomark: white "C" on the brand-blue rounded square (app icon style). */
export default function CoinbaseLogo({ className = 'h-4 w-4' }: CoinbaseLogoProps) {
  return (
    <svg viewBox="0 0 1024 1024" className={className} aria-hidden="true">
      <rect width="1024" height="1024" rx="192" fill="#0052FF" />
      <path
        fill="#FFFFFF"
        d="M512.147 692C412.697 692 332.146 611.45 332.146 512C332.146 412.55 412.697 332 512.147 332C601.247 332 675.197 396.95 689.447 482.15H870.797C855.497 297.3 700.846 152 512.147 152C313.396 152 152.146 313.25 152.146 512C152.146 710.75 313.396 872 512.147 872C700.846 872 855.497 726.7 870.797 541.85H689.297C675.047 627.05 601.247 692 512.147 692Z"
      />
    </svg>
  );
}
