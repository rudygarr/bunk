import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { fmtRange } from '../lib/format';
import { busOf, busLabel, cabinOf, roomOf, campById } from '../lib/camps';
import Logo from '../components/Logo';
import type { RsvpStatus } from '../lib/types';

// The public invite link — what a guest with no account opens from email.
export default function Rsvp() {
  const { id } = useParams();
  const { db, respond } = useStore();
  const a = db.attendees.find((x) => x.id === id);
  const camp = a ? campById(db, a.campId) : undefined;
  const [done, setDone] = useState<RsvpStatus | null>(a && a.status !== 'invited' ? a.status : null);

  function reply(s: RsvpStatus) { if (a) { respond(a.id, s); setDone(s); } }

  return (
    <div className="rsvp-page">
      <div className="rsvp-card">
        <div className="rsvp-brand"><Logo /> Bunk</div>
        {!a || !camp ? (
          <div className="rsvp-gone">This invitation link is no longer valid.</div>
        ) : (
          <>
            <div className="rsvp-kicker">You're invited{a.role ? ` · ${a.role}` : ''}</div>
            <h1 className="rsvp-title">{camp.name}</h1>
            <div className="rsvp-meta">
              <div><i className="ti ti-calendar" /> {fmtRange(camp.startDate, camp.endDate)}</div>
              <div><i className="ti ti-map-pin" /> {camp.location}</div>
            </div>
            {(() => { const b = busOf(db, a); return b ? <div className="rsvp-tag"><i className="ti ti-bus" /> Your bus: <strong>{busLabel(b)}</strong>{b.departInfo ? ` · ${b.departInfo}` : ''}</div> : null; })()}
            {(() => { const c = cabinOf(db, a); const rm = roomOf(db, a); return c ? <div className="rsvp-tag"><i className="ti ti-home" /> Your cabin: <strong>{c.name}{rm ? ` · ${rm.name}` : ''}</strong>{a.cabinLeader ? " · you're a leader" : ''}</div> : null; })()}
            {camp.blurb && <div className="rsvp-details">{camp.blurb}</div>}

            {done ? (
              <div className={'rsvp-done ' + done}>
                <i className={'ti ' + (done === 'accepted' ? 'ti-circle-check' : done === 'declined' ? 'ti-circle-x' : 'ti-help-circle')} />
                {done === 'accepted' ? "You're in — see you there!" : done === 'declined' ? 'Thanks for letting us know.' : 'Marked as maybe.'}
                <button className="rsvp-change" onClick={() => setDone(null)}>Change response</button>
              </div>
            ) : (
              <div className="rsvp-actions">
                <button className="rsvp-btn yes" onClick={() => reply('accepted')}><i className="ti ti-check" /> Accept</button>
                <button className="rsvp-btn maybe" onClick={() => reply('tentative')}>Maybe</button>
                <button className="rsvp-btn no" onClick={() => reply('declined')}>Decline</button>
              </div>
            )}
            <div className="rsvp-foot">No account needed — your reply goes straight to the organizer.</div>
          </>
        )}
      </div>
    </div>
  );
}
