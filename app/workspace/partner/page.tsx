import {
  Bell,
  Filter,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

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

function getProjectHealth(projectStatus: string, dueDate?: string | null) {
  if (projectStatus === "hold" || projectStatus === "cancelled") return "주의";

  const dday = getDday(dueDate);

  if (dday.startsWith("D+")) return "지연";
  if (dday === "D-Day") return "주의";

  return "정상";
}

function translateEventCategory(category?: string | null) {
  if (category === "production") return "생산";
  if (category === "qc") return "품질";
  if (category === "ncr") return "NCR";
  if (category === "shipment") return "출하";
  if (category === "settlement") return "정산";
  if (category === "document") return "문서";
  if (category === "sales") return "영업";
  if (category === "system") return "시스템";
  return category ?? "-";
}

function translateEventAction(action?: string | null) {
  if (!action) return "-";

  const map: Record<string, string> = {
    qc_status_change: "품질 상태 변경",
    qc_passed_shipment_ready: "출하 준비 생성",
    qc_failed_to_sales: "품질 이슈 영업 공유",
    qc_failed_to_production: "품질 이슈 생산 공유",
    production_status_change: "생산 상태 변경",
    shipment_status_change: "출하 상태 변경",
    settlement_status_change: "정산 상태 변경",
    document_uploaded: "문서 업로드",
    document_downloaded: "문서 다운로드",
  };

  return map[action] ?? action.replaceAll("_", " ");
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
          <div className="font-bold">프로젝트 데이터를 불러오지 못했습니다.</div>
          <pre className="mt-3 whitespace-pre-wrap text-xs">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </WorkspaceLayout>
    );
  }

  const projectCodeById = new Map<string, string>();
  const bomCountByProject = new Map<string, number>();
  const bomProjectMap = new Map<string, string>();
  const bomProcessMap = new Map<string, string>();

  projects?.forEach((project) => {
    projectCodeById.set(String(project.id), project.project_code);
  });

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
    bomProcessMap.set(String(update.bom_item_id), update.process_step ?? "대기");
  });

  const shipmentReadyByProject = new Map<string, number>();
  const shippedByProject = new Map<string, number>();

  shipments?.forEach((shipment) => {
    const projectId = bomProjectMap.get(String(shipment.bom_item_id));
    if (!projectId) return;

    if (shipment.shipment_status === "ready") {
      shipmentReadyByProject.set(
        projectId,
        (shipmentReadyByProject.get(projectId) ?? 0) + 1
      );
    }

    if (
      shipment.shipment_status === "shipped" ||
      shipment.shipment_status === "completed"
    ) {
      shippedByProject.set(
        projectId,
        (shippedByProject.get(projectId) ?? 0) + 1
      );
    }
  });

  const allProjectRows =
    projects?.map((project) => {
      const projectId = String(project.id);
      const bomCount = bomCountByProject.get(projectId) ?? 0;
      const shippedCount = shippedByProject.get(projectId) ?? 0;

      return {
        id: project.project_code,
        project_no: project.project_code,
        project_name: project.project_name,
        customer_name: project.customer_name ?? "-",
        industry: project.industry ?? "-",
        due_date: project.due_date ?? "-",
        dday: getDday(project.due_date),
        health: getProjectHealth(project.status, project.due_date),
        current_stage: getProjectStatusLabel(project.status),
        progress_percent: getPercent(shippedCount, bomCount),
        bom_count: bomCount,
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
    bomItems?.filter((item) => filteredProjectIds.has(String(item.project_id))) ??
    [];

  const filteredBomIds = new Set(
    filteredBomItems.map((item) => String(item.id))
  );

  const filteredShipments =
    shipments?.filter((shipment) =>
      filteredBomIds.has(String(shipment.bom_item_id))
    ) ?? [];

  const filteredQcRequests =
    qcRequests?.filter((qc) => filteredBomIds.has(String(qc.bom_item_id))) ?? [];

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
    if (process === "내부공정" || process === "외부공정") {
      processCounts.machining += 1;
    }
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

    if (
      shipment.shipment_status === "shipped" ||
      shipment.shipment_status === "completed"
    ) {
      processCounts.shipped += 1;
    }
  });

  const productionSummaryItems = [
    {
      label: "소재준비",
      count: processCounts.waiting,
      percent: getPercent(processCounts.waiting, totalBomCount),
      tone: "slate",
    },
    {
      label: "소재입고",
      count: processCounts.materialIn,
      percent: getPercent(processCounts.materialIn, totalBomCount),
      tone: "blue",
    },
    {
      label: "소재검수",
      count: processCounts.materialCheck,
      percent: getPercent(processCounts.materialCheck, totalBomCount),
      tone: "emerald",
    },
    {
      label: "가공대기",
      count: processCounts.machiningWait,
      percent: getPercent(processCounts.machiningWait, totalBomCount),
      tone: "amber",
    },
    {
      label: "가공중",
      count: processCounts.machining,
      percent: getPercent(processCounts.machining, totalBomCount),
      tone: "green",
    },
    {
      label: "가공완료",
      count: processCounts.machiningDone,
      percent: getPercent(processCounts.machiningDone, totalBomCount),
      tone: "cyan",
    },
    {
      label: "검수요청",
      count: processCounts.qcRequested,
      percent: getPercent(processCounts.qcRequested, totalBomCount),
      tone: "indigo",
    },
    {
      label: "품질검수",
      count: processCounts.qcInspecting,
      percent: getPercent(processCounts.qcInspecting, totalBomCount),
      tone: "blue",
    },
    {
      label: "출하준비",
      count: processCounts.shipmentReady,
      percent: getPercent(processCounts.shipmentReady, totalBomCount),
      tone: "violet",
    },
    {
      label: "출하",
      count: processCounts.shipped,
      percent: getPercent(processCounts.shipped, totalBomCount),
      tone: "purple",
    },
  ];

  const recentEvents =
    activityLogs
      ?.filter((log) => {
        if (!selectedProjectCode) return true;
        return filteredProjectIds.has(String(log.project_id));
      })
      .map((log) => ({
        time: formatDateTime(log.created_at),
        category: translateEventCategory(log.target_type),
        event: translateEventAction(log.action),
        target: `${projectCodeById.get(String(log.project_id)) ?? "-"} / ${
          log.bom_item_id ? String(log.bom_item_id).slice(0, 8) : "-"
        }`,
        owner: "시스템",
      })) ?? [];

  const lastUpdated = activityLogs?.[0]?.created_at
    ? formatDateTime(activityLogs[0].created_at)
    : "-";

  return (
    <WorkspaceLayout>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                진행중인 프로젝트
              </h1>

              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                <ShieldCheck size={18} />
              </div>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              현재 진행 중인 프로젝트의 납기, 품질, 출하 현황을 한눈에 확인할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-[300px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-400 shadow-sm">
                <span>프로젝트명, 품목, 고객사 검색</span>
                <Search className="ml-auto text-slate-500" size={17} />
              </div>

              <button className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm">
                <Filter size={16} />
                필터
              </button>

              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200">
                <Bell size={17} />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                  3
                </span>
              </div>

              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200">
                <Mail size={17} />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                  2
                </span>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white shadow-sm">
                DT
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
          projects={allProjectRows.map((project) => ({
            id: project.project_no,
            name: `${project.project_no} / ${project.project_name}`,
          }))}
        />

        <div className="grid grid-cols-[1fr_380px] gap-4">
          <ProjectListCard
            projects={projectRows}
            allProjects={allProjectRows}
            selectedProjectCode={selectedProjectCode}
          />

          <ProductionSummaryCard items={productionSummaryItems} />
        </div>

        <div className="grid grid-cols-[1fr_380px] gap-4">
          <RecentEventsCard events={recentEvents} />
          <QuickMenuCard />
        </div>
      </div>
    </WorkspaceLayout>
  );
}