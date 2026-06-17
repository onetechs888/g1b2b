import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

function getQcStatusLabel(status: string) {
  if (status === "requested") return "검사요청";
  if (status === "scheduled") return "검수대기";
  if (status === "inspecting") return "검수중";
  if (status === "passed") return "승인";
  if (status === "failed") return "NCR";
  if (status === "hold") return "보류";
  return status ?? "-";
}

export default async function QualityPage() {
  const { data: qcRequests, error: qcError } = await supabase
    .from("qc_requests")
    .select("*")
    .order("updated_at", { ascending: false });

  const { data: bomItems, error: bomError } = await supabase
    .from("bom_items")
    .select("id, project_id, part_number, part_name")
    .order("part_number", { ascending: true });

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id, project_code, project_name, customer_company_id, due_date");

  if (qcError || bomError || projectError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">
            품질 데이터를 불러오지 못했습니다.
          </div>

          <pre className="mt-2 whitespace-pre-wrap text-xs">
            {JSON.stringify(qcError || bomError || projectError, null, 2)}
          </pre>
        </div>
      </WorkspaceLayout>
    );
  }

  const projectMap = new Map();

  projects?.forEach((project) => {
    projectMap.set(String(project.id), project);
  });

  const bomMap = new Map();

  bomItems?.forEach((item) => {
    bomMap.set(String(item.id), item);
  });

  const qcRows =
    qcRequests?.map((request) => {
      const bom = bomMap.get(String(request.bom_item_id));
      const project = bom ? projectMap.get(String(bom.project_id)) : null;

      return {
        id: request.id,
        qc_request_id: request.id,
        project_no: project?.project_code ?? "-",
        project_name: project?.project_name ?? "-",
        customer_company: "-",
        due_date: project?.due_date ?? "-",
        bom_item_id: bom?.part_number ?? "-",
        item_name: bom?.part_name ?? "-",
        inspection_date: request.inspection_date ?? "-",
        priority: request.priority ? "우선" : "일반",
        qc_status_label: getQcStatusLabel(request.qc_status),
        memo: request.memo ?? "-",
        action: "검사관리",
      };
    }) ?? [];

  const currentProject = qcRows[0];

  const requestedCount = qcRows.filter(
    (item) => item.qc_status_label === "검사요청"
  ).length;

  const scheduledCount = qcRows.filter(
    (item) => item.qc_status_label === "검수대기"
  ).length;

  const inspectingCount = qcRows.filter(
    (item) => item.qc_status_label === "검수중"
  ).length;

  const passedCount = qcRows.filter(
    (item) => item.qc_status_label === "승인"
  ).length;

  const ncrCount = qcRows.filter(
    (item) => item.qc_status_label === "NCR"
  ).length;

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="품질관리"
          description="검수 요청, 검수 진행, 승인 및 NCR을 관리합니다."
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">프로젝트 정보</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            {currentProject?.project_no ?? "-"} /{" "}
            {currentProject?.project_name ?? "-"}
          </div>
          <div className="mt-2 text-sm text-blue-700">
            고객사: {currentProject?.customer_company ?? "-"} · 납기일:{" "}
            {currentProject?.due_date ?? "-"}
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">품질관리 Workflow</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            검수대기 → 검수중 → 승인 / NCR
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <KpiCard title="검사요청" value={requestedCount} />
          <KpiCard title="검수대기" value={scheduledCount} />
          <KpiCard title="검수중" value={inspectingCount} />
          <KpiCard title="승인" value={passedCount} />
          <KpiCard title="NCR" value={ncrCount} />
        </div>

        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <DataTable
              columns={[
                { key: "project_no", label: "프로젝트번호" },
                { key: "project_name", label: "프로젝트명" },
                { key: "qc_request_id", label: "검사번호" },
                { key: "bom_item_id", label: "품목번호" },
                { key: "item_name", label: "품목명" },
                { key: "inspection_date", label: "검사일" },
                { key: "priority", label: "우선검사" },
                { key: "qc_status_label", label: "검사상태" },
                { key: "memo", label: "메모" },
                {
                  key: "action",
                  label: "액션",
                  type: "link",
                  hrefPrefix: "/workspace/partner/quality/item/",
                },
              ]}
              data={qcRows}
            />
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="품질 데이터"
              items={[
                { label: "프로젝트번호", value: currentProject?.project_no ?? "-" },
                { label: "프로젝트명", value: currentProject?.project_name ?? "-" },
                { label: "고객사", value: currentProject?.customer_company ?? "-" },
                { label: "총 검사", value: qcRows.length },
                { label: "검수중", value: inspectingCount },
                { label: "승인", value: passedCount },
                { label: "NCR", value: ncrCount },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}