import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../lib/session';
import { initials } from '../lib/format';
import Logo from './Logo';
import Wordmark from './Wordmark';

export default function Shell({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const { user } = useSession();
  return (
    <div className="shell">
      <header className="topbar">
        <button className="brand" onClick={() => nav('/')}>
          <Logo />
          <span className="brand-name"><Wordmark /></span>
        </button>
        <div className="userchip" title={user.title}>
          <span className="avatar">{initials(user.name)}</span>
          <span className="userchip-name">{user.name.split(' ')[0]}</span>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
