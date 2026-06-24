import { useStore } from '../lib/store';
import { useSession } from '../lib/session';
import Logo from '../components/Logo';
import CamperHome from './CamperHome';

// The camper-facing side of Bunk. A signed-in camper sees only their own camp.
export default function CamperApp() {
  const { db } = useStore();
  const { camperId, signOut } = useSession();
  const me = db.attendees.find((a) => a.id === camperId);

  if (!me) {
    // Their row was removed (or a stale session) — bounce to login.
    return (
      <div className="camper">
        <div className="empty" style={{ marginTop: 60 }}>Your account isn’t active. <button className="linklike" onClick={signOut}>Back to login</button></div>
      </div>
    );
  }

  return (
    <div className="camper">
      <header className="camper-top">
        <div className="brand"><Logo size={24} /> <span className="brand-name">Bunk</span></div>
        <button className="camper-out" onClick={signOut} title="Sign out"><i className="ti ti-logout" /></button>
      </header>
      <main className="camper-main">
        <CamperHome me={me} />
      </main>
    </div>
  );
}
