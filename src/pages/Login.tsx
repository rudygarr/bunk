import { useState } from 'react';
import { useSession } from '../lib/session';
import { useStore } from '../lib/store';
import { findCamperByContact } from '../lib/camper';
import { campById } from '../lib/camps';
import Logo from '../components/Logo';
import Wordmark from '../components/Wordmark';
import Countdown from '../components/Countdown';
import { field } from '../components/Modal';
import { fmtDate } from '../lib/format';
import type { Attendee, Camp } from '../lib/types';

// The next camp to count down to: soonest kickoff (or start date) still ahead.
function kickoffOf(c: Camp): Date {
  return new Date(c.kickoff ?? `${c.startDate}T09:00:00`);
}
function soonestCamp(camps: Camp[]): Camp | null {
  const upcoming = camps
    .map((c) => ({ c, t: kickoffOf(c).getTime() }))
    .filter((x) => x.t > Date.now())
    .sort((a, b) => a.t - b.t);
  return upcoming[0]?.c ?? null;
}

export default function Login() {
  const { db } = useStore();
  const [mode, setMode] = useState<'organizer' | 'camper' | 'viewer'>('organizer');
  const next = soonestCamp(db.camps);
  return (
    <div className="login">
      <div className="login-card">
        <div className="login-mark"><Logo size={56} /></div>
        <h1 className="login-title"><Wordmark /></h1>
        <p className="login-tag">Run your camp — rosters, buses, cabins, and crew, all in one place.</p>

        {next && (
          <div className="login-cd">
            <div className="login-cd-h">
              <i className="ti ti-calendar-event" /> {next.name} · {next.kickoffLabel ?? 'starts'}
            </div>
            <Countdown target={kickoffOf(next)} />
            <div className="login-cd-when">{fmtDate(next.startDate)} · {next.location}</div>
          </div>
        )}

        <div className="seg login-seg">
          <button className={mode === 'organizer' ? 'on' : ''} onClick={() => setMode('organizer')}>Run a camp</button>
          <button className={mode === 'camper' ? 'on' : ''} onClick={() => setMode('camper')}>I'm a camper</button>
          <button className={mode === 'viewer' ? 'on' : ''} onClick={() => setMode('viewer')}>View only</button>
        </div>

        {mode === 'organizer' ? (
          <OrganizerAuth />
        ) : mode === 'camper' ? (
          <CamperLogin />
        ) : (
          <ViewerEntry />
        )}
      </div>
    </div>
  );
}

// Real organizer accounts (Supabase). Sign in or create an account; on success
// the auth listener flips the gate into the cloud-backed app automatically.
const SSO: { provider: 'azure' | 'google' | 'apple'; label: string; icon: string }[] = [
  { provider: 'azure', label: 'Microsoft', icon: 'ti-brand-windows' },
  { provider: 'google', label: 'Google', icon: 'ti-brand-google' },
  { provider: 'apple', label: 'Apple', icon: 'ti-brand-apple' },
];

function OrganizerAuth() {
  const { signIn, signUp, signInWith, enterDemo } = useSession();
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || pw.length < 6) { setErr('Enter your email and a password of at least 6 characters.'); return; }
    setErr(''); setBusy(true);
    const msg = isNew ? await signUp(email.trim(), pw, name.trim() || undefined) : await signIn(email.trim(), pw);
    setBusy(false);
    if (msg) setErr(msg); // success → onAuthChange switches the app to cloud mode
  }

  async function sso(provider: 'azure' | 'google' | 'apple') {
    setErr('');
    const msg = await signInWith(provider); // success redirects away
    if (msg) setErr(msg);
  }

  return (
    <>
      <div className="sso-row">
        {SSO.map((s) => (
          <button key={s.provider} className="sso-btn" onClick={() => sso(s.provider)} title={`Continue with ${s.label}`}>
            <i className={'ti ' + s.icon} /> {s.label}
          </button>
        ))}
      </div>
      <div className="sso-divider"><span>or with email</span></div>
      {isNew && <input style={{ ...field, marginBottom: 10 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />}
      <input style={{ ...field, marginBottom: 10 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoFocus onKeyDown={(e) => e.key === 'Enter' && submit()} />
      <input style={{ ...field, marginBottom: 10 }} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={isNew ? 'Create a password' : 'Password'} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      {err && <div className="login-err">{err}</div>}
      <button className="login-btn" onClick={submit} disabled={busy}>
        <i className="ti ti-arrow-right" /> {busy ? 'One sec…' : isNew ? 'Create account' : 'Sign in'}
      </button>
      <button className="login-back" onClick={() => { setIsNew(!isNew); setErr(''); }}>
        {isNew ? 'Already have an account? Sign in' : 'New to CampHQ? Create an account'}
      </button>
      <div className="login-foot">Just exploring? <button className="login-link" onClick={enterDemo}>Try the live demo →</button></div>
    </>
  );
}

// No-account public view: type a camp code (its id in the demo) and open the
// read-only viewer. Navigating sets the hash; the gate's hashchange listener
// renders the public Viewer route.
function ViewerEntry() {
  const { db } = useStore();
  const [code, setCode] = useState('');
  function open() {
    const id = code.trim();
    if (!id) return;
    window.location.hash = '#/view/' + id;
  }
  return (
    <>
      <input style={{ ...field, marginBottom: 10 }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter your camp code" onKeyDown={(e) => e.key === 'Enter' && open()} autoFocus />
      <button className="login-btn" onClick={open}><i className="ti ti-eye" /> View camp</button>
      <div className="login-foot">No account needed. Demo codes: {db.camps.map((c) => <strong key={c.id} style={{ marginRight: 6 }}>{c.id}</strong>)}</div>
    </>
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
