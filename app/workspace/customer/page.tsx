"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FolderKanban,
  History,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { useCustomerProjectDashboard } from "@/hooks/customer/useCustomerProjectDashboard";

import type {
  CustomerManufacturingStatusSummary,
  CustomerProjectActivity,
  CustomerProjectListItem,
} from "@/services/customer/projectService";

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDdayLabel(dDay: number | null) {
  if (dDay === null) return "-";
  if (dDay === 0) return "D-Day";
  if (dDay > 0) return `D-${dDay}`;

  return `D+${Math.abs(dDay)}`;
}

function getStatusClass(status: string | null) {
  switch (status) {
    case "production":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "qc":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "shipment":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "ordered":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "rfq":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "hold":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    case "completed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getTargetLabel(targetType: string) {
  switch (targetType) {
    case "production":
      return "생산";
    case "qc":
    case "quality":
      return "품질";
    case "shipment":
      return "출하";
    case "document":
      return "문서";
    case "project":
      return "프로젝트";
    case "settlement":
      return "정산";
    default:
      return targetType;
  }
}

function getActivityTitle(activity: CustomerProjectActivity) {
  if (activity.memo) {
    return activity.memo;
  }

  switch (activity.action) {
    case "production_process_change":
      return "생산 공정이 변경되었습니다.";
    case "production_status_change":
      return "생산 상태가 변경되었습니다.";
    case "qc_requested":
      return "품질 검수가 요청되었습니다.";
    case "qc_re_requested":
      return "품질 검수가 재요청되었습니다.";
    case "qc_deactivated":
      return "품질 검수 요청이 해제되었습니다.";
    case "qc_status_change":
      return "품질 상태가 변경되었습니다.";
    case "shipment_status_change":
      return "출하 상태가 변경되었습니다.";
    default:
      return activity.action.replaceAll("_", " ");
  }
}

export default function CustomerWorkspacePage() {
  const {
    dashboard,
    loading,
    error,
    refresh,
  } = useCustomerProjectDashboard();

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const projects = dashboard?.projects ?? [];
  const activities = dashboard?.activities ?? [];

  const projectMap = useMemo(() => {
    const map = new Map<string, CustomerProjectListItem>();

    projects.forEach((project) => {
      map.set(project.id, project);
    });

    return map;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return projects.filter((project) => {
      const keywordMatch =
        !normalizedKeyword ||
        (project.project_code ?? "")
          .toLowerCase()
          .includes(normalizedKeyword) ||
        project.project_name
          .toLowerCase()
          .includes(normalizedKeyword) ||
        project.partner_company_name
          .toLowerCase()
          .includes(normalizedKeyword);

      const statusMatch =
        statusFilter === "all" ||
        project.status === statusFilter;

      return keywordMatch && statusMatch;
    });
  }, [keyword, projects, statusFilter]);

  if (loading) {
    return (
      <WorkspaceLayout role="customer">
        <div className="flex min-h-[520px] items-center justify-center">
          <div className="text-center">
            <RefreshCw
              size={24}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-3 text-sm font-bold text-slate-500">
              프로젝트 현황을 불러오는 중입니다.
            </p>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <WorkspaceLayout role="customer">
        <div className="flex min-h-[520px] items-center justify-center px-6">
          <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <AlertTriangle
              size={28}
              className="mx-auto text-red-500"
            />

            <h1 className="mt-3 text-lg font-black text-red-700">
              프로젝트 현황을 불러오지 못했습니다.
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ?? "데이터를 확인할 수 없습니다."}
            </p>

            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700"
            >
              다시 불러오기
            </button>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout role="customer">
      <div className="space-y-4">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                진행 중 프로젝트
              </h1>

              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                <FolderKanban size={17} />
              </div>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              제조사의 생산 · 품질 · 출하 진행상황을 실시간으로 확인합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
          >
            <RefreshCw size={15} />
            새로고침
          </button>
        </header>

        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <ProjectListPanel
            projects={filteredProjects}
            keyword={keyword}
            statusFilter={statusFilter}
            onKeywordChange={setKeyword}
            onStatusFilterChange={setStatusFilter}
          />

          <ManufacturingStatusPanel
            status={dashboard.manufacturing_status}
          />
        </section>

        <section>
          <RecentActivityPanel
            activities={activities}
            projectMap={projectMap}
          />
        </section>
      </div>
    </WorkspaceLayout>
  );
}

function ProjectListPanel({
  projects,
  keyword,
  statusFilter,
  onKeywordChange,
  onStatusFilterChange,
}: {
  projects: CustomerProjectListItem[];
  keyword: string;
  statusFilter: string;
  onKeywordChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-base font-black text-slate-950">
            프로젝트 목록
          </h2>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            현재 제조 진행률과 납기 상태를 확인합니다.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={keyword}
              onChange={(event) =>
                onKeywordChange(event.target.value)
              }
              placeholder="프로젝트번호, 프로젝트명, 제조사"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 sm:w-[260px]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value)
            }
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="all">전체 단계</option>
            <option value="ordered">발주</option>
            <option value="production">생산</option>
            <option value="qc">품질</option>
            <option value="shipment">출하</option>
            <option value="hold">보류</option>
          </select>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex min-h-[390px] items-center justify-center">
          <p className="text-sm font-bold text-slate-400">
            조회 가능한 프로젝트가 없습니다.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <TableHeader>프로젝트</TableHeader>
                <TableHeader>제조사</TableHeader>
                <TableHeader align="center">BOM</TableHeader>
                <TableHeader align="center">현재 단계</TableHeader>
                <TableHeader>전체 진행률</TableHeader>
                <TableHeader>납기</TableHeader>
                <TableHeader align="center">상태</TableHeader>
                <TableHeader align="center">상세</TableHeader>
              </tr>
            </thead>

            <tbody>
              {projects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
        <span className="text-xs font-bold text-slate-500">
          총 {projects.length}건
        </span>

        <span className="text-[11px] font-semibold text-slate-400">
          생산 · 품질 · 출하 Monitoring
        </span>
      </div>
    </section>
  );
}

