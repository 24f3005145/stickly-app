import type { IconKey } from '../types';

export const ICONS: { key: IconKey; emoji: string; label: string }[] = [
  { key: 'personal', emoji: '🧴', label: 'Personal care' },
  { key: 'water', emoji: '💧', label: 'Water' },
  { key: 'study', emoji: '📚', label: 'Study' },
  { key: 'exercise', emoji: '🏃', label: 'Exercise' },
  { key: 'cleaning', emoji: '🧹', label: 'Cleaning' },
  { key: 'plants', emoji: '🌱', label: 'Plants' },
  { key: 'health', emoji: '💊', label: 'Health' },
  { key: 'shopping', emoji: '🛒', label: 'Shopping' },
  { key: 'home', emoji: '🏠', label: 'Home' },
  { key: 'general', emoji: '⭐', label: 'General' },
];

export const emojiFor = (key: IconKey): string => ICONS.find((i) => i.key === key)?.emoji ?? '⭐';

export function IconPicker({ value, onChange }: { value: IconKey; onChange: (k: IconKey) => void }) {
  return (
    <div className="iconpicker" role="radiogroup" aria-label="Icon">
      {ICONS.map((i) => (
        <button
          key={i.key}
          type="button"
          role="radio"
          aria-checked={value === i.key}
          aria-label={i.label}
          className={`iconpicker__item ${value === i.key ? 'is-on' : ''}`}
          onClick={() => onChange(i.key)}
        >
          {i.emoji}
        </button>
      ))}
    </div>
  );
}
