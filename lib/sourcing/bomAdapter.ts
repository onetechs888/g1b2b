import type {
  ImportedBomItem,
} from "@/lib/bom/parseBomWorkbook";

import type {
  SourcingBomItem,
} from "@/lib/sourcing/types";

/**
 * Smart BOM Engine의 분석 결과를
 * 입찰·발주 공통 Sourcing BOM 구조로 변환합니다.
 *
 * BOM Engine은 Excel 분석에만 집중하고,
 * 파일 업로드 상태는 Sourcing 계층에서 관리합니다.
 */
export function mapImportedBomItemToSourcingBomItem(
  item: ImportedBomItem,
): SourcingBomItem {
  return {
    tempId: item.tempId,

    sourceSheetName:
      item.sourceSheetName,

    sourceRowNumber:
      item.sourceRowNumber,

    partNo:
      item.partNo ?? "",

    partName:
      item.partName ?? "",

    quantity:
      item.quantity ?? 0,

    material:
      item.material ?? "",

    specification:
      item.specification ?? "",

    unitPrice:
      item.unitPrice ?? null,

    memo: "",

    files: [],
  };
}

export function mapImportedBomItemsToSourcingBomItems(
  items: ImportedBomItem[],
): SourcingBomItem[] {
  return items.map(
    mapImportedBomItemToSourcingBomItem,
  );
}