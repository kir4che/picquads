import { forwardRef } from 'react';

interface Option {
  id: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  options: Option[];
  placeholder?: string;
  labelStyle?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      required = false,
      error,
      options,
      placeholder,
      disabled = false,
      labelStyle = '',
      className = '',
      ...rest
    },
    ref
  ) => (
    <div className='space-y-1.5'>
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm text-gray-600 ${labelStyle}`}
        >
          {label}
          {required && <span className='ml-1 text-red-500'>*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`w-full rounded border border-violet-300 p-2 focus:outline-none disabled:opacity-50 ${error ? 'border-red-400' : ''} ${className}`}
        disabled={disabled}
        aria-label={label}
        aria-invalid={!!error}
        aria-required={required}
        {...rest}
      >
        {placeholder && (
          <option value='' disabled>
            {placeholder}
          </option>
        )}
        {options.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
      {error && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  )
);

export default Select;
