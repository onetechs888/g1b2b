"use client";

import { useState } from "react";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import CustomerProjectSelector from "@/components/customer/CustomerProjectSelector";

export default function CustomerWorkspacePage() {
  const [selectedProjectId, setSelectedProjectId] = useState("");

  return (
    <WorkspaceLayout role="customer">
      <div className="space-y-5">
        <div>
          <div className="text-sm font-black text-slate-500">
            Customer Workspace &gt; 프로젝트
          </div>

          <h1 className="mt-2 text-2xl font-black text-slate-950">
            프로젝트 통합 모니터링
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            프로젝트별 생산, 품질, 출하 현황을 한 화면에서 확인합니다.
          </p>
        </div>

        <CustomerProjectSelector
          selectedProjectId={selectedProjectId}
          onChange={setSelectedProjectId}
        />

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8">
          <div className="text-sm font-black text-slate-950">
            선택된 프로젝트 ID
          </div>

          <div className="mt-2 break-all text-sm font-bold text-blue-600">
            {selectedProjectId || "프로젝트를 선택해주세요."}
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}