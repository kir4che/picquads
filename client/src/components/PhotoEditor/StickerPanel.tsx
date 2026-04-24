import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import stickersJson from '../../assets/stickers/json/stickers.json';
import { StickerMeta } from '../../types/sticker';
import PaginationBtn from '../PaginationBtn';
import StickerItem from './StickerItem';

const PAGE_SIZE = 15;

const stickerImages = import.meta.glob('../../assets/stickers/png/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const getStickerSrc = (id: string): string => {
  const key = `../../assets/stickers/png/${id}.png`;
  return stickerImages[key] ?? '';
};

const stickers = stickersJson as StickerMeta[];
const categories = [
  'all',
  ...Array.from(new Set(stickers.map((s) => s.category))),
];

interface StickerPanelProps {
  activeStickerSrc: string | null;
  onSelect: (src: string | null) => void;
}

const StickerPanel = ({ activeStickerSrc, onSelect }: StickerPanelProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [isStickerPanelExpanded, setIsStickerPanelExpanded] = useState(true);

  const filtered = useMemo(
    () =>
      activeCategory === 'all'
        ? stickers
        : stickers.filter((s) => s.category === activeCategory),
    [activeCategory]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(0);
  }, [activeCategory]);

  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className='w-full'>
      <button
        onClick={() => setIsStickerPanelExpanded((prev) => !prev)}
        className='flex w-full items-center justify-between border-b border-violet-700 py-2 text-xs text-gray-600 focus:outline-none'
        aria-expanded={isStickerPanelExpanded}
        aria-label='Sticker panel settings'
      >
        Stickers
        <ChevronDown
          size={20}
          className={`transition-transform duration-300 ${
            isStickerPanelExpanded ? 'rotate-180 transform' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isStickerPanelExpanded ? 'max-h-250' : 'max-h-0'}`}
      >
        <div className='space-y-2.5 pt-4'>
          <div className='flex flex-wrap gap-x-1.5 gap-y-1'>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-2.5 py-px text-[13px] capitalize transition-all ${
                  activeCategory === cat
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-black'
                }`}
                aria-current={activeCategory === cat ? 'page' : undefined}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className='grid grid-cols-5 gap-1 overflow-hidden rounded-md bg-white p-2'>
            {visible.map((meta) => {
              const src = getStickerSrc(meta.id);
              return (
                <StickerItem
                  key={meta.id}
                  src={src}
                  label={meta.label}
                  isActive={activeStickerSrc === src}
                  onClick={() =>
                    onSelect(activeStickerSrc === src ? null : src)
                  }
                />
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-x-2'>
              <PaginationBtn
                icon={<ChevronLeft size={16} />}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                ariaLabel='Previous sticker page'
              />
              <p className='text-xs' aria-live='polite'>
                {page + 1} / {totalPages}
              </p>
              <PaginationBtn
                icon={<ChevronRight size={16} />}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                ariaLabel='Next sticker page'
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickerPanel;
