import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import ProjectListCard from "@/components/workspace/ProjectListCard";
import ProductionSummaryCard from "@/components/workspace/ProductionSummaryCard";
import RecentEventsCard from "@/components/workspace/RecentEventsCard";
import QuickMenuCard from "@/components/workspace/QuickMenuCard";
import { supabase } from "@/lib/supabase";

type PartnerWorkspacePageProps = {
  searchParams?: Promise<{
    project?: string;
  }>;
};

function getProjectStatusLabel(status: string) {
  if (status === "draft") return "작성중";
  if (status === "rfq") return "입찰진행";
  if (status === "ordered") return "프로젝트확정";
  if (status === "production") return "생산중";
  if (status === "qc") return "품질관리";
  if (status === "shipment") return "출하관리";
  if (status === "completed") return "완료";
  if (status === "hold") return "보류";
  if (status === "cancelled") return "취소";
  return status ?? "-";
}

function getPercent(count: number, total: number) {
  if (!total) return 0;
  return (count / total) * 100;
}

export default async function PartnerWorkspacePage({
  searchParams,
}: PartnerWorkspacePageProps) {
  const params = await searchParams;
  const selectedProjectCode = params?.project;

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("project_code", { ascending: true });

  const { data: bomItems } = await supabase
    .from("bom_items")
    .select("id, project_id, process_type");

  const { data: productionUpdates } = await supabase
    .from("production_updates")
    .select("id, bom_item_id, process_step");

  const { data: qcRequests } = await supabase
    .from("qc_requests")
    .select("id, bom_item_id, qc_status");

  const { data: shipments } = await supabase
    .from("shipments")
    .select("id, bom_item_id, shipment_status");

  const { data: activityLogs } = await supabase
    .from("activity_logs")
    .select("id, project_id, bom_item_id, target_type, action, memo, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    return (
      <WorkspaceLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="font-bold">
            프로젝트 데이터를 불러오지 못했습니다.
          </div>

          <pre className="mt-3 whitespace-pre-wrap text-xs">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </WorkspaceLayout>
    );
  }

  const bomCountByProject = new Map<string, number>();
  const bomProjectMap = new Map<string, string>();
  const bomProcessMap = new Map<string, string>();

  bomItems?.forEach((item) => {
    const projectId = String(item.project_id);
    const bomId = String(item.id);

    bomProjectMap.set(bomId, projectId);
    bomProcessMap.set(bomId, item.process_type ?? "대기");

    bomCountByProject.set(
      projectId,
      (bomCountByProject.get(projectId) ?? 0) + 1
    );
  });

  productionUpdates?.forEach((update) => {
    bomProcessMap.set(
      String(update.bom_item_id),
      update.process_step ?? "대기"
    );
  });

  const shipmentReadyByProject = new Map<string, number>();

  shipments?.forEach((shipment) => {
    const projectId = bomProjectMap.get(String(shipment.bom_item_id));

    if (!projectId) return;

    if (shipment.shipment_status === "ready") {
      shipmentReadyByProject.set(
        projectId,
        (shipmentReadyByProject.get(projectId) ?? 0) + 1
      );
    }
  });

  const allProjectRows =
    projects?.map((project) => {
      const projectId = String(project.id);

      return {
        id: project.project_code,
        project_no: project.project_code,
        project_name: project.project_name,
        customer_name: project.customer_name ?? "-",
        industry: project.industry ?? "-",
        due_date: project.due_date ?? "-",
        current_stage: getProjectStatusLabel(project.status),
        bom_count: bomCountByProject.get(projectId) ?? 0,
        shipment_ready_count: shipmentReadyByProject.get(projectId) ?? 0,
        raw_status: project.status,
        status:
          project.status === "completed"
            ? "완료"
            : project.status === "hold" || project.status === "cancelled"
              ? "주의"
              : "진행중",
      };
    }) ?? [];

  const projectRows = selectedProjectCode
    ? allProjectRows.filter(
        (project) => project.project_no === selectedProjectCode
      )
    : allProjectRows.filter((project) => project.raw_status !== "completed");

  const filteredProjectIds = new Set(
    projectRows
      .map((project) => {
        const matchedProject = projects?.find(
          (item) => item.project_code === project.project_no
        );

        return matchedProject?.id ? String(matchedProject.id) : null;
      })
      .filter(Boolean)
  );

  const filteredBomItems =
    bomItems?.filter((item) =>
      filteredProjectIds.has(String(item.project_id))
    ) ?? [];

  const filteredBomIds = new Set(
    filteredBomItems.map((item) => String(item.id))
  );

  const filteredShipments =
    shipments?.filter((shipment) =>
      filteredBomIds.has(String(shipment.bom_item_id))
    ) ?? [];

  const filteredQcRequests =
    qcRequests?.filter((qc) =>
      filteredBomIds.has(String(qc.bom_item_id))
    ) ?? [];

  const totalBomCount = filteredBomItems.length;

  const processCounts = {
    waiting: 0,
    materialIn: 0,
    materialCheck: 0,
    machiningWait: 0,
    machining: 0,
    machiningDone: 0,
    qcRequested: 0,
    qcInspecting: 0,
    shipmentReady: 0,
    shipped: 0,
  };

  filteredBomItems.forEach((item) => {
    const process = bomProcessMap.get(String(item.id)) ?? "대기";

    if (process === "대기") processCounts.waiting += 1;
    if (process === "소재입고") processCounts.materialIn += 1;
    if (process === "소재검수") processCounts.materialCheck += 1;
    if (process === "가공대기") processCounts.machiningWait += 1;
    if (process === "내부공정" || process === "외부공정")
      processCounts.machining += 1;
    if (process === "가공완료") processCounts.machiningDone += 1;
    if (process === "검수요청") processCounts.qcRequested += 1;
  });

  filteredQcRequests.forEach((qc) => {
    if (qc.qc_status === "inspecting") {
      processCounts.qcInspecting += 1;
    }
  });

  filteredShipments.forEach((shipment) => {
    if (shipment.shipment_status === "ready") {
      processCounts.shipmentReady += 1;
    }

    if (shipment.shipment_status === "shipped") {
      processCounts.shipped += 1;
    }
  });

  const productionSummaryItems = [
    {
      label: "소재준비",
      count: processCounts.waiting,
      percent: getPercent(processCounts.waiting, totalBomCount),
      color: "bg-slate-500",
    },
    {
      label: "소재입고",
      count: processCounts.materialIn,
      percent: getPercent(processCounts.materialIn, totalBomCount),
      color: "bg-blue-500",
    },
    {
      label: "소재검수",
      count: processCounts.materialCheck,
      percent: getPercent(processCounts.materialCheck, totalBomCount),
      color: "bg-cyan-500",
    },
    {
      label: "가공대기",
      count: processCounts.machiningWait,
      percent: getPercent(processCounts.machiningWait, totalBomCount),
      color: "bg-indigo-500",
    },
    {
      label: "가공중",
      count: processCounts.machining,
      percent: getPercent(processCounts.machining, totalBomCount),
      color: "bg-orange-500",
    },
    {
      label: "가공완료",
      count: processCounts.machiningDone,
      percent: getPercent(processCounts.machiningDone, totalBomCount),
      color: "bg-emerald-500",
    },
    {
      label: "검수요청",
      count: processCounts.qcRequested,
      percent: getPercent(processCounts.qcRequested, totalBomCount),
      color: "bg-purple-500",
    },
    {
      label: "품질검수",
      count: processCounts.qcInspecting,
      percent: getPercent(processCounts.qcInspecting, totalBomCount),
      color: "bg-pink-500",
    },
    {
      label: "출하준비",
      count: processCounts.shipmentReady,
      percent: getPercent(processCounts.shipmentReady, totalBomCount),
      color: "bg-yellow-500",
    },
    {
      label: "출하",
      count: processCounts.shipped,
      percent: getPercent(processCounts.shipped, totalBomCount),
      color: "bg-green-600",
    },
  ];

  const recentEvents =
    activityLogs
      ?.filter((log) => {
        if (!selectedProjectCode) return true;

        return filteredProjectIds.has(String(log.project_id));
      })
      .map((log) => ({
        time: log.created_at
          ? new Date(log.created_at).toLocaleString("ko-KR")
          : "-",
        category: log.target_type ?? "-",
        event: log.action ?? "-",
        target: log.bom_item_id ? String(log.bom_item_id).slice(0, 8) : "-",
        owner: "시스템",
      })) ?? [];

  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950">
              진행중인 프로젝트
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              프로젝트별 제조 진행 현황과 주요 운영 이벤트를 확인합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              검색
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              필터
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600">
              알림
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600">
              메일
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
              DT
            </div>
          </div>
        </div>

        <ProjectSelector
          projects={allProjectRows.map((project) => ({
            id: project.project_no,
            name: `${project.project_no} / ${project.project_name}`,
          }))}
        />

        <div className="grid grid-cols-[1fr_380px] gap-5">
          <ProjectListCard
  projects={projectRows}
  allProjects={allProjectRows}
  selectedProjectCode={selectedProjectCode}
/>

          <ProductionSummaryCard items={productionSummaryItems} />
        </div>

        <div className="grid grid-cols-[1fr_380px] gap-5">
          <RecentEventsCard events={recentEvents} />

          <QuickMenuCard />
        </div>
      </div>
    </WorkspaceLayout>
  );
}