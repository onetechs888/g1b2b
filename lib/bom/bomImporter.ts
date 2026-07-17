import type {
  BomColumnMap,
  ImportedBomItem,
  WorkbookCellValue,
  WorkbookRow,
} from "./types";

import type {
  BomScoringResult,
} from "./bomScorer";

export type BomImportWarning = {
  sourceRowIndex: number;
  message: string;
};

export type BomImportSummary = {
  totalRowCount: number;
  importedRowCount: number;
  skippedRowCount: number;
  warningCount: number;
};

export type BomCandidateImportResult = {
  items: ImportedBomItem[];
  warnings: BomImportWarning[];
  summary: BomImportSummary;
};

const SUMMARY_KEYWORDS = [
  "합계",
  "총계",
  "소계",
  "총수량",
  "총금액",
  "total",
  "subtotal",
  "sum",
];

const DESCRIPTION_KEYWORDS = [
  "작성자",
  "검토자",
  "승인자",
  "담당자",
  "결재",
  "요청사항",
  "주의사항",
  "참고사항",
  "특이사항",
];

const isEmptyValue = (
  value: WorkbookCellValue | undefined,
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

const getCell = (
  row: WorkbookRow,
  columnIndex: number | undefined,
): WorkbookCellValue | undefined => {
  if (
    columnIndex === undefined ||
    columnIndex < 0
  ) {
    return undefined;
  }

  return row[columnIndex];
};

const cellToString = (
  value: WorkbookCellValue | undefined,
): string => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  return String(value).trim();
};

const normalizeWhitespace = (
  value: string,
): string => {
  return value
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizePartNo = (
  value: WorkbookCellValue | undefined,
): string => {
  return normalizeWhitespace(
    cellToString(value),
  );
};

const normalizePartName = (
  value: WorkbookCellValue | undefined,
): string => {
  return normalizeWhitespace(
    cellToString(value),
  );
};

const normalizeMaterial = (
  value: WorkbookCellValue | undefined,
): string => {
  return normalizeWhitespace(
    cellToString(value),
  );
};

const normalizeSpecification = (
  value: WorkbookCellValue | undefined,
): string => {
  return normalizeWhitespace(
    cellToString(value),
  );
};

const normalizeMemo = (
  value: WorkbookCellValue | undefined,
): string => {
  return normalizeWhitespace(
    cellToString(value),
  );
};

const normalizeComparableText = (
  value: WorkbookCellValue | undefined,
): string => {
  return normalizeWhitespace(
    cellToString(value),
  ).toLowerCase();
};

const parseNumberValue = (
  value: WorkbookCellValue | undefined,
): number | null => {
  if (isEmptyValue(value)) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (typeof value === "boolean") {
    return null;
  }

  if (value instanceof Date) {
    return null;
  }

  const normalized = String(value)
    .trim()
    .replace(/,/g, "")
    .replace(/[₩￦$€¥]/g, "")
    .replace(/\s+/g, "");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : null;
};

const parseQuantity = (
  value: WorkbookCellValue | undefined,
): number | null => {
  if (isEmptyValue(value)) {
    return null;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }

    return value;
  }

  if (
    typeof value === "boolean" ||
    value instanceof Date
  ) {
    return null;
  }

  const normalized = String(value)
    .trim()
    .replace(/,/g, "")
    .replace(
      /\s*(ea|pcs?|pieces?|개|set|sets|식)$/i,
      "",
    )
    .trim();

  if (!normalized) {
    return null;
  }

  const directNumber = Number(normalized);

  if (Number.isFinite(directNumber)) {
    return directNumber;
  }

  /**
   * 수량 셀에 "2 EA", "3개" 외에
   * 일부 설명이 붙은 경우 첫 숫자를 추출합니다.
   */
  const numberMatch = normalized.match(
    /^(-?\d+(?:\.\d+)?)/,
  );

  if (!numberMatch) {
    return null;
  }

  const parsed = Number(numberMatch[1]);

  return Number.isFinite(parsed)
    ? parsed
    : null;
};

const parseUnitPrice = (
  value: WorkbookCellValue | undefined,
): number | null => {
  const parsed =
    parseNumberValue(value);

  if (
    parsed === null ||
    parsed < 0
  ) {
    return null;
  }

  return parsed;
};

const rowToText = (
  row: WorkbookRow,
): string => {
  return row
    .map(normalizeComparableText)
    .filter(Boolean)
    .join(" ");
};

