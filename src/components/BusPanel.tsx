import { useState } from 'react';
import { useStore } from '../lib/store';
import { initials } from '../lib/format';
import { busesOf, busRoster, attendeesOf, busLabel, busOf } from '../lib/camps';
import { autoAssignBuses } from '../lib/assign';
import { travelSummary, travelMeta, travelModeOf, VEHICLE_TYPES, vehicleType, vehicleTypeMeta } from '../lib/travel';
import type { Camp, Bus, VehicleType } from '../lib/types';
import Modal, { field, primaryBtn } from './Modal';
import AutoFillPreview from './AutoFillPreview';

// The Travel tab: every way people get to camp — buses, flights, cars, other —
// each a vehicle with editable seats and a tap-to-assign/move roster.
export default function BusPanel({ camp }: { camp: Camp }) {
  const { db, removeBus, assignBus, applyBusPlan } = useStore();
  const [addType, setAddType] = useState<VehicleType | null>(null);
  const [assignTo, setAssignTo] = useState<Bus | null>(null);
  const [plan, setPlan] = useState<ReturnType<typeof autoAssignBuses> | null>(null);
  const vehicles = busesOf(db, camp.id);
  const unassigned = attendeesOf(db, camp.id).filter((a) => !a.busId);
  const summary = travelSummary(db, camp);
  const hasBuses = vehicles.some((v) => vehicleType(v) === 'bus');

  return (
    <div>
      {/* At-a-glance travel modes + special arrangements */}
      <div className="travel-sum">
        <div className="travel-modes">
          {summary.counts.map((c) => (
            <span key={c.mode} className="travel-chip"><i className={'ti ' + travelMeta(c.mode).icon} /> {travelMeta(c.mode).label} · <b>{c.n}</b></span>
          ))}
        </div>
        {summary.special.length > 0 && (
          <div className="travel-special">
            <div className="travel-special-h"><i className="ti ti-plane" /> Special arrangements</div>
            {summary.special.map((a) => (
              <div key={a.id} className="travel-special-row">
                <span className="travel-special-n">{a.name}</span>
                <span className="travel-special-d">{a.flightNo ? <b>{a.flightNo}</b> : null}{a.flightNo && a.travelNote ? ' · ' : ''}{a.travelNote || (!a.flightNo ? travelMeta(travelModeOf(a, camp)).label : '')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add vehicles of any type */}
      <div className="panel-head">
        <div className="panel-title"><i className="ti ti-route" /> Vehicles</div>
        {hasBuses && <button className="btn-soft sm" onClick={() => setPlan(autoAssignBuses(db, camp.id))}><i className="ti ti-wand" /> Auto-seat</button>}
      </div>
      <div className="veh-add-row">
        <span className="veh-add-label">Add:</span>
        {VEHICLE_TYPES.map((t) => (
          <button key={t.key} className="veh-add-btn" onClick={() => setAddType(t.key)}><i className={'ti ' + t.icon} /> {t.label}</button>
        ))}
      </div>

      {vehicles.length === 0 && <div className="empty">No vehicles yet — add a bus, flight, or car above and assign riders.</div>}

      {/* Grouped by type */}
      {VEHICLE_TYPES.map((t) => {
        const ofType = vehicles.filter((v) => vehicleType(v) === t.key);
        if (ofType.length === 0) return null;
        return (
          <div key={t.key} className="veh-group">
            <div className="veh-group-h"><i className={'ti ' + t.icon} /> {t.plural} <span className="veh-group-n">{ofType.length}</span></div>
            <div className="cardcol">
              {ofType.map((v) => <VehicleCard key={v.id} vehicle={v} onAssign={() => setAssignTo(v)} onRemove={() => removeBus(v.id)} onUnassign={(id) => assignBus(id, undefined)} />)}
            </div>
          </div>
        );
      })}

      {vehicles.length > 0 && unassigned.length > 0 && (
        <div className="note-warn"><i className="ti ti-alert-circle" /> {unassigned.length} attendee{unassigned.length === 1 ? '' : 's'} not on a vehicle yet</div>
      )}

      {addType && <AddVehicleModal camp={camp} type={addType} onClose={() => setAddType(null)} />}
      {assignTo && <AssignModal camp={camp} vehicle={assignTo} onClose={() => setAssignTo(null)} />}
      {plan && (
        <AutoFillPreview
          title="Auto-seat by capacity"
          subtitle="Fills vehicles by seats available, keeping cabinmates together."
          rows={plan.placements.map((p) => ({ name: p.name, target: p.busName }))}
          unplaced={plan.unplaced.map((a) => a.name)}
          onApply={() => { applyBusPlan(plan.placements); setPlan(null); }}
          onClose={() => setPlan(null)}
        />
      )}
    </div>
  );
}

function VehicleCard({ vehicle, onAssign, onRemove, onUnassign }: { vehicle: Bus; onAssign: () => void; onRemove: () => void; onUnassign: (id: string) => void }) {
  const { db, updateBus } = useStore();
  const roster = busRoster(db, vehicle.id);
  const meta = vehicleTypeMeta(vehicleType(vehicle));
  const used = roster.length;
  const cap = vehicle.capacity;
  const over = cap !== undefined && used > cap;
  const full = cap !== undefined && used >= cap;
  // +/- adjust seats. If no limit set yet, first tap seeds it at the current count.
  const setSeats = (n: number) => updateBus(vehicle.id, { capacity: Math.max(0, n) });
  return (
    <div className="subcard">
      <div className="subcard-head">
        <span className="veh-ic"><i className={'ti ' + meta.icon} /></span>
        <span className="subcard-name">{busLabel(vehicle)}{vehicle.flightNo && <span className="veh-flight">{vehicle.flightNo}</span>}</span>
        <button className="mini" aria-label="Remove vehicle" title="Remove" onClick={onRemove}><i className="ti ti-x" aria-hidden="true" /></button>
      </div>

      <div className="veh-seats">
        <button className="seat-step" aria-label="Remove a seat" onClick={() => setSeats((cap ?? used) - 1)}><i className="ti ti-minus" aria-hidden="true" /></button>
        <span className={'seat-count' + (over ? ' over' : full ? ' full' : '')}>
          {cap !== undefined ? <><b>{used}</b>/{cap} seats</> : <><b>{used}</b> riders</>}
        </span>
        <button className="seat-step" aria-label="Add a seat" onClick={() => setSeats((cap ?? used) + 1)}><i className="ti ti-plus" aria-hidden="true" /></button>
        {over && <span className="seat-warn">over capacity</span>}
      </div>

      {(vehicle.charterOrg || vehicle.departInfo) && (
        <div className="subcard-meta">
          {vehicle.charterOrg && <span><i className="ti ti-building-store" aria-hidden="true" /> {vehicle.charterOrg}</span>}
          {vehicle.departInfo && <span><i className="ti ti-clock" aria-hidden="true" /> {vehicle.departInfo}</span>}
        </div>
      )}

      <div className="chips">
        {roster.map((a) => (
          <span key={a.id} className="chip">
            <span className="avatar sm">{initials(a.name)}</span>{a.name.split(' ')[0]}
            <button className="chip-x" aria-label={`Remove ${a.name}`} onClick={() => onUnassign(a.id)}><i className="ti ti-x" aria-hidden="true" /></button>
          </span>
        ))}
        {roster.length === 0 && <span className="empty-inline">No one assigned yet</span>}
      </div>
      <button className="addbtn" onClick={onAssign}><i className="ti ti-user-plus" aria-hidden="true" /> Add / move people</button>
    </div>
  );
}

function AddVehicleModal({ camp, type, onClose }: { camp: Camp; type: VehicleType; onClose: () => void }) {
  const { addBus } = useStore();
  const meta = vehicleTypeMeta(type);
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [cap, setCap] = useState('');
  const [org, setOrg] = useState('');
  const [flightNo, setFlightNo] = useState('');
  const [depart, setDepart] = useState('');
  const namePh = type === 'flight' ? 'Delta 1284' : type === 'car' ? 'Van A' : type === 'bus' ? 'Bus 1' : 'Vehicle';
  const orgLabel = type === 'flight' ? 'Airline' : type === 'car' ? 'Driver' : 'Charter company';
  return (
    <Modal title={meta.add} onClose={onClose}>
      <label className="flabel">Name<input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder={namePh} autoFocus /></label>
      {type === 'flight' && <label className="flabel">Flight number<input style={field} value={flightNo} onChange={(e) => setFlightNo(e.target.value)} placeholder="DL1284" /></label>}
      <label className="flabel">Label / crew (optional)<input style={field} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Gold Squad" /></label>
      <div style={{ display: 'flex', gap: 10 }}>
        <label className="flabel" style={{ flex: 1 }}>Seats<input style={field} type="number" value={cap} onChange={(e) => setCap(e.target.value)} placeholder="30" /></label>
        <label className="flabel" style={{ flex: 2 }}>{orgLabel} (optional)<input style={field} value={org} onChange={(e) => setOrg(e.target.value)} placeholder={orgLabel} /></label>
      </div>
      <label className="flabel">Departure / details (optional)<input style={field} value={depart} onChange={(e) => setDepart(e.target.value)} placeholder="Departs 8:00 AM · Gym Lot" /></label>
      <button style={{ ...primaryBtn, marginTop: 10, opacity: name.trim() ? 1 : 0.5 }} disabled={!name.trim()}
        onClick={() => { addBus(camp.id, { type, name: name.trim(), label: label.trim() || undefined, capacity: cap ? Number(cap) : undefined, charterOrg: org.trim() || undefined, flightNo: flightNo.trim() || undefined, departInfo: depart.trim() || undefined }); onClose(); }}>
        {meta.add}
      </button>
    </Modal>
  );
}

// Assign OR move: shows everyone, notes who's already on a vehicle, and tapping
// puts them on this one (moving them if needed).
function AssignModal({ camp, vehicle, onClose }: { camp: Camp; vehicle: Bus; onClose: () => void }) {
  const { db, assignBus } = useStore();
  const [q, setQ] = useState('');
  const pool = attendeesOf(db, camp.id)
    .filter((a) => a.busId !== vehicle.id)
    .filter((a) => q.trim() === '' || a.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Modal title={`Add / move to ${busLabel(vehicle)}`} onClose={onClose}>
      <label className="flabel">Search<input style={field} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search attendees…" autoFocus /></label>
      <div className="pick">
        {pool.map((a) => {
          const cur = busOf(db, a);
          return (
            <button key={a.id} className="pick-row" onClick={() => assignBus(a.id, vehicle.id)}>
              <span className="avatar sm">{initials(a.name)}</span>
              <span className="pick-name">{a.name}{cur && <span className="pick-role">on {busLabel(cur)}</span>}{!cur && a.role && <span className="pick-role">{a.role}</span>}</span>
              <i className="ti ti-arrow-right" aria-hidden="true" />
            </button>
          );
        })}
        {pool.length === 0 && <div className="empty" style={{ margin: 0 }}>Everyone's already on this vehicle.</div>}
      </div>
    </Modal>
  );
}
