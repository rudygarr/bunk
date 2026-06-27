import { useState } from 'react';
import { useStore } from '../lib/store';
import { scheduleForCamper, daysOf, nowNext, todayKey, fmtClock, blockMeta } from '../lib/schedule';
import { fmtDate } from '../lib/format';
import type { Attendee, AudienceKind } from '../lib/types';

const TAG: Record<AudienceKind, string> = { everyone: '', bus: 'Your bus', cabin: 'Your cabin', team: 'Your team', smallGroup: 'Your group', volunteers: 'Volunteers', person: 'Just for you', custom: 'For you' };

export default function CamperSchedule({ me }: { me: Attendee }) {
  const { db } = useStore();
  const items = scheduleForCamper(db, me);
  const days = daysOf(items);
  const today = todayKey();
  const [day, setDay] = useState(() => (days.includes(today) ? today : days[0]));

  if (days.length === 0) return (<><div className="c-hello" style={{ fontSize: 20 }}>Schedule</div><div className="empty" style={{ marginTop: 30 }}>No schedule posted yet.</div></>);

  const active = days.includes(day) ? day : days[0];
  const dayItems = items.filter((s) => s.day === active);
  const { nowId, nextId } = nowNext(dayItems, active);

  return (
    <>
      <div className="c-hello" style={{ fontSize: 20 }}>Schedule</div>

      <div className="c-day-tabs">
        {days.map((d, i) => (
          <button key={d} className={'c-day-tab' + (d === active ? ' on' : '')} onClick={() => setDay(d)}>
            <span className="c-day-tab-d">Day {i + 1}</span>
            <span className="c-day-tab-date">{fmtDate(d)}{d === today ? ' · today' : ''}</span>
          </button>
        ))}
      </div>

      <div className="c-timeline">
        {dayItems.map((s) => {
          const state = s.id === nowId ? 'now' : s.id === nextId ? 'next' : '';
          return (
            <div key={s.id} className={'c-tl-item ' + state}>
              <div className="c-tl-time">{fmtClock(s.start)}{s.end && <span className="c-tl-end">{fmtClock(s.end)}</span>}</div>
              <div className="c-tl-line"><span className="c-tl-dot" style={state ? undefined : { background: blockMeta(s.type).tint }} /></div>
              <div className="c-tl-card">
                {state && <span className={'c-tl-badge ' + state}>{state === 'now' ? 'Now' : 'Up next'}</span>}
                <div className="c-tl-title"><i className={'ti ' + blockMeta(s.type).icon} style={{ color: blockMeta(s.type).tint, marginRight: 7 }} />{s.title}</div>
                <div className="c-tl-meta">
                  {s.location && <span><i className="ti ti-map-pin" /> {s.location}</span>}
                  {s.audienceKind !== 'everyone' && <span className="c-tl-tag">{TAG[s.audienceKind]}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
