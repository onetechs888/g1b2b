import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

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
  return status;
}

export default async function PartnerWorkspacePage() {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("project_code", { ascending: true });

  const { data: bomItems } = await supabase
    .from("bom_items")
    .select("id, project_id");

  const { data: shipments } = await supabase
    .from("shipments")
    .select("id, bom_item_id, shipment_status");

  if (error) {
    return (
      <WorkspaceLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">
            프로젝트 데이터를 불러오지 못했습니다.
          </div>

          <pre className="mt-2 whitespace-pre-wrap text-xs">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </WorkspaceLayout>
    );
  }

  const bomCountByProject = new Map<string, number>();
  const bomProjectMap = new Map<string, string>();

  bomItems?.forEach((item) => {
    const projectId = String(item.project_id);
    const bomId = String(item.id);

    bomProjectMap.set(bomId, projectId);
    bomCountByProject.set(
      projectId,
      (bomCountByProject.get(projectId) ?? 0) + 1
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

  const projectRows =
    projects?.map((project) => {
      const projectId = String(project.id);
      const statusLabel = getProjectStatusLabel(project.status);

      return {
        id: project.project_code,
        project_no: project.project_code,
        project_name: project.project_name,
        customer_name: project.customer_name ?? "-",
        industry: project.industry ?? "-",
        due_date: project.due_date ?? "-",
        current_stage: statusLabel,
        bom_count: bomCountByProject.get(projectId) ?? 0,
        shipment_ready_count: shipmentReadyByProject.get(projectId) ?? 0,
        status:
          project.status === "completed"
            ? "완료"
            : project.status === "hold" || project.status === "cancelled"
              ? "주의"
              : "진행중",
        action:
          project.status === "completed"
            ? "이력보기"
            : "생산관리",
      };
    }) ?? [];

  const totalProjects = projectRows.length;

  const activeProjects = projectRows.filter(
    (project) => project.status === "진행중"
  ).length;

  const completedProjects = projectRows.filter(
    (project) => project.status === "완료"
  ).length;

  const totalBomCount =
    bomItems?.length ?? 0;

  const totalShipmentReady =
    shipments?.filter((shipment) => shipment.shipment_status === "ready")
      .length ?? 0;

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="진행중 프로젝트"
          description="프로젝트번호 기준으로 현재 제조 운영 상태를 관리합니다."
        />

        <ProjectSelector
          projects={projectRows.map((project) => ({
            id: project.project_no,
            name: `${project.project_no} / ${project.project_name}`,
          }))}
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">G1 프로젝트 기준</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            프로젝트번호 = G1 공식 운영 식별자 / 프로젝트명 = 고객 지정명
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <KpiCard title="전체 프로젝트" value={totalProjects} />
          <KpiCard title="진행중 프로젝트" value={activeProjects} />
          <KpiCard title="완료 프로젝트" value={completedProjects} />
          <KpiCard title="BOM 품목" value={totalBomCount} />
          <KpiCard title="출하준비" value={totalShipmentReady} />
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <DataTable
              columns={[
                { key: "project_no", label: "프로젝트번호" },
                { key: "project_name", label: "프로젝트명" },
                { key: "customer_name", label: "고객사" },
                { key: "industry", label: "산업군" },
                { key: "due_date", label: "납기일" },
                { key: "current_stage", label: "현재단계" },
                { key: "bom_count", label: "BOM 품목" },
                { key: "shipment_ready_count", label: "출하준비" },
                { key: "status", label: "상태", type: "status" },
                {
                  key: "action",
                  label: "액션",
                  type: "link",
                  hrefPrefix: "/workspace/partner/production?project=",
                },
              ]}
              data={projectRows}
            />
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="프로젝트 데이터"
              items={[
                { label: "데이터 기준", value: "Supabase projects" },
                { label: "공식 식별자", value: "프로젝트번호" },
                { label: "전체 프로젝트", value: totalProjects },
                { label: "진행중", value: activeProjects },
                { label: "완료", value: completedProjects },
                { label: "총 BOM", value: totalBomCount },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}