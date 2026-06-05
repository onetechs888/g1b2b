import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";

import {
  settlementSummary,
  settlements,
} from "@/data/settlementMockData";

export default function SettlementPage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="정산관리"
          description="세금계산서, 입금 예정, 정산 완료 상태를 관리합니다."
        />

        <div className="grid grid-cols-4 gap-4">
          <KpiCard title="입금예정" value={settlementSummary.expected} />
          <KpiCard title="계산서 발행" value={settlementSummary.invoiceIssued} />
          <KpiCard title="미수금" value={settlementSummary.unpaid} />
          <KpiCard title="정산완료" value={settlementSummary.completed} />
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <DataTable
columns={[
  { key: "settlement_id", label: "정산번호" },
  { key: "project_id", label: "PO 번호" },
  { key: "project_name", label: "프로젝트" },
  { key: "amount", label: "금액" },
  { key: "invoice_status", label: "세금계산서" },
  { key: "expected_payment_date", label: "입금예정일" },
  { key: "payment_status", label: "입금상태" },
  { key: "status", label: "상태", type: "status" },
]}
              data={settlements}
            />
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="정산 상세"
              items={[
                { label: "담당자", value: "원동협" },
                { label: "총 계약금액", value: "36,000,000원" },
                { label: "미수금", value: "1건" },
                { label: "최근 정산", value: "SET-001" },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}