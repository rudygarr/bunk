import { useState } from 'react';
import { useStore } from '../lib/store';
import type { Camp } from '../lib/types';

// The camp map with labeled pins. Read-only for campers/viewers; in editable
// mode the organizer toggles "Add pin" and taps the image to drop a numbered
// marker, then names it in the legend.
export default function CampMap({ camp, editable = false }: { camp: Camp; editable?: boolean }) {
  const { db, addMapPin, updateMapPin, removeMapPin } = useStore();
  const live = db.camps.find((c) => c.id === camp.id) ?? camp;
  const pins = live.mapPins ?? [];
  const [adding, setAdding] = useState(false);

  if (!live.mapUrl) return null;

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!editable || !adding) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10;
    const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10;
    addMapPin(camp.id, x, y, `Location ${pins.length + 1}`);
  }

  return (
    <div className="cmap">
      <div className={'cmap-img' + (editable && adding ? ' placing' : '')} onClick={onClick}>
        <img src={live.mapUrl} alt="Camp map" />
        {pins.map((p, i) => (
          <span key={p.id} className="cmap-pin" style={{ left: `${p.x}%`, top: `${p.y}%` }} title={p.label}>{i + 1}</span>
        ))}
      </div>

      {editable && (
        <button className={'btn-soft sm' + (adding ? ' on' : '')} style={{ marginTop: 8 }} onClick={() => setAdding((a) => !a)}>
          <i className={'ti ' + (adding ? 'ti-check' : 'ti-map-pin-plus')} /> {adding ? 'Done placing' : 'Add pins'}
        </button>
      )}

      {pins.length > 0 && (
        <div className="cmap-legend">
          {pins.map((p, i) => (
            <div key={p.id} className="cmap-leg-row">
              <span className="cmap-leg-n">{i + 1}</span>
              {editable ? (
                <>
                  <input className="cmap-leg-input" defaultValue={p.label} onBlur={(e) => updateMapPin(camp.id, p.id, e.target.value.trim() || p.label)} />
                  <button className="cmap-leg-x" onClick={() => removeMapPin(camp.id, p.id)}><i className="ti ti-x" /></button>
                </>
              ) : (
                <span className="cmap-leg-label">{p.label}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
