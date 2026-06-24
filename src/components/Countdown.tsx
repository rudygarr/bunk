import { useEffect, useState } from 'react';

// A live ticking countdown to a camp's kickoff. Updates every second.
export default function Countdown({ target }: { target: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = target.getTime() - now;
  if (diff <= 0) {
    return <div className="cd-live"><i className="ti ti-flame" /> Camp is underway!</div>;
  }
  const total = Math.floor(diff / 1000);
  const days = Math.floor(total / 86400);
  const hrs = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const box = (n: number, l: string) => (
    <div className="cd-box"><span className="cd-n">{String(n).padStart(2, '0')}</span><span className="cd-l">{l}</span></div>
  );
  return (
    <div className="cd">
      {box(days, days === 1 ? 'day' : 'days')}
      <span className="cd-sep">:</span>
      {box(hrs, 'hrs')}
      <span className="cd-sep">:</span>
      {box(mins, 'min')}
      <span className="cd-sep">:</span>
      {box(secs, 'sec')}
    </div>
  );
}
