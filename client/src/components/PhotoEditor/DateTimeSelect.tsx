import { useState } from 'react';

import { dateFormats, timeFormats } from '../../configs/datetime';

import Select from '../Select';

interface DateTimeSelectProps {
  dateFormat: string;
  setDateFormat: (value: string) => void;
  timeFormat: string;
  setTimeFormat: (value: string) => void;
}

const DateTimeSelect: React.FC<DateTimeSelectProps> = ({ dateFormat, setDateFormat, timeFormat, setTimeFormat }) => {
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

  const handleSelectChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value); // 更新選中的值
  };

  return (
    <>
      <label className="flex items-center gap-x-2 mb-1.5 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={showDateTime}
          onChange={handleCheckboxChange}
          className="w-3.5 h-3.5"
          aria-checked={showDateTime}
          aria-label="Show date & time"
        />
        Show Date & Time
      </label>
      {showDateTime && (
        <div className='flex items-center text-sm gap-x-2'>
          <Select
            value={dateFormat}
            onChange={handleSelectChange(setDateFormat)}
            options={dateFormats}
            disabled={!showDateTime}
            aria-label="Select date format"
          />
          <Select
            value={timeFormat}
            onChange={handleSelectChange(setTimeFormat)}
            options={timeFormats}
            disabled={!showDateTime}
            aria-label="Select time format"
          />
        </div>
      )}
    </>
  );
};

export default DateTimeSelect;
