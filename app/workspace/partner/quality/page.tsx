import Link from "next/link";
import {
  AlertCircle,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Timer,
} from "lucide-react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

type QualityWorkspacePageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

function getQcStatusLabel(status?: string | null) {
  if (status === "requested") return "검사요청";
  if (status === "scheduled") return "검사대기";
  if (status === "inspecting") return "검사진행중";
  if (status === "passed") return "승인완료";
  if (status === "failed") return "NCR";
  if (status === "hold") return "보류";

  if (status === "waiting") return "검사대기";
  if (status === "in_progress") return "검사진행중";
  if (status === "approved") return "승인완료";
  if (status === "ncr") return "NCR";

  return status ?? "-";
}

function getQcStatusBadgeClass(status?: string | null) {
  if (status === "requested" || status === "scheduled" || status === "waiting") {
    return "bg-orange-50 text-orange-600";
  }

  if (status === "inspecting" || status === "in_progress") {
    return "bg-blue-50 text-blue-600";
  }

  if (status === "passed" || status === "approved") {
    return "bg-emerald-50 text-emerald-600";
  }

  if (status === "failed" || status === "ncr") {
    return "bg-red-50 text-red-600";
  }

  if (status === "hold") {
    return "bg-slate-50 text-slate-600";
  }

  return "bg-slate-50 text-slate-600";
}

