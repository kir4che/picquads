import { ReactElement, cloneElement, useState, useEffect, useCallback, useMemo } from 'react';

import { FilterType, filterPreset } from '../configs/filter';
import usePagination from '../hooks/usePagination';

import PaginationBtn from './PaginationBtn';

import NavArrowLeftIcon from '../assets/icons/nav-arrow-left.svg?react';
import NavArrowRightIcon from '../assets/icons/nav-arrow-right.svg?react';

interface PhotoEditorProps {
  children: ReactElement<{
    borderColor: string;
    filter: FilterType;
  }>;
}

const PhotoEditor: React.FC<PhotoEditorProps> = ({ children }) => {
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [filter, setFilter] = useState<FilterType>('none');
  const [filtersPerPage, setFiltersPerPage] = useState(() => 
    window.innerWidth < 480 ? 3 : window.innerWidth < 1024 ? 5 : 7
  );

  const filterOptions = useMemo(() => Object.keys(filterPreset), []);
  const { currentPage, totalPages, handlePrevPage, handleNextPage } = usePagination(
    filterOptions.length,
    filtersPerPage
  );

  // 視窗大小變動時更新每頁顯示的項目數量
  const handleResize = useCallback(() => {
    setFiltersPerPage(window.innerWidth < 480 ? 3 : window.innerWidth < 1024 ? 5 : 7);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const handleFilterChange = useCallback((value: FilterType) => {
    setFilter(value);
  }, []);

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    // 類似 setTimeout 機制，在下一個瀏覽器繪製幀時執行更新。
    // 若在一幀內收到多個顏色更新，只有最後一個會被實際執行，等於節流 (throttling)。
    requestAnimationFrame(() => setBorderColor(newColor));
  }, []);

  // 計算當前頁面要顯示的濾鏡
  const visibleFilters = useMemo(() => 
    filterOptions.slice(currentPage * filtersPerPage, (currentPage + 1) * filtersPerPage),
    [filterOptions, currentPage, filtersPerPage]
  );

  return (
    <div role="region" className="flex flex-col items-center gap-y-4" aria-label="Photo editor">
      <div className="flex items-center justify-center w-full mb-2 gap-x-2">
        <PaginationBtn
          icon={<NavArrowLeftIcon className="w-5 h-5" />}
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          ariaLabel="Previous filter"
        />
        <div
          role="listbox"
          className="flex w-full gap-x-2 md:gap-x-3"
          aria-label="Filter options"
        >
          {visibleFilters.map((value) => (
            <button
              key={value}
              onClick={() => handleFilterChange(value as FilterType)}
              className={`px-2.5 capitalize py-1 rounded-full text-sm transition-all flex-shrink-0 snap-center ${
                filter === value 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-black'
              }`}
              aria-label={`Apply ${value} filter`}
            >
              {value}
            </button>
          ))}
        </div>
        <PaginationBtn
          icon={<NavArrowRightIcon className="w-5 h-5" />}
          onClick={handleNextPage}
          disabled={currentPage === totalPages - 1}
          ariaLabel="Next filter"
        />
      </div>
      {cloneElement(children, {
        borderColor,
        filter
      })}
      <input 
        type="color" 
        value={borderColor} 
        onChange={handleColorChange}
        className="w-20 h-8 cursor-pointer"
        aria-label="Select border color"
      />
    </div>
  );
};

export default PhotoEditor;
