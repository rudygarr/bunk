import { useStore } from '../lib/store';
import { announcementsForCamper } from '../lib/announce';
import type { Attendee, AudienceKind } from '../lib/types';

const TAG: Record<AudienceKind, { label: string; icon: string }> = {
  everyone: { label: 'Everyone', icon: 'ti-world' },
  bus: { label: 'Your bus', icon: 'ti-bus' },
  cabin: { label: 'Your cabin', icon: 'ti-home' },
  team: { label: 'Your team', icon: 'ti-flag' },
  smallGroup: { label: 'Your group', icon: 'ti-users-group' },
  volunteers: { label: 'Volunteers', icon: 'ti-clipboard-check' },
  person: { label: 'Just for you', icon: 'ti-user' },
  custom: { label: 'For you', icon: 'ti-user-check' },
};

function ago(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d}d ago`;
}

export default function CamperAlerts({ me }: { me: Attendee }) {
  const { db } = useStore();
  const list = announcementsForCamper(db, me);
  return (
    <>
      <div className="c-hello" style={{ fontSize: 20 }}>Announcements</div>
      {list.length === 0 && <div className="empty" style={{ marginTop: 30 }}>Nothing yet — check back soon.</div>}
      {list.map((a) => {
        const tag = TAG[a.audienceKind];
        return (
          <div key={a.id} className={'c-ann' + (a.pinned ? ' pinned' : '')}>
            <div className="c-ann-top">
              <span className={'c-ann-tag ' + a.audienceKind}><i className={'ti ' + tag.icon} /> {tag.label}</span>
              {a.pinned && <i className="ti ti-pin-filled c-ann-pin" />}
              <span className="c-ann-time">{ago(a.createdAt)}</span>
            </div>
            {a.title && <div className="c-ann-title">{a.title}</div>}
            <div className="c-ann-body">{a.body}</div>
            <div className="c-ann-by">— {a.author}</div>
          </div>
        );
      })}
    </>
  );
}
