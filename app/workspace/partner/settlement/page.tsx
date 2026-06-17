import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

function getSettlementStatusLabel(status: string) {
  if (status === "shipment_completed") return "출하완료";
  if (status === "invoice_requested") return "거래명세표 전송";
  if (status === "invoice_issued") return "세금계산서 발행";
  if (status === "payment_scheduled") return "입금예정";
  if (status === "completed") return "정산완료";
  return status ?? "-";
}

export default async function SettlementPage() {
  const { data: settlementData, error: settlementError } = await supabase
    .from("settlements")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: bomItems, error: bomError } = await supabase
    .from("bom_items")
    .select("id, project_id, part_number, part_name");

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id, project_code, project_name, due_date");

  if (settlementError || bomError || projectError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">
            정산 데이터를 불러오지 못했습니다.
          </div>

          <pre className="mt-2 whitespace-pre-wrap text-xs">
            {JSON.stringify(settlementError || bomError || projectError, null, 2)}
          </pre>
        </div>
      </WorkspaceLayout>
    );
  }

  const bomMap = new Map();

  bomItems?.forEach((item) => {
    bomMap.set(String(item.id), item);
  });

  const projectMap = new Map();

  projects?.forEach((project) => {
    projectMap.set(String(project.id), project);
  });

  const settlementRows =
    settlementData?.map((settlement) => {
      const bom = bomMap.get(String(settlement.bom_item_id));
      const project = bom ? projectMap.get(String(bom.project_id)) : null;

      return {
        id: settlement.id,
        settlement_id: settlement.id.slice(0, 8),
        project_no: project?.project_code ?? "-",
        project_name: project?.project_name ?? "-",
        due_date: project?.due_date ?? "-",
        bom_item_id: bom?.part_number ?? "-",
        item_name: bom?.part_name ?? "-",
        amount: `${Number(settlement.amount ?? 0).toLocaleString()}원`,
        vat: `${Number(settlement.vat ?? 0).toLocaleString()}원`,
        total_amount: `${Number(settlement.total_amount ?? 0).toLocaleString()}원`,
        invoice_no: settlement.invoice_no ?? "-",
        invoice_date: settlement.invoice_date ?? "-",
        payment_due_date: settlement.payment_due_date ?? "-",
        payment_date: settlement.payment_date ?? "-",
        settlement_status: getSettlementStatusLabel(settlement.status),
        status:
          settlement.status === "invoice_issued"
            ? "완료"
            : settlement.status === "shipment_completed"
              ? "대기"
              : "진행중",
      };
    }) ?? [];

  const currentProject = settlementRows[0];

  const shipmentCompletedCount = settlementRows.filter(
    (item) => item.settlement_status === "출하완료"
  ).length;

  const statementSentCount = settlementRows.filter(
    (item) => item.settlement_status === "거래명세표 전송"
  ).length;

  const invoiceIssuedCount = settlementRows.filter(
    (item) => item.settlement_status === "세금계산서 발행"
  ).length;

  const totalAmount =
    settlementData?.reduce((sum, item) => {
      return sum + Number(item.total_amount ?? 0);
    }, 0) ?? 0;

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="정산관리"
          description="출하완료 이후 거래명세표 전송 및 세금계산서 발행 상태를 관리합니다."
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">프로젝트 정보</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            {currentProject?.project_no ?? "-"} /{" "}
            {currentProject?.project_name ?? "-"}
          </div>
          <div className="mt-2 text-sm text-blue-700">
            납기일: {currentProject?.due_date ?? "-"}
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">정산관리 Workflow</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            출하완료 → 거래명세표 전송 → 세금계산서 발행
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <KpiCard title="출하완료" value={shipmentCompletedCount} />
          <KpiCard title="거래명세표 전송" value={statementSentCount} />
          <KpiCard title="세금계산서 발행" value={invoiceIssuedCount} />
        </div>

        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <DataTable
              columns={[
                { key: "settlement_id", label: "정산번호" },
                { key: "project_no", label: "프로젝트번호" },
                { key: "project_name", label: "프로젝트명" },
                { key: "bom_item_id", label: "품목번호" },
                { key: "item_name", label: "품목명" },
                { key: "amount", label: "공급가액" },
                { key: "vat", label: "VAT" },
                { key: "total_amount", label: "총금액" },
                { key: "settlement_status", label: "정산상태" },
                { key: "status", label: "상태", type: "status" },
              ]}
              data={settlementRows}
            />
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="정산 데이터"
              items={[
                { label: "프로젝트번호", value: currentProject?.project_no ?? "-" },
                { label: "프로젝트명", value: currentProject?.project_name ?? "-" },
                { label: "총 정산건수", value: settlementRows.length },
                {
                  label: "총 정산금액",
                  value: `${totalAmount.toLocaleString()}원`,
                },
                { label: "거래명세표 전송", value: statementSentCount },
                { label: "세금계산서 발행", value: invoiceIssuedCount },
                { label: "데이터 기준", value: "settlements + bom_items" },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}