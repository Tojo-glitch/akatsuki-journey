import { createWorker } from 'tesseract.js';
import { SessionTimeConfig } from '@kecha/shared-types';

export interface ExtractedChartData {
  pair?: string;
  timeframe?: string;
  session?: string;
  rMultiple?: number;
  rawText?: string;
}

const COMMON_PAIRS = ['XAUUSD', 'GOLD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD', 'ETHUSD', 'US30', 'NAS100', 'AUDUSD', 'USDCAD', 'USDCHF'];

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

    const result: ExtractedChartData = { rawText: text };
    const upper = text.toUpperCase();

    for (const p of COMMON_PAIRS) {
      if (upper.includes(p)) {
        result.pair = p === 'GOLD' ? 'XAUUSD' : p;
        break;
      }
    }

    const tfMatch = upper.match(/\b(15M|1M|5M|30M|1H|4H|1D|M15|M1|M5|M30|H1|H4|D1)\b/i);
    if (tfMatch) {
      const rawTf = tfMatch[1].toUpperCase();
      result.timeframe = rawTf.startsWith('M') || rawTf.startsWith('H') || rawTf.startsWith('D')
        ? rawTf
        : rawTf.endsWith('M') ? `M${rawTf.replace('M', '')}` : rawTf.endsWith('H') ? `H${rawTf.replace('H', '')}` : 'M15';
    }

    const timeMatch = text.match(/\b([0-2]?[0-9]):([0-5][0-9])\b/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1], 10);
      result.session = determineSessionByTime(hour, sessionConfigs);
    }

    const rrMatch = text.match(/(?:Risk\/Reward|Reward|RR|Ratio|Target)[:\s]*([0-9.]+)/i);
    if (rrMatch) {
      const parsedR = parseFloat(rrMatch[1]);
      if (!isNaN(parsedR) && parsedR > 0 && parsedR < 50) {
        result.rMultiple = parsedR;
      }
    }

    return result;
  } catch (err) {
    console.warn('OCR Parse failed, falling back to manual entry:', err);
    return {};
  }
};
