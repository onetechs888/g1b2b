import Link from "next/link";
import {
  Box,
  CheckCircle2,
  Filter,
  MoreHorizontal,
  Package,
  PackageCheck,
  Search,
  Wrench,
} from "lucide-react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

type ProductionItemsPageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

const PROCESS_STEPS = [
  "대기",
  "소재입고",
  "소재검수",
  "내부공정",
  "외부공정",
  "검수요청",
];

function getStatusDotColor(status: string) {
  if (status === "대기") return "bg-slate-400";
  if (status === "소재입고") return "bg-blue-500";
  if (status === "소재검수") return "bg-purple-500";
  if (status === "내부공정") return "bg-emerald-500";
  if (status === "외부공정") return "bg-orange-500";
  if (status === "검수요청") return "bg-cyan-600";
  return "bg-slate-400";
}

function getStatusBadgeClass(status: string) {
  if (status === "대기") return "bg-slate-50 text-slate-600 border-slate-200";
  if (status === "소재입고") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "소재검수") return "bg-purple-50 text-purple-700 border-purple-200";
  if (status === "내부공정") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "외부공정") return "bg-orange-50 text-orange-700 border-orange-200";
  if (status === "검수요청") return "bg-cyan-50 text-cyan-700 border-cyan-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
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

function getSummaryIcon(label: string) {
  if (label === "전체 품목") return Package;
  if (label === "소재입고") return Box;
  if (label === "소재검수") return Search;
  if (label === "내부공정") return Wrench;
  if (label === "외부공정") return Wrench;
  if (label === "검수요청") return CheckCircle2;
  return PackageCheck;
}

