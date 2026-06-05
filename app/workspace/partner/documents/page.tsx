import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";

import {
  documentSummary,
  documents,
} from "@/data/documentMockData";

export default function DocumentsPage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="문서관리"
          description="도면, 검사성적서, 출하문서 및 다운로드 승인 상태를 관리합니다."
        />

        <div className="grid grid-cols-4 gap-4">
          <KpiCard title="전체 문서" value={documentSummary.total} />
          <KpiCard title="도면" value={documentSummary.drawings} />
          <KpiCard title="검사/리포트" value={documentSummary.reports} />
          <KpiCard title="다운로드 승인대기" value={documentSummary.pendingDownload} />
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <DataTable
columns={[
  { key: "document_id", label: "문서번호" },
  { key: "project_id", label: "PO 번호" },
  { key: "bom_item_id", label: "BOM ID" },
  { key: "item_name", label: "품목" },
  { key: "file_name", label: "문서명" },
  { key: "file_type", label: "타입" },
  { key: "revision", label: "Revision" },
  { key: "download_status", label: "다운로드" },
  { key: "status", label: "상태", type: "status" },
]}
              data={documents}
            />
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="문서 정책"
              items={[
                { label: "도면", value: "기술 자산" },
                { label: "완료 프로젝트", value: "다운로드 제한" },
                { label: "다운로드", value: "승인 필요" },
                { label: "기록", value: "Audit Log 저장" },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}