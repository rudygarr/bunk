import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { fmtRange, daysUntil } from '../lib/format';
import { attendeesOf, rsvp, coverageGaps } from '../lib/camps';

export default function Camps() {
  const nav = useNavigate();
  const { db, reset } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const camps = [...db.camps].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-h">Your camps</h1>
          <div className="page-sub">Everything for each camp — who's coming, which bus, which cabin, and who's on duty.</div>
        </div>
        <button className="btn-primary" onClick={() => nav('/new')}><i className="ti ti-plus" /> New camp</button>
      </div>

      <div className="camp-grid">
        {camps.map((c) => {
          const n = attendeesOf(db, c.id).length;
          const r = rsvp(db, c.id);
          const gaps = coverageGaps(db, c.id);
          const dleft = daysUntil(c.startDate, new Date('2026-09-15'));
          return (
            <button key={c.id} className="camp-card" onClick={() => nav('/camp/' + c.id)} style={{ ['--accent' as string]: c.accent ?? 'var(--pine)' }}>
              <div className="camp-card-bar" />
              <div className="camp-card-body">
                <div className="camp-card-top">
                  <span className="camp-card-name">{c.name}</span>
                  {c.published ? <span className="card-pill live"><span className="live-dot" /> Live</span> : <span className="card-pill draft">Draft</span>}
                  {dleft > 0 && <span className="camp-card-cd">{dleft}d out</span>}
                </div>
                <div className="camp-card-meta"><i className="ti ti-calendar" /> {fmtRange(c.startDate, c.endDate)}</div>
                <div className="camp-card-meta"><i className="ti ti-map-pin" /> {c.location}</div>
                {c.blurb && <div className="camp-card-blurb">{c.blurb}</div>}
                <div className="camp-card-stats">
                  <span><b>{n}</b> attendees</span>
                  <span><b>{r.accepted}</b> in</span>
                  {gaps > 0 ? <span className="warn"><b>{gaps}</b> open shift{gaps === 1 ? '' : 's'}</span> : <span className="ok">fully staffed</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="demo-reset">
        {confirmReset ? (
          <span>Reset all demo data to the original sample camps?{' '}
            <button className="demo-reset-yes" onClick={() => reset()}>Yes, reset</button>{' '}
            <button className="demo-reset-no" onClick={() => setConfirmReset(false)}>Cancel</button>
          </span>
        ) : (
          <button className="demo-reset-link" onClick={() => setConfirmReset(true)}><i className="ti ti-refresh" /> Reset demo data</button>
        )}
      </div>
    </>
  );
}
