"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

const PROCESS_COLUMNS = [
  "대기",
  "소재입고",
  "소재검수",
  "내부공정",
  "외부공정",
  "검수요청",
];

function getProcessColor(process: string) {
  if (process === "대기") return "bg-slate-500";
  if (process === "소재입고") return "bg-blue-600";
  if (process === "소재검수") return "bg-purple-600";
  if (process === "내부공정") return "bg-emerald-600";
  if (process === "외부공정") return "bg-orange-500";
  if (process === "검수요청") return "bg-cyan-600";
  return "bg-slate-500";
}

function getProgress(process: string) {
  if (process === "대기") return 0;
  if (process === "소재입고") return 20;
  if (process === "소재검수") return 35;
  if (process === "내부공정") return 60;
  if (process === "외부공정") return 80;
  if (process === "검수요청") return 100;
  return 0;
}

export default function ProductionProcessPage() {
  const searchParams = useSearchParams();
  const selectedProjectCode = searchParams.get("project");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [changedItems, setChangedItems] = useState<Map<string, string>>(
    new Map()
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .order("project_code", { ascending: true });

      const currentProject =
        selectedProjectCode && projectData?.some((p) => p.project_code === selectedProjectCode)
          ? projectData.find((p) => p.project_code === selectedProjectCode)
          : projectData?.[0];

      setProjects(projectData ?? []);
      setSelectedProject(currentProject ?? null);

      if (!currentProject?.id) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data: bomItems } = await supabase
        .from("bom_items")
        .select("*")
        .eq("project_id", currentProject.id)
        .order("part_number", { ascending: true });

      const bomIds = bomItems?.map((item) => item.id) ?? [];

      const { data: productionUpdates } = bomIds.length
        ? await supabase
            .from("production_updates")
            .select("*")
            .in("bom_item_id", bomIds)
        : { data: [] };

      const productionMap = new Map();

      productionUpdates?.forEach((update) => {
        productionMap.set(String(update.bom_item_id), update);
      });

      const rows =
        bomItems?.map((item) => {
          const update = productionMap.get(String(item.id));
          const process = update?.process_step ?? item.process_type ?? "대기";

          return {
            id: item.id,
            project_id: item.project_id,
            part_number: item.part_number,
            part_name: item.part_name,
            drawing_no: item.drawing_no ?? "-",
            material: item.material ?? "-",
            quantity: item.quantity ?? 0,
            unit: item.unit ?? "",
            process,
            original_process: process,
            progress: update?.progress ?? getProgress(process),
            memo: update?.memo ?? "-",
          };
        }) ?? [];

      setItems(rows);
      setChangedItems(new Map());
      setLoading(false);
    }

    fetchData();
  }, [selectedProjectCode]);

  const columns = useMemo(() => {
    return PROCESS_COLUMNS.map((process) => ({
      process,
      items: items.filter((item) => item.process === process),
    }));
  }, [items]);

  function handleDrop(targetProcess: string) {
    if (!draggingId) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === draggingId
          ? {
              ...item,
              process: targetProcess,
              progress: getProgress(targetProcess),
            }
          : item
      )
    );

    const draggedItem = items.find((item) => item.id === draggingId);

    if (draggedItem && draggedItem.original_process !== targetProcess) {
      setChangedItems((prev) => {
        const next = new Map(prev);
        next.set(draggingId, targetProcess);
        return next;
      });
    }

    if (draggedItem && draggedItem.original_process === targetProcess) {
      setChangedItems((prev) => {
        const next = new Map(prev);
        next.delete(draggingId);
        return next;
      });
    }

    setDraggingId(null);
  }

  async function handleSave() {
    if (!changedItems.size) return;

    setSaving(true);

    for (const [itemId, newProcess] of changedItems.entries()) {
      const targetItem = items.find((item) => item.id === itemId);
      if (!targetItem) continue;

      const previousProcess = targetItem.original_process;
      const progress = getProgress(newProcess);
      const productionStatus =
        newProcess === "검수요청" ? "completed" : "in_progress";

      const { data: existingUpdate } = await supabase
        .from("production_updates")
        .select("id")
        .eq("bom_item_id", itemId)
        .maybeSingle();

      if (existingUpdate?.id) {
        await supabase
          .from("production_updates")
          .update({
            process_step: newProcess,
            progress,
            status: productionStatus,
            memo: `${previousProcess} → ${newProcess}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUpdate.id);
      } else {
        await supabase.from("production_updates").insert({
          bom_item_id: itemId,
          process_step: newProcess,
          progress,
          status: productionStatus,
          memo: `${previousProcess} → ${newProcess}`,
          updated_at: new Date().toISOString(),
        });
      }

      await supabase
        .from("bom_items")
        .update({
          process_type: newProcess,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId);

      await supabase.from("workflow_status_histories").insert({
        bom_item_id: itemId,
        workflow_type: "production",
        from_status: previousProcess,
        to_status: newProcess,
        memo: "공정별 칸반 드래그 변경",
        changed_at: new Date().toISOString(),
      });

      await supabase.from("activity_logs").insert({
        project_id: targetItem.project_id,
        bom_item_id: itemId,
        target_type: "production",
        action: "production_process_change",
        memo: `공정별 칸반: ${previousProcess} → ${newProcess}`,
        created_at: new Date().toISOString(),
      });

      if (newProcess === "검수요청") {
        const { data: existingQc } = await supabase
          .from("qc_requests")
          .select("id")
          .eq("bom_item_id", itemId)
          .maybeSingle();

        if (!existingQc) {
          await supabase.from("qc_requests").insert({
            bom_item_id: itemId,
            qc_status: "requested",
            priority: false,
            memo: "공정별 칸반에서 검수요청 자동 생성",
          });

          await supabase.from("activity_logs").insert({
            project_id: targetItem.project_id,
            bom_item_id: itemId,
            target_type: "qc",
            action: "production_qc_requested",
            memo: "공정별 칸반 검수요청으로 QC 요청 자동 생성",
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        original_process: item.process,
      }))
    );

    setChangedItems(new Map());
    setSaving(false);
  }

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-sm font-bold text-slate-500">
          공정별 데이터를 불러오는 중...
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-950">
              공정별 상세관리
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              카드를 드래그하여 공정을 변경하고 저장할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              프로젝트명, PO번호, 고객사 검색
            </div>

            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              필터
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
              G1
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-[240px_repeat(7,1fr)] items-center gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500">
                프로젝트(PO)
              </div>
              <div className="mt-3">
                <ProjectSelector
                  projects={projects.map((project) => ({
                    id: project.project_code,
                    name: `${project.project_code} / ${project.project_name}`,
                  }))}
                />
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <div className="text-xs font-bold text-slate-500">전체 품목</div>
              <div className="mt-1 text-xl font-black text-slate-950">
                {items.length}
                <span className="ml-1 text-sm font-bold text-slate-500">
                  개
                </span>
              </div>
            </div>

            {PROCESS_COLUMNS.map((process) => (
              <div key={process} className="border-l border-slate-200 pl-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${getProcessColor(
                      process
                    )}`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-500">
                      {process}
                    </div>
                    <div className="mt-1 text-xl font-black text-slate-950">
                      {items.filter((item) => item.process === process).length}
                      <span className="ml-1 text-sm font-bold text-slate-500">
                        개
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between">
          <div className="w-96 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">
            품목명, 도면번호 검색
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
              공정별 보기
            </button>

            <button className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">
              설비별 보기
            </button>

            <button className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700">
              변경된 품목 {changedItems.size}건
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!changedItems.size || saving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {saving ? "저장 중..." : "공정변경 저장"}
            </button>
          </div>
        </div>

        <section className="overflow-x-auto">
          <div className="grid min-w-[1500px] grid-cols-6 gap-3">
            {columns.map((column) => (
              <div
                key={column.process}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(column.process)}
                className="flex min-h-[620px] flex-col rounded-2xl border border-slate-200 bg-white"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-full ${getProcessColor(
                        column.process
                      )}`}
                    />
                    <h2 className="text-base font-black text-slate-950">
                      {column.process}
                    </h2>
                  </div>

                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black text-slate-600">
                    {column.items.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 p-3">
                  {column.items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDraggingId(item.id)}
                      className={[
                        "cursor-grab rounded-xl border bg-white p-4 shadow-sm transition active:cursor-grabbing",
                        changedItems.has(item.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300 hover:bg-blue-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-black text-slate-950">
                            {item.part_number}
                          </div>
                          <div className="mt-1 text-xs font-bold text-slate-600">
                            {item.part_name}
                          </div>
                          <div className="mt-1 text-xs font-medium text-slate-500">
                            {item.drawing_no}
                          </div>
                        </div>

                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
                          {item.material}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="font-bold text-slate-400">수량</div>
                          <div className="mt-1 font-black text-slate-700">
                            {item.quantity} {item.unit}
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-slate-400">진행률</div>
                          <div className="mt-1 font-black text-blue-600">
                            {item.progress}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{
                            width: `${Math.min(item.progress, 100)}%`,
                          }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <Link
                          href={`/workspace/partner/production/item/${item.id}`}
                          className="text-xs font-black text-blue-600 hover:underline"
                        >
                          상세변경
                        </Link>

                        {changedItems.has(item.id) ? (
                          <span className="rounded-md bg-blue-600 px-2 py-1 text-[11px] font-black text-white">
                            변경됨
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}

                  <button className="mt-auto w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
                    + 품목 추가
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <div className="flex flex-wrap gap-4">
            {PROCESS_COLUMNS.map((process) => (
              <div key={process} className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${getProcessColor(process)}`}
                />
                {process}
              </div>
            ))}
          </div>

          <div>카드를 드래그한 뒤 공정변경 저장을 눌러 반영합니다.</div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}