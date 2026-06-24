import { useSession } from '../lib/session';
import Logo from '../components/Logo';

export default function Login() {
  const { signIn, user } = useSession();
  return (
    <div className="login">
      <div className="login-card">
        <div className="login-mark"><Logo size={56} /></div>
        <h1 className="login-title">Bunk</h1>
        <p className="login-tag">Run your camp — rosters, buses, cabins, and crew, all in one place.</p>
        <button className="login-btn" onClick={signIn}>
          <i className="ti ti-arrow-right" /> Enter the demo
        </button>
        <div className="login-as">Signed in as <strong>{user.name}</strong> · {user.title}</div>
        <div className="login-foot">A demo — sign-in is simulated. Real accounts come with the production build.</div>
      </div>
    </div>
  );
}
