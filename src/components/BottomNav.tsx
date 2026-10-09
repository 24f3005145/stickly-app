import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icons';

const ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/reminders', label: 'Reminders', icon: 'list' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function BottomNav() {
  return (
    <nav className="nav" aria-label="Main">
      {ITEMS.map((i) => (
        <NavLink key={i.to} to={i.to} end className={({ isActive }) => `nav__item ${isActive ? 'is-on' : ''}`}>
          <span className="nav__pill"><Icon name={i.icon} /></span>
          <span className="nav__label">{i.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
