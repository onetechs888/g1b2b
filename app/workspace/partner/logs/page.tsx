import Link from "next/link";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

type LogsPageProps = {
  searchParams?: Promise<{
    project?: string;
    type?: string;
  }>;
};

const LOG_TABS = [
  { label: "전체", value: "all" },
  { label: "생산", value: "production" },
  { label: "품질", value: "qc" },
  { label: "NCR", value: "ncr" },
  { label: "출하", value: "shipment" },
  { label: "정산", value: "settlement" },
  { label: "문서", value: "document" },
];

function safeText(value: any) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTypeLabel(type: string) {
  if (type === "production") return "생산";
  if (type === "qc") return "품질";
  if (type === "ncr") return "NCR";
  if (type === "shipment") return "출하";
  if (type === "settlement") return "정산";
  if (type === "document") return "문서";
  if (type === "system") return "시스템";
  return safeText(type);
}

function getTypeBadgeClass(type: string) {
  if (type === "production") return "bg-emerald-50 text-emerald-600";
  if (type === "qc") return "bg-purple-50 text-purple-600";
  if (type === "ncr") return "bg-red-50 text-red-600";
  if (type === "shipment") return "bg-orange-50 text-orange-600";
  if (type === "settlement") return "bg-cyan-50 text-cyan-600";
  if (type === "document") return "bg-blue-50 text-blue-600";
  return "bg-slate-100 text-slate-600";
}

function getActionLabel(action: string) {
  if (action === "production_process_change") return "생산 상태 변경";
  if (action === "production_qc_requested") return "검수요청";
  if (action === "qc_status_change") return "검사 상태 변경";
  if (action === "qc_failed_to_production") return "NCR 생산 이관";
  if (action === "qc_failed_to_sales") return "NCR 영업 이관";
  if (action === "ncr_status_change") return "NCR 상태 변경";
  if (action === "ncr_reinspection_requested") return "재검사 요청";
  if (action === "shipment_status_change") return "출하 상태 변경";
  if (action === "settlement_status_change") return "정산 상태 변경";
  if (action === "document_uploaded") return "문서 업로드";
  return safeText(action);
}

