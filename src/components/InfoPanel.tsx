import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { packingByCategory } from '../lib/packing';
import { downscaleImage } from '../lib/photos';
import { field } from './Modal';
import type { Camp } from '../lib/types';

export default function InfoPanel({ camp }: { camp: Camp }) {
  const { db, updateCamp, addPackingItem, removePackingItem } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const groups = packingByCategory(db, camp.id);
  const categories = groups.map((g) => g.category);

  const [cat, setCat] = useState('');
  const [text, setText] = useState('');
  const liveCamp = db.camps.find((c) => c.id === camp.id) ?? camp;

  async function onMap(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try { updateCamp(camp.id, { mapUrl: await downscaleImage(f, 1600, 0.85) }); } catch { /* ignore */ }
    setBusy(false);
    e.target.value = '';
  }
  function addItem() {
    const c = cat.trim() || 'General';
    if (!text.trim()) return;
    addPackingItem(camp.id, c, text.trim());
    setText('');
  }

  return (
    <div className="panel">
      <div className="panel-head"><div className="panel-title"><i className="ti ti-map-2" /> Camp info</div></div>

      {/* Map */}
      <div className="info-block">
        <div className="info-block-h">Camp map</div>
        {liveCamp.mapUrl ? (
          <div className="info-map">
            <img src={liveCamp.mapUrl} alt="Camp map" />
            <div className="info-map-actions">
              <button className="btn-soft sm" onClick={() => fileRef.current?.click()}><i className="ti ti-replace" /> Replace</button>
              <button className="btn-soft sm" onClick={() => updateCamp(camp.id, { mapUrl: undefined })}><i className="ti ti-trash" /> Remove</button>
            </div>
          </div>
        ) : (
          <button className="info-upload" onClick={() => fileRef.current?.click()} disabled={busy}>
            <i className="ti ti-upload" /> {busy ? 'Loading…' : 'Upload a camp map image'}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onMap} />
      </div>

      {/* Key facts */}
      <div className="info-block">
        <div className="info-block-h">Departure / check-in</div>
        <textarea style={{ ...field, height: 60, padding: '9px 12px', resize: 'vertical' }} defaultValue={liveCamp.departInfo ?? ''} onBlur={(e) => updateCamp(camp.id, { departInfo: e.target.value.trim() || undefined })} placeholder="e.g. Check-in 5:30 AM at the SAC; buses depart 6:00 AM" />
        <div className="info-block-h" style={{ marginTop: 12 }}>Contact</div>
        <input style={field} defaultValue={liveCamp.contact ?? ''} onBlur={(e) => updateCamp(camp.id, { contact: e.target.value.trim() || undefined })} placeholder="Who to reach with questions" />
      </div>

      {/* Packing list */}
      <div className="info-block">
        <div className="info-block-h">Packing list</div>
        <div className="info-add">
          <input style={{ ...field, flex: 1 }} list="pk-cats" value={cat} onChange={(e) => setCat(e.target.value)} placeholder="Category" />
          <datalist id="pk-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          <input style={{ ...field, flex: 1.6 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Item" onKeyDown={(e) => e.key === 'Enter' && addItem()} />
          <button className="btn-primary sm" onClick={addItem}><i className="ti ti-plus" /></button>
        </div>
        {groups.map((g) => (
          <div key={g.category} className="info-pk-group">
            <div className="info-pk-cat">{g.category}</div>
            {g.items.map((it) => (
              <div key={it.id} className="info-pk-item">
                <span>{it.text}</span>
                <button onClick={() => removePackingItem(it.id)}><i className="ti ti-x" /></button>
              </div>
            ))}
          </div>
        ))}
        {groups.length === 0 && <div className="empty">No packing items yet.</div>}
      </div>
    </div>
  );
}
