import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";

export default function CustomerWorkspacePage() {
  return (
    <WorkspaceLayout role="customer">
      <div className="space-y-5">
        <div>
          <div className="text-sm font-black text-slate-500">
            Customer Workspace &gt; 프로젝트
          </div>

          <h1 className="mt-2 text-2xl font-black text-slate-950">
            고객 프로젝트 대시보드
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            고객은 이 화면에서 프로젝트별 생산, 품질, 출하, 정산 현황을
            통합 모니터링합니다.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">
            Customer Sidebar 연결 확인
          </h2>

          <p className="mt-2 text-sm font-medium text-slate-500">
            왼쪽 사이드바가 Customer Workspace 메뉴로 표시되면 정상입니다.
          </p>
        </section>
      </div>
    </WorkspaceLayout>
  );
}