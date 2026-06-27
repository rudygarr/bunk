import { useState } from 'react';
import { useStore } from '../lib/store';
import { packingByCategory, packingOf } from '../lib/packing';
import type { Attendee } from '../lib/types';

// "Are you packed?" — the camper's own checklist with remembered progress, plus
// a link to the camp's packing PDF if the organizer uploaded one instead.
export default function PackedCard({ me }: { me: Attendee }) {
  const { db, togglePacked } = useStore();
  const [open, setOpen] = useState(false);
  const items = packingOf(db, me.campId);
  const groups = packingByCategory(db, me.campId);
  const packed = new Set(me.packed ?? []);
  const done = items.filter((i) => packed.has(i.id)).length;
  const total = items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  // A packing PDF/link the organizer uploaded (camper- or everyone-facing).
  const pdf = (db.docs ?? []).find(
    (d) => d.campId === me.campId && /pack/i.test(d.title) && (d.audience === 'everyone' || d.audience === 'campers'),
  );

  if (total === 0 && !pdf) return null;

  return (
    <div className={'c-card c-packed' + (allDone ? ' done' : '')}>
      <button className="c-packed-head" onClick={() => setOpen((v) => !v)}>
        <span className="c-card-h" style={{ margin: 0 }}><i className="ti ti-briefcase" /> Are you packed?</span>
        {total > 0 ? (
          <span className="c-packed-prog">{allDone ? <><i className="ti ti-circle-check" /> All set!</> : `${done}/${total}`}</span>
        ) : (
          <i className="ti ti-chevron-right" />
        )}
      </button>

      {total > 0 && (
        <div className="c-packed-bar"><span style={{ width: `${pct}%` }} className={allDone ? 'done' : ''} /></div>
      )}

      {pdf && (
        <a className="album-open" style={{ marginTop: 10 }} href={pdf.url} target="_blank" rel="noopener noreferrer">
          <i className="ti ti-file-text" /> Open packing list{pdf.external ? '' : ' (PDF)'}
        </a>
      )}

      {total > 0 && open && (
        <div className="c-packlist">
          {groups.map((g) => (
            <div key={g.category} className="c-pack-group">
              <div className="c-pack-cat">{g.category}</div>
              {g.items.map((it) => {
                const on = packed.has(it.id);
                return (
                  <button key={it.id} className={'c-pack-item' + (on ? ' on' : '')} onClick={() => togglePacked(me.id, it.id)}>
                    <i className={'ti ' + (on ? 'ti-checkbox' : 'ti-square')} />
                    <span>{it.text}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {total > 0 && !open && <button className="c-packed-toggle" onClick={() => setOpen(true)}>{done === 0 ? 'Start packing →' : 'See your list →'}</button>}
    </div>
  );
}
