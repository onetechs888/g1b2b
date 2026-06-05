import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";

import {
  qualitySummary,
  inspections,
} from "@/data/qualityMockData";

export default function QualityPage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="품질관리"
          description="검사 요청, 검사 진행, 승인 및 NCR을 관리합니다."
        />

        <div className="grid grid-cols-5 gap-4">
          <KpiCard title="검사요청" value={qualitySummary.requested} />
          <KpiCard title="검사대기" value={qualitySummary.waiting} />
          <KpiCard title="검사중" value={qualitySummary.inspecting} />
          <KpiCard title="승인완료" value={qualitySummary.approved} />
          <KpiCard title="NCR" value={qualitySummary.ncr} />
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <DataTable
columns={[
  { key: "qc_request_id", label: "검사번호" },
  { key: "project_id", label: "PO 번호" },
  { key: "bom_item_id", label: "BOM ID" },
  { key: "item_name", label: "품목" },
  { key: "inspection_status", label: "검사상태" },
  { key: "status", label: "상태", type: "status" },
]}
              data={inspections}
            />
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="품질 상세"
              items={[
                { label: "담당자", value: "원동협" },
                { label: "검사기준", value: "REV-A" },
                { label: "NCR 진행", value: "2건" },
                { label: "최근 검사", value: "QC-001" },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}