import type {
  BomColumnMap,
  BomFieldKey,
  DetectedTable,
  HeaderMatch,
  WorkbookCellValue,
  WorkbookRow,
} from "./types";

export type HeaderDetectionResult = {
  /**
   * 원본 시트 기준 헤더 시작 행
   */
  headerRowIndex: number;

  /**
   * 여러 줄 헤더인 경우 마지막 헤더 행
   */
  headerEndRowIndex: number;

  /**
   * 인식된 BOM 컬럼
   */
  matches: HeaderMatch[];

  /**
   * BOM 필드와 원본 엑셀 열 번호 매핑
   */
  columnMap: BomColumnMap;

  /**
   * 헤더 인식 자체의 점수
   */
  score: number;
};

type HeaderAliasDefinition = {
  aliases: string[];

  /**
   * BOM 판단 시 중요도
   */
  weight: number;
};

const HEADER_DEFINITIONS: Record<
  BomFieldKey,
  HeaderAliasDefinition
> = {
  partNo: {
    weight: 50,
    aliases: [
      "품번",
      "부품번호",
      "부품 번호",
      "파트번호",
      "파트 번호",
      "도번",
      "도면번호",
      "도면 번호",
      "자재번호",
      "자재 번호",
      "품목번호",
      "품목 번호",
      "item code",
      "item no",
      "item number",
      "part no",
      "part number",
      "part code",
      "drawing no",
      "drawing number",
      "dwg no",
      "dwg number",
      "p/n",
      "pn",
    ],
  },

  partName: {
    weight: 50,
    aliases: [
      "품명",
      "품 명",
      "부품명",
      "부품 명",
      "파트명",
      "파트 명",
      "명칭",
      "자재명",
      "자재 명",
      "품목명",
      "품목 명",
      "item name",
      "part name",
      "description",
      "item description",
      "part description",
      "product name",
    ],
  },

  quantity: {
    weight: 35,
    aliases: [
      "수량",
      "요청수량",
      "요청 수량",
      "요구수량",
      "요구 수량",
      "발주수량",
      "발주 수량",
      "주문수량",
      "주문 수량",
      "소요수량",
      "소요 수량",
      "qty",
      "quantity",
      "order qty",
      "request qty",
      "required qty",
      "ea",
      "개수",
    ],
  },

  material: {
    weight: 12,
    aliases: [
      "재질",
      "소재",
      "재료",
      "재료명",
      "재료 명",
      "재질명",
      "재질 명",
      "material",
      "material name",
      "raw material",
    ],
  },

  specification: {
    weight: 12,
    aliases: [
      "규격",
      "사양",
      "스펙",
      "치수",
      "크기",
      "size",
      "spec",
      "specification",
      "dimension",
      "dimensions",
    ],
  },

  unitPrice: {
    weight: 5,
    aliases: [
      "단가",
      "구매단가",
      "구매 단가",
      "예상단가",
      "예상 단가",
      "견적단가",
      "견적 단가",
      "unit price",
      "price",
      "cost",
      "unit cost",
    ],
  },

  memo: {
    weight: 5,
    aliases: [
      "비고",
      "메모",
      "참고",
      "특이사항",
      "특이 사항",
      "요청사항",
      "요청 사항",
      "remark",
      "remarks",
      "memo",
      "note",
      "notes",
      "comment",
      "comments",
    ],
  },
};

/**
 * 헤더 비교를 위한 문자열 정규화
 *
 * 예:
 * Part NO\n(Dwg No.) → partnodwgno
 * 품 명 → 품명
 * 요청 수량 → 요청수량
 */
export const normalizeHeaderText = (
  value: unknown,
): string => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\r?\n/g, "")
    .replace(/&/g, "and")
    .replace(
      /[\s_\-./\\()[\]{}:;,'"`~!@#$%^*+=?|<>]/g,
      "",
    );
};

const NORMALIZED_HEADER_DEFINITIONS =
  Object.fromEntries(
    (
      Object.entries(
        HEADER_DEFINITIONS,
      ) as Array<
        [
          BomFieldKey,
          HeaderAliasDefinition,
        ]
      >
    ).map(
      ([
        field,
        definition,
      ]) => [
        field,
        {
          ...definition,
          aliases:
            definition.aliases.map(
              normalizeHeaderText,
            ),
        },
      ],
    ),
  ) as Record<
    BomFieldKey,
    HeaderAliasDefinition
  >;

/**
 * 셀 값이 헤더로 사용할 수 있는 문자열인지 확인합니다.
 */
