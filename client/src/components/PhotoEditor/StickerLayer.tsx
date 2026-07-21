import { useRef, useEffect, useCallback } from 'react';
import Moveable, { MoveableManagerInterface, OnRotate } from 'react-moveable';
import { X } from 'lucide-react';

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
        className='absolute z-50 flex size-5 -translate-x-1/2 -translate-y-1/2 -translate-z-12 items-center justify-center rounded-full bg-red-500 text-sm text-white'
        style={{
          transform: `translate(${renderPoses[1][0]}px, ${
            renderPoses[1][1]
          }px)`,
        }}
      >
        <X size={15} />
      </button>
    );
  },
};

// 判斷貼紙是否完全拖曳出照片的邊界之外
const isEntirelyOutside = (
  s: { x: number; y: number; width: number; height: number; rotation: number },
  photoW: number,
  photoH: number
): boolean => {
  // 中心點在照片內就不算完全超出
  const cx = s.x + s.width / 2;
  const cy = s.y + s.height / 2;
  if (cx >= 0 && cx <= photoW && cy >= 0 && cy <= photoH) return false;

  // 1. 未旋轉 → 直接用軸對齊邊界，完全不用三角函數。
  if (s.rotation === 0)
    return (
      s.x + s.width < 0 || s.x > photoW || s.y + s.height < 0 || s.y > photoH
    );

  // 2. 一般角度 → 計算旋轉後的外接矩形 AABB，判斷是否完全超出邊界。
  const θ = (s.rotation * Math.PI) / 180;
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
  // 設定貼紙 img 的 ref，存入 Map 以 id 為 key，方便 Moveable 操控層取得 DOM 節點。
  const setStickerRef = useCallback(
    (id: string) => (el: HTMLImageElement | null) => {
      if (el) imgRefs.current.set(id, el);
      else imgRefs.current.delete(id);
    },
    []
  );

  // 初次載入時將 off-screen canvas（不在螢幕上顯示的）設為照片完整解析度
  useEffect(() => {
    const canvas = stickerCanvasRef.current;
    if (!canvas || !state.frame.id) return;

    const dims = getFrameDimensions(state.frame.id);
    if (!dims) return;

    canvas.width = dims.canvas.width;
    canvas.height = dims.canvas.height;
  }, [stickerCanvasRef, state.frame.id]);

  // 當 stickers 改變就重繪隱藏畫布，保持跟畫面顯示同步。
  useEffect(() => {
    const canvas = stickerCanvasRef.current;
    if (!canvas || !displayWidth) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = canvas.width / displayWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stickers.forEach((s) => {
      const img = imgRefs.current.get(s.id);
      if (!img || !img.complete) return;
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

  // 點擊圖層時的兩種行為：
  // 1. 有 activeStickerSrc（使用者剛從貼紙面板選了款式）→ 在點擊處建立新貼紙
  // 2. 無 activeStickerSrc → 清除選取（等同點空白處取消選取）
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
            zIndex: 0,
          });
        };
      } else onClearSelection();
    },
    [activeStickerSrc, onAddSticker, onClearSelection]
  );

  // 貼紙拖曳/縮放超出照片邊界時自動刪除（onDragEnd / onResizeEnd 中呼叫），傳入更新後的座標，與 sticker 原本資料合併後交給 isEntirelyOutside 判定。
  const removeIfOutside = useCallback(
    (
      sticker: Sticker,
      updates: Partial<
        Pick<Sticker, 'x' | 'y' | 'width' | 'height' | 'rotation'>
      >
    ) => {
      if (
        isEntirelyOutside(
          { ...sticker, ...updates },
          displayWidth,
          displayHeight
        )
      )
        onRemoveSticker(sticker.id);
    },
    [displayWidth, displayHeight, onRemoveSticker]
  );

  // 從 imgRefs Map 取得選取貼紙的 DOM 元素，作為 Moveable 操控目標。
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
        {[...stickers]
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((s) => (
            <img
              key={s.id}
              ref={setStickerRef(s.id)}
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
            // 拖曳中即時更新 DOM，不寫 state（避免 re-render 卡頓）。
            target.style.left = `${left}px`;
            target.style.top = `${top}px`;
          }}
          onDragEnd={({ lastEvent }) => {
            // 拖曳結束：將最終 left/top 寫入 state，觸發 canvas 重繪。
            if (!lastEvent || !selectedSticker) return;
            const updates = { x: lastEvent.left, y: lastEvent.top };
            onUpdateSticker(selectedSticker.id, updates);
            removeIfOutside(selectedSticker, updates);
          }}
          onResize={({ target, width, height, drag }) => {
            // 縮放即時更新 DOM：width/height 變更 + 拖曳位移補償
            target.style.width = `${width}px`;
            target.style.height = `${height}px`;
            target.style.left = `${drag.left}px`;
            target.style.top = `${drag.top}px`;
          }}
          onResizeEnd={({ lastEvent }) => {
            // 縮放結束：寫入最終寬高與座標到 state
            if (!lastEvent || !selectedSticker) return;
            const updates = {
              width: lastEvent.width,
              height: lastEvent.height,
              x: lastEvent.drag.left,
              y: lastEvent.drag.top,
            };
            onUpdateSticker(selectedSticker.id, updates);
            removeIfOutside(selectedSticker, updates);
          }}
          onRotate={({ target, transform }) => {
            // 旋轉即時更新 DOM：transform 包含旋轉角度 + 位移補償
            target.style.transform = transform;
          }}
          onRotateEnd={({ lastEvent }) => {
            // 旋轉結束：將最終角度寫入 state（以度為單位）
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
