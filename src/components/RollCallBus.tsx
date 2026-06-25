import { useState } from 'react';
import { useStore } from '../lib/store';
import { busRoster, busLabel } from '../lib/camps';
import { busRoll } from '../lib/rollcall';
import { initials } from '../lib/format';
import { field } from './Modal';
import type { Camp, Bus } from '../lib/types';

const PRESETS = [
  'Bathroom stop only — 15 min, then back on the road.',
  'Last stop until we arrive in 4 hours.',
  'Lunch stop — 1 hour. Plan accordingly!',
];

// The roll-call screen for one bus — used by organizers and by the bus's
// captains in the camper app. Empty the bus, tap riders back on, see who's
// missing, and message the bus. `canManage` adds captain/group/tracking setup.
export default function RollCallBus({ camp, bus, author, canManage = false }: { camp: Camp; bus: Bus; author: string; canManage?: boolean }) {
  const { db, emptyBus, markAllAboard, setOnBoard, postAnnouncement, updateBus, toggleCaptain } = useStore();
  const live = db.buses.find((b) => b.id === bus.id) ?? bus;
  const riders = busRoster(db, live.id);
  const roll = busRoll(db, live);
  const [msg, setMsg] = useState('');
  const [setup, setSetup] = useState(false);

  function send(text: string) {
    const body = text.trim();
    if (!body) return;
    postAnnouncement(camp.id, { body, audienceKind: 'bus', audienceId: live.id, author });
    setMsg('');
  }

  return (
    <div className="rc-bus">
      <div className={'rc-bus-head ' + roll.tone}>
        <div className="rc-bus-id">
          <span className="rc-busicon"><i className="ti ti-bus" />{roll.rolled && roll.missing > 0 && <span className="rc-busbadge">{roll.missing}</span>}{roll.tone === 'ready' && <span className="rc-buscheck"><i className="ti ti-check" /></span>}</span>
          <div><div className="rc-bus-name">{busLabel(live)}</div><div className="rc-bus-sub">{live.groupName ? `${live.groupName} · ` : ''}{roll.onboard}/{roll.total} aboard</div></div>
        </div>
        <span className={'rc-status ' + roll.tone}>{!roll.rolled ? 'Not started' : roll.missing === 0 ? 'Ready ✓' : `${roll.missing} missing`}</span>
      </div>

      <div className="rc-actions">
        <button className="rc-empty" onClick={() => emptyBus(live.id)}><i className="ti ti-arrow-bar-down" /> Empty bus</button>
        <button className="rc-all" onClick={() => markAllAboard(live.id)}><i className="ti ti-checks" /> All aboard</button>
        {live.trackingUrl && <a className="rc-track" href={live.trackingUrl} target="_blank" rel="noopener noreferrer"><i className="ti ti-map-pin" /> Live location</a>}
      </div>

      <div className="rc-riders">
        {riders.map((a) => {
          const on = a.onBoard === true;
          return (
            <button key={a.id} className={'rc-rider' + (on ? ' on' : roll.rolled ? ' miss' : '')} onClick={() => setOnBoard(a.id, !on)}>
              <span className="avatar sm">{initials(a.name)}</span>
              <span className="rc-rider-name">{a.name}</span>
              <i className={'ti ' + (on ? 'ti-circle-check-filled' : 'ti-circle')} />
            </button>
          );
        })}
        {riders.length === 0 && <div className="empty" style={{ margin: 0 }}>No riders assigned to this bus.</div>}
      </div>

      <div className="rc-msg">
        <div className="rc-msg-h"><i className="ti ti-speakerphone" /> Message this bus</div>
        <div className="rc-presets">{PRESETS.map((p) => <button key={p} onClick={() => send(p)}>{p.split(' —')[0]}</button>)}</div>
        <div className="rc-msg-row">
          <input style={field} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message…" onKeyDown={(e) => e.key === 'Enter' && send(msg)} />
          <button className="btn-primary sm" disabled={!msg.trim()} style={{ opacity: msg.trim() ? 1 : 0.5 }} onClick={() => send(msg)}><i className="ti ti-send" /></button>
        </div>
      </div>

      {canManage && (
        <div className="rc-setup">
          <button className="rc-setup-toggle" onClick={() => setSetup((s) => !s)}><i className={'ti ' + (setup ? 'ti-chevron-up' : 'ti-settings')} /> Captains &amp; setup</button>
          {setup && (
            <div className="rc-setup-body">
              <div className="info-block-h">Bus captains</div>
              <div className="rc-cap-list">
                {riders.map((a) => {
                  const cap = (live.captainIds ?? []).includes(a.id);
                  return <button key={a.id} className={'rc-cap' + (cap ? ' on' : '')} onClick={() => toggleCaptain(live.id, a.id)}><i className={'ti ' + (cap ? 'ti-star-filled' : 'ti-star')} /> {a.name.split(' ')[0]}</button>;
                })}
              </div>
              <div className="info-block-h" style={{ marginTop: 12 }}>Wave / group label</div>
              <input style={field} defaultValue={live.groupName ?? ''} onBlur={(e) => updateBus(live.id, { groupName: e.target.value.trim() || undefined })} placeholder="e.g. Seniors (Day 1), Juniors, Staff" />
              <div className="info-block-h" style={{ marginTop: 12 }}>Live location link (Life360 etc.)</div>
              <input style={field} defaultValue={live.trackingUrl ?? ''} onBlur={(e) => updateBus(live.id, { trackingUrl: e.target.value.trim() || undefined })} placeholder="Paste a Life360 / map link" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
