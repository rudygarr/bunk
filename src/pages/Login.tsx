import { useState } from 'react';
import { useSession } from '../lib/session';
import { useStore } from '../lib/store';
import Wordmark from '../components/Wordmark';
import { field } from '../components/Modal';

// One sign-in for everyone. Campers, leaders, and organizers all sign in the
// same way — once authenticated, the store auto-routes each person to the right
// view (own a camp → organizer; on a published roster → camper; neither → a
// "create or join" home). A separate code entry opens the no-account viewer.
export default function Login() {
  const [viewer, setViewer] = useState(false);
  return (
    <div className="login">
      <div className="login-card">
        <img className="login-splash" src="./splash.png" alt="CampHQ" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <h1 className="login-title"><Wordmark /></h1>
        <p className="login-tag">Everything for your camp — all in one place.</p>

        {viewer ? (
          <>
            <ViewerEntry />
            <div className="login-foot"><button className="login-link" onClick={() => setViewer(false)}>← Back to sign in</button></div>
          </>
        ) : (
          <>
            <OrganizerAuth />
            <div className="login-foot">Have a camp code? <button className="login-link" onClick={() => setViewer(true)}>View a camp →</button></div>
          </>
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
        {isNew ? 'Already have an account? Sign in' : 'First time here? Create an account'}
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
