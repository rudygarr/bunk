import { useState } from 'react';
import { useStore } from '../lib/store';
import { FEATURES, DEFAULT_FEATURES } from '../lib/camps';
import Modal from './Modal';
import type { Camp, FeatureKey } from '../lib/types';

// Add or remove features after setup. Mirrors the wizard's feature step.
export default function CampSettings({ camp, onClose }: { camp: Camp; onClose: () => void }) {
  const { updateCamp } = useStore();
  const [features, setFeatures] = useState<FeatureKey[]>(camp.features ?? FEATURES.map((f) => f.key));
  const toggle = (k: FeatureKey) => setFeatures((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));

  function save() {
    updateCamp(camp.id, { features });
    onClose();
  }

  return (
    <Modal title="Camp features" onClose={onClose}>
      <div className="note" style={{ marginBottom: 12 }}><i className="ti ti-info-circle" /> Turn features on or off. Roster, overview, and check-in are always available. Turning one off hides its tab but keeps the data.</div>
      <div className="wiz-features">
        {FEATURES.map((f) => {
          const on = features.includes(f.key);
          return (
            <button key={f.key} className={'feat-card' + (on ? ' on' : '')} onClick={() => toggle(f.key)}>
              <span className="feat-ic"><i className={'ti ' + f.icon} /></span>
              <span className="feat-text"><span className="feat-name">{f.label}</span><span className="feat-desc">{f.desc}</span></span>
              <span className={'feat-toggle' + (on ? ' on' : '')}><span className="feat-knob" /></span>
            </button>
          );
        })}
      </div>
      <button className="login-btn" style={{ marginTop: 14 }} onClick={save}><i className="ti ti-check" /> Save</button>
      <button className="login-back" onClick={() => setFeatures(DEFAULT_FEATURES)} style={{ marginTop: 8 }}>Reset to defaults</button>
    </Modal>
  );
}
