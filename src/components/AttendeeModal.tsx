import { useState } from 'react';
import { useStore } from '../lib/store';
import { busOf, busLabel, cabinOf, roomOf } from '../lib/camps';
import type { Attendee, Health } from '../lib/types';
import Modal, { field, primaryBtn } from './Modal';

// Attendee detail — their assignments at a glance, plus an editable health &
// emergency section the nurse and cabin leaders rely on.
export default function AttendeeModal({ attendee, onClose }: { attendee: Attendee; onClose: () => void }) {
  const { db, setHealth } = useStore();
  const a = db.attendees.find((x) => x.id === attendee.id) ?? attendee;
  const bus = busOf(db, a);
  const cabin = cabinOf(db, a);
  const room = roomOf(db, a);

  const [h, setH] = useState<Health>(a.health ?? {});
  const set = (k: keyof Health) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setH({ ...h, [k]: e.target.value });
  function save() { setHealth(a.id, h); onClose(); }

  return (
    <Modal title={a.name} onClose={onClose}>
      <div className="am-tags">
        {a.role && <span className="tagchip">{a.role}</span>}
        <span className="am-kind">{a.kind}</span>
      </div>
      <div className="am-assign">
        {bus && <div><i className="ti ti-bus" /> {busLabel(bus)}{bus.departInfo ? ` · ${bus.departInfo}` : ''}</div>}
        {cabin && <div><i className="ti ti-home" /> {cabin.name}{room ? ` · ${room.name}` : ''}{a.cabinLeader ? ' · leader' : ''}</div>}
        {a.email && <div><i className="ti ti-mail" /> {a.email}</div>}
        {!bus && !cabin && <div className="empty-inline">No bus or cabin assigned yet.</div>}
      </div>

      <div className="am-section"><i className="ti ti-stethoscope" /> Health &amp; emergency</div>
      <label className="flabel">Allergies<input style={field} value={h.allergies ?? ''} onChange={set('allergies')} placeholder="e.g. Peanuts (EpiPen)" /></label>
      <label className="flabel">Medications<input style={field} value={h.meds ?? ''} onChange={set('meds')} placeholder="e.g. Inhaler, as needed" /></label>
      <label className="flabel">Dietary<input style={field} value={h.dietary ?? ''} onChange={set('dietary')} placeholder="e.g. Vegetarian, gluten-free" /></label>
      <div style={{ display: 'flex', gap: 10 }}>
        <label className="flabel" style={{ flex: 1 }}>Emergency contact<input style={field} value={h.emergencyName ?? ''} onChange={set('emergencyName')} placeholder="Name" /></label>
        <label className="flabel" style={{ flex: 1 }}>Phone<input style={field} value={h.emergencyPhone ?? ''} onChange={set('emergencyPhone')} placeholder="(305) 555-0000" /></label>
      </div>
      <label className="flabel">Notes<textarea style={{ ...field, height: 64, padding: '10px 12px', resize: 'vertical' }} value={h.notes ?? ''} onChange={set('notes')} placeholder="Anything else the team should know" /></label>
      <button style={{ ...primaryBtn, marginTop: 6 }} onClick={save}>Save</button>
    </Modal>
  );
}
