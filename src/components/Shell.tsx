import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../lib/session';
import { initials } from '../lib/format';
import Logo from './Logo';
import Wordmark from './Wordmark';

export default function Shell({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const { user, isCloud, signOut } = useSession();
  return (
    <div className="shell">
      <header className="topbar">
        <button className="brand" onClick={() => nav('/')}>
          <Logo />
          <span className="brand-name"><Wordmark /></span>
        </button>
        <div className="topbar-right">
          <div className="userchip" title={user.title}>
            <span className="avatar">{initials(user.name)}</span>
            <span className="userchip-name">{user.name.split(' ')[0]}</span>
          </div>
          <button className="signout-btn" title={isCloud ? 'Sign out' : 'Leave demo'} onClick={() => { void signOut(); nav('/'); }}>
            <i className="ti ti-logout" />
          </button>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
