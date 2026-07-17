export type BomFieldKey =
  | "partNo"
  | "partName"
  | "quantity"
  | "material"
  | "specification"
  | "unitPrice"
  | "memo";

export type BomColumnMap = Partial<
  Record<BomFieldKey, number>
>;

export type WorkbookCellValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export type WorkbookRow =
  WorkbookCellValue[];

export type ImportedBomItem = {
  tempId: string;

  /**
   * 원본 엑셀 위치
   */
  sourceSheetName: string;
  sourceRowNumber: number;

  /**
   * BOM 기본 데이터
   */
  partNo: string;
  partName: string;
  quantity: number;

  /**
   * 선택 데이터
   */
  material: string;
  specification: string;
  unitPrice: number | null;
  memo: string;

  /**
   * 향후 품목별 CAD/PDF/STEP 연결
   */
  files: File[];
};

export type WorkbookSheetData = {
  sheetName: string;
  sheetIndex: number;
  rows: WorkbookRow[];

  /**
   * 실제 데이터가 존재하는 범위
   */
  firstNonEmptyRowIndex: number | null;
  lastNonEmptyRowIndex: number | null;
  firstNonEmptyColumnIndex: number | null;
  lastNonEmptyColumnIndex: number | null;
};

export type DetectedTable = {
  id: string;

  sheetName: string;
  sheetIndex: number;

  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;

  rows: WorkbookRow[];
};

export type HeaderMatch = {
  field: BomFieldKey;
  columnIndex: number;

  /**
   * 원본 헤더 문자열
   */
  headerText: string;

  /**
   * 0~1 사이의 인식 신뢰도
   */
  confidence: number;

  /**
   * 인식 사유
   */
  matchedAlias?: string;
};

export type BomCandidate = {
  id: string;

  sheetName: string;
  sheetIndex: number;

  table: DetectedTable;

  headerRowIndex: number;
  headerMatches: HeaderMatch[];
  columnMap: BomColumnMap;

  /**
   * BOM 후보 종합 점수
   */
  score: number;

  /**
   * 0~1 사이의 사용자 표시용 신뢰도
   */
  confidence: number;

  estimatedItemCount: number;

  /**
   * 점수 계산 근거
   */
  scoreReasons: string[];

  /**
   * 품번·품명·수량 등 누락 정보
   */
  warnings: string[];
};

export type BomImportResult = {
  selectedCandidate: BomCandidate;

  /**
   * 사용자가 다른 표를 선택할 수 있도록
   * 높은 점수순 후보를 함께 반환
   */
  candidates: BomCandidate[];

  items: ImportedBomItem[];

  warnings: string[];
};

export type BomImportOptions = {
  /**
   * 결과에 포함할 최대 후보 수
   */
  maxCandidates?: number;

  /**
   * BOM 후보로 인정할 최소 점수
   */
  minimumCandidateScore?: number;

  /**
   * 표 탐색 시 허용할 연속 빈 행 수
   */
  maximumEmptyRowGap?: number;

  /**
   * 표 탐색 시 허용할 연속 빈 열 수
   */
  maximumEmptyColumnGap?: number;
};

export const DEFAULT_BOM_IMPORT_OPTIONS: Required<BomImportOptions> =
  {
    maxCandidates: 5,
    minimumCandidateScore: 40,
    maximumEmptyRowGap: 2,
    maximumEmptyColumnGap: 2,
  };