import { useEffect, useCallback, useMemo, useRef, memo } from 'react';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);

import { FilterType, filterPreset } from '../configs/filter';
import { dateFormats, timeFormats } from '../configs/datetime';
import { CustomTextConfig } from '../types/editor';
import { FrameConfig } from '../configs/frame';
import { useAlert } from '../hooks/useAlert';
import { useCamera } from '../hooks/useCamera';
import { getFrameConfig } from '../utils/frame';
import { applyFilter } from '../utils/caman';

interface PhotoStripProps {
  frameColor: string;
  filter: FilterType;
  dateFormat: string;
  timeFormat: string;
  customTextConfig: CustomTextConfig;
  loadedImages: LoadedImage[];
  dimensions: FrameConfig['dimensions'] | null;
}

export interface LoadedImage {
  img: HTMLImageElement | HTMLCanvasElement;
}

interface ImageDimensions {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

interface RenderPhotoProps {
  ctx: CanvasRenderingContext2D;
  imageData: LoadedImage;
  x: number;
  y: number;
  photoCanvas: HTMLCanvasElement; // 暫存畫布
  filterCanvas: HTMLCanvasElement; // 濾鏡畫布
}

const PhotoStrip = memo(
  ({
    frameColor,
    filter,
    dateFormat,
    timeFormat,
    customTextConfig,
    loadedImages,
    dimensions,
  }: PhotoStripProps) => {
    const { setAlert } = useAlert();
    const { state, canvasRef, editorCanvasRef } = useCamera();
    const { frame } = state;

    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null); // 用於合成照片的 offscreen canvas
    const renderAbortRef = useRef<AbortController | null>(null); // 用於取消正在進行的渲染流程
    const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 用於 debounce 渲染，避免短時間內多次渲染。
    const filterRef = useRef(filter); // 用於在 debounce 期間保持最新的 filter 值，避免在 processPhoto 中拿到舊值。
    filterRef.current = filter;

    // 從 frame id 查詢邊框設定（格子數、邊距等），只在 frame 切換時重新計算。
    const frameConfig = useMemo(() => getFrameConfig(frame.id), [frame.id]);

    // 計算照片在相框內格中的尺寸與位置，確保照片能以 cover 模式填滿格子。
    const calculateImageDimensions = useCallback(
      (
        imgWidth: number,
        imgHeight: number,
        targetWidth: number,
        targetHeight: number
      ): ImageDimensions => {
        const scale = Math.max(
          targetWidth / imgWidth,
          targetHeight / imgHeight
        );
        return {
          width: imgWidth * scale,
          height: imgHeight * scale,
          offsetX: (targetWidth - imgWidth * scale) / 2,
          offsetY: (targetHeight - imgHeight * scale) / 2,
        };
      },
      []
    );

    const createTempCanvas = (
      width: number,
      height: number
    ): HTMLCanvasElement => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    };

