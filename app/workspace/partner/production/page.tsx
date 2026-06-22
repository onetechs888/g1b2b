import Link from "next/link";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

type ProductionPageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

function getPercent(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

export default async function ProductionPage({
  searchParams,
}: ProductionPageProps) {
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

  const { data: qcRequests } = bomIds.length
    ? await supabase
        .from("qc_requests")
        .select("*")
        .in("bom_item_id", bomIds)
    : { data: [] };

  const { data: activityLogs } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("project_id", selectedProject?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(5);

  if (bomError || productionError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
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

  const waitingCount = productionRows.filter(
    (item) => item.process === "대기"
  ).length;

  const materialInCount = productionRows.filter(
    (item) => item.process === "소재입고"
  ).length;

  const materialQcCount = productionRows.filter(
    (item) => item.process === "소재검수"
  ).length;

  const internalCount = productionRows.filter(
    (item) => item.process === "내부공정"
  ).length;

  const externalCount = productionRows.filter(
    (item) => item.process === "외부공정"
  ).length;

  const qcRequestCount = productionRows.filter(
    (item) => item.process === "검수요청"
  ).length;

  const machiningCount = internalCount + externalCount;

  const completedLikeCount = qcRequestCount;
  const overallProgress = getPercent(completedLikeCount, totalCount);

  const qcCount = qcRequests?.length ?? 0;

  const summaryItems = [
    {
      label: "대기",
      count: waitingCount,
      color: "bg-slate-400",
    },
    {
      label: "소재입고",
      count: materialInCount,
      color: "bg-blue-500",
    },
    {
      label: "소재검수",
      count: materialQcCount,
      color: "bg-cyan-500",
    },
    {
      label: "가공중",
      count: machiningCount,
      color: "bg-emerald-500",
    },
    {
      label: "검수요청",
      count: qcRequestCount,
      color: "bg-orange-500",
    },
    {
      label: "QC 생성",
      count: qcCount,
      color: "bg-purple-500",
    },
  ];

  const issueItems = [
    {
      type: "품질",
      title: "검수요청 대기",
      desc: "생산 완료 후 품질관리로 이관된 품목",
      count: `${qcRequestCount}건`,
      color: "bg-orange-50 text-orange-600",
    },
    {
      type: "공정",
      title: "가공 진행중",
      desc: "내부공정 / 외부공정 진행 품목",
      count: `${machiningCount}건`,
      color: "bg-blue-50 text-blue-600",
    },
    {
      type: "납기",
      title: "납기 확인",
      desc: selectedProject?.due_date ?? "-",
      count: "-",
      color: "bg-rose-50 text-rose-600",
    },
  ];

  const recentUpdates =
    activityLogs?.map((log) => ({
      title: log.action ?? "생산 업데이트",
      desc: log.memo ?? "-",
      time: log.created_at
        ? new Date(log.created_at).toLocaleString("ko-KR")
        : "-",
    })) ?? [];

  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-950">
              생산관리 Workspace
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              생산 현황을 한눈에 확인하고 빠르게 관리할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              프로젝트명, PO번호, 고객사 검색
            </div>

            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              필터
            </button>

            <div className="text-right text-xs font-semibold text-slate-500">
              마지막 업데이트{" "}
              <span className="text-slate-900">실시간 데이터 기준</span>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-[240px_1fr_1fr_1fr_1fr_1fr_120px] items-center gap-5">
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

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                프로젝트명
              </div>
              <div className="mt-3 text-lg font-black text-slate-950">
                {selectedProject?.project_name ?? "-"}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">고객사</div>
              <div className="mt-3 text-lg font-black text-slate-950">
                고객사 연동 예정
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                현재 상태
              </div>
              <div className="mt-3">
                <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-black text-emerald-700">
                  생산중
                </span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                전체 진행률
              </div>
              <div className="mt-2 text-3xl font-black text-blue-600">
                {overallProgress}%
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">납기일</div>
              <div className="mt-3 text-lg font-black text-slate-950">
                {selectedProject?.due_date ?? "-"}
              </div>
            </div>

            <Link
              href={`/workspace/partner/production/items?project=${
                selectedProject?.project_code ?? ""
              }`}
              className="rounded-lg border border-blue-500 px-4 py-2 text-center text-sm font-black text-blue-600 hover:bg-blue-50"
            >
              품목별
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black text-slate-950">
              생산 진행 현황
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              전체 {totalCount}개 품목 기준
            </p>

            <div className="mt-6 grid grid-cols-[220px_1fr] gap-8">
              <div className="flex h-56 w-56 items-center justify-center rounded-full border-[34px] border-blue-600">
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-500">
                    전체 진행률
                  </div>
                  <div className="mt-1 text-4xl font-black text-blue-600">
                    {overallProgress}%
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-500">
                    {completedLikeCount} / {totalCount}
                  </div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-[1fr_80px_80px_80px] border-b border-slate-200 py-3 text-sm font-black text-slate-600">
                  <div>상태</div>
                  <div className="text-center">품목 수</div>
                  <div className="text-center">비율</div>
                  <div className="text-center">비고</div>
                </div>

                {summaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="grid grid-cols-[1fr_80px_80px_80px] border-b border-slate-100 py-3 text-sm"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span
                        className={`h-3 w-3 rounded-full ${item.color}`}
                      />
                      {item.label}
                    </div>
                    <div className="text-center font-bold">
                      {item.count}개
                    </div>
                    <div className="text-center font-bold">
                      {getPercent(item.count, totalCount)}%
                    </div>
                    <div className="text-center">-</div>
                  </div>
                ))}

                <div className="grid grid-cols-[1fr_80px_80px_80px] py-3 text-sm font-black">
                  <div>합계</div>
                  <div className="text-center">{totalCount}개</div>
                  <div className="text-center">100%</div>
                  <div className="text-center">-</div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">
                위험 / 이슈
              </h2>
              <div className="text-sm font-black text-red-500">
                전체 {issueItems.length}건
              </div>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {issueItems.map((item) => (
                <div key={item.title} className="flex items-center gap-4 py-4">
                  <span
                    className={`w-16 rounded-lg px-3 py-2 text-center text-sm font-black ${item.color}`}
                  >
                    {item.type}
                  </span>

                  <div className="flex-1">
                    <div className="font-black text-slate-950">
                      {item.title}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-500">
                      {item.desc}
                    </div>
                  </div>

                  <div className="font-black text-red-500">{item.count}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">
                최근 업데이트
              </h2>
              <button className="text-sm font-black text-blue-600">
                전체 {recentUpdates.length}건
              </button>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {recentUpdates.length ? (
                recentUpdates.map((item, index) => (
                  <div
                    key={`${item.title}-${item.time}-${index}`}
                    className="flex items-center justify-between py-4"
                  >
                    <div>
                      <div className="font-black text-slate-950">
                        {item.title}
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-500">
                        {item.desc}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-500">
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

            <div className="pt-5 text-center">
              <Link
                href={`/workspace/partner/logs?project=${
                  selectedProject?.project_code ?? ""
                }`}
                className="text-sm font-black text-blue-600"
              >
                전체보기 →
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">지시사항</h2>
              <button className="rounded-lg border border-blue-500 px-3 py-2 text-sm font-black text-blue-600">
                + 새 지시
              </button>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {productionRows.slice(0, 4).map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 py-4">
                  <span
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-black",
                      index === 0
                        ? "bg-red-50 text-red-600"
                        : index === 1
                          ? "bg-orange-50 text-orange-600"
                          : "bg-blue-50 text-blue-600",
                    ].join(" ")}
                  >
                    {index === 0 ? "긴급" : index === 1 ? "중요" : "일반"}
                  </span>

                  <div className="flex-1">
                    <div className="font-black text-slate-950">
                      {item.part_number} 생산 상태 확인
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-500">
                      {item.process} / {item.part_name}
                    </div>
                  </div>

                  <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-black text-blue-600">
                    진행중
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-5 text-center">
              <Link
                href={`/workspace/partner/production/items?project=${
                  selectedProject?.project_code ?? ""
                }`}
                className="text-sm font-black text-blue-600"
              >
                품목별 상세보기 →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </WorkspaceLayout>
  );
}