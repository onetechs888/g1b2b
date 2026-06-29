import Link from "next/link";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

type SettlementWorkspacePageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeSettlementStatus(status: string) {
  if (status === "shipment_completed") return "pending";
  if (status === "completed") return "paid";
  return status ?? "pending";
}

function getSettlementStatusLabel(status: string) {
  const normalized = normalizeSettlementStatus(status);

  if (normalized === "pending") return "정산대기";
  if (normalized === "invoiced") return "청구완료";
  if (normalized === "scheduled") return "입금예정";
  if (normalized === "paid") return "입금완료";
  if (normalized === "hold") return "보류";
  return normalized ?? "-";
}

function getSettlementStatusBadgeClass(status: string) {
  const normalized = normalizeSettlementStatus(status);

  if (normalized === "pending") return "bg-slate-100 text-slate-700";
  if (normalized === "invoiced") return "bg-blue-50 text-blue-600";
  if (normalized === "scheduled") return "bg-cyan-50 text-cyan-600";
  if (normalized === "paid") return "bg-emerald-50 text-emerald-600";
  if (normalized === "hold") return "bg-orange-50 text-orange-600";

  return "bg-slate-50 text-slate-600";
}

export default async function SettlementWorkspacePage({
  searchParams,
}: SettlementWorkspacePageProps) {
  const params = await searchParams;
  const selectedProjectCode = params?.project;
  const isAllProjects = !selectedProjectCode || selectedProjectCode === "all";

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
    !isAllProjects &&
    projects?.some((project) => project.project_code === selectedProjectCode)
      ? projects.find((project) => project.project_code === selectedProjectCode)
      : null;

  let bomQuery = supabase
    .from("bom_items")
    .select("*")
    .order("part_number", { ascending: true });

  if (!isAllProjects && selectedProject?.id) {
    bomQuery = bomQuery.eq("project_id", selectedProject.id);
  }

  const { data: bomItems, error: bomError } = await bomQuery;

  const bomIds = bomItems?.map((item) => item.id) ?? [];

  const { data: shipments, error: shipmentError } = bomIds.length
    ? await supabase
        .from("shipments")
        .select("*")
        .in("bom_item_id", bomIds)
        .eq("shipment_status", "completed")
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  const shipmentIds = shipments?.map((shipment) => shipment.id) ?? [];

  const { data: settlements, error: settlementError } = shipmentIds.length
    ? await supabase
        .from("settlements")
        .select("*")
        .in("shipment_id", shipmentIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  let activityLogQuery = supabase
    .from("activity_logs")
    .select("*")
    .eq("target_type", "settlement")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!isAllProjects && selectedProject?.id) {
    activityLogQuery = activityLogQuery.eq("project_id", selectedProject.id);
  }

  const { data: activityLogs } = await activityLogQuery;

  if (bomError || shipmentError || settlementError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          정산 데이터를 불러오지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const bomMap = new Map<string, any>();
  bomItems?.forEach((item) => {
    bomMap.set(String(item.id), item);
  });

  const settlementMap = new Map<string, any>();
  settlements?.forEach((settlement) => {
    settlementMap.set(String(settlement.shipment_id), settlement);
  });

  const settlementTargetRows =
    shipments?.map((shipment) => {
      const bom = bomMap.get(String(shipment.bom_item_id));
      const settlement = settlementMap.get(String(shipment.id));

      const quantity = getNumber(bom?.quantity);
      const unitPrice = getNumber(bom?.unit_price);
      const supplyAmount = quantity * unitPrice;
      const vatAmount = Math.round(supplyAmount * 0.1);
      const totalAmount = supplyAmount + vatAmount;

      const rawStatus =
        settlement?.status ??
        settlement?.settlement_status ??
        "pending";

      const settlementStatus = normalizeSettlementStatus(rawStatus);

      const paidAmount =
        getNumber(settlement?.paid_amount) ||
        getNumber(settlement?.payment_amount) ||
        (settlementStatus === "paid"
          ? getNumber(settlement?.total_amount) || totalAmount
          : 0);

      return {
        id: shipment.id,
        project_id: bom?.project_id ?? null,
        bom_item_id: shipment.bom_item_id,
        shipment_id: shipment.id,
        settlement_id: settlement?.id ?? null,
        part_number: bom?.part_number ?? "-",
        part_name: bom?.part_name ?? "-",
        drawing_no: bom?.drawing_no ?? "-",
        quantity,
        unit_price: unitPrice,
        supply_amount: supplyAmount,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        receivable_amount: Math.max(totalAmount - paidAmount, 0),
        settlement_status: settlementStatus,
        shipment_date: shipment.shipment_date ?? shipment.created_at ?? "-",
      };
    }) ?? [];

  const totalContractAmount =
    bomItems?.reduce((sum, item) => {
      return sum + getNumber(item.quantity) * getNumber(item.unit_price) * 1.1;
    }, 0) ?? 0;

  const totalBillingAmount = settlementTargetRows.reduce(
    (sum, row) => sum + row.total_amount,
    0
  );

  const pendingRows = settlementTargetRows.filter(
    (row) => row.settlement_status === "pending"
  );

  const invoicedRows = settlementTargetRows.filter(
    (row) => row.settlement_status === "invoiced"
  );

  const scheduledRows = settlementTargetRows.filter(
    (row) => row.settlement_status === "scheduled"
  );

  const paidRows = settlementTargetRows.filter(
    (row) => row.settlement_status === "paid"
  );

  const holdRows = settlementTargetRows.filter(
    (row) => row.settlement_status === "hold"
  );

  const pendingCount = pendingRows.length;
  const invoicedCount = invoicedRows.length;
  const scheduledCount = scheduledRows.length;
  const paidCount = paidRows.length;
  const holdCount = holdRows.length;

  const pendingAmount = pendingRows.reduce(
    (sum, row) => sum + row.total_amount,
    0
  );

  const totalPaidAmount = paidRows.reduce(
    (sum, row) => sum + row.paid_amount,
    0
  );

  const totalReceivableAmount = settlementTargetRows
    .filter(
      (row) =>
        row.receivable_amount > 0 &&
        (row.settlement_status === "invoiced" ||
          row.settlement_status === "scheduled")
    )
    .reduce((sum, row) => sum + row.receivable_amount, 0);

  const completionRate = settlementTargetRows.length
    ? Math.round((paidCount / settlementTargetRows.length) * 100)
    : 0;

  const recentSettlementRows = settlementTargetRows.slice(0, 5);

  const receivableRows = settlementTargetRows
    .filter(
      (row) =>
        row.receivable_amount > 0 &&
        (row.settlement_status === "invoiced" ||
          row.settlement_status === "scheduled")
    )
    .sort((a, b) => b.receivable_amount - a.receivable_amount)
    .slice(0, 5);

  const progressRows = [
    { label: "정산대기", count: pendingCount, color: "bg-slate-500" },
    { label: "청구완료", count: invoicedCount, color: "bg-blue-600" },
    { label: "입금예정", count: scheduledCount, color: "bg-cyan-500" },
    { label: "입금완료", count: paidCount, color: "bg-emerald-500" },
    { label: "보류", count: holdCount, color: "bg-orange-500" },
  ];

  const settlementItemsHref = `/workspace/partner/settlement/items?project=${
    isAllProjects ? "all" : selectedProject?.project_code ?? "all"
  }`;

  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-950">
              정산관리 WORKSPACE
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              출하완료 품목 기준으로 현재 정산 대상을 관리합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              프로젝트명, 품목명, 도면번호 검색
            </div>

            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              필터
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-[240px_repeat(6,1fr)] items-center gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500">
                프로젝트 (PO)
              </div>

              <div className="mt-3">
                <ProjectSelector
                  projects={[
                    { id: "all", name: "전체 프로젝트" },
                    ...(projects?.map((project) => ({
                      id: project.project_code,
                      name: `${project.project_code} / ${project.project_name}`,
                    })) ?? []),
                  ]}
                />
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                총 계약금액
              </div>
              <div className="mt-2 text-xl font-black text-slate-950">
                {formatMoney(totalContractAmount)}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                총 청구대상
              </div>
              <div className="mt-2 text-xl font-black text-blue-600">
                {formatMoney(totalBillingAmount)}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                정산대기금액
              </div>
              <div className="mt-2 text-xl font-black text-orange-600">
                {formatMoney(pendingAmount)}
              </div>
              <div className="mt-1 text-xs font-bold text-slate-400">
                {pendingCount}건
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                총 입금금액
              </div>
              <div className="mt-2 text-xl font-black text-emerald-600">
                {formatMoney(totalPaidAmount)}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">미수금액</div>
              <div className="mt-2 text-xl font-black text-red-600">
                {formatMoney(totalReceivableAmount)}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                정산완료율
              </div>
              <div className="mt-2 text-xl font-black text-slate-950">
                {completionRate}%
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">
                정산 진행 현황
              </h2>

              <Link
                href={settlementItemsHref}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                정산대상관리
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-[220px_1fr] gap-8">
              <div className="flex h-56 w-56 items-center justify-center rounded-full border-[34px] border-emerald-500">
                <div className="text-center">
                  <div className="text-4xl font-black text-slate-950">
                    {settlementTargetRows.length}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-500">
                    정산대상
                  </div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-[1fr_80px_80px] border-b border-slate-200 py-3 text-sm font-black text-slate-600">
                  <div>상태</div>
                  <div className="text-center">건수</div>
                  <div className="text-center">비율</div>
                </div>

                {progressRows.map((item) => (
                  <div
                    key={item.label}
                    className="grid grid-cols-[1fr_80px_80px] border-b border-slate-100 py-3 text-sm"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span className={`h-3 w-3 rounded-full ${item.color}`} />
                      {item.label}
                    </div>

                    <div className="text-center font-bold">{item.count}건</div>

                    <div className="text-center font-bold">
                      {settlementTargetRows.length
                        ? Math.round(
                            (item.count / settlementTargetRows.length) * 100
                          )
                        : 0}
                      %
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black text-slate-950">미수금 현황</h2>

            <div className="mt-5 divide-y divide-slate-100">
              {receivableRows.length ? (
                receivableRows.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div>
                      <div className="font-black text-slate-950">
                        {item.part_number} / {item.part_name}
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-500">
                        청구대상 {formatMoney(item.total_amount)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-red-600">
                        {formatMoney(item.receivable_amount)}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-400">
                        미수금
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-sm font-bold text-slate-400">
                  미수금 데이터가 없습니다.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950">
              최근 정산 대상 품목
            </h2>

            <Link
              href={settlementItemsHref}
              className="text-sm font-black text-blue-600"
            >
              전체 보기 →
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black text-slate-500">
                <tr>
                  <th className="px-4 py-3">품목</th>
                  <th className="px-4 py-3">출하일</th>
                  <th className="px-4 py-3">공급가액</th>
                  <th className="px-4 py-3">VAT</th>
                  <th className="px-4 py-3">합계</th>
                  <th className="px-4 py-3">상태</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentSettlementRows.length ? (
                  recentSettlementRows.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-950">
                          {item.part_number}
                        </div>
                        <div className="text-xs font-medium text-slate-500">
                          {item.part_name}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-600">
                        {item.shipment_date === "-"
                          ? "-"
                          : String(item.shipment_date).slice(0, 10)}
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-700">
                        {formatMoney(item.supply_amount)}
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-700">
                        {formatMoney(item.vat_amount)}
                      </td>

                      <td className="px-4 py-3 font-black text-slate-950">
                        {formatMoney(item.total_amount)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-black ${getSettlementStatusBadgeClass(
                            item.settlement_status
                          )}`}
                        >
                          {getSettlementStatusLabel(item.settlement_status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                    >
                      출하완료 기준 정산대상 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black text-slate-950">
            최근 정산 활동
          </h2>

          <div className="mt-5 divide-y divide-slate-100">
            {activityLogs?.length ? (
              activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <div className="font-black text-slate-950">
                      {log.action ?? "정산 활동"}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-500">
                      {log.memo ?? "-"}
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-400">
                    {log.created_at ? String(log.created_at).slice(0, 19) : "-"}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-sm font-bold text-slate-400">
                최근 정산 활동이 없습니다.
              </div>
            )}
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}