import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Fab } from './components/Fab';
import { RemindersProvider } from './hooks/useReminders';
import { SettingsProvider } from './hooks/useSettings';
import AddEditPage from './pages/AddEditPage';
import CalendarPage from './pages/CalendarPage';
import DetailsPage from './pages/DetailsPage';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import RemindersPage from './pages/RemindersPage';
import SettingsPage from './pages/SettingsPage';
import { isOnboarded } from './storage/settingsStorage';

const MAIN_ROUTES = ['/', '/calendar', '/reminders', '/settings'];

function Shell() {
  const { pathname } = useLocation();
  const showNav = MAIN_ROUTES.includes(pathname);
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reminder/:id" element={<DetailsPage />} />
        <Route path="/edit/:id" element={<AddEditPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
      {showNav && pathname !== '/settings' && <Fab />}
      {showNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    void isOnboarded()
      .then(setOnboarded)
      .catch(() => setOnboarded(true))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <SettingsProvider>
      <RemindersProvider>
        <HashRouter>{onboarded ? <Shell /> : <Onboarding onDone={() => setOnboarded(true)} />}</HashRouter>
      </RemindersProvider>
    </SettingsProvider>
  );
}
