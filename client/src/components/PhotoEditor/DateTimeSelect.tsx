import { useState } from 'react';
import { LoaderCircle, CircleCheckBig } from 'lucide-react';

import { dateFormats, timeFormats } from '../../configs/datetime';

import Select from '../Select';

interface DateTimeSelectProps {
  dateFormat: string;
  setDateFormat: (value: string) => void;
  timeFormat: string;
  setTimeFormat: (value: string) => void;
}

const DateTimeSelect = ({
  dateFormat,
  setDateFormat,
  timeFormat,
  setTimeFormat,
}: DateTimeSelectProps) => {
  const [showDateTime, setShowDateTime] = useState(false);

  const handleCheckboxChange = () => {
    const newShowDateTime = !showDateTime;
    setShowDateTime(newShowDateTime);

    if (!newShowDateTime) {
      setDateFormat('');
      setTimeFormat('');
    } else {
      const defaultDateFormat = dateFormats[0]?.id || '';
      const defaultTimeFormat = timeFormats[0]?.id || '';

      setDateFormat(defaultDateFormat);
      setTimeFormat(defaultTimeFormat);
    }
  };

  const handleSelectChange =
    (setter: (value: string) => void) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value); // 更新選中的值
    };

  return (
    <div>
      <label className='relative pl-6 text-sm text-gray-600 select-none'>
        <input
          type='checkbox'
          className='peer absolute h-0 w-0 opacity-0'
          checked={showDateTime}
          onChange={handleCheckboxChange}
          aria-checked={showDateTime}
          aria-label='Show date & time'
        />
        Show Date & Time
        <LoaderCircle
          fill='white'
          size={18}
          className='absolute top-[-0.5px] left-0 peer-checked:opacity-0'
        />
        <CircleCheckBig
          fill='white'
          size={18}
          className='absolute top-[-0.5px] left-0 opacity-0 peer-checked:opacity-100'
        />
      </label>
      {showDateTime && (
        <div className='space-y-2 py-2 text-sm'>
          <Select
            value={dateFormat}
            onChange={handleSelectChange(setDateFormat)}
            options={dateFormats}
            disabled={!showDateTime}
            aria-label='Select date format'
          />
          <Select
            value={timeFormat}
            onChange={handleSelectChange(setTimeFormat)}
            options={timeFormats}
            disabled={!showDateTime}
            aria-label='Select time format'
          />
        </div>
      )}
    </div>
  );
};

export default DateTimeSelect;
