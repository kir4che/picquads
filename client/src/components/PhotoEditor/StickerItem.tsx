interface StickerItemProps {
  src: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const StickerItem = ({ src, label, isActive, onClick }: StickerItemProps) => (
  <button
    onClick={onClick}
    onContextMenu={(e) => e.preventDefault()}
    className={`rounded-lg border-2 p-1 transition-all select-none ${
      isActive
        ? 'border-violet-600 bg-violet-50'
        : 'border-transparent hover:border-gray-300'
    }`}
    aria-label={label}
    aria-pressed={isActive}
  >
    <img
      src={src}
      alt={label}
      draggable={false}
      className='pointer-events-none size-12 object-contain'
    />
  </button>
);

export default StickerItem;
