export function EmptyState({
  emoji,
  title,
  text,
  actionLabel,
  onAction,
}: {
  emoji: string;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty">
      <div className="empty__art" aria-hidden="true">{emoji}</div>
      <h2 className="empty__title">{title}</h2>
      <p className="empty__text">{text}</p>
      {actionLabel && onAction && (
        <button className="btn btn--primary" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}