const rowContainsKeyword = (
  row: WorkbookRow,
  keywords: string[],
): boolean => {
  const text = rowToText(row);

  if (!text) {
    return false;
  }

  return keywords.some(
    (keyword) => {
      const normalizedKeyword =
        keyword.toLowerCase();

      return (
        text === normalizedKeyword ||
        text.startsWith(
          `${normalizedKeyword} `,
        ) ||
        text.includes(
          ` ${normalizedKeyword} `,
        )
      );
    },
  );
};

const isSummaryRow = (
  row: WorkbookRow,
): boolean => {
  return rowContainsKeyword(
    row,
    SUMMARY_KEYWORDS,
  );
};

const isDescriptionRow = (
  row: WorkbookRow,
): boolean => {
  return rowContainsKeyword(
    row,
    DESCRIPTION_KEYWORDS,
  );
};

const isRowEmpty = (
  row: WorkbookRow,
): boolean => {
  return row.every(isEmptyValue);
};

const hasBomIdentity = (
  partNo: string,
  partName: string,
): boolean => {
  return (
    partNo.length > 0 ||
    partName.length > 0
  );
};

const isLikelyHeaderRepeatRow = (
  row: WorkbookRow,
  columnMap: BomColumnMap,
): boolean => {
  const partNoText =
    normalizeComparableText(
      getCell(
        row,
        columnMap.partNo,
      ),
    );

  const partNameText =
    normalizeComparableText(
      getCell(
        row,
        columnMap.partName,
      ),
    );

  const quantityText =
    normalizeComparableText(
      getCell(
        row,
        columnMap.quantity,
      ),
    );

  const partNoHeaderWords = [
    "품번",
    "부품번호",
    "품목번호",
    "도면번호",
    "part no",
    "part number",
    "item no",
    "item number",
    "drawing no",
    "dwg no",
  ];

  const partNameHeaderWords = [
    "품명",
    "부품명",
    "품목명",
    "명칭",
    "part name",
    "item name",
    "description",
  ];

  const quantityHeaderWords = [
    "수량",
    "요청수량",
    "발주수량",
    "qty",
    "quantity",
  ];

  const partNoMatches =
    partNoHeaderWords.some(
      (word) =>
        partNoText === word ||
        partNoText.includes(word),
    );

  const partNameMatches =
    partNameHeaderWords.some(
      (word) =>
        partNameText === word ||
        partNameText.includes(word),
    );

  const quantityMatches =
    quantityHeaderWords.some(
      (word) =>
        quantityText === word ||
        quantityText.includes(word),
    );

  const matchCount = [
    partNoMatches,
    partNameMatches,
    quantityMatches,
  ].filter(Boolean).length;

  return matchCount >= 2;
};

const createImportedItem = (
  row: WorkbookRow,
  columnMap: BomColumnMap,
  sourceSheetName: string,
  sourceRowNumber: number,
): ImportedBomItem => {
  const partNo = normalizePartNo(
    getCell(
      row,
      columnMap.partNo,
    ),
  );

  const partName = normalizePartName(
    getCell(
      row,
      columnMap.partName,
    ),
  );

  const parsedQuantity =
    parseQuantity(
      getCell(
        row,
        columnMap.quantity,
      ),
    );

  const material =
    normalizeMaterial(
      getCell(
        row,
        columnMap.material,
      ),
    );

  const specification =
    normalizeSpecification(
      getCell(
        row,
        columnMap.specification,
      ),
    );

  const unitPrice =
    parseUnitPrice(
      getCell(
        row,
        columnMap.unitPrice,
      ),
    );

  const memo = normalizeMemo(
    getCell(
      row,
      columnMap.memo,
    ),
  );

  return {
    tempId: crypto.randomUUID(),

    sourceSheetName,
    sourceRowNumber,

    partNo,
    partName,

    quantity:
      parsedQuantity !== null &&
      parsedQuantity > 0
        ? parsedQuantity
        : 1,

    material,
    specification,
    unitPrice,
    memo,

    files: [],
  };
};

const validateImportedItem = (
  item: ImportedBomItem,
  sourceRowIndex: number,
): BomImportWarning[] => {
  const warnings: BomImportWarning[] =
    [];

  if (
    !item.partNo &&
    !item.partName
  ) {
    warnings.push({
      sourceRowIndex,
      message:
        "품번과 품명이 모두 비어 있습니다.",
    });
  }

  if (!item.partNo) {
    warnings.push({
      sourceRowIndex,
      message:
        "품번이 비어 있습니다.",
    });
  }

  if (!item.partName) {
    warnings.push({
      sourceRowIndex,
      message:
        "품명이 비어 있습니다.",
    });
  }

  if (
    !Number.isFinite(
      item.quantity,
    ) ||
    item.quantity <= 0
  ) {
    warnings.push({
      sourceRowIndex,
      message:
        "수량이 유효하지 않아 기본값 1을 적용했습니다.",
    });
  }

  return warnings;
};

