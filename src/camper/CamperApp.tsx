import { useState } from 'react';
import { useStore } from '../lib/store';
import { useSession } from '../lib/session';
import { announcementsForCamper } from '../lib/announce';
import Logo from '../components/Logo';
import CamperHome from './CamperHome';
import CamperAlerts from './CamperAlerts';

type Tab = 'home' | 'alerts';

// The camper-facing side of Bunk. A signed-in camper sees only their own camp.
export default function CamperApp() {
  const { db } = useStore();
  const { camperId, signOut } = useSession();
  const [tab, setTab] = useState<Tab>('home');
  const me = db.attendees.find((a) => a.id === camperId);

  if (!me) {
    return (
      <div className="camper">
        <div className="empty" style={{ marginTop: 60 }}>Your account isn’t active. <button className="linklike" onClick={signOut}>Back to login</button></div>
      </div>
    );
  }

  const alerts = announcementsForCamper(db, me).length;

  return (
    <div className="camper">
      <header className="camper-top">
        <div className="brand"><Logo size={24} /> <span className="brand-name">Bunk</span></div>
        <button className="camper-out" onClick={signOut} title="Sign out"><i className="ti ti-logout" /></button>
      </header>
      <main className="camper-main">
        {tab === 'home' && <CamperHome me={me} />}
        {tab === 'alerts' && <CamperAlerts me={me} />}
      </main>
      <nav className="camper-nav">
        <button className={tab === 'home' ? 'on' : ''} onClick={() => setTab('home')}><i className="ti ti-home" /><span>Home</span></button>
        <button className={tab === 'alerts' ? 'on' : ''} onClick={() => setTab('alerts')}>
          <span className="nav-ic"><i className="ti ti-bell" />{alerts > 0 && <span className="nav-badge">{alerts}</span>}</span><span>Alerts</span>
        </button>
      </nav>
    </div>
  );
}
