import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import './UI.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <input
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <textarea
        className={`textarea ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