function getPercent(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDateTime(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getProgressColor(label: string) {
  if (label === "검사대기") return "bg-orange-500";
  if (label === "검사진행중") return "bg-blue-600";
  if (label === "승인완료") return "bg-emerald-500";
  if (label === "NCR") return "bg-red-500";
  return "bg-slate-400";
}

export default async function QualityWorkspacePage({
  searchParams,
}: QualityWorkspacePageProps) {
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

  const { data: qcRequests, error: qcError } = bomIds.length
    ? await supabase
        .from("qc_requests")
        .select("*")
        .in("bom_item_id", bomIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  const { data: ncrReports, error: ncrError } = bomIds.length
    ? await supabase
        .from("ncr_reports")
        .select("*")
        .in("bom_item_id", bomIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  let activityQuery = supabase
    .from("activity_logs")
    .select("*")
    .eq("target_type", "qc")
    .order("created_at", { ascending: false })
    .limit(8);

  if (selectedProject?.id) {
    activityQuery = activityQuery.eq("project_id", selectedProject.id);
  }

  const { data: activityLogs } = await activityQuery;

  if (bomError || qcError || ncrError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          품질 데이터를 불러오지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const bomMap = new Map();

  bomItems?.forEach((item) => {
    bomMap.set(String(item.id), item);
  });

  const totalQcCount = qcRequests?.length ?? 0;

  const waitingCount =
    qcRequests?.filter(
      (item) =>
        item.qc_status === "requested" ||
        item.qc_status === "scheduled" ||
        item.qc_status === "waiting"
    ).length ?? 0;

  const inspectingCount =
    qcRequests?.filter(
      (item) =>
        item.qc_status === "inspecting" || item.qc_status === "in_progress"
    ).length ?? 0;

  const passedCount =
    qcRequests?.filter(
      (item) => item.qc_status === "passed" || item.qc_status === "approved"
    ).length ?? 0;

  const failedStatusCount =
    qcRequests?.filter(
      (item) => item.qc_status === "failed" || item.qc_status === "ncr"
    ).length ?? 0;

  const ncrCount = Math.max(ncrReports?.length ?? 0, failedStatusCount);

  const priorityCount =
    qcRequests?.filter((item) => item.priority === true).length ?? 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const delayedCount =
    qcRequests?.filter((item) => {
      if (!item.inspection_date) return false;

      const inspectionDate = new Date(item.inspection_date);
      inspectionDate.setHours(0, 0, 0, 0);

      return (
        inspectionDate < today &&
        (item.qc_status === "requested" ||
          item.qc_status === "scheduled" ||
          item.qc_status === "waiting" ||
          item.qc_status === "inspecting" ||
          item.qc_status === "in_progress")
      );
    }).length ?? 0;

  const progressRows = [
    { label: "검사대기", count: waitingCount },
    { label: "검사진행중", count: inspectingCount },
    { label: "승인완료", count: passedCount },
    { label: "NCR", count: ncrCount },
  ];

  const recentInspectionRows =
    qcRequests?.map((request) => {
      const bom = bomMap.get(String(request.bom_item_id));

      return {
        id: request.id,
        part_number: bom?.part_number ?? "-",
        part_name: bom?.part_name ?? "-",
        drawing_no: bom?.drawing_no ?? "-",
        status: request.qc_status,
        status_label: getQcStatusLabel(request.qc_status),
        inspection_date:
          request.inspection_date ?? request.created_at ?? request.requested_at ?? "-",
        memo: request.memo ?? "-",
      };
    }) ?? [];

  const instructionRows =
    activityLogs?.map((log) => {
      const bom = log.bom_item_id ? bomMap.get(String(log.bom_item_id)) : null;

      return {
        id: log.id,
        part_number: bom?.part_number ?? "-",
        part_name: bom?.part_name ?? log.action ?? "품질 지시사항",
        memo: log.memo ?? "-",
        status: "진행중",
        created_at: log.created_at ?? "-",
      };
    }) ?? [];

  const issueItems = [
    {
      label: "NCR 발생",
      desc: "부적합 보고서",
      count: ncrCount,
      href: `/workspace/partner/quality/ncr${
        selectedProject?.project_code ? `?project=${selectedProject.project_code}` : ""
      }`,
      color: "text-red-600 bg-red-50",
      icon: AlertCircle,
    },
    {
      label: "재검 요청",
      desc: "재검토가 필요한 항목",
      count:
        ncrReports?.filter(
          (item) => item.status === "recheck" || item.status === "reinspection"
        ).length ?? 0,
      href: `/workspace/partner/quality/inspection${
        selectedProject?.project_code ? `?project=${selectedProject.project_code}` : ""
      }`,
      color: "text-orange-600 bg-orange-50",
      icon: RotateCcw,
    },
    {
      label: "검사 지연",
      desc: "예정일 초과 항목",
      count: delayedCount,
      href: `/workspace/partner/quality/inspection${
        selectedProject?.project_code ? `?project=${selectedProject.project_code}` : ""
      }`,
      color: "text-blue-600 bg-blue-50",
      icon: Timer,
    },
    {
      label: "우선 검수 요청",
      desc: "우선 검수가 필요한 항목",
      count: priorityCount,
      href: `/workspace/partner/quality/inspection${
        selectedProject?.project_code ? `?project=${selectedProject.project_code}` : ""
      }`,
      color: "text-purple-600 bg-purple-50",
      icon: Star,
    },
  ];

  const lastUpdated = activityLogs?.[0]?.created_at
    ? formatShortDateTime(activityLogs[0].created_at)
    : "실시간 데이터 기준";

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
                품질관리 WORKSPACE
              </h1>

              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                <ShieldCheck size={18} />
              </div>
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              프로젝트 품질 현황을 한눈에 확인하고 관리합니다.
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

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[260px_repeat(5,1fr)] items-center gap-0 divide-x divide-slate-100 px-4 py-3">
            <div className="pr-4">
              <ProjectSelector
                projects={
                  projects?.map((project) => ({
                    id: project.project_code,
                    name: `${project.project_code} / ${project.project_name}`,
                  })) ?? []
                }
              />
            </div>

            <div className="px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <ClipboardCheck size={17} />
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-500">
                    전체 검사 요청
                  </div>
                  <div className="mt-0.5 text-xl font-black text-slate-950">
                    {totalQcCount}
                    <span className="ml-1 text-xs font-bold text-slate-500">
                      건
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                  <Timer size={17} />
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-500">
                    검사 대기
                  </div>
                  <div className="mt-0.5 text-xl font-black text-slate-950">
                    {waitingCount}
                    <span className="ml-1 text-xs font-bold text-slate-500">
                      건
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <CalendarCheck size={17} />
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-500">
                    검사 진행중
                  </div>
                  <div className="mt-0.5 text-xl font-black text-slate-950">
                    {inspectingCount}
                    <span className="ml-1 text-xs font-bold text-slate-500">
                      건
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={17} />
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-500">
                    승인 완료
                  </div>
                  <div className="mt-0.5 text-xl font-black text-slate-950">
                    {passedCount}
                    <span className="ml-1 text-xs font-bold text-slate-500">
                      건
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertCircle size={17} />
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-500">
                    NCR
                  </div>
                  <div className="mt-0.5 text-xl font-black text-slate-950">
                    {ncrCount}
                    <span className="ml-1 text-xs font-bold text-slate-500">
                      건
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-[3fr_2fr] gap-3">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-blue-600" />
                <h2 className="text-lg font-black text-slate-950">
                  품질 진행 현황
                </h2>
              </div>

              <Link
                href={`/workspace/partner/quality/inspection${projectQuery}`}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                전체 상태
              </Link>
            </div>

            <div className="grid grid-cols-[150px_1fr] gap-4 p-4">
              <div className="flex items-center justify-center">
                <div className="flex h-36 w-36 items-center justify-center rounded-full border-[22px] border-emerald-500">
                  <div className="text-center">
                    <div className="text-2xl font-black text-slate-950">
                      {totalQcCount}
                    </div>
                    <div className="mt-0.5 text-xs font-bold text-slate-500">
                      전체
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-[1fr_60px_70px] rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] font-black text-slate-500">
                  <div>상태</div>
                  <div className="text-center">건수</div>
                  <div className="text-center">비율</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {progressRows.map((item) => (
                    <div
                      key={item.label}
                      className="grid grid-cols-[1fr_60px_70px] items-center px-3 py-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2 font-black text-slate-800">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${getProgressColor(
                            item.label
                          )}`}
                        />
                        {item.label}
                      </div>

                      <div className="text-center font-black text-slate-950">
                        {item.count}건
                      </div>

                      <div className="text-center font-black text-slate-700">
                        {getPercent(item.count, totalQcCount)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={17} className="text-red-500" />
                <h2 className="text-lg font-black text-slate-950">
                  품질 이슈 현황
                </h2>
              </div>

              <div className="text-xs font-black text-red-500">
                전체 {issueItems.length}건
              </div>
            </div>

            <div className="g1-scroll-hide max-h-[245px] divide-y divide-slate-100 overflow-y-auto px-4 py-1">
              {issueItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 py-2.5 hover:bg-slate-50"
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${item.color}`}
                    >
                      <Icon size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-slate-950">
                        {item.label}
                      </div>
                      <div className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                        {item.desc}
                      </div>
                    </div>

                    <div className="text-xs font-black text-slate-950">
                      {item.count}건
                    </div>

                    <div className="text-slate-400">›</div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-[3fr_2fr] gap-3">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={17} className="text-blue-600" />
                <h2 className="text-lg font-black text-slate-950">
                  최근 검사 이력
                </h2>
              </div>

              <Link
                href={`/workspace/partner/quality/inspection${projectQuery}`}
                className="text-xs font-black text-blue-600"
              >
                전체 보기 →
              </Link>
            </div>

            <div className="g1-scroll-hide max-h-[245px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-black text-slate-500">
                  <tr>
                    <th className="px-4 py-3">품목</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">검사일시</th>
                    <th className="px-4 py-3">비고</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentInspectionRows.length ? (
                    recentInspectionRows.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-black text-slate-950">
                            {item.part_number}
                          </div>
                          <div className="mt-0.5 text-xs font-semibold text-slate-500">
                            {item.part_name}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-black ${getQcStatusBadgeClass(
                              item.status
                            )}`}
                          >
                            {item.status_label}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-600">
                          {formatDateTime(item.inspection_date)}
                        </td>

                        <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                          {item.memo}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                      >
                        검사 이력이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <CalendarCheck size={17} className="text-blue-600" />
                <h2 className="text-lg font-black text-slate-950">
                  품질 지시사항
                </h2>
              </div>

              <Link
                href={`/workspace/partner/logs${projectQuery}`}
                className="text-xs font-black text-blue-600"
              >
                전체 보기 →
              </Link>
            </div>

            <div className="g1-scroll-hide max-h-[245px] divide-y divide-slate-100 overflow-y-auto px-4 py-1">
              {instructionRows.length ? (
                instructionRows.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-slate-950">
                        {item.part_number} / {item.part_name}
                      </div>
                      <div className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                        {item.memo}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-600">
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm font-bold text-slate-400">
                  품질 지시사항이 없습니다.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700">
          품질 검수 관련 문의사항은 품질 담당자에게 문의하여 주시기 바랍니다.
        </div>
      </div>
    </WorkspaceLayout>
  );
}