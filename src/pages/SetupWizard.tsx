import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { FEATURES, DEFAULT_FEATURES } from '../lib/camps';
import { fmtRange } from '../lib/format';
import { field } from '../components/Modal';
import type { FeatureKey } from '../lib/types';

// The organizer's guided camp setup. Three steps: the basics, which features to
// turn on, and a review. Features are editable later in camp settings.
export default function SetupWizard() {
  const nav = useNavigate();
  const { addCamp } = useStore();
  const [step, setStep] = useState(0);

  // step 1 — basics
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [kickoffDate, setKickoffDate] = useState('');
  const [kickoffTime, setKickoffTime] = useState('09:00');
  const [kickoffLabel, setKickoffLabel] = useState('');

  // step 2 — features
  const [features, setFeatures] = useState<FeatureKey[]>(DEFAULT_FEATURES);
  const toggle = (k: FeatureKey) => setFeatures((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));

  const canNext = step === 0 ? name.trim() !== '' : true;

  function create() {
    const c = addCamp({
      name: name.trim(),
      location: location.trim() || 'TBD',
      startDate: start || '2026-06-01',
      endDate: end || start || '2026-06-01',
      organizer: 'You',
      accent: '#1f6f5c',
      features,
      ...(kickoffDate ? { kickoff: `${kickoffDate}T${kickoffTime || '09:00'}:00`, kickoffLabel: kickoffLabel.trim() || 'Camp begins' } : {}),
    });
    nav('/camp/' + c.id);
  }

  const steps = ['Basics', 'Features', 'Review'];

  return (
    <div className="wiz">
      <button className="back" onClick={() => (step === 0 ? nav('/') : setStep(step - 1))}>
        <i className="ti ti-chevron-left" /> {step === 0 ? 'All camps' : 'Back'}
      </button>

      <div className="wiz-steps">
        {steps.map((s, i) => (
          <div key={s} className={'wiz-step' + (i === step ? ' on' : '') + (i < step ? ' done' : '')}>
            <span className="wiz-step-n">{i < step ? <i className="ti ti-check" /> : i + 1}</span>{s}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="wiz-body">
          <h1 className="page-h">Let's set up your camp</h1>
          <div className="page-sub">Start with the basics — you can change any of this later.</div>
          <label className="flabel">Camp name<input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Warrior Week" autoFocus /></label>
          <label className="flabel">Location<input style={field} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Sharptop Cove · Jasper, GA" /></label>
          <div style={{ display: 'flex', gap: 10 }}>
            <label className="flabel" style={{ flex: 1 }}>Start date<input type="date" style={{ ...field, appearance: 'auto' }} value={start} onChange={(e) => setStart(e.target.value)} /></label>
            <label className="flabel" style={{ flex: 1 }}>End date<input type="date" style={{ ...field, appearance: 'auto' }} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          </div>
          <div className="wiz-kickoff">
            <div className="flabel" style={{ marginBottom: 6 }}>Kickoff (drives the countdown) — optional</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <label className="flabel" style={{ flex: 1, margin: 0 }}>Date<input type="date" style={{ ...field, appearance: 'auto' }} value={kickoffDate} onChange={(e) => setKickoffDate(e.target.value)} /></label>
              <label className="flabel" style={{ flex: 1, margin: 0 }}>Time<input type="time" step={300} style={{ ...field, appearance: 'auto' }} value={kickoffTime} onChange={(e) => setKickoffTime(e.target.value)} /></label>
            </div>
            <input style={{ ...field, marginTop: 8 }} value={kickoffLabel} onChange={(e) => setKickoffLabel(e.target.value)} placeholder="What happens then? e.g. Seniors depart" />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="wiz-body">
          <h1 className="page-h">Pick your features</h1>
          <div className="page-sub">Turn on what this camp needs. Roster, overview, and check-in are always included — and you can add or remove these anytime.</div>
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
        </div>
      )}

      {step === 2 && (
        <div className="wiz-body">
          <h1 className="page-h">Ready to go</h1>
          <div className="page-sub">Review and create — then you'll add buses, cabins, and people.</div>
          <div className="wiz-review">
            <div className="wiz-rev-row"><span>Name</span><strong>{name || '—'}</strong></div>
            <div className="wiz-rev-row"><span>Location</span><strong>{location || 'TBD'}</strong></div>
            <div className="wiz-rev-row"><span>Dates</span><strong>{start ? fmtRange(start, end || start) : 'TBD'}</strong></div>
            {kickoffDate && <div className="wiz-rev-row"><span>Kickoff</span><strong>{kickoffLabel || 'Camp begins'} · {kickoffTime}</strong></div>}
            <div className="wiz-rev-row"><span>Features</span><strong>{features.length} on</strong></div>
          </div>
          <div className="wiz-chips">
            {FEATURES.filter((f) => features.includes(f.key)).map((f) => (
              <span key={f.key} className="wiz-chip"><i className={'ti ' + f.icon} /> {f.label}</span>
            ))}
          </div>
        </div>
      )}

      <div className="wiz-nav">
        {step < 2 ? (
          <button className="login-btn" style={{ opacity: canNext ? 1 : 0.5 }} disabled={!canNext} onClick={() => setStep(step + 1)}>
            Continue <i className="ti ti-arrow-right" />
          </button>
        ) : (
          <button className="login-btn" onClick={create}><i className="ti ti-check" /> Create camp</button>
        )}
      </div>
    </div>
  );
}
