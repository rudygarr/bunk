import { useParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { campById } from '../lib/camps';
import { scheduleOf, daysOf, fmtClock } from '../lib/schedule';
import { announcementsOf } from '../lib/announce';
import { standings } from '../lib/teams';
import { packingByCategory } from '../lib/packing';
import { fmtRange, fmtDate } from '../lib/format';
import Logo from '../components/Logo';
import Wordmark from '../components/Wordmark';

// The public, no-account camp view reached by a code/link. PII-free by design:
// only camp-wide info shows — schedule, map, packing, all-camp announcements,
// and team standings. Personal assignments require an account.
export default function Viewer() {
  const { id } = useParams();
  const { db } = useStore();
  const camp = campById(db, id ?? '');

  if (!camp) {
    return (
      <div className="viewer">
        <div className="viewer-top"><Logo /> <Wordmark /></div>
        <div className="rsvp-gone" style={{ marginTop: 40 }}>No camp found for that code.</div>
      </div>
    );
  }

  const schedule = scheduleOf(db, camp.id).filter((s) => s.audienceKind === 'everyone');
  const days = daysOf(schedule);
  const anns = announcementsOf(db, camp.id).filter((a) => a.audienceKind === 'everyone');
  const ranked = standings(db, camp.id);
  const packing = packingByCategory(db, camp.id);

  return (
    <div className="viewer">
      <div className="viewer-top"><Logo /> <Wordmark /><span className="viewer-badge">Public view</span></div>

      <div className="viewer-hero" style={{ ['--accent' as string]: camp.accent ?? 'var(--pine)' }}>
        <h1 className="camp-hero-name">{camp.name}</h1>
        <div className="camp-hero-meta">
          <span><i className="ti ti-calendar" /> {fmtRange(camp.startDate, camp.endDate)}</span>
          <span><i className="ti ti-map-pin" /> {camp.location}</span>
        </div>
        {camp.blurb && <div className="camp-hero-blurb">{camp.blurb}</div>}
      </div>

      {anns.length > 0 && (
        <section className="viewer-sec">
          <h2><i className="ti ti-speakerphone" /> Announcements</h2>
          {anns.slice(0, 5).map((a) => (
            <div key={a.id} className="viewer-ann">{a.pinned && <i className="ti ti-pin-filled" />}{a.title && <strong>{a.title} · </strong>}{a.body}</div>
          ))}
        </section>
      )}

      {days.length > 0 && (
        <section className="viewer-sec">
          <h2><i className="ti ti-calendar-event" /> Schedule</h2>
          {days.map((d, i) => (
            <div key={d} className="viewer-day">
              <div className="viewer-day-h">Day {i + 1} · {fmtDate(d)}</div>
              {schedule.filter((s) => s.day === d).map((s) => (
                <div key={s.id} className="viewer-row"><span className="viewer-time">{fmtClock(s.start)}</span><span>{s.title}{s.location ? ` · ${s.location}` : ''}</span></div>
              ))}
            </div>
          ))}
        </section>
      )}

      {ranked.length > 0 && (
        <section className="viewer-sec">
          <h2><i className="ti ti-flag" /> Team standings</h2>
          {ranked.map((t, i) => (
            <div key={t.id} className="viewer-team" style={{ ['--tc' as string]: t.color }}>
              <span className="viewer-rank">{i + 1}</span><span className="tm-dot" /><span className="viewer-team-name">{t.name}</span><span className="viewer-pts">{t.points} pts</span>
            </div>
          ))}
        </section>
      )}

      {camp.mapUrl && (
        <section className="viewer-sec">
          <h2><i className="ti ti-map-2" /> Camp map</h2>
          <img className="viewer-map" src={camp.mapUrl} alt="Camp map" />
        </section>
      )}

      {packing.length > 0 && (
        <section className="viewer-sec">
          <h2><i className="ti ti-luggage" /> Packing list</h2>
          {packing.map((g) => (
            <div key={g.category} className="viewer-pack">
              <div className="viewer-pack-h">{g.category}</div>
              <ul>{g.items.map((it) => <li key={it.id}>{it.text}</li>)}</ul>
            </div>
          ))}
        </section>
      )}

      <div className="viewer-foot">
        Want your own bus, cabin, and team assignments? <strong>Download CampHQ and sign in.</strong>
      </div>
    </div>
  );
}
