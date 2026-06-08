import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

export default async function PartnerWorkspacePage() {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("project_code", { ascending: true });

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

  const projectRows =
    projects?.map((project) => ({
      id: project.project_code,
      project_id: project.project_code,
      project_name: project.project_name,
      industry: project.industry ?? "-",
      due_date: project.due_date ?? "-",
      status:
        project.status === "production"
          ? "진행중"
          : project.status === "completed"
            ? "완료"
            : project.status,
      action:
        project.status === "completed"
          ? "이력보기"
          : "생산관리",
    })) ?? [];

  const totalProjects = projectRows.length;

  const activeProjects = projectRows.filter(
    (project) => project.status === "진행중"
  ).length;

  const completedProjects = projectRows.filter(
    (project) => project.status === "완료"
  ).length;

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="진행중 프로젝트"
          description="현재 진행중인 제조 프로젝트를 관리합니다."
        />

        <ProjectSelector
          projects={projectRows.map((project) => ({
            id: project.project_id,
            name: project.project_name,
          }))}
        />

        <div className="grid grid-cols-5 gap-4">
          <KpiCard title="전체 프로젝트" value={totalProjects} />
          <KpiCard title="진행중 프로젝트" value={activeProjects} />
          <KpiCard title="완료 프로젝트" value={completedProjects} />
          <KpiCard title="BOM 품목" value="DB 연결 예정" />
          <KpiCard title="출하 대기" value="DB 연결 예정" />
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <DataTable
              columns={[
                { key: "project_id", label: "PO 번호" },
                { key: "project_name", label: "프로젝트명" },
                { key: "industry", label: "산업군" },
                { key: "due_date", label: "납기" },
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
                { label: "전체 프로젝트", value: totalProjects },
                { label: "진행중", value: activeProjects },
                { label: "완료", value: completedProjects },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}