    // 處理單張照片的完整流程：縮放 → 套用濾鏡 → 繪製到主 Canvas
    const processPhoto = useCallback(
      async ({
        ctx,
        imageData,
        x,
        y,
        photoCanvas,
        filterCanvas,
      }: RenderPhotoProps): Promise<void> => {
        if (!dimensions?.photo) {
          setAlert('Unable to get photo dimensions.', 'error');
          return;
        }

        const { width: targetWidth, height: targetHeight } = dimensions.photo;
        const { img } = imageData;

        // 將原始照片縮放到相框內格的尺寸，並計算置中偏移量。
        const imageDimensions = calculateImageDimensions(
          img.width,
          img.height,
          targetWidth,
          targetHeight
        );

        // 確保兩個暫存 canvas 的尺寸符合此照片的目標大小
        photoCanvas.width = targetWidth;
        photoCanvas.height = targetHeight;
        filterCanvas.width = targetWidth;
        filterCanvas.height = targetHeight;

        // 1. 在 photoCanvas 上繪製原始照片（縮放 + 置中）
        const photoCtx = photoCanvas.getContext('2d');
        if (!photoCtx) {
          setAlert('Unable to get photo.', 'error');
          return;
        }

        // 將原始照片以 cover 模式繪製到 photoCanvas
        photoCtx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          imageDimensions.offsetX, // 負值 = 左邊被裁切，達到置中效果。
          imageDimensions.offsetY, // 負值 = 上方被裁切
          imageDimensions.width,
          imageDimensions.height
        );

        // 2. 複製到 filterCanvas 準備套濾鏡
        const filterCtx = filterCanvas.getContext('2d');
        if (!filterCtx) {
          setAlert('Unable to get filter.', 'error');
          return;
        }

        filterCtx.drawImage(photoCanvas, 0, 0);

        // 3. 套用 Caman 濾鏡
        // 用 filterRef.current 而非 filter，確保 debounce 期間拿到的是最新值。
        try {
          await applyFilter(filterCanvas, filterPreset[filterRef.current]());
          // 4. 繪製到最終 offscreen canvas
          ctx.drawImage(filterCanvas, x, y);
        } catch (err) {
          // 套用失敗時，繪製未經濾鏡處理的原始照片。
          setAlert(
            `Failed to apply filter: ${err instanceof Error ? err.message : 'Unknown error'}`,
            'error'
          );
          ctx.drawImage(photoCanvas, x, y);
        }
      },
      [dimensions?.photo, calculateImageDimensions, setAlert]
    );

    // 在 editorCanvas 上繪製自訂文字
    const renderCustomText = useCallback(
      (ctx: CanvasRenderingContext2D) => {
        if (!dimensions?.canvas || !customTextConfig.text) return;

        const { text, color, size, font, position, rotation } =
          customTextConfig;

        ctx.save();

        ctx.font = `${size}px "${font}", sans-serif`;
        ctx.fillStyle = color;

        const textX = dimensions.padding.left + position.x;
        const textY =
          dimensions.canvas.height - dimensions.padding.top - position.y;

        if (rotation) {
          const textWidth = ctx.measureText(text).width;
          const textHeight = size;
          ctx.translate(textX + textWidth / 2, textY + textHeight / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, 0, 0);
        } else {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(text, textX, textY);
        }

        ctx.restore();
      },
      [dimensions, customTextConfig]
    );

    // 在 editorCanvas 上繪製日期和時間文字
    const renderDateTime = useCallback(
      (ctx: CanvasRenderingContext2D) => {
        if (!dimensions?.canvas) return;

        const now = dayjs();
        const selectedDateFormat = dateFormats.find(
          (df) => df.id === dateFormat
        );
        const selectedTimeFormat = timeFormats.find(
          (tf) => tf.id === timeFormat
        );
        const dateText = selectedDateFormat?.format
          ? now.format(selectedDateFormat.format)
          : '';
        const timeText = selectedTimeFormat?.format
          ? now.format(selectedTimeFormat.format)
          : '';
        const dateTimeText = [dateText, timeText].filter(Boolean).join(' ');

        // 有文字且 frame config 有定義日期繪製位置時才畫
        if (dateTimeText && dimensions.datetime) {
          ctx.save();

          ctx.textBaseline = 'middle';
          ctx.textAlign = dimensions.datetime.align;
          ctx.font = '24px "DigitalDream", monospace';
          ctx.fillStyle = '#FFB867';
          ctx.shadowColor = '#FFD4A480';
          ctx.shadowBlur = 2;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          ctx.fillText(
            dateTimeText,
            dimensions.datetime.x,
            dimensions.datetime.y
          );

          ctx.restore();
        }
      },
      [dateFormat, timeFormat, dimensions]
    );

    // 取消正在進行中的渲染
    const cancelRender = useCallback(() => {
      renderAbortRef.current?.abort(); // 讓進行中的 processPhoto 提前跳過
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
      renderAbortRef.current = null;
      renderTimeoutRef.current = null;
    }, []);

    // 計算每張照片在相框內格中的位置（左上角座標）
    const getPhotoPosition = useCallback(
      (index: number) => {
        const colCount = frameConfig?.gridSize.cols ?? 1;
        const rowIndex = Math.floor(index / colCount);
        const colIndex = index % colCount;

        return {
          x:
            dimensions!.padding.left +
            colIndex * (dimensions!.photo.width + dimensions!.gap.horizontal),
          y:
            dimensions!.padding.top +
            rowIndex * (dimensions!.photo.height + dimensions!.gap.vertical),
        };
      },
      [dimensions, frameConfig?.gridSize.cols]
    );

    // 主要 Canvas 渲染流程
    const renderCanvas = useCallback(async () => {
      cancelRender();

      if (!canvasRef.current || !editorCanvasRef.current || !dimensions?.canvas)
        return;

      const abortController = new AbortController();
      renderAbortRef.current = abortController;

      // 等待 16ms 看有沒有新的渲染請求進來
      const debounceTimeout = setTimeout(async () => {
        renderTimeoutRef.current = null; // timeout 已觸發，清除 timer 參考。

        // 初始化 offscreen canvas（只做一次，後續重複使用）
        if (!offscreenCanvasRef.current)
          offscreenCanvasRef.current = document.createElement('canvas');
        offscreenCanvasRef.current.width = dimensions.canvas.width;
        offscreenCanvasRef.current.height = dimensions.canvas.height;

        const offscreenCtx = offscreenCanvasRef.current.getContext('2d', {
          alpha: false, // 不需要透明通道
          willReadFrequently: false, // 不會頻繁讀取像素
        });

        if (!offscreenCtx) return;

        try {
          // 1. 填充邊框背景
          offscreenCtx.fillStyle = frameColor;
          offscreenCtx.fillRect(
            0,
            0,
            dimensions.canvas.width,
            dimensions.canvas.height
          );

          // 2. 逐張繪製照片
          if (loadedImages.length > 0) {
            const { width: pw, height: ph } = dimensions.photo;
            const maxPhotos =
              (frameConfig?.gridSize.rows ?? 0) *
              (frameConfig?.gridSize.cols ?? 0);

            // 預先配置每張照片需要的暫存 canvas
            const photoCanvases = loadedImages.map(() =>
              createTempCanvas(pw, ph)
            );
            const filterCanvases = loadedImages.map(() =>
              createTempCanvas(pw, ph)
            );

            // 並行處理所有照片（最多 frame 格子數）
            await Promise.all(
              loadedImages.slice(0, maxPhotos).map(async (imageData, i) => {
                // 若在處理過程中被取消，跳過後續繪製。
                if (abortController.signal.aborted) return;

                // 將照片處理排入 animation frame，延後執行，但不保證每張照片分散到不同幀。
                return new Promise<void>((resolve) => {
                  requestAnimationFrame(async () => {
                    const { x, y } = getPhotoPosition(i);

                    await processPhoto({
                      ctx: offscreenCtx,
                      imageData,
                      x,
                      y,
                      photoCanvas: photoCanvases[i],
                      filterCanvas: filterCanvases[i],
                    });
                    resolve();
                  });
                });
              })
            );
          }

          // 3. 複製到主顯示 canvas
          const ctx = canvasRef.current?.getContext('2d', {
            alpha: false,
            willReadFrequently: false,
          });

          if (ctx)
            requestAnimationFrame(() => {
              if (abortController.signal.aborted) return;
              // 設定 canvas 尺寸，否則 drawImage 會縮放。
              canvasRef.current!.width = dimensions.canvas.width;
              canvasRef.current!.height = dimensions.canvas.height;
              // 將 offscreen canvas 的完整內容複製到顯示用 canvas
              ctx.drawImage(offscreenCanvasRef.current!, 0, 0);
            });

          // 4. 疊加文字與日期（在 editorCanvas 上）
          const editorCtx = editorCanvasRef.current?.getContext('2d');
          if (editorCtx)
            requestAnimationFrame(() => {
              if (abortController.signal.aborted) return;
              editorCanvasRef.current!.width = dimensions.canvas.width;
              editorCanvasRef.current!.height = dimensions.canvas.height;
              renderCustomText(editorCtx);
              renderDateTime(editorCtx);
            });
        } catch (err) {
          setAlert(
            `Failed to render canvas: ${err instanceof Error ? err.message : 'Unknown error'}`,
            'error'
          );
        }
        renderTimeoutRef.current = null;
      }, 16); // 16ms ≈ 60fps 的更新頻率，讓多個快速變化合併成一次渲染。

      // 儲存 debounce timer ref 給 cancelRender 用
      renderTimeoutRef.current = debounceTimeout;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      canvasRef,
      editorCanvasRef,
      loadedImages,
      dimensions,
      frameConfig,
      frameColor,
      getPhotoPosition,
      processPhoto,
      renderCustomText,
      renderDateTime,
    ]);

    // 字體載入（custom text、date time）
    useEffect(() => {
      const loadFont = async () => {
        const results = await Promise.allSettled([
          document.fonts.load('24px "DigitalDream"'),
          document.fonts.load(
            `${customTextConfig.size}px "${customTextConfig.font}"`
          ),
        ]);

        const failedCount = results.filter(
          (result) => result.status === 'rejected'
        ).length;

        if (failedCount === results.length)
          setAlert('Failed to load fonts, using fallback fonts.', 'error');
        else if (failedCount > 0)
          setAlert('Some fonts failed to load, using fallback fonts.', 'error');

        // 載入完成後重繪一次，讓已成功下載的字體套回畫面。
        if (canvasRef.current && dimensions)
          requestAnimationFrame(() => renderCanvas());
      };

      loadFont();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customTextConfig.font]);

    useEffect(() => {
      if (!canvasRef.current || !dimensions) return;
      renderCanvas();
      return () => cancelRender();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, renderCanvas, cancelRender, dimensions]);

    if (!dimensions) return null;

    return (
      <div className='relative flex size-full flex-col items-center shadow-md'>
        <canvas
          ref={canvasRef}
          className='absolute top-0 left-0 size-full'
          aria-label='Photo strip'
        />
        <canvas
          ref={editorCanvasRef}
          className='absolute top-0 left-0 z-1 size-full'
          aria-label='Editor overlay'
        />
      </div>
    );
  }
);

export default PhotoStrip;
