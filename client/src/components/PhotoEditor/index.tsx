import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';

import { FilterType } from '../../configs/filter';
import { CustomTextConfig } from '../../types/editor';
import { useCamera } from '../../hooks/useCamera';
import { useAlert } from '../../hooks/useAlert';
import { getFrameDimensions, getDisplaySize } from '../../utils/frame';
import { useStickerManager } from '../../hooks/useStickerManager';

import PhotoActions from '../PhotoActions';
import FormField from '../FormField';
import PhotoStrip from '../PhotoStrip';
import CustomText from './CustomText';
import DateTimeSelect from './DateTimeSelect';
import Filters from './Filters';
import StickerPanel from './StickerPanel';
import StickerLayer from './StickerLayer';
import CustomTextOverlay from './CustomTextOverlay';

// 單張照片載入結果，保留原始 URL 與 facingMode 供重新處理使用。
type ImageLoadResult =
  | {
      status: 'success';
      img: HTMLImageElement | HTMLCanvasElement;
      url: string;
      facingMode: string;
    }
  | {
      status: 'error';
      url: string;
      facingMode: string;
    };

const PhotoEditor = () => {
  const { state, resetCamera } = useCamera();
  const { setAlert } = useAlert();
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

  const dimensions = useMemo(
    () => getFrameDimensions(state.frame.id),
    [state.frame.id]
  );
  const loadRequestIdRef = useRef(0); // 每次載入圖片都加 1，確保只採用最後一次請求結果。

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
    rotation: 0,
  });
  const [loadStatus, setLoadStatus] = useState<
    'loading' | 'success' | 'failure'
  >('loading');
  const [imageLoadResults, setImageLoadResults] = useState<ImageLoadResult[]>(
    []
  );
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== 'undefined' ? Math.max(window.innerWidth - 32, 320) : 400
  );

  // 手機螢幕很窄時，仍保留最小編輯寬度避免版面壞掉。
  const getSafeContainerWidth = useCallback(
    () => Math.max(window.innerWidth - 32, 320),
    []
  );

  // 載入單張照片，永遠 resolve（不回傳 reject），由 status 區分成功/失敗。
  const loadSingleImage = useCallback(
    (image: { url: string; facingMode: string }): Promise<ImageLoadResult> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          // 前鏡頭則將照片水平翻轉
          if (image.facingMode === 'user') {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              console.error(
                `Failed to create 2d context for image: ${image.url}`
              );
              resolve({
                status: 'error',
                url: image.url,
                facingMode: image.facingMode,
              });
              return;
            }
            ctx.translate(img.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0);
            resolve({
              status: 'success',
              img: canvas,
              url: image.url,
              facingMode: image.facingMode,
            });
          } else {
            resolve({
              status: 'success',
              img,
              url: image.url,
              facingMode: image.facingMode,
            });
          }
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${image.url}`);
          resolve({
            status: 'error',
            url: image.url,
            facingMode: image.facingMode,
          });
        };
        img.src = image.url;
      });
    },
    []
  );

  // 載入所有照片，失敗時自動 retry，最終判定整組可用性。
  const loadImages = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;

    // 沒照片時直接失敗，避免 Promise.all([]) 直接 resolve。
    if (state.capturedImages.length === 0) {
      setImageLoadResults([]);
      setLoadStatus('failure');
      setAlert('No photos found. Please retake a new set.', 'error');
      return;
    }

    setLoadStatus('loading');

    // 第一輪載入
    const results = await Promise.all(
      state.capturedImages.map((image) => loadSingleImage(image))
    );

    // 自動 retry 失敗項目（最多 2 次）
    for (let attempt = 0; attempt < 2; attempt++) {
      const failIndices = results
        .map((r, i) => (r.status === 'error' ? i : -1))
        .filter((i) => i !== -1);

      if (failIndices.length === 0) break;

      const retryResults = await Promise.all(
        failIndices.map((i) => loadSingleImage(state.capturedImages[i]))
      );

      for (let j = 0; j < retryResults.length; j++)
        results[failIndices[j]] = retryResults[j];
    }

    // 若這不是最新請求，代表資料已過期，不更新畫面。
    if (requestId !== loadRequestIdRef.current) return;

    setImageLoadResults(results);

    const successCount = results.filter((r) => r.status === 'success').length;
    if (successCount === results.length) setLoadStatus('success');
    else {
      setLoadStatus('failure');
      setAlert(
        `${results.length - successCount} photo(s) failed to load. Please retake or reprocess.`,
        'error'
      );
    }
  }, [state.capturedImages, loadSingleImage, setAlert]);

  // 重新處理：只對失敗照片再次載入，成功後保留原格位。
  const handleReprocess = useCallback(async () => {
    if (imageLoadResults.length === 0) return;

    const requestId = ++loadRequestIdRef.current;

    const failEntries = imageLoadResults
      .map((r, i) =>
        r.status === 'error'
          ? { index: i, url: r.url, facingMode: r.facingMode }
          : null
      )
      .filter(
        (e): e is { index: number; url: string; facingMode: string } =>
          e !== null
      );

    if (failEntries.length === 0) {
      setLoadStatus('success');
      return;
    }

    setLoadStatus('loading');

    const retryResults = await Promise.all(
      failEntries.map(({ url, facingMode }) =>
        loadSingleImage({ url, facingMode })
      )
    );

    if (requestId !== loadRequestIdRef.current) return;

    // 在當前結果基礎上更新失敗項
    const nextResults = [...imageLoadResults];
    let fixedCount = 0;
    for (let i = 0; i < failEntries.length; i++) {
      if (retryResults[i].status === 'success') {
        nextResults[failEntries[i].index] = retryResults[i];
        fixedCount++;
      }
    }

    setImageLoadResults(nextResults);

    const totalFailed = nextResults.filter((r) => r.status === 'error').length;
    if (totalFailed === 0) setLoadStatus('success');
    else {
      setLoadStatus('failure');
      if (fixedCount === 0)
        setAlert('Still unable to load photos. Please retake.', 'error');
      else
        setAlert('Some photos still failed. Try reprocess or retake.', 'error');
    }
  }, [imageLoadResults, loadSingleImage, setAlert]);

  // 監聽視窗大小變化，更新 containerWidth。
  useEffect(() => {
    const handleResize = () => setContainerWidth(getSafeContainerWidth());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getSafeContainerWidth]);

  // 元件卸載時把編號往前推，阻止未完成請求回來改 state。
  useEffect(() => {
    return () => {
      loadRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadImages();
  }, [loadImages]);

  // 成功載入的照片，傳給 PhotoStrip 與 StickerLayer 用。
  const loadedImages = imageLoadResults
    .filter(
      (
        r
      ): r is ImageLoadResult & {
        status: 'success';
        img: HTMLImageElement | HTMLCanvasElement;
      } => r.status === 'success'
    )
    .map((r) => ({ img: r.img }));

  // 失敗照片數量
  const failureCount = imageLoadResults.filter(
    (r) => r.status === 'error'
  ).length;

  // 計算畫面上要顯示的尺寸，避免超出容器寬度。
  const { width: displayW, height: displayH } = dimensions
    ? getDisplaySize(dimensions.canvas, containerWidth)
    : { width: 0, height: 0 };

  // 取得合併好的 canvas，若沒有則回傳 null。
  const uploadCacheKey = useMemo(
    () =>
      JSON.stringify({
        frameId: state.frame.id,
        captures: state.capturedImages.map(
          ({ url, facingMode, timestamp }) => ({
            url,
            facingMode,
            timestamp,
          })
        ),
        frameColor,
        filter,
        dateFormat,
        timeFormat,
        customTextConfig,
        stickers: stickers.map(
          ({ id, src, x, y, width, height, rotation, zIndex }) => ({
            id,
            src,
            x,
            y,
            width,
            height,
            rotation,
            zIndex,
          })
        ),
      }),
    [
      state.frame.id,
      state.capturedImages,
      frameColor,
      filter,
      dateFormat,
      timeFormat,
      customTextConfig,
      stickers,
    ]
  );

  return (
    <div
      className='flex w-full flex-col items-center gap-y-2 px-4 md:gap-y-4'
      aria-label='Photo editor'
    >
      <Filters filter={filter} onFilterChange={setFilter} />
      {loadStatus === 'loading' && (
        <div className='flex h-60 flex-col items-center justify-center gap-y-3'>
          <Loader2 size={40} className='animate-spin text-violet-500' />
          <p className='text-sm text-gray-500'>
            {imageLoadResults.length > 0
              ? `Reprocessing ${failureCount} failed photo(s)…`
              : 'Preparing photos…'}
          </p>
        </div>
      )}
      {loadStatus === 'failure' && (
        <div className='flex h-60 flex-col items-center justify-center gap-y-4 text-center'>
          <p className='text-base font-medium text-gray-700'>
            {failureCount} photo(s) failed to load — this strip is incomplete.
          </p>
          <p className='text-sm text-gray-500'>
            We already retried automatically. You can reprocess the existing
            photos, or retake a new set.
          </p>
          <div className='flex gap-x-3'>
            <button
              onClick={handleReprocess}
              className='rounded-md bg-violet-500 px-5 py-1.5 font-medium text-white hover:bg-violet-600'
            >
              Reprocess
            </button>
            <button
              onClick={resetCamera}
              className='rounded-md border border-gray-300 px-5 py-1.5 font-medium text-gray-600 hover:bg-gray-100'
            >
              Retake
            </button>
          </div>
        </div>
      )}
      {loadStatus === 'success' && (
        <div className='flex w-full flex-col items-center gap-y-4 md:flex-row md:items-start md:justify-center md:gap-x-8'>
          <div className='order-2 w-full max-w-md space-y-4 md:order-1 md:w-80 md:shrink-0'>
            <PhotoActions uploadCacheKey={uploadCacheKey} />
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
          <div className='order-1 flex w-full max-w-full flex-col items-center gap-y-3 md:order-2 md:w-auto'>
            <div
              className='relative overflow-hidden'
              style={{ width: displayW, height: displayH }}
            >
              <PhotoStrip
                frameColor={frameColor}
                filter={filter}
                dateFormat={dateFormat}
                timeFormat={timeFormat}
                customTextConfig={customTextConfig}
                loadedImages={loadedImages}
                dimensions={dimensions}
              />
              <CustomTextOverlay
                customTextConfig={customTextConfig}
                setCustomTextConfig={setCustomTextConfig}
                dimensions={dimensions}
                displayWidth={displayW}
                displayHeight={displayH}
              />
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
                  setActiveSrc(null); // 避免下次新增貼紙時仍用舊的 activeStickerSrc
                }}
                displayWidth={displayW}
                displayHeight={displayH}
              />
            </div>
            <FormField
              type='color'
              value={frameColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFrameColor(e.target.value)
              }
              className='w-20'
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoEditor;
