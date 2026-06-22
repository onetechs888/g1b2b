import Link from "next/link";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

type ShipmentPageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

function getShipmentStatusLabel(status: string) {
  if (status === "ready") return "출하준비";
  if (status === "partial_shipped") return "부분출하";
  if (status === "shipped") return "출하완료";
  if (status === "delivered") return "납품완료";
  if (status === "completed") return "정산완료";
  return status ?? "-";
}

function getShipmentStatusBadgeClass(status: string) {
  if (status === "ready") return "bg-orange-50 text-orange-600";
  if (status === "partial_shipped") return "bg-blue-50 text-blue-600";
  if (status === "shipped") return "bg-indigo-50 text-indigo-600";
  if (status === "delivered") return "bg-emerald-50 text-emerald-600";
  if (status === "completed") return "bg-slate-100 text-slate-700";
  return "bg-slate-50 text-slate-600";
}

function getPercent(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

export default async function ShipmentWorkspacePage({
  searchParams,
}: ShipmentPageProps) {
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

  const { data: qcRequests, error: qcError } = bomIds.length
    ? await supabase
        .from("qc_requests")
        .select("*")
        .in("bom_item_id", bomIds)
        .eq("qc_status", "passed")
    : { data: [], error: null };

  const passedBomIds = qcRequests?.map((item) => item.bom_item_id) ?? [];

  const { data: shipments, error: shipmentError } = passedBomIds.length
    ? await supabase
        .from("shipments")
        .select("*")
        .in("bom_item_id", passedBomIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (bomError || qcError || shipmentError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          출하 데이터를 불러오지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const shipmentMap = new Map();

  shipments?.forEach((shipment) => {
    shipmentMap.set(String(shipment.bom_item_id), shipment);
  });

  const bomMap = new Map();

  bomItems?.forEach((item) => {
    bomMap.set(String(item.id), item);
  });

  const shipmentRows =
    passedBomIds.map((bomId, index) => {
      const bom = bomMap.get(String(bomId));
      const shipment = shipmentMap.get(String(bomId));
      const status = shipment?.shipment_status ?? "ready";

      return {
        no: index + 1,
        id: shipment?.id ?? bomId,
        bom_item_id: bomId,
        part_number: bom?.part_number ?? "-",
        part_name: bom?.part_name ?? "-",
        drawing_no: bom?.drawing_no ?? "-",
        quantity: bom?.quantity ?? 0,
        unit: bom?.unit ?? "",
        shipped_quantity: shipment?.shipped_quantity ?? 0,
        shipment_type: shipment?.shipment_type ?? "-",
        tracking_number: shipment?.tracking_number ?? "-",
        shipment_status: status,
        shipment_date: shipment?.shipment_date ?? "-",
        updated_at: shipment?.updated_at ?? shipment?.created_at ?? "-",
      };
    }) ?? [];

  const totalCount = shipmentRows.length;
  const readyCount = shipmentRows.filter(
    (item) => item.shipment_status === "ready"
  ).length;
  const partialCount = shipmentRows.filter(
    (item) => item.shipment_status === "partial_shipped"
  ).length;
  const shippedCount = shipmentRows.filter(
    (item) => item.shipment_status === "shipped"
  ).length;
  const deliveredCount = shipmentRows.filter(
    (item) => item.shipment_status === "delivered"
  ).length;
  const completedCount = shipmentRows.filter(
    (item) => item.shipment_status === "completed"
  ).length;

  const shippedOrMoreCount = shippedCount + deliveredCount + completedCount;
  const progressPercent = getPercent(shippedOrMoreCount, totalCount);

  const progressRows = [
    { label: "출하준비", count: readyCount, color: "bg-orange-500" },
    { label: "부분출하", count: partialCount, color: "bg-blue-500" },
    { label: "출하완료", count: shippedCount, color: "bg-indigo-500" },
    { label: "납품완료", count: deliveredCount, color: "bg-emerald-500" },
    { label: "정산완료", count: completedCount, color: "bg-slate-500" },
  ];

  const recentCompletedRows = shipmentRows
    .filter(
      (item) =>
        item.shipment_status === "shipped" ||
        item.shipment_status === "delivered" ||
        item.shipment_status === "completed"
    )
    .slice(0, 5);

  const upcomingRows = shipmentRows
    .filter(
      (item) =>
        item.shipment_status === "ready" ||
        item.shipment_status === "partial_shipped"
    )
    .slice(0, 5);

  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-950">
              출하관리 WORKSPACE
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              선택한 프로젝트의 출하 현황을 한눈에 확인합니다.
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
          <div className="grid grid-cols-[240px_repeat(5,1fr)] items-center gap-4">
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
              <div className="text-xs font-bold text-slate-500">출하준비</div>
              <div className="mt-2 text-2xl font-black text-orange-600">
                {readyCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">부분출하</div>
              <div className="mt-2 text-2xl font-black text-blue-600">
                {partialCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">출하완료</div>
              <div className="mt-2 text-2xl font-black text-indigo-600">
                {shippedCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">납품완료</div>
              <div className="mt-2 text-2xl font-black text-emerald-600">
                {deliveredCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">전체 대상</div>
              <div className="mt-2 text-2xl font-black text-slate-950">
                {totalCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
              <div className="mt-1 text-xs font-bold text-blue-600">
                전체 진행률 {progressPercent}%
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                출하 현황 목록
              </h2>
              <p className="mt-1 text-xs font-bold text-slate-500">
                QC 승인 완료 품목 기준
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-64 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
                품목명, 도면번호 검색
              </div>

              <Link
                href={`/workspace/partner/shipment/items?project=${
                  selectedProject?.project_code ?? ""
                }`}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
              >
                출하관리
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black text-slate-500">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">품목 코드</th>
                  <th className="px-4 py-3">품목명</th>
                  <th className="px-4 py-3">도면번호</th>
                  <th className="px-4 py-3">수량</th>
                  <th className="px-4 py-3">출하수량</th>
                  <th className="px-4 py-3">현재 상태</th>
                  <th className="px-4 py-3">송장번호</th>
                  <th className="px-4 py-3">출하일</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {shipmentRows.length ? (
                  shipmentRows.map((row) => (
                    <tr key={row.bom_item_id} className="hover:bg-blue-50">
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
                        {row.quantity} {row.unit}
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-700">
                        {row.shipped_quantity} {row.unit}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-black ${getShipmentStatusBadgeClass(
                            row.shipment_status
                          )}`}
                        >
                          {getShipmentStatusLabel(row.shipment_status)}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-600">
                        {row.tracking_number}
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-600">
                        {row.shipment_date}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/workspace/partner/shipment/items?project=${
                            selectedProject?.project_code ?? ""
                          }`}
                          className="text-sm font-black text-blue-600"
                        >
                          상세
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                    >
                      출하 대상 품목이 없습니다. QC 승인 완료 품목이 필요합니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950">
                최근 출하완료
              </h2>
              <Link
                href={`/workspace/partner/shipment/history?project=${
                  selectedProject?.project_code ?? ""
                }`}
                className="text-sm font-black text-blue-600"
              >
                전체보기 →
              </Link>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {recentCompletedRows.length ? (
                recentCompletedRows.map((item) => (
                  <div
                    key={`completed-${item.bom_item_id}`}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <div className="font-black text-slate-950">
                        {item.part_number}
                      </div>
                      <div className="text-xs font-medium text-slate-500">
                        {item.part_name}
                      </div>
                    </div>
                    <div className="text-right text-xs font-bold text-slate-500">
                      {item.shipment_date}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-sm font-bold text-slate-400">
                  출하완료 이력이 없습니다.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950">
                출하 예정 품목
              </h2>
              <Link
                href={`/workspace/partner/shipment/items?project=${
                  selectedProject?.project_code ?? ""
                }`}
                className="text-sm font-black text-blue-600"
              >
                전체보기 →
              </Link>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {upcomingRows.length ? (
                upcomingRows.map((item) => (
                  <div
                    key={`upcoming-${item.bom_item_id}`}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <div className="font-black text-slate-950">
                        {item.part_number}
                      </div>
                      <div className="text-xs font-medium text-slate-500">
                        {item.part_name}
                      </div>
                    </div>
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-black ${getShipmentStatusBadgeClass(
                        item.shipment_status
                      )}`}
                    >
                      {getShipmentStatusLabel(item.shipment_status)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-sm font-bold text-slate-400">
                  출하 예정 품목이 없습니다.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-black text-slate-950">
              전체 진행 현황
            </h2>

            <div className="mt-6 flex items-center gap-6">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border-[22px] border-blue-600">
                <div className="text-center">
                  <div className="text-3xl font-black text-slate-950">
                    {progressPercent}%
                  </div>
                  <div className="text-xs font-bold text-slate-500">
                    진행률
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                {progressRows.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <span className={`h-3 w-3 rounded-full ${item.color}`} />
                      {item.label}
                    </div>
                    <div className="font-black text-slate-950">
                      {item.count}건
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </WorkspaceLayout>
  );
}