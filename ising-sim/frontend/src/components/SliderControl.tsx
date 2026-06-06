import { formatFixed } from "../utils/format";

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  disabled = false,
  formatValue = formatFixed,
  onChange,
}: SliderControlProps) {
  return (
    <label className="control">
      <span className="control__label">{label}</span>
      <div className="slider-control__row">
        <input
          className="control__input slider-control__input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <output className="slider-control__value">{formatValue(value)}</output>
      </div>
    </label>
  );
}
