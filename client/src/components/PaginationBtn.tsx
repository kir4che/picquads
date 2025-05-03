import { ReactElement } from 'react';

interface PaginationBtnProps {
  onClick: () => void;
  disabled: boolean;
  icon: ReactElement;
  ariaLabel?: string;
}

const PaginationBtn: React.FC<PaginationBtnProps> = ({
  onClick,
  disabled,
  ariaLabel,
  icon,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className='rounded-full transition-colors hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-0'
    aria-label={ariaLabel}
  >
    {icon}
  </button>
);

export default PaginationBtn;
