import { useEffect } from 'react';
import { CircleX, CircleCheck } from 'lucide-react';

import { useAlert } from '../hooks/useAlert';
import { AlertType } from '../contexts/AlertContext';

const alertStyles: Record<
  AlertType,
  { background: string; border: string; text: string }
> = {
  error: {
    background: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-400',
  },
  success: {
    background: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-500',
  },
};

const Alert: React.FC = () => {
  const { message, type, setAlert } = useAlert();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message, setAlert]);

  if (!message) return null;

  const styles = alertStyles[type];
  const Icon = type === 'error' ? CircleX : CircleCheck;

  return (
    <div
      className={`absolute top-4 left-1/2 flex w-fit min-w-2/3 -translate-x-1/2 items-center gap-2 rounded border px-4 py-3 sm:min-w-80 ${styles.background} ${styles.border} ${styles.text}`}
    >
      <Icon className='h-5 w-5' />
      <p>{message}</p>
    </div>
  );
};

export default Alert;
