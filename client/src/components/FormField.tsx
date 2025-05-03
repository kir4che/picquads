import { forwardRef } from 'react';

type FormFieldProps = {
  id?: string;
  label?: string;
  type?: string;
  required?: boolean;
  isTextArea?: boolean;
  error?: string;
  labelStyle?: string;
} & (
  | React.InputHTMLAttributes<HTMLInputElement>
  | React.TextareaHTMLAttributes<HTMLTextAreaElement>
);

const FormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormFieldProps
>(
  (
    {
      id,
      label,
      type,
      required,
      isTextArea,
      error,
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
          {label} {required && <span className='text-red-500'>*</span>}
        </label>
      )}
      {isTextArea ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={id}
          className={`w-full rounded px-4 py-3 focus:ring-1 focus:ring-violet-300 ${error ? 'border-red-400' : 'border-violet-300'} ${className}`}
          aria-label={label}
          aria-invalid={!!error}
          aria-required={required}
          {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
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
      )}

      {error && <p className='mt-1 text-sm text-red-500'>{error}</p>}
    </div>
  )
);

export default FormField;
