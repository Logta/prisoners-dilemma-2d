import { clsx } from 'clsx';
import type React from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  className,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <label className="block font-medium text-gray-700 text-sm" htmlFor={`slider-${label}`}>
          {label}: {value}
        </label>
      )}
      <input
        className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
        id={`slider-${label}`}
        max={max}
        min={min}
        onChange={handleChange}
        step={step}
        type="range"
        value={value}
      />
    </div>
  );
};
