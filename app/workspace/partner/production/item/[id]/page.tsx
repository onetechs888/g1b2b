"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

const processOptions = [
  "대기",
  "소재입고",
  "소재검수",
  "내부공정",
  "외부공정",
  "검수요청",
];

function getProgressByProcess(process: string) {
  if (process === "대기") return 0;
  if (process === "소재입고") return 15;
  if (process === "소재검수") return 30;
  if (process === "내부공정") return 60;
  if (process === "외부공정") return 80;
  if (process === "검수요청") return 90;
  return 0;
}

function getStatusByProcess(process: string) {
  if (process === "대기") return "not_started";
  if (process === "검수요청") return "completed";
  return "in_progress";
}

export default function ProductionItemPage() {
  const router = useRouter();

  const [itemId, setItemId] = useState("");
  const [currentProcess, setCurrentProcess] = useState("-");
  const [nextProcess, setNextProcess] = useState("소재입고");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const value = path.split("/").pop() ?? "";
    setItemId(decodeURIComponent(value));
  }, []);

  useEffect(() => {
    if (!itemId) return;

    const fetchCurrentProduction = async () => {
      const { data: bomItem, error: bomError } = await supabase
        .from("bom_items")
        .select("id, part_number")
        .eq("part_number", itemId)
        .single();

      if (bomError || !bomItem) {
        console.error(bomError);
        return;
      }

      const { data: productionUpdate, error: productionError } = await supabase
        .from("production_updates")
        .select("*")
        .eq("bom_item_id", bomItem.id)
        .single();

      if (productionError || !productionUpdate) {
        console.error(productionError);
        return;
      }

      setCurrentProcess(productionUpdate.process_step ?? "대기");
      setNextProcess(productionUpdate.process_step ?? "소재입고");
    };

    fetchCurrentProduction();
  }, [itemId]);

  const handleSave = async () => {
    if (!itemId) {
      alert("품목번호를 찾지 못했습니다.");
      return;
    }

    setSaving(true);

    const { data: bomItem, error: bomError } = await supabase
      .from("bom_items")
      .select("id, project_id, part_number")
      .eq("part_number", itemId)
      .single();

    if (bomError || !bomItem) {
      alert("BOM 품목을 찾지 못했습니다.");
      console.error(bomError);
      setSaving(false);
      return;
    }

    const { data: currentUpdate, error: currentUpdateError } = await supabase
      .from("production_updates")
      .select("*")
      .eq("bom_item_id", bomItem.id)
      .single();

    if (currentUpdateError || !currentUpdate) {
      alert("현재 생산 업데이트 정보를 찾지 못했습니다.");
      console.error(currentUpdateError);
      setSaving(false);
      return;
    }

    const previousProcess = currentUpdate.process_step ?? "대기";
    const nextProgress = getProgressByProcess(nextProcess);
    const nextStatus = getStatusByProcess(nextProcess);
    const saveMemo = memo || "생산 상태 변경";

    const { error: updateError } = await supabase
      .from("production_updates")
      .update({
        process_step: nextProcess,
        progress: nextProgress,
        status: nextStatus,
        memo: saveMemo,
        updated_at: new Date().toISOString(),
      })
      .eq("bom_item_id", bomItem.id);

    if (updateError) {
      alert("생산 상태 저장에 실패했습니다.");
      console.error(updateError);
      setSaving(false);
      return;
    }

    let qcRequestId: string | null = null;

    if (nextProcess === "검수요청") {
      const { data: existingQc } = await supabase
        .from("qc_requests")
        .select("id")
        .eq("bom_item_id", bomItem.id)
        .maybeSingle();

      if (existingQc?.id) {
        qcRequestId = existingQc.id;
      } else {
        const { data: qcRequest, error: qcError } = await supabase
          .from("qc_requests")
          .insert({
            bom_item_id: bomItem.id,
            qc_status: "scheduled",
            inspection_date: new Date().toISOString().slice(0, 10),
            priority: false,
            memo: "생산관리 검수요청 자동 생성",
          })
          .select("id")
          .single();

        if (qcError || !qcRequest) {
          alert("생산 상태는 저장됐지만 QC 요청 생성에 실패했습니다.");
          console.error(qcError);
          setSaving(false);
          return;
        }

        qcRequestId = qcRequest.id;
      }
    }

    const { error: historyError } = await supabase
      .from("workflow_status_histories")
      .insert({
        bom_item_id: bomItem.id,
        workflow_type: "production",
        from_status: previousProcess,
        to_status: nextProcess,
        changed_by: null,
        changed_at: new Date().toISOString(),
        source_table: "production_updates",
        source_id: currentUpdate.id,
        memo: saveMemo,
      });

    if (historyError) {
      alert("생산 상태는 저장됐지만 상태 이력 저장에 실패했습니다.");
      console.error(historyError);
      setSaving(false);
      return;
    }

    const { error: activityError } = await supabase
      .from("activity_logs")
      .insert({
        user_id: null,
        company_id: null,
        project_id: bomItem.project_id,
        bom_item_id: bomItem.id,

        target_type: "production_update",
        target_id: currentUpdate.id,

        action:
          nextProcess === "검수요청"
            ? "production_qc_requested"
            : "production_process_change",

        before_value: {
          process_step: previousProcess,
          progress: currentUpdate.progress,
          status: currentUpdate.status,
        },

        after_value: {
          process_step: nextProcess,
          progress: nextProgress,
          status: nextStatus,
          qc_request_id: qcRequestId,
        },

        memo: saveMemo,
      });

    if (activityError) {
      alert("생산 상태와 이력은 저장됐지만 Activity Log 저장에 실패했습니다.");
      console.error(activityError);
      setSaving(false);
      return;
    }

    alert(
      nextProcess === "검수요청"
        ? "검수요청이 저장되었고 품질관리로 자동 이관되었습니다."
        : "생산 상태가 저장되었습니다."
    );

    router.push("/workspace/partner/production");
    router.refresh();
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="생산 상태 변경"
          description="BOM 품목의 생산 Workflow 상태를 변경합니다."
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">선택 품목</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            {itemId || "로딩중..."}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KpiCard title="현재상태" value={currentProcess} />
          <KpiCard title="변경상태" value={nextProcess} />
          <KpiCard title="Workflow" value="Production" />
          <KpiCard title="QC 이관" value={nextProcess === "검수요청" ? "ON" : "OFF"} />
        </div>

        <div className="flex items-start gap-4">
          <section className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">
              생산 Workflow 변경
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  변경할 생산 상태
                </label>

                <select
                  value={nextProcess}
                  onChange={(event) => setNextProcess(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  {processOptions.map((process) => (
                    <option key={process} value={process}>
                      {process}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  작업 메모
                </label>

                <textarea
                  rows={4}
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  placeholder="상태 변경 사유 또는 작업 내용을 입력하세요."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/workspace/partner/production")}
                  className="h-11 rounded-md border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700"
                >
                  취소
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-11 rounded-md bg-black px-6 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "저장중..." : "생산 상태 저장"}
                </button>
              </div>
            </div>
          </section>

          <aside className="w-80 shrink-0">
            <RightDetailPanel
              title="생산 상세"
              items={[
                { label: "품목번호", value: itemId || "-" },
                { label: "현재상태", value: currentProcess },
                { label: "변경상태", value: nextProcess },
                { label: "검수요청 시", value: "qc_requests 자동 생성" },
                { label: "공통 이력", value: "workflow + activity" },
              ]}
            />
          </aside>
        </div>
      </div>
    </WorkspaceLayout>
  );
}