const cellToHeaderText = (
  value: WorkbookCellValue,
): string => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (value instanceof Date) {
    return "";
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return "";
  }

  return String(value).trim();
};

/**
 * 헤더와 별칭 간 신뢰도를 계산합니다.
 *
 * 1.00: 완전 일치
 * 0.90: 헤더 안에 별칭 포함
 * 0.82: 별칭 안에 헤더 포함
 */
const calculateAliasConfidence = (
  normalizedHeader: string,
  normalizedAlias: string,
): number => {
  if (
    !normalizedHeader ||
    !normalizedAlias
  ) {
    return 0;
  }

  if (
    normalizedHeader ===
    normalizedAlias
  ) {
    return 1;
  }

  /**
   * 너무 짧은 문자열의 부분 일치는
   * 오탐 가능성이 높아 제외합니다.
   *
   * 예: no, ea, pn
   */
  const canUsePartialMatch =
    normalizedHeader.length >= 3 &&
    normalizedAlias.length >= 3;

  if (!canUsePartialMatch) {
    return 0;
  }

  if (
    normalizedHeader.includes(
      normalizedAlias,
    )
  ) {
    return 0.9;
  }

  if (
    normalizedAlias.includes(
      normalizedHeader,
    )
  ) {
    return 0.82;
  }

  return 0;
};

const findBestFieldMatch = (
  headerText: string,
): {
  field: BomFieldKey;
  confidence: number;
  matchedAlias: string;
} | null => {
  const normalizedHeader =
    normalizeHeaderText(headerText);

  if (!normalizedHeader) {
    return null;
  }

  let bestMatch: {
    field: BomFieldKey;
    confidence: number;
    matchedAlias: string;
  } | null = null;

  (
    Object.entries(
      NORMALIZED_HEADER_DEFINITIONS,
    ) as Array<
      [
        BomFieldKey,
        HeaderAliasDefinition,
      ]
    >
  ).forEach(
    ([field, definition]) => {
      definition.aliases.forEach(
        (alias) => {
          const confidence =
            calculateAliasConfidence(
              normalizedHeader,
              alias,
            );

          if (
            confidence === 0
          ) {
            return;
          }

          if (
            !bestMatch ||
            confidence >
              bestMatch.confidence
          ) {
            bestMatch = {
              field,
              confidence,
              matchedAlias:
                alias,
            };
          }
        },
      );
    },
  );

  return bestMatch;
};

/**
 * 같은 열의 여러 헤더 행을 합칩니다.
 *
 * 예:
 * 1행: Part NO
 * 2행: (Dwg No.)
 *
 * 결과:
 * Part NO (Dwg No.)
 */
const combineHeaderRows = (
  rows: WorkbookRow[],
  startRowIndex: number,
  rowCount: number,
): string[] => {
  const selectedRows = rows.slice(
    startRowIndex,
    startRowIndex +
      rowCount,
  );

  const maximumColumnCount =
    Math.max(
      0,
      ...selectedRows.map(
        (row) => row.length,
      ),
    );

  const combinedHeaders: string[] =
    [];

  for (
    let columnIndex = 0;
    columnIndex <
    maximumColumnCount;
    columnIndex += 1
  ) {
    const parts = selectedRows
      .map((row) =>
        cellToHeaderText(
          row[columnIndex],
        ),
      )
      .filter(Boolean);

    combinedHeaders[columnIndex] =
      parts.join(" ").trim();
  }

  return combinedHeaders;
};

/**
 * 한 헤더 행 또는 여러 헤더 행 조합을 분석합니다.
 */
