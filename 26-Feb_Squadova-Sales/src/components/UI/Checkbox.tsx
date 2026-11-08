import { InputHTMLAttributes } from 'react';
import './UI.css';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`checkbox-label ${className}`}>
      <input type="checkbox" className="checkbox" {...props} />
      <span className="checkbox-text">{label}</span>
    </label>
  );
}
