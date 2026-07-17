import type {
  BomColumnMap,
  DetectedTable,
  WorkbookCellValue,
  WorkbookRow,
} from "./types";

import type {
  HeaderDetectionResult,
} from "./headerMatcher";

export type BomScoreBreakdown = {
  headerScore: number;
  requiredFieldScore: number;
  dataScore: number;
  continuityScore: number;
  patternScore: number;
  volumeScore: number;
  penaltyScore: number;
};

export type BomScoringMetrics = {
  totalDataRowCount: number;
  validDataRowCount: number;
  invalidDataRowCount: number;

  partNoValueCount: number;
  partNameValueCount: number;
  quantityValueCount: number;
  validQuantityCount: number;

  duplicatePartNoCount: number;
  summaryRowCount: number;

  continuityRatio: number;
  partNoPatternRatio: number;
  validRowRatio: number;
};

export type BomScoringResult = {
  table: DetectedTable;
  header: HeaderDetectionResult;

  score: number;
  confidence: number;

  breakdown: BomScoreBreakdown;
  metrics: BomScoringMetrics;

  dataStartRowIndex: number;
  dataEndRowIndex: number;

  reasons: string[];
  warnings: string[];
};

export type TableHeaderCandidate = {
  table: DetectedTable;
  header: HeaderDetectionResult;
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
  "결재",
  "담당자",
  "요청사항",
  "주의사항",
  "참고사항",
  "비고사항",
  "특이사항",
];

const MAX_HEADER_SCORE = 150;

const isEmptyValue = (
  value: WorkbookCellValue | undefined,
): boolean => {
  if (
    value === null ||
    value === undefined
  ) {
    return true;
  }

  if (
    typeof value === "string"
  ) {
    return value.trim() === "";
  }

  return false;
};

const toComparableText = (
  value: WorkbookCellValue | undefined,
): string => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value).trim();
};

