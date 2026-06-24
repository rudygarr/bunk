import { HashRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import { SessionProvider, useSession } from './lib/session';
import Shell from './components/Shell';
import Login from './pages/Login';
import Camps from './pages/Camps';
import CampDashboard from './pages/CampDashboard';
import Rsvp from './pages/Rsvp';
import './App.css';

function Gate() {
  const { authed } = useSession();
  // Public RSVP link (the emailed invite) renders outside the auth gate.
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#/rsvp/')) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/rsvp/:id" element={<Rsvp />} />
          <Route path="*" element={<Rsvp />} />
        </Routes>
      </HashRouter>
    );
  }
  if (!authed) return <Login />;
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
