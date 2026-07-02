import { useState } from 'react';
import { useStore } from '../lib/store';
import { campById, docsOf, contactsForViewer } from '../lib/camps';
import { packingByCategory } from '../lib/packing';
import CampMap from '../components/CampMap';
import CampFiles from '../components/CampFiles';
import { fmtRange } from '../lib/format';
import type { Attendee } from '../lib/types';

export default function CamperInfo({ me }: { me: Attendee }) {
  const { db } = useStore();
  const camp = campById(db, me.campId);
  const groups = packingByCategory(db, me.campId);
  const [zoom, setZoom] = useState(false);
  // Local check state (resets on reload) — a handy pre-trip checklist.
  const [packed, setPacked] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setPacked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  if (!camp) return null;
  const myDocs = docsOf(db, camp.id).filter((d) => d.audience === 'everyone' || (me.kind === 'camper' ? d.audience === 'campers' : d.audience === 'staff'));
  return (
    <>
      <div className="c-hello" style={{ fontSize: 20 }}>Camp info</div>

      {camp.logoUrl && <img className="c-camp-logo" src={camp.logoUrl} alt={camp.name} />}

      {/* Files & forms */}
      {myDocs.length > 0 && (
        <div className="c-card">
          <div className="c-card-h"><i className="ti ti-files" /> Files &amp; forms</div>
          <CampFiles camp={camp} mode={me.kind === 'camper' ? 'camper' : 'staff'} />
        </div>
      )}

      {/* Key facts */}
      <div className="c-card">
        <div className="c-card-h"><i className="ti ti-info-circle" /> {camp.name}</div>
        <div className="c-info-line"><i className="ti ti-calendar" /> {fmtRange(camp.startDate, camp.endDate)}</div>
        <div className="c-info-line"><i className="ti ti-map-pin" /> {camp.location}</div>
        {camp.departInfo && <div className="c-info-line"><i className="ti ti-bus" /> {camp.departInfo}</div>}
        {camp.contact && <div className="c-info-line"><i className="ti ti-user" /> {camp.contact}</div>}
      </div>

      {/* Who to call — only contacts shared with this person */}
      {(() => {
        const contacts = contactsForViewer(db, camp.id, me.kind === 'staff' ? 'staff' : 'camper');
        return contacts.length > 0 ? (
          <div className="c-card">
            <div className="c-card-h"><i className="ti ti-phone" /> Who to call</div>
            {contacts.map((c) => (
              <div key={c.id} className="c-info-line" style={{ justifyContent: 'space-between' }}>
                <span><strong>{c.name}</strong>{c.role ? ` · ${c.role}` : ''}</span>
                {c.phone && <a className="kc-call" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}><i className="ti ti-phone" aria-hidden="true" /> {c.phone}</a>}
              </div>
            ))}
          </div>
        ) : null;
      })()}

      {/* Map */}
      {camp.mapUrl && (
        <div className="c-card">
          <div className="c-card-h"><i className="ti ti-map-2" /> Camp map</div>
          <CampMap camp={camp} />
          <button className="btn-soft sm" style={{ marginTop: 8 }} onClick={() => setZoom(true)}><i className="ti ti-zoom-in" /> Enlarge</button>
        </div>
      )}

      {/* Packing checklist */}
      {total > 0 && (
        <div className="c-card">
          <div className="c-card-h"><i className="ti ti-checklist" /> Packing list <span className="c-pack-count">{packed.size}/{total}</span></div>
          {groups.map((g) => (
            <div key={g.category} className="c-pack-group">
              <div className="c-pack-cat">{g.category}</div>
              {g.items.map((it) => (
                <button key={it.id} className={'c-pack-item' + (packed.has(it.id) ? ' on' : '')} onClick={() => toggle(it.id)}>
                  <i className={'ti ' + (packed.has(it.id) ? 'ti-square-check-filled' : 'ti-square')} />
                  <span>{it.text}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {zoom && camp.mapUrl && (
        <div className="c-lightbox" onClick={() => setZoom(false)}>
          <button className="c-lightbox-x" onClick={() => setZoom(false)}><i className="ti ti-x" /></button>
          <img src={camp.mapUrl} alt="Camp map" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
