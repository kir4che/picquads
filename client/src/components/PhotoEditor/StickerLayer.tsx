import { useRef, useEffect, useCallback } from 'react';
import Moveable, { MoveableManagerInterface, OnRotate } from 'react-moveable';

import { useCamera } from '../../hooks/useCamera';
import { getFrameDimensions } from '../../utils/frame';
import { Sticker } from '../../types/sticker';

interface DeleteAbleProps {
  deleteAble: boolean;
  onDelete: () => void;
}

const DeleteAble = {
  name: 'deleteAble',
  props: ['deleteAble'],
  events: [],
  render(moveable: MoveableManagerInterface<DeleteAbleProps>) {
    if (!moveable.props.deleteAble) return null;

    const { renderPoses } = moveable.state;

    return (
      <button
        key='delete-button'
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => moveable.props.onDelete()}
        className='absolute z-100 flex size-5 -translate-x-1/2 -translate-y-1/2 -translate-z-12 items-center justify-center rounded-full bg-red-500 text-sm text-white'
        style={{
          transform: `translate(${renderPoses[1][0]}px, ${
            renderPoses[1][1]
          }px)`,
        }}
      >
        ✕
      </button>
    );
  },
};

// 判斷貼圖是否被完全拖曳出照片的邊界之外
const isEntirelyOutside = (
  s: { x: number; y: number; width: number; height: number; rotation: number },
  photoW: number,
  photoH: number
): boolean => {
  const θ = (s.rotation * Math.PI) / 180;
  const cx = s.x + s.width / 2;
  const cy = s.y + s.height / 2;
  const halfW =
    (s.width * Math.abs(Math.cos(θ)) + s.height * Math.abs(Math.sin(θ))) / 2;
  const halfH =
    (s.height * Math.abs(Math.cos(θ)) + s.width * Math.abs(Math.sin(θ))) / 2;
  return (
    cx + halfW < 0 ||
    cx - halfW > photoW ||
    cy + halfH < 0 ||
    cy - halfH > photoH
  );
};

interface StickerLayerProps {
  stickers: Sticker[];
  selectedStickerId: string | null;
  activeStickerSrc: string | null;
  onAddSticker: (sticker: Sticker) => void;
  onUpdateSticker: (
    id: string,
    updates: Partial<Pick<Sticker, 'x' | 'y' | 'width' | 'height' | 'rotation'>>
  ) => void;
  onSelectSticker: (id: string) => void;
  onRemoveSticker: (id: string) => void;
  onClearSelection: () => void;
  displayWidth: number;
  displayHeight: number;
}

