import { ReactElement } from 'react';

interface PaginationBtnProps {
  onClick: () => void;
  disabled: boolean;
  icon: ReactElement;
  ariaLabel?: string;
}

const PaginationBtn = ({
  onClick,
  disabled,
  ariaLabel,
  icon,
}: PaginationBtnProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className='disabled:pointer-events-none disabled:opacity-0'
    aria-label={ariaLabel}
  >
    {icon}
  </button>
);

export default PaginationBtn;
