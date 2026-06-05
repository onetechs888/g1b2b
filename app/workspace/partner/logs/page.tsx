import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";

const activityLogs = [
  {
    activity_log_id: "LOG-001",
    project_id: "PO-01",
    bom_item_id: "BOM-001",
    action_type: "PROCESS_CHANGE",
    description: "가공대기 → 가공중",
    user_name: "원동협",
    created_at: "2026-06-05 09:00",
    status: "진행중",
  },
  {
    activity_log_id: "LOG-002",
    project_id: "PO-01",
    bom_item_id: "BOM-001",
    action_type: "QC_REQUEST",
    description: "품질검사 요청",
    user_name: "원동협",
    created_at: "2026-06-05 11:20",
    status: "완료",
  },
];

export default function LogsPage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="이력관리"
          description="생산, 품질, 출하, 문서, 정산 활동 이력을 조회합니다."
        />

        <div className="grid grid-cols-4 gap-4">
          <KpiCard title="전체 이력" value={activityLogs.length} />
          <KpiCard title="생산 이력" value={1} />
          <KpiCard title="품질 이력" value={1} />
          <KpiCard title="문서/출하 이력" value={0} />
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <DataTable
              columns={[
                { key: "activity_log_id", label: "이력번호" },
                { key: "project_id", label: "PO 번호" },
                { key: "bom_item_id", label: "BOM ID" },
                { key: "action_type", label: "활동유형" },
                { key: "description", label: "내용" },
                { key: "user_name", label: "작업자" },
                { key: "created_at", label: "일시" },
                { key: "status", label: "상태", type: "status" },
              ]}
              data={activityLogs}
            />
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="Audit Log 정책"
              items={[
                { label: "기준", value: "BOM 품목" },
                { label: "대상", value: "생산/품질/출하/문서/정산" },
                { label: "수정", value: "불가" },
                { label: "저장", value: "DB 영구보관" },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}