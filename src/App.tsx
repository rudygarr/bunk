import { HashRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import { SessionProvider, useSession } from './lib/session';
import Shell from './components/Shell';
import Login from './pages/Login';
import Camps from './pages/Camps';
import CampDashboard from './pages/CampDashboard';
import Rsvp from './pages/Rsvp';
import Join from './pages/Join';
import CamperApp from './camper/CamperApp';
import './App.css';

function Gate() {
  const { authed, mode } = useSession();
  // Public links (emailed RSVP, QR sign-up) render outside the auth gate.
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  if (hash.startsWith('#/rsvp/') || hash.startsWith('#/join/')) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/rsvp/:id" element={<Rsvp />} />
          <Route path="/join/:id" element={<Join />} />
          <Route path="*" element={<Rsvp />} />
        </Routes>
      </HashRouter>
    );
  }
  if (!authed) return <Login />;
  if (mode === 'camper') return <CamperApp />;
  return (
    <HashRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Camps />} />
          <Route path="/camp/:id" element={<CampDashboard />} />
        </Routes>
      </Shell>
    </HashRouter>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <SessionProvider>
        <Gate />
      </SessionProvider>
    </StoreProvider>
  );
}
