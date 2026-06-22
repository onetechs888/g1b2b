"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { supabase } from "@/lib/supabase";

const PROCESS_STEPS = [
  "대기",
  "소재입고",
  "소재검수",
  "내부공정",
  "외부공정",
  "검수요청",
];

function getProgress(process: string) {
  if (process === "대기") return 0;
  if (process === "소재입고") return 20;
  if (process === "소재검수") return 35;
  if (process === "내부공정") return 60;
  if (process === "외부공정") return 80;
  if (process === "검수요청") return 100;
  return 0;
}

export default function ProductionItemDetailPage() {
  const params = useParams();
  const router = useRouter();

  const itemId = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bomItem, setBomItem] = useState<any>(null);
  const [projectCode, setProjectCode] = useState("");
  const [currentProcess, setCurrentProcess] = useState("대기");
  const [selectedProcess, setSelectedProcess] = useState("대기");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: bom, error: bomError } = await supabase
        .from("bom_items")
        .select("*")
        .eq("id", itemId)
        .single();

      if (bomError || !bom) {
        console.error("BOM 조회 실패:", bomError);
        setLoading(false);
        return;
      }

      setBomItem(bom);

      const { data: project } = await supabase
        .from("projects")
        .select("project_code")
        .eq("id", bom.project_id)
        .maybeSingle();

      setProjectCode(project?.project_code ?? "");

      const { data: productionUpdate, error: productionError } = await supabase
        .from("production_updates")
        .select("*")
        .eq("bom_item_id", bom.id)
        .maybeSingle();

      if (productionError) {
        console.error("생산상태 조회 실패:", productionError);
      }

      const process =
        productionUpdate?.process_step ?? bom.process_type ?? "대기";

      setCurrentProcess(process);
      setSelectedProcess(process);
      setMemo(productionUpdate?.memo ?? "");

      setLoading(false);
    }

    if (itemId) {
      fetchData();
    }
  }, [itemId]);

  async function handleSave() {
    if (!bomItem) return;

    setSaving(true);

    const progress = getProgress(selectedProcess);
    const productionStatus =
      selectedProcess === "검수요청" ? "completed" : "in_progress";

    const previousProcess = currentProcess;

    const { data: existingUpdate } = await supabase
      .from("production_updates")
      .select("id")
      .eq("bom_item_id", bomItem.id)
      .maybeSingle();

    if (existingUpdate?.id) {
      await supabase
        .from("production_updates")
        .update({
          process_step: selectedProcess,
          progress,
          status: productionStatus,
          memo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUpdate.id);
    } else {
      await supabase.from("production_updates").insert({
        bom_item_id: bomItem.id,
        process_step: selectedProcess,
        progress,
        status: productionStatus,
        memo,
        updated_at: new Date().toISOString(),
      });
    }

    await supabase
      .from("bom_items")
      .update({
        process_type: selectedProcess,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bomItem.id);

    await supabase.from("workflow_status_histories").insert({
      bom_item_id: bomItem.id,
      workflow_type: "production",
      from_status: previousProcess,
      to_status: selectedProcess,
      memo,
      changed_at: new Date().toISOString(),
    });

    await supabase.from("activity_logs").insert({
      project_id: bomItem.project_id,
      bom_item_id: bomItem.id,
      target_type: "production",
      action: "production_process_change",
      memo: memo || `${previousProcess} → ${selectedProcess}`,
      created_at: new Date().toISOString(),
    });

    if (selectedProcess === "검수요청") {
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

    router.push(
      projectCode
        ? `/workspace/partner/production/items?project=${projectCode}`
        : "/workspace/partner/production/items"
    );
  }

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-sm font-bold text-slate-500">
          품목 정보를 불러오는 중...
        </div>
      </WorkspaceLayout>
    );
  }

  if (!bomItem) {
    return (
      <WorkspaceLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
          품목 정보를 찾을 수 없습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const selectedProgress = getProgress(selectedProcess);

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-950">
              공정 변경
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              BOM 품목 기준으로 생산 공정을 변경합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                projectCode
                  ? `/workspace/partner/production/items?project=${projectCode}`
                  : "/workspace/partner/production/items"
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            품목별 상세관리로 돌아가기
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-black text-slate-950">품목 정보</h2>

            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs font-bold text-slate-500">품목번호</div>
                <div className="mt-1 font-black text-slate-950">
                  {bomItem.part_number}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500">품목명</div>
                <div className="mt-1 font-black text-slate-950">
                  {bomItem.part_name}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500">도면번호</div>
                <div className="mt-1 font-bold text-slate-700">
                  {bomItem.drawing_no ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500">REV</div>
                <div className="mt-1 font-bold text-slate-700">
                  {bomItem.revision ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500">소재</div>
                <div className="mt-1 font-bold text-slate-700">
                  {bomItem.material ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500">수량</div>
                <div className="mt-1 font-bold text-slate-700">
                  {bomItem.quantity ?? 0} {bomItem.unit ?? ""}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-black text-slate-950">생산 상태</h2>

            <div className="mt-5">
              <div className="text-xs font-bold text-slate-500">현재 공정</div>
              <div className="mt-2 text-2xl font-black text-blue-600">
                {currentProcess}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>변경 후 진행률</span>
                <span>{selectedProgress}%</span>
              </div>

              <div className="h-3 rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full bg-blue-600"
                  style={{
                    width: `${selectedProgress}%`,
                  }}
                />
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">공정 선택</h2>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {PROCESS_STEPS.map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setSelectedProcess(step)}
                className={[
                  "rounded-xl border p-4 text-center text-sm font-black transition",
                  selectedProcess === step
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {step}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-black text-slate-700">
              변경 메모
            </label>

            <textarea
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="공정 변경 사유 또는 특이사항을 입력하세요."
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                router.push(
                  projectCode
                    ? `/workspace/partner/production/items?project=${projectCode}`
                    : "/workspace/partner/production/items"
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              취소
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "저장 중..." : "변경사항 저장"}
            </button>
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}