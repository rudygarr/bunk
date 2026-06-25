import { useState } from 'react';
import { useStore } from '../lib/store';
import { initials } from '../lib/format';
import { attendeesOf, rsvp, isFlagged, busOf, cabinOf, roomOf, smallGroupOf } from '../lib/camps';
import type { Camp, Attendee, RsvpStatus, AttendeeKind } from '../lib/types';
import Modal, { field, primaryBtn } from './Modal';
import AttendeeModal from './AttendeeModal';
import QrCode from './QrCode';
import { parseCsv } from '../lib/csv';

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
  const [q, setQ] = useState('');
  const list = attendeesOf(db, camp.id)
    .filter((a) => filter === 'all' ? true : filter === 'flagged' ? isFlagged(a) : a.kind === filter)
    .filter((a) => q.trim() === '' || a.name.toLowerCase().includes(q.toLowerCase()));
  const r = rsvp(db, camp.id);

  function copyLink(a: Attendee) {
    const url = `${location.origin}${location.pathname}#/rsvp/${a.id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
  }

  function exportCsv() {
    const esc = (v: unknown) => { const s = (v ?? '').toString(); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const headers = ['Name', 'Email', 'Type', 'Role', 'Grade', 'Gender', 'Bus', 'Cabin', 'Room', 'Team', 'Small group', 'RSVP', 'Allergies', 'Meds', 'Dietary', 'Emergency contact', 'Emergency phone'];
    const rows = attendeesOf(db, camp.id).map((a) => [
      a.name, a.email, a.kind, a.role, a.grade, a.gender,
      busOf(db, a)?.name, cabinOf(db, a)?.name, roomOf(db, a)?.name,
      db.teams.find((t) => t.id === a.teamId)?.name, smallGroupOf(db, a)?.name, a.status,
      a.health?.allergies, a.health?.meds, a.health?.dietary, a.health?.emergencyName, a.health?.emergencyPhone,
    ].map(esc).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url; link.download = `${camp.name.replace(/\s+/g, '-')}-roster.csv`; link.click();
    URL.revokeObjectURL(url);
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
        <button className="btn-primary sm" onClick={() => setShowInvite(true)}><i className="ti ti-user-plus" /> Add people</button>
      </div>

      <div className="seg">
        <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>All</button>
        {KINDS.map((k) => <button key={k.key} className={filter === k.key ? 'on' : ''} onClick={() => setFilter(k.key)}>{k.label}</button>)}
        <button className={'flag' + (filter === 'flagged' ? ' on' : '')} onClick={() => setFilter('flagged')}><i className="ti ti-medical-cross" /> Medical</button>
      </div>

      <div className="roster-tools">
        <div className="roster-search">
          <i className="ti ti-search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" />
          {q && <button onClick={() => setQ('')}><i className="ti ti-x" /></button>}
        </div>
        <button className="btn-soft sm" onClick={exportCsv} title="Download roster as CSV"><i className="ti ti-download" /> Export</button>
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

type AddTab = 'one' | 'csv' | 'qr';
function InviteModal({ camp, onClose }: { camp: Camp; onClose: () => void }) {
  const [tab, setTab] = useState<AddTab>('one');
  return (
    <Modal title={`Add people to ${camp.name}`} onClose={onClose}>
      <div className="seg" style={{ marginBottom: 16 }}>
        <button className={tab === 'one' ? 'on' : ''} onClick={() => setTab('one')}>One by one</button>
        <button className={tab === 'csv' ? 'on' : ''} onClick={() => setTab('csv')}>Import CSV</button>
        <button className={tab === 'qr' ? 'on' : ''} onClick={() => setTab('qr')}>Sign-up code</button>
      </div>
      {tab === 'one' && <OneByOne camp={camp} />}
      {tab === 'csv' && <CsvImport camp={camp} onDone={onClose} />}
      {tab === 'qr' && <SignupQr camp={camp} />}
    </Modal>
  );
}

function OneByOne({ camp }: { camp: Camp }) {
  const { db, invite } = useStore();
  const [kind, setKind] = useState<AttendeeKind>('camper');
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const already = new Set(attendeesOf(db, camp.id).map((a) => a.personId).filter(Boolean));
  const matches = db.people.filter((p) => !already.has(p.id) && q.trim() !== '' && p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  return (
    <>
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
      <div className="divider-or"><span>or add by email — no account needed</span></div>
      <div className="ext">
        <input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input style={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
        <button style={{ ...primaryBtn, height: 42, opacity: name.trim() && email.trim() ? 1 : 0.5 }} disabled={!name.trim() || !email.trim()}
          onClick={() => { invite(camp.id, { name: name.trim(), email: email.trim(), kind, role: kindRole(kind) }); setName(''); setEmail(''); }}>
          Add
        </button>
      </div>
    </>
  );
}

function CsvImport({ camp, onDone }: { camp: Camp; onDone: () => void }) {
  const { inviteMany } = useStore();
  const [text, setText] = useState('');
  const result = text.trim() ? parseCsv(text) : null;
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then(setText);
  }
  return (
    <>
      <div className="note"><i className="ti ti-info-circle" /> Paste rows or upload a .csv. First row = headers. Recognized: name, email, kind, grade, gender, friends.</div>
      <label className="csv-file"><i className="ti ti-upload" /> Upload a CSV file<input type="file" accept=".csv,text/csv" onChange={onFile} hidden /></label>
      <textarea style={{ ...field, height: 120, padding: '10px 12px', resize: 'vertical' }} value={text} onChange={(e) => setText(e.target.value)} placeholder={'name,email,kind,grade,gender,friends\nJake Miller,jake@x.com,camper,10,male,Tyler Brooks'} />
      {result && (
        <div className="csv-preview">
          <div className="csv-stat"><strong>{result.rows.length}</strong> rows ready{result.skipped > 0 ? ` · ${result.skipped} skipped (no name)` : ''}</div>
          <div className="csv-rows">
            {result.rows.slice(0, 6).map((r, i) => (
              <div key={i} className="csv-row"><span>{r.name}</span><span className="csv-dim">{[r.kind, r.grade ? `gr ${r.grade}` : '', r.gender, r.email].filter(Boolean).join(' · ')}</span></div>
            ))}
            {result.rows.length > 6 && <div className="csv-dim" style={{ padding: '4px 0' }}>+{result.rows.length - 6} more…</div>}
          </div>
          <button style={{ ...primaryBtn, marginTop: 12, opacity: result.rows.length ? 1 : 0.5 }} disabled={!result.rows.length}
            onClick={() => { inviteMany(camp.id, result.rows); onDone(); }}>
            Add {result.rows.length} {result.rows.length === 1 ? 'person' : 'people'}
          </button>
        </div>
      )}
    </>
  );
}

function SignupQr({ camp }: { camp: Camp }) {
  const url = `${location.origin}${location.pathname}#/join/${camp.id}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="qr-wrap">
      <div className="note" style={{ marginBottom: 14 }}><i className="ti ti-info-circle" /> Print this or show it at registration — campers scan it to add themselves, no account needed.</div>
      <QrCode value={url} size={200} />
      <div className="qr-url">{url}</div>
      <button className="btn-soft" onClick={() => { navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); }}>
        <i className={'ti ' + (copied ? 'ti-check' : 'ti-link')} /> {copied ? 'Copied!' : 'Copy sign-up link'}
      </button>
    </div>
  );
}

function kindRole(k: AttendeeKind): string {
  return k === 'camper' ? 'Camper' : k === 'staff' ? 'Staff' : k === 'parent' ? 'Parent volunteer' : 'Guest';
}
