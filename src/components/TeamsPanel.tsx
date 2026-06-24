import { useState } from 'react';
import { useStore } from '../lib/store';
import { teamsOf, standings, teamRoster, ordinal, TEAM_COLORS } from '../lib/teams';
import { attendeesOf } from '../lib/camps';
import { initials } from '../lib/format';
import Modal, { field, primaryBtn } from './Modal';
import type { Camp, Team } from '../lib/types';

export default function TeamsPanel({ camp }: { camp: Camp }) {
  const { db, removeTeam, adjustPoints, autoBalanceTeams } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [assignTo, setAssignTo] = useState<Team | null>(null);

  const teams = teamsOf(db, camp.id);
  const ranked = standings(db, camp.id);
  const unassigned = attendeesOf(db, camp.id).filter((a) => a.kind === 'camper' && !a.teamId).length;

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title"><i className="ti ti-flag" /> Teams</div>
        <div className="panel-actions">
          {teams.length > 1 && <button className="btn-soft sm" onClick={() => autoBalanceTeams(camp.id)}><i className="ti ti-arrows-shuffle" /> Auto-balance</button>}
          <button className="btn-primary sm" onClick={() => setShowAdd(true)}><i className="ti ti-plus" /> Add team</button>
        </div>
      </div>

      {teams.length === 0 && <div className="empty">No teams yet. Many camps split students into teams that compete all week — add a few, then auto-balance.</div>}
      {teams.length > 0 && unassigned > 0 && <div className="note" style={{ marginBottom: 12 }}><i className="ti ti-info-circle" /> {unassigned} camper{unassigned === 1 ? '' : 's'} not on a team yet — “Auto-balance” spreads everyone evenly.</div>}

      <div className="tm-board">
        {ranked.map((t, i) => {
          const roster = teamRoster(db, t.id);
          return (
            <div key={t.id} className="tm" style={{ ['--tc' as string]: t.color }}>
              <div className="tm-rank">{i + 1}</div>
              <div className="tm-main">
                <div className="tm-top">
                  <span className="tm-dot" />
                  <span className="tm-name">{t.name}</span>
                  <span className="tm-count">{roster.length}</span>
                  <button className="tm-x" title="Remove team" onClick={() => removeTeam(t.id)}><i className="ti ti-trash" /></button>
                </div>
                <div className="tm-score-row">
                  <span className="tm-pts">{t.points} <small>pts · {ordinal(i + 1)}</small></span>
                  <div className="tm-pt-btns">
                    <button onClick={() => adjustPoints(t.id, -10)}>−10</button>
                    <button onClick={() => adjustPoints(t.id, 5)}>+5</button>
                    <button onClick={() => adjustPoints(t.id, 10)}>+10</button>
                    <button onClick={() => adjustPoints(t.id, 25)}>+25</button>
                  </div>
                </div>
                <div className="tm-members">
                  {roster.slice(0, 12).map((m) => <span key={m.id} className="avatar sm" title={m.name}>{initials(m.name)}</span>)}
                  {roster.length > 12 && <span className="tm-more">+{roster.length - 12}</span>}
                  <button className="tm-assign" onClick={() => setAssignTo(t)}><i className="ti ti-plus" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && <AddTeamModal camp={camp} count={teams.length} onClose={() => setShowAdd(false)} />}
      {assignTo && <AssignTeamModal camp={camp} team={assignTo} onClose={() => setAssignTo(null)} />}
    </div>
  );
}

function AddTeamModal({ camp, count, onClose }: { camp: Camp; count: number; onClose: () => void }) {
  const { addTeam } = useStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState(TEAM_COLORS[count % TEAM_COLORS.length]);
  return (
    <Modal title="Add team" onClose={onClose}>
      <label className="flabel">Team name<input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Crimson, Red Lions…" autoFocus /></label>
      <label className="flabel">Color</label>
      <div className="tm-swatches">
        {TEAM_COLORS.map((c) => <button key={c} className={'tm-swatch' + (color === c ? ' on' : '')} style={{ background: c }} onClick={() => setColor(c)} />)}
      </div>
      <button style={{ ...primaryBtn, marginTop: 14, opacity: name.trim() ? 1 : 0.5 }} disabled={!name.trim()} onClick={() => { addTeam(camp.id, { name: name.trim(), color }); onClose(); }}>Add team</button>
    </Modal>
  );
}

function AssignTeamModal({ camp, team, onClose }: { camp: Camp; team: Team; onClose: () => void }) {
  const { db, assignTeam } = useStore();
  const [q, setQ] = useState('');
  const campers = attendeesOf(db, camp.id)
    .filter((a) => a.kind === 'camper' && a.teamId !== team.id)
    .filter((a) => q.trim() === '' || a.name.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 10);
  return (
    <Modal title={`Add to ${team.name}`} onClose={onClose}>
      <input style={field} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search campers…" autoFocus />
      <div className="pick" style={{ marginTop: 8 }}>
        {campers.map((a) => (
          <button key={a.id} className="pick-row" onClick={() => assignTeam(a.id, team.id)}>
            <span className="avatar sm">{initials(a.name)}</span>
            <span className="pick-name">{a.name}{a.teamId && <span className="pick-role">moving teams</span>}</span>
            <i className="ti ti-plus" />
          </button>
        ))}
        {campers.length === 0 && <div className="empty" style={{ margin: 0 }}>No campers found.</div>}
      </div>
    </Modal>
  );
}
