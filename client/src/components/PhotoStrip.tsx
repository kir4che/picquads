import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import { FilterType, filterPreset } from '../configs/filter';
import { useError } from '../hooks/useError';
import { useCamera } from '../hooks/useCamera';
import { getFrameConfig, getFrameDimensions } from '../utils/frame';
import { applyFilter } from '../utils/caman';

interface PhotoStripProps {
  borderColor: string;
  filter: FilterType;
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
  shouldFlipHorizontally: boolean;
}

const PhotoStrip: React.FC<PhotoStripProps> = React.memo(({ borderColor, filter }) => {
  const { setErrorMessage } = useError();
  const { state, canvasRef } = useCamera();
  const { frame, isMobileDevice, capturedImages: images } = state;

  const isRenderingRef = useRef(false); // 避免不必要的 re-render

  const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([]); // 儲存已載入的照片

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
  const processPhoto = useCallback(async ({
    ctx,
    imageData,
    x,
    y,
    shouldFlipHorizontally
  }: RenderPhotoProps): Promise<void> => {
    if (!dimensions?.photo) {
      setErrorMessage('無法取得照片尺寸');
      return;
    }

    const { width: targetWidth, height: targetHeight } = dimensions.photo;
    const { img } = imageData;
    
    const imageDimensions = calculateImageDimensions(img.width, img.height, targetWidth, targetHeight);

    // 創建臨時的 Canvas 來繪製照片
    const photoCanvas = createTempCanvas(targetWidth, targetHeight);
    if (!photoCanvas) {
      setErrorMessage('無法創建照片 Canvas');
      return;
    }

    // 取得照片的 Canvas Rendering Context 以進行繪圖操作
    const photoCtx = photoCanvas.getContext('2d');
    if (!photoCtx) {
      setErrorMessage('無法取得照片');
      return;
    }

    photoCtx.save(); // 儲存當前初始狀態，以便後續可以恢復。

    // 若需要水平翻轉圖片
    if (shouldFlipHorizontally) {
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
      setErrorMessage('無法創建濾鏡 Canvas');
      return;
    }

    const filterCtx = filterCanvas.getContext('2d');
    if (!filterCtx) {
      setErrorMessage('無法取得濾鏡');
      return;
    }

    filterCtx.drawImage(photoCanvas, 0, 0); // 將以處理的照片繪製到濾鏡 Canvas 上

    try {
      await applyFilter(filterCanvas, filterPreset[filter]()); // 套用濾鏡
      ctx.drawImage(filterCanvas, x, y); // 繪製濾鏡後的照片到主 Canvas
    } catch (err) {
      setErrorMessage(`應用濾鏡失敗: ${err instanceof Error ? err.message : '未知錯誤'}`);
      ctx.drawImage(photoCanvas, x, y); // 若濾鏡套用失敗，則繪製未處理的照片到主 Canvas。
    }
  }, [dimensions?.photo, filter, calculateImageDimensions, setErrorMessage, createTempCanvas]);

  // 渲染照片到整個拍貼畫布
  const renderCanvas = useCallback(async () => {
    if (!canvasRef.current || !dimensions?.canvas || loadedImages.length === 0 || isRenderingRef.current) return;

    isRenderingRef.current = true;
    const abortController = new AbortController();
    const ctx = canvasRef.current.getContext('2d');
    
    if (!ctx) {
      isRenderingRef.current = false;
      return;
    }

    try {
      canvasRef.current.width = dimensions.canvas.width;
      canvasRef.current.height = dimensions.canvas.height;
      ctx.fillStyle = borderColor;
      ctx.fillRect(0, 0, dimensions.canvas.width, dimensions.canvas.height);

      // 將照片按拍攝順序排序
      const sortedImages = [...loadedImages].sort((a, b) => {
        const imageA = images.find(img => img.facingMode === a.facingMode);
        const imageB = images.find(img => img.facingMode === b.facingMode);
        return (imageA?.timestamp ?? 0) - (imageB?.timestamp ?? 0);
      });

      // 依行列數計算最多可以顯示的照片數量
      const maxImages = (frameConfig?.gridSize.rows ?? 0) * (frameConfig?.gridSize.cols ?? 0);
      
      // 依序繪製照片
      await Promise.all(
        sortedImages.slice(0, maxImages).map(async (imageData, i) => {
          if (abortController.signal.aborted) return;
          
          const rowIndex = Math.floor(i / (frameConfig?.gridSize.cols ?? 1));
          const colIndex = i % (frameConfig?.gridSize.cols ?? 1);
          
          const x = dimensions.padding.left + colIndex * (dimensions.photo.width + dimensions.gap.horizontal);
          const y = dimensions.padding.top + rowIndex * (dimensions.photo.height + dimensions.gap.vertical);

          const shouldFlipHorizontally = (!isMobileDevice && imageData.facingMode === 'user') || (isMobileDevice && imageData.facingMode === 'user');

          await processPhoto({ ctx, imageData, x, y, shouldFlipHorizontally });
        })
      );
    } catch (err) {
      setErrorMessage(`渲染畫布時發生錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`);
    } finally {
      if (!abortController.signal.aborted) isRenderingRef.current = false;
    }

    return () => {
      abortController.abort();
      isRenderingRef.current = false;
    };
  }, [loadedImages, dimensions, frameConfig, isMobileDevice, borderColor, processPhoto, images, canvasRef, setErrorMessage]);

  useEffect(() => {
    let isMounted = true; // 避免不必要的 re-render
    
    const loadImages = async () => {
      if (images.length === 0) { // 若沒有照片，則清空已加載的照片。
        if (isMounted) setLoadedImages([]);
        return;
      }

      try {
        // 同時載入所有照片
        const loaded = await Promise.all(
          images.map((image) => 
            new Promise<LoadedImage>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve({ img, facingMode: image.facingMode });
              img.onerror = () => reject(new Error(`圖片載入失敗: ${image.url}`));
              img.src = image.url;
            })
          )
        );
        
        if (isMounted) setLoadedImages(loaded);
      } catch (err) {
        setErrorMessage(`圖片載入過程發生錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`);
      }
    };

    loadImages();
    return () => { isMounted = false; };
  }, [images, setLoadedImages, setErrorMessage]);

  // 當拍貼畫布及尺寸設定有效，渲染照片到畫布上。
  useEffect(() => {
    if (canvasRef.current && dimensions) renderCanvas();
  }, [renderCanvas, dimensions, canvasRef]);

  const canvasContainerStyle = useMemo(() => ({
    width: dimensions?.canvas ? `${dimensions.canvas.width * 0.15}px` : 'auto',
    height: dimensions?.canvas ? `${dimensions.canvas.height * 0.15}px` : 'auto',
    position: 'relative' as const
  }), [dimensions?.canvas]);

  if (!dimensions) return null;

  return (
    <div className="flex flex-col items-center shadow-md" style={canvasContainerStyle}>
      <canvas role="img" ref={canvasRef} className="absolute top-0 left-0 w-full h-full" aria-label="拍貼" />
    </div>
  );
});

export default PhotoStrip;
