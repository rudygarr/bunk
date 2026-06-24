import { useState } from 'react';
import { useStore } from '../lib/store';
import { useSession } from '../lib/session';
import { announcementsOf, audienceLabel } from '../lib/announce';
import { busesOf, cabinsOf, attendeesOf } from '../lib/camps';
import { field } from './Modal';
import type { Camp, AudienceKind } from '../lib/types';

const AUD_ICON: Record<AudienceKind, string> = { everyone: 'ti-world', bus: 'ti-bus', cabin: 'ti-home', person: 'ti-user' };

export default function AnnouncePanel({ camp }: { camp: Camp }) {
  const { db, postAnnouncement, removeAnnouncement, togglePin } = useStore();
  const { user } = useSession();
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<AudienceKind>('everyone');
  const [audId, setAudId] = useState('');

  const buses = busesOf(db, camp.id);
  const cabins = cabinsOf(db, camp.id);
  const people = attendeesOf(db, camp.id);
  const list = announcementsOf(db, camp.id);

  function post() {
    if (!body.trim()) return;
    if (kind !== 'everyone' && !audId) return;
    postAnnouncement(camp.id, { title: title.trim() || undefined, body: body.trim(), audienceKind: kind, audienceId: kind === 'everyone' ? undefined : audId, author: user.name });
    setBody(''); setTitle('');
  }

  return (
    <div className="panel">
      <div className="panel-head"><div className="panel-title"><i className="ti ti-speakerphone" /> Announcements</div></div>

      <div className="ann-compose">
        <input style={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" />
        <textarea style={{ ...field, height: 76, padding: '10px 12px', resize: 'vertical', marginTop: 8 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write an announcement…" />
        <div className="ann-aud">
          <div className="seg">
            {(['everyone', 'bus', 'cabin', 'person'] as AudienceKind[]).map((k) => (
              <button key={k} className={kind === k ? 'on' : ''} onClick={() => { setKind(k); setAudId(''); }}>
                <i className={'ti ' + AUD_ICON[k]} /> {k === 'everyone' ? 'Everyone' : k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
          {kind !== 'everyone' && (
            <select style={{ ...field, appearance: 'auto', marginTop: 8 }} value={audId} onChange={(e) => setAudId(e.target.value)}>
              <option value="">{kind === 'bus' ? 'Pick a bus…' : kind === 'cabin' ? 'Pick a cabin…' : 'Pick a person…'}</option>
              {kind === 'bus' && buses.map((b) => <option key={b.id} value={b.id}>{b.name}{b.label ? ` · ${b.label}` : ''}</option>)}
              {kind === 'cabin' && cabins.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              {kind === 'person' && people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
        <button className="btn-primary" style={{ marginTop: 10, width: '100%', justifyContent: 'center', opacity: body.trim() && (kind === 'everyone' || audId) ? 1 : 0.5 }}
          disabled={!body.trim() || (kind !== 'everyone' && !audId)} onClick={post}>
          <i className="ti ti-send" /> Post announcement
        </button>
      </div>

      <div className="ann-list">
        {list.length === 0 && <div className="empty">No announcements yet.</div>}
        {list.map((a) => (
          <div key={a.id} className={'ann' + (a.pinned ? ' pinned' : '')}>
            <div className="ann-main">
              <div className="ann-top">
                <span className={'ann-tag ' + a.audienceKind}><i className={'ti ' + AUD_ICON[a.audienceKind]} /> {audienceLabel(db, a)}</span>
                {a.pinned && <span className="ann-pin"><i className="ti ti-pin-filled" /> Pinned</span>}
              </div>
              {a.title && <div className="ann-title">{a.title}</div>}
              <div className="ann-body">{a.body}</div>
              <div className="ann-by">— {a.author}</div>
            </div>
            <div className="ann-actions">
              <button title={a.pinned ? 'Unpin' : 'Pin'} onClick={() => togglePin(a.id)}><i className={'ti ' + (a.pinned ? 'ti-pin-filled' : 'ti-pin')} /></button>
              <button title="Delete" onClick={() => removeAnnouncement(a.id)}><i className="ti ti-trash" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
