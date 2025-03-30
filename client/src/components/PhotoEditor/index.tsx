import { ReactElement, cloneElement, useState, useEffect, useCallback, useMemo } from 'react';

import { FilterType, filterPreset } from '../../configs/filter';
import { CustomTextConfig } from '../../types/editor'
import usePagination from '../../hooks/usePagination';

import PhotoActions from '../../components/PhotoActions';
import PaginationBtn from '../PaginationBtn';
import FormField from '../FormField';
import CustomText from './CustomText';
import DateTimeSelect from './DateTimeSelect';

import NavArrowLeftIcon from '../../assets/icons/nav-arrow-left.svg?react';
import NavArrowRightIcon from '../../assets/icons/nav-arrow-right.svg?react';

interface PhotoEditorProps {
  children: ReactElement<{
    frameColor: string;
    filter: FilterType;
    dateFormat: string;
    timeFormat: string;
    customTextConfig: CustomTextConfig;
  }>;
}

const PhotoEditor: React.FC<PhotoEditorProps> = ({ children }) => {
  const [frameColor, setFrameColor] = useState<string>('#000000');
  const [filter, setFilter] = useState<FilterType>('none');

  const [dateFormat, setDateFormat] = useState<string>('');
  const [timeFormat, setTimeFormat] = useState<string>('');

  const [customTextConfig, setCustomTextConfig] = useState<CustomTextConfig>({
    text: '',
    font: 'PlayfairDisplay',
    position: { x: 0, y: 0 },
    color: '#FFFFFF',
    size: 48
  });

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
    requestAnimationFrame(() => setFrameColor(newColor));
  }, []);

  // 計算當前頁面要顯示的濾鏡
  const visibleFilters = useMemo(() => 
    filterOptions.slice(currentPage * filtersPerPage, (currentPage + 1) * filtersPerPage),
    [filterOptions, currentPage, filtersPerPage]
  );

  return (
    <div className="flex flex-col items-center gap-y-2 md:gap-y-4" aria-label="Photo editor">
      <div className="flex items-center justify-center w-full mb-4 gap-x-2">
        <PaginationBtn
          icon={<NavArrowLeftIcon className="w-5 h-5" />}
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          ariaLabel="Previous filter"
        />
        <div className="flex w-full gap-x-2" aria-label="Filter options">
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
      <div className='flex flex-col items-start justify-center gap-x-8 gap-y-3 md:flex-row'>
        <div className='w-full space-y-4'>
          <PhotoActions />
          <CustomText customTextConfig={customTextConfig} setCustomTextConfig={setCustomTextConfig} />
          <DateTimeSelect 
            dateFormat={dateFormat} 
            setDateFormat={setDateFormat} 
            timeFormat={timeFormat} 
            setTimeFormat={setTimeFormat} 
          />
        </div>
        <div className='flex flex-col items-center gap-y-3'>
          {cloneElement(children, {
            frameColor,
            filter,
            dateFormat,
            timeFormat,
            customTextConfig
          })}
          <FormField
            type="color"
            value={frameColor}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorChange(e)}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
};

export default PhotoEditor;
