import Link from "next/link";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

type QualityWorkspacePageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

function getQcStatusLabel(status: string) {
  if (status === "requested") return "검사 대기";
  if (status === "waiting") return "검사 대기";
  if (status === "in_progress") return "검사 진행중";
  if (status === "approved") return "승인 완료";
  if (status === "ncr") return "NCR";
  if (status === "hold") return "보류";
  return status ?? "-";
}

function getQcStatusBadgeClass(status: string) {
  if (status === "requested" || status === "waiting") {
    return "bg-orange-50 text-orange-600";
  }

  if (status === "in_progress") {
    return "bg-blue-50 text-blue-600";
  }

  if (status === "approved") {
    return "bg-emerald-50 text-emerald-600";
  }

  if (status === "ncr") {
    return "bg-red-50 text-red-600";
  }

  return "bg-slate-50 text-slate-600";
}

function getPercent(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

export default async function QualityWorkspacePage({
  searchParams,
}: QualityWorkspacePageProps) {
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
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  const { data: ncrReports, error: ncrError } = bomIds.length
    ? await supabase
        .from("ncr_reports")
        .select("*")
        .in("bom_item_id", bomIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  const { data: activityLogs } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("project_id", selectedProject?.id ?? "")
    .eq("target_type", "qc")
    .order("created_at", { ascending: false })
    .limit(5);

  if (bomError || qcError || ncrError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
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
      (item) => item.qc_status === "requested" || item.qc_status === "waiting"
    ).length ?? 0;

  const inProgressCount =
    qcRequests?.filter((item) => item.qc_status === "in_progress").length ?? 0;

  const approvedCount =
    qcRequests?.filter((item) => item.qc_status === "approved").length ?? 0;

  const ncrStatusCount =
    qcRequests?.filter((item) => item.qc_status === "ncr").length ?? 0;

  const ncrCount = Math.max(ncrReports?.length ?? 0, ncrStatusCount);

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
          item.qc_status === "waiting" ||
          item.qc_status === "in_progress")
      );
    }).length ?? 0;

  const progressRows = [
    {
      label: "검사 대기",
      count: waitingCount,
      color: "bg-orange-500",
    },
    {
      label: "검사 진행중",
      count: inProgressCount,
      color: "bg-blue-600",
    },
    {
      label: "승인 완료",
      count: approvedCount,
      color: "bg-emerald-500",
    },
    {
      label: "NCR",
      count: ncrCount,
      color: "bg-red-500",
    },
  ];

  const recentInspectionRows =
    qcRequests?.slice(0, 5).map((request) => {
      const bom = bomMap.get(String(request.bom_item_id));

      return {
        id: request.id,
        part_number: bom?.part_number ?? "-",
        part_name: bom?.part_name ?? "-",
        drawing_no: bom?.drawing_no ?? "-",
        status: request.qc_status,
        status_label: getQcStatusLabel(request.qc_status),
        inspection_date: request.inspection_date ?? "-",
        memo: request.memo ?? "-",
      };
    }) ?? [];

  const instructionRows = [
    ...((activityLogs ?? []).map((log) => {
      const bom = log.bom_item_id ? bomMap.get(String(log.bom_item_id)) : null;

      return {
        id: log.id,
        part_number: bom?.part_number ?? "-",
        part_name: bom?.part_name ?? log.action ?? "품질 지시사항",
        memo: log.memo ?? "-",
        status: "진행중",
        created_at: log.created_at ?? "-",
      };
    }) ?? []),
  ].slice(0, 5);

  const issueItems = [
    {
      label: "NCR 발생",
      desc: "부적합 보고서",
      count: ncrCount,
      href: `/workspace/partner/quality/ncr?project=${
        selectedProject?.project_code ?? ""
      }`,
      color: "text-red-600 bg-red-50",
    },
    {
      label: "재검 요청",
      desc: "재검토가 필요한 항목",
      count: ncrReports?.filter((item) => item.status === "recheck").length ?? 0,
      href: `/workspace/partner/quality/inspection?project=${
        selectedProject?.project_code ?? ""
      }`,
      color: "text-orange-600 bg-orange-50",
    },
    {
      label: "검사 지연",
      desc: "예정일 초과 항목",
      count: delayedCount,
      href: `/workspace/partner/quality/inspection?project=${
        selectedProject?.project_code ?? ""
      }`,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "우선 검수 요청",
      desc: "우선 검수가 필요한 항목",
      count: priorityCount,
      href: `/workspace/partner/quality/inspection?project=${
        selectedProject?.project_code ?? ""
      }`,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-950">
              품질관리 WORKSPACE
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              프로젝트 품질 현황을 한눈에 확인하고 관리합니다.
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
          <div className="grid grid-cols-[240px_repeat(5,1fr)] items-center gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500">프로젝트</div>
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
                전체 검사 요청
              </div>
              <div className="mt-2 text-2xl font-black text-slate-950">
                {totalQcCount}
                <span className="ml-1 text-sm font-bold text-slate-500">
                  건
                </span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">검사 대기</div>
              <div className="mt-2 text-2xl font-black text-orange-600">
                {waitingCount}
                <span className="ml-1 text-sm font-bold text-slate-500">
                  건
                </span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">검사 진행중</div>
              <div className="mt-2 text-2xl font-black text-blue-600">
                {inProgressCount}
                <span className="ml-1 text-sm font-bold text-slate-500">
                  건
                </span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">승인 완료</div>
              <div className="mt-2 text-2xl font-black text-emerald-600">
                {approvedCount}
                <span className="ml-1 text-sm font-bold text-slate-500">
                  건
                </span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">NCR</div>
              <div className="mt-2 text-2xl font-black text-red-600">
                {ncrCount}
                <span className="ml-1 text-sm font-bold text-slate-500">
                  건
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">
                품질 진행 현황
              </h2>

              <Link
                href={`/workspace/partner/quality/inspection?project=${
                  selectedProject?.project_code ?? ""
                }`}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                전체 상태
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-[220px_1fr] gap-8">
              <div className="flex h-56 w-56 items-center justify-center rounded-full border-[34px] border-emerald-500">
                <div className="text-center">
                  <div className="text-4xl font-black text-slate-950">
                    {totalQcCount}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-500">
                    전체
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
                      {getPercent(item.count, totalQcCount)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black text-slate-950">
              품질 이슈 현황
            </h2>

            <div className="mt-5 divide-y divide-slate-100">
              {issueItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-4 py-4 hover:bg-slate-50"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-black ${item.color}`}
                  >
                    !
                  </div>

                  <div className="flex-1">
                    <div className="font-black text-slate-950">
                      {item.label}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-500">
                      {item.desc}
                    </div>
                  </div>

                  <div className="text-lg font-black text-slate-950">
                    {item.count}건
                  </div>

                  <div className="text-slate-400">›</div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">
                최근 검사 이력
              </h2>

              <Link
                href={`/workspace/partner/quality/inspection?project=${
                  selectedProject?.project_code ?? ""
                }`}
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
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">검사일시</th>
                    <th className="px-4 py-3">비고</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentInspectionRows.length ? (
                    recentInspectionRows.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="font-black text-slate-950">
                            {item.part_number}
                          </div>
                          <div className="text-xs font-medium text-slate-500">
                            {item.part_name}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-black ${getQcStatusBadgeClass(
                              item.status
                            )}`}
                          >
                            {item.status_label}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-600">
                          {item.inspection_date}
                        </td>

                        <td className="px-4 py-3 text-xs font-medium text-slate-500">
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

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">
                품질 지시사항
              </h2>

              <Link
                href={`/workspace/partner/logs?project=${
                  selectedProject?.project_code ?? ""
                }`}
                className="text-sm font-black text-blue-600"
              >
                전체 보기 →
              </Link>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {instructionRows.length ? (
                instructionRows.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div>
                      <div className="font-black text-slate-950">
                        {item.part_number} / {item.part_name}
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-500">
                        {item.memo}
                      </div>
                    </div>

                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-sm font-bold text-slate-400">
                  품질 지시사항이 없습니다.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
          품질 검수 관련 문의사항은 품질 담당자에게 문의하여 주시기 바랍니다.
        </div>
      </div>
    </WorkspaceLayout>
  );
}