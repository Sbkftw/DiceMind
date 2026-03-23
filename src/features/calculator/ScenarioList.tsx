import type { SavedScenario } from "./storage";

type ScenarioListProps = {
  entries: SavedScenario[];
  onApply: (entry: SavedScenario) => void;
  onDelete?: (id: string) => void;
  secondaryText: (entry: SavedScenario) => string;
};

export function ScenarioList({
  entries,
  onApply,
  onDelete,
  secondaryText
}: ScenarioListProps) {
  return (
    <div className="saved-list">
      {entries.map((entry) => (
        <article key={entry.id} className="saved-item">
          <button type="button" className="saved-apply" onClick={() => onApply(entry)}>
            <strong>{entry.label}</strong>
            <span>{secondaryText(entry)}</span>
          </button>
          {onDelete ? (
            <button
              type="button"
              className="ghost-button danger-button"
              onClick={() => onDelete(entry.id)}
              aria-label={`Supprimer ${entry.label}`}
            >
              Suppr.
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}
