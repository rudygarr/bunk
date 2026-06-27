import { useState } from 'react';
import { useStore } from '../lib/store';
import { initials } from '../lib/format';
import { busesOf, busRoster, attendeesOf, busLabel } from '../lib/camps';
import { autoAssignBuses } from '../lib/assign';
import { travelSummary, travelMeta, travelModeOf } from '../lib/travel';
import type { Camp, Bus } from '../lib/types';
import Modal, { field, primaryBtn } from './Modal';
import AutoFillPreview from './AutoFillPreview';

export default function BusPanel({ camp }: { camp: Camp }) {
  const { db, removeBus, assignBus, applyBusPlan } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [assignTo, setAssignTo] = useState<Bus | null>(null);
  const [plan, setPlan] = useState<ReturnType<typeof autoAssignBuses> | null>(null);
  const buses = busesOf(db, camp.id);
  const unassigned = attendeesOf(db, camp.id).filter((a) => !a.busId);

  const summary = travelSummary(db, camp);

  return (
    <div>
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

      <div className="panel-head">
        <div className="panel-title"><i className="ti ti-bus" /> Buses <span className="rental">rental</span></div>
        <div className="panel-actions">
          {buses.length > 0 && <button className="btn-soft sm" onClick={() => setPlan(autoAssignBuses(db, camp.id))}><i className="ti ti-wand" /> Auto-fill</button>}
          <button className="btn-primary sm" onClick={() => setShowAdd(true)}><i className="ti ti-plus" /> Charter a bus</button>
        </div>
      </div>

      {buses.length === 0 && <div className="empty">No buses yet. Charter a rental bus and assign riders.</div>}
      <div className="cardcol">
        {buses.map((bus) => {
          const roster = busRoster(db, bus.id);
          const full = bus.capacity ? roster.length >= bus.capacity : false;
          return (
            <div key={bus.id} className="subcard">
              <div className="subcard-head">
                <span className="subcard-name">{busLabel(bus)}</span>
                <span className={'fill' + (full ? ' full' : '')}>{roster.length}{bus.capacity ? `/${bus.capacity}` : ''}</span>
                <button className="mini" title="Remove" onClick={() => removeBus(bus.id)}><i className="ti ti-x" /></button>
              </div>
              {(bus.charterOrg || bus.departInfo) && (
                <div className="subcard-meta">
                  {bus.charterOrg && <span><i className="ti ti-building-store" /> {bus.charterOrg}</span>}
                  {bus.departInfo && <span><i className="ti ti-clock" /> {bus.departInfo}</span>}
                </div>
              )}
              <div className="chips">
                {roster.map((a) => (
                  <span key={a.id} className="chip">
                    <span className="avatar sm">{initials(a.name)}</span>{a.name.split(' ')[0]}
                    <button className="chip-x" onClick={() => assignBus(a.id, undefined)}><i className="ti ti-x" /></button>
                  </span>
                ))}
                {roster.length === 0 && <span className="empty-inline">No riders yet</span>}
              </div>
              <button className="addbtn" onClick={() => setAssignTo(bus)}><i className="ti ti-user-plus" /> Add rider</button>
            </div>
          );
        })}
      </div>
      {buses.length > 0 && unassigned.length > 0 && (
        <div className="note-warn"><i className="ti ti-alert-circle" /> {unassigned.length} attendee{unassigned.length === 1 ? '' : 's'} not on a bus yet</div>
      )}

      {showAdd && <AddBusModal camp={camp} onClose={() => setShowAdd(false)} />}
      {assignTo && <AssignModal camp={camp} bus={assignTo} onClose={() => setAssignTo(null)} />}
      {plan && (
        <AutoFillPreview
          title="Auto-fill buses"
          subtitle="Filled by capacity, keeping cabinmates on the same bus."
          rows={plan.placements.map((p) => ({ name: p.name, target: p.busName }))}
          unplaced={plan.unplaced.map((a) => a.name)}
          onApply={() => { applyBusPlan(plan.placements); setPlan(null); }}
          onClose={() => setPlan(null)}
        />
      )}
    </div>
  );
}

function AddBusModal({ camp, onClose }: { camp: Camp; onClose: () => void }) {
  const { addBus } = useStore();
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [cap, setCap] = useState('');
  const [org, setOrg] = useState('');
  const [depart, setDepart] = useState('');
  return (
    <Modal title="Charter a bus" onClose={onClose}>
      <div className="note"><i className="ti ti-info-circle" /> A chartered rental bus — assign riders so everyone knows which bus is theirs.</div>
      <label className="flabel">Bus name<input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Bus 1" autoFocus /></label>
      <label className="flabel">Crew / theme (optional)<input style={field} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Gold Squad" /></label>
      <div style={{ display: 'flex', gap: 10 }}>
        <label className="flabel" style={{ flex: 1 }}>Capacity<input style={field} type="number" value={cap} onChange={(e) => setCap(e.target.value)} placeholder="30" /></label>
        <label className="flabel" style={{ flex: 2 }}>Charter company<input style={field} value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Gold Coast Coach" /></label>
      </div>
      <label className="flabel">Departure (optional)<input style={field} value={depart} onChange={(e) => setDepart(e.target.value)} placeholder="Departs 8:00 AM · Gym Lot" /></label>
      <button style={{ ...primaryBtn, marginTop: 10, opacity: name.trim() ? 1 : 0.5 }} disabled={!name.trim()}
        onClick={() => { addBus(camp.id, { name: name.trim(), label: label.trim() || undefined, capacity: cap ? Number(cap) : undefined, charterOrg: org.trim() || undefined, departInfo: depart.trim() || undefined }); onClose(); }}>Add bus</button>
    </Modal>
  );
}

function AssignModal({ camp, bus, onClose }: { camp: Camp; bus: Bus; onClose: () => void }) {
  const { db, assignBus } = useStore();
  const [q, setQ] = useState('');
  const pool = attendeesOf(db, camp.id).filter((a) => !a.busId).filter((a) => q.trim() === '' || a.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal title={`Add rider to ${busLabel(bus)}`} onClose={onClose}>
      <label className="flabel">Search<input style={field} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search attendees…" autoFocus /></label>
      <div className="pick">
        {pool.map((a) => (
          <button key={a.id} className="pick-row" onClick={() => assignBus(a.id, bus.id)}>
            <span className="avatar sm">{initials(a.name)}</span><span className="pick-name">{a.name}{a.role && <span className="pick-role">{a.role}</span>}</span><i className="ti ti-arrow-right" />
          </button>
        ))}
        {pool.length === 0 && <div className="empty" style={{ margin: 0 }}>Everyone's already on a bus.</div>}
      </div>
    </Modal>
  );
}
