import type { CSSProperties } from 'react';

export default function FlickerSpinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      style={{ '--on': 'var(--primary)', '--off': 'var(--border-color)', '--dur': '1.350s' } as CSSProperties}
    >
      <title>Loading</title>
      <style>{`
        circle { fill: var(--off); }
        circle.on { fill: var(--on); }
        @media (prefers-reduced-motion: reduce) { circle { animation: none !important; } }
        @keyframes fs100000001 { 0% { opacity: 1; } 11.10% { opacity: 1; } 11.11% { opacity: 0; } 88.88% { opacity: 0; } 88.89% { opacity: 1; } 100% { opacity: 1; } }
        @keyframes fs010000010 { 0% { opacity: 0; } 11.10% { opacity: 0; } 11.11% { opacity: 1; } 22.21% { opacity: 1; } 22.22% { opacity: 0; } 77.77% { opacity: 0; } 77.78% { opacity: 1; } 88.88% { opacity: 1; } 88.89% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes fs011000110 { 0% { opacity: 0; } 11.10% { opacity: 0; } 11.11% { opacity: 1; } 33.32% { opacity: 1; } 33.33% { opacity: 0; } 66.66% { opacity: 0; } 66.67% { opacity: 1; } 88.88% { opacity: 1; } 88.89% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes fs001101100 { 0% { opacity: 0; } 22.21% { opacity: 0; } 22.22% { opacity: 1; } 44.43% { opacity: 1; } 44.44% { opacity: 0; } 55.55% { opacity: 0; } 55.56% { opacity: 1; } 77.77% { opacity: 1; } 77.78% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes fs000111000 { 0% { opacity: 0; } 33.32% { opacity: 0; } 33.33% { opacity: 1; } 66.66% { opacity: 1; } 66.67% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes fs001111100 { 0% { opacity: 0; } 22.21% { opacity: 0; } 22.22% { opacity: 1; } 77.77% { opacity: 1; } 77.78% { opacity: 0; } 100% { opacity: 0; } }
      `}</style>
      <circle cx="3" cy="3" r="2" />
      <circle cx="9" cy="3" r="2" />
      <circle cx="15" cy="3" r="2" />
      <circle className="on" cx="15" cy="3" r="2" opacity={1} style={{ animation: 'fs100000001 var(--dur) linear infinite' }} />
      <circle cx="21" cy="3" r="2" />
      <circle cx="27" cy="3" r="2" />
      <circle cx="3" cy="9" r="2" />
      <circle cx="9" cy="9" r="2" />
      <circle cx="15" cy="9" r="2" />
      <circle className="on" cx="15" cy="9" r="2" opacity={0} style={{ animation: 'fs010000010 var(--dur) linear infinite' }} />
      <circle cx="21" cy="9" r="2" />
      <circle cx="27" cy="9" r="2" />
      <circle cx="3" cy="15" r="2" />
      <circle cx="9" cy="15" r="2" />
      <circle cx="15" cy="15" r="2" />
      <circle className="on" cx="15" cy="15" r="2" opacity={0} style={{ animation: 'fs011000110 var(--dur) linear infinite' }} />
      <circle cx="21" cy="15" r="2" />
      <circle cx="27" cy="15" r="2" />
      <circle cx="3" cy="21" r="2" />
      <circle cx="9" cy="21" r="2" />
      <circle cx="15" cy="21" r="2" />
      <circle className="on" cx="15" cy="21" r="2" opacity={0} style={{ animation: 'fs001101100 var(--dur) linear infinite' }} />
      <circle cx="21" cy="21" r="2" />
      <circle cx="27" cy="21" r="2" />
      <circle cx="3" cy="27" r="2" />
      <circle cx="9" cy="27" r="2" />
      <circle className="on" cx="9" cy="27" r="2" opacity={0} style={{ animation: 'fs000111000 var(--dur) linear infinite' }} />
      <circle cx="15" cy="27" r="2" />
      <circle className="on" cx="15" cy="27" r="2" opacity={0} style={{ animation: 'fs001111100 var(--dur) linear infinite' }} />
      <circle cx="21" cy="27" r="2" />
      <circle className="on" cx="21" cy="27" r="2" opacity={0} style={{ animation: 'fs000111000 var(--dur) linear infinite' }} />
      <circle cx="27" cy="27" r="2" />
    </svg>
  );
}
