import { ReactElement, cloneElement, useState, useCallback } from 'react';

import { FilterType } from '../../configs/filter';
import { CustomTextConfig } from '../../types/editor';
import { useCamera } from '../../hooks/useCamera';
import { getFrameDimensions } from '../../utils/frame';
import { useStickerManager } from '../../hooks/useStickerManager';

import PhotoActions from '../PhotoActions';
import FormField from '../FormField';
import CustomText from './CustomText';
import DateTimeSelect from './DateTimeSelect';
import Filters from './Filters';
import StickerPanel from './StickerPanel';
import StickerLayer from './StickerLayer';

interface PhotoEditorProps {
  children: ReactElement<{
    frameColor: string;
    filter: FilterType;
    dateFormat: string;
    timeFormat: string;
    customTextConfig: CustomTextConfig;
  }>;
}

const PhotoEditor = ({ children }: PhotoEditorProps) => {
  const [frameColor, setFrameColor] = useState<string>('#000000');
  const [filter, setFilter] = useState<FilterType>('none');
  const [dateFormat, setDateFormat] = useState<string>('');
  const [timeFormat, setTimeFormat] = useState<string>('');
  const [customTextConfig, setCustomTextConfig] = useState<CustomTextConfig>({
    text: '',
    font: 'PlayfairDisplay',
    position: { x: 0, y: 20 },
    color: '#FFFFFF',
    size: 64,
  });

  const { state } = useCamera();
  const dimensions = getFrameDimensions(state.frame.id);
  const displayW = dimensions ? dimensions.canvas.width * 0.25 : 0;
  const displayH = dimensions ? dimensions.canvas.height * 0.25 : 0;

  const {
    stickers,
    activeStickerSrc,
    selectedStickerId,
    setActiveSrc,
    addSticker,
    updateSticker,
    removeSticker,
    selectSticker,
    clearSelection,
  } = useStickerManager();

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      requestAnimationFrame(() => setFrameColor(newColor));
    },
    []
  );

  return (
    <div
      className='flex w-full flex-col items-center gap-y-2 px-4 md:gap-y-4'
      aria-label='Photo editor'
    >
      <Filters filter={filter} onFilterChange={setFilter} />
      <div className='flex w-full flex-col items-center gap-y-4 md:flex-row md:items-start md:justify-center md:gap-x-8'>
        <div className='order-2 w-full max-w-md space-y-4 md:order-1 md:w-80 md:shrink-0'>
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
          <StickerPanel
            activeStickerSrc={activeStickerSrc}
            onSelect={setActiveSrc}
          />
        </div>
        <div className='order-1 flex w-full flex-col items-center gap-y-3 md:order-2 md:w-auto'>
          <div
            className='relative'
            style={{ width: displayW, height: displayH }}
          >
            {cloneElement(children, {
              frameColor,
              filter,
              dateFormat,
              timeFormat,
              customTextConfig,
            })}
            <StickerLayer
              stickers={stickers}
              selectedStickerId={selectedStickerId}
              activeStickerSrc={activeStickerSrc}
              onAddSticker={addSticker}
              onUpdateSticker={updateSticker}
              onSelectSticker={selectSticker}
              onRemoveSticker={removeSticker}
              onClearSelection={() => {
                clearSelection();
                setActiveSrc(null);
              }}
              displayWidth={displayW}
              displayHeight={displayH}
            />
          </div>
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