const StickerLayer = ({
  stickers,
  selectedStickerId,
  activeStickerSrc,
  onAddSticker,
  onUpdateSticker,
  onSelectSticker,
  onRemoveSticker,
  onClearSelection,
  displayWidth,
  displayHeight,
}: StickerLayerProps) => {
  const { stickerCanvasRef, state } = useCamera();
  const imgRefs = useRef<Map<string, HTMLImageElement | null>>(new Map());

  // 在組件初次載入時，將隱藏的 stickerCanvasRef 設定為畫面的完整解析度。
  useEffect(() => {
    const canvas = stickerCanvasRef.current;
    if (!canvas || !state.frame.id) return;
    const dims = getFrameDimensions(state.frame.id);
    if (!dims) return;
    canvas.width = dims.canvas.width;
    canvas.height = dims.canvas.height;
  }, [stickerCanvasRef, state.frame.id]);

  // 將目前的貼圖狀態同步畫到隱藏畫布 (stickerCanvasRef) 上，這樣使用者點擊下載時，就能直接拿這個畫布跟照片進行圖層合成。
  useEffect(() => {
    const canvas = stickerCanvasRef.current;
    if (!canvas || !displayWidth) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = canvas.width / displayWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stickers.forEach((s) => {
      const img = imgRefs.current.get(s.id);
      if (!img) return;
      const cx = (s.x + s.width / 2) * scale;
      const cy = (s.y + s.height / 2) * scale;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.drawImage(
        img,
        (-s.width / 2) * scale,
        (-s.height / 2) * scale,
        s.width * scale,
        s.height * scale
      );
      ctx.restore();
    });
  }, [stickers, stickerCanvasRef, displayWidth]);

  // 當使用者在貼圖圖層上點擊時，如果有選擇中的貼圖，就會新增一個貼圖到該位置；沒有則清除目前的選取狀態。
  const handleLayerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (activeStickerSrc) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const img = new Image();
        img.src = activeStickerSrc;
        img.onload = () => {
          const w = 80;
          const h = 80 * (img.naturalHeight / img.naturalWidth);
          onAddSticker({
            id: crypto.randomUUID(),
            src: activeStickerSrc,
            x: x - w / 2,
            y: y - h / 2,
            width: w,
            height: h,
            rotation: 0,
          });
        };
      } else onClearSelection();
    },
    [activeStickerSrc, onAddSticker, onClearSelection]
  );

  const selectedTarget = selectedStickerId
    ? (imgRefs.current.get(selectedStickerId) ?? null)
    : null;

  const selectedSticker = stickers.find((s) => s.id === selectedStickerId);

  return (
    <div
      className='absolute top-0 left-0 z-2 touch-none'
      style={{ width: displayWidth, height: displayHeight }}
    >
      <div
        className='absolute top-0 left-0 size-full overflow-hidden'
        onClick={handleLayerClick}
        style={{ cursor: activeStickerSrc ? 'crosshair' : 'default' }}
      >
        {stickers.map((s) => (
          <img
            key={s.id}
            ref={(el) => {
              if (el) imgRefs.current.set(s.id, el);
              else imgRefs.current.delete(s.id);
            }}
            src={s.src}
            alt='sticker'
            className='absolute origin-center cursor-pointer select-none'
            style={{
              left: s.x,
              top: s.y,
              width: s.width,
              height: s.height,
              transform: `rotate(${s.rotation}deg)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSticker(s.id);
            }}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
        ))}
      </div>
      {selectedTarget && selectedSticker && (
        <Moveable
          target={selectedTarget}
          ables={[DeleteAble]}
          props={{
            deleteAble: true,
            onDelete: () => onRemoveSticker(selectedSticker.id),
          }}
          draggable
          resizable
          rotatable
          keepRatio
          onDrag={({ target, left, top }) => {
            target.style.left = `${left}px`;
            target.style.top = `${top}px`;
          }}
          // 拖曳結束後更新貼圖的位置，若發現貼圖已經完全超出照片範圍，就自動刪除該貼圖。
          onDragEnd={({ lastEvent }) => {
            if (!lastEvent || !selectedSticker) return;
            const updates = { x: lastEvent.left, y: lastEvent.top };
            onUpdateSticker(selectedSticker.id, updates);
            if (
              isEntirelyOutside(
                { ...selectedSticker, ...updates },
                displayWidth,
                displayHeight
              )
            )
              onRemoveSticker(selectedSticker.id);
          }}
          onResize={({ target, width, height, drag }) => {
            target.style.width = `${width}px`;
            target.style.height = `${height}px`;
            target.style.left = `${drag.left}px`;
            target.style.top = `${drag.top}px`;
          }}
          onResizeEnd={({ lastEvent }) => {
            if (!lastEvent || !selectedSticker) return;
            const updates = {
              width: lastEvent.width,
              height: lastEvent.height,
              x: lastEvent.drag.left,
              y: lastEvent.drag.top,
            };
            onUpdateSticker(selectedSticker.id, updates);
            if (
              isEntirelyOutside(
                { ...selectedSticker, ...updates },
                displayWidth,
                displayHeight
              )
            )
              onRemoveSticker(selectedSticker.id);
          }}
          onRotate={({ target, transform }) => {
            target.style.transform = transform;
          }}
          onRotateEnd={({ lastEvent }) => {
            if (!lastEvent || !selectedSticker) return;
            onUpdateSticker(selectedSticker.id, {
              rotation: (lastEvent as OnRotate).rotation,
            });
          }}
        />
      )}
    </div>
  );
};

export default StickerLayer;
