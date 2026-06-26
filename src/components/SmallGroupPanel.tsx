import { useState } from 'react';
import { useStore } from '../lib/store';
import { smallGroupsOf, smallGroupRoster, attendeesOf } from '../lib/camps';
import { TEAM_COLORS } from '../lib/teams';
import { initials } from '../lib/format';
import Modal, { field, primaryBtn } from './Modal';
import type { Camp, SmallGroup } from '../lib/types';

export default function SmallGroupPanel({ camp }: { camp: Camp }) {
  const { db, removeSmallGroup, assignSmallGroup, autoBalanceSmallGroups } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [assignTo, setAssignTo] = useState<SmallGroup | null>(null);
  const groups = smallGroupsOf(db, camp.id);
  const unassigned = attendeesOf(db, camp.id).filter((a) => a.kind === 'camper' && !a.smallGroupId).length;

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title"><i className="ti ti-users-group" /> Small groups</div>
        <div className="panel-actions">
          {groups.length > 1 && <button className="btn-soft sm" onClick={() => autoBalanceSmallGroups(camp.id)}><i className="ti ti-wand" /> Auto-balance</button>}
          <button className="btn-primary sm" onClick={() => setShowAdd(true)}><i className="ti ti-plus" /> Add group</button>
        </div>
      </div>

      {groups.length === 0 && <div className="empty">No small groups yet. Many camps split students into discipleship or activity groups with a leader — add a few here.</div>}
      {groups.length > 0 && unassigned > 0 && <div className="note" style={{ marginBottom: 12 }}><i className="ti ti-info-circle" /> {unassigned} camper{unassigned === 1 ? '' : 's'} not in a small group yet.</div>}

      <div className="sg-board">
        {groups.map((g) => {
          const roster = smallGroupRoster(db, g.id);
          return (
            <div key={g.id} className="sg" style={{ ['--tc' as string]: g.color }}>
              <div className="sg-top">
                <span className="sg-dot" />
                <span className="sg-name">{g.name}</span>
                <span className="tm-count">{roster.length}</span>
                <button className="tm-x" title="Remove group" onClick={() => removeSmallGroup(g.id)}><i className="ti ti-trash" /></button>
              </div>
              {g.leaderName && <div className="sg-leader"><i className="ti ti-star" /> Led by {g.leaderName}</div>}
              <div className="tm-members">
                {roster.map((m) => (
                  <span key={m.id} className="sg-chip">
                    <span className="avatar sm">{initials(m.name)}</span>{m.name.split(' ')[0]}
                    <button className="sg-chip-x" title="Remove" onClick={() => assignSmallGroup(m.id, undefined)}><i className="ti ti-x" /></button>
                  </span>
                ))}
                <button className="tm-assign" onClick={() => setAssignTo(g)}><i className="ti ti-plus" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && <AddGroupModal camp={camp} count={groups.length} onClose={() => setShowAdd(false)} />}
      {assignTo && <AssignGroupModal camp={camp} group={assignTo} onClose={() => setAssignTo(null)} />}
    </div>
  );
}

function AddGroupModal({ camp, count, onClose }: { camp: Camp; count: number; onClose: () => void }) {
  const { addSmallGroup } = useStore();
  const [name, setName] = useState('');
  const [leader, setLeader] = useState('');
  const [color, setColor] = useState(TEAM_COLORS[count % TEAM_COLORS.length]);
  return (
    <Modal title="Add small group" onClose={onClose}>
      <label className="flabel">Group name<input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Lions, Group 3…" autoFocus /></label>
      <label className="flabel">Leader (optional)<input style={field} value={leader} onChange={(e) => setLeader(e.target.value)} placeholder="Who runs this group" /></label>
      <label className="flabel">Color</label>
      <div className="tm-swatches">
        {TEAM_COLORS.map((c) => <button key={c} className={'tm-swatch' + (color === c ? ' on' : '')} style={{ background: c }} onClick={() => setColor(c)} />)}
      </div>
      <button style={{ ...primaryBtn, marginTop: 14, opacity: name.trim() ? 1 : 0.5 }} disabled={!name.trim()} onClick={() => { addSmallGroup(camp.id, { name: name.trim(), color, leaderName: leader.trim() || undefined }); onClose(); }}>Add group</button>
    </Modal>
  );
}

function AssignGroupModal({ camp, group, onClose }: { camp: Camp; group: SmallGroup; onClose: () => void }) {
  const { db, assignSmallGroup } = useStore();
  const [q, setQ] = useState('');
  const people = attendeesOf(db, camp.id)
    .filter((a) => a.smallGroupId !== group.id)
    .filter((a) => q.trim() === '' || a.name.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 10);
  return (
    <Modal title={`Add to ${group.name}`} onClose={onClose}>
      <input style={field} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search campers & staff…" autoFocus />
      <div className="pick" style={{ marginTop: 8 }}>
        {people.map((a) => (
          <button key={a.id} className="pick-row" onClick={() => assignSmallGroup(a.id, group.id)}>
            <span className="avatar sm">{initials(a.name)}</span>
            <span className="pick-name">{a.name}{a.smallGroupId && <span className="pick-role">moving groups</span>}</span>
            <i className="ti ti-plus" />
          </button>
        ))}
        {people.length === 0 && <div className="empty" style={{ margin: 0 }}>Nobody found.</div>}
      </div>
    </Modal>
  );
}
