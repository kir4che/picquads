import { forwardRef } from 'react';

type BaseProps = {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
};

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement>;
type TextAreaProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type FormFieldProps = (InputProps | TextAreaProps) & {
  isTextArea?: boolean;
};

const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>((props, ref) => {
  const { label, error, isTextArea, required, id, ...rest } = props;
  
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {isTextArea ? (
        <textarea
          {...(rest as TextAreaProps)}
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={id}
          className="w-full px-4 py-3 bg-white border rounded-md border-violet-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          aria-label={label}
          aria-required={required}
          {...(rest as TextAreaProps)}
        />
      ) : (
        <input
          {...(rest as InputProps)}
          ref={ref as React.Ref<HTMLInputElement>}
          id={id}
          className="w-full px-4 py-3 bg-white border rounded-md border-violet-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          aria-label={label}
          aria-required={required}
          {...(rest as InputProps)}
        />
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

export default FormField;
