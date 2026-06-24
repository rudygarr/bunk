import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { useSession } from '../lib/session';
import { photosOf, downscaleImage } from '../lib/photos';
import { initials } from '../lib/format';
import type { Camp } from '../lib/types';

// Organizer view of the camp feed — see what campers post, add your own, and
// moderate (delete anything).
export default function PhotosPanel({ camp }: { camp: Camp }) {
  const { db, addPhoto, removePhoto } = useStore();
  const { user } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const photos = photosOf(db, camp.id);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try { addPhoto(camp.id, { authorName: user.name, dataUrl: await downscaleImage(f) }); } catch { /* ignore */ }
    setBusy(false);
    e.target.value = '';
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title"><i className="ti ti-photo" /> Photos</div>
        <button className="btn-primary sm" onClick={() => fileRef.current?.click()} disabled={busy}><i className="ti ti-camera-plus" /> {busy ? 'Loading…' : 'Add photo'}</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      </div>
      {photos.length === 0 && <div className="empty">No photos yet — campers’ posts show up here.</div>}
      <div className="ph-grid">
        {photos.map((p) => (
          <div key={p.id} className="ph-tile">
            <img src={p.dataUrl} alt={p.caption ?? ''} loading="lazy" />
            <button className="ph-del" title="Delete" onClick={() => removePhoto(p.id)}><i className="ti ti-trash" /></button>
            <div className="ph-tile-foot">
              <span className="avatar sm">{initials(p.authorName)}</span>
              <span className="ph-tile-cap">{p.caption || p.authorName}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
