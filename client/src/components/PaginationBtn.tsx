import { ReactElement } from 'react';

interface PaginationBtnProps {
  onClick: () => void;
  disabled: boolean;
  icon: ReactElement;
  ariaLabel?: string;
}

const PaginationBtn: React.FC<PaginationBtnProps> = ({ onClick, disabled, ariaLabel, icon }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="transition-colors rounded-full disabled:opacity-0 disabled:pointer-events-none hover:bg-gray-100"
    aria-label={ariaLabel}
  >
    {icon}
  </button>
);

export default PaginationBtn;
