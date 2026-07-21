import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import stickersJson from '../../assets/stickers/json/stickers.json';
import { StickerMeta } from '../../types/sticker';
import PaginationBtn from '../PaginationBtn';
import CollapsibleSection from './CollapsibleSection';
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
    <CollapsibleSection label='Stickers' ariaLabel='Sticker panel settings'>
      <div className='space-y-2.5'>
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
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className='grid grid-cols-5 grid-rows-[repeat(3,minmax(60px,auto))] gap-1 overflow-hidden rounded-md bg-white p-2'>
          {visible.map((meta) => {
            const src = getStickerSrc(meta.id);
            return (
              <StickerItem
                key={meta.id}
                src={src}
                label={meta.label}
                isActive={activeStickerSrc === src}
                onClick={() => onSelect(activeStickerSrc === src ? null : src)}
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
    </CollapsibleSection>
  );
};

export default StickerPanel;
