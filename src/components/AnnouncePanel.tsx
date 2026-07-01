import { useState } from 'react';
import { useStore } from '../lib/store';
import { useSession } from '../lib/session';
import { announcementsOf, audienceLabel } from '../lib/announce';
import { busesOf, cabinsOf, attendeesOf, smallGroupsOf } from '../lib/camps';
import { teamsOf } from '../lib/teams';
import { initials } from '../lib/format';
import { field } from './Modal';
import type { Camp, AudienceKind } from '../lib/types';

const AUD_ICON: Record<AudienceKind, string> = { everyone: 'ti-world', bus: 'ti-bus', cabin: 'ti-home', team: 'ti-flag', smallGroup: 'ti-users-group', volunteers: 'ti-clipboard-check', person: 'ti-user', custom: 'ti-list-check' };
const AUD_LABEL: Record<AudienceKind, string> = { everyone: 'Everyone', bus: 'Bus', cabin: 'Cabin', team: 'Team', smallGroup: 'Group', volunteers: 'Volunteers', person: 'Person', custom: 'Pick…' };
// Audiences needing a single pick from a dropdown.
const PICK_KINDS: AudienceKind[] = ['bus', 'cabin', 'team', 'smallGroup', 'person'];

export default function AnnouncePanel({ camp }: { camp: Camp }) {
  const { db, postAnnouncement, removeAnnouncement, togglePin } = useStore();
  const { user } = useSession();
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<AudienceKind>('everyone');
  const [audId, setAudId] = useState('');
  const [customIds, setCustomIds] = useState<string[]>([]);

  const buses = busesOf(db, camp.id);
  const cabins = cabinsOf(db, camp.id);
  const teams = teamsOf(db, camp.id);
  const groups = smallGroupsOf(db, camp.id);
  const people = attendeesOf(db, camp.id);
  const list = announcementsOf(db, camp.id);

  const needsPick = PICK_KINDS.includes(kind);
  const valid = !!body.trim() && (kind === 'everyone' || kind === 'volunteers' || (kind === 'custom' ? customIds.length > 0 : !!audId));

  function post() {
    if (!valid) return;
    postAnnouncement(camp.id, {
      title: title.trim() || undefined, body: body.trim(), audienceKind: kind,
      audienceId: needsPick ? audId : undefined,
      audienceIds: kind === 'custom' ? customIds : undefined,
      author: user.name,
    });
    setBody(''); setTitle(''); setCustomIds([]);
  }
  const toggleCustom = (id: string) => setCustomIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <div className="panel">
      <div className="panel-head"><div className="panel-title"><i className="ti ti-speakerphone" /> Announcements</div></div>

      <div className="ann-compose">
        <input style={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" />
        <textarea style={{ ...field, height: 76, padding: '10px 12px', resize: 'vertical', marginTop: 8 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write an announcement…" />
        <div className="ann-aud">
          <div className="seg seg-wrap">
            {(['everyone', 'bus', 'cabin', 'smallGroup', 'team', 'volunteers', 'person', 'custom'] as AudienceKind[]).map((k) => (
              <button key={k} className={kind === k ? 'on' : ''} onClick={() => { setKind(k); setAudId(''); }}>
                <i className={'ti ' + AUD_ICON[k]} /> {AUD_LABEL[k]}
              </button>
            ))}
          </div>
          {needsPick && (
            <select style={{ ...field, appearance: 'auto', marginTop: 8 }} value={audId} onChange={(e) => setAudId(e.target.value)}>
              <option value="">{kind === 'bus' ? 'Pick a bus…' : kind === 'cabin' ? 'Pick a cabin…' : kind === 'team' ? 'Pick a team…' : kind === 'smallGroup' ? 'Pick a group…' : 'Pick a person…'}</option>
              {kind === 'bus' && buses.map((b) => <option key={b.id} value={b.id}>{b.name}{b.label ? ` · ${b.label}` : ''}</option>)}
              {kind === 'cabin' && cabins.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              {kind === 'team' && teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              {kind === 'smallGroup' && groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              {kind === 'person' && people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {kind === 'volunteers' && <div className="note" style={{ marginTop: 8 }}><i className="ti ti-info-circle" /> Goes to all staff & parent volunteers.</div>}
          {kind === 'custom' && (
            <div className="ann-custom">
              <div className="ann-custom-h">{customIds.length} selected — tap to add or remove</div>
              <div className="ann-custom-list">
                {people.map((p) => {
                  const on = customIds.includes(p.id);
                  return (
                    <button key={p.id} className={'ann-pick' + (on ? ' on' : '')} onClick={() => toggleCustom(p.id)}>
                      <span className="avatar sm">{initials(p.name)}</span>{p.name.split(' ')[0]}
                      <i className={'ti ' + (on ? 'ti-check' : 'ti-plus')} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <button className="btn-primary" style={{ marginTop: 10, width: '100%', justifyContent: 'center', opacity: valid ? 1 : 0.5 }} disabled={!valid} onClick={post}>
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
              <button aria-label={a.pinned ? 'Unpin announcement' : 'Pin announcement'} title={a.pinned ? 'Unpin' : 'Pin'} onClick={() => togglePin(a.id)}><i className={'ti ' + (a.pinned ? 'ti-pin-filled' : 'ti-pin')} aria-hidden="true" /></button>
              <button aria-label="Delete announcement" title="Delete" onClick={() => removeAnnouncement(a.id)}><i className="ti ti-trash" aria-hidden="true" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
