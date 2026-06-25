import { useState } from 'react';
import { useStore } from '../lib/store';
import { useSession } from '../lib/session';
import { busesOf, busLabel } from '../lib/camps';
import { busRoll, busCaptains } from '../lib/rollcall';
import { field } from './Modal';
import RollCallBus from './RollCallBus';
import type { Camp, Bus } from '../lib/types';

// Organizer fleet view: every bus with its roll-call color + missing badge,
// grouped by wave. Tap a bus to run roll call / see who's missing.
export default function RollCallPanel({ camp }: { camp: Camp }) {
  const { db, updateCamp } = useStore();
  const { user } = useSession();
  const buses = busesOf(db, camp.id);
  const [open, setOpen] = useState<Bus | null>(null);
  const live = db.camps.find((c) => c.id === camp.id) ?? camp;

  // Group buses by wave label (or "Buses" when unset).
  const groups = new Map<string, Bus[]>();
  for (const b of buses) { const k = b.groupName || 'Buses'; (groups.get(k) ?? groups.set(k, []).get(k)!).push(b); }

  if (open) {
    return (
      <div className="panel">
        <button className="back" onClick={() => setOpen(null)}><i className="ti ti-chevron-left" /> All buses</button>
        <RollCallBus camp={camp} bus={open} author={user.name} canManage />
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head"><div className="panel-title"><i className="ti ti-list-check" /> Roll call</div></div>

      {buses.length === 0 && <div className="empty">Add buses first — roll call counts riders on each one.</div>}

      {[...groups.entries()].map(([label, list]) => (
        <div key={label} className="rc-group">
          {groups.size > 1 && <div className="rc-group-h">{label}</div>}
          <div className="rc-fleet">
            {list.map((b) => {
              const roll = busRoll(db, b);
              const caps = busCaptains(db, b);
              return (
                <button key={b.id} className={'rc-card ' + roll.tone} onClick={() => setOpen(b)}>
                  <span className="rc-busicon lg">
                    <i className="ti ti-bus" />
                    {roll.rolled && roll.missing > 0 && <span className="rc-busbadge">{roll.missing}</span>}
                    {roll.tone === 'ready' && <span className="rc-buscheck"><i className="ti ti-check" /></span>}
                  </span>
                  <span className="rc-card-main">
                    <span className="rc-card-name">{busLabel(b)}</span>
                    <span className="rc-card-sub">{!roll.rolled ? 'Not started' : roll.missing === 0 ? 'Everyone aboard' : `${roll.missing} of ${roll.total} missing`}{caps.length ? ` · ${caps.map((c) => c.name.split(' ')[0]).join(', ')}` : ''}</span>
                  </span>
                  <i className="ti ti-chevron-right" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {buses.length > 0 && (
        <div className="rc-chat">
          <div className="info-block-h">Captains' group chat (link-out)</div>
          <div className="page-sub" style={{ fontSize: 12.5, margin: '0 0 8px' }}>Point captains at the WhatsApp/iMessage group they already use.</div>
          <input style={field} defaultValue={live.captainsChatUrl ?? ''} onBlur={(e) => updateCamp(camp.id, { captainsChatUrl: e.target.value.trim() || undefined })} placeholder="Paste a group-chat invite link" />
          {live.captainsChatUrl && <a className="btn-soft sm" style={{ marginTop: 8 }} href={live.captainsChatUrl} target="_blank" rel="noopener noreferrer"><i className="ti ti-message-circle" /> Open captains' chat</a>}
        </div>
      )}
    </div>
  );
}
