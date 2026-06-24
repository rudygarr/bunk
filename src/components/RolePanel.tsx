import { useState } from 'react';
import { useStore } from '../lib/store';
import { initials } from '../lib/format';
import { rolesOf, shiftsOf, dutiesOfRole, dutiesOfShift, looseDuties, shiftWindow } from '../lib/camps';
import type { Camp, Role, Shift, Duty } from '../lib/types';
import Modal, { field, primaryBtn } from './Modal';

const ROLE_ICONS = ['ti-broadcast', 'ti-bus', 'ti-tools', 'ti-shield-half', 'ti-heartbeat', 'ti-cookie', 'ti-swimming', 'ti-checkup-list', 'ti-campfire', 'ti-friends'];

export default function RolePanel({ camp }: { camp: Camp }) {
  const { db, removeRole, removeShift, removeDuty } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [assign, setAssign] = useState<{ role: Role; shift?: Shift } | null>(null);
  const [addShiftTo, setAddShiftTo] = useState<Role | null>(null);
  const roles = rolesOf(db, camp.id);

  function chip(d: Duty) {
    return <span key={d.id} className="chip"><span className="avatar sm">{initials(d.name)}</span>{d.name}<button className="chip-x" onClick={() => removeDuty(d.id)}><i className="ti ti-x" /></button></span>;
  }

  return (
    <div>
      <div className="panel-head">
        <div className="panel-title"><i className="ti ti-clipboard-check" /> Roles</div>
        <button className="btn-primary sm" onClick={() => setShowAdd(true)}><i className="ti ti-plus" /> Add role</button>
      </div>
      {roles.length === 0 && <div className="empty">No roles yet. Create roles for the adults and split any into shifts.</div>}

      <div className="cardcol">
        {roles.map((role) => {
          const shifts = shiftsOf(db, role.id);
          const all = dutiesOfRole(db, role.id);
          const loose = looseDuties(db, role.id);
          return (
            <div key={role.id} className="subcard">
              <div className="role-head">
                <span className="role-ic"><i className={'ti ' + (role.icon ?? 'ti-checkup-list')} /></span>
                <span className="role-name">{role.name}<span className="role-count">{all.length} assigned</span></span>
                <button className="mini" title="Remove role" onClick={() => removeRole(role.id)}><i className="ti ti-x" /></button>
              </div>
              {role.blurb && <div className="role-blurb">{role.blurb}</div>}
              {shifts.length > 0 ? (
                <div className="roomcol">
                  {shifts.map((s) => {
                    const ds = dutiesOfShift(db, s.id);
                    return (
                      <div key={s.id} className="cabroom">
                        <div className="cabroom-h">
                          <span className="cabroom-name">{s.name}{shiftWindow(s) && <span className="shift-time">{shiftWindow(s)}</span>}</span>
                          <span className={'fill' + (ds.length === 0 ? ' full' : '')}>{ds.length === 0 ? 'unfilled' : `${ds.length} on`}</span>
                          <button className="mini" title="Remove shift" onClick={() => removeShift(s.id)}><i className="ti ti-x" /></button>
                        </div>
                        <div className="chips">{ds.map(chip)}{ds.length === 0 && <span className="empty-inline">No one yet</span>}</div>
                        <button className="addbtn" onClick={() => setAssign({ role, shift: s })}><i className="ti ti-user-plus" /> Assign to {s.name}</button>
                      </div>
                    );
                  })}
                  <button className="addbtn ghost" onClick={() => setAddShiftTo(role)}><i className="ti ti-plus" /> Add a shift</button>
                </div>
              ) : (
                <>
                  <div className="chips">{loose.map(chip)}{loose.length === 0 && <span className="empty-inline">No one assigned yet</span>}</div>
                  <div className="rowactions">
                    <button className="addbtn" onClick={() => setAssign({ role })}><i className="ti ti-user-plus" /> Assign</button>
                    <button className="addbtn ghost compact" onClick={() => setAddShiftTo(role)}><i className="ti ti-clock-plus" /> Split into shifts</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && <AddRoleModal camp={camp} onClose={() => setShowAdd(false)} />}
      {addShiftTo && <AddShiftModal role={addShiftTo} onClose={() => setAddShiftTo(null)} />}
      {assign && <AssignModal camp={camp} role={assign.role} shift={assign.shift} onClose={() => setAssign(null)} />}
    </div>
  );
}

function AddRoleModal({ camp, onClose }: { camp: Camp; onClose: () => void }) {
  const { addRole } = useStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ROLE_ICONS[0]);
  const [blurb, setBlurb] = useState('');
  return (
    <Modal title="Add a role" onClose={onClose}>
      <label className="flabel">Role name<input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Lifeguard, Kitchen, Security…" autoFocus /></label>
      <label className="flabel">Icon</label>
      <div className="iconpick">
        {ROLE_ICONS.map((ic) => <button key={ic} className={'iconbtn' + (icon === ic ? ' on' : '')} onClick={() => setIcon(ic)}><i className={'ti ' + ic} /></button>)}
      </div>
      <label className="flabel" style={{ marginTop: 10 }}>Description (optional)<input style={field} value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="What this role covers" /></label>
      <button style={{ ...primaryBtn, marginTop: 10, opacity: name.trim() ? 1 : 0.5 }} disabled={!name.trim()} onClick={() => { addRole(camp.id, { name: name.trim(), icon, blurb: blurb.trim() || undefined }); onClose(); }}>Add role</button>
    </Modal>
  );
}

function AddShiftModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const { addShift } = useStore();
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  return (
    <Modal title={`Add a shift — ${role.name}`} onClose={onClose}>
      <label className="flabel">Shift name<input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Breakfast, Departure, Overnight…" autoFocus /></label>
      <div style={{ display: 'flex', gap: 10 }}>
        <label className="flabel" style={{ flex: 1 }}>Start<input type="time" style={{ ...field, appearance: 'auto' }} value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="flabel" style={{ flex: 1 }}>End<input type="time" style={{ ...field, appearance: 'auto' }} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
      </div>
      <button style={{ ...primaryBtn, marginTop: 8, opacity: name.trim() ? 1 : 0.5 }} disabled={!name.trim()} onClick={() => { addShift(role.id, { name: name.trim(), start: start || undefined, end: end || undefined }); onClose(); }}>Add shift</button>
    </Modal>
  );
}

function AssignModal({ camp, role, shift, onClose }: { camp: Camp; role: Role; shift?: Shift; onClose: () => void }) {
  const { db, assignDuty } = useStore();
  const [q, setQ] = useState('');
  const [extName, setExtName] = useState('');
  const people = db.people.filter((p) => q.trim() !== '' && p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  const target = shift ? `${role.name} · ${shift.name}` : role.name;
  return (
    <Modal title={`Assign — ${target}`} onClose={onClose}>
      <label className="flabel">Search people<input style={field} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" autoFocus /></label>
      <div className="pick">
        {people.map((p) => (
          <button key={p.id} className="pick-row" onClick={() => { assignDuty(camp.id, role.id, { personId: p.id, name: p.name, shiftId: shift?.id }); setQ(''); }}>
            <span className="avatar sm">{initials(p.name)}</span><span className="pick-name">{p.name}<span className="pick-role">{p.role}</span></span><i className="ti ti-plus" />
          </button>
        ))}
        {q.trim() !== '' && people.length === 0 && <div className="empty" style={{ margin: 0 }}>No matches.</div>}
      </div>
      <div className="divider-or"><span>or add a helper by name</span></div>
      <div className="ext">
        <input style={field} value={extName} onChange={(e) => setExtName(e.target.value)} placeholder="Name" />
        <button style={{ ...primaryBtn, height: 42, opacity: extName.trim() ? 1 : 0.5 }} disabled={!extName.trim()} onClick={() => { assignDuty(camp.id, role.id, { name: extName.trim(), shiftId: shift?.id }); setExtName(''); }}>Assign</button>
      </div>
    </Modal>
  );
}
