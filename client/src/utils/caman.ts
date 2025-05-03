export type FilterParams = {
  brightness?: number; // 亮度（-100 ~ 100）
  channels?: {
    // RGB（-100 ~ 100）
    red?: number;
    green?: number;
    blue?: number;
  };
  colorize?: {
    // 顏色（0 ~ 100）
    color: [number, number, number] | string;
    strength: number;
  };
  contrast?: number; // 對比（-100 ~ 100）
  exposure?: number; // 曝光（-100 ~ 100）
  gamma?: number; // 伽瑪值（> 1 增加對比）
  greyscale?: boolean; // 灰階
  hue?: number; // 色相（0 ~ 100）
  noise?: number; // 雜訊（0 ~ 100）
  saturation?: number; // 飽和度（-100 ~ 100）
  sepia?: number; // 褐色（0 ~ 100）
  vibrance?: number; // 鮮豔（-100 ~ 100）
  vignette?: number; // 暗角（0 ~ 100）
  sharpen?: number; // 銳化（0 ~ 100）
  shadows?: number; // 陰影（-100 ~ 100）
  highlights?: number; // 高光（-100 ~ 100）
  temperature?: number; // 色溫（-100 ~ 100）
};

interface CamanInstance {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  brightness: (value: number) => void;
  channels: (channels: { red?: number; green?: number; blue?: number }) => void;
  colorize: (r: number, g: number, b: number, strength: number) => void;
  contrast: (value: number) => void;
  exposure: (value: number) => void;
  gamma: (value: number) => void;
  greyscale: () => void;
  noise: (value: number) => void;
  saturation: (value: number) => void;
  sepia: (value: number) => void;
  vibrance: (value: number) => void;
  vignette: (value: number) => void;
  sharpen: (value: number) => void;
  shadows: (value: number) => void;
  highlights: (value: number) => void;
  temperature: (value: number) => void;
  revert: (updateContext?: boolean) => void;
  render: (callback: () => void) => void;
}

interface CamanFilterContext {
  imageData: ImageData;
  pixelData: Uint8ClampedArray;
  dimensions: {
    width: number;
    height: number;
  };
}

// 全域定義 Caman
declare global {
  interface Window {
    Caman: {
      (
        canvas: HTMLCanvasElement,
        callback: (this: CamanInstance) => void
      ): void;
      Filter: {
        register: (name: string, fn: (value: number) => void) => void;
      };
    };
  }
}

// 檢查 CamanJS 是否已載入
const isCamanLoaded = () => typeof window.Caman === 'function';

// 等待 CamanJS 載入（最多等待 5 秒）
const waitForCaman = async (): Promise<void> => {
  if (isCamanLoaded()) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    await new Promise<void>((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (isCamanLoaded()) {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          resolve();
        }
      }, 200);

      controller.signal.addEventListener('abort', () => {
        clearInterval(checkInterval);
        reject(new Error('CamanJS 載入超時'));
      });
    });
  } catch (error) {
    clearTimeout(timeoutId);
    throw error instanceof Error ? error : new Error('CamanJS 載入失敗');
  }
};

window.Caman.Filter.register(
  'sharpen',
  function (this: CamanFilterContext, value: number) {
    const pixelInfo = this.pixelData;
    const width = this.dimensions.width;
    const height = this.dimensions.height;

    // 將 value 轉為 0 - 1.5 範圍
    const strength = Math.max(0, Math.min(1.5, value / 50));

    // 用拉普拉斯算子進行銳化（卷積核心）
    const kernel = new Float32Array([-1, -1, -1, -1, 9, -1, -1, -1, -1]);

    // 創建臨時數據來存儲結果
    const tempData = new Uint8ClampedArray(pixelInfo);
    const size = 3;
    const halfSize = Math.floor(size / 2);

    // 預先計算混合係數
    const mix = strength;
    const invMix = 1 - mix;

    // 使用 Int32Array 來加速計算
    const r = new Int32Array(1);
    const g = new Int32Array(1);
    const b = new Int32Array(1);

    // 遍歷每個像素進行銳化
    for (let y = halfSize; y < height - halfSize; y++) {
      for (let x = halfSize; x < width - halfSize; x++) {
        const idx = (y * width + x) * 4;
        r[0] = g[0] = b[0] = 0;

        // 使用展開的循環來減少迭代開銷
        let kernelIndex = 0;
        for (let ky = -halfSize; ky <= halfSize; ky++) {
          const sourceY = y + ky;
          for (let kx = -halfSize; kx <= halfSize; kx++) {
            const sourceX = x + kx;
            const sourceIdx = (sourceY * width + sourceX) * 4;
            const weight = kernel[kernelIndex++];

            r[0] += tempData[sourceIdx] * weight;
            g[0] += tempData[sourceIdx + 1] * weight;
            b[0] += tempData[sourceIdx + 2] * weight;
          }
        }

        // 混合原始像素和銳化結果
        pixelInfo[idx] = Math.min(
          255,
          Math.max(0, tempData[idx] * invMix + r[0] * mix)
        );
        pixelInfo[idx + 1] = Math.min(
          255,
          Math.max(0, tempData[idx + 1] * invMix + g[0] * mix)
        );
        pixelInfo[idx + 2] = Math.min(
          255,
          Math.max(0, tempData[idx + 2] * invMix + b[0] * mix)
        );
      }
    }

    return this;
  }
);

