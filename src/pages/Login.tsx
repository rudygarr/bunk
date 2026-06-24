import { useState } from 'react';
import { useSession } from '../lib/session';
import { useStore } from '../lib/store';
import { findCamperByContact } from '../lib/camper';
import { campById } from '../lib/camps';
import Logo from '../components/Logo';
import { field } from '../components/Modal';
import type { Attendee } from '../lib/types';

export default function Login() {
  const { signInOrganizer } = useSession();
  const [mode, setMode] = useState<'organizer' | 'camper'>('organizer');
  return (
    <div className="login">
      <div className="login-card">
        <div className="login-mark"><Logo size={56} /></div>
        <h1 className="login-title">Bunk</h1>
        <p className="login-tag">Run your camp — rosters, buses, cabins, and crew, all in one place.</p>

        <div className="seg login-seg">
          <button className={mode === 'organizer' ? 'on' : ''} onClick={() => setMode('organizer')}>Run a camp</button>
          <button className={mode === 'camper' ? 'on' : ''} onClick={() => setMode('camper')}>I'm a camper</button>
        </div>

        {mode === 'organizer' ? (
          <>
            <button className="login-btn" onClick={signInOrganizer}><i className="ti ti-arrow-right" /> Enter the demo</button>
            <div className="login-foot">A demo — organizer sign-in is simulated.</div>
          </>
        ) : (
          <CamperLogin />
        )}
      </div>
    </div>
  );
}

function CamperLogin() {
  const { signInCamper } = useSession();
  const { db, updateAttendee } = useStore();
  const [contact, setContact] = useState('');
  const [found, setFound] = useState<Attendee | null>(null);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');

  function lookup() {
    const a = findCamperByContact(db, contact);
    if (!a) { setErr("We couldn't find you. Check the email or phone your camp has on file, or ask your organizer."); return; }
    setErr(''); setFound(a);
  }
  function submit() {
    if (!found) return;
    const live = db.attendees.find((x) => x.id === found.id) ?? found;
    if (live.password) {
      if (pw !== live.password) { setErr('That password doesn’t match. Try again.'); return; }
      signInCamper(found.id);
    } else {
      if (pw.length < 4) { setErr('Pick a password of at least 4 characters.'); return; }
      if (pw !== pw2) { setErr('The two passwords don’t match.'); return; }
      updateAttendee(found.id, { password: pw });
      signInCamper(found.id);
    }
  }

  if (!found) {
    return (
      <>
        <input style={{ ...field, marginBottom: 10 }} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone number" onKeyDown={(e) => e.key === 'Enter' && lookup()} autoFocus />
        {err && <div className="login-err">{err}</div>}
        <button className="login-btn" onClick={lookup}><i className="ti ti-arrow-right" /> Continue</button>
        <div className="login-foot">Use the email or phone your camp registered. Demo: try <strong>eli@demo.camp</strong>.</div>
      </>
    );
  }

  const live = db.attendees.find((x) => x.id === found.id) ?? found;
  const camp = campById(db, found.campId);
  const isNew = !live.password;
  return (
    <>
      <div className="login-hello">Hi {found.name.split(' ')[0]}! {camp ? <>You're signed up for <strong>{camp.name}</strong>.</> : null}</div>
      <input style={{ ...field, marginBottom: 10 }} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={isNew ? 'Create a password' : 'Your password'} onKeyDown={(e) => e.key === 'Enter' && !isNew && submit()} autoFocus />
      {isNew && <input style={{ ...field, marginBottom: 10 }} type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm password" onKeyDown={(e) => e.key === 'Enter' && submit()} />}
      {err && <div className="login-err">{err}</div>}
      <button className="login-btn" onClick={submit}><i className="ti ti-arrow-right" /> {isNew ? 'Create account & enter' : 'Log in'}</button>
      <button className="login-back" onClick={() => { setFound(null); setPw(''); setPw2(''); setErr(''); }}>← Not you?</button>
    </>
  );
}
