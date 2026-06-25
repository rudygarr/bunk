import { useState } from 'react';
import { useStore } from '../lib/store';
import {
  busesOf, busRoster, cabinsOf, roomsOf, cabinRoster, roomRoster, cabinLeaders, cabinBeds,
  rolesOf, shiftsOf, dutiesOfShift, looseDuties, shiftWindow, cabinOf, isFlagged, CABIN_KINDS,
  attendeesOf,
} from '../lib/camps';
import { fmtRange } from '../lib/format';
import type { Camp, Attendee } from '../lib/types';
import Modal from './Modal';

type Which = 'bus' | 'cabin' | 'role' | 'medical' | 'all';

// Print-friendly packets the organizer hands out: bus manifests, cabin rosters,
// and the role/shift schedule. Everything renders into a .printable region that
// the print stylesheet reveals (and the app chrome hides).
export default function PrintPackets({ camp }: { camp: Camp }) {
  const { db } = useStore();
  const [open, setOpen] = useState(false);
  const [which, setWhich] = useState<Which>('all');

  function print(w: Which) {
    setWhich(w);
    setOpen(false);
    // let the class apply before the print dialog snapshots the page
    setTimeout(() => window.print(), 60);
  }

  const buses = busesOf(db, camp.id);
  const cabins = cabinsOf(db, camp.id);
  const roles = rolesOf(db, camp.id);
  const cabinName = (a: Attendee) => { const c = cabinOf(db, a); return c ? c.name : '—'; };
  const med = (a: Attendee) => (isFlagged(a) ? <span className="pp-med">⚕ {a.health?.allergies || a.health?.meds}</span> : null);

  return (
    <>
      <button className="hero-print" onClick={() => setOpen(true)} title="Print packets"><i className="ti ti-printer" /> Print</button>

      {open && (
        <Modal title="Print a packet" onClose={() => setOpen(false)}>
          <div className="pp-opts">
            <button className="pp-opt" onClick={() => print('bus')}><i className="ti ti-bus" /><span><strong>Bus manifests</strong>Riders per bus, with cabin + medical flags</span></button>
            <button className="pp-opt" onClick={() => print('cabin')}><i className="ti ti-home" /><span><strong>Cabin rosters</strong>Occupants per cabin/room, leaders, medical flags</span></button>
            <button className="pp-opt" onClick={() => print('role')}><i className="ti ti-clipboard-check" /><span><strong>Role schedule</strong>Roles, shifts, and who's on each</span></button>
            <button className="pp-opt" onClick={() => print('medical')}><i className="ti ti-emergency-bed" /><span><strong>Emergency call sheet</strong>Emergency contacts + allergies/meds</span></button>
            <button className="pp-opt" onClick={() => print('all')}><i className="ti ti-files" /><span><strong>Full packet</strong>Everything above</span></button>
          </div>
        </Modal>
      )}

      <div className={'printable show-' + which}>
        <div className="pp-doc-head">
          <h1>{camp.name}</h1>
          <div>{fmtRange(camp.startDate, camp.endDate)} · {camp.location}</div>
        </div>

        <section className="pp-bus">
          <h2>Bus manifests</h2>
          {buses.map((b) => {
            const riders = busRoster(db, b.id);
            return (
              <div key={b.id} className="pp-block">
                <h3>{b.label ? `${b.name} — ${b.label}` : b.name} <span className="pp-sub">{riders.length} riders{b.capacity ? ` / ${b.capacity}` : ''}{b.charterOrg ? ` · ${b.charterOrg}` : ''}{b.departInfo ? ` · ${b.departInfo}` : ''}</span></h3>
                <table className="pp-table"><tbody>
                  {riders.map((a) => <tr key={a.id}><td className="pp-chk" /><td>{a.name}</td><td className="pp-dim">{a.role}</td><td className="pp-dim">{cabinName(a)}</td><td>{med(a)}</td></tr>)}
                  {riders.length === 0 && <tr><td colSpan={5} className="pp-dim">No riders assigned.</td></tr>}
                </tbody></table>
              </div>
            );
          })}
        </section>

        <section className="pp-cabin">
          <h2>Cabin rosters</h2>
          {CABIN_KINDS.map((k) => {
            const list = cabins.filter((c) => c.kind === k.key);
            if (!list.length) return null;
            return (
              <div key={k.key}>
                <h4 className="pp-kind">{k.label}</h4>
                {list.map((c) => {
                  const rooms = roomsOf(db, c.id);
                  const leaders = cabinLeaders(db, c.id);
                  return (
                    <div key={c.id} className="pp-block">
                      <h3>{c.name} <span className="pp-sub">{cabinRoster(db, c.id).length}/{cabinBeds(db, c) || '–'} beds{leaders.length ? ` · led by ${leaders.map((l) => l.name).join(', ')}` : ''}</span></h3>
                      {rooms.length > 0 ? rooms.map((rm) => (
                        <div key={rm.id} className="pp-room">
                          <div className="pp-room-h">{rm.name} ({roomRoster(db, rm.id).length}/{rm.beds})</div>
                          <table className="pp-table"><tbody>{roomRoster(db, rm.id).map((a) => <tr key={a.id}><td className="pp-chk" /><td>{a.name}{a.cabinLeader ? ' ★' : ''}</td><td>{med(a)}</td></tr>)}</tbody></table>
                        </div>
                      )) : (
                        <table className="pp-table"><tbody>{cabinRoster(db, c.id).map((a) => <tr key={a.id}><td className="pp-chk" /><td>{a.name}{a.cabinLeader ? ' ★' : ''}</td><td>{med(a)}</td></tr>)}</tbody></table>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>

        <section className="pp-medical">
          <h2>Emergency &amp; medical call sheet</h2>
          <table className="pp-table"><thead><tr><th>Name</th><th>Cabin</th><th>Emergency contact</th><th>Phone</th><th>Allergies / meds</th></tr></thead><tbody>
            {attendeesOf(db, camp.id).filter((a) => a.kind === 'camper').map((a) => {
              const h = a.health;
              const flags = [h?.allergies, h?.meds].filter(Boolean).join(' · ');
              return (
                <tr key={a.id}>
                  <td><b>{a.name}</b></td>
                  <td className="pp-dim">{cabinName(a)}</td>
                  <td>{h?.emergencyName || <span className="pp-dim">—</span>}</td>
                  <td>{h?.emergencyPhone || <span className="pp-dim">—</span>}</td>
                  <td>{flags ? <span className="pp-med">⚕ {flags}</span> : <span className="pp-dim">none</span>}</td>
                </tr>
              );
            })}
          </tbody></table>
        </section>

        <section className="pp-role">
          <h2>Role schedule</h2>
          {roles.map((role) => {
            const shifts = shiftsOf(db, role.id);
            return (
              <div key={role.id} className="pp-block">
                <h3>{role.name}{role.blurb ? <span className="pp-sub"> · {role.blurb}</span> : null}</h3>
                {shifts.length > 0 ? shifts.map((s) => {
                  const ds = dutiesOfShift(db, s.id);
                  return <div key={s.id} className="pp-line"><b>{s.name}</b>{shiftWindow(s) ? ` (${shiftWindow(s)})` : ''}: {ds.length ? ds.map((d) => d.name).join(', ') : <span className="pp-dim">unfilled</span>}</div>;
                }) : <div className="pp-line">{looseDuties(db, role.id).map((d) => d.name).join(', ') || <span className="pp-dim">no one assigned</span>}</div>}
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}
