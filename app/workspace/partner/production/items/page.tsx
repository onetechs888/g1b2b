import Link from "next/link";
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
  if (status === "소재검수")
    return "bg-purple-50 text-purple-700 border-purple-200";
  if (status === "내부공정")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "외부공정")
    return "bg-orange-50 text-orange-700 border-orange-200";
  if (status === "검수요청")
    return "bg-cyan-50 text-cyan-700 border-cyan-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function getPercent(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

export default async function ProductionItemsPage({
  searchParams,
}: ProductionItemsPageProps) {
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

  const { data: productionUpdates, error: productionError } = bomIds.length
    ? await supabase
        .from("production_updates")
        .select("*")
        .in("bom_item_id", bomIds)
    : { data: [], error: null };

  if (bomError || productionError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          품목별 생산 데이터를 불러오지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const productionMap = new Map();

  productionUpdates?.forEach((update) => {
    productionMap.set(String(update.bom_item_id), update);
  });

  const itemRows =
    bomItems?.map((item, index) => {
      const update = productionMap.get(String(item.id));
      const currentProcess =
        update?.process_step ?? item.process_type ?? "대기";

      return {
        no: index + 1,
        id: item.id,
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
          ? new Date(update.updated_at).toLocaleString("ko-KR")
          : item.updated_at
            ? new Date(item.updated_at).toLocaleString("ko-KR")
            : "-",
        manager: "원동헌",
      };
    }) ?? [];

  const totalCount = itemRows.length;

  const waitingCount = itemRows.filter(
    (item) => item.current_process === "대기"
  ).length;

  const materialInCount = itemRows.filter(
    (item) => item.current_process === "소재입고"
  ).length;

  const materialQcCount = itemRows.filter(
    (item) => item.current_process === "소재검수"
  ).length;

  const internalCount = itemRows.filter(
    (item) => item.current_process === "내부공정"
  ).length;

  const externalCount = itemRows.filter(
    (item) => item.current_process === "외부공정"
  ).length;

  const qcRequestCount = itemRows.filter(
    (item) => item.current_process === "검수요청"
  ).length;

  const summaryItems = [
    {
      label: "전체 품목",
      value: totalCount,
      icon: "▣",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "대기",
      value: waitingCount,
      icon: "●",
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
    {
      label: "소재입고",
      value: materialInCount,
      icon: "●",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "소재검수",
      value: materialQcCount,
      icon: "●",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "내부공정",
      value: internalCount,
      icon: "●",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "외부공정",
      value: externalCount,
      icon: "●",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "검수요청",
      value: qcRequestCount,
      icon: "●",
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
  ];

  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-950">
              품목별 상세관리
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              선택한 프로젝트의 품목 진행 현황을 관리할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              프로젝트명, PO번호, 고객사 검색
            </div>

            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              필터
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
              G1
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-[240px_repeat(7,1fr)] items-center gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500">
                프로젝트(PO)
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

            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="border-l border-slate-200 pl-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${item.bg} ${item.color} text-lg font-black`}
                  >
                    {item.icon}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-500">
                      {item.label}
                    </div>
                    <div className="mt-1 text-xl font-black text-slate-950">
                      {item.value}
                      <span className="ml-1 text-sm font-bold text-slate-500">
                        개
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                품목 목록 ({totalCount})
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                BOM 품목 기준으로 생산 상태와 최근 업데이트를 확인합니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
                품목명, 도면번호 검색
              </div>

              <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                필터
              </button>

              <Link
                href={`/workspace/partner/production?project=${
                  selectedProject?.project_code ?? ""
                }`}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
              >
                Workspace
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black text-slate-500">
                <tr>
                  <th className="px-4 py-4">No.</th>
                  <th className="px-4 py-4">품목 코드</th>
                  <th className="px-4 py-4">품목명</th>
                  <th className="px-4 py-4">도면번호</th>
                  <th className="px-4 py-4">REV.</th>
                  <th className="px-4 py-4">수량</th>
                  <th className="px-4 py-4">소재</th>
                  <th className="px-4 py-4">현재 상태</th>
                  <th className="px-4 py-4">진행률</th>
                  <th className="px-4 py-4">최근 업데이트</th>
                  <th className="px-4 py-4">담당자</th>
                  <th className="px-4 py-4 text-center">관리</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {itemRows.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-bold text-slate-600">
                      {item.no}
                    </td>

                    <td className="px-4 py-4 font-black text-slate-950">
                      {item.part_number}
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-800">
                      {item.part_name}
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-600">
                      {item.drawing_no}
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-700">
                      {item.revision}
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-700">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-700">
                      {item.material}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${getStatusDotColor(
                            item.current_process
                          )}`}
                        />
                        <span
                          className={`rounded-lg border px-3 py-1.5 text-xs font-black ${getStatusBadgeClass(
                            item.current_process
                          )}`}
                        >
                          {item.current_process}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{
                              width: `${Math.min(item.progress, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-600">
                          {item.progress}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs font-medium text-slate-600">
                      {item.updated_at}
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-700">
                      {item.manager}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <Link
                        href={`/workspace/partner/production/item/${item.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        공정변경
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {itemRows.length === 0 ? (
              <div className="p-10 text-center text-sm font-bold text-slate-400">
                표시할 품목이 없습니다.
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
            <div className="text-sm font-bold text-slate-500">
              총 {totalCount}건
            </div>

            <div className="flex items-center gap-5">
              <div className="flex gap-4 text-xs font-bold text-slate-600">
                {PROCESS_STEPS.map((step) => (
                  <div key={step} className="flex items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${getStatusDotColor(
                        step
                      )}`}
                    />
                    {step}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button className="h-9 w-9 rounded-lg border border-slate-200 text-sm font-black">
                  ‹
                </button>
                <button className="h-9 w-9 rounded-lg bg-slate-950 text-sm font-black text-white">
                  1
                </button>
                <button className="h-9 w-9 rounded-lg border border-slate-200 text-sm font-black">
                  2
                </button>
                <button className="h-9 w-9 rounded-lg border border-slate-200 text-sm font-black">
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