"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

function getQcStatusLabel(status: string) {
  if (status === "requested") return "검사요청";
  if (status === "scheduled") return "검수대기";
  if (status === "inspecting") return "검수중";
  if (status === "passed") return "승인";
  if (status === "failed") return "NCR";
  if (status === "hold") return "보류";
  return status;
}

export default function QualityItemPage() {
  const router = useRouter();

  const [requestId, setRequestId] = useState("");
  const [currentStatus, setCurrentStatus] = useState("-");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const value = path.split("/").pop() ?? "";
    setRequestId(decodeURIComponent(value));
  }, []);

  useEffect(() => {
    if (!requestId) return;

    const fetchCurrentQc = async () => {
      const { data, error } = await supabase
        .from("qc_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (error || !data) {
        console.error(error);
        return;
      }

      setCurrentStatus(data.qc_status);
    };

    fetchCurrentQc();
  }, [requestId]);

  const saveWorkflowAndActivity = async ({
    currentQc,
    previousStatus,
    nextStatus,
    action,
    saveMemo,
    ncrId,
  }: {
    currentQc: any;
    previousStatus: string;
    nextStatus: string;
    action: string;
    saveMemo: string;
    ncrId?: string | null;
  }) => {
    const { error: historyError } = await supabase
      .from("workflow_status_histories")
      .insert({
        bom_item_id: currentQc.bom_item_id,
        workflow_type: "qc",
        from_status: previousStatus,
        to_status: nextStatus,
        changed_by: null,
        changed_at: new Date().toISOString(),
        source_table: "qc_requests",
        source_id: currentQc.id,
        memo: saveMemo,
      });

    if (historyError) {
      throw historyError;
    }

    const { error: activityError } = await supabase
      .from("activity_logs")
      .insert({
        user_id: null,
        company_id: null,
        project_id: null,
        bom_item_id: currentQc.bom_item_id,

        target_type: "qc_request",
        target_id: currentQc.id,

        action,

        before_value: {
          qc_status: previousStatus,
        },

        after_value: {
          qc_status: nextStatus,
          ncr_report_id: ncrId ?? null,
        },

        memo: saveMemo,
      });

    if (activityError) {
      throw activityError;
    }
  };

  const handleApprove = async () => {
    if (!requestId) {
      alert("QC 요청 ID를 찾지 못했습니다.");
      return;
    }

    setSaving(true);

    const { data: currentQc, error: currentQcError } = await supabase
      .from("qc_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (currentQcError || !currentQc) {
      alert("QC 정보를 찾지 못했습니다.");
      console.error(currentQcError);
      setSaving(false);
      return;
    }

    const previousStatus = currentQc.qc_status;
    const nextStatus = "passed";
    const saveMemo = memo || "검사 승인";

    const { error: updateError } = await supabase
      .from("qc_requests")
      .update({
        qc_status: nextStatus,
        memo: saveMemo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      alert("검사 승인 저장 실패");
      console.error(updateError);
      setSaving(false);
      return;
    }

    try {
      await saveWorkflowAndActivity({
        currentQc,
        previousStatus,
        nextStatus,
        action: "qc_approved",
        saveMemo,
      });
    } catch (error) {
      alert("검사 승인은 저장됐지만 이력 저장에 실패했습니다.");
      console.error(error);
      setSaving(false);
      return;
    }

    alert("검사 승인 처리되었습니다.");
    router.push("/workspace/partner/quality");
    router.refresh();
  };

  const handleCreateNcr = async () => {
    if (!requestId) {
      alert("QC 요청 ID를 찾지 못했습니다.");
      return;
    }

    setSaving(true);

    const { data: currentQc, error: currentQcError } = await supabase
      .from("qc_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (currentQcError || !currentQc) {
      alert("QC 정보를 찾지 못했습니다.");
      console.error(currentQcError);
      setSaving(false);
      return;
    }

    const previousStatus = currentQc.qc_status;
    const nextStatus = "failed";
    const saveMemo = memo || "NCR 등록";

    const { error: updateError } = await supabase
      .from("qc_requests")
      .update({
        qc_status: nextStatus,
        memo: saveMemo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      alert("QC NCR 상태 저장 실패");
      console.error(updateError);
      setSaving(false);
      return;
    }

    const { data: ncrReport, error: ncrError } = await supabase
      .from("ncr_reports")
      .insert({
        bom_item_id: currentQc.bom_item_id,
        qc_request_id: currentQc.id,
        title: "품질 부적합 등록",
        description: saveMemo,
        status: "registered",
      })
      .select("id")
      .single();

    if (ncrError || !ncrReport) {
      alert("QC 상태는 NCR로 저장됐지만 NCR 리포트 생성에 실패했습니다.");
      console.error(ncrError);
      setSaving(false);
      return;
    }

    try {
      await saveWorkflowAndActivity({
        currentQc,
        previousStatus,
        nextStatus,
        action: "qc_ncr_created",
        saveMemo,
        ncrId: ncrReport.id,
      });
    } catch (error) {
      alert("NCR은 생성됐지만 이력 저장에 실패했습니다.");
      console.error(error);
      setSaving(false);
      return;
    }

    alert("NCR이 등록되었습니다.");
    router.push("/workspace/partner/quality");
    router.refresh();
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="검사관리"
          description="검사 승인 또는 NCR 등록을 처리합니다."
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">QC Request</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            {requestId || "로딩중..."}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KpiCard title="현재상태" value={getQcStatusLabel(currentStatus)} />
          <KpiCard title="가능액션" value="승인 / NCR" />
          <KpiCard title="Workflow" value="QC" />
          <KpiCard title="Audit" value="ON" />
        </div>

        <div className="flex items-start gap-4">
          <section className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">
              검사 처리
            </h2>

            <div className="mt-4 space-y-4">
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs text-gray-500">현재 검사상태</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {getQcStatusLabel(currentStatus)}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  검사 메모 / NCR 사유
                </label>

                <textarea
                  rows={4}
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  placeholder="검사 결과, 승인 사유, NCR 사유 등을 입력하세요."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/workspace/partner/quality")}
                  className="h-11 rounded-md border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700"
                >
                  취소
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={saving}
                  className="h-11 rounded-md bg-black px-6 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "저장중..." : "승인"}
                </button>

                <button
                  type="button"
                  onClick={handleCreateNcr}
                  disabled={saving}
                  className="h-11 rounded-md border border-red-300 bg-red-50 px-6 text-sm font-semibold text-red-700 disabled:opacity-50"
                >
                  {saving ? "저장중..." : "NCR 등록"}
                </button>
              </div>
            </div>
          </section>

          <aside className="w-80 shrink-0">
            <RightDetailPanel
              title="검사 상세"
              items={[
                { label: "QC ID", value: requestId || "-" },
                { label: "현재상태", value: getQcStatusLabel(currentStatus) },
                { label: "승인 시", value: "qc_requests → passed" },
                { label: "NCR 시", value: "ncr_reports 생성" },
                { label: "공통 이력", value: "workflow + activity" },
              ]}
            />
          </aside>
        </div>
      </div>
    </WorkspaceLayout>
  );
}