const normalizeText = (
  value: WorkbookCellValue | undefined,
): string => {
  return toComparableText(value)
    .toLowerCase()
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizePartNo = (
  value: WorkbookCellValue | undefined,
): string => {
  return toComparableText(value)
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();
};

const getCell = (
  row: WorkbookRow,
  columnIndex:
    | number
    | undefined,
): WorkbookCellValue | undefined => {
  if (
    columnIndex === undefined ||
    columnIndex < 0
  ) {
    return undefined;
  }

  return row[columnIndex];
};

const countNonEmptyCells = (
  row: WorkbookRow,
): number => {
  return row.reduce<number>(
    (count, value) => {
      return isEmptyValue(value)
        ? count
        : count + 1;
    },
    0,
  );
};

const isRowEmpty = (
  row: WorkbookRow,
): boolean => {
  return countNonEmptyCells(row) === 0;
};

const parseQuantity = (
  value: WorkbookCellValue | undefined,
): number | null => {
  if (isEmptyValue(value)) {
    return null;
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : null;
  }

  const normalized = String(value)
    .trim()
    .replace(/,/g, "")
    .replace(
      /(ea|pcs?|개|set|sets)$/i,
      "",
    )
    .trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

const isValidQuantity = (
  value: WorkbookCellValue | undefined,
): boolean => {
  const quantity =
    parseQuantity(value);

  return (
    quantity !== null &&
    quantity > 0
  );
};

const rowContainsKeyword = (
  row: WorkbookRow,
  keywords: string[],
): boolean => {
  const rowText = row
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");

  if (!rowText) {
    return false;
  }

  return keywords.some(
    (keyword) =>
      rowText === keyword ||
      rowText.startsWith(
        `${keyword} `,
      ) ||
      rowText.includes(
        ` ${keyword} `,
      ),
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

/**
 * 한 행이 BOM 데이터처럼 보이는지 판단합니다.
 *
 * 품번 또는 품명이 있어야 하며,
 * 행 전체에 일정 수준 이상의 데이터가 있어야 합니다.
 */
const isLikelyBomDataRow = (
  row: WorkbookRow,
  columnMap: BomColumnMap,
): boolean => {
  if (
    isRowEmpty(row) ||
    isSummaryRow(row) ||
    isDescriptionRow(row)
  ) {
    return false;
  }

  const partNo = getCell(
    row,
    columnMap.partNo,
  );

  const partName = getCell(
    row,
    columnMap.partName,
  );

  const quantity = getCell(
    row,
    columnMap.quantity,
  );

  const hasPartNo =
    !isEmptyValue(partNo);

  const hasPartName =
    !isEmptyValue(partName);

  const hasQuantity =
    !isEmptyValue(quantity);

  const nonEmptyCellCount =
    countNonEmptyCells(row);

  if (
    !hasPartNo &&
    !hasPartName
  ) {
    return false;
  }

  if (
    nonEmptyCellCount < 2 &&
    !(
      hasPartNo &&
      hasPartName
    )
  ) {
    return false;
  }

  if (
    hasQuantity &&
    !isValidQuantity(quantity)
  ) {
    /**
     * 수량 열에 제목이나 설명 문장이 들어간 경우
     * 데이터 행으로 보지 않습니다.
     */
    const quantityText =
      normalizeText(quantity);

    if (
      quantityText.length > 12
    ) {
      return false;
    }
  }

  return true;
};

const getLocalHeaderEndIndex = (
  table: DetectedTable,
  header: HeaderDetectionResult,
): number => {
  return Math.max(
    0,
    header.headerEndRowIndex -
      table.startRowIndex,
  );
};

/**
 * 헤더 다음부터 실제 BOM 영역으로 보이는 행까지만 추출합니다.
 *
 * 데이터가 시작된 이후 빈 행이 연속으로 2개 이상 나오면
 * 다음 별도 표가 시작된 것으로 보고 중단합니다.
 */
const extractDataRows = (
  table: DetectedTable,
  header: HeaderDetectionResult,
): {
  rows: WorkbookRow[];
  sourceRowIndexes: number[];
} => {
  const localHeaderEndIndex =
    getLocalHeaderEndIndex(
      table,
      header,
    );

  const candidateRows =
    table.rows.slice(
      localHeaderEndIndex + 1,
    );

  const rows: WorkbookRow[] = [];
  const sourceRowIndexes: number[] =
    [];

  let dataStarted = false;
  let consecutiveEmptyRows = 0;

  for (
    let index = 0;
    index <
    candidateRows.length;
    index += 1
  ) {
    const row =
      candidateRows[index];

    const absoluteRowIndex =
      table.startRowIndex +
      localHeaderEndIndex +
      1 +
      index;

    if (isRowEmpty(row)) {
      if (dataStarted) {
        consecutiveEmptyRows += 1;
      }

      if (
        dataStarted &&
        consecutiveEmptyRows >= 2
      ) {
        break;
      }

      continue;
    }

    consecutiveEmptyRows = 0;

    const likelyData =
      isLikelyBomDataRow(
        row,
        header.columnMap,
      );

    if (!dataStarted) {
      if (!likelyData) {
        continue;
      }

      dataStarted = true;
    }

    if (
      isDescriptionRow(row) &&
      !likelyData
    ) {
      break;
    }

    rows.push(row);
    sourceRowIndexes.push(
      absoluteRowIndex,
    );
  }

  return {
    rows,
    sourceRowIndexes,
  };
};

/**
 * 품번 문자열의 구조적 특징을 단순화합니다.
 *
 * 예:
 * 2602-SA-B101-0 → DDDD-AA-ADDD-D
 * GP260601B      → AADDDDDDA
 */
const createPartNoSignature = (
  value: WorkbookCellValue | undefined,
): string => {
  const text =
    normalizePartNo(value);

  if (!text) {
    return "";
  }

  return text
    .replace(/[A-Z]/g, "A")
    .replace(/[0-9]/g, "D")
    .replace(
      /[^AD\-_/().]/g,
      "X",
    );
};

const isPlausiblePartNo = (
  value: WorkbookCellValue | undefined,
): boolean => {
  const text =
    normalizePartNo(value);

  if (!text) {
    return false;
  }

  if (text.length < 2) {
    return false;
  }

  /**
   * 지나치게 긴 설명 문장은 품번으로 보기 어렵습니다.
   */
  if (text.length > 80) {
    return false;
  }

  const hasLetter =
    /[A-Z가-힣]/.test(text);

  const hasNumber =
    /[0-9]/.test(text);

  const hasSeparator =
    /[-_/().]/.test(text);

  return (
    (hasLetter && hasNumber) ||
    (hasNumber && hasSeparator) ||
    (hasLetter && hasSeparator) ||
    /^[0-9]{3,}$/.test(text)
  );
};

const calculatePatternRatio = (
  rows: WorkbookRow[],
  partNoColumn:
    | number
    | undefined,
): number => {
  if (
    partNoColumn === undefined
  ) {
    return 0;
  }

  const signatures = rows
    .map((row) =>
      createPartNoSignature(
        getCell(
          row,
          partNoColumn,
        ),
      ),
    )
    .filter(Boolean);

  if (signatures.length === 0) {
    return 0;
  }

  const signatureCounts =
    signatures.reduce<
      Record<string, number>
    >((accumulator, signature) => {
      accumulator[signature] =
        (accumulator[signature] ??
          0) + 1;

      return accumulator;
    }, {});

  const mostCommonCount =
    Math.max(
      ...Object.values(
        signatureCounts,
      ),
    );

  const exactPatternRatio =
    mostCommonCount /
    signatures.length;

  const plausibleCount = rows.filter(
    (row) =>
      isPlausiblePartNo(
        getCell(
          row,
          partNoColumn,
        ),
      ),
  ).length;

  const plausibleRatio =
    plausibleCount /
    Math.max(rows.length, 1);

  return Math.min(
    1,
    exactPatternRatio * 0.55 +
      plausibleRatio * 0.45,
  );
};

const calculateContinuityRatio = (
  rows: WorkbookRow[],
  columnMap: BomColumnMap,
): number => {
  if (rows.length === 0) {
    return 0;
  }

  const validFlags = rows.map(
    (row) =>
      isLikelyBomDataRow(
        row,
        columnMap,
      ),
  );

  const validCount =
    validFlags.filter(Boolean)
      .length;

  if (validCount === 0) {
    return 0;
  }

  let longestSequence = 0;
  let currentSequence = 0;

  validFlags.forEach(
    (isValid) => {
      if (isValid) {
        currentSequence += 1;
        longestSequence =
          Math.max(
            longestSequence,
            currentSequence,
          );
      } else {
        currentSequence = 0;
      }
    },
  );

  const validRatio =
    validCount /
    rows.length;

  const sequenceRatio =
    longestSequence /
    rows.length;

  return Math.min(
    1,
    validRatio * 0.6 +
      sequenceRatio * 0.4,
  );
};

const countDuplicatePartNumbers = (
  rows: WorkbookRow[],
  partNoColumn:
    | number
    | undefined,
): number => {
  if (
    partNoColumn === undefined
  ) {
    return 0;
  }

  const counts =
    new Map<string, number>();

  rows.forEach((row) => {
    const value =
      normalizePartNo(
        getCell(
          row,
          partNoColumn,
        ),
      );

    if (!value) {
      return;
    }

    counts.set(
      value,
      (counts.get(value) ?? 0) +
        1,
    );
  });

  return Array.from(
    counts.values(),
  ).reduce(
    (total, count) =>
      count > 1
        ? total + count - 1
        : total,
    0,
  );
};

const calculateRequiredFieldScore = (
  columnMap: BomColumnMap,
): number => {
  let score = 0;

  if (
    columnMap.partNo !==
    undefined
  ) {
    score += 30;
  }

  if (
    columnMap.partName !==
    undefined
  ) {
    score += 30;
  }

  if (
    columnMap.quantity !==
    undefined
  ) {
    score += 20;
  }

  if (
    columnMap.material !==
    undefined
  ) {
    score += 5;
  }

  if (
    columnMap.specification !==
    undefined
  ) {
    score += 5;
  }

  /**
   * 품번과 품명 중 하나도 없으면 BOM 핵심 구조가 아닙니다.
   */
  if (
    columnMap.partNo ===
      undefined &&
    columnMap.partName ===
      undefined
  ) {
    score -= 80;
  }

  /**
   * 품번과 품명이 모두 있으면 강한 BOM 신호입니다.
   */
  if (
    columnMap.partNo !==
      undefined &&
    columnMap.partName !==
      undefined
  ) {
    score += 20;
  }

  return score;
};

const calculateVolumeScore = (
  validDataRowCount: number,
): number => {
  if (validDataRowCount >= 50) {
    return 30;
  }

  if (validDataRowCount >= 20) {
    return 25;
  }

  if (validDataRowCount >= 10) {
    return 20;
  }

  if (validDataRowCount >= 5) {
    return 14;
  }

  if (validDataRowCount >= 2) {
    return 7;
  }

  if (validDataRowCount === 1) {
    return 2;
  }

  return -30;
};

const clamp = (
  value: number,
  minimum: number,
  maximum: number,
): number => {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
};

const round = (
  value: number,
  digits = 2,
): number => {
  const multiplier =
    10 ** digits;

  return (
    Math.round(
      value * multiplier,
    ) / multiplier
  );
};

const calculateConfidence = (
  score: number,
): number => {
  /**
   * 현재 V1 점수 범위를 0~1 신뢰도로 변환합니다.
   *
   * 약 60점 이하: 낮은 신뢰도
   * 약 130점: 중간 신뢰도
   * 약 200점 이상: 높은 신뢰도
   */
  const confidence =
    (score - 30) / 190;

  return round(
    clamp(
      confidence,
      0,
      1,
    ),
    4,
  );
};

/**
 * 하나의 표 후보를 BOM 관점에서 점수화합니다.
 */
export const scoreBomCandidate = (
  table: DetectedTable,
  header: HeaderDetectionResult,
): BomScoringResult => {
  const {
    rows,
    sourceRowIndexes,
  } = extractDataRows(
    table,
    header,
  );

  const validRows = rows.filter(
    (row) =>
      isLikelyBomDataRow(
        row,
        header.columnMap,
      ),
  );

  const invalidRows = rows.filter(
    (row) =>
      !isLikelyBomDataRow(
        row,
        header.columnMap,
      ),
  );

  const partNoValueCount =
    validRows.filter(
      (row) =>
        !isEmptyValue(
          getCell(
            row,
            header.columnMap
              .partNo,
          ),
        ),
    ).length;

  const partNameValueCount =
    validRows.filter(
      (row) =>
        !isEmptyValue(
          getCell(
            row,
            header.columnMap
              .partName,
          ),
        ),
    ).length;

  const quantityValueCount =
    validRows.filter(
      (row) =>
        !isEmptyValue(
          getCell(
            row,
            header.columnMap
              .quantity,
          ),
        ),
    ).length;

  const validQuantityCount =
    validRows.filter(
      (row) =>
        isValidQuantity(
          getCell(
            row,
            header.columnMap
              .quantity,
          ),
        ),
    ).length;

  const summaryRowCount =
    rows.filter(
      isSummaryRow,
    ).length;

  const duplicatePartNoCount =
    countDuplicatePartNumbers(
      validRows,
      header.columnMap.partNo,
    );

  const validRowRatio =
    validRows.length /
    Math.max(rows.length, 1);

  const continuityRatio =
    calculateContinuityRatio(
      rows,
      header.columnMap,
    );

  const partNoPatternRatio =
    calculatePatternRatio(
      validRows,
      header.columnMap.partNo,
    );

  const headerScore =
    clamp(
      header.score,
      0,
      MAX_HEADER_SCORE,
    );

  const requiredFieldScore =
    calculateRequiredFieldScore(
      header.columnMap,
    );

  let dataScore = 0;

  if (validRows.length > 0) {
    const denominator =
      validRows.length;

    const partNoRatio =
      partNoValueCount /
      denominator;

    const partNameRatio =
      partNameValueCount /
      denominator;

    const quantityRatio =
      quantityValueCount /
      denominator;

    const validQuantityRatio =
      validQuantityCount /
      denominator;

    dataScore +=
      partNoRatio * 30;

    dataScore +=
      partNameRatio * 30;

    dataScore +=
      quantityRatio * 10;

    dataScore +=
      validQuantityRatio * 15;

    dataScore +=
      validRowRatio * 15;
  } else {
    dataScore -= 50;
  }

  const continuityScore =
    continuityRatio * 25;

  const patternScore =
    header.columnMap.partNo !==
    undefined
      ? partNoPatternRatio * 20
      : 0;

  const volumeScore =
    calculateVolumeScore(
      validRows.length,
    );

  let penaltyScore = 0;

  if (invalidRows.length > 0) {
    penaltyScore -= Math.min(
      20,
      invalidRows.length * 2,
    );
  }

  if (
    duplicatePartNoCount > 0
  ) {
    penaltyScore -= Math.min(
      20,
      duplicatePartNoCount * 2,
    );
  }

  if (summaryRowCount > 0) {
    penaltyScore -= Math.min(
      8,
      summaryRowCount * 2,
    );
  }

  if (
    validRows.length < 2
  ) {
    penaltyScore -= 20;
  }

  if (
    header.columnMap.partNo ===
      undefined &&
    header.columnMap.partName ===
      undefined
  ) {
    penaltyScore -= 100;
  }

  const rawScore =
    headerScore +
    requiredFieldScore +
    dataScore +
    continuityScore +
    patternScore +
    volumeScore +
    penaltyScore;

  const score = round(
    Math.max(0, rawScore),
  );

  const confidence =
    calculateConfidence(score);

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (
    header.columnMap.partNo !==
    undefined
  ) {
    reasons.push(
      "품번 열을 인식했습니다.",
    );
  }

  if (
    header.columnMap.partName !==
    undefined
  ) {
    reasons.push(
      "품명 열을 인식했습니다.",
    );
  }

  if (
    header.columnMap.quantity !==
    undefined
  ) {
    reasons.push(
      "수량 열을 인식했습니다.",
    );
  }

  if (validRows.length > 0) {
    reasons.push(
      `유효한 BOM 데이터 행 ${validRows.length}개를 확인했습니다.`,
    );
  }

  if (
    continuityRatio >= 0.8
  ) {
    reasons.push(
      "BOM 데이터 행의 연속성이 높습니다.",
    );
  }

  if (
    partNoPatternRatio >= 0.7
  ) {
    reasons.push(
      "품번 형식이 비교적 일관적입니다.",
    );
  }

  if (
    header.columnMap.partNo ===
      undefined
  ) {
    warnings.push(
      "품번 열을 찾지 못했습니다.",
    );
  }

  if (
    header.columnMap.partName ===
      undefined
  ) {
    warnings.push(
      "품명 열을 찾지 못했습니다.",
    );
  }

  if (
    header.columnMap.quantity ===
      undefined
  ) {
    warnings.push(
      "수량 열을 찾지 못했습니다.",
    );
  }

  if (validRows.length === 0) {
    warnings.push(
      "헤더 아래에서 유효한 BOM 데이터 행을 찾지 못했습니다.",
    );
  }

  if (
    duplicatePartNoCount > 0
  ) {
    warnings.push(
      `중복 품번으로 보이는 행이 ${duplicatePartNoCount}개 있습니다.`,
    );
  }

  if (
    partNoPatternRatio > 0 &&
    partNoPatternRatio < 0.4
  ) {
    warnings.push(
      "품번 형식의 일관성이 낮습니다.",
    );
  }

  const dataStartRowIndex =
    sourceRowIndexes.length > 0
      ? sourceRowIndexes[0]
      : header.headerEndRowIndex +
        1;

  const dataEndRowIndex =
    sourceRowIndexes.length > 0
      ? sourceRowIndexes[
          sourceRowIndexes.length -
            1
        ]
      : dataStartRowIndex;

  return {
    table,
    header,

    score,
    confidence,

    breakdown: {
      headerScore:
        round(headerScore),

      requiredFieldScore:
        round(
          requiredFieldScore,
        ),

      dataScore:
        round(dataScore),

      continuityScore:
        round(
          continuityScore,
        ),

      patternScore:
        round(patternScore),

      volumeScore:
        round(volumeScore),

      penaltyScore:
        round(penaltyScore),
    },

    metrics: {
      totalDataRowCount:
        rows.length,

      validDataRowCount:
        validRows.length,

      invalidDataRowCount:
        invalidRows.length,

      partNoValueCount,
      partNameValueCount,
      quantityValueCount,
      validQuantityCount,

      duplicatePartNoCount,
      summaryRowCount,

      continuityRatio:
        round(
          continuityRatio,
          4,
        ),

      partNoPatternRatio:
        round(
          partNoPatternRatio,
          4,
        ),

      validRowRatio:
        round(
          validRowRatio,
          4,
        ),
    },

    dataStartRowIndex,
    dataEndRowIndex,

    reasons,
    warnings,
  };
};

/**
 * 헤더 분석을 마친 모든 표 후보를 점수화하고
 * 점수가 높은 순서로 정렬합니다.
 */
export const scoreBomCandidates = (
  candidates: TableHeaderCandidate[],
): BomScoringResult[] => {
  return candidates
    .map(({ table, header }) =>
      scoreBomCandidate(
        table,
        header,
      ),
    )
    .sort((left, right) => {
      if (
        right.score !==
        left.score
      ) {
        return (
          right.score -
          left.score
        );
      }

      if (
        right.metrics
          .validDataRowCount !==
        left.metrics
          .validDataRowCount
      ) {
        return (
          right.metrics
            .validDataRowCount -
          left.metrics
            .validDataRowCount
        );
      }

      return (
        left.header
          .headerRowIndex -
        right.header
          .headerRowIndex
      );
    });
};

/**
 * 가장 높은 점수의 BOM 후보 하나를 반환합니다.
 */
export const selectBestBomCandidate = (
  candidates: TableHeaderCandidate[],
): BomScoringResult | null => {
  const scoredCandidates =
    scoreBomCandidates(
      candidates,
    );

  return (
    scoredCandidates[0] ??
    null
  );
};

/**
 * 자동 선택이 가능한 수준인지 판단합니다.
 *
 * V1에서는 다음 기준을 사용합니다.
 * - 점수 110점 이상
 * - 유효 데이터 2행 이상
 * - 품번 또는 품명 열 존재
 */
export const isAutoSelectableBomCandidate = (
  candidate:
    | BomScoringResult
    | null,
): boolean => {
  if (!candidate) {
    return false;
  }

  const hasIdentityColumn =
    candidate.header.columnMap
      .partNo !== undefined ||
    candidate.header.columnMap
      .partName !== undefined;

  return (
    candidate.score >= 110 &&
    candidate.metrics
      .validDataRowCount >= 2 &&
    hasIdentityColumn
  );
};