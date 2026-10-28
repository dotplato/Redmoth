// Minimal RFC 4180 CSV: quoted fields may hold commas, quotes ("") and line breaks.

// Spreadsheet apps run a cell starting with one of these as a formula ("CSV injection"), so exported
// cells that start with one get a leading apostrophe, which spreadsheets hide. Imports strip it again.
const FORMULA_START = /^[=+\-@\t\r]/;
const FORMULA_GUARD = "'";
// Lets Excel open the file as UTF-8 instead of guessing the encoding.
const BOM = "﻿";

export class CsvError extends Error {}

function cell(value: string) {
  const guarded = FORMULA_START.test(value) ? `${FORMULA_GUARD}${value}` : value;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

/** The first row is the header. */
export function toCsv(rows: string[][]) {
  return BOM + rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Undoes the export's formula guard. */
export function unguard(value: string) {
  return value.startsWith(FORMULA_GUARD) && FORMULA_START.test(value.slice(1)) ? value.slice(1) : value;
}

/** Rows of cells; blank lines are skipped. Throws CsvError on a quote that never closes. */
export function parseCsv(text: string): string[][] {
  const source = text.startsWith(BOM) ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  const endRow = () => {
    row.push(value);
    if (row.some((part) => part !== "")) rows.push(row);
    row = [];
    value = "";
  };

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char !== '"') value += char;
      else if (source[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") endRow();
    else if (char !== "\r") value += char;
  }
  if (quoted) throw new CsvError("A quoted value is never closed. Check for a stray \" in the file.");
  endRow();
  return rows;
}
