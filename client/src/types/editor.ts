export interface CustomTextConfig {
  text: string;
  font: string;
  position: { x: number; y: number };
  color: string;
  size: number;
}

export const availableFonts = [
  { id: 'PlayfairDisplay', label: 'Playfair Display' },
  { id: 'KingSans', label: 'King Sans' },
  { id: 'Singlong', label: 'Singlong' },
  { id: 'Spectral', label: 'Spectral' },
  { id: 'DigitalDream', label: 'Digital Dream' },
  { id: 'ChenYuluoyan', label: '辰宇落雁體' },
  { id: 'GenRyuMin2', label: '源流明體月' },
  { id: 'SourceHanSerifTC', label: '思源宋體' },
  { id: 'Naikai', label: '内海フォント' },
];