export default async function ProductionItemsPage({
  searchParams,
}: ProductionItemsPageProps) {
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

  if (bomError || productionError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          품목별 생산 데이터를 불러오지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const productionMap = new Map();

  productionUpdates?.forEach((update) => {
    productionMap.set(String(update.bom_item_id), update);
  });

  const projectMap = new Map();

  projects?.forEach((project) => {
    projectMap.set(String(project.id), project);
  });

  const itemRows =
    bomItems?.map((item, index) => {
      const update = productionMap.get(String(item.id));
      const currentProcess = update?.process_step ?? item.process_type ?? "대기";
      const project = projectMap.get(String(item.project_id));

      return {
        no: index + 1,
        id: item.id,
        project_code: project?.project_code ?? "-",
        part_number: item.part_number,
        part_name: item.part_name,
        drawing_no: item.drawing_no ?? "-",
        revision: item.revision ?? "-",
        quantity: `${item.quantity ?? 0} ${item.unit ?? ""}`.trim(),
        material: item.material ?? "-",
        current_process: currentProcess,
        progress: update?.progress ?? 0,
        memo: update?.memo ?? "-",
        updated_at: update?.updated_at
          ? formatDateTime(update.updated_at)
          : item.updated_at
            ? formatDateTime(item.updated_at)
            : "-",
        manager: "원동헌",
      };
    }) ?? [];

  const totalCount = itemRows.length;

  const waitingCount = itemRows.filter((item) => item.current_process === "대기").length;
  const materialInCount = itemRows.filter((item) => item.current_process === "소재입고").length;
  const materialQcCount = itemRows.filter((item) => item.current_process === "소재검수").length;
  const internalCount = itemRows.filter((item) => item.current_process === "내부공정").length;
  const externalCount = itemRows.filter((item) => item.current_process === "외부공정").length;
  const qcRequestCount = itemRows.filter((item) => item.current_process === "검수요청").length;

  const summaryItems = [
    { label: "전체 품목", value: totalCount, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "소재준비", value: waitingCount, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "소재입고", value: materialInCount, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "소재검수", value: materialQcCount, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "내부공정", value: internalCount, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "외부공정", value: externalCount, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "검수요청", value: qcRequestCount, color: "text-cyan-600", bg: "bg-cyan-50" },
  ];

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
                품목별 상세관리
              </h1>

              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                <Package size={18} />
              </div>
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              선택한 프로젝트의 품목 진행 현황을 관리할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-[300px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-400 shadow-sm">
              <span>프로젝트명, PO번호, 고객사 검색</span>
              <Search className="ml-auto text-slate-500" size={16} />
            </div>

            <button className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm">
              <Filter size={15} />
              필터
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
              G1
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[260px_repeat(7,1fr)] items-center gap-0 divide-x divide-slate-100 px-4 py-3">
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

            {summaryItems.map((item) => {
              const Icon = getSummaryIcon(item.label);

              return (
                <div key={item.label} className="px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${item.bg} ${item.color}`}
                    >
                      <Icon size={17} />
                    </div>

                    <div>
                      <div className="text-[11px] font-black text-slate-500">
                        {item.label}
                      </div>

                      <div className="mt-0.5 text-xl font-black text-slate-950">
                        {item.value}
                        <span className="ml-1 text-xs font-bold text-slate-500">
                          개
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                품목 목록 ({totalCount})
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                BOM 품목 기준으로 생산 상태와 최근 업데이트를 확인합니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-9 w-[250px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-400">
                <span>품목명, 도면번호 검색</span>
                <Search className="ml-auto text-slate-500" size={15} />
              </div>

              <button className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700">
                <Filter size={15} />
                필터
              </button>

              <Link
                href={`/workspace/partner/production${projectQuery}`}
                className="flex h-9 items-center rounded-xl bg-emerald-600 px-4 text-xs font-black text-white hover:bg-emerald-700"
              >
                Workspace
              </Link>
            </div>
          </div>

          <div className="g1-scroll-hide max-h-[560px] overflow-auto">
            <table className="w-full min-w-[1380px] text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-black text-slate-500">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">프로젝트</th>
                  <th className="px-4 py-3">품목 코드</th>
                  <th className="px-4 py-3">품목명</th>
                  <th className="px-4 py-3">도면번호</th>
                  <th className="px-4 py-3">REV.</th>
                  <th className="px-4 py-3">수량</th>
                  <th className="px-4 py-3">소재</th>
                  <th className="px-4 py-3">현재 상태</th>
                  <th className="px-4 py-3">변경</th>
                  <th className="px-4 py-3">진행률</th>
                  <th className="px-4 py-3">최근 업데이트</th>
                  <th className="px-4 py-3">담당자</th>
                  <th className="px-4 py-3 text-center">관리</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {itemRows.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-600">
                      {item.no}
                    </td>

                    <td className="px-4 py-3 font-black text-blue-700">
                      {item.project_code}
                    </td>

                    <td className="px-4 py-3 font-black text-slate-950">
                      {item.part_number}
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-800">
                      {item.part_name}
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-600">
                      {item.drawing_no}
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-700">
                      {item.revision}
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-700">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-700">
                      {item.material}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${getStatusDotColor(
                            item.current_process
                          )}`}
                        />
                        <span className="font-black text-slate-700">
                          {item.current_process}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-lg border px-3 py-1.5 text-[11px] font-black ${getStatusBadgeClass(
                          item.current_process
                        )}`}
                      >
                        {item.current_process}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-emerald-600"
                            style={{ width: `${Math.min(item.progress, 100)}%` }}
                          />
                        </div>

                        <span className="text-[11px] font-black text-slate-600">
                          {item.progress}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                      {item.updated_at}
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-700">
                      {item.manager}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/workspace/partner/production/item/${item.id}`}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          공정변경
                        </Link>

                        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {itemRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={14}
                      className="px-4 py-12 text-center text-sm font-bold text-slate-400"
                    >
                      표시할 품목이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <div className="text-xs font-bold text-slate-500">
              총 {totalCount}건
            </div>

            <div className="flex items-center gap-5">
              <div className="flex gap-4 text-xs font-bold text-slate-600">
                {PROCESS_STEPS.map((step) => (
                  <div key={step} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${getStatusDotColor(step)}`} />
                    {step}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button className="h-8 w-8 rounded-lg border border-slate-200 text-xs font-black">
                  ‹
                </button>
                <button className="h-8 w-8 rounded-lg bg-slate-950 text-xs font-black text-white">
                  1
                </button>
                <button className="h-8 w-8 rounded-lg border border-slate-200 text-xs font-black">
                  2
                </button>
                <button className="h-8 w-8 rounded-lg border border-slate-200 text-xs font-black">
                  ›
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}