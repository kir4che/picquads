export interface DateTimeFormat {
  id: string;
  label: string;
  format: string;
}

export const dateFormats: DateTimeFormat[] = [
  { id: 'YYYY-MM-DD', label: '2024-01-20', format: 'YYYY-MM-DD' },
  { id: 'YYYY.MM.DD', label: '2024.01.20', format: 'YYYY.MM.DD' },
  { id: 'YYYY/MM/DD', label: '2024/01/20', format: 'YYYY/MM/DD' },
  { id: 'MM/DD/YYYY', label: '01/20/2024', format: 'MM/DD/YYYY' },
  { id: 'DD/MM/YYYY', label: '20/01/2024', format: 'DD/MM/YYYY' },
  { id: 'D MMM YYYY', label: '20 Jan 2024', format: 'D MMM YYYY' },
  { id: 'MMMM D, YYYY', label: 'January 20, 2024', format: 'MMMM D, YYYY' },
  { id: 'none', label: 'None', format: '' }
];

export const timeFormats: DateTimeFormat[] = [
  { id: 'HH:mm:ss', label: '14:30:00', format: 'HH:mm:ss' },
  { id: 'HH:mm', label: '14:30', format: 'HH:mm' },
  { id: 'hh:mm:ss A', label: '02:30:00 PM', format: 'hh:mm:ss A' },
  { id: 'hh:mm A', label: '02:30 PM', format: 'hh:mm A' },
  { id: 'none', label: 'None', format: '' }
];
