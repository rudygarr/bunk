import { useState } from 'react';
import { useStore } from '../lib/store';
import { initials } from '../lib/format';
import { cabinsOf, roomsOf, cabinBeds, cabinRoster, roomRoster, cabinLeaders, unhoused, CABIN_KINDS } from '../lib/camps';
import type { Camp, Cabin, CabinRoom, CabinKind, Attendee } from '../lib/types';
import Modal, { field, primaryBtn } from './Modal';

const KIND_LABEL: Record<CabinKind, string> = { student: 'Students', staff: 'Staff', parent: 'Parents', guest: 'Guests' };

export default function CabinPanel({ camp }: { camp: Camp }) {
  const { db, removeCabin, removeRoom, assignCabin, setLeader } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [assignTo, setAssignTo] = useState<{ cabin: Cabin; room?: CabinRoom } | null>(null);
  const cabins = cabinsOf(db, camp.id);
  const byKind = CABIN_KINDS.map((k) => ({ ...k, cabins: cabins.filter((c) => c.kind === k.key) })).filter((g) => g.cabins.length > 0);
  const homeless = unhoused(db, camp.id);

  function occ(a: Attendee) {
    return (
      <span key={a.id} className={'chip' + (a.cabinLeader ? ' leader' : '')}>
        <span className="avatar sm">{initials(a.name)}</span>{a.name.split(' ')[0]}{a.cabinLeader && <i className="ti ti-star-filled chip-star" />}
        <button className="chip-x" title={a.cabinLeader ? 'Unset leader' : 'Make leader'} onClick={() => setLeader(a.id, !a.cabinLeader)}><i className={'ti ' + (a.cabinLeader ? 'ti-star-off' : 'ti-star')} /></button>
        <button className="chip-x" title="Remove" onClick={() => assignCabin(a.id, undefined)}><i className="ti ti-x" /></button>
      </span>
    );
  }

  return (
    <div>
      <div className="panel-head">
        <div className="panel-title"><i className="ti ti-home" /> Cabins</div>
        <button className="btn-primary sm" onClick={() => setShowAdd(true)}><i className="ti ti-plus" /> Add cabin</button>
      </div>
      {cabins.length === 0 && <div className="empty">No cabins yet. Add one with a bed count, or split it into rooms.</div>}

      {byKind.map((g) => (
        <div key={g.key} className="kindgroup">
          <div className="kindgroup-h"><i className={'ti ' + g.icon} /> {g.label}</div>
          {g.cabins.map((cabin) => {
            const rooms = roomsOf(db, cabin.id);
            const beds = cabinBeds(db, cabin);
            const roster = cabinRoster(db, cabin.id);
            const leaders = cabinLeaders(db, cabin.id);
            const full = beds > 0 && roster.length >= beds;
            return (
              <div key={cabin.id} className="subcard">
                <div className="subcard-head">
                  <span className="subcard-name">{cabin.name}</span>
                  <span className={'fill' + (full ? ' full' : '')}>{roster.length}/{beds || '–'} beds</span>
                  <button className="mini" title="Remove" onClick={() => removeCabin(cabin.id)}><i className="ti ti-x" /></button>
                </div>
                {leaders.length > 0 && <div className="leadline"><i className="ti ti-star-filled" /> Led by {leaders.map((l) => l.name).join(', ')}</div>}
                {rooms.length > 0 ? (
                  <div className="roomcol">
                    {rooms.map((room) => {
                      const ro = roomRoster(db, room.id);
                      return (
                        <div key={room.id} className="cabroom">
                          <div className="cabroom-h">
                            <span className="cabroom-name">{room.name}</span>
                            <span className={'fill' + (ro.length >= room.beds ? ' full' : '')}>{ro.length}/{room.beds}</span>
                            <button className="mini" title="Remove room" onClick={() => removeRoom(room.id)}><i className="ti ti-x" /></button>
                          </div>
                          <div className="chips">{ro.map(occ)}{ro.length === 0 && <span className="empty-inline">Empty</span>}</div>
                          <button className="addbtn" onClick={() => setAssignTo({ cabin, room })}><i className="ti ti-user-plus" /> Assign to {room.name}</button>
                        </div>
                      );
                    })}
                    <AddRoom cabinId={cabin.id} />
                  </div>
                ) : (
                  <>
                    <div className="chips">{roster.map(occ)}{roster.length === 0 && <span className="empty-inline">No one assigned yet</span>}</div>
                    <div className="rowactions">
                      <button className="addbtn" onClick={() => setAssignTo({ cabin })}><i className="ti ti-user-plus" /> Assign</button>
                      <AddRoom cabinId={cabin.id} compact />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {cabins.length > 0 && homeless.length > 0 && <div className="note-warn"><i className="ti ti-bed-off" /> {homeless.length} without a bed yet</div>}

      {showAdd && <AddCabinModal camp={camp} onClose={() => setShowAdd(false)} />}
      {assignTo && <AssignModal camp={camp} cabin={assignTo.cabin} room={assignTo.room} onClose={() => setAssignTo(null)} />}
    </div>
  );
}

function AddRoom({ cabinId, compact }: { cabinId: string; compact?: boolean }) {
  const { addRoom } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [beds, setBeds] = useState('');
  if (!open) return <button className={'addbtn ghost' + (compact ? ' compact' : '')} onClick={() => setOpen(true)}><i className="ti ti-plus" /> Add a room</button>;
  return (
    <div className="addroom-form">
      <input style={{ ...field, height: 36 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Room name" autoFocus />
      <input style={{ ...field, height: 36, width: 64 }} type="number" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="beds" />
      <button className="btn-soft sm" disabled={!name.trim() || !beds} onClick={() => { addRoom(cabinId, { name: name.trim(), beds: Number(beds) }); setName(''); setBeds(''); setOpen(false); }}>Add</button>
      <button className="mini" onClick={() => setOpen(false)}><i className="ti ti-x" /></button>
    </div>
  );
}

function AddCabinModal({ camp, onClose }: { camp: Camp; onClose: () => void }) {
  const { addCabin } = useStore();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<CabinKind>('student');
  const [beds, setBeds] = useState('');
  return (
    <Modal title="Add a cabin" onClose={onClose}>
      <label className="flabel">Cabin name<input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Pine Lodge" autoFocus /></label>
      <label className="flabel">Who stays here
        <select style={{ ...field, appearance: 'auto' }} value={kind} onChange={(e) => setKind(e.target.value as CabinKind)}>
          {CABIN_KINDS.map((k) => <option key={k.key} value={k.key}>{KIND_LABEL[k.key]}</option>)}
        </select>
      </label>
      <label className="flabel">Total beds (optional — or add rooms after)<input style={field} type="number" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="16" /></label>
      <div className="note"><i className="ti ti-info-circle" /> Leave beds blank to split the cabin into rooms; each room carries its own beds.</div>
      <button style={{ ...primaryBtn, marginTop: 10, opacity: name.trim() ? 1 : 0.5 }} disabled={!name.trim()}
        onClick={() => { addCabin(camp.id, { name: name.trim(), kind, beds: beds ? Number(beds) : undefined }); onClose(); }}>Add cabin</button>
    </Modal>
  );
}

function AssignModal({ camp, cabin, room, onClose }: { camp: Camp; cabin: Cabin; room?: CabinRoom; onClose: () => void }) {
  const { db, assignCabin, setLeader } = useStore();
  const [q, setQ] = useState('');
  const [asLeader, setAsLeader] = useState(false);
  const pool = db.attendees.filter((a) => a.campId === camp.id && !a.cabinId).filter((a) => q.trim() === '' || a.name.toLowerCase().includes(q.toLowerCase()));
  const target = room ? `${cabin.name} · ${room.name}` : cabin.name;
  return (
    <Modal title={`Assign to ${target}`} onClose={onClose}>
      <label className="leadtoggle"><input type="checkbox" checked={asLeader} onChange={(e) => setAsLeader(e.target.checked)} /><i className="ti ti-star" /> Assign as a leader (in charge here)</label>
      <label className="flabel" style={{ marginTop: 10 }}>Search<input style={field} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search attendees…" autoFocus /></label>
      <div className="pick">
        {pool.map((a) => (
          <button key={a.id} className="pick-row" onClick={() => { assignCabin(a.id, cabin.id, room?.id); if (asLeader) setLeader(a.id, true); }}>
            <span className="avatar sm">{initials(a.name)}</span><span className="pick-name">{a.name}{a.role && <span className="pick-role">{a.role}</span>}</span><i className="ti ti-arrow-right" />
          </button>
        ))}
        {pool.length === 0 && <div className="empty" style={{ margin: 0 }}>Everyone already has a bed.</div>}
      </div>
    </Modal>
  );
}
