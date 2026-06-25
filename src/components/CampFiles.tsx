import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { docsOf } from '../lib/camps';
import { field } from './Modal';
import type { Camp, CampDoc, DocAudience } from '../lib/types';

const ICON: Record<CampDoc['fileType'], string> = { pdf: 'ti-file-type-pdf', image: 'ti-photo', doc: 'ti-file-text', link: 'ti-external-link' };
const AUD: Record<DocAudience, string> = { everyone: 'Everyone & parents', campers: 'Campers', staff: 'Staff' };

// Mode controls what shows: 'edit' (organizer, add/remove all), or a read-only
// audience view ('public' = everyone only; 'camper'/'staff' add their scope).
export default function CampFiles({ camp, mode }: { camp: Camp; mode: 'edit' | 'public' | 'camper' | 'staff' }) {
  const { db, addDoc, removeDoc } = useStore();
  const all = docsOf(db, camp.id);
  const docs = mode === 'edit' ? all
    : mode === 'public' ? all.filter((d) => d.audience === 'everyone')
    : mode === 'camper' ? all.filter((d) => d.audience === 'everyone' || d.audience === 'campers')
    : all.filter((d) => d.audience === 'everyone' || d.audience === 'staff');

  if (mode !== 'edit' && docs.length === 0) return null;

  return (
    <div className="files">
      {docs.length === 0 && mode === 'edit' && <div className="empty" style={{ margin: '0 0 10px' }}>No files yet — add schedules, maps, packing lists, or parent forms.</div>}
      <div className="files-list">
        {docs.map((d) => (
          <div key={d.id} className="file-row">
            <a className="file-open" href={d.url} target="_blank" rel="noopener noreferrer" {...(!d.external ? { download: d.title } : {})}>
              <i className={'ti ' + ICON[d.fileType]} />
              <span className="file-main"><span className="file-title">{d.title}</span><span className="file-sub">{d.category ? `${d.category} · ` : ''}{AUD[d.audience]}{d.external ? ' · link' : ''}</span></span>
              <i className="ti ti-chevron-right" />
            </a>
            {mode === 'edit' && <button className="file-x" onClick={() => removeDoc(d.id)}><i className="ti ti-trash" /></button>}
          </div>
        ))}
      </div>
      {mode === 'edit' && <AddDoc camp={camp} onAdd={addDoc} />}
    </div>
  );
}

function AddDoc({ camp, onAdd }: { camp: Camp; onAdd: ReturnType<typeof useStore>['addDoc'] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('');
  const [audience, setAudience] = useState<DocAudience>('everyone');
  const [busy, setBusy] = useState(false);

  function typeOf(name: string): CampDoc['fileType'] {
    const n = name.toLowerCase();
    if (n.endsWith('.pdf')) return 'pdf';
    if (/\.(png|jpe?g|gif|webp|svg)$/.test(n)) return 'image';
    return 'doc';
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      onAdd(camp.id, { title: title.trim() || f.name, url: String(reader.result), external: false, fileType: typeof f.name === 'string' ? typeOf(f.name) : 'doc', audience, category: category.trim() || undefined });
      setTitle(''); setCategory(''); setBusy(false);
      e.target.value = '';
    };
    reader.onerror = () => setBusy(false);
    reader.readAsDataURL(f);
  }
  function addLink() {
    if (!title.trim() || !link.trim()) return;
    onAdd(camp.id, { title: title.trim(), url: link.trim(), external: true, fileType: 'link', audience, category: category.trim() || undefined });
    setTitle(''); setLink(''); setCategory('');
  }

  return (
    <div className="file-add">
      <input style={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Consent form, Camp map, Packing list)" />
      <div className="file-add-row">
        <input style={{ ...field, flex: 1 }} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (optional)" />
        <select style={{ ...field, appearance: 'auto', flex: 1 }} value={audience} onChange={(e) => setAudience(e.target.value as DocAudience)}>
          <option value="everyone">Everyone & parents</option>
          <option value="campers">Campers</option>
          <option value="staff">Staff</option>
        </select>
      </div>
      <div className="file-add-row">
        <button className="btn-soft sm" onClick={() => fileRef.current?.click()} disabled={busy}><i className="ti ti-upload" /> {busy ? 'Uploading…' : 'Upload file'}</button>
        <span className="file-or">or</span>
        <input style={{ ...field, flex: 1 }} value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste a link" onKeyDown={(e) => e.key === 'Enter' && addLink()} />
        <button className="btn-primary sm" style={{ opacity: title.trim() && link.trim() ? 1 : 0.5 }} disabled={!title.trim() || !link.trim()} onClick={addLink}>Add</button>
      </div>
      <input ref={fileRef} type="file" accept=".pdf,image/*,.doc,.docx" hidden onChange={onFile} />
    </div>
  );
}
