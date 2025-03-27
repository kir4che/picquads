import vertical11 from '../assets/images/vertical-1:1.png';
import vertical21 from '../assets/images/vertical-2:1.png';
import vertical22 from '../assets/images/vertical-2:2.png';
import vertical32 from '../assets/images/vertical-3:1.png';
import vertical41 from '../assets/images/vertical-4:1.png';
import vertical42 from '../assets/images/vertical-4:2.png';

export interface Frame {
  id: string;
  name: string;
  totalCaptures: number;
}

export interface FrameConfig {
  id: string;
  name: string;
  totalCaptures: number;
  gridSize: {
    rows: number;
    cols: number;
  };
  dimensions: {
    canvas: { width: number; height: number };
    photo: { width: number; height: number };
    padding: { top: number; bottom: number; left: number; right: number };
    gap: { vertical: number; horizontal: number };
    datetime?: {
      x: number;
      y: number;
      align: 'left' | 'center' | 'right';
    };
  };
}

const SCALE_FACTOR = 6;

const toPx = (mm: number) => mm * SCALE_FACTOR * 3.779528; // mm -> px 轉換

export const frameConfigs: Record<string, FrameConfig> = {
  'vertical-1/1': {
    id: 'vertical-1/1',
    name: '一宮格直式',
    totalCaptures: 1,
    gridSize: { rows: 1, cols: 1 },
    dimensions: {
      canvas: { width: toPx(50.5), height: toPx(76) },
      photo: { width: toPx(44), height: toPx(56) },
      padding: {
        top: toPx(4.25),
        bottom: 0,
        left: toPx((50.5 - 44) / 2),
        right: toPx((50.5 - 44) / 2)
      },
      gap: {
        vertical: 0,
        horizontal: 0
      },
      datetime: {
        x: toPx(50.5-(50.5 - 44) / 2),
        y: toPx(76 - 4.25) + 24,
        align: 'right'
      }
    }
  },
  'vertical-2/1': {
    id: 'vertical-2/1',
    name: '二宮格直式',
    totalCaptures: 2,
    gridSize: { rows: 2, cols: 1 },
    dimensions: {
      canvas: { width: toPx(50.5), height: toPx(76) },
      photo: { width: toPx(44), height: toPx(32) },
      padding: {
        top: toPx((76 - 32 * 2) / 2),
        bottom: 0,
        left: toPx((50.5 - 44) / 2),
        right: toPx((50.5 - 44) / 2)
      },
      gap: {
        vertical: toPx(1.125),
        horizontal: 0
      },
      datetime: {
        x: toPx(50.5-(50.5 - 44) / 2),
        y: toPx(74.5),
        align: 'right'
      }
    }
  },
  'vertical-4/1': {
    id: 'vertical-4/1',
    name: '四宮格直式',
    totalCaptures: 4,
    gridSize: { rows: 4, cols: 1 },
    dimensions: {
      canvas: { width: toPx(50.5), height: toPx(152) },
      photo: { width: toPx(44.5), height: toPx(29.8) },
      padding: {
        top: toPx(4.25),
        bottom: 0,
        left: toPx((50.5 - 44.5) / 2),
        right: toPx((50.5 - 44.5) / 2)
      },
      gap: {
        vertical: toPx(1.875),
        horizontal: 0
      },
      datetime: {
        x: toPx(50.5-(50.5 - 44) / 2),
        y: toPx(152 - 4.25) + 24,
        align: 'right'
      }
    }
  },
  'vertical-2/2': {
    id: 'vertical-2/2',
    name: '四宮格直式',
    totalCaptures: 4,
    gridSize: { rows: 2, cols: 2 },
    dimensions: { 
      canvas: { width: toPx(111.47), height: toPx(152) },
      photo: { width: toPx(49), height: toPx(62) },
      padding: {
        top: toPx(6.25),
        bottom: 0,
        left: toPx(5.5),
        right: toPx(5.5)
      },
      gap: {
        vertical: toPx(2.25),
        horizontal: toPx(2.5)
      },
      datetime: {
        x: toPx(111.47 - 5.5),
        y: toPx(152 - 6.25) + 24,
        align: 'right'
      }
    }
  },
  'vertical-3/2': {
    id: 'vertical-3/2',
    name: '六宮格直式',
    totalCaptures: 6,
    gridSize: { rows: 3, cols: 2 },
    dimensions: {
      canvas: { width: toPx(97.69), height: toPx(152) },
      photo: { width: toPx(40.5), height: toPx(39.5) },
      padding: {
        top: toPx(5),
        bottom: 0,
        left: toPx(6.7),
        right: toPx(6.7)
      },
      gap: {
        vertical: toPx(1.5),
        horizontal: toPx(2.25)
      },
      datetime: {
        x: toPx(97.69 - 6.7),
        y: toPx(152 - 5) + 24,
        align: 'right'
      }
    }
  },
  'vertical-4/2': {
    id: 'vertical-4/2',
    name: '八宮格直式',
    totalCaptures: 8,
    gridSize: { rows: 4, cols: 2 },
    dimensions: {
      canvas: { width: toPx(100.42), height: toPx(152) },
      photo: { width: toPx(44.5), height: toPx(29.8) },
      padding: {
        top: toPx(5),
        bottom: 0,
        left: toPx(4.5),
        right: toPx(4.5)
      },
      gap: {
        vertical: toPx(1.25),
        horizontal: toPx(1.875)
      },
      datetime: {
        x: toPx(100.42 - 4.5),
        y: toPx(152 - 5) + 24,
        align: 'right'
      }
    }
  },
};

export const frameMap: Record<string, string> = {
  'vertical-1/1': vertical11,
  'vertical-2/1': vertical21,
  'vertical-4/1': vertical41,
  'vertical-2/2': vertical22,
  'vertical-3/2': vertical32,
  'vertical-4/2': vertical42,
};
