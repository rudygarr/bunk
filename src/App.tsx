import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider, useStore } from './lib/store';
import { SessionProvider, useSession } from './lib/session';
import Shell from './components/Shell';
import Login from './pages/Login';
import Camps from './pages/Camps';
import CampDashboard from './pages/CampDashboard';
import SetupWizard from './pages/SetupWizard';
import Rsvp from './pages/Rsvp';
import Join from './pages/Join';
import Viewer from './pages/Viewer';
import CamperApp from './camper/CamperApp';
import './App.css';

function Gate() {
  const { authed, mode, previewId } = useSession();
  const { memberId } = useStore();
  // Track the hash so navigating to a public link in-session re-renders the gate.
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash : '');
  useEffect(() => {
    const f = () => setHash(window.location.hash);
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  // Public links (emailed RSVP, QR sign-up, public viewer) render outside the gate.
  if (hash.startsWith('#/rsvp/') || hash.startsWith('#/join/') || hash.startsWith('#/view/')) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/rsvp/:id" element={<Rsvp />} />
          <Route path="/join/:id" element={<Join />} />
          <Route path="/view/:id" element={<Viewer />} />
          <Route path="*" element={<Rsvp />} />
        </Routes>
      </HashRouter>
    );
  }
  if (!authed) return <Login />;
  if (mode === 'camper' || memberId || previewId) return <CamperApp />;
  return (
    <HashRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Camps />} />
          <Route path="/new" element={<SetupWizard />} />
          <Route path="/camp/:id" element={<CampDashboard />} />
        </Routes>
      </Shell>
    </HashRouter>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <StoreProvider>
        <Gate />
      </StoreProvider>
    </SessionProvider>
  );
}
