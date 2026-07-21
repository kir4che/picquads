type FormFieldProps = {
  id?: string;
  label?: string;
  type?: string;
  required?: boolean;
  error?: string;
  labelStyle?: string;
  ref?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
} & (
  | React.InputHTMLAttributes<HTMLInputElement>
  | React.TextareaHTMLAttributes<HTMLTextAreaElement>
);

const FormField = ({
  id,
  label,
  type,
  required,
  error,
  labelStyle = '',
  className = '',
  ref,
  ...rest
}: FormFieldProps) => (
  <div className='space-y-1'>
    {label && (
      <label
        htmlFor={id}
        className={`block text-sm text-gray-600 ${labelStyle}`}
      >
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
    )}
    <input
      ref={ref as React.Ref<HTMLInputElement>}
      id={id}
      type={type || 'text'}
      className={`rounded ${type === 'color' ? 'h-10 p-1' : 'w-full px-3 py-2 focus:ring-1 focus:ring-violet-500'} ${error ? 'border-red-400' : 'border-violet-300'} ${className}`}
      aria-label={label}
      aria-invalid={!!error}
      aria-required={required}
      {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
    />
    {error && <p className='mt-1 text-sm text-red-500'>{error}</p>}
  </div>
);

export default FormField;
