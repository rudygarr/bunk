import { useState } from 'react';
import { useStore } from '../lib/store';
import { attendeesOf } from '../lib/camps';
import { TIERS, recommendedTier, tierRange, LIVE_WINDOW_DAYS } from '../lib/billing';
import Modal from './Modal';
import type { Camp } from '../lib/types';

// The pay-to-publish flow (mocked — no real charge in the demo). Pick a tier
// based on camper count, "pay", and the camp goes live for 60 days.
export default function PublishModal({ camp, onClose }: { camp: Camp; onClose: () => void }) {
  const { db, publishCamp } = useStore();
  const campers = attendeesOf(db, camp.id).filter((a) => a.kind === 'camper').length;
  const rec = recommendedTier(campers);
  const [tier, setTier] = useState(rec.id);
  const chosen = TIERS.find((t) => t.id === tier) ?? rec;

  return (
    <Modal title="Go live" onClose={onClose}>
      <div className="pub-intro">
        Build for free — pay once to publish. Your camp stays live for <strong>{LIVE_WINDOW_DAYS} days</strong>,
        long enough for setup, the trip, and the photos after.
      </div>
      <div className="pub-count"><i className="ti ti-users" /> {campers} camper{campers === 1 ? '' : 's'} on the roster right now</div>

      <div className="pub-tiers">
        {TIERS.map((t) => (
          <button key={t.id} className={'pub-tier' + (tier === t.id ? ' on' : '') + (t.id === rec.id ? ' rec' : '')} onClick={() => setTier(t.id)}>
            <span className="pub-tier-l">
              <span className="pub-tier-name">{t.label}{t.id === rec.id && <span className="pub-tier-badge">Recommended</span>}</span>
              <span className="pub-tier-range">{tierRange(t)}</span>
            </span>
            <span className="pub-tier-price">${t.price}</span>
          </button>
        ))}
      </div>

      <button className="login-btn" style={{ marginTop: 16 }} onClick={() => { publishCamp(camp.id, chosen.id); onClose(); }}>
        <i className="ti ti-rocket" /> Publish — ${chosen.price}
      </button>
      <div className="pub-foot">Demo — no real charge. In production this is a one-time Stripe checkout on the web.</div>
    </Modal>
  );
}
