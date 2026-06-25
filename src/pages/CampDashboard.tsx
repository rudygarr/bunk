import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { fmtRange } from '../lib/format';
import { campById, attendeesOf, rsvp, busesOf, cabinsOf, cabinBeds, cabinRoster, rolesOf, coverageGaps, flaggedCount, checkedCount, hasFeature } from '../lib/camps';
import RosterPanel from '../components/RosterPanel';
import BusPanel from '../components/BusPanel';
import CabinPanel from '../components/CabinPanel';
import RolePanel from '../components/RolePanel';
import AttendancePanel from '../components/AttendancePanel';
import AnnouncePanel from '../components/AnnouncePanel';
import SchedulePanel from '../components/SchedulePanel';
import PhotosPanel from '../components/PhotosPanel';
import TeamsPanel from '../components/TeamsPanel';
import SmallGroupPanel from '../components/SmallGroupPanel';
import InfoPanel from '../components/InfoPanel';
import PrintPackets from '../components/PrintPackets';
import CampSettings from '../components/CampSettings';
import type { FeatureKey } from '../lib/types';

type Tab = 'overview' | 'roster' | 'buses' | 'cabins' | 'smallGroups' | 'roles' | 'attendance' | 'announce' | 'schedule' | 'photos' | 'teams' | 'info';
// Each tab maps to a feature flag (or null when it's always shown).
const TABS: { key: Tab; label: string; icon: string; feature: FeatureKey | null }[] = [
  { key: 'overview', label: 'Overview', icon: 'ti-layout-dashboard', feature: null },
  { key: 'roster', label: 'Roster', icon: 'ti-users', feature: null },
  { key: 'attendance', label: 'Attendance', icon: 'ti-checkbox', feature: 'attendance' },
  { key: 'buses', label: 'Buses', icon: 'ti-bus', feature: 'buses' },
  { key: 'cabins', label: 'Cabins', icon: 'ti-home', feature: 'cabins' },
  { key: 'smallGroups', label: 'Groups', icon: 'ti-users-group', feature: 'smallGroups' },
  { key: 'teams', label: 'Teams', icon: 'ti-flag', feature: 'teams' },
  { key: 'roles', label: 'Roles', icon: 'ti-clipboard-check', feature: 'roles' },
  { key: 'schedule', label: 'Schedule', icon: 'ti-calendar-event', feature: 'schedule' },
  { key: 'announce', label: 'Announce', icon: 'ti-speakerphone', feature: 'announce' },
  { key: 'photos', label: 'Photos', icon: 'ti-photo', feature: 'photos' },
  { key: 'info', label: 'Info', icon: 'ti-map-2', feature: 'info' },
];

export default function CampDashboard() {
  const { id } = useParams();
  const nav = useNavigate();
  const { db } = useStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [rosterFilter, setRosterFilter] = useState<'flagged' | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const camp = campById(db, id ?? '');
  if (!camp) return <div className="empty" style={{ marginTop: 40 }}>Camp not found.</div>;

  const tabs = TABS.filter((t) => t.feature === null || hasFeature(camp, t.feature));
  // If the active tab's feature was just turned off, fall back to overview.
  const activeTab: Tab = tabs.some((t) => t.key === tab) ? tab : 'overview';

  // Navigate to a tab, optionally pre-filtering the roster (e.g. medical flags).
  const go = (t: Tab, filter?: 'flagged') => { setRosterFilter(filter); setTab(t); };

  return (
    <>
      <button className="back" onClick={() => nav('/')}><i className="ti ti-chevron-left" /> All camps</button>
      <div className="camp-hero" style={{ ['--accent' as string]: camp.accent ?? 'var(--pine)' }}>
        <div className="camp-hero-row">
          <h1 className="camp-hero-name">{camp.name}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="iconbtn" title={copied ? 'Link copied!' : 'Share public view'} onClick={() => {
              const url = `${location.origin}${location.pathname}#/view/${camp.id}`;
              navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
            }}><i className={'ti ' + (copied ? 'ti-check' : 'ti-share')} /></button>
            <button className="iconbtn" title="Camp features" onClick={() => setShowSettings(true)}><i className="ti ti-settings" /></button>
            <PrintPackets camp={camp} />
          </div>
        </div>
        <div className="camp-hero-meta">
          <span><i className="ti ti-calendar" /> {fmtRange(camp.startDate, camp.endDate)}</span>
          <span><i className="ti ti-map-pin" /> {camp.location}</span>
        </div>
        {camp.blurb && <div className="camp-hero-blurb">{camp.blurb}</div>}
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={'tab' + (activeTab === t.key ? ' on' : '')} onClick={() => go(t.key)}>
            <i className={'ti ' + t.icon} /> {t.label}
          </button>
        ))}
      </div>

      <div className="tab-body">
        {activeTab === 'overview' && <Overview camp={camp} go={go} />}
        {activeTab === 'roster' && <RosterPanel camp={camp} initialFilter={rosterFilter} />}
        {activeTab === 'buses' && <BusPanel camp={camp} />}
        {activeTab === 'cabins' && <CabinPanel camp={camp} />}
        {activeTab === 'roles' && <RolePanel camp={camp} />}
        {activeTab === 'attendance' && <AttendancePanel camp={camp} />}
        {activeTab === 'announce' && <AnnouncePanel camp={camp} />}
        {activeTab === 'schedule' && <SchedulePanel camp={camp} />}
        {activeTab === 'photos' && <PhotosPanel camp={camp} />}
        {activeTab === 'teams' && <TeamsPanel camp={camp} />}
        {activeTab === 'smallGroups' && <SmallGroupPanel camp={camp} />}
        {activeTab === 'info' && <InfoPanel camp={camp} />}
      </div>

      {showSettings && <CampSettings camp={camp} onClose={() => setShowSettings(false)} />}
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
