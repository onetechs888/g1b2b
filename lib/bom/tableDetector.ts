import {
  WorkbookRow,
  WorkbookSheetData,
  DetectedTable,
} from "./types";

const isEmpty = (value: unknown) => {
  if (value === null || value === undefined) {
    return true;
  }

  return String(value).trim() === "";
};

const isRowEmpty = (row: WorkbookRow) => {
  return row.every(isEmpty);
};

/**
 * 연속된 데이터 영역을 하나의 Table로 분리
 */
export const detectTables = (
  sheet: WorkbookSheetData,
): DetectedTable[] => {
  const tables: DetectedTable[] = [];

  let currentStart: number | null = null;

  for (let rowIndex = 0; rowIndex < sheet.rows.length; rowIndex++) {
    const row = sheet.rows[rowIndex];

    if (!isRowEmpty(row)) {
      if (currentStart === null) {
        currentStart = rowIndex;
      }
    } else {
      if (currentStart !== null) {
        const tableRows = sheet.rows.slice(
          currentStart,
          rowIndex,
        );

        tables.push({
          id: crypto.randomUUID(),

          sheetName: sheet.sheetName,
          sheetIndex: sheet.sheetIndex,

          startRowIndex: currentStart,
          endRowIndex: rowIndex - 1,

          startColumnIndex: 0,
          endColumnIndex:
            Math.max(
              ...tableRows.map((r) => r.length),
            ) - 1,

          rows: tableRows,
        });

        currentStart = null;
      }
    }
  }

  if (currentStart !== null) {
    const tableRows = sheet.rows.slice(currentStart);

    tables.push({
      id: crypto.randomUUID(),

      sheetName: sheet.sheetName,
      sheetIndex: sheet.sheetIndex,

      startRowIndex: currentStart,
      endRowIndex:
        sheet.rows.length - 1,

      startColumnIndex: 0,

      endColumnIndex:
        Math.max(
          ...tableRows.map((r) => r.length),
        ) - 1,

      rows: tableRows,
    });
  }

  return tables;
};

/**
 * Workbook 전체 Table 추출
 */
export const detectWorkbookTables = (
  sheets: WorkbookSheetData[],
): DetectedTable[] => {
  return sheets.flatMap((sheet) =>
    detectTables(sheet),
  );
};