import { useStore } from '../lib/store';
import { scheduleForCamper, byDay, fmtClock } from '../lib/schedule';
import { fmtDateLong } from '../lib/format';
import type { Attendee, AudienceKind } from '../lib/types';

const TAG: Record<AudienceKind, string> = { everyone: '', bus: 'Your bus', cabin: 'Your cabin', person: 'Just for you' };

export default function CamperSchedule({ me }: { me: Attendee }) {
  const { db } = useStore();
  const groups = byDay(scheduleForCamper(db, me));
  return (
    <>
      <div className="c-hello" style={{ fontSize: 20 }}>Schedule</div>
      {groups.length === 0 && <div className="empty" style={{ marginTop: 30 }}>No schedule posted yet.</div>}
      {groups.map((g) => (
        <div key={g.day} className="c-sch-day">
          <div className="c-sch-day-h">{fmtDateLong(g.day)}</div>
          {g.items.map((s) => (
            <div key={s.id} className="c-sch-item">
              <div className="c-sch-time">{fmtClock(s.start)}</div>
              <div className="c-sch-body">
                <div className="c-sch-title">{s.title}{s.audienceKind !== 'everyone' && <span className="c-sch-tag">{TAG[s.audienceKind]}</span>}</div>
                <div className="c-sch-meta">{[s.end ? `until ${fmtClock(s.end)}` : '', s.location].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
