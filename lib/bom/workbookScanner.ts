import * as XLSX from "xlsx";

import type {
  WorkbookCellValue,
  WorkbookRow,
  WorkbookSheetData,
} from "./types";

/**
 * SheetJS에서 반환되는 값을
 * G1 WorkbookCellValue 형식으로 정리합니다.
 */
const normalizeCellValue = (
  value: unknown,
): WorkbookCellValue => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  ) {
    return value;
  }

  return String(value);
};

/**
 * 한 행에 실제 값이 존재하는지 확인합니다.
 */
export const isNonEmptyRow = (
  row: WorkbookRow,
): boolean => {
  return row.some((cell) => {
    if (
      cell === null ||
      cell === undefined
    ) {
      return false;
    }

    if (
      typeof cell === "string"
    ) {
      return cell.trim() !== "";
    }

    return true;
  });
};

/**
 * 특정 셀이 비어 있는지 확인합니다.
 */
export const isEmptyCell = (
  value: WorkbookCellValue,
): boolean => {
  if (
    value === null ||
    value === undefined
  ) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  return false;
};

/**
 * 워크시트를 2차원 행 배열로 변환합니다.
 *
 * header: 1을 사용하여 엑셀 헤더를 강제로
 * 객체 키로 변환하지 않고 원본 셀 위치를 유지합니다.
 */
const worksheetToRows = (
  worksheet: XLSX.WorkSheet,
): WorkbookRow[] => {
  const rawRows =
    XLSX.utils.sheet_to_json<unknown[]>(
      worksheet,
      {
        header: 1,
        defval: "",
        raw: false,
        blankrows: true,
      },
    );

  return rawRows.map((rawRow) =>
    rawRow.map(normalizeCellValue),
  );
};

/**
 * 시트 내에서 실제 값이 존재하는 범위를 계산합니다.
 */
const calculateUsedRange = (
  rows: WorkbookRow[],
): Pick<
  WorkbookSheetData,
  | "firstNonEmptyRowIndex"
  | "lastNonEmptyRowIndex"
  | "firstNonEmptyColumnIndex"
  | "lastNonEmptyColumnIndex"
> => {
  let firstNonEmptyRowIndex:
    | number
    | null = null;

  let lastNonEmptyRowIndex:
    | number
    | null = null;

  let firstNonEmptyColumnIndex:
    | number
    | null = null;

  let lastNonEmptyColumnIndex:
    | number
    | null = null;

  rows.forEach((row, rowIndex) => {
    let rowHasValue = false;

    row.forEach(
      (cellValue, columnIndex) => {
        if (isEmptyCell(cellValue)) {
          return;
        }

        rowHasValue = true;

        if (
          firstNonEmptyColumnIndex ===
            null ||
          columnIndex <
            firstNonEmptyColumnIndex
        ) {
          firstNonEmptyColumnIndex =
            columnIndex;
        }

        if (
          lastNonEmptyColumnIndex ===
            null ||
          columnIndex >
            lastNonEmptyColumnIndex
        ) {
          lastNonEmptyColumnIndex =
            columnIndex;
        }
      },
    );

    if (!rowHasValue) {
      return;
    }

    if (
      firstNonEmptyRowIndex === null
    ) {
      firstNonEmptyRowIndex =
        rowIndex;
    }

    lastNonEmptyRowIndex = rowIndex;
  });

  return {
    firstNonEmptyRowIndex,
    lastNonEmptyRowIndex,
    firstNonEmptyColumnIndex,
    lastNonEmptyColumnIndex,
  };
};

/**
 * 워크북의 모든 시트를 순회하며
 * G1 스캔 데이터로 변환합니다.
 */
export const scanWorkbook = (
  workbook: XLSX.WorkBook,
): WorkbookSheetData[] => {
  return workbook.SheetNames.map(
    (sheetName, sheetIndex) => {
      const worksheet =
        workbook.Sheets[sheetName];

      if (!worksheet) {
        return {
          sheetName,
          sheetIndex,
          rows: [],
          firstNonEmptyRowIndex: null,
          lastNonEmptyRowIndex: null,
          firstNonEmptyColumnIndex:
            null,
          lastNonEmptyColumnIndex: null,
        };
      }

      const rows =
        worksheetToRows(worksheet);

      const usedRange =
        calculateUsedRange(rows);

      return {
        sheetName,
        sheetIndex,
        rows,
        ...usedRange,
      };
    },
  );
};

/**
 * ArrayBuffer를 Workbook으로 읽은 뒤
 * 모든 하단 시트를 스캔합니다.
 */
export const scanWorkbookFromBuffer = (
  arrayBuffer: ArrayBuffer,
): WorkbookSheetData[] => {
  const workbook = XLSX.read(
    arrayBuffer,
    {
      type: "array",
      cellDates: true,
    },
  );

  if (
    workbook.SheetNames.length === 0
  ) {
    throw new Error(
      "엑셀 파일에 확인 가능한 시트가 없습니다.",
    );
  }

  return scanWorkbook(workbook);
};