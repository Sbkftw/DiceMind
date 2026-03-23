import { formatPercent } from "../../shared/format";

type DistributionRow = {
  total: number;
  probability: number;
  isHighlighted: boolean;
};

type DistributionListProps = {
  rows: DistributionRow[];
};

export function DistributionList({ rows }: DistributionListProps) {
  return (
    <div className="distribution-list">
      {rows.map((row) => (
        <div
          key={row.total}
          className={`distribution-row${row.isHighlighted ? " is-highlighted" : ""}`}
        >
          <span className="distribution-total">{row.total}</span>
          <div className="distribution-bar-shell" aria-hidden="true">
            <div className="distribution-bar" style={{ width: `${row.probability * 100}%` }} />
          </div>
          <span className="distribution-probability">{formatPercent(row.probability)}</span>
        </div>
      ))}
    </div>
  );
}
