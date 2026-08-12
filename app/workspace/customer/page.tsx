"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FolderKanban,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { useCustomerProjectDashboard } from "@/hooks/customer/useCustomerProjectDashboard";

import type {
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
    case "completed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "hold":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    case "ordered":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "rfq":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "draft":
      return "border-slate-200 bg-slate-50 text-slate-600";
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
    case "settlement":
      return "정산";
    case "document":
      return "문서";
    case "project":
      return "프로젝트";
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
    case "qc_requested":
      return "품질 검수가 요청되었습니다.";
    case "qc_re_requested":
      return "품질 검수가 재요청되었습니다.";
    case "qc_deactivated":
      return "품질 검수 요청이 해제되었습니다.";
    default:
      return activity.action;
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
        (project.project_code ?? "").toLowerCase().includes(normalizedKeyword) ||
        project.project_name.toLowerCase().includes(normalizedKeyword) ||
        project.partner_company_name.toLowerCase().includes(normalizedKeyword);

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
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
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
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700"
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
            <div className="flex items-center gap-2">
              <FolderKanban size={23} className="text-blue-600" />

              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                진행 중 프로젝트
              </h1>
            </div>

            <p className="mt-1.5 text-sm font-semibold text-slate-500">
              현재 진행 중인 프로젝트의 생산, 품질, 출하 현황을 한눈에 확인합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
          >
            <RefreshCw size={15} />
            새로고침
          </button>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            title="전체 진행 프로젝트"
            value={dashboard.kpi.total_active_projects}
            icon={FolderKanban}
            description="현재 진행 중"
          />

          <KpiCard
            title="생산 중"
            value={dashboard.kpi.production_count}
            icon={Factory}
            description="생산 단계"
          />

          <KpiCard
            title="품질 진행"
            value={dashboard.kpi.quality_count}
            icon={ShieldCheck}
            description="품질 단계"
          />

          <KpiCard
            title="출하 중"
            value={dashboard.kpi.shipment_count}
            icon={Truck}
            description="출하 단계"
          />

          <KpiCard
            title="납기 위험"
            value={dashboard.kpi.due_risk_count}
            icon={AlertTriangle}
            description="납기 7일 이내"
            warning
          />
        </section>

        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  프로젝트 목록
                </h2>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  프로젝트를 선택하면 상세 Monitoring 화면으로 이동합니다.
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
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="프로젝트번호, 프로젝트명, 제조사 검색"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 sm:w-[300px]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="all">전체 프로젝트</option>
                  <option value="draft">등록</option>
                  <option value="rfq">RFQ</option>
                  <option value="ordered">발주</option>
                  <option value="production">생산</option>
                  <option value="qc">품질</option>
                  <option value="shipment">출하</option>
                  <option value="hold">보류</option>
                </select>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <p className="text-sm font-bold text-slate-400">
                  조회 가능한 프로젝트가 없습니다.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <TableHeader>프로젝트번호</TableHeader>
                      <TableHeader>프로젝트명</TableHeader>
                      <TableHeader>제조사</TableHeader>
                      <TableHeader align="center">BOM</TableHeader>
                      <TableHeader align="center">현재 단계</TableHeader>
                      <TableHeader>진행률</TableHeader>
                      <TableHeader>납기일</TableHeader>
                      <TableHeader align="center">D-Day</TableHeader>
                      <TableHeader align="center">위험도</TableHeader>
                      <TableHeader align="center">상세</TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProjects.map((project) => (
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
                총 {filteredProjects.length}건
              </span>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  최근 업데이트
                </h2>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Partner 운영 변경 기준
                </p>
              </div>

              <RefreshCw size={16} className="text-slate-400" />
            </div>

            {activities.length === 0 ? (
              <div className="flex min-h-[350px] items-center justify-center p-5">
                <p className="text-sm font-bold text-slate-400">
                  최근 업데이트가 없습니다.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 px-5">
                {activities.slice(0, 7).map((activity) => {
                  const project = activity.project_id
                    ? projectMap.get(activity.project_id)
                    : null;

                  return (
                    <div key={activity.id} className="py-4">
                      <div className="flex items-start gap-3">
                        <ActivityIcon targetType={activity.target_type} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-600">
                              {getTargetLabel(activity.target_type)}
                            </span>

                            <span className="truncate text-[11px] font-bold text-blue-700">
                              {project?.project_code ?? "-"}
                            </span>
                          </div>

                          <div className="mt-2">
                            <p className="truncate text-xs font-black text-slate-900">
                              {activity.part_number ?? "-"}
                              {activity.part_name
                                ? ` / ${activity.part_name}`
                                : ""}
                            </p>

                            {activity.drawing_no ? (
                              <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                                도면번호 {activity.drawing_no}
                              </p>
                            ) : null}
                          </div>

                          <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-5 text-slate-700">
                            {getActivityTitle(activity)}
                          </p>

                          <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-400">
                            <span className="truncate">
                              {project?.project_name ?? "프로젝트"}
                            </span>

                            <span className="shrink-0">
                              {formatDateTime(activity.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">
                최근 주요 운영 이벤트
              </h2>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                생산 · 품질 · 출하 단계의 변경 이력입니다.
              </p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="py-12 text-center text-sm font-bold text-slate-400">
              표시할 운영 이벤트가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <TableHeader>시간</TableHeader>
                    <TableHeader>구분</TableHeader>
                    <TableHeader>품번</TableHeader>
                    <TableHeader>품명</TableHeader>
                    <TableHeader>도면번호</TableHeader>
                    <TableHeader>이벤트</TableHeader>
                    <TableHeader>프로젝트</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {activities.slice(0, 15).map((activity) => {
                    const project = activity.project_id
                      ? projectMap.get(activity.project_id)
                      : null;

                    return (
                      <tr
                        key={activity.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <TableCell>
                          {formatDateTime(activity.created_at)}
                        </TableCell>

                        <TableCell>
                          <span className="font-black text-slate-700">
                            {getTargetLabel(activity.target_type)}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-black text-slate-900">
                            {activity.part_number ?? "-"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-bold text-slate-800">
                            {activity.part_name ?? "-"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-semibold text-slate-600">
                            {activity.drawing_no ?? "-"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-bold text-slate-900">
                            {getActivityTitle(activity)}
                          </span>
                        </TableCell>

                        <TableCell>
                          {project ? (
                            <Link
                              href={`/workspace/customer/projects/${project.id}`}
                              className="font-black text-blue-700 hover:underline"
                            >
                              {project.project_code ?? "-"} / {project.project_name}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </WorkspaceLayout>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  warning = false,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  warning?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-600">
            {title}
          </p>

          <div className="mt-3 flex items-baseline gap-1">
            <span
              className={[
                "text-3xl font-black",
                warning
                  ? "text-red-600"
                  : "text-slate-950",
              ].join(" ")}
            >
              {value}
            </span>

            <span className="text-xs font-bold text-slate-500">
              건
            </span>
          </div>

          <p className="mt-2 text-xs font-semibold text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={[
            "flex h-11 w-11 items-center justify-center rounded-xl border",
            warning
              ? "border-red-100 bg-red-50 text-red-600"
              : "border-blue-100 bg-blue-50 text-blue-600",
          ].join(" ")}
        >
          <Icon size={20} />
        </div>
      </div>
    </article>
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
        <Link
          href={`/workspace/customer/projects/${project.id}`}
          className="font-black text-blue-700 hover:underline"
        >
          {project.project_code ?? "-"}
        </Link>
      </TableCell>

      <TableCell>
        <div>
          <p className="font-black text-slate-950">
            {project.project_name}
          </p>

          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            {project.partner_company_name}
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
          className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-black ${getStatusClass(
            project.status,
          )}`}
        >
          {project.status_label}
        </span>
      </TableCell>

      <TableCell>
        <div className="w-[130px]">
          <div className="mb-1.5 flex items-center justify-between text-xs font-black">
            <span className="text-slate-700">
              {project.overall_progress}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${Math.min(
                  project.overall_progress,
                  100,
                )}%`,
              }}
            />
          </div>
        </div>
      </TableCell>

      <TableCell>
        <span className="font-bold text-slate-700">
          {formatDate(project.due_date)}
        </span>
      </TableCell>

      <TableCell align="center">
        <span
          className={[
            "font-black",
            project.d_day !== null &&
            project.d_day <= 7
              ? "text-orange-600"
              : "text-blue-700",
          ].join(" ")}
        >
          {getDdayLabel(project.d_day)}
        </span>
      </TableCell>

      <TableCell align="center">
        {project.is_due_risk ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-black text-red-700">
            <AlertTriangle size={12} />
            주의
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
            <CheckCircle2 size={12} />
            정상
          </span>
        )}
      </TableCell>

      <TableCell align="center">
        <Link
          href={`/workspace/customer/projects/${project.id}`}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-blue-300 hover:text-blue-700"
        >
          상세
          <ArrowRight size={13} />
        </Link>
      </TableCell>
    </tr>
  );
}

function ActivityIcon({
  targetType,
}: {
  targetType: string;
}) {
  let Icon = ClipboardCheck;

  if (targetType === "production") {
    Icon = Factory;
  }

  if (
    targetType === "qc" ||
    targetType === "quality"
  ) {
    Icon = ShieldCheck;
  }

  if (targetType === "shipment") {
    Icon = Truck;
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
      <Icon size={15} />
    </div>
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