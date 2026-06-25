import { useStore } from '../lib/store';
import { dietarySummary } from '../lib/kitchen';
import { fmtRange } from '../lib/format';
import Modal from './Modal';
import type { Camp } from '../lib/types';

// Kitchen-facing summary of dietary restrictions + allergies, viewable and
// printable, so meal prep accounts for everyone.
export default function KitchenReport({ camp, onClose }: { camp: Camp; onClose: () => void }) {
  const { db } = useStore();
  const { diets, allergies, total } = dietarySummary(db, camp.id);

  function print() {
    const rows = (arr: string[]) => arr.map((s) => `<li>${s}</li>`).join('');
    const html = `<!doctype html><html><head><title>${camp.name} — Kitchen report</title>
      <style>body{font:14px -apple-system,system-ui,sans-serif;padding:32px;color:#16201c}h1{margin:0}h2{border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:24px}
      .meta{color:#666;margin-bottom:8px}.grp{margin:10px 0}.grp b{font-size:15px}ul{margin:4px 0 0 18px}.a{margin:6px 0}</style></head>
      <body><h1>${camp.name}</h1><div class="meta">${fmtRange(camp.startDate, camp.endDate)} · ${camp.location} · ${total} attendees</div>
      <h2>Dietary restrictions</h2>${diets.length ? diets.map((d) => `<div class="grp"><b>${d.label} — ${d.names.length}</b><ul>${rows(d.names)}</ul></div>`).join('') : '<p>None recorded.</p>'}
      <h2>Allergies</h2>${allergies.length ? allergies.map((a) => `<div class="a"><b>${a.name}:</b> ${a.detail}</div>`).join('') : '<p>None recorded.</p>'}
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 100); }
  }

  return (
    <Modal title="Kitchen report" onClose={onClose}>
      <div className="kr-sub"><i className="ti ti-tools-kitchen-2" /> What the kitchen needs to prep for, pulled from the roster's health info.</div>

      <div className="kr-h">Dietary restrictions</div>
      {diets.length === 0 && <div className="empty" style={{ margin: 0 }}>None recorded.</div>}
      {diets.map((d) => (
        <div key={d.label} className="kr-diet">
          <div className="kr-diet-h"><strong>{d.label}</strong><span className="kr-n">{d.names.length}</span></div>
          <div className="kr-names">{d.names.join(', ')}</div>
        </div>
      ))}

      <div className="kr-h" style={{ marginTop: 16 }}>Allergies <span className="kr-count">{allergies.length}</span></div>
      {allergies.length === 0 && <div className="empty" style={{ margin: 0 }}>None recorded.</div>}
      {allergies.map((a) => (
        <div key={a.name} className="kr-allergy"><i className="ti ti-alert-triangle" /><span><strong>{a.name}</strong> — {a.detail}</span></div>
      ))}

      <button className="login-btn" style={{ marginTop: 16 }} onClick={print}><i className="ti ti-printer" /> Print for the kitchen</button>
    </Modal>
  );
}