function ProjectRow({
  project,
}: {
  project: CustomerProjectListItem;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
      <TableCell>
        <div className="min-w-[200px]">
          <Link
            href={`/workspace/customer/projects/${project.id}`}
            className="font-black text-blue-700 hover:underline"
          >
            {project.project_code ?? "-"}
          </Link>

          <p className="mt-1 max-w-[230px] truncate text-xs font-bold text-slate-800">
            {project.project_name}
          </p>
        </div>
      </TableCell>

      <TableCell>
        <span className="font-bold text-slate-700">
          {project.partner_company_name}
        </span>
      </TableCell>

      <TableCell align="center">
        <span className="font-black text-slate-900">
          {project.summary.total_bom}
        </span>
      </TableCell>

      <TableCell align="center">
        <span
          className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-black ${getStatusClass(
            project.status,
          )}`}
        >
          {project.status_label}
        </span>
      </TableCell>

      <TableCell>
        <div className="w-[145px]">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800">
              {project.overall_progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${Math.min(
                  Math.max(project.overall_progress, 0),
                  100,
                )}%`,
              }}
            />
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div>
          <p className="font-bold text-slate-700">
            {formatDate(project.due_date)}
          </p>

          <p
            className={[
              "mt-1 text-xs font-black",
              project.d_day !== null &&
              project.d_day <= 7
                ? "text-orange-600"
                : "text-blue-700",
            ].join(" ")}
          >
            {getDdayLabel(project.d_day)}
          </p>
        </div>
      </TableCell>

      <TableCell align="center">
        {project.is_due_risk ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-black text-red-700">
            <AlertTriangle size={12} />
            주의
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
            <CheckCircle2 size={12} />
            정상
          </span>
        )}
      </TableCell>

      <TableCell align="center">
        <Link
          href={`/workspace/customer/projects/${project.id}`}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-blue-300 hover:text-blue-700"
        >
          보기
          <ArrowRight size={13} />
        </Link>
      </TableCell>
    </tr>
  );
}

