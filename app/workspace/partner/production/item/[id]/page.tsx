"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import { supabase } from "@/lib/supabase";

const PROCESS_STEPS = [
  "대기",
  "소재입고",
  "소재검수",
  "내부공정",
  "외부공정",
  "검수요청",
];

export default function ProductionItemPage() {
  const params = useParams();
  const router = useRouter();

  const itemId = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bomItem, setBomItem] = useState<any>(null);
  const [currentProcess, setCurrentProcess] = useState("대기");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    async function fetchCurrentProduction() {
      setLoading(true);

      const { data: bom, error: bomError } = await supabase
        .from("bom_items")
        .select("id, project_id, part_number, part_name, process_type")
        .eq("id", itemId)
        .single();

      if (bomError || !bom) {
        console.error("BOM 조회 실패:", bomError);
        setLoading(false);
        return;
      }

      setBomItem(bom);

      const { data: productionUpdate, error: productionError } = await supabase
        .from("production_updates")
        .select("*")
        .eq("bom_item_id", bom.id)
        .maybeSingle();

      if (productionError) {
        console.error("생산상태 조회 실패:", productionError);
      }

      setCurrentProcess(
        productionUpdate?.process_step ?? bom.process_type ?? "대기"
      );

      setLoading(false);
    }

    if (itemId) {
      fetchCurrentProduction();
    }
  }, [itemId]);

  async function handleSave() {
    if (!bomItem) return;

    setSaving(true);

    const progress =
      currentProcess === "대기"
        ? 0
        : currentProcess === "소재입고"
          ? 15
          : currentProcess === "소재검수"
            ? 30
            : currentProcess === "내부공정"
              ? 55
              : currentProcess === "외부공정"
                ? 75
                : currentProcess === "검수요청"
                  ? 100
                  : 0;

    const productionStatus =
      currentProcess === "검수요청" ? "completed" : "in_progress";

    const { data: existingUpdate } = await supabase
      .from("production_updates")
      .select("id, process_step")
      .eq("bom_item_id", bomItem.id)
      .maybeSingle();

    const previousProcess =
      existingUpdate?.process_step ?? bomItem.process_type ?? "대기";

    if (existingUpdate?.id) {
      await supabase
        .from("production_updates")
        .update({
          process_step: currentProcess,
          progress,
          status: productionStatus,
          memo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUpdate.id);
    } else {
      await supabase.from("production_updates").insert({
        bom_item_id: bomItem.id,
        process_step: currentProcess,
        progress,
        status: productionStatus,
        memo,
      });
    }

    await supabase
      .from("bom_items")
      .update({
        process_type: currentProcess,
      })
      .eq("id", bomItem.id);

    await supabase.from("workflow_status_histories").insert({
      bom_item_id: bomItem.id,
      workflow_type: "production",
      from_status: previousProcess,
      to_status: currentProcess,
      memo,
      changed_at: new Date().toISOString(),
    });

    await supabase.from("activity_logs").insert({
      project_id: bomItem.project_id,
      bom_item_id: bomItem.id,
      target_type: "production",
      action: "production_process_change",
      memo: memo || `${previousProcess} → ${currentProcess}`,
      created_at: new Date().toISOString(),
    });

    if (currentProcess === "검수요청") {
      const { data: existingQc } = await supabase
        .from("qc_requests")
        .select("id")
        .eq("bom_item_id", bomItem.id)
        .maybeSingle();

      if (!existingQc) {
        await supabase.from("qc_requests").insert({
          bom_item_id: bomItem.id,
          qc_status: "requested",
          priority: false,
          memo: "생산관리에서 검수요청 자동 생성",
        });

        await supabase.from("activity_logs").insert({
          project_id: bomItem.project_id,
          bom_item_id: bomItem.id,
          target_type: "qc",
          action: "production_qc_requested",
          memo: "생산관리 검수요청으로 QC 요청 자동 생성",
          created_at: new Date().toISOString(),
        });
      }
    }

    setSaving(false);
    router.push(`/workspace/partner/production`);
  }

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-sm text-gray-500">생산 정보를 불러오는 중...</div>
      </WorkspaceLayout>
    );
  }

  if (!bomItem) {
    return (
      <WorkspaceLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          생산 품목을 찾지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="공정변경"
          description="BOM 품목 기준으로 생산 공정을 변경합니다."
        />

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">품목정보</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {bomItem.part_number} / {bomItem.part_name}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            현재 공정
          </label>

          <select
            value={currentProcess}
            onChange={(event) => setCurrentProcess(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {PROCESS_STEPS.map((step) => (
              <option key={step} value={step}>
                {step}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            메모
          </label>

          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="공정 변경 메모를 입력하세요."
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            취소
          </button>
        </div>
      </div>
    </WorkspaceLayout>
  );
}