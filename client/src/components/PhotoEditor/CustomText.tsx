import { CustomTextConfig, availableFonts } from '../../types/editor';

import FormField from '../FormField';
import Select from '../Select';
import CollapsibleSection from './CollapsibleSection';

interface CustomTextProps {
  customTextConfig: CustomTextConfig;
  setCustomTextConfig: React.Dispatch<React.SetStateAction<CustomTextConfig>>;
}

const CustomText = ({
  customTextConfig,
  setCustomTextConfig,
}: CustomTextProps) => {
  const { text, color, font } = customTextConfig;

  // 根據不同 key 更新 customTextConfig 狀態
  const handleChange =
    <T extends keyof CustomTextConfig>(key: T) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        e.target.type === 'number' ? Number(e.target.value) : e.target.value;

      setCustomTextConfig((prev) => ({ ...prev, [key]: value }));
    };

  return (
    <div className='flex flex-col gap-y-1'>
      <FormField
        id='customText'
        label='Custom Text'
        value={text}
        onChange={handleChange('text')}
        labelStyle='text-xs'
        aria-label='Enter custom text'
      />
      {text && (
        <CollapsibleSection
          label='Text Settings'
          ariaLabel='Custom text settings'
          defaultExpanded={false}
        >
          <div className='space-y-3'>
            <div className='flex gap-x-4'>
              <FormField
                id='customTextColor'
                type='color'
                label='Color'
                value={color}
                onChange={handleChange('color')}
                className='h-11 w-24'
                labelStyle='text-xs'
                aria-label='Choose text color'
              />
              <div className='flex-1'>
                <Select
                  id='customTextFont'
                  label='Font'
                  value={font}
                  onChange={handleChange('font')}
                  options={availableFonts}
                  labelStyle='text-xs'
                  aria-label='Choose font family'
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};

export default CustomText;
