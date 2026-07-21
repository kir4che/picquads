import { useRef, useCallback, useState, useEffect } from 'react';
import Moveable, { MoveableManagerInterface, OnRotate } from 'react-moveable';
import { X } from 'lucide-react';

import { CustomTextConfig } from '../../types/editor';
import { FrameConfig } from '../../configs/frame';

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
        className='absolute z-50 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-sm text-white'
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

interface CustomTextOverlayProps {
  customTextConfig: CustomTextConfig;
  setCustomTextConfig: React.Dispatch<React.SetStateAction<CustomTextConfig>>;
  dimensions: FrameConfig['dimensions'] | null;
  displayWidth: number;
  displayHeight: number;
}

const CustomTextOverlay = ({
  customTextConfig,
  setCustomTextConfig,
  dimensions,
  displayWidth,
  displayHeight,
}: CustomTextOverlayProps) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isSelected, setIsSelected] = useState(false);

  const handleDelete = useCallback(() => {
    setCustomTextConfig((prev) => ({ ...prev, text: '' }));
  }, [setCustomTextConfig]);

  useEffect(() => {
    if (!isSelected) return;

    // 點擊畫布其他地方取消選取
    const handlePointerDown = (e: PointerEvent) => {
      if (targetRef.current?.contains(e.target as Node)) return;
      if (
        e.target instanceof Element &&
        e.target.closest('[class*="moveable-"]')
      )
        return;
      setIsSelected(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isSelected]);

  if (!dimensions?.canvas || !customTextConfig.text) return null;
  if (displayWidth === 0 || displayHeight === 0) return null;

  const scaleX = displayWidth / dimensions.canvas.width;
  const scaleY = displayHeight / dimensions.canvas.height;

  // canvas 座標 → display px
  const canvasX = dimensions.padding.left + customTextConfig.position.x;
  const canvasY =
    dimensions.canvas.height -
    dimensions.padding.top -
    customTextConfig.position.y;

  const displayX = canvasX * scaleX;
  const displayY = canvasY * scaleY;
  const displayFontSize = customTextConfig.size * scaleY;
  const displayRotation = customTextConfig.rotation;

  return (
    <>
      <div
        ref={targetRef}
        className='pointer-events-auto absolute select-none'
        onMouseDown={() => setIsSelected(true)}
        style={{
          left: displayX,
          top: displayY,
          fontSize: `${displayFontSize}px`,
          fontFamily: `"${customTextConfig.font}", sans-serif`,
          color: 'transparent',
          whiteSpace: 'nowrap',
          lineHeight: 1,
          zIndex: 3,
          transform: `rotate(${displayRotation}deg)`,
        }}
      >
        {customTextConfig.text}
      </div>
      {isSelected && (
        <Moveable
          target={targetRef}
          zIndex={3}
          ables={[DeleteAble]}
          props={{
            deleteAble: true,
            onDelete: handleDelete,
          }}
          draggable
          resizable
          keepRatio
          rotatable
          onDrag={({ target, left, top }) => {
            target.style.left = `${left}px`;
            target.style.top = `${top}px`;
          }}
          onDragEnd={({ lastEvent }) => {
            if (!lastEvent) return;
            // display px → canvas 座標
            const canvasXNew = lastEvent.left / scaleX;
            const canvasYNew = lastEvent.top / scaleY;
            setCustomTextConfig((prev) => ({
              ...prev,
              position: {
                x: Math.round(canvasXNew - dimensions.padding.left),
                y: Math.round(
                  dimensions.canvas.height - dimensions.padding.top - canvasYNew
                ),
              },
            }));
          }}
          onResize={({ target, width, height, drag }) => {
            target.style.width = `${width}px`;
            target.style.height = `${height}px`;
            target.style.left = `${drag.left}px`;
            target.style.top = `${drag.top}px`;
          }}
          onRotate={({ target, transform }) => {
            target.style.transform = transform;
          }}
          onRotateEnd={({ lastEvent }) => {
            if (!lastEvent) return;
            const rotation = (lastEvent as OnRotate).rotation;
            setCustomTextConfig((prev) => ({
              ...prev,
              rotation: rotation % 360,
            }));
          }}
          onResizeEnd={({ lastEvent }) => {
            if (!lastEvent) return;
            // 高度變更 → fontSize
            const newFontSize = Math.round(lastEvent.height / scaleY);
            const canvasXNew = lastEvent.drag.left / scaleX;
            const canvasYNew = lastEvent.drag.top / scaleY;
            setCustomTextConfig((prev) => ({
              ...prev,
              size: Math.max(1, newFontSize),
              position: {
                x: Math.round(canvasXNew - dimensions.padding.left),
                y: Math.round(
                  dimensions.canvas.height - dimensions.padding.top - canvasYNew
                ),
              },
            }));
          }}
        />
      )}
    </>
  );
};

export default CustomTextOverlay;
