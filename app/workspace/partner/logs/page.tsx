import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

type LogsPageProps = {
  searchParams?: Promise<{
    project?: string;
  }>;
};

function getWorkflowTypeLabel(type: string) {
  if (type === "production") return "생산관리";
  if (type === "qc") return "품질관리";
  if (type === "shipment") return "출하관리";
  if (type === "settlement") return "정산관리";
  if (type === "document") return "문서관리";
  return type ?? "-";
}

function getActionLabel(action: string) {
  if (action === "production_process_change") return "생산 상태 변경";
  if (action === "production_qc_requested") return "검수요청";
  if (action === "qc_status_change") return "QC 상태 변경";
  if (action === "qc_approved_shipment_created") return "QC 승인 / 출하 생성";
  if (action === "qc_ncr_created") return "NCR 생성";
  if (action === "shipment_completed_settlement_created")
    return "출하완료 / 정산 생성";
  if (action === "shipment_status_change") return "출하 상태 변경";
  if (action === "settlement_status_change") return "정산 상태 변경";
  return action ?? "-";
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  const selectedProjectCode = params?.project;

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id, project_code, project_name, due_date")
    .order("project_code", { ascending: true });

  if (projectError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">
            프로젝트 데이터를 불러오지 못했습니다.
          </div>

          <pre className="mt-2 whitespace-pre-wrap text-xs">
            {JSON.stringify(projectError, null, 2)}
          </pre>
        </div>
      </WorkspaceLayout>
    );
  }

  const selectedProject = selectedProjectCode
    ? projects?.find((project) => project.project_code === selectedProjectCode)
    : projects?.[0];

  const { data: bomItems, error: bomError } = await supabase
    .from("bom_items")
    .select("id, project_id, part_number, part_name")
    .eq("project_id", selectedProject?.id ?? "")
    .order("part_number", { ascending: true });

  const bomIds = bomItems?.map((item) => item.id) ?? [];

  const { data: histories, error: historyError } = bomIds.length
    ? await supabase
        .from("workflow_status_histories")
        .select("*")
        .in("bom_item_id", bomIds)
        .order("changed_at", { ascending: false })
    : { data: [], error: null };

  const { data: activityLogs, error: activityError } = selectedProject?.id
    ? await supabase
        .from("activity_logs")
        .select("*")
        .eq("project_id", selectedProject.id)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (historyError || activityError || bomError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">
            로그 데이터를 불러오지 못했습니다.
          </div>

          <pre className="mt-2 whitespace-pre-wrap text-xs">
            {JSON.stringify(historyError || activityError || bomError, null, 2)}
          </pre>
        </div>
      </WorkspaceLayout>
    );
  }

  const bomMap = new Map();

  bomItems?.forEach((item) => {
    bomMap.set(String(item.id), item);
  });

  const statusHistoryRows =
    histories?.map((history) => {
      const bom = bomMap.get(String(history.bom_item_id));

      return {
        id: history.id,
        history_id: history.id.slice(0, 8),
        project_no: selectedProject?.project_code ?? "-",
        project_name: selectedProject?.project_name ?? "-",
        bom_item_id: bom?.part_number ?? "-",
        item_name: bom?.part_name ?? "-",
        workflow_type: getWorkflowTypeLabel(history.workflow_type),
        from_status: history.from_status ?? "-",
        to_status: history.to_status ?? "-",
        memo: history.memo ?? "-",
        changed_at: history.changed_at
          ? new Date(history.changed_at).toLocaleString("ko-KR")
          : "-",
        status: "상태이력",
      };
    }) ?? [];

  const activityLogRows =
    activityLogs?.map((log) => {
      const bom = log.bom_item_id
        ? bomMap.get(String(log.bom_item_id))
        : null;

      return {
        id: log.id,
        log_id: log.id.slice(0, 8),
        project_no: selectedProject?.project_code ?? "-",
        project_name: selectedProject?.project_name ?? "-",
        bom_item_id: bom?.part_number ?? "-",
        item_name: bom?.part_name ?? "-",
        target_type: log.target_type ?? "-",
        action: getActionLabel(log.action),
        memo: log.memo ?? "-",
        created_at: log.created_at
          ? new Date(log.created_at).toLocaleString("ko-KR")
          : "-",
        status: "활동로그",
      };
    }) ?? [];

  const productionHistoryCount = statusHistoryRows.filter(
    (item) => item.workflow_type === "생산관리"
  ).length;

  const qcHistoryCount = statusHistoryRows.filter(
    (item) => item.workflow_type === "품질관리"
  ).length;

  const shipmentHistoryCount = statusHistoryRows.filter(
    (item) => item.workflow_type === "출하관리"
  ).length;

  const settlementHistoryCount = statusHistoryRows.filter(
    (item) => item.workflow_type === "정산관리"
  ).length;

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="이력관리"
          description="선택된 프로젝트 기준으로 상태이력과 활동로그를 통합 추적합니다."
        />

        <ProjectSelector
          projects={
            projects?.map((project) => ({
              id: project.project_code,
              name: `${project.project_code} / ${project.project_name}`,
            })) ?? []
          }
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">프로젝트 정보</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            {selectedProject?.project_code ?? "-"} /{" "}
            {selectedProject?.project_name ?? "-"}
          </div>
          <div className="mt-2 text-sm text-blue-700">
            납기일: {selectedProject?.due_date ?? "-"}
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">이력관리 기준</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            상태이력(workflow_status_histories) + 활동로그(activity_logs)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard title="생산 이력" value={productionHistoryCount} />
          <KpiCard title="품질 이력" value={qcHistoryCount} />
          <KpiCard title="출하 이력" value={shipmentHistoryCount} />
          <KpiCard title="정산 이력" value={settlementHistoryCount} />
        </div>

        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1 space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  상태이력
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  생산, 품질, 출하, 정산의 상태 변경 흐름입니다.
                </p>
              </div>

              <DataTable
                columns={[
                  { key: "history_id", label: "이력번호" },
                  { key: "project_no", label: "프로젝트번호" },
                  { key: "project_name", label: "프로젝트명" },
                  { key: "bom_item_id", label: "품목번호" },
                  { key: "item_name", label: "품목명" },
                  { key: "workflow_type", label: "구분" },
                  { key: "from_status", label: "이전상태" },
                  { key: "to_status", label: "변경상태" },
                  { key: "memo", label: "메모" },
                  { key: "changed_at", label: "변경일시" },
                  { key: "status", label: "상태", type: "status" },
                ]}
                data={statusHistoryRows}
              />
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  활동로그
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  사용자 작업 및 시스템 자동 생성 기록입니다.
                </p>
              </div>

              <DataTable
                columns={[
                  { key: "log_id", label: "로그번호" },
                  { key: "project_no", label: "프로젝트번호" },
                  { key: "project_name", label: "프로젝트명" },
                  { key: "bom_item_id", label: "품목번호" },
                  { key: "item_name", label: "품목명" },
                  { key: "target_type", label: "대상" },
                  { key: "action", label: "액션" },
                  { key: "memo", label: "메모" },
                  { key: "created_at", label: "생성일시" },
                  { key: "status", label: "상태", type: "status" },
                ]}
                data={activityLogRows}
              />
            </section>
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="이력 데이터"
              items={[
                {
                  label: "프로젝트번호",
                  value: selectedProject?.project_code ?? "-",
                },
                {
                  label: "프로젝트명",
                  value: selectedProject?.project_name ?? "-",
                },
                {
                  label: "상태이력",
                  value: statusHistoryRows.length,
                },
                {
                  label: "활동로그",
                  value: activityLogRows.length,
                },
                {
                  label: "생산 이력",
                  value: productionHistoryCount,
                },
                {
                  label: "품질 이력",
                  value: qcHistoryCount,
                },
                {
                  label: "출하 이력",
                  value: shipmentHistoryCount,
                },
                {
                  label: "정산 이력",
                  value: settlementHistoryCount,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}