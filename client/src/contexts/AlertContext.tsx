import { createContext, useState, ReactNode } from 'react';

export type AlertType = 'error' | 'success';

interface AlertContextType {
  message: string | null;
  type: AlertType;
  setAlert: (message: string | null, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<AlertType>('error');

  const setAlert = (message: string | null, type: AlertType = 'error') => {
    setMessage(message);
    setType(type);
  };

  return (
    <AlertContext.Provider value={{ message, type, setAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export default AlertContext;
