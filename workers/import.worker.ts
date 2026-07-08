/* eslint-disable no-restricted-globals */
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { normalizeImportRow, validateDocument } from '../lib/validation';

export interface ImportMessageIn {
  type: 'start';
  file: File;
  fileKind: 'csv' | 'excel';
}

export type ImportMessageOut =
  | { type: 'progress'; processed: number; validCount: number; invalidCount: number }
  | {
      type: 'done';
      total: number;
      validRows: Record<string, any>[];
      invalidCount: number;
      invalidSample: { rowIndex: number; data: Record<string, any>; errors: string[] }[];
    }
  | { type: 'error'; message: string };

const MAX_INVALID_SAMPLE = 200;
const CHUNK_YIELD = 2000; // rows between UI-friendly yields for excel path

function validateRow(raw: Record<string, any>): { ok: boolean; data: any; errors: string[] } {
  const normalized = normalizeImportRow(raw);
  const errors = validateDocument(normalized);
  const errorList = Object.values(errors);
  return { ok: errorList.length === 0, data: normalized, errors: errorList };
}

function processCsv(file: File) {
  let processed = 0;
  let validCount = 0;
  let invalidCount = 0;
  const validRows: Record<string, any>[] = [];
  const invalidSample: { rowIndex: number; data: Record<string, any>; errors: string[] }[] = [];
  const seenCodes = new Set<string>();

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    chunkSize: 1024 * 512, // 512KB text chunks -> keeps memory bounded for huge files
    chunk: (results: Papa.ParseResult<Record<string, any>>) => {
      for (const raw of results.data) {
        processed++;
        const { ok, data, errors } = validateRow(raw);
        const dupCode = ok && data.code && seenCodes.has(String(data.code).toLowerCase());
        if (dupCode) errors.push('Duplicate code within file');
        if (ok && !dupCode) {
          validCount++;
          seenCodes.add(String(data.code).toLowerCase());
          validRows.push(data);
        } else {
          invalidCount++;
          if (invalidSample.length < MAX_INVALID_SAMPLE) {
            invalidSample.push({ rowIndex: processed, data, errors });
          }
        }
      }
      (self as unknown as Worker).postMessage({
        type: 'progress',
        processed,
        validCount,
        invalidCount,
      } as ImportMessageOut);
    },
    complete: () => {
      (self as unknown as Worker).postMessage({
        type: 'done',
        total: processed,
        validRows,
        invalidCount,
        invalidSample,
      } as ImportMessageOut);
    },
    error: (err: Error) => {
      (self as unknown as Worker).postMessage({ type: 'error', message: err.message } as ImportMessageOut);
    },
  });
}

async function processExcel(file: File) {
  try {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    let processed = 0;
    let validCount = 0;
    let invalidCount = 0;
    const validRows: Record<string, any>[] = [];
    const invalidSample: { rowIndex: number; data: Record<string, any>; errors: string[] }[] = [];
    const seenCodes = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      processed++;
      const { ok, data, errors } = validateRow(rows[i]);
      const dupCode = ok && data.code && seenCodes.has(String(data.code).toLowerCase());
      if (dupCode) errors.push('Duplicate code within file');
      if (ok && !dupCode) {
        validCount++;
        seenCodes.add(String(data.code).toLowerCase());
        validRows.push(data);
      } else {
        invalidCount++;
        if (invalidSample.length < MAX_INVALID_SAMPLE) {
          invalidSample.push({ rowIndex: processed, data, errors });
        }
      }

      if (processed % CHUNK_YIELD === 0) {
        (self as unknown as Worker).postMessage({
          type: 'progress',
          processed,
          validCount,
          invalidCount,
        } as ImportMessageOut);
        // Yield so the worker's event loop can flush the postMessage promptly.
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    (self as unknown as Worker).postMessage({
      type: 'progress',
      processed,
      validCount,
      invalidCount,
    } as ImportMessageOut);

    (self as unknown as Worker).postMessage({
      type: 'done',
      total: processed,
      validRows,
      invalidCount,
      invalidSample,
    } as ImportMessageOut);
  } catch (err: any) {
    (self as unknown as Worker).postMessage({ type: 'error', message: err?.message || 'Failed to parse Excel file' } as ImportMessageOut);
  }
}

self.addEventListener('message', (event: MessageEvent<ImportMessageIn>) => {
  const { type, file, fileKind } = event.data;
  if (type !== 'start') return;
  if (fileKind === 'csv') {
    processCsv(file);
  } else {
    processExcel(file);
  }
});

export {};
