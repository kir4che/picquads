import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  label: string;
  ariaLabel: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

const CollapsibleSection = ({
  label,
  ariaLabel,
  children,
  defaultExpanded = true,
}: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className='w-full'>
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className='flex w-full items-center justify-between border-b border-violet-700 py-2 text-xs text-gray-600 focus:outline-none'
        aria-expanded={isExpanded}
        aria-label={ariaLabel}
      >
        {label}
        <ChevronDown
          size={20}
          className={`transition-transform duration-300 ${
            isExpanded ? 'rotate-180 transform' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-250 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className='pt-4'>{children}</div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
