import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);

import { FilterType, filterPreset } from '../configs/filter';
import { dateFormats, timeFormats } from '../configs/datetime';
import { CustomTextConfig } from '../types/editor'
import { useAlert } from '../hooks/useAlert';
import { useCamera } from '../hooks/useCamera';
import { getFrameConfig, getFrameDimensions } from '../utils/frame';
import { applyFilter } from '../utils/caman';

interface PhotoStripProps {
  frameColor: string;
  filter: FilterType;
  dateFormat: string;
  timeFormat: string;
  customTextConfig: CustomTextConfig;
}

interface LoadedImage {
  img: HTMLImageElement;
  facingMode: 'user' | 'environment';
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
  shouldFlipHori: boolean;
}

const PhotoStrip: React.FC<PhotoStripProps> = React.memo(({ frameColor, filter, dateFormat, timeFormat, customTextConfig }) => {
  const { setAlert } = useAlert();
  const { state, canvasRef } = useCamera();
  const { frame, isMobileDevice, capturedImages: images } = state;

  const isRenderingRef = useRef(false); // 用於避免多次執行 renderCanvas
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null); // 用於在記憶體中預先處理照片
  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([]); // 儲存已載入的照片
  const [fontLoaded, setFontLoaded] = useState<boolean>(false); // 追蹤字體是否載入完成

  // 取得邊框的設定及尺寸
  const frameConfig = useMemo(() => getFrameConfig(frame.id), [frame.id]);
  const dimensions = useMemo(() => getFrameDimensions(frame.id), [frame.id]);

  // 計算照片的縮放尺寸及位置，確保不會超出邊框範圍。
  const calculateImageDimensions = useCallback((
    imgWidth: number,
    imgHeight: number,
    targetWidth: number,
    targetHeight: number
  ): ImageDimensions => {
    const scale = Math.max(targetWidth / imgWidth, targetHeight / imgHeight);
    return {
      width: imgWidth * scale,
      height: imgHeight * scale,
      offsetX: (targetWidth - imgWidth * scale) / 2,
      offsetY: (targetHeight - imgHeight * scale) / 2
    };
  }, []);

  // 創建臨時的 Canvas 來處理照片繪製
  const createTempCanvas = useCallback((width: number, height: number): HTMLCanvasElement | null => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }, []);

  // 處理單張照片：縮放、翻轉、應用濾鏡並繪製到主 Canvas。
  const processPhoto = useCallback(async ({ ctx, imageData, x, y, shouldFlipHori }: RenderPhotoProps): Promise<void> => {
    if (!dimensions?.photo) {
      setAlert('Unable to get photo dimensions.', 'error');
      return;
    }

    const { width: targetWidth, height: targetHeight } = dimensions.photo;
    const { img } = imageData;
    
    const imageDimensions = calculateImageDimensions(img.width, img.height, targetWidth, targetHeight);

    // 創建臨時的 Canvas 來繪製照片
    const photoCanvas = createTempCanvas(targetWidth, targetHeight);
    if (!photoCanvas) {
      setAlert('Unable to create photo canvas.', 'error');
      return;
    }

    // 取得照片的 Canvas Rendering Context 以進行繪圖操作
    const photoCtx = photoCanvas.getContext('2d');
    if (!photoCtx) {
      setAlert('Unable to get photo.', 'error');
      return;
    }

    photoCtx.save(); // 儲存當前初始狀態，以便後續可以恢復。

    // 若需要水平翻轉圖片
    if (shouldFlipHori) {
      photoCtx.translate(targetWidth, 0);
      photoCtx.scale(-1, 1);
    }
    
    // 將照片以正確的縮放比例及位置繪製到臨時 Canvas
    photoCtx.drawImage(
      img,
      0, 0, img.width, img.height,
      imageDimensions.offsetX, imageDimensions.offsetY,
      imageDimensions.width, imageDimensions.height
    );

    photoCtx.restore(); // 恢復初始狀態，避免影響到其他照片的繪製。

    // 創建臨時的 Canvas 來處理濾鏡
    const filterCanvas = createTempCanvas(targetWidth, targetHeight);
    if (!filterCanvas) {
      setAlert('Unable to create filter canvas.', 'error');
      return;
    }

    const filterCtx = filterCanvas.getContext('2d');
    if (!filterCtx) {
      setAlert('Unable to get filter.', 'error');
      return;
    }

    filterCtx.drawImage(photoCanvas, 0, 0); // 將以處理的照片繪製到濾鏡 Canvas 上

    try {
      await applyFilter(filterCanvas, filterPreset[filter]()); // 套用濾鏡
      ctx.drawImage(filterCanvas, x, y); // 繪製濾鏡後的照片到主 Canvas
    } catch (err) {
      setAlert(`Failed to apply filter: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      ctx.drawImage(photoCanvas, x, y); // 若濾鏡套用失敗，則繪製未處理的照片到主 Canvas。
    }
  }, [dimensions?.photo, filter, calculateImageDimensions, setAlert, createTempCanvas]);

  // 字體載入
  useEffect(() => {
    const loadFont = async () => {
      try {
        // 同時載入日期與時間的 DigitalDream 字體和 custom text 的字體
        await Promise.all([
          document.fonts.load('24px "DigitalDream"'),
          document.fonts.load(`${customTextConfig.size}px "${customTextConfig.font}"`)
        ]);
        setFontLoaded(true);
        // 強制重新渲染，確保有正確載入。
        if (canvasRef.current && dimensions) requestAnimationFrame(() => renderCanvas());
      } catch (err) {
        setAlert(`Failed to load font: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
        setFontLoaded(false);
      }
    };

    loadFont();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customTextConfig.font]);

  // 渲染自定義文字
  const renderCustomText = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!dimensions?.canvas || !customTextConfig.text || !fontLoaded) return;

    const { text, color, size, font, position } = customTextConfig;

    // 檢查是否需要更新畫面
    if (ctx.fillStyle !== color || ctx.font !== `${size}px "${font}"`) {
      requestAnimationFrame(() => {
        ctx.save();
        
        // 使用 imageSmoothingEnabled 提升渲染品質
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.font = `${size}px "${font}"`;
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.letterSpacing = '2px';
        
        ctx.fillText(
          text, 
          dimensions.padding.left + position.x, 
          dimensions.canvas.height - dimensions.padding.top - position.y
        );
        ctx.restore();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customTextConfig]);

  // 渲染日期、時間
  const renderDateTime = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!dimensions?.canvas || !fontLoaded) return;

    const now = dayjs();
    const selectedDateFormat = dateFormats.find(df => df.id === dateFormat);
    const selectedTimeFormat = timeFormats.find(tf => tf.id === timeFormat);
    
    let dateTimeText = '';
    
    if (selectedDateFormat?.format && dateFormat !== '')
      dateTimeText += now.format(selectedDateFormat.format);
    
    if (selectedTimeFormat?.format && timeFormat !== '') {
      if (dateTimeText) dateTimeText += ' ';
      dateTimeText += now.format(selectedTimeFormat.format);
    }

    if (dateTimeText && dimensions.datetime) {
      ctx.save();

      ctx.textBaseline = 'middle';
      ctx.textAlign = dimensions.datetime.align;
      ctx.font = '24px "DigitalDream"';
      ctx.fillStyle = '#FFB867';
      ctx.letterSpacing = '2px';

      ctx.shadowColor = '#FFD4A480';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(dateTimeText, dimensions.datetime.x, dimensions.datetime.y);
      
      ctx.restore();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFormat, timeFormat]);

  // 渲染照片到整個拍貼畫布
  const renderCanvas = useCallback(async () => {
    if (!canvasRef.current || !editorCanvasRef.current || !dimensions?.canvas || isRenderingRef.current) return;

    isRenderingRef.current = true;
    const abortController = new AbortController();
    
    // 使用 debounce 避免頻繁渲染
    const debounceTimeout = setTimeout(async () => {
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
        offscreenCanvasRef.current.width = dimensions.canvas.width;
        offscreenCanvasRef.current.height = dimensions.canvas.height;
      }
      
      const offscreenCtx = offscreenCanvasRef.current.getContext('2d', {
        alpha: false,  // 禁用 alpha 以提升效能
        willReadFrequently: false  // 告知瀏覽器不會頻繁讀取像素
      });

      if (!offscreenCtx) {
        isRenderingRef.current = false;
        return;
      }

      try {
        // 先填充拍貼邊框顏色
        offscreenCtx.fillStyle = frameColor;
        offscreenCtx.fillRect(0, 0, dimensions.canvas.width, dimensions.canvas.height);

        // 只有在有照片時才繪製照片
        if (loadedImages.length > 0) {
          await Promise.all(
            loadedImages.slice(0, (frameConfig?.gridSize.rows ?? 0) * (frameConfig?.gridSize.cols ?? 0))
              .map(async (imageData, i) => {
                if (abortController.signal.aborted) return;
                
                return new Promise<void>((resolve) => {
                  requestAnimationFrame(async () => {
                    const rowIndex = Math.floor(i / (frameConfig?.gridSize.cols ?? 1));
                    const colIndex = i % (frameConfig?.gridSize.cols ?? 1);
                    
                    const x = dimensions.padding.left + colIndex * (dimensions.photo.width + dimensions.gap.horizontal);
                    const y = dimensions.padding.top + rowIndex * (dimensions.photo.height + dimensions.gap.vertical);

                    const shouldFlipHori = (!isMobileDevice && imageData.facingMode === 'user') || (isMobileDevice && imageData.facingMode === 'user');

                    await processPhoto({ ctx: offscreenCtx, imageData, x, y, shouldFlipHori });
                    resolve();
                  });
                });
              })
          );
        }

        // 在照片繪製完成後，將結果複製到主畫布
        const ctx = canvasRef?.current?.getContext('2d', {
          alpha: false,
          willReadFrequently: false
        });
        
        if (ctx) {
          requestAnimationFrame(() => {
            if (abortController.signal.aborted) return;
            canvasRef.current!.width = dimensions.canvas.width;
            canvasRef.current!.height = dimensions.canvas.height;
            ctx.drawImage(offscreenCanvasRef.current!, 0, 0);
          });
        }

        const editorCtx = editorCanvasRef.current?.getContext('2d');
        if (editorCtx && editorCanvasRef.current !== null) {
          requestAnimationFrame(() => {
            if (abortController.signal.aborted) return;
            editorCanvasRef.current!.width = dimensions.canvas.width;
            editorCanvasRef.current!.height = dimensions.canvas.height;
            renderCustomText(editorCtx);
            renderDateTime(editorCtx);
          });
        }
      } catch (err) {
        setAlert(`Failed to render canvas: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      } finally {
        if (!abortController.signal.aborted) isRenderingRef.current = false;
      }
    }, 16); // 約 60fps 的更新頻率

    return () => {
      clearTimeout(debounceTimeout);
      abortController.abort();
      isRenderingRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, editorCanvasRef, images, loadedImages, dimensions, frameConfig, frameColor, processPhoto, renderCustomText, renderDateTime]);

  useEffect(() => {
    let isMounted = true; // 避免在組件 unmounted 執行 setState
    
    const loadImages = async () => {
      if (images.length === 0) { // 若沒有照片，則清空已加載的照片。
        if (isMounted) setLoadedImages([]);
        return;
      }

      try {
        // 並行載入所有照片
        const loaded = await Promise.all(
          images.map((image) => 
            new Promise<LoadedImage>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve({ img, facingMode: image.facingMode });
              img.onerror = () => reject(new Error(`Failed to load image: ${image.url}`));
              img.src = image.url;
            })
          )
        );
        
        // 確保組件 mounted 才更新狀態，避免非同步更新。
        if (isMounted) setLoadedImages(loaded);
      } catch (err) {
        setAlert(`Failed to load images: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      }
    };

    loadImages();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, setLoadedImages]);

  // 當拍貼畫布及尺寸設定有效，渲染照片到畫布上。
  useEffect(() => {
    if (!canvasRef.current || !dimensions || !fontLoaded) return;

    renderCanvas(); // 更新畫布

    return () => {
      if (isRenderingRef.current) isRenderingRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, fontLoaded, customTextConfig, dateFormat, timeFormat, frameColor, renderCanvas]);

  const canvasContainerStyle = useMemo(() => ({
    width: dimensions?.canvas ? `${dimensions.canvas.width * 0.25}px` : 'auto',
    height: dimensions?.canvas ? `${dimensions.canvas.height * 0.25}px` : 'auto',
    position: 'relative' as const
  }), [dimensions?.canvas]);

  if (!dimensions) return null;

  return (
    <div className="flex flex-col items-center shadow-md" style={canvasContainerStyle}>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" aria-label="Photo strip" />
      <canvas ref={editorCanvasRef} className="absolute top-0 left-0 w-full h-full" aria-label="Editor overlay" style={{ zIndex: 1 }} />
    </div>
  );
});

export default PhotoStrip;
