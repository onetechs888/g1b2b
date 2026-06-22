import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

type SettlementPageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString()} 원`;
}

function getSettlementStatusLabel(status: string) {
  if (status === "shipment_completed") return "출하완료";
  if (status === "invoice_requested") return "세금계산서 요청";
  if (status === "invoice_issued") return "세금계산서 발행";
  if (status === "payment_scheduled") return "입금예정";
  if (status === "completed") return "정산완료";
  return status ?? "-";
}

function getSettlementStatusBadgeClass(status: string) {
  if (status === "shipment_completed") return "bg-slate-100 text-slate-700";
  if (status === "invoice_requested") return "bg-orange-50 text-orange-600";
  if (status === "invoice_issued") return "bg-blue-50 text-blue-600";
  if (status === "payment_scheduled") return "bg-purple-50 text-purple-600";
  if (status === "completed") return "bg-emerald-50 text-emerald-600";
  return "bg-slate-50 text-slate-600";
}

function getPercent(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

export default async function SettlementPage({
  searchParams,
}: SettlementPageProps) {
  const params = await searchParams;
  const selectedProjectCode = params?.project;

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .order("project_code", { ascending: true });

  if (projectError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          프로젝트 데이터를 불러오지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const selectedProject =
    selectedProjectCode &&
    projects?.some((project) => project.project_code === selectedProjectCode)
      ? projects.find((project) => project.project_code === selectedProjectCode)
      : projects?.[0];

  const { data: bomItems, error: bomError } = await supabase
    .from("bom_items")
    .select("*")
    .eq("project_id", selectedProject?.id ?? "")
    .order("part_number", { ascending: true });

  const bomIds = bomItems?.map((item) => item.id) ?? [];

  const { data: settlements, error: settlementError } = bomIds.length
    ? await supabase
        .from("settlements")
        .select("*")
        .in("bom_item_id", bomIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  const shipmentIds =
    settlements?.map((item) => item.shipment_id).filter(Boolean) ?? [];

  const { data: shipments } = shipmentIds.length
    ? await supabase
        .from("shipments")
        .select("*")
        .in("id", shipmentIds)
    : { data: [] };

  const { data: activityLogs } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("project_id", selectedProject?.id ?? "")
    .eq("target_type", "settlement")
    .order("created_at", { ascending: false })
    .limit(5);

  if (bomError || settlementError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          정산 데이터를 불러오지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const bomMap = new Map();
  bomItems?.forEach((item) => {
    bomMap.set(String(item.id), item);
  });

  const shipmentMap = new Map();
  shipments?.forEach((item) => {
    shipmentMap.set(String(item.id), item);
  });

  const rows =
    settlements?.map((settlement, index) => {
      const bom = bomMap.get(String(settlement.bom_item_id));
      const shipment = shipmentMap.get(String(settlement.shipment_id));

      return {
        no: index + 1,
        id: settlement.id,
        bom_item_id: settlement.bom_item_id,
        shipment_id: settlement.shipment_id,
        part_number: bom?.part_number ?? "-",
        part_name: bom?.part_name ?? "-",
        drawing_no: bom?.drawing_no ?? "-",
        quantity: bom?.quantity ?? 0,
        unit: bom?.unit ?? "",
        amount: settlement.amount ?? 0,
        vat: settlement.vat ?? 0,
        total_amount: settlement.total_amount ?? 0,
        status: settlement.status ?? "shipment_completed",
        invoice_no: settlement.invoice_no ?? "-",
        invoice_date: settlement.invoice_date ?? "-",
        payment_due_date: settlement.payment_due_date ?? "-",
        payment_date: settlement.payment_date ?? "-",
        shipment_date: shipment?.shipment_date ?? "-",
        tracking_number: shipment?.tracking_number ?? "-",
        memo: settlement.memo ?? "-",
        created_at: settlement.created_at ?? "-",
      };
    }) ?? [];

  const totalCount = rows.length;
  const shipmentCompletedCount = rows.filter(
    (row) => row.status === "shipment_completed"
  ).length;
  const invoiceRequestedCount = rows.filter(
    (row) => row.status === "invoice_requested"
  ).length;
  const invoiceIssuedCount = rows.filter(
    (row) => row.status === "invoice_issued"
  ).length;
  const paymentScheduledCount = rows.filter(
    (row) => row.status === "payment_scheduled"
  ).length;
  const completedCount = rows.filter((row) => row.status === "completed").length;

  const totalAmount = rows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const supplyAmount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const vatAmount = rows.reduce((sum, row) => sum + Number(row.vat || 0), 0);
  const completedAmount = rows
    .filter((row) => row.status === "completed")
    .reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const unpaidAmount = totalAmount - completedAmount;

  const progressPercent = getPercent(completedCount, totalCount);

  const recentRows = rows.slice(0, 5);

  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm font-black text-slate-500">
              정산관리 &gt; 정산 관리
            </div>

            <h1 className="mt-2 text-2xl font-black text-slate-950">
              정산관리
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              납품완료 기준 정산 현황과 세금계산서, 입금 상태를 관리합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              프로젝트명, PO번호, 고객사 검색
            </div>

            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              필터
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-[240px_repeat(4,1fr)] items-center gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500">
                프로젝트 (PO)
              </div>
              <div className="mt-3">
                <ProjectSelector
                  projects={
                    projects?.map((project) => ({
                      id: project.project_code,
                      name: `${project.project_code} / ${project.project_name}`,
                    })) ?? []
                  }
                />
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                총 공급가액
              </div>
              <div className="mt-2 text-2xl font-black text-slate-950">
                {formatMoney(supplyAmount)}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                VAT
              </div>
              <div className="mt-2 text-2xl font-black text-orange-600">
                {formatMoney(vatAmount)}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                총 정산금액
              </div>
              <div className="mt-2 text-2xl font-black text-blue-600">
                {formatMoney(totalAmount)}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                미정산금액
              </div>
              <div className="mt-2 text-2xl font-black text-red-600">
                {formatMoney(unpaidAmount)}
              </div>
              <div className="mt-1 text-xs font-bold text-blue-600">
                정산 완료율 {progressPercent}%
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-[1fr_320px] gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-72 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
                  품목명, 도면번호 검색
                </div>

                <select className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  <option>정산 상태 전체</option>
                </select>
              </div>

              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
                엑셀 다운로드
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black text-slate-500">
                  <tr>
                    <th className="px-4 py-3">No.</th>
                    <th className="px-4 py-3">품목 코드</th>
                    <th className="px-4 py-3">품목명</th>
                    <th className="px-4 py-3">도면번호</th>
                    <th className="px-4 py-3">공급가액</th>
                    <th className="px-4 py-3">VAT</th>
                    <th className="px-4 py-3">합계금액</th>
                    <th className="px-4 py-3">정산상태</th>
                    <th className="px-4 py-3">세금계산서</th>
                    <th className="px-4 py-3">입금예정일</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.length ? (
                    rows.map((row) => (
                      <tr key={row.id} className="hover:bg-blue-50">
                        <td className="px-4 py-3 font-bold text-slate-600">
                          {row.no}
                        </td>

                        <td className="px-4 py-3 font-black text-slate-950">
                          {row.part_number}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-800">
                          {row.part_name}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-600">
                          {row.drawing_no}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-700">
                          {formatMoney(row.amount)}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-700">
                          {formatMoney(row.vat)}
                        </td>

                        <td className="px-4 py-3 font-black text-blue-600">
                          {formatMoney(row.total_amount)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-black ${getSettlementStatusBadgeClass(
                              row.status
                            )}`}
                          >
                            {getSettlementStatusLabel(row.status)}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-600">
                          {row.invoice_no}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-600">
                          {row.payment_due_date}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                      >
                        정산 대상 데이터가 없습니다. 출하관리에서 납품완료 처리가 필요합니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-950">
                  정산 요약
                </h2>
                <span className="text-sm font-black text-blue-600">
                  {progressPercent}%
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  ["출하완료", shipmentCompletedCount],
                  ["세금계산서 요청", invoiceRequestedCount],
                  ["세금계산서 발행", invoiceIssuedCount],
                  ["입금예정", paymentScheduledCount],
                  ["정산완료", completedCount],
                ].map(([label, count]) => (
                  <div
                    key={String(label)}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-bold text-slate-600">{label}</span>
                    <span className="font-black text-slate-950">{count}건</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black text-slate-950">
                최근 정산 활동
              </h2>

              <div className="mt-5 divide-y divide-slate-100">
                {activityLogs?.length ? (
                  activityLogs.map((log) => (
                    <div key={log.id} className="py-3">
                      <div className="font-black text-slate-950">
                        {log.action}
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-500">
                        {log.memo ?? "-"}
                      </div>
                    </div>
                  ))
                ) : recentRows.length ? (
                  recentRows.map((row) => (
                    <div key={row.id} className="py-3">
                      <div className="font-black text-slate-950">
                        {row.part_number} / {row.part_name}
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-500">
                        {getSettlementStatusLabel(row.status)} ·{" "}
                        {formatMoney(row.total_amount)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-sm font-bold text-slate-400">
                    최근 활동이 없습니다.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black text-slate-950">바로가기</h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button className="rounded-xl bg-slate-50 p-4 text-sm font-black text-slate-700">
                  세금계산서
                </button>
                <button className="rounded-xl bg-slate-50 p-4 text-sm font-black text-slate-700">
                  입금등록
                </button>
                <button className="rounded-xl bg-slate-50 p-4 text-sm font-black text-slate-700">
                  미수금관리
                </button>
                <button className="rounded-xl bg-slate-50 p-4 text-sm font-black text-slate-700">
                  정산이력
                </button>
              </div>
            </section>
          </aside>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
          정산 데이터는 납품완료 처리된 출하 건을 기준으로 자동 생성됩니다.
        </div>
      </div>
    </WorkspaceLayout>
  );
}