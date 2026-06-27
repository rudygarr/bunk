import { useState } from 'react';
import { useStore } from '../lib/store';
import { tablesOf, tableRoster, attendeesOf } from '../lib/camps';
import { initials } from '../lib/format';
import Modal, { field, primaryBtn } from './Modal';
import type { Camp, Table } from '../lib/types';

// Assigned meal seating. Members + leaders are attendees (tableId / tableLeader),
// like cabins — tap the star to make someone a table leader (host).
export default function TablePanel({ camp }: { camp: Camp }) {
  const { db, removeTable, assignTable, setTableLeader, autoBalanceTables } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [assignTo, setAssignTo] = useState<Table | null>(null);
  const tables = tablesOf(db, camp.id);
  const unseated = attendeesOf(db, camp.id).filter((a) => a.kind === 'camper' && !a.tableId).length;

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title"><i className="ti ti-armchair" /> Meal tables</div>
        <div className="panel-actions">
          {tables.length > 1 && <button className="btn-soft sm" onClick={() => autoBalanceTables(camp.id)}><i className="ti ti-wand" /> Auto-seat</button>}
          <button className="btn-primary sm" onClick={() => setShowAdd(true)}><i className="ti ti-plus" /> Add table</button>
        </div>
      </div>

      {tables.length === 0 && <div className="empty">No tables yet. Camps with assigned dining add tables here — each can have one or more table leaders (hosts).</div>}
      {tables.length > 0 && unseated > 0 && <div className="note" style={{ marginBottom: 12 }}><i className="ti ti-info-circle" /> {unseated} camper{unseated === 1 ? '' : 's'} not seated yet.</div>}

      <div className="sg-board">
        {tables.map((t) => {
          const roster = tableRoster(db, t.id);
          const over = t.seats ? roster.length > t.seats : false;
          return (
            <div key={t.id} className="sg" style={{ ['--tc' as string]: 'var(--amber)' }}>
              <div className="sg-top">
                <span className="sg-dot" />
                <span className="sg-name">{t.name}</span>
                <span className={'tm-count' + (over ? ' over' : '')}>{roster.length}{t.seats ? `/${t.seats}` : ''}</span>
                <button className="tm-x" title="Remove table" onClick={() => removeTable(t.id)}><i className="ti ti-trash" /></button>
              </div>
              <div className="tm-members">
                {roster.map((m) => (
                  <span key={m.id} className={'sg-chip' + (m.tableLeader ? ' leader' : '')}>
                    <button className="sg-chip-star" title={m.tableLeader ? 'Table leader — tap to unset' : 'Make table leader'} onClick={() => setTableLeader(m.id, !m.tableLeader)}>
                      <i className={'ti ' + (m.tableLeader ? 'ti-star-filled' : 'ti-star')} />
                    </button>
                    <span className="avatar sm">{initials(m.name)}</span>{m.name.split(' ')[0]}
                    <button className="sg-chip-x" title="Remove" onClick={() => assignTable(m.id, undefined)}><i className="ti ti-x" /></button>
                  </span>
                ))}
                <button className="tm-assign" onClick={() => setAssignTo(t)}><i className="ti ti-plus" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && <AddTableModal camp={camp} count={tables.length} onClose={() => setShowAdd(false)} />}
      {assignTo && <AssignTableModal camp={camp} table={assignTo} onClose={() => setAssignTo(null)} />}
    </div>
  );
}

function AddTableModal({ camp, count, onClose }: { camp: Camp; count: number; onClose: () => void }) {
  const { addTable } = useStore();
  const [name, setName] = useState(`Table ${count + 1}`);
  const [seats, setSeats] = useState('8');
  return (
    <Modal title="Add table" onClose={onClose}>
      <label className="flabel">Table name<input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Table 5" autoFocus /></label>
      <label className="flabel">Seats (optional)<input style={field} type="number" value={seats} onChange={(e) => setSeats(e.target.value)} placeholder="8" /></label>
      <button style={{ ...primaryBtn, marginTop: 14, opacity: name.trim() ? 1 : 0.5 }} disabled={!name.trim()} onClick={() => { addTable(camp.id, { name: name.trim(), seats: seats ? Number(seats) : undefined }); onClose(); }}>Add table</button>
    </Modal>
  );
}

function AssignTableModal({ camp, table, onClose }: { camp: Camp; table: Table; onClose: () => void }) {
  const { db, assignTable } = useStore();
  const [q, setQ] = useState('');
  const people = attendeesOf(db, camp.id)
    .filter((a) => a.tableId !== table.id)
    .filter((a) => q.trim() === '' || a.name.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 10);
  return (
    <Modal title={`Seat at ${table.name}`} onClose={onClose}>
      <input style={field} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search campers & staff…" autoFocus />
      <div className="pick" style={{ marginTop: 8 }}>
        {people.map((a) => (
          <button key={a.id} className="pick-row" onClick={() => assignTable(a.id, table.id)}>
            <span className="avatar sm">{initials(a.name)}</span>
            <span className="pick-name">{a.name}{a.tableId && <span className="pick-role">moving tables</span>}</span>
            <i className="ti ti-plus" />
          </button>
        ))}
        {people.length === 0 && <div className="empty" style={{ margin: 0 }}>Nobody found.</div>}
      </div>
    </Modal>
  );
}
