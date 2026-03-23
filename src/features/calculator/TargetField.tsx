type TargetFieldProps = {
  disabled: boolean;
  value: string;
  onChange: (nextValue: string) => void;
  onBlur: () => void;
  onAdjust: (delta: number) => void;
};

export function TargetField({
  disabled,
  value,
  onChange,
  onBlur,
  onAdjust
}: TargetFieldProps) {
  return (
    <label className="field">
      <span>Valeur cible</span>
      <div className="target-stepper">
        <button
          type="button"
          className="target-stepper-button"
          onClick={() => onAdjust(-1)}
          disabled={disabled}
          aria-label="Réduire la cible"
        >
          -
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          onFocus={(event) => event.currentTarget.select()}
          disabled={disabled}
        />
        <button
          type="button"
          className="target-stepper-button"
          onClick={() => onAdjust(1)}
          disabled={disabled}
          aria-label="Augmenter la cible"
        >
          +
        </button>
      </div>
    </label>
  );
}
