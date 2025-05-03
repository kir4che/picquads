import { ReactElement, cloneElement, useState, useCallback } from 'react';

import { FilterType } from '../../configs/filter';
import { CustomTextConfig } from '../../types/editor';

import PhotoActions from '../PhotoActions';
import FormField from '../FormField';
import CustomText from './CustomText';
import DateTimeSelect from './DateTimeSelect';
import Filters from './Filters';

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
    size: 48,
  });

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      // 類似 setTimeout 機制，在下一個瀏覽器繪製幀時執行更新。
      // 若在一幀內收到多個顏色更新，只有最後一個會被實際執行，等於節流 (throttling)。
      requestAnimationFrame(() => setFrameColor(newColor));
    },
    []
  );

  return (
    <div
      className='flex flex-col items-center gap-y-2 md:gap-y-4'
      aria-label='Photo editor'
    >
      <Filters filter={filter} onFilterChange={setFilter} />
      <div className='flex flex-col items-start justify-center gap-x-8 gap-y-3 md:flex-row'>
        <div className='w-full space-y-4'>
          <PhotoActions />
          <CustomText
            customTextConfig={customTextConfig}
            setCustomTextConfig={setCustomTextConfig}
          />
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
            customTextConfig,
          })}
          <FormField
            type='color'
            value={frameColor}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleColorChange(e)
            }
            className='w-20'
          />
        </div>
      </div>
    </div>
  );
};

export default PhotoEditor;
