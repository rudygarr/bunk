import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { fmtRange } from '../lib/format';
import { campById } from '../lib/camps';
import Logo from '../components/Logo';
import Wordmark from '../components/Wordmark';
import { field, primaryBtn } from '../components/Modal';
import type { Gender } from '../lib/types';

// Public self-sign-up reached by scanning a camp's QR code. No login.
export default function Join() {
  const { id } = useParams();
  const { db, invite } = useStore();
  const camp = campById(db, id ?? '');
  const [done, setDone] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [grade, setGrade] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');

  function submit() {
    if (!name.trim() || !camp) return;
    invite(camp.id, { name: name.trim(), email: contact.trim() || undefined, kind: 'camper', role: 'Camper', status: 'accepted', grade: grade ? Number(grade) : undefined, gender: gender || undefined });
    setDone(true);
  }

  return (
    <div className="rsvp-page">
      <div className="rsvp-card">
        <div className="rsvp-brand"><Logo /> <Wordmark /></div>
        {!camp ? (
          <div className="rsvp-gone">This sign-up link is no longer valid.</div>
        ) : done ? (
          <div className="rsvp-done accepted">
            <i className="ti ti-circle-check" />
            You're signed up for {camp.name}!
            <div style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>The organizer will sort out your bus and cabin.</div>
          </div>
        ) : (
          <>
            <div className="rsvp-kicker">Sign up</div>
            <h1 className="rsvp-title">{camp.name}</h1>
            <div className="rsvp-meta"><div><i className="ti ti-calendar" /> {fmtRange(camp.startDate, camp.endDate)}</div><div><i className="ti ti-map-pin" /> {camp.location}</div></div>
            <div style={{ marginTop: 18 }}>
              <label className="flabel">Your name<input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last" autoFocus /></label>
              <label className="flabel">Email or phone<input style={field} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="So we can reach you" /></label>
              <div style={{ display: 'flex', gap: 10 }}>
                <label className="flabel" style={{ flex: 1 }}>Grade<input style={field} type="number" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="10" /></label>
                <label className="flabel" style={{ flex: 1 }}>Gender
                  <select style={{ ...field, appearance: 'auto' }} value={gender} onChange={(e) => setGender(e.target.value as Gender | '')}>
                    <option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </label>
              </div>
              <button style={{ ...primaryBtn, marginTop: 6, opacity: name.trim() ? 1 : 0.5 }} disabled={!name.trim()} onClick={submit}>Sign me up</button>
            </div>
            <div className="rsvp-foot">No account needed — this just adds you to the camp roster.</div>
          </>
        )}
      </div>
    </div>
  );
}