function getTabHref(projectCode: string | undefined, type: string) {
  const params = new URLSearchParams();

  if (projectCode) {
    params.set("project", projectCode);
  }

  if (type !== "all") {
    params.set("type", type);
  }

  const query = params.toString();

  return query ? `/workspace/partner/logs?${query}` : "/workspace/partner/logs";
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  const selectedProjectCode = params?.project;
  const selectedType = params?.type ?? "all";

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

  const { data: histories, error: historyError } = bomIds.length
    ? await supabase
        .from("workflow_status_histories")
        .select("*")
        .in("bom_item_id", bomIds)
        .order("changed_at", { ascending: false })
    : { data: [], error: null };

  const { data: activityLogs, error: activityError } = selectedProject?.id
    ? await supabase
        .from("activity_logs")
        .select("*")
        .eq("project_id", selectedProject.id)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (bomError || historyError || activityError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          이력 데이터를 불러오지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const bomMap = new Map();

  bomItems?.forEach((item) => {
    bomMap.set(String(item.id), item);
  });

  const historyRows =
    histories?.map((history) => {
      const bom = bomMap.get(String(history.bom_item_id));
      const type = safeText(history.workflow_type ?? "system");
      const fromStatus = safeText(history.from_status);
      const toStatus = safeText(history.to_status);

      return {
        id: `history-${safeText(history.id)}`,
        source_id: safeText(history.id),
        source: "workflow",
        type,
        type_label: getTypeLabel(type),
        part_number: safeText(bom?.part_number),
        part_name: safeText(bom?.part_name),
        drawing_no: safeText(bom?.drawing_no),
        event: `${fromStatus} → ${toStatus}`,
        memo: safeText(history.memo),
        before_value: fromStatus,
        after_value: toStatus,
        created_at: history.changed_at ?? history.created_at ?? null,
        actor: safeText(history.changed_by),
        target_area: getTypeLabel(type),
      };
    }) ?? [];

  const activityRows =
    activityLogs?.map((log) => {
      const bom = log.bom_item_id ? bomMap.get(String(log.bom_item_id)) : null;
      const type = safeText(log.target_type ?? "system");
      const action = safeText(log.action);

      return {
        id: `activity-${safeText(log.id)}`,
        source_id: safeText(log.id),
        source: "activity",
        type,
        type_label: getTypeLabel(type),
        part_number: safeText(bom?.part_number),
        part_name: safeText(bom?.part_name),
        drawing_no: safeText(bom?.drawing_no),
        event: getActionLabel(action),
        memo: safeText(log.memo),
        before_value: safeText(log.before_value),
        after_value: safeText(log.after_value),
        created_at: log.created_at ?? null,
        actor: safeText(log.user_id ?? log.created_by ?? "시스템"),
        target_area: getTypeLabel(type),
      };
    }) ?? [];

  const allRows = [...historyRows, ...activityRows].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;

    return bTime - aTime;
  });

  const rows =
    selectedType === "all"
      ? allRows
      : allRows.filter((row) => row.type === selectedType);

  const totalCount = allRows.length;
  const productionCount = allRows.filter((row) => row.type === "production").length;
  const qcCount = allRows.filter((row) => row.type === "qc").length;
  const ncrCount = allRows.filter((row) => row.type === "ncr").length;
  const shipmentCount = allRows.filter((row) => row.type === "shipment").length;
  const settlementCount = allRows.filter((row) => row.type === "settlement").length;
  const documentCount = allRows.filter((row) => row.type === "document").length;

  const selectedRow = rows[0];

  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm font-black text-slate-500">
              이력관리 &gt; 이력 목록
            </div>

            <h1 className="mt-2 text-2xl font-black text-slate-950">
              이력관리
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              프로젝트 기준 생산, 품질, NCR, 출하, 정산, 문서 이력을 통합
              조회합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              프로젝트명, 품목명, 이벤트 검색
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
              <div className="text-xs font-bold text-slate-500">전체 이력</div>
              <div className="mt-2 text-2xl font-black text-slate-950">
                {totalCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">생산</div>
              <div className="mt-2 text-2xl font-black text-emerald-600">
                {productionCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">품질/NCR</div>
              <div className="mt-2 text-2xl font-black text-purple-600">
                {qcCount + ncrCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">출하</div>
              <div className="mt-2 text-2xl font-black text-orange-600">
                {shipmentCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">정산</div>
              <div className="mt-2 text-2xl font-black text-cyan-600">
                {settlementCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">문서</div>
              <div className="mt-2 text-2xl font-black text-blue-600">
                {documentCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {LOG_TABS.map((tab) => {
            const active = selectedType === tab.value;

            return (
              <Link
                key={tab.value}
                href={getTabHref(selectedProject?.project_code, tab.value)}
                className={[
                  "rounded-xl px-5 py-2.5 text-sm font-black transition",
                  active
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-[1fr_340px] gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-lg font-black text-slate-950">
                통합 이력 목록
              </div>

              <div className="text-sm font-bold text-slate-500">
                표시 {rows.length}건 / 전체 {totalCount}건
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black text-slate-500">
                  <tr>
                    <th className="px-4 py-3">일시</th>
                    <th className="px-4 py-3">구분</th>
                    <th className="px-4 py-3">품목 / 도면</th>
                    <th className="px-4 py-3">이벤트</th>
                    <th className="px-4 py-3">변경내용</th>
                    <th className="px-4 py-3">메모</th>
                    <th className="px-4 py-3">관련영역</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.length ? (
                    rows.map((row) => (
                      <tr key={row.id} className="hover:bg-blue-50">
                        <td className="px-4 py-3 font-bold text-slate-600">
                          {formatDateTime(row.created_at)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-black ${getTypeBadgeClass(
                              row.type
                            )}`}
                          >
                            {row.type_label}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-black text-slate-950">
                            {row.part_number}
                          </div>
                          <div className="text-xs font-medium text-slate-500">
                            {row.part_name}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-800">
                          {row.event}
                        </td>

                        <td className="px-4 py-3 text-xs font-bold text-slate-600">
                          {row.before_value} → {row.after_value}
                        </td>

                        <td className="px-4 py-3 text-xs font-medium text-slate-500">
                          {row.memo}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-700">
                          {row.target_area}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm font-bold text-slate-400"
                      >
                        선택한 구분의 이력 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black text-slate-950">
                최근 이력 상세
              </h2>

              {selectedRow ? (
                <div className="mt-5 space-y-4 text-sm">
                  <div>
                    <div className="text-xs font-bold text-slate-500">구분</div>
                    <div
                      className={`mt-2 inline-flex rounded-lg px-2 py-1 text-xs font-black ${getTypeBadgeClass(
                        selectedRow.type
                      )}`}
                    >
                      {selectedRow.type_label}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-500">일시</div>
                    <div className="mt-1 font-bold text-slate-950">
                      {formatDateTime(selectedRow.created_at)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-500">
                      품목 / 도면
                    </div>
                    <div className="mt-1 font-black text-slate-950">
                      {selectedRow.part_number} / {selectedRow.part_name}
                    </div>
                    <div className="mt-1 text-xs font-medium text-slate-500">
                      {selectedRow.drawing_no}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-500">
                      이벤트
                    </div>
                    <div className="mt-1 font-bold text-slate-950">
                      {selectedRow.event}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-bold text-slate-500">
                      변경내용
                    </div>
                    <div className="mt-2 font-black text-slate-950">
                      {selectedRow.before_value} → {selectedRow.after_value}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-500">메모</div>
                    <div className="mt-1 font-medium text-slate-700">
                      {selectedRow.memo}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-500">
                      담당자
                    </div>
                    <div className="mt-1 font-bold text-slate-950">
                      {selectedRow.actor}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-sm font-bold text-slate-400">
                  표시할 이력이 없습니다.
                </div>
              )}
            </section>

            <section className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              이력관리는 workflow_status_histories와 activity_logs를 통합해
              표시합니다.
            </section>
          </aside>
        </div>
      </div>
    </WorkspaceLayout>
  );
}