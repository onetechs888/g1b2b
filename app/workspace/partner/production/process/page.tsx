"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  ClipboardCheck,
  Factory,
  Filter,
  MoreHorizontal,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";

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
  if (process === "대기")
    return "bg-slate-500 text-slate-600 bg-slate-50 border-slate-200";
  if (process === "소재입고")
    return "bg-blue-600 text-blue-600 bg-blue-50 border-blue-200";
  if (process === "소재검수")
    return "bg-purple-600 text-purple-600 bg-purple-50 border-purple-200";
  if (process === "내부공정")
    return "bg-emerald-600 text-emerald-600 bg-emerald-50 border-emerald-200";
  if (process === "외부공정")
    return "bg-orange-500 text-orange-600 bg-orange-50 border-orange-200";
  if (process === "검수요청")
    return "bg-cyan-600 text-cyan-600 bg-cyan-50 border-cyan-200";
  return "bg-slate-500 text-slate-600 bg-slate-50 border-slate-200";
}

function getBadgeClass(process: string) {
  const classes = getProcessColor(process).split(" ");
  return `${classes[2]} ${classes[1]} ${classes[3]}`;
}

function getProcessIcon(process: string) {
  if (process === "대기") return PackageOpen;
  if (process === "소재입고") return Truck;
  if (process === "소재검수") return ShieldCheck;
  if (process === "내부공정") return Wrench;
  if (process === "외부공정") return Factory;
  if (process === "검수요청") return ClipboardCheck;
  return PackageCheck;
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
  const rawSelectedProjectCode = searchParams.get("project");
  const selectedProjectCode =
    rawSelectedProjectCode === "all" ? null : rawSelectedProjectCode;

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
        selectedProjectCode &&
        projectData?.some(
          (project) => project.project_code === selectedProjectCode
        )
          ? projectData.find(
              (project) => project.project_code === selectedProjectCode
            )
          : null;

      setProjects(projectData ?? []);
      setSelectedProject(currentProject ?? null);

      let bomQuery = supabase
        .from("bom_items")
        .select("*")
        .order("part_number", { ascending: true });

      if (currentProject?.id) {
        bomQuery = bomQuery.eq("project_id", currentProject.id);
      }

      const { data: bomItems } = await bomQuery;
      const bomIds = bomItems?.map((item) => item.id) ?? [];

      const { data: productionUpdates } = bomIds.length
        ? await supabase
            .from("production_updates")
            .select("*")
            .in("bom_item_id", bomIds)
        : { data: [] };

      const projectMap = new Map();
      projectData?.forEach((project) => {
        projectMap.set(String(project.id), project);
      });

      const productionMap = new Map();
      productionUpdates?.forEach((update) => {
        productionMap.set(String(update.bom_item_id), update);
      });

      const rows =
        bomItems?.map((item) => {
          const update = productionMap.get(String(item.id));
          const process = update?.process_step ?? item.process_type ?? "대기";
          const project = projectMap.get(String(item.project_id));

          return {
            id: item.id,
            project_id: item.project_id,
            project_code: project?.project_code ?? "-",
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
            updated_at: update?.updated_at ?? item.updated_at,
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

  const totalCount = items.length;
  const changedCount = changedItems.size;

  function handleDrop(targetProcess: string) {
    if (!draggingId) return;

    const draggedItem = items.find((item) => item.id === draggingId);
    if (!draggedItem) {
      setDraggingId(null);
      return;
    }

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

    setChangedItems((prev) => {
      const next = new Map(prev);

      if (draggedItem.original_process === targetProcess) {
        next.delete(draggingId);
      } else {
        next.set(draggingId, targetProcess);
      }

      return next;
    });

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

      const { data: existingQc } = await supabase
        .from("qc_requests")
        .select("id, qc_status")
        .eq("bom_item_id", itemId)
        .maybeSingle();

      if (newProcess === "검수요청") {
        if (existingQc?.id) {
          await supabase
            .from("qc_requests")
            .update({
              qc_status: "requested",
              is_active: true,
              memo: "생산관리에서 검수요청 재이관",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingQc.id);
        } else {
          await supabase.from("qc_requests").insert({
            bom_item_id: itemId,
            qc_status: "requested",
            is_active: true,
            priority: false,
            memo: "생산관리에서 최초 검수요청",
            created_at: new Date().toISOString(),
          });
        }

        await supabase.from("activity_logs").insert({
          project_id: targetItem.project_id,
          bom_item_id: itemId,
          target_type: "qc",
          action: existingQc?.id ? "qc_re_requested" : "qc_requested",
          memo: existingQc?.id
            ? "기존 QC 요청 재활성화: 생산관리 검수요청 재이관"
            : "생산 공정 검수요청 → 품질관리 최초 이관",
          created_at: new Date().toISOString(),
        });
      } else if (existingQc?.id) {
        await supabase
          .from("qc_requests")
          .update({
            is_active: false,
            memo: `생산관리로 회수: ${newProcess}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingQc.id);

        await supabase.from("activity_logs").insert({
          project_id: targetItem.project_id,
          bom_item_id: itemId,
          target_type: "qc",
          action: "qc_deactivated",
          memo: `검수요청 해제. 생산 공정으로 회수: ${newProcess}`,
          created_at: new Date().toISOString(),
        });
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

  const projectQuery = selectedProject?.project_code
    ? `?project=${selectedProject.project_code}`
    : "";

  return (
    <WorkspaceLayout>
      <style>{`
        .g1-scroll-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .g1-scroll-hide::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                공정별 상세관리
              </h1>

              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                <Factory size={18} />
              </div>
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              품목의 공정 진행 현황을 칸반으로 확인하고 관리할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-[300px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-400 shadow-sm">
                <span>프로젝트명, PO번호, 고객사 검색</span>
                <Search className="ml-auto text-slate-500" size={16} />
              </div>

              <button className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm">
                <Filter size={15} />
                필터
              </button>

              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200">
                <Bell size={16} />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                  {changedCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <RefreshCw size={13} />
              변경된 품목
              <span className="text-slate-950">{changedCount}건</span>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[260px_repeat(6,1fr)] items-center gap-0 divide-x divide-slate-100 px-4 py-3">
            <div className="pr-4">
              <ProjectSelector
                projects={
                  projects?.map((project) => ({
                    id: project.project_code,
                    name: `${project.project_code} / ${project.project_name}`,
                  })) ?? []
                }
              />
            </div>

            <div className="px-4">
              <div className="text-[11px] font-black text-slate-500">
                전체 품목
              </div>
              <div className="mt-0.5 text-xl font-black text-slate-950">
                {totalCount}
                <span className="ml-1 text-xs font-bold text-slate-500">
                  개
                </span>
              </div>
            </div>

            {PROCESS_COLUMNS.slice(1).map((process) => {
              const Icon = getProcessIcon(process);

              return (
                <div key={process} className="px-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border ${getBadgeClass(
                        process
                      )}`}
                    >
                      <Icon size={15} />
                    </div>

                    <div>
                      <div className="text-[11px] font-black text-slate-500">
                        {process}
                      </div>
                      <div className="mt-0.5 text-xl font-black text-slate-950">
                        {
                          items.filter((item) => item.process === process)
                            .length
                        }
                        <span className="ml-1 text-xs font-bold text-slate-500">
                          개
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex h-9 w-[300px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-400 shadow-sm">
              <span>품목명, 도면 검색</span>
              <Search className="ml-auto text-slate-500" size={16} />
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/workspace/partner/production/items${projectQuery}`}
                className="flex h-9 items-center rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                품목별 보기
              </Link>

              <button
                onClick={handleSave}
                disabled={!changedItems.size || saving}
                className="flex h-9 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save size={15} />
                {saving ? "저장중" : "공정변경 저장"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm font-bold text-slate-400">
              공정 데이터를 불러오는 중입니다.
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-3 overflow-x-auto pb-2">
              {columns.map((column) => {
                const Icon = getProcessIcon(column.process);

                return (
                  <div
                    key={column.process}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(column.process)}
                    className="min-h-[520px] rounded-2xl border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border ${getBadgeClass(
                            column.process
                          )}`}
                        >
                          <Icon size={15} />
                        </div>

                        <h2 className="text-sm font-black text-slate-950">
                          {column.process}
                        </h2>
                      </div>

                      <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                        {column.items.length}
                      </span>
                    </div>

                    <div className="g1-scroll-hide max-h-[620px] space-y-2 overflow-y-auto pr-1">
                      {column.items.map((item) => {
                        const isChanged = changedItems.has(item.id);

                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => setDraggingId(item.id)}
                            onDragEnd={() => setDraggingId(null)}
                            className={[
                              "cursor-grab rounded-xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
                              isChanged
                                ? "border-emerald-400 bg-emerald-50"
                                : "border-slate-200 hover:border-emerald-200",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-black text-slate-950">
                                  {item.part_number}
                                </div>
                                <div className="mt-0.5 truncate text-xs font-bold text-slate-600">
                                  {item.part_name}
                                </div>
                                <div className="mt-1 truncate text-xs font-semibold text-slate-500">
                                  {item.drawing_no}
                                </div>
                              </div>

                              <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50">
                                <MoreHorizontal size={15} />
                              </button>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
                                {item.material}
                              </span>

                              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
                                {item.quantity}
                                {item.unit}
                              </span>

                              {selectedProject === null && (
                                <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">
                                  {item.project_code}
                                </span>
                              )}
                            </div>

                            <div className="mt-3">
                              <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-slate-500">
                                <span>진행률</span>
                                <span>{item.progress}%</span>
                              </div>

                              <div className="h-2 rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full bg-slate-400"
                                  style={{
                                    width: `${Math.min(item.progress, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <Link
                                href={`/workspace/partner/production/item/${item.id}`}
                                className="text-xs font-black text-emerald-700 hover:underline"
                              >
                                상세변경
                              </Link>

                              {isChanged && (
                                <span className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-black text-white">
                                  변경됨
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </WorkspaceLayout>
  );
}