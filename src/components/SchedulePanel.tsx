import { useState } from 'react';
import { useStore } from '../lib/store';
import { scheduleOf, byDay, fmtClock } from '../lib/schedule';
import { audienceLabel } from '../lib/announce';
import { busesOf, cabinsOf, attendeesOf } from '../lib/camps';
import { teamsOf } from '../lib/teams';
import { fmtDateLong } from '../lib/format';
import { field } from './Modal';
import type { Camp, AudienceKind } from '../lib/types';

const AUD_ICON: Record<AudienceKind, string> = { everyone: 'ti-world', bus: 'ti-bus', cabin: 'ti-home', team: 'ti-flag', person: 'ti-user' };

export default function SchedulePanel({ camp }: { camp: Camp }) {
  const { db, addScheduleItem, removeScheduleItem } = useStore();
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(camp.startDate);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('');
  const [titleV, setTitleV] = useState('');
  const [loc, setLoc] = useState('');
  const [kind, setKind] = useState<AudienceKind>('everyone');
  const [audId, setAudId] = useState('');

  const groups = byDay(scheduleOf(db, camp.id));
  const buses = busesOf(db, camp.id);
  const cabins = cabinsOf(db, camp.id);
  const teams = teamsOf(db, camp.id);
  const people = attendeesOf(db, camp.id);

  function add() {
    if (!titleV.trim() || !start || (kind !== 'everyone' && !audId)) return;
    addScheduleItem(camp.id, { day, start, end: end || undefined, title: titleV.trim(), location: loc.trim() || undefined, audienceKind: kind, audienceId: kind === 'everyone' ? undefined : audId });
    setTitleV(''); setLoc('');
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title"><i className="ti ti-calendar-event" /> Schedule</div>
        <button className="btn-primary sm" onClick={() => setOpen((v) => !v)}><i className={'ti ' + (open ? 'ti-x' : 'ti-plus')} /> {open ? 'Close' : 'Add item'}</button>
      </div>

      {open && (
        <div className="ann-compose">
          <div style={{ display: 'flex', gap: 8 }}>
            <label className="flabel" style={{ flex: 1.4 }}>Day<input type="date" style={{ ...field, appearance: 'auto' }} value={day} min={camp.startDate} max={camp.endDate} onChange={(e) => setDay(e.target.value)} /></label>
            <label className="flabel" style={{ flex: 1 }}>Start<input type="time" style={{ ...field, appearance: 'auto' }} value={start} onChange={(e) => setStart(e.target.value)} /></label>
            <label className="flabel" style={{ flex: 1 }}>End<input type="time" style={{ ...field, appearance: 'auto' }} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          </div>
          <input style={{ ...field, marginTop: 8 }} value={titleV} onChange={(e) => setTitleV(e.target.value)} placeholder="What's happening? e.g. Campfire & worship" />
          <input style={{ ...field, marginTop: 8 }} value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Location (optional)" />
          <div className="seg" style={{ marginTop: 8 }}>
            {(['everyone', 'bus', 'cabin', 'team', 'person'] as AudienceKind[]).map((k) => (
              <button key={k} className={kind === k ? 'on' : ''} onClick={() => { setKind(k); setAudId(''); }}><i className={'ti ' + AUD_ICON[k]} /> {k === 'everyone' ? 'Everyone' : k[0].toUpperCase() + k.slice(1)}</button>
            ))}
          </div>
          {kind !== 'everyone' && (
            <select style={{ ...field, appearance: 'auto', marginTop: 8 }} value={audId} onChange={(e) => setAudId(e.target.value)}>
              <option value="">{kind === 'bus' ? 'Pick a bus…' : kind === 'cabin' ? 'Pick a cabin…' : kind === 'team' ? 'Pick a team…' : 'Pick a person…'}</option>
              {kind === 'bus' && buses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              {kind === 'cabin' && cabins.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              {kind === 'team' && teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              {kind === 'person' && people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <button className="btn-primary" style={{ marginTop: 10, width: '100%', justifyContent: 'center', opacity: titleV.trim() && (kind === 'everyone' || audId) ? 1 : 0.5 }} disabled={!titleV.trim() || (kind !== 'everyone' && !audId)} onClick={add}>
            <i className="ti ti-plus" /> Add to schedule
          </button>
        </div>
      )}

      {groups.length === 0 && <div className="empty">No schedule yet — add the first item.</div>}
      {groups.map((g) => (
        <div key={g.day} className="sch-day">
          <div className="sch-day-h">{fmtDateLong(g.day)}</div>
          {g.items.map((s) => (
            <div key={s.id} className="sch-item">
              <div className="sch-time">{fmtClock(s.start)}{s.end ? <span className="sch-end">{fmtClock(s.end)}</span> : null}</div>
              <div className="sch-main">
                <div className="sch-title">{s.title}</div>
                <div className="sch-meta">
                  {s.location && <span><i className="ti ti-map-pin" /> {s.location}</span>}
                  {s.audienceKind !== 'everyone' && <span className={'ann-tag ' + s.audienceKind}><i className={'ti ' + AUD_ICON[s.audienceKind]} /> {audienceLabel(db, s)}</span>}
                </div>
              </div>
              <button className="sch-del" title="Remove" onClick={() => removeScheduleItem(s.id)}><i className="ti ti-x" /></button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
