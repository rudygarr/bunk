import { useStore } from '../lib/store';
import { fmtRange } from '../lib/format';
import { initials } from '../lib/format';
import { campById, busOf, busLabel, cabinOf, roomOf, cabinLeaders, smallGroupOf } from '../lib/camps';
import { cabinmates } from '../lib/camper';
import { teamOf, standings, ordinal } from '../lib/teams';
import { scheduleForCamper, daysOf, nowNext, todayKey, fmtClock } from '../lib/schedule';
import PackedCard from './PackedCard';
import Countdown from '../components/Countdown';
import type { Attendee, RsvpStatus } from '../lib/types';

export default function CamperHome({ me }: { me: Attendee }) {
  const { db, respond } = useStore();
  const camp = campById(db, me.campId);
  // What's happening now (or up next) on this camper's own schedule.
  const myItems = scheduleForCamper(db, me);
  const today = todayKey();
  const focusDay = daysOf(myItems).includes(today) ? today : daysOf(myItems)[0];
  const focusItems = myItems.filter((s) => s.day === focusDay);
  const { nowId, nextId } = nowNext(focusItems, focusDay ?? '');
  // Show whatever's live, else the next item, else the first thing on the
  // schedule (so before the camp starts it still previews the kickoff).
  const upNext = focusItems.find((s) => s.id === nowId) ?? focusItems.find((s) => s.id === nextId) ?? focusItems[0];
  const upNextNow = !!nowId && upNext?.id === nowId;
  const bus = busOf(db, me);
  const cabin = cabinOf(db, me);
  const room = roomOf(db, me);
  const mates = cabinmates(db, me).filter((a) => !a.cabinLeader);
  const leaders = cabin ? cabinLeaders(db, cabin.id) : [];
  const myTeam = teamOf(db, me);
  const myGroup = smallGroupOf(db, me);
  const ranked = standings(db, me.campId);
  const myPlace = myTeam ? ranked.findIndex((t) => t.id === myTeam.id) + 1 : 0;

  return (
    <>
      <div className="c-hello">Hey {me.name.split(' ')[0]} 👋</div>
      {camp && (
        <div className="c-camp">
          <div className="c-camp-name">{camp.name}</div>
          <div className="c-camp-meta"><i className="ti ti-calendar" /> {fmtRange(camp.startDate, camp.endDate)}</div>
          <div className="c-camp-meta"><i className="ti ti-map-pin" /> {camp.location}</div>
        </div>
      )}

      {camp && (() => { const k = new Date(camp.kickoff ?? `${camp.startDate}T09:00:00`); return k.getTime() > Date.now() ? (
        <div className="c-card c-countdown">
          <div className="c-card-h" style={{ justifyContent: 'center' }}><i className="ti ti-flame" /> {camp.kickoffLabel ? camp.kickoffLabel : 'Camp starts'} in</div>
          <Countdown target={k} />
        </div>
      ) : null; })()}

      {/* Now / up next */}
      {upNext && (
        <div className={'c-card c-upnext' + (upNextNow ? ' live' : '')}>
          <div className="c-card-h"><i className="ti ti-clock-hour-4" /> {upNextNow ? 'Happening now' : 'Up next'}</div>
          <div className="c-upnext-time">{fmtClock(upNext.start)}{upNext.end && ` – ${fmtClock(upNext.end)}`}</div>
          <div className="c-big">{upNext.title}</div>
          {upNext.location && <div className="c-sub"><i className="ti ti-map-pin" /> {upNext.location}</div>}
        </div>
      )}

      {/* RSVP */}
      <div className="c-card">
        <div className="c-card-h"><i className="ti ti-circle-check" /> Are you coming?</div>
        <div className="c-rsvp">
          {(['accepted', 'tentative', 'declined'] as RsvpStatus[]).map((s) => (
            <button key={s} className={'c-rsvp-btn ' + s + (me.status === s ? ' on' : '')} onClick={() => respond(me.id, s)}>
              {s === 'accepted' ? 'Yes!' : s === 'tentative' ? 'Maybe' : 'No'}
            </button>
          ))}
        </div>
      </div>

      {/* Are you packed? */}
      <PackedCard me={me} />

      {/* Team + standings */}
      {myTeam && (
        <div className="c-card" style={{ ['--tc' as string]: myTeam.color }}>
          <div className="c-card-h"><i className="ti ti-flag" /> Your team</div>
          <div className="c-team-hero">
            <span className="c-team-dot" />
            <span className="c-team-name">{myTeam.name}</span>
            <span className="c-team-place">{ordinal(myPlace)} of {ranked.length}</span>
          </div>
          <div className="c-standings">
            {ranked.map((t, i) => (
              <div key={t.id} className={'c-stand-row' + (t.id === myTeam.id ? ' me' : '')}>
                <span className="c-stand-rank">{i + 1}</span>
                <span className="c-stand-dot" style={{ background: t.color }} />
                <span className="c-stand-name">{t.name}</span>
                <span className="c-stand-pts">{t.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Small group */}
      {myGroup && (
        <div className="c-card" style={{ ['--tc' as string]: myGroup.color }}>
          <div className="c-card-h"><i className="ti ti-users-group" /> Your small group</div>
          <div className="c-big"><span className="tm-dot" /> {myGroup.name}</div>
          {myGroup.leaderName && <div className="c-sub">Led by {myGroup.leaderName}</div>}
        </div>
      )}

      {/* Bus */}
      <div className="c-card">
        <div className="c-card-h"><i className="ti ti-bus" /> Your bus</div>
        {bus ? (
          <>
            <div className="c-big">{busLabel(bus)}{bus.groupName && <span className="c-wave">{bus.groupName}</span>}</div>
            {bus.departInfo && <div className="c-sub">{bus.departInfo}</div>}
            {bus.trackingUrl && (
              <a className="album-open" style={{ marginTop: 8 }} href={bus.trackingUrl} target="_blank" rel="noopener noreferrer">
                <i className="ti ti-map-pin" /> Live location
              </a>
            )}
          </>
        ) : <div className="c-sub">Not assigned yet — check back soon.</div>}
      </div>

      {/* Cabin */}
      <div className="c-card">
        <div className="c-card-h"><i className="ti ti-home" /> Your cabin</div>
        {cabin ? (
          <>
            <div className="c-big">{cabin.name}{room ? ` · ${room.name}` : ''}{me.cabinLeader ? <span className="c-leadtag">You lead this cabin</span> : ''}</div>
            {leaders.length > 0 && <div className="c-sub">Led by {leaders.map((l) => l.name).join(', ')}</div>}
            {mates.length > 0 && (
              <div className="c-mates">
                {mates.map((m) => (
                  <span key={m.id} className="c-mate"><span className="avatar sm">{initials(m.name)}</span> {m.name.split(' ')[0]}</span>
                ))}
              </div>
            )}
          </>
        ) : <div className="c-sub">Not assigned yet — check back soon.</div>}
      </div>
    </>
  );
}
