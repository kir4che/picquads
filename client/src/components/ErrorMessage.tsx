import { useEffect } from 'react';
import { useError } from '../hooks/useError';

import ErrorIcon from '../assets/icons/error-close.svg?react';

const ErrorMessage: React.FC = () => {
  const { errorMessage, setErrorMessage } = useError();

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, setErrorMessage]);

  if (!errorMessage) return null;

  return (
    <div className="absolute flex items-center gap-2 px-4 py-3 text-red-400 -translate-x-1/2 border border-red-300 rounded bg-red-50 top-4 left-1/2 min-w-2/3 sm:min-w-80 w-fit">
      <ErrorIcon className="w-5 h-5" />
      <p>{errorMessage}</p>
    </div>
  );
};

export default ErrorMessage;
