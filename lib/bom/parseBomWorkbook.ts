import type {
  BomCandidate,
  BomImportOptions,
  BomImportResult,
  ImportedBomItem,
} from "./types";

import {
  DEFAULT_BOM_IMPORT_OPTIONS,
} from "./types";

import {
  scanWorkbookFromBuffer,
} from "./workbookScanner";

import {
  detectWorkbookTables,
} from "./tableDetector";

import {
  matchWorkbookTableHeaders,
} from "./headerMatcher";

import {
  scoreBomCandidates,
} from "./bomScorer";

import type {
  BomScoringResult,
} from "./bomScorer";

import {
  importBomCandidate,
} from "./bomImporter";

/**
 * 기존 페이지에서 아래 방식으로 타입을 가져오는 경우를 지원합니다.
 *
 * import type {
 *   ImportedBomItem
 * } from "@/lib/bom/parseBomWorkbook";
 */
export type {
  ImportedBomItem,
} from "./types";

/**
 * 기존 입찰 요청 페이지에서 사용하는
 * sheetName, headerRowNumber도 함께 제공합니다.
 */
export type ParsedBomWorkbookResult =
  BomImportResult & {
    sheetName: string;
    headerRowNumber: number;
  };

const convertToBomCandidate = (
  scoringResult: BomScoringResult,
): BomCandidate => {
  return {
    id: scoringResult.table.id,

    sheetName:
      scoringResult.table.sheetName,

    sheetIndex:
      scoringResult.table.sheetIndex,

    table:
      scoringResult.table,

    headerRowIndex:
      scoringResult.header
        .headerRowIndex,

    headerMatches:
      scoringResult.header.matches,

    columnMap:
      scoringResult.header.columnMap,

    score:
      scoringResult.score,

    confidence:
      scoringResult.confidence,

    estimatedItemCount:
      scoringResult.metrics
        .validDataRowCount,

    scoreReasons:
      scoringResult.reasons,

    warnings:
      scoringResult.warnings,
  };
};

const convertImportWarnings = (
  warnings: Array<{
    sourceRowIndex: number;
    message: string;
  }>,
): string[] => {
  return warnings.map(
    (warning) =>
      `Excel ${warning.sourceRowIndex}행: ${warning.message}`,
  );
};

/**
 * File 또는 ArrayBuffer를 모두 지원합니다.
 *
 * 사용 예:
 *
 * await parseBomWorkbook(file)
 *
 * await parseBomWorkbook(
 *   await file.arrayBuffer()
 * )
 */
export const parseBomWorkbook = async (
  source: File | ArrayBuffer,
  options: BomImportOptions = {},
): Promise<ParsedBomWorkbookResult> => {
  const config: Required<BomImportOptions> =
    {
      ...DEFAULT_BOM_IMPORT_OPTIONS,
      ...options,
    };

  const buffer =
    source instanceof File
      ? await source.arrayBuffer()
      : source;

  /**
   * 1. Workbook 전체 시트 스캔
   */
  const sheets =
    scanWorkbookFromBuffer(buffer);

  /**
   * 2. 각 시트의 표 후보 탐색
   */
  const tables =
    detectWorkbookTables(sheets);

  /**
   * 3. 각 표의 헤더 분석
   */
  const headerCandidates =
    matchWorkbookTableHeaders(
      tables,
    );

  /**
   * 4. BOM 가능성 점수 계산
   */
  const allScoredCandidates =
    scoreBomCandidates(
      headerCandidates,
    );

  /**
   * 5. 최소 점수 필터 및 최대 후보 수 제한
   */
  const scoredCandidates =
    allScoredCandidates
      .filter(
        (candidate) =>
          candidate.score >=
          config.minimumCandidateScore,
      )
      .slice(
        0,
        config.maxCandidates,
      );

  const selectedScoringResult =
    scoredCandidates[0];

  if (!selectedScoringResult) {
    throw new Error(
      "업로드한 Excel에서 BOM으로 판단할 수 있는 표를 찾지 못했습니다.",
    );
  }

  /**
   * 6. 표준 ImportedBomItem[] 생성
   */
  const imported =
    importBomCandidate(
      selectedScoringResult,
    );

  const candidates =
    scoredCandidates.map(
      convertToBomCandidate,
    );

  const selectedCandidate =
    candidates[0];

  const warnings = [
    ...selectedCandidate.warnings,

    ...convertImportWarnings(
      imported.warnings,
    ),
  ];

  return {
    selectedCandidate,
    candidates,

    items:
      imported.items,

    warnings,

    /**
     * 기존 페이지 호환용 값입니다.
     */
    sheetName:
      selectedCandidate.sheetName,

    /**
     * Excel 사용자 표시 행 번호는 1부터 시작합니다.
     */
    headerRowNumber:
      selectedCandidate
        .headerRowIndex + 1,
  };
};

export default parseBomWorkbook;