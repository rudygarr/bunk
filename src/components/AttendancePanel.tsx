import { useState } from 'react';
import { useStore } from '../lib/store';
import { initials } from '../lib/format';
import { attendeesOf, busesOf, busRoster, isFlagged, CHECK_STAGES } from '../lib/camps';
import type { Camp, CheckStage, Attendee } from '../lib/types';

// Day-of roll call. Pick a stage (boarding out / on site / boarding back) and
// check people off — grouped by bus so a monitor can clear their whole bus.
export default function AttendancePanel({ camp }: { camp: Camp }) {
  const { db, setCheckIn } = useStore();
  const [stage, setStage] = useState<CheckStage>('depart');
  const all = attendeesOf(db, camp.id);
  const buses = busesOf(db, camp.id);
  const noBus = all.filter((a) => !a.busId);

  const checked = all.filter((a) => a.checkIn?.[stage]).length;
  const missing = all.length - checked;

  const groups: { label: string; key: string; people: Attendee[] }[] = [
    ...buses.map((b) => ({ label: b.label ? `${b.name} · ${b.label}` : b.name, key: b.id, people: busRoster(db, b.id) })),
    ...(noBus.length ? [{ label: 'No bus / on their own', key: 'none', people: noBus }] : []),
  ];

  function checkGroup(people: Attendee[], on: boolean) {
    for (const p of people) setCheckIn(p.id, stage, on);
  }

  return (
    <div>
      <div className="att-stages">
        {CHECK_STAGES.map((s) => (
          <button key={s.key} className={'att-stage' + (stage === s.key ? ' on' : '')} onClick={() => setStage(s.key)}>
            <i className={'ti ' + s.icon} /> {s.label}
          </button>
        ))}
      </div>

      <div className={'att-summary' + (missing > 0 ? ' has-missing' : ' clear')}>
        <div className="att-count"><strong>{checked}</strong> / {all.length} accounted for</div>
        {missing > 0 ? <div className="att-missing"><i className="ti ti-alert-triangle" /> {missing} not checked in</div> : <div className="att-allclear"><i className="ti ti-circle-check" /> All accounted for</div>}
      </div>

      {groups.map((g) => {
        const inGroup = g.people.filter((p) => p.checkIn?.[stage]).length;
        return (
          <div key={g.key} className="att-group">
            <div className="att-group-h">
              <span className="att-group-name">{g.label}</span>
              <span className={'fill' + (inGroup < g.people.length ? ' full' : '')}>{inGroup}/{g.people.length}</span>
              <button className="att-all" onClick={() => checkGroup(g.people, inGroup < g.people.length)}>
                {inGroup < g.people.length ? 'Check all' : 'Clear all'}
              </button>
            </div>
            <div className="att-rows">
              {g.people.map((a) => {
                const on = !!a.checkIn?.[stage];
                return (
                  <button key={a.id} className={'att-row' + (on ? ' on' : '')} onClick={() => setCheckIn(a.id, stage, !on)}>
                    <span className={'att-check' + (on ? ' on' : '')}><i className={'ti ' + (on ? 'ti-check' : 'ti-circle')} /></span>
                    <span className="avatar sm">{initials(a.name)}</span>
                    <span className="att-name">{a.name}{isFlagged(a) && <i className="ti ti-medical-cross med-flag" title="Medical flag" />}</span>
                    {a.role && <span className="att-role">{a.role}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