const analyzeHeaderWindow = (
  table: DetectedTable,
  localStartRowIndex: number,
  rowCount: number,
): HeaderDetectionResult => {
  const combinedHeaders =
    combineHeaderRows(
      table.rows,
      localStartRowIndex,
      rowCount,
    );

  const rawMatches: HeaderMatch[] =
    [];

  combinedHeaders.forEach(
    (
      headerText,
      columnIndex,
    ) => {
      if (!headerText) {
        return;
      }

      const fieldMatch =
        findBestFieldMatch(
          headerText,
        );

      if (!fieldMatch) {
        return;
      }

      rawMatches.push({
        field:
          fieldMatch.field,
        columnIndex,
        headerText,
        confidence:
          fieldMatch.confidence,
        matchedAlias:
          fieldMatch.matchedAlias,
      });
    },
  );

  /**
   * 동일한 필드가 여러 열에서 발견되면
   * 가장 신뢰도가 높은 열 하나만 사용합니다.
   */
  const uniqueMatches =
    rawMatches.reduce<
      Partial<
        Record<
          BomFieldKey,
          HeaderMatch
        >
      >
    >((accumulator, match) => {
      const existing =
        accumulator[
          match.field
        ];

      if (
        !existing ||
        match.confidence >
          existing.confidence
      ) {
        accumulator[
          match.field
        ] = match;
      }

      return accumulator;
    }, {});

  const matches =
    Object.values(
      uniqueMatches,
    ).filter(
      (
        match,
      ): match is HeaderMatch =>
        Boolean(match),
    );

  const columnMap =
    matches.reduce<BomColumnMap>(
      (accumulator, match) => {
        accumulator[
          match.field
        ] =
          match.columnIndex;

        return accumulator;
      },
      {},
    );

  const score =
    matches.reduce(
      (total, match) => {
        const definition =
          HEADER_DEFINITIONS[
            match.field
          ];

        return (
          total +
          definition.weight *
            match.confidence
        );
      },
      0,
    );

  return {
    headerRowIndex:
      table.startRowIndex +
      localStartRowIndex,

    headerEndRowIndex:
      table.startRowIndex +
      localStartRowIndex +
      rowCount -
      1,

    matches,
    columnMap,
    score,
  };
};

/**
 * 결과가 더 우수한지 비교합니다.
 */
const isBetterDetection = (
  candidate: HeaderDetectionResult,
  current:
    | HeaderDetectionResult
    | null,
): boolean => {
  if (!current) {
    return true;
  }

  if (
    candidate.score !==
    current.score
  ) {
    return (
      candidate.score >
      current.score
    );
  }

  if (
    candidate.matches.length !==
    current.matches.length
  ) {
    return (
      candidate.matches.length >
      current.matches.length
    );
  }

  /**
   * 동일 점수라면 더 적은 행을 사용한
   * 단순한 헤더 구조를 우선합니다.
   */
  const candidateHeaderHeight =
    candidate.headerEndRowIndex -
    candidate.headerRowIndex;

  const currentHeaderHeight =
    current.headerEndRowIndex -
    current.headerRowIndex;

  if (
    candidateHeaderHeight !==
    currentHeaderHeight
  ) {
    return (
      candidateHeaderHeight <
      currentHeaderHeight
    );
  }

  return (
    candidate.headerRowIndex <
    current.headerRowIndex
  );
};

/**
 * 하나의 Table에서 가장 가능성이 높은
 * BOM 헤더를 탐색합니다.
 */
export const matchTableHeaders = (
  table: DetectedTable,
): HeaderDetectionResult | null => {
  if (
    table.rows.length === 0
  ) {
    return null;
  }

  /**
   * 표 상단에 제목, 결재란, 설명 등이 있을 수 있어
   * 최대 25개 행을 헤더 후보로 검사합니다.
   */
  const maximumSearchRows =
    Math.min(
      table.rows.length,
      25,
    );

  /**
   * 1줄, 2줄, 3줄 헤더를 모두 검사합니다.
   */
  const maximumHeaderDepth = 3;

  let bestDetection:
    | HeaderDetectionResult
    | null = null;

  for (
    let localRowIndex = 0;
    localRowIndex <
    maximumSearchRows;
    localRowIndex += 1
  ) {
    for (
      let rowCount = 1;
      rowCount <=
      maximumHeaderDepth;
      rowCount += 1
    ) {
      if (
        localRowIndex +
          rowCount >
        table.rows.length
      ) {
        break;
      }

      const detection =
        analyzeHeaderWindow(
          table,
          localRowIndex,
          rowCount,
        );

      if (
        detection.matches
          .length === 0
      ) {
        continue;
      }

      if (
        isBetterDetection(
          detection,
          bestDetection,
        )
      ) {
        bestDetection =
          detection;
      }
    }
  }

  return bestDetection;
};

/**
 * Workbook에서 발견된 모든 Table의
 * 헤더 분석 결과를 반환합니다.
 */
export const matchWorkbookTableHeaders = (
  tables: DetectedTable[],
): Array<{
  table: DetectedTable;
  header:
    HeaderDetectionResult;
}> => {
  return tables.flatMap(
    (table) => {
      const header =
        matchTableHeaders(
          table,
        );

      if (!header) {
        return [];
      }

      return [
        {
          table,
          header,
        },
      ];
    },
  );
};