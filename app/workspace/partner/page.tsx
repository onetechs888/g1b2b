import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";

import { projects, kpiData } from "@/data/partnerMockData";

export default function PartnerWorkspacePage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="진행중 프로젝트"
          description="현재 진행중인 제조 프로젝트를 관리합니다."
        />

        <ProjectSelector projects={projects} />

        <div className="grid grid-cols-5 gap-4">
          <KpiCard title="진행중 프로젝트" value={kpiData.totalProjects} />

          <KpiCard
            title="총 계약금액"
            value={`${kpiData.totalAmount.toLocaleString()}원`}
          />

          <KpiCard title="BOM 품목" value={kpiData.totalBomItems} />

          <KpiCard title="진행중 NCR" value={kpiData.activeNcr} />

          <KpiCard title="출하 대기" value={kpiData.pendingShipment} />
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <DataTable
columns={[
  { key: "project_id", label: "PO 번호" },
  { key: "project_name", label: "프로젝트명" },
  { key: "customer_company", label: "고객사" },
  { key: "progress_rate", label: "진행률", type: "progress" },
  { key: "status", label: "상태", type: "status" },
  {
    key: "action",
    label: "액션",
    type: "link",
    hrefPrefix: "/workspace/partner/production?project=",
  },
]}
              data={projects}
            />
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="진행 프로젝트 상세"
              items={[
                { label: "담당자", value: "원동협" },
                { label: "Revision", value: "REV-A" },
                { label: "총 BOM", value: "65" },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}