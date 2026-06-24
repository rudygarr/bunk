import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { fmtRange, daysUntil } from '../lib/format';
import { attendeesOf, rsvp, coverageGaps } from '../lib/camps';
import Modal, { field, primaryBtn } from '../components/Modal';

export default function Camps() {
  const nav = useNavigate();
  const { db } = useStore();
  const [showNew, setShowNew] = useState(false);
  const camps = [...db.camps].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-h">Your camps</h1>
          <div className="page-sub">Everything for each camp — who's coming, which bus, which cabin, and who's on duty.</div>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}><i className="ti ti-plus" /> New camp</button>
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

      {showNew && <NewCampModal onClose={() => setShowNew(false)} onCreate={(id) => { setShowNew(false); nav('/camp/' + id); }} />}
    </>
  );
}

function NewCampModal({ onClose, onCreate }: { onClose: () => void; onCreate: (id: string) => void }) {
  const { addCamp } = useStore();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  function save() {
    if (!name.trim()) return;
    const c = addCamp({ name: name.trim(), location: location.trim(), startDate: start || '2026-06-01', endDate: end || start || '2026-06-01', organizer: 'You', accent: '#1f6f5c' });
    onCreate(c.id);
  }
  return (
    <Modal title="New camp" onClose={onClose}>
      <label className="flabel">Camp name<input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer Adventure Camp" autoFocus /></label>
      <label className="flabel">Location<input style={field} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Pine Valley Retreat" /></label>
      <div style={{ display: 'flex', gap: 10 }}>
        <label className="flabel" style={{ flex: 1 }}>Start<input type="date" style={{ ...field, appearance: 'auto' }} value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="flabel" style={{ flex: 1 }}>End<input type="date" style={{ ...field, appearance: 'auto' }} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
      </div>
      <button style={{ ...primaryBtn, marginTop: 14, opacity: name.trim() ? 1 : 0.5 }} disabled={!name.trim()} onClick={save}>Create camp</button>
    </Modal>
  );
}
