import Modal, { primaryBtn } from './Modal';

export interface PreviewRow { name: string; target: string; note?: string }

// Shows what the algorithm wants to do before anything changes. The organizer
// reviews, then Applies (and can still drag/override afterward).
export default function AutoFillPreview({
  title, subtitle, rows, unplaced, onApply, onClose,
}: {
  title: string;
  subtitle: string;
  rows: PreviewRow[];
  unplaced: string[];
  onApply: () => void;
  onClose: () => void;
}) {
  // Group by destination for a clean "who lands where" view.
  const groups = new Map<string, PreviewRow[]>();
  for (const r of rows) (groups.get(r.target) ?? groups.set(r.target, []).get(r.target)!).push(r);

  return (
    <Modal title={title} onClose={onClose}>
      <div className="af-sub"><i className="ti ti-sparkles" /> {subtitle}</div>

      {rows.length === 0 ? (
        <div className="empty">Everyone's already placed — nothing to auto-fill.</div>
      ) : (
        <div className="af-groups">
          {[...groups.entries()].map(([target, list]) => (
            <div key={target} className="af-group">
              <div className="af-group-h">{target} <span className="af-n">+{list.length}</span></div>
              <div className="af-chips">
                {list.map((r) => (
                  <span key={r.name} className="af-chip">{r.name}{r.note && <span className="af-chip-note">{r.note}</span>}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {unplaced.length > 0 && (
        <div className="af-unplaced"><i className="ti ti-alert-triangle" /> No room for {unplaced.length}: {unplaced.join(', ')} — add capacity or place by hand.</div>
      )}

      {rows.length > 0 && (
        <button style={{ ...primaryBtn, marginTop: 14 }} onClick={onApply}>
          Apply — place {rows.length} {rows.length === 1 ? 'person' : 'people'}
        </button>
      )}
    </Modal>
  );
}
