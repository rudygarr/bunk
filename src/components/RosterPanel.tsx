import { useState } from 'react';
import { useStore } from '../lib/store';
import { initials } from '../lib/format';
import { attendeesOf, rsvp, isFlagged } from '../lib/camps';
import type { Camp, Attendee, RsvpStatus, AttendeeKind } from '../lib/types';
import Modal, { field, primaryBtn } from './Modal';
import AttendeeModal from './AttendeeModal';

const STATUS: Record<RsvpStatus, { label: string; cls: string }> = {
  accepted: { label: 'Accepted', cls: 'ok' },
  declined: { label: 'Declined', cls: 'no' },
  tentative: { label: 'Maybe', cls: 'maybe' },
  invited: { label: 'No reply', cls: 'pending' },
};
const KINDS: { key: AttendeeKind; label: string }[] = [
  { key: 'camper', label: 'Campers' }, { key: 'staff', label: 'Staff' },
  { key: 'parent', label: 'Parents' }, { key: 'guest', label: 'Guests' },
];

export default function RosterPanel({ camp, initialFilter }: { camp: Camp; initialFilter?: 'flagged' }) {
  const { db, respond, removeAttendee } = useStore();
  const [showInvite, setShowInvite] = useState(false);
  const [open, setOpen] = useState<Attendee | null>(null);
  const [filter, setFilter] = useState<AttendeeKind | 'all' | 'flagged'>(initialFilter ?? 'all');
  const list = attendeesOf(db, camp.id).filter((a) => filter === 'all' ? true : filter === 'flagged' ? isFlagged(a) : a.kind === filter);
  const r = rsvp(db, camp.id);

  function copyLink(a: Attendee) {
    const url = `${location.origin}${location.pathname}#/rsvp/${a.id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
  }

  return (
    <div>
      <div className="panel-head">
        <div className="rollup">
          <strong>{r.accepted}/{r.total}</strong> in
          {r.tentative > 0 && <> · {r.tentative} maybe</>}
          {r.declined > 0 && <> · {r.declined} out</>}
          {r.noReply > 0 && <> · {r.noReply} no reply</>}
        </div>
        <button className="btn-primary sm" onClick={() => setShowInvite(true)}><i className="ti ti-plus" /> Invite</button>
      </div>

      <div className="seg">
        <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>All</button>
        {KINDS.map((k) => <button key={k.key} className={filter === k.key ? 'on' : ''} onClick={() => setFilter(k.key)}>{k.label}</button>)}
        <button className={'flag' + (filter === 'flagged' ? ' on' : '')} onClick={() => setFilter('flagged')}><i className="ti ti-medical-cross" /> Medical</button>
      </div>

      <div className="rows">
        {list.length === 0 && <div className="empty">No one here yet.</div>}
        {list.map((a) => (
          <div key={a.id} className="row">
            <button className="row-open" onClick={() => setOpen(a)}>
            <span className="avatar sm">{initials(a.name)}</span>
            <span className="row-main">
              <span className="row-title">{a.name}{isFlagged(a) && <i className="ti ti-medical-cross med-flag" title="Medical flag" />}{a.role && <span className="tagchip">{a.role}</span>}</span>
              <span className="row-sub">{a.personId ? 'Has an account' : a.email ?? 'No email'}</span>
            </span>
            </button>
            <span className="seg-status">
              {(['accepted', 'tentative', 'declined'] as RsvpStatus[]).map((s) => (
                <button key={s} className={'mini-rsvp ' + s + (a.status === s ? ' on' : '')} title={STATUS[s].label} onClick={() => respond(a.id, s)}>
                  <i className={'ti ' + (s === 'accepted' ? 'ti-check' : s === 'declined' ? 'ti-x' : 'ti-help')} />
                </button>
              ))}
            </span>
            <button className="mini" title="Copy invite link" onClick={() => copyLink(a)}><i className="ti ti-link" /></button>
            <button className="mini" title="Remove" onClick={() => removeAttendee(a.id)}><i className="ti ti-trash" /></button>
          </div>
        ))}
      </div>

      {showInvite && <InviteModal camp={camp} onClose={() => setShowInvite(false)} />}
      {open && <AttendeeModal attendee={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function InviteModal({ camp, onClose }: { camp: Camp; onClose: () => void }) {
  const { db, invite } = useStore();
  const [kind, setKind] = useState<AttendeeKind>('camper');
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const already = new Set(attendeesOf(db, camp.id).map((a) => a.personId).filter(Boolean));
  const matches = db.people.filter((p) => !already.has(p.id) && q.trim() !== '' && p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6);

  return (
    <Modal title={`Invite to ${camp.name}`} onClose={onClose}>
      <label className="flabel">They are a…
        <select style={{ ...field, appearance: 'auto' }} value={kind} onChange={(e) => setKind(e.target.value as AttendeeKind)}>
          {KINDS.map((k) => <option key={k.key} value={k.key}>{k.label.replace(/s$/, '')}</option>)}
        </select>
      </label>
      <label className="flabel">From your directory<input style={field} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" autoFocus /></label>
      <div className="pick">
        {matches.map((p) => (
          <button key={p.id} className="pick-row" onClick={() => { invite(camp.id, { personId: p.id, name: p.name, kind, role: kindRole(kind) }); setQ(''); }}>
            <span className="avatar sm">{initials(p.name)}</span><span className="pick-name">{p.name}<span className="pick-role">{p.role}</span></span><i className="ti ti-plus" />
          </button>
        ))}
        {q.trim() !== '' && matches.length === 0 && <div className="empty" style={{ margin: 0 }}>No matches.</div>}
      </div>
      <div className="divider-or"><span>or invite by email — no account needed</span></div>
      <div className="ext">
        <input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input style={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
        <button style={{ ...primaryBtn, height: 42, opacity: name.trim() && email.trim() ? 1 : 0.5 }} disabled={!name.trim() || !email.trim()}
          onClick={() => { invite(camp.id, { name: name.trim(), email: email.trim(), kind, role: kindRole(kind) }); setName(''); setEmail(''); }}>
          Email an invite
        </button>
      </div>
    </Modal>
  );
}

function kindRole(k: AttendeeKind): string {
  return k === 'camper' ? 'Camper' : k === 'staff' ? 'Staff' : k === 'parent' ? 'Parent volunteer' : 'Guest';
}
