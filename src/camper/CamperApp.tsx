import { useState } from 'react';
import { useStore } from '../lib/store';
import { useSession } from '../lib/session';
import { announcementsForCamper } from '../lib/announce';
import { busCaptainedBy } from '../lib/rollcall';
import { campById } from '../lib/camps';
import Logo from '../components/Logo';
import Wordmark from '../components/Wordmark';
import RollCallBus from '../components/RollCallBus';
import CamperHome from './CamperHome';
import CamperAlerts from './CamperAlerts';
import CamperSchedule from './CamperSchedule';
import CamperPhotos from './CamperPhotos';
import CamperInfo from './CamperInfo';

type Tab = 'home' | 'schedule' | 'info' | 'photos' | 'alerts' | 'rollcall';

// The camper-facing side of CampHQ. A signed-in camper sees only their own camp.
export default function CamperApp() {
  const { db } = useStore();
  const { camperId, signOut } = useSession();
  const [tab, setTab] = useState<Tab>('home');
  // Which announcement ids this camper has already seen (id-based so it's robust
  // to the demo's mixed real/seed dates). Persisted per camper.
  const seenKey = `camphq-seen-${camperId}`;
  const [seen, setSeen] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem(seenKey) || '[]')); } catch { return new Set(); }
  });
  const me = db.attendees.find((a) => a.id === camperId);

  if (!me) {
    return (
      <div className="camper">
        <div className="empty" style={{ marginTop: 60 }}>Your account isn’t active. <button className="linklike" onClick={signOut}>Back to login</button></div>
      </div>
    );
  }

  const myAnns = announcementsForCamper(db, me);
  const unread = myAnns.filter((a) => !seen.has(a.id)).length;
  const myBus = busCaptainedBy(db, me.campId, me.id); // set if this person is a bus captain
  const camp = campById(db, me.campId);

  // Opening Alerts marks everything currently visible as seen.
  function go(t: Tab) {
    if (t === 'alerts' && unread > 0) {
      const ids = new Set(seen);
      myAnns.forEach((a) => ids.add(a.id));
      setSeen(ids);
      try { localStorage.setItem(seenKey, JSON.stringify([...ids])); } catch { /* ignore */ }
    }
    setTab(t);
  }

  return (
    <div className="camper">
      <header className="camper-top">
        {(() => { const camp = db.camps.find((c) => c.id === me.campId); return camp?.logoUrl
          ? <img className="camper-camp-logo" src={camp.logoUrl} alt={camp.name} />
          : <div className="brand"><Logo size={24} /> <span className="brand-name"><Wordmark /></span></div>; })()}
        <button className="camper-out" onClick={signOut} title="Sign out"><i className="ti ti-logout" /></button>
      </header>
      <main className="camper-main">
        {tab === 'home' && <CamperHome me={me} />}
        {tab === 'schedule' && <CamperSchedule me={me} />}
        {tab === 'info' && <CamperInfo me={me} />}
        {tab === 'photos' && <CamperPhotos me={me} />}
        {tab === 'alerts' && <CamperAlerts me={me} />}
        {tab === 'rollcall' && myBus && camp && (
          <>
            <div className="c-hello" style={{ fontSize: 20, marginBottom: 12 }}>Roll call</div>
            <RollCallBus camp={camp} bus={myBus} author={me.name} />
          </>
        )}
      </main>
      <nav className="camper-nav">
        <button className={tab === 'home' ? 'on' : ''} onClick={() => go('home')}><i className="ti ti-home" /><span>Home</span></button>
        {myBus && <button className={tab === 'rollcall' ? 'on' : ''} onClick={() => go('rollcall')}><i className="ti ti-list-check" /><span>Roll call</span></button>}
        <button className={tab === 'schedule' ? 'on' : ''} onClick={() => go('schedule')}><i className="ti ti-calendar-event" /><span>Schedule</span></button>
        <button className={tab === 'info' ? 'on' : ''} onClick={() => go('info')}><i className="ti ti-map-2" /><span>Info</span></button>
        <button className={tab === 'photos' ? 'on' : ''} onClick={() => go('photos')}><i className="ti ti-photo" /><span>Photos</span></button>
        <button className={tab === 'alerts' ? 'on' : ''} onClick={() => go('alerts')}>
          <span className="nav-ic"><i className="ti ti-bell" />{unread > 0 && <span className="nav-badge">{unread}</span>}</span><span>Alerts</span>
        </button>
      </nav>
    </div>
  );
}
