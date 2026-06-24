import type { ReactNode, CSSProperties } from 'react';

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="modal-x" onClick={onClose} aria-label="Close"><i className="ti ti-x" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export const field: CSSProperties = {
  width: '100%', height: 42, borderRadius: 'var(--r-sm)', border: '1px solid var(--border)',
  background: 'var(--surface-2)', color: 'var(--text-1)', padding: '0 12px', fontSize: 15, fontFamily: 'inherit',
};
export const primaryBtn: CSSProperties = {
  width: '100%', height: 46, borderRadius: 'var(--r-md)', border: 'none',
  background: 'var(--pine)', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
};
