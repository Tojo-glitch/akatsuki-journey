import { createWorker } from 'tesseract.js';
import { SessionTimeConfig } from '@kecha/shared-types';

export interface ExtractedChartData {
  pair?: string;
  timeframe?: string;
  session?: string;
  rMultiple?: number;
  occurrences?: number;
  setupLabel?: string;
}

const KNOWN_PAIRS = ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'BTCUSD', 'ETHUSD', 'US30', 'NAS100', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD'];

export const normalizePair = (raw: string): string => {
  const cleaned = raw.toUpperCase().replace(/(OANDA|FX|BINANCE|FOREXCOM|INDEX|CAPITALCOM)[:/_\s.-]/g, '').replace(/[^A-Z0-9]/g, '');
  if (cleaned.includes('GOLD')) return 'XAUUSD';
  for (const p of KNOWN_PAIRS) {
    if (cleaned.includes(p)) return p;
  }
  const match = cleaned.match(/([A-Z]{6})/);
  return match ? match[1] : '';
};

export const determineSessionByTime = (hour: number, sessionConfigs?: SessionTimeConfig[]): string => {
  const configs = sessionConfigs || [
    { name: 'Asia', startHour: 5, endHour: 13 },
    { name: 'London', startHour: 14, endHour: 22 },
    { name: 'New York', startHour: 19, endHour: 3 }
  ];
  for (const s of configs) {
    if (s.startHour <= s.endHour) {
      if (hour >= s.startHour && hour < s.endHour) return s.name;
    } else {
      if (hour >= s.startHour || hour < s.endHour) return s.name;
    }
  }
  return 'London';
};

export const parseChartImageOCR = async (imageSrc: string, sessionConfigs?: SessionTimeConfig[]): Promise<ExtractedChartData> => {
  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(imageSrc);
    await worker.terminate();

    const result: ExtractedChartData = {};
    const detectedPair = normalizePair(text);
    if (detectedPair) result.pair = detectedPair;

    const tfMatch = text.toUpperCase().match(/\b(15M|1M|5M|30M|1H|4H|1D|M15|M1|M5|M30|H1|H4|D1)\b/);
    if (tfMatch) {
      const raw = tfMatch[1];
      result.timeframe = raw.startsWith('M') || raw.startsWith('H') || raw.startsWith('D') ? raw : `M${raw.replace('M', '')}`;
    }

    const rangeMatch = text.match(/100\/(\d+)(?:[-,](\d+))?/i);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : start;
      result.occurrences = Math.max(1, end - start + 1);
      result.setupLabel = rangeMatch[0];
    }

    const timeMatch = text.match(/\b([0-2]?[0-9]):([0-5][0-9])\b/);
    if (timeMatch) {
      result.session = determineSessionByTime(parseInt(timeMatch[1], 10), sessionConfigs);
    }
    return result;
  } catch (err) {
    console.warn('OCR error:', err);
    return {};
  }
};