window.Caman.Filter.register(
  'shadows',
  function (this: CamanFilterContext, value: number) {
    const pixelInfo = this.pixelData;

    // 將 value 轉為 0 - 1 範圍
    const strength = Math.max(0, Math.min(1, Math.abs(value) / 100));

    for (let i = 0; i < pixelInfo.length; i += 4) {
      // 計算每個像素的亮度
      const brightness =
        (pixelInfo[i] + pixelInfo[i + 1] + pixelInfo[i + 2]) / 3;

      // 只對亮度較低的像素進行陰影調整
      if (brightness < 128) {
        const factor =
          value > 0
            ? 1 + strength * (1 - brightness / 128) // 增加陰影
            : 1 - strength * (1 - brightness / 128); // 減少陰影

        pixelInfo[i] = Math.min(255, Math.max(0, pixelInfo[i] * factor));
        pixelInfo[i + 1] = Math.min(
          255,
          Math.max(0, pixelInfo[i + 1] * factor)
        );
        pixelInfo[i + 2] = Math.min(
          255,
          Math.max(0, pixelInfo[i + 2] * factor)
        );
      }
    }

    return this;
  }
);

window.Caman.Filter.register(
  'highlights',
  function (this: CamanFilterContext, value: number) {
    const pixelInfo = this.pixelData;

    const strength = Math.max(0, Math.min(1, Math.abs(value) / 100));

    for (let i = 0; i < pixelInfo.length; i += 4) {
      // 計算每個像素的亮度
      const brightness =
        (pixelInfo[i] + pixelInfo[i + 1] + pixelInfo[i + 2]) / 3;

      // 只對亮度較高的像素進行高光調整
      if (brightness > 128) {
        const factor =
          value > 0
            ? 1 + strength * (brightness / 128 - 1)
            : 1 - strength * (brightness / 128 - 1);

        pixelInfo[i] = Math.min(255, Math.max(0, pixelInfo[i] * factor));
        pixelInfo[i + 1] = Math.min(
          255,
          Math.max(0, pixelInfo[i + 1] * factor)
        );
        pixelInfo[i + 2] = Math.min(
          255,
          Math.max(0, pixelInfo[i + 2] * factor)
        );
      }
    }

    return this;
  }
);

window.Caman.Filter.register(
  'temperature',
  function (this: CamanFilterContext, value: number) {
    const pixelInfo = this.pixelData;
    const strength = Math.max(-1, Math.min(1, value / 100));

    for (let i = 0; i < pixelInfo.length; i += 4) {
      if (strength > 0) {
        // 暖色調（增加紅色，減少藍色）
        pixelInfo[i] = Math.min(255, pixelInfo[i] + 255 * strength * 0.5);
        pixelInfo[i + 2] = Math.max(0, pixelInfo[i + 2] - 255 * strength * 0.3);
      } else {
        // 冷色調（減少紅色，增加藍色）
        pixelInfo[i] = Math.max(0, pixelInfo[i] + 255 * strength * 0.3);
        pixelInfo[i + 2] = Math.min(
          255,
          pixelInfo[i + 2] - 255 * strength * 0.5
        );
      }
    }

    return this;
  }
);

// 套用 Filter 到 Canvas
export const applyFilter = async (
  canvas: HTMLCanvasElement,
  params: FilterParams
): Promise<void> => {
  if (!canvas || !(canvas instanceof HTMLCanvasElement))
    throw new TypeError('無效的 Canvas 元素');
  if (!canvas.width || !canvas.height) throw new Error('Canvas 尺寸無效');
  if (!params || typeof params !== 'object')
    throw new TypeError('無效的濾鏡參數');

  try {
    await waitForCaman();

    return new Promise<void>((resolve, reject) => {
      requestAnimationFrame(() => {
        window.Caman(canvas, function (this: CamanInstance) {
          try {
            // 重置先前的效果
            this.revert(false);

            const {
              brightness,
              contrast,
              exposure,
              vibrance,
              saturation,
              sepia,
              gamma,
              noise,
              vignette,
              greyscale,
              channels,
              colorize,
              sharpen,
              shadows,
              highlights,
              temperature,
            } = params;

            if (brightness != null) this.brightness(brightness);
            if (channels) this.channels(channels);
            if (contrast != null) this.contrast(contrast);
            if (exposure != null) this.exposure(exposure);
            if (vibrance != null) this.vibrance(vibrance);
            if (saturation != null) this.saturation(saturation);
            if (sepia != null) this.sepia(sepia);
            if (gamma != null) this.gamma(gamma);
            if (noise != null) this.noise(noise);
            if (vignette != null) this.vignette(vignette);
            if (greyscale) this.greyscale();

            // 處理色彩化效果
            if (colorize?.color && Array.isArray(colorize.color)) {
              const [r, g, b] = colorize.color;
              this.colorize(r, g, b, colorize.strength);
            }

            // 處理自定義濾鏡
            if (sharpen != null) this.sharpen(sharpen);
            if (shadows != null) this.shadows(shadows);
            if (highlights != null) this.highlights(highlights);
            if (temperature != null) this.temperature(temperature);

            // 渲染所有效果
            this.render(resolve);
          } catch (err) {
            reject(err instanceof Error ? err : new Error('濾鏡處理失敗'));
          }
        });
      });
    });
  } catch (err) {
    throw err instanceof Error ? err : new Error('濾鏡處理失敗');
  }
};