const getCandidateDataRows = (
  candidate: BomScoringResult,
): Array<{
  row: WorkbookRow;
  sourceRowIndex: number;
}> => {
  const {
    table,
    dataStartRowIndex,
    dataEndRowIndex,
  } = candidate;

  const localStartIndex =
    Math.max(
      0,
      dataStartRowIndex -
        table.startRowIndex,
    );

  const localEndIndex =
    Math.min(
      table.rows.length - 1,
      dataEndRowIndex -
        table.startRowIndex,
    );

  if (
    localStartIndex >
    localEndIndex
  ) {
    return [];
  }

  return table.rows
    .slice(
      localStartIndex,
      localEndIndex + 1,
    )
    .map((row, index) => ({
      row,
      sourceRowIndex:
        dataStartRowIndex +
        index,
    }));
};

/**
 * 점수화가 완료된 BOM 후보를
 * 표준 BOM 데이터로 변환합니다.
 */
export const importBomCandidate = (
  candidate: BomScoringResult,
): BomCandidateImportResult => {
  const candidateRows =
    getCandidateDataRows(
      candidate,
    );

  const items: ImportedBomItem[] =
    [];

  const warnings: BomImportWarning[] =
    [];

  let skippedRowCount = 0;

  candidateRows.forEach(
    ({
      row,
      sourceRowIndex,
    }) => {
      /**
       * 사용자 화면에서는 Excel 행 번호를
       * 1부터 표시하므로 +1 처리합니다.
       */
      const displayRowIndex =
        sourceRowIndex + 1;

      if (isRowEmpty(row)) {
        skippedRowCount += 1;
        return;
      }

      if (isSummaryRow(row)) {
        skippedRowCount += 1;
        return;
      }

      if (isDescriptionRow(row)) {
        skippedRowCount += 1;
        return;
      }

      if (
        isLikelyHeaderRepeatRow(
          row,
          candidate.header
            .columnMap,
        )
      ) {
        skippedRowCount += 1;

        warnings.push({
          sourceRowIndex:
            displayRowIndex,
          message:
            "반복된 헤더 행으로 판단하여 제외했습니다.",
        });

        return;
      }

      const item =
  createImportedItem(
    row,
    candidate.header
      .columnMap,
    candidate.table.sheetName,
    displayRowIndex,
  );

      if (
        !hasBomIdentity(
          item.partNo,
          item.partName,
        )
      ) {
        skippedRowCount += 1;

        warnings.push({
          sourceRowIndex:
            displayRowIndex,
          message:
            "품번과 품명이 없어 BOM 행에서 제외했습니다.",
        });

        return;
      }

      const originalQuantity =
        parseQuantity(
          getCell(
            row,
            candidate.header
              .columnMap.quantity,
          ),
        );

      if (
        candidate.header
          .columnMap.quantity !==
          undefined &&
        (
          originalQuantity ===
            null ||
          originalQuantity <= 0
        )
      ) {
        warnings.push({
          sourceRowIndex:
            displayRowIndex,
          message:
            "수량을 인식하지 못해 기본값 1을 적용했습니다.",
        });
      }

      warnings.push(
        ...validateImportedItem(
          item,
          displayRowIndex,
        ).filter(
          (warning) =>
            warning.message !==
            "수량이 유효하지 않아 기본값 1을 적용했습니다.",
        ),
      );

      items.push(item);
    },
  );

  return {
    items,
    warnings,

    summary: {
      totalRowCount:
        candidateRows.length,

      importedRowCount:
        items.length,

      skippedRowCount,

      warningCount:
        warnings.length,
    },
  };
};

/**
 * 자동 선택된 후보가 없는 경우를 고려하여
 * nullable 후보를 안전하게 처리합니다.
 */
export const importOptionalBomCandidate = (
  candidate:
    | BomScoringResult
    | null,
): BomCandidateImportResult => {
  if (!candidate) {
    return {
      items: [],
      warnings: [],
      summary: {
        totalRowCount: 0,
        importedRowCount: 0,
        skippedRowCount: 0,
        warningCount: 0,
      },
    };
  }

  return importBomCandidate(
    candidate,
  );
};