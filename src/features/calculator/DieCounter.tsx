import type { DieType } from "../../domain/models";

type DieCounterProps = {
  dieType: DieType;
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
};

export function DieCounter({ dieType, label, value, onChange }: DieCounterProps) {
  return (
    <div className={`counter-card die-card die-card-${dieType}`}>
      <div>
        <div className="counter-label">{label}</div>
        <div className="counter-value">{value}</div>
      </div>
      <div className="stepper">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))}>
          -
        </button>
        <button type="button" onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}
