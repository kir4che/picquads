import React from 'react';

import ErrorIcon from '../assets/error-close.svg?react';

interface ErrorMessageProps {
  message: string | null;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="bg-red-50 absolute top-4 left-1/2 min-w-2/3 sm:min-w-80 -translate-x-1/2 w-fit border border-red-300 text-red-400 px-4 py-3 rounded flex items-center gap-2">
      <ErrorIcon className="w-5 h-5" />
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage;
