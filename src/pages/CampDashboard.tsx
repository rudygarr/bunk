import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { fmtRange } from '../lib/format';
import { campById, attendeesOf, rsvp, busesOf, cabinsOf, cabinBeds, cabinRoster, rolesOf, coverageGaps, flaggedCount, checkedCount } from '../lib/camps';
import RosterPanel from '../components/RosterPanel';
import BusPanel from '../components/BusPanel';
import CabinPanel from '../components/CabinPanel';
import RolePanel from '../components/RolePanel';
import AttendancePanel from '../components/AttendancePanel';
import AnnouncePanel from '../components/AnnouncePanel';
import SchedulePanel from '../components/SchedulePanel';
import PhotosPanel from '../components/PhotosPanel';
import TeamsPanel from '../components/TeamsPanel';
import PrintPackets from '../components/PrintPackets';

type Tab = 'overview' | 'roster' | 'buses' | 'cabins' | 'roles' | 'attendance' | 'announce' | 'schedule' | 'photos' | 'teams';
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
  { key: 'roster', label: 'Roster', icon: 'ti-users' },
  { key: 'attendance', label: 'Attendance', icon: 'ti-checkbox' },
  { key: 'buses', label: 'Buses', icon: 'ti-bus' },
  { key: 'cabins', label: 'Cabins', icon: 'ti-home' },
  { key: 'teams', label: 'Teams', icon: 'ti-flag' },
  { key: 'roles', label: 'Roles', icon: 'ti-clipboard-check' },
  { key: 'schedule', label: 'Schedule', icon: 'ti-calendar-event' },
  { key: 'announce', label: 'Announce', icon: 'ti-speakerphone' },
  { key: 'photos', label: 'Photos', icon: 'ti-photo' },
];

export default function CampDashboard() {
  const { id } = useParams();
  const nav = useNavigate();
  const { db } = useStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [rosterFilter, setRosterFilter] = useState<'flagged' | undefined>(undefined);
  const camp = campById(db, id ?? '');
  if (!camp) return <div className="empty" style={{ marginTop: 40 }}>Camp not found.</div>;

  // Navigate to a tab, optionally pre-filtering the roster (e.g. medical flags).
  const go = (t: Tab, filter?: 'flagged') => { setRosterFilter(filter); setTab(t); };

  return (
    <>
      <button className="back" onClick={() => nav('/')}><i className="ti ti-chevron-left" /> All camps</button>
      <div className="camp-hero" style={{ ['--accent' as string]: camp.accent ?? 'var(--pine)' }}>
        <div className="camp-hero-row">
          <h1 className="camp-hero-name">{camp.name}</h1>
          <PrintPackets camp={camp} />
        </div>
        <div className="camp-hero-meta">
          <span><i className="ti ti-calendar" /> {fmtRange(camp.startDate, camp.endDate)}</span>
          <span><i className="ti ti-map-pin" /> {camp.location}</span>
        </div>
        {camp.blurb && <div className="camp-hero-blurb">{camp.blurb}</div>}
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={'tab' + (tab === t.key ? ' on' : '')} onClick={() => go(t.key)}>
            <i className={'ti ' + t.icon} /> {t.label}
          </button>
        ))}
      </div>

      <div className="tab-body">
        {tab === 'overview' && <Overview camp={camp} go={go} />}
        {tab === 'roster' && <RosterPanel camp={camp} initialFilter={rosterFilter} />}
        {tab === 'buses' && <BusPanel camp={camp} />}
        {tab === 'cabins' && <CabinPanel camp={camp} />}
        {tab === 'roles' && <RolePanel camp={camp} />}
        {tab === 'attendance' && <AttendancePanel camp={camp} />}
        {tab === 'announce' && <AnnouncePanel camp={camp} />}
        {tab === 'schedule' && <SchedulePanel camp={camp} />}
        {tab === 'photos' && <PhotosPanel camp={camp} />}
        {tab === 'teams' && <TeamsPanel camp={camp} />}
      </div>
    </>
  );
}

