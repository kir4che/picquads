import { useState } from 'react';

import { CustomTextConfig, availableFonts } from '../../types/editor'

import FormField from '../FormField';
import Select from '../Select';

import ChevronDownIcon from '../../assets/icons/chevron-down.svg?react';

interface CustomTextProps {
  customTextConfig: CustomTextConfig;
  setCustomTextConfig: React.Dispatch<React.SetStateAction<CustomTextConfig>>;
}

const CustomText: React.FC<CustomTextProps> = ({ customTextConfig, setCustomTextConfig }) => {
  const { text, color, size, font, position } = customTextConfig;

  const [isTextSettingsExpanded, setIsTextSettingsExpanded] = useState(false);

  // 根據不同 key 更新 customTextConfig 狀態
  const handleChange = <T extends keyof CustomTextConfig>(
    key: T
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;

    if (key === 'position') {
      const { name, value: positionValue } = e.target;
      setCustomTextConfig((prev) => ({
        ...prev,
        position: { ...prev.position, [name]: Number(positionValue) },
      }));
    } else setCustomTextConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-y-1">
      <FormField
        id="customText"
        label="Custom Text"
        value={text}
        onChange={handleChange('text')}
        labelStyle='text-xs w-64'
        aria-label="Enter custom text"
      />
      {text && (
        <div className="flex flex-col max-w-64">
          <button
            onClick={() => setIsTextSettingsExpanded((prev) => !prev)}
            className="flex items-center justify-between w-full py-2 text-xs text-gray-600 border-b border-violet-700 focus:outline-none"
            aria-expanded={isTextSettingsExpanded}
            aria-label='Custom text settings'
          >
            Text Settings
            <ChevronDownIcon 
              className={`w-5 h-5 transition-transform duration-300 ${
                isTextSettingsExpanded ? 'transform rotate-180' : ''
              }`}
            />
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isTextSettingsExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="py-4 space-y-3">
              <div className="flex gap-x-4">
                <FormField
                  id="customTextColor"
                  type="color"
                  label="Color"
                  value={color}
                  onChange={handleChange('color')}
                  className="w-24 h-11"
                  labelStyle='text-xs'
                  aria-label="Choose text color"
                />
                <FormField
                  id="customTextSize"
                  type="number"
                  label="Font Size"
                  value={size}
                  onChange={handleChange('size')}
                  labelStyle='text-xs'
                  aria-label="Set font size"
                />
              </div>
              <Select
                id="customTextFont"
                label="Select Font"
                value={font}
                onChange={handleChange('font')}
                options={availableFonts}
                labelStyle='text-xs'
                aria-label="Choose font family"
              />
              <div className="grid grid-cols-2 gap-x-4">
                <FormField
                  id="customTextX"
                  name="x"
                  type="number"
                  label="X coordinate"
                  value={position.x}
                  onChange={handleChange('position')}
                  labelStyle='text-xs'
                  aria-label="Set X coordinate"
                />
                <FormField
                  id="customTextY"
                  name="y"
                  type="number"
                  label="Y coordinate"
                  value={position.y}
                  onChange={handleChange('position')}
                  labelStyle='text-xs'
                  aria-label="Set Y coordinate"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomText;
