import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { useSession } from '../lib/session';
import { photosOf, downscaleImage } from '../lib/photos';
import { initials } from '../lib/format';
import { field } from './Modal';
import type { Camp } from '../lib/types';

// Organizer view of the camp feed — see what campers post, add your own, and
// moderate (delete anything). Plus a link-out to an external shared album so
// camps that already use iCloud/Google Photos don't have to re-host anything.
export default function PhotosPanel({ camp }: { camp: Camp }) {
  const { db, addPhoto, removePhoto, updateCamp } = useStore();
  const { user } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [editAlbum, setEditAlbum] = useState(false);
  const [albumUrl, setAlbumUrl] = useState(camp.photoAlbumUrl ?? '');
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
      <div className="album-box">
        {camp.photoAlbumUrl && !editAlbum ? (
          <div className="album-set">
            <a className="album-open" href={camp.photoAlbumUrl} target="_blank" rel="noopener noreferrer"><i className="ti ti-external-link" /> Open shared album</a>
            <span className="album-note">Campers see this button too — they post to your iCloud/Google album, you don’t host a thing.</span>
            <button className="album-edit" onClick={() => { setAlbumUrl(camp.photoAlbumUrl ?? ''); setEditAlbum(true); }}><i className="ti ti-pencil" /></button>
          </div>
        ) : editAlbum || !camp.photoAlbumUrl ? (
          <div className="album-edit-row">
            <i className="ti ti-link" />
            <input style={field} value={albumUrl} onChange={(e) => setAlbumUrl(e.target.value)} placeholder="Paste a shared album link (iCloud, Google Photos…)" />
            <button className="btn-soft sm" onClick={() => { updateCamp(camp.id, { photoAlbumUrl: albumUrl.trim() || undefined }); setEditAlbum(false); }}>Save</button>
          </div>
        ) : null}
      </div>

      {photos.length === 0 && <div className="empty">No in-app photos yet — campers’ posts show up here (or just use a shared album above).</div>}
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