function Overview({ camp, go }: { camp: import('../lib/types').Camp; go: (t: Tab, filter?: 'flagged') => void }) {
  const { db } = useStore();
  const r = rsvp(db, camp.id);
  const att = attendeesOf(db, camp.id);
  const buses = busesOf(db, camp.id);
  const cabins = cabinsOf(db, camp.id);
  const totalBeds = cabins.reduce((n, c) => n + cabinBeds(db, c), 0);
  const housed = cabins.reduce((n, c) => n + cabinRoster(db, c.id).length, 0);
  const onBus = att.filter((a) => a.busId).length;
  const roles = rolesOf(db, camp.id);
  const gaps = coverageGaps(db, camp.id);
  const flags = flaggedCount(db, camp.id);
  const pct = r.total ? Math.round((r.accepted / r.total) * 100) : 0;

  return (
    <div className="ov">
      <div className="ov-grid">
        <button className="stat" onClick={() => go('roster')}>
          <div className="stat-top"><span>Attendees</span><i className="ti ti-users" /></div>
          <div className="stat-num">{att.length}</div>
          <div className="stat-sub">{r.accepted} accepted · {r.noReply} no reply</div>
        </button>
        <button className="stat" onClick={() => go('buses')}>
          <div className="stat-top"><span>On a bus</span><i className="ti ti-bus" /></div>
          <div className="stat-num">{onBus}<span className="stat-of">/{att.length}</span></div>
          <div className="stat-sub">{buses.length} bus{buses.length === 1 ? '' : 'es'} chartered</div>
        </button>
        <button className="stat" onClick={() => go('cabins')}>
          <div className="stat-top"><span>Beds filled</span><i className="ti ti-home" /></div>
          <div className="stat-num">{housed}<span className="stat-of">/{totalBeds || '–'}</span></div>
          <div className="stat-sub">{cabins.length} cabin{cabins.length === 1 ? '' : 's'}</div>
        </button>
        <button className={'stat' + (gaps > 0 ? ' alert' : '')} onClick={() => go('roles')}>
          <div className="stat-top"><span>Crew coverage</span><i className="ti ti-clipboard-check" /></div>
          <div className="stat-num">{gaps === 0 ? '✓' : gaps}</div>
          <div className="stat-sub">{roles.length} roles · {gaps === 0 ? 'all shifts covered' : `${gaps} open shift${gaps === 1 ? '' : 's'}`}</div>
        </button>
        <button className={'stat' + (flags > 0 ? ' med' : '')} onClick={() => go('roster', 'flagged')}>
          <div className="stat-top"><span>Medical flags</span><i className="ti ti-medical-cross" /></div>
          <div className="stat-num">{flags}</div>
          <div className="stat-sub">{flags === 0 ? 'none recorded' : 'allergies / meds to know'}</div>
        </button>
        <button className="stat" onClick={() => go('attendance')}>
          <div className="stat-top"><span>On site now</span><i className="ti ti-map-pin-check" /></div>
          <div className="stat-num">{checkedCount(db, camp.id, 'onsite')}<span className="stat-of">/{att.length}</span></div>
          <div className="stat-sub">day-of roll call</div>
        </button>
      </div>

      <div className="ov-rsvp">
        <div className="ov-rsvp-h"><span>RSVPs</span><strong>{pct}% in</strong></div>
        <div className="ov-bar">
          <span className="seg-ok" style={{ width: `${pct}%` }} />
          <span className="seg-maybe" style={{ width: `${r.total ? (r.tentative / r.total) * 100 : 0}%` }} />
          <span className="seg-no" style={{ width: `${r.total ? (r.declined / r.total) * 100 : 0}%` }} />
        </div>
        <div className="ov-rsvp-legend">
          <span><i className="dot ok" /> {r.accepted} in</span>
          <span><i className="dot maybe" /> {r.tentative} maybe</span>
          <span><i className="dot no" /> {r.declined} out</span>
          <span><i className="dot pending" /> {r.noReply} no reply</span>
        </div>
      </div>

      {gaps > 0 && (
        <button className="ov-flag" onClick={() => go('roles')}>
          <i className="ti ti-alert-triangle" /> {gaps} shift{gaps === 1 ? '' : 's'} still need someone — open Roles to fill them
        </button>
      )}
    </div>
  );
}
