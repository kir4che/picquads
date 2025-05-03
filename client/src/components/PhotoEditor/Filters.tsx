import { useCallback, useEffect, useMemo, useState } from 'react';
import { FilterType, filterPreset } from '../../configs/filter';
import PaginationBtn from '../PaginationBtn';
import usePagination from '../../hooks/usePagination';

import NavArrowLeftIcon from '../../assets/icons/nav-arrow-left.svg?react';
import NavArrowRightIcon from '../../assets/icons/nav-arrow-right.svg?react';

interface FiltersProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const Filters: React.FC<FiltersProps> = ({ filter, onFilterChange }) => {
  const [filtersPerPage, setFiltersPerPage] = useState(() =>
    window.innerWidth < 480 ? 3 : window.innerWidth < 1024 ? 5 : 7
  );

  const filterOptions = useMemo(() => Object.keys(filterPreset), []);
  const { currentPage, totalPages, handlePrevPage, handleNextPage } =
    usePagination(filterOptions.length, filtersPerPage);

  // 視窗大小變動時更新每頁顯示的項目數量
  const handleResize = useCallback(() => {
    setFiltersPerPage(
      window.innerWidth < 480 ? 3 : window.innerWidth < 1024 ? 5 : 7
    );
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const handleFilterChange = useCallback(
    (value: FilterType) => {
      onFilterChange(value);
    },
    [onFilterChange]
  );

  // 計算當前頁面要顯示的濾鏡
  const visibleFilters = useMemo(
    () =>
      filterOptions.slice(
        currentPage * filtersPerPage,
        (currentPage + 1) * filtersPerPage
      ),
    [filterOptions, currentPage, filtersPerPage]
  );

  return (
    <div
      className='mb-4 flex w-full items-center justify-center gap-x-2'
      role='region'
      aria-label='Filter selection'
    >
      <PaginationBtn
        icon={<NavArrowLeftIcon className='h-5 w-5' />}
        onClick={handlePrevPage}
        disabled={currentPage === 0}
        ariaLabel='Previous filter'
      />
      <div className='flex w-full gap-x-2' aria-label='Filter options'>
        {visibleFilters.map((value) => (
          <button
            key={value}
            onClick={() => handleFilterChange(value as FilterType)}
            className={`flex-shrink-0 snap-center rounded-full px-2.5 py-1 text-sm capitalize transition-all ${
              filter === value
                ? 'bg-violet-600 text-white'
                : 'bg-white text-black'
            }`}
            aria-label={`Apply ${value} filter`}
            aria-pressed={filter === value}
          >
            {value}
          </button>
        ))}
      </div>
      <PaginationBtn
        icon={<NavArrowRightIcon className='h-5 w-5' />}
        onClick={handleNextPage}
        disabled={currentPage === totalPages - 1}
        ariaLabel='Next filter'
      />
    </div>
  );
};

export default Filters;