function ManufacturingStatusPanel({
  status,
}: {
  status: CustomerManufacturingStatusSummary;
}) {
  const items = [
    {
      label: "대기",
      count: status.waiting,
      dot: "bg-slate-400",
      bar: "bg-slate-400",
    },
    {
      label: "소재입고",
      count: status.material_in,
      dot: "bg-blue-500",
      bar: "bg-blue-500",
    },
    {
      label: "소재검수",
      count: status.material_check,
      dot: "bg-cyan-500",
      bar: "bg-cyan-500",
    },
    {
      label: "가공대기",
      count: status.machining_wait,
      dot: "bg-amber-400",
      bar: "bg-amber-400",
    },
    {
      label: "가공중",
      count: status.machining,
      dot: "bg-emerald-500",
      bar: "bg-emerald-500",
    },
    {
      label: "가공완료",
      count: status.machining_done,
      dot: "bg-teal-500",
      bar: "bg-teal-500",
    },
    {
      label: "검수요청",
      count: status.qc_requested,
      dot: "bg-indigo-500",
      bar: "bg-indigo-500",
    },
    {
      label: "품질검수",
      count: status.qc_inspecting,
      dot: "bg-violet-500",
      bar: "bg-violet-500",
    },
    {
      label: "출하준비",
      count: status.shipment_ready,
      dot: "bg-orange-400",
      bar: "bg-orange-400",
    },
    {
      label: "출하",
      count: status.shipped,
      dot: "bg-purple-600",
      bar: "bg-purple-600",
    },
  ];

  const maxCount = Math.max(
    1,
    ...items.map((item) => item.count),
  );

  return (
    <aside className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-black text-slate-950">
          제조 상태 현황
        </h2>

        <p className="mt-1 text-xs font-semibold text-slate-500">
          전체 진행 프로젝트의 BOM 기준
        </p>
      </div>

      <div className="space-y-3.5 p-5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${item.dot}`}
                />

                <span className="text-xs font-bold text-slate-700">
                  {item.label}
                </span>
              </div>

              <span className="text-sm font-black text-slate-950">
                {item.count}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${item.bar}`}
                style={{
                  width: `${
                    item.count === 0
                      ? 0
                      : Math.max(
                          8,
                          Math.round(
                            (item.count / maxCount) * 100,
                          ),
                        )
                  }%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 px-5 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-500">
            전체 BOM
          </span>

          <span className="font-black text-slate-900">
            {status.total_bom}개
          </span>
        </div>
      </div>
    </aside>
  );
}

function RecentActivityPanel({
  activities,
  projectMap,
}: {
  activities: CustomerProjectActivity[];
  projectMap: Map<string, CustomerProjectListItem>;
}) {
  const manufacturingActivities = activities.filter(
    (activity) =>
      activity.target_type === "production" ||
      activity.target_type === "qc" ||
      activity.target_type === "quality" ||
      activity.target_type === "shipment",
  );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-black text-slate-950">
            최근 주요 운영 이벤트
          </h2>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            제조사의 생산 · 품질 · 출하 변경 이력입니다.
          </p>
        </div>

        <History size={17} className="text-slate-400" />
      </div>

      {manufacturingActivities.length === 0 ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <p className="text-sm font-bold text-slate-400">
            최근 운영 이벤트가 없습니다.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <TableHeader>시간</TableHeader>
                <TableHeader>구분</TableHeader>
                <TableHeader>프로젝트</TableHeader>
                <TableHeader>품번 / 품명</TableHeader>
                <TableHeader>도면번호</TableHeader>
                <TableHeader>변경내용</TableHeader>
              </tr>
            </thead>

            <tbody>
              {manufacturingActivities
                .slice(0, 10)
                .map((activity) => {
                  const project = activity.project_id
                    ? projectMap.get(activity.project_id)
                    : null;

                  return (
                    <tr
                      key={activity.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                    >
                      <TableCell>
                        <span className="text-xs font-semibold text-slate-500">
                          {formatDateTime(activity.created_at)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <ActivityBadge
                          targetType={activity.target_type}
                        />
                      </TableCell>

                      <TableCell>
                        {project ? (
                          <Link
                            href={`/workspace/customer/projects/${project.id}`}
                            className="font-black text-blue-700 hover:underline"
                          >
                            {project.project_code ?? "-"}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="min-w-[180px]">
                          <p className="font-black text-slate-900">
                            {activity.part_number ?? "-"}
                          </p>

                          <p className="mt-0.5 max-w-[220px] truncate text-xs font-semibold text-slate-500">
                            {activity.part_name ?? "-"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-slate-600">
                          {activity.drawing_no ?? "-"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="font-bold text-slate-800">
                          {getActivityTitle(activity)}
                        </span>
                      </TableCell>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ActivityBadge({
  targetType,
}: {
  targetType: string;
}) {
  let Icon = ClipboardCheck;
  let className =
    "border-slate-200 bg-slate-50 text-slate-700";

  if (targetType === "production") {
    Icon = Factory;
    className =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    targetType === "qc" ||
    targetType === "quality"
  ) {
    Icon = ShieldCheck;
    className =
      "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (targetType === "shipment") {
    Icon = Truck;
    className =
      "border-orange-200 bg-orange-50 text-orange-700";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-black ${className}`}
    >
      <Icon size={12} />
      {getTargetLabel(targetType)}
    </span>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  const alignment =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-xs font-black text-slate-500 ${alignment}`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  const alignment =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <td
      className={`whitespace-nowrap px-4 py-3.5 text-sm text-slate-700 ${alignment}`}
    >
      {children}
    </td>
  );
}