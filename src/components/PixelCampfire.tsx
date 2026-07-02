// A hand-drawn 16-bit campfire — crisp pixel rects, themeable, with a subtle
// flame flicker. Sets the CampHQ vibe on the landing/login screen.
const FIRE: string[] = [
  '     y     ',
  '    yy     ',
  '    yoy    ',
  '   yooy    ',
  '   yowoy   ',
  '  yowwoy   ',
  '  yowwwoy  ',
  ' yowwwwoy  ',
  ' yowwwwoy  ',
  ' yooowooy  ',
  '  roooor   ',
  ' LLl l LL  ',
  'llLLLLLLLl ',
];
const COLORS: Record<string, string> = {
  y: '#ffd95e', // outer flame
  o: '#f5883b', // mid flame
  w: '#fff6d6', // hot core
  r: '#d64d22', // ember base
  L: '#9a6432', // log
  l: '#5e3a18', // log shadow
};
// A few night-sky pixels (col,row) for stars + a moon.
const STARS: [number, number][] = [[1, 1], [9, 2], [10, 5], [0, 6], [8, 0]];

export default function PixelCampfire({ size = 176 }: { size?: number }) {
  const cols = 11, rows = 13, u = size / cols;
  const rects: React.ReactNode[] = [];
  STARS.forEach(([c, r], i) => rects.push(
    <rect key={`s${i}`} x={c * u} y={r * u} width={u} height={u} fill="#bfe3ff" opacity={0.85} />,
  ));
  FIRE.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === ' ') continue;
      const isFlame = ch === 'y' || ch === 'o' || ch === 'w';
      rects.push(
        <rect key={`${r}-${c}`} className={isFlame ? 'pf-flame' : undefined}
          x={c * u} y={r * u} width={u} height={u} fill={COLORS[ch]} />,
      );
    }
  });
  return (
    <svg className="pixelfire" width={size} height={size * (rows / cols)} viewBox={`0 0 ${size} ${size * (rows / cols)}`}
      shapeRendering="crispEdges" aria-hidden="true">
      {rects}
    </svg>
  );
}
