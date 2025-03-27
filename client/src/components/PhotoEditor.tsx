import { ReactElement, cloneElement, useState, useEffect, useCallback, useMemo } from 'react';

import { FilterType, filterPreset } from '../configs/filter';
import { dateFormats, timeFormats } from '../configs/datetime';
import usePagination from '../hooks/usePagination';

import PaginationBtn from './PaginationBtn';

import NavArrowLeftIcon from '../assets/icons/nav-arrow-left.svg?react';
import NavArrowRightIcon from '../assets/icons/nav-arrow-right.svg?react';

interface PhotoEditorProps {
  children: ReactElement<{
    borderColor: string;
    filter: FilterType;
    dateFormat: string;
    timeFormat: string;
  }>;
}

const PhotoEditor: React.FC<PhotoEditorProps> = ({ children }) => {
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [filter, setFilter] = useState<FilterType>('none');
  const [dateFormat, setDateFormat] = useState<string>('none');
  const [timeFormat, setTimeFormat] = useState<string>('none');
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
      <div className="flex items-center justify-center w-full gap-x-2">
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
                  : 'bg-white text-black'
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
      <p className='-mb-2 text-xs md:hidden'>Show Date & Time</p>
      <div className="flex items-center justify-center w-full mb-2 text-sm gap-x-2">
        <p className='hidden text-xs md:block'>Show Date & Time</p>
        <select
          value={dateFormat}
          onChange={(e) => setDateFormat(e.target.value)}
          className="px-2 py-1.5 rounded-md outline-none bg-white"
          aria-label="Choose Date Format"
        >
          {dateFormats.map((format) => (
            <option key={format.id} value={format.id}>
              {format.label}
            </option>
          ))}
        </select>
        <select
          value={timeFormat}
          onChange={(e) => setTimeFormat(e.target.value)}
          className="px-2 py-1.5 rounded-md outline-none bg-white"
          aria-label="Choose Time Format"
        >
          {timeFormats.map((format) => (
            <option key={format.id} value={format.id}>
              {format.label}
            </option>
          ))}
        </select>
      </div>

      {cloneElement(children, {
        borderColor,
        filter,
        dateFormat,
        timeFormat
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
