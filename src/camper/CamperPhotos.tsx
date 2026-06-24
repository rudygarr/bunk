import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { photosOf, downscaleImage } from '../lib/photos';
import { initials } from '../lib/format';
import type { Attendee } from '../lib/types';

export default function CamperPhotos({ me }: { me: Attendee }) {
  const { db, addPhoto, removePhoto } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);

  const photos = photosOf(db, me.campId);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try { setPending(await downscaleImage(f)); } catch { /* ignore bad image */ }
    setBusy(false);
    e.target.value = '';
  }
  function post() {
    if (!pending) return;
    addPhoto(me.campId, { authorId: me.id, authorName: me.name, dataUrl: pending, caption: caption.trim() || undefined });
    setPending(null); setCaption('');
  }

  return (
    <>
      <div className="c-photos-head">
        <div className="c-hello" style={{ fontSize: 20, margin: 0 }}>Camp photos</div>
        <button className="c-add-photo" onClick={() => fileRef.current?.click()} disabled={busy}>
          <i className="ti ti-camera-plus" /> {busy ? 'Loading…' : 'Add'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      </div>

      {pending && (
        <div className="c-photo-compose">
          <img src={pending} alt="" />
          <input className="c-cap-input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a caption…" />
          <div className="c-compose-actions">
            <button className="c-cancel" onClick={() => { setPending(null); setCaption(''); }}>Cancel</button>
            <button className="c-post" onClick={post}><i className="ti ti-send" /> Post</button>
          </div>
        </div>
      )}

      {photos.length === 0 && !pending && <div className="empty" style={{ marginTop: 30 }}>No photos yet — be the first to post!</div>}
      <div className="c-feed">
        {photos.map((p) => (
          <div key={p.id} className="c-photo">
            <img src={p.dataUrl} alt={p.caption ?? ''} loading="lazy" />
            <div className="c-photo-foot">
              <span className="avatar sm">{initials(p.authorName)}</span>
              <div className="c-photo-meta">
                {p.caption && <div className="c-photo-cap">{p.caption}</div>}
                <div className="c-photo-by">{p.authorName.split(' ')[0]}</div>
              </div>
              {p.authorId === me.id && <button className="c-photo-del" title="Delete" onClick={() => removePhoto(p.id)}><i className="ti ti-trash" /></button>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
