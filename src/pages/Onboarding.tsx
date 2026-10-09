import { useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { setOnboarded } from '../storage/settingsStorage';

const SLIDES = [
  { emoji: '📝', title: 'Never forget the little things.', text: 'Washing your hair, watering plants, taking your keys. Stickly remembers so you don\u2019t have to.' },
  { emoji: '📌', title: 'Create reminders that stay with you throughout the day.', text: 'All-day reminders wait quietly in your notification shade until you tick them off.' },
  { emoji: '🗓️', title: 'Choose your schedule and let Stickly remind you.', text: 'Pick the days and time. Reminders work offline, even when the app is closed.' },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [asking, setAsking] = useState(false);
  const { enableNotifications } = usePermissions();
  const last = i === SLIDES.length; // extra permission step

  const finish = async () => {
    await setOnboarded();
    onDone();
  };

  if (last) {
    return (
      <main className="onb">
        <div className="onb__art" aria-hidden="true">🔔</div>
        <h1 className="h1 center">Allow notifications</h1>
        <p className="onb__text">Stickly needs permission to show notifications. That's how it reminds you. Nothing else is collected or shared.</p>
        <div className="onb__actions">
          <button className="btn btn--primary btn--block btn--lg" disabled={asking}
            onClick={async () => { setAsking(true); try { await enableNotifications(); } finally { await finish(); } }}>
            Turn on reminders
          </button>
          <button className="btn btn--ghost btn--block" onClick={() => void finish()}>Not now</button>
        </div>
      </main>
    );
  }

  const s = SLIDES[i];
  return (
    <main className="onb">
      <button className="onb__skip" onClick={() => setI(SLIDES.length)}>Skip</button>
      <div className="onb__art" aria-hidden="true">{s.emoji}</div>
      <h1 className="h1 center">{s.title}</h1>
      <p className="onb__text">{s.text}</p>
      <div className="dots" aria-hidden="true">
        {SLIDES.map((_, n) => <i key={n} className={n === i ? 'is-on' : ''} />)}
      </div>
      <div className="onb__actions">
        <button className="btn btn--primary btn--block btn--lg" onClick={() => setI(i + 1)}>Next</button>
      </div>
    </main>
  );
}
