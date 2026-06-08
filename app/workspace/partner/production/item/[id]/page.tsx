"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

const processOptions = [
  "소재준비",
  "소재검수",
  "가공대기",
  "가공중",
  "가공완료",
  "후공정",
  "검사요청",
  "출하준비",
  "출하",
];

export default function ProductionItemPage() {
  const router = useRouter();

  const [itemId, setItemId] = useState("");
  const [nextProcess, setNextProcess] = useState("가공완료");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const value = path.split("/").pop() ?? "";
    setItemId(decodeURIComponent(value));
  }, []);

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

    const previousProcess = currentUpdate.process_step ?? "미확인";

    const nextStatus =
      nextProcess === "가공완료" || nextProcess === "검사요청"
        ? "completed"
        : "in_progress";

    const nextProgress =
      nextProcess === "검사요청"
        ? 90
        : nextProcess === "가공완료"
          ? 80
          : 60;

    const saveMemo = memo || "공정 변경";

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
      alert("공정 변경 저장에 실패했습니다.");
      console.error(updateError);
      setSaving(false);
      return;
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
      alert("공정 변경은 저장됐지만 상태 이력 저장에 실패했습니다.");
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
        action: "process_change",
        before_value: {
          process_step: previousProcess,
          progress: currentUpdate.progress,
          status: currentUpdate.status,
        },
        after_value: {
          process_step: nextProcess,
          progress: nextProgress,
          status: nextStatus,
        },
        memo: saveMemo,
      });

    if (activityError) {
      alert("공정 변경과 상태 이력은 저장됐지만 Audit Log 저장에 실패했습니다.");
      console.error(activityError);
      setSaving(false);
      return;
    }

    alert("공정 변경이 저장되었습니다.");
    router.push("/workspace/partner/production");
    router.refresh();
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="공정변경"
          description="BOM 품목의 생산 공정을 변경합니다."
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">선택 품목</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            {itemId || "로딩중..."}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KpiCard title="현재공정" value="DB 기준 조회 예정" />
          <KpiCard title="변경공정" value={nextProcess} />
          <KpiCard title="Revision" value="REV-A" />
          <KpiCard title="담당자" value="원동협" />
        </div>

        <div className="flex items-start gap-4">
          <section className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">
              공정 변경
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  변경할 공정
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
                  placeholder="공정 변경 사유 또는 작업 내용을 입력하세요."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/workspace/partner/production")}
                  className="h-12 rounded-lg border-2 border-black bg-white px-6 text-base font-bold text-black"
                >
                  취소
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-12 rounded-lg border-4 border-red-600 bg-yellow-300 px-8 text-base font-extrabold text-black disabled:opacity-50"
                >
                  {saving ? "저장중..." : "저장"}
                </button>
              </div>
            </div>
          </section>

          <aside className="w-80 shrink-0">
            <RightDetailPanel
              title="품목 상세"
              items={[
                { label: "품목번호", value: itemId || "-" },
                { label: "Workflow", value: "production" },
                { label: "상태 이력", value: "workflow_status_histories" },
                { label: "Audit Log", value: "activity_logs" },
              ]}
            />
          </aside>
        </div>
      </div>
    </WorkspaceLayout>
  );
}