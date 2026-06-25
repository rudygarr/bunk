import { useState } from 'react';
import { useStore } from '../lib/store';
import { useSession } from '../lib/session';
import { announcementsForCamper } from '../lib/announce';
import Logo from '../components/Logo';
import Wordmark from '../components/Wordmark';
import CamperHome from './CamperHome';
import CamperAlerts from './CamperAlerts';
import CamperSchedule from './CamperSchedule';
import CamperPhotos from './CamperPhotos';
import CamperInfo from './CamperInfo';

type Tab = 'home' | 'schedule' | 'info' | 'photos' | 'alerts';

// The camper-facing side of CampHQ. A signed-in camper sees only their own camp.
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
        <div className="brand"><Logo size={24} /> <span className="brand-name"><Wordmark /></span></div>
        <button className="camper-out" onClick={signOut} title="Sign out"><i className="ti ti-logout" /></button>
      </header>
      <main className="camper-main">
        {tab === 'home' && <CamperHome me={me} />}
        {tab === 'schedule' && <CamperSchedule me={me} />}
        {tab === 'info' && <CamperInfo me={me} />}
        {tab === 'photos' && <CamperPhotos me={me} />}
        {tab === 'alerts' && <CamperAlerts me={me} />}
      </main>
      <nav className="camper-nav">
        <button className={tab === 'home' ? 'on' : ''} onClick={() => setTab('home')}><i className="ti ti-home" /><span>Home</span></button>
        <button className={tab === 'schedule' ? 'on' : ''} onClick={() => setTab('schedule')}><i className="ti ti-calendar-event" /><span>Schedule</span></button>
        <button className={tab === 'info' ? 'on' : ''} onClick={() => setTab('info')}><i className="ti ti-map-2" /><span>Info</span></button>
        <button className={tab === 'photos' ? 'on' : ''} onClick={() => setTab('photos')}><i className="ti ti-photo" /><span>Photos</span></button>
        <button className={tab === 'alerts' ? 'on' : ''} onClick={() => setTab('alerts')}>
          <span className="nav-ic"><i className="ti ti-bell" />{alerts > 0 && <span className="nav-badge">{alerts}</span>}</span><span>Alerts</span>
        </button>
      </nav>
    </div>
  );
}
