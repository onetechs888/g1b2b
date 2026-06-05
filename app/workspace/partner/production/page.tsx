import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";

import {
  productionSummary,
  bomItems,
} from "@/data/productionMockData";

export default function ProductionPage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="생산관리"
          description="BOM 기준 생산 현황을 관리합니다."
        />
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
  <div className="text-xs text-blue-600">
    선택 프로젝트
  </div>

  <div className="mt-1 text-lg font-semibold text-blue-900">
    PO-01 Chamber
  </div>
</div>

        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            title="가공대기"
            value={productionSummary.waiting}
          />

          <KpiCard
            title="가공중"
            value={productionSummary.processing}
          />

          <KpiCard
            title="후공정"
            value={productionSummary.postProcess}
          />

          <KpiCard
            title="검사대기"
            value={productionSummary.inspection}
          />
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <DataTable
columns={[
  { key: "bom_item_id", label: "품목번호" },
  { key: "item_name", label: "품목명" },
  { key: "drawing_no", label: "도면번호" },
  { key: "quantity", label: "수량" },
  { key: "current_process", label: "현재공정" },
  { key: "status", label: "상태", type: "status" },
  {
    key: "action",
    label: "액션",
    type: "link",
    hrefPrefix: "/workspace/partner/production/item/",
  },
]}
              data={bomItems}
            />
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="선택 품목 상세"
              items={[
                {
                  label: "프로젝트",
                  value: "PO-01 Chamber",
                },
                {
                  label: "Revision",
                  value: "REV-A",
                },
                {
                  label: "담당자",
                  value: "원동협",
                },
                {
                  label: "현재공정",
                  value: "가공중",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}