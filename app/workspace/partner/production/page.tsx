import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Clock,
  Factory,
  Filter,
  ListChecks,
  RefreshCw,
  Search,
  Wrench,
} from "lucide-react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

type ProductionPageProps = {
  searchParams: Promise<{ project?: string }>;
};

function getPercent(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDday(dueDate?: string | null) {
  if (!dueDate) return "-";

  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diff = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-Day";
  return `D+${Math.abs(diff)}`;
}

function translateAction(action?: string | null) {
  if (!action) return "생산 업데이트";

  const map: Record<string, string> = {
    production_status_change: "생산 상태 변경",
    qc_requested: "검수요청 등록",
    qc_passed_shipment_ready: "출하 준비 생성",
    qc_failed_to_production: "품질 이슈 생산 공유",
    qc_failed_to_sales: "품질 이슈 영업 공유",
    qc_status_change: "품질 상태 변경",
    shipment_status_change: "출하 상태 변경",
    settlement_status_change: "정산 상태 변경",
  };

  return map[action] ?? action.replaceAll("_", " ");
}

function getStatusColor(label: string) {
  if (label === "대기") return "bg-slate-400 text-slate-600";
  if (label === "소재입고") return "bg-blue-500 text-blue-600";
  if (label === "소재검수") return "bg-cyan-500 text-cyan-600";
  if (label === "가공중") return "bg-emerald-500 text-emerald-600";
  if (label === "검수요청") return "bg-orange-500 text-orange-600";
  if (label === "QC 생성") return "bg-purple-500 text-purple-600";
  return "bg-slate-400 text-slate-600";
}

export default async function ProductionPage({
  searchParams,
}: ProductionPageProps) {
  const params = await searchParams;
  const selectedProjectCode =
    params?.project === "all" ? undefined : params?.project;

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .order("project_code", { ascending: true });

  if (projectError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          프로젝트 데이터를 불러오지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const selectedProject =
    selectedProjectCode &&
    projects?.some((project) => project.project_code === selectedProjectCode)
      ? projects.find((project) => project.project_code === selectedProjectCode)
      : null;

  let bomQuery = supabase
    .from("bom_items")
    .select("*")
    .order("part_number", { ascending: true });

  if (selectedProject?.id) {
    bomQuery = bomQuery.eq("project_id", selectedProject.id);
  }

  const { data: bomItems, error: bomError } = await bomQuery;

  const bomIds = bomItems?.map((item) => item.id) ?? [];

  const { data: productionUpdates, error: productionError } = bomIds.length
    ? await supabase
        .from("production_updates")
        .select("*")
        .in("bom_item_id", bomIds)
    : { data: [], error: null };

  const { data: qcRequests } = bomIds.length
    ? await supabase.from("qc_requests").select("*").in("bom_item_id", bomIds)
    : { data: [] };

  let activityQuery = supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  if (selectedProject?.id) {
    activityQuery = activityQuery.eq("project_id", selectedProject.id);
  }

  const { data: activityLogs } = await activityQuery;

  if (bomError || productionError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          생산 데이터를 불러오지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const productionMap = new Map();

  productionUpdates?.forEach((update) => {
    productionMap.set(String(update.bom_item_id), update);
  });

  const productionRows =
    bomItems?.map((item) => {
      const update = productionMap.get(String(item.id));
      const process = update?.process_step ?? item.process_type ?? "대기";

      return {
        id: item.id,
        part_number: item.part_number,
        part_name: item.part_name,
        drawing_no: item.drawing_no ?? "-",
        quantity: item.quantity ?? 0,
        process,
        progress: update?.progress ?? 0,
        memo: update?.memo ?? "-",
      };
    }) ?? [];

  const totalCount = productionRows.length;

  const waitingCount = productionRows.filter((item) => item.process === "대기").length;
  const materialInCount = productionRows.filter((item) => item.process === "소재입고").length;
  const materialQcCount = productionRows.filter((item) => item.process === "소재검수").length;
  const internalCount = productionRows.filter((item) => item.process === "내부공정").length;
  const externalCount = productionRows.filter((item) => item.process === "외부공정").length;
  const qcRequestCount = productionRows.filter((item) => item.process === "검수요청").length;

  const machiningCount = internalCount + externalCount;
  const qcCount = qcRequests?.length ?? 0;
  const overallProgress = getPercent(qcRequestCount, totalCount);

  const dday = selectedProject ? getDday(selectedProject?.due_date) : "-";

  const summaryItems = [
    { label: "대기", count: waitingCount, note: "생산 대기" },
    { label: "소재입고", count: materialInCount, note: "소재 입고" },
    { label: "소재검수", count: materialQcCount, note: "소재 확인" },
    { label: "가공중", count: machiningCount, note: "내부/외부" },
    { label: "검수요청", count: qcRequestCount, note: "품질 이관" },
    { label: "QC 생성", count: qcCount, note: "검사 생성" },
  ];

  const issueItems = [
    {
      type: "품질",
      title: "검수요청 대기",
      desc: "품질관리 이관 대기 품목",
      count: `${qcRequestCount}건`,
      color: "bg-orange-50 text-orange-600",
    },
    {
      type: "공정",
      title: "가공 진행중",
      desc: "내부공정 / 외부공정 진행",
      count: `${machiningCount}건`,
      color: "bg-blue-50 text-blue-600",
    },
    {
      type: "납기",
      title: selectedProject ? "납기 확인" : "전체 프로젝트 기준",
      desc: selectedProject
        ? `${formatDate(selectedProject?.due_date)} (${dday})`
        : "프로젝트별 납기는 프로젝트 목록에서 확인",
      count: selectedProject ? dday : "-",
      color:
        selectedProject && dday.startsWith("D+")
          ? "bg-red-50 text-red-600"
          : "bg-rose-50 text-rose-600",
    },
  ];

  const recentUpdates =
    activityLogs?.map((log) => ({
      title: translateAction(log.action),
      desc: log.memo ?? "-",
      time: formatDateTime(log.created_at),
    })) ?? [];

  const lastUpdated = activityLogs?.[0]?.created_at
    ? formatDateTime(activityLogs[0].created_at)
    : "실시간 데이터 기준";

  const donutStyle = {
    background: `conic-gradient(#059669 0deg ${
      overallProgress * 3.6
    }deg, #e5e7eb ${overallProgress * 3.6}deg 360deg)`,
  };

  const projectQuery = selectedProject?.project_code
    ? `?project=${selectedProject.project_code}`
    : "";

  return (
    <WorkspaceLayout>
      <style>{`
        .g1-scroll-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .g1-scroll-hide::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                생산관리 Workspace
              </h1>

              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                <Factory size={18} />
              </div>
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              생산 현황을 한눈에 확인하고 빠르게 관리할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-[300px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-400 shadow-sm">
                <span>프로젝트명, PO번호, 고객사 검색</span>
                <Search className="ml-auto text-slate-500" size={16} />
              </div>

              <button className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm">
                <Filter size={15} />
                필터
              </button>

              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200">
                <Bell size={16} />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                  {issueItems.length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <RefreshCw size={13} />
              마지막 업데이트
              <span className="text-slate-950">{lastUpdated}</span>
            </div>
          </div>
        </div>

        <ProjectSelector
          projects={
            projects?.map((project) => ({
              id: project.project_code,
              name: `${project.project_code} / ${project.project_name}`,
            })) ?? []
          }
        />

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_110px] items-center divide-x divide-slate-100 px-4 py-3">
            <div className="pr-4">
              <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                PROJECT
              </div>
              <div className="mt-1 text-base font-black text-slate-950">
                {selectedProject?.project_code ?? "전체 프로젝트"}
              </div>
              <div className="mt-0.5 text-xs font-semibold text-slate-500">
                {selectedProject?.project_name ?? "모든 프로젝트 생산 현황"}
              </div>
            </div>

            <div className="px-4">
              <div className="text-[11px] font-black text-slate-500">고객사</div>
              <div className="mt-1 text-sm font-black text-slate-950">
                {selectedProject?.customer_name ?? "전체"}
              </div>
            </div>

            <div className="px-4">
              <div className="text-[11px] font-black text-slate-500">현재 상태</div>
              <div className="mt-1">
                <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                  {selectedProject ? "생산중" : "전체조회"}
                </span>
              </div>
            </div>

            <div className="px-4">
              <div className="text-[11px] font-black text-slate-500">진행률</div>
              <div className="mt-0.5 text-xl font-black text-emerald-600">
                {overallProgress}%
              </div>
            </div>

            <div className="px-4">
              <div className="text-[11px] font-black text-slate-500">납기일</div>
              <div className="mt-1 text-xs font-black text-slate-950">
                {selectedProject ? formatDate(selectedProject?.due_date) : "-"}
              </div>
              <div className="mt-0.5 text-xs font-black text-red-500">{dday}</div>
            </div>

            <div className="pl-4">
              <Link
                href={`/workspace/partner/production/items${projectQuery}`}
                className="flex h-9 items-center justify-center rounded-xl border border-emerald-500 px-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-50"
              >
                품목별
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-[3fr_2fr] gap-3">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Wrench size={17} className="text-emerald-600" />
                <h2 className="text-lg font-black text-slate-950">생산 진행 현황</h2>
              </div>

              <div className="text-xs font-black text-slate-500">
                전체 {totalCount}개 품목 기준
              </div>
            </div>

            <div className="grid grid-cols-[150px_1fr] gap-4 p-4">
              <div className="flex items-center justify-center">
                <div
                  className="flex h-36 w-36 items-center justify-center rounded-full"
                  style={donutStyle}
                >
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-inner">
                    <div className="text-center">
                      <div className="text-[10px] font-black text-slate-500">
                        전체 진행률
                      </div>
                      <div className="mt-0.5 text-2xl font-black text-emerald-600">
                        {overallProgress}%
                      </div>
                      <div className="mt-0.5 text-xs font-bold text-slate-500">
                        {qcRequestCount} / {totalCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-[1fr_52px_58px_70px] rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] font-black text-slate-500">
                  <div>상태</div>
                  <div className="text-center">품목</div>
                  <div className="text-center">비율</div>
                  <div className="text-center">비고</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {summaryItems.map((item) => {
                    const tone = getStatusColor(item.label);
                    const barClass = tone.split(" ")[0];

                    return (
                      <div
                        key={item.label}
                        className="grid grid-cols-[1fr_52px_58px_70px] items-center px-3 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2 font-black text-slate-800">
                          <span className={`h-2.5 w-2.5 rounded-full ${barClass}`} />
                          {item.label}
                        </div>
                        <div className="text-center font-black text-slate-950">
                          {item.count}개
                        </div>
                        <div className="text-center font-black text-slate-700">
                          {getPercent(item.count, totalCount)}%
                        </div>
                        <div className="truncate text-center font-semibold text-slate-500">
                          {item.note}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <ListChecks size={17} className="text-emerald-600" />
                <h2 className="text-lg font-black text-slate-950">작업 확인</h2>
              </div>

              <Link
                href={`/workspace/partner/production/items${projectQuery}`}
                className="rounded-lg border border-emerald-500 px-3 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-50"
              >
                품목별
              </Link>
            </div>

            <div className="g1-scroll-hide max-h-[245px] divide-y divide-slate-100 overflow-y-auto px-4 py-1">
              {productionRows.slice(0, 6).map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={[
                      "rounded-lg px-2.5 py-1 text-xs font-black",
                      index === 0
                        ? "bg-red-50 text-red-600"
                        : index === 1
                          ? "bg-orange-50 text-orange-600"
                          : "bg-blue-50 text-blue-600",
                    ].join(" ")}
                  >
                    {index === 0 ? "긴급" : index === 1 ? "중요" : "일반"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-slate-950">
                      {item.part_number}
                    </div>
                    <div className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                      {item.process} / {item.part_name}
                    </div>
                  </div>

                  <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-600">
                    진행중
                  </span>
                </div>
              ))}

              {productionRows.length === 0 && (
                <div className="py-8 text-center text-sm font-bold text-slate-400">
                  표시할 생산 품목이 없습니다.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-[3fr_2fr] gap-3">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock size={17} className="text-blue-600" />
                <h2 className="text-lg font-black text-slate-950">최근 업데이트</h2>
              </div>

              <Link
                href={`/workspace/partner/logs${projectQuery}`}
                className="text-xs font-black text-blue-600"
              >
                전체 {recentUpdates.length}건
              </Link>
            </div>

            <div className="g1-scroll-hide max-h-[245px] divide-y divide-slate-100 overflow-y-auto px-4 py-1">
              {recentUpdates.length ? (
                recentUpdates.map((item, index) => (
                  <div
                    key={`${item.title}-${item.time}-${index}`}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-slate-950">
                        {item.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                        {item.desc}
                      </div>
                    </div>

                    <div className="shrink-0 text-xs font-bold text-slate-500">
                      {item.time}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm font-bold text-slate-400">
                  최근 업데이트가 없습니다.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={17} className="text-red-500" />
                <h2 className="text-lg font-black text-slate-950">위험 / 이슈</h2>
              </div>

              <div className="text-xs font-black text-red-500">
                전체 {issueItems.length}건
              </div>
            </div>

            <div className="g1-scroll-hide max-h-[245px] divide-y divide-slate-100 overflow-y-auto px-4 py-1">
              {issueItems.map((item) => (
                <div key={item.title} className="flex items-center gap-3 py-2.5">
                  <span
                    className={`w-12 rounded-lg px-2 py-1 text-center text-xs font-black ${item.color}`}
                  >
                    {item.type}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-slate-950">
                      {item.title}
                    </div>
                    <div className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                      {item.desc}
                    </div>
                  </div>

                  <div className="text-xs font-black text-red-500">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </WorkspaceLayout>
  );
}