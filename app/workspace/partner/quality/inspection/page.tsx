"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Upload,
  X,
  Timer,
} from "lucide-react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { useQualityEvidenceFiles } from "@/hooks/partner/useQualityEvidenceFiles";
import { supabase } from "@/lib/supabase";
import type { QualityFileType } from "@/services/partner/qualityFileService";

const QC_STATUS_OPTIONS = [
  { value: "requested", label: "검사요청" },
  { value: "scheduled", label: "검사대기" },
  { value: "inspecting", label: "검사진행중" },
  { value: "passed", label: "승인완료" },
  { value: "failed", label: "부적합(NCR)" },
  { value: "hold", label: "보류" },
];

const QC_DECISION_OPTIONS = [
  { value: "", label: "선택하세요" },
  { value: "passed", label: "합격" },
  { value: "failed", label: "부적합 / NCR" },
  { value: "hold", label: "보류" },
];

function getQcStatusLabel(status?: string | null) {
  if (status === "requested") return "검사요청";
  if (status === "scheduled") return "대기";
  if (status === "inspecting") return "검사 진행중";
  if (status === "passed") return "승인 완료";
  if (status === "failed") return "부적합 (NCR)";
  if (status === "hold") return "보류";
  return status ?? "-";
}

function getQcStatusBadgeClass(status?: string | null) {
  if (status === "requested") return "bg-slate-100 text-slate-700";
  if (status === "scheduled") return "bg-orange-50 text-orange-600";
  if (status === "inspecting") return "bg-blue-50 text-blue-600";
  if (status === "passed") return "bg-emerald-50 text-emerald-600";
  if (status === "failed") return "bg-red-50 text-red-600";
  if (status === "hold") return "bg-amber-50 text-amber-600";
  return "bg-slate-50 text-slate-600";
}

function formatDate(value?: string | null) {
  if (!value || value === "-") return "-";

  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function QualityInspectionPage() {
  const searchParams = useSearchParams();
  const rawSelectedProjectCode = searchParams.get("project");
  const selectedProjectCode =
    rawSelectedProjectCode === "all" ? null : rawSelectedProjectCode;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inspectionTypeFilter, setInspectionTypeFilter] = useState("all");
  const [inspectorFilter, setInspectorFilter] = useState("all");

  const [selectedStatus, setSelectedStatus] = useState("scheduled");
  const [selectedDecision, setSelectedDecision] = useState("");
  const [memo, setMemo] = useState("");
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
  const [pressedFileType, setPressedFileType] =
    useState<QualityFileType | null>(null);
  const [draftsByRowId, setDraftsByRowId] =
    useState<Record<string, InspectionDraft>>({});

  const inspectionReportInputRef = useRef<HTMLInputElement>(null);
  const measurementDataInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

      let bomQuery = supabase
        .from("bom_items")
        .select("*")
        .order("part_number", { ascending: true });

      if (currentProject?.id) {
        bomQuery = bomQuery.eq("project_id", currentProject.id);
      }

      const { data: bomItems } = await bomQuery;
      const bomIds = bomItems?.map((item) => item.id) ?? [];

      const { data: qcRequests } = bomIds.length
        ? await supabase
            .from("qc_requests")
            .select("*")
            .in("bom_item_id", bomIds)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
        : { data: [] };

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

      const bomMap = new Map();
      bomItems?.forEach((item) => {
        bomMap.set(String(item.id), item);
      });

      const productionMap = new Map();
      productionUpdates?.forEach((update) => {
        productionMap.set(String(update.bom_item_id), update);
      });

      const nextRows =
        qcRequests
          ?.filter((request) => {
            const production = productionMap.get(String(request.bom_item_id));
            return production?.process_step === "검수요청";
          })
          .map((request, index) => {
            const bom = bomMap.get(String(request.bom_item_id));
            const project = projectMap.get(String(bom?.project_id));

            return {
              no: index + 1,
              id: request.id,
              bom_item_id: request.bom_item_id,
              project_id: bom?.project_id,
              project_code: project?.project_code ?? "-",
              project_name: project?.project_name ?? "-",
              part_number: bom?.part_number ?? "-",
              part_name: bom?.part_name ?? "-",
              drawing_no: bom?.drawing_no ?? "-",
              revision: bom?.revision ?? "-",
              material: bom?.material ?? "-",
              quantity: bom?.quantity ?? 0,
              unit: bom?.unit ?? "",
              qc_status: request.qc_status ?? "requested",
              inspection_type: request.inspection_type ?? "외관, 치수 검사",
              inspection_date: request.inspection_date ?? request.created_at ?? "-",
              priority: request.priority ?? false,
              memo: request.memo ?? "",
              created_at: request.created_at ?? "-",
              updated_at: request.updated_at ?? "-",
              inspector: request.inspector_id ? "검사자 지정" : "미지정",
              ncr_no: request.ncr_no ?? "-",
            };
          }) ?? [];

      setRows(nextRows);

      setSelectedRowId(null);
      setSelectedStatus("scheduled");
      setSelectedDecision("");
      setMemo("");

      setChangedIds(new Set());
      setDraftsByRowId({});
      setLoading(false);
    }

    fetchData();
  }, [selectedProjectCode]);

  const selectedRow = useMemo(() => {
    return rows.find((row) => row.id === selectedRowId) ?? null;
  }, [rows, selectedRowId]);

  const {
    inspectionReport,
    measurementData,
    images,
    previewUrls,
    loading: evidenceLoading,
    uploadingType,
    deletingId,
    error: evidenceError,
    uploadFile,
    removeFile,
    clearError: clearEvidenceError,
  } = useQualityEvidenceFiles(
    selectedRow?.project_id,
    selectedRow?.id,
  );

  const selectedDraft = selectedRow
    ? draftsByRowId[selectedRow.id] ?? null
    : null;

  const pendingEvidence =
    selectedDraft?.evidence ?? createEmptyEvidenceDraft();

  const hasUnsavedChanges = changedIds.size > 0;

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    function handlePopState() {
      if (!hasUnsavedChanges) {
        return;
      }

      const confirmed = window.confirm(
        [
          "저장하지 않은 검사결과 또는 증빙자료가 있습니다.",
          "",
          "뒤로가면 임시 저장 내용이 모두 초기화됩니다.",
          "페이지를 이동하시겠습니까?",
        ].join("\n"),
      );

      if (confirmed) {
        setDraftsByRowId({});
        setChangedIds(new Set());
        return;
      }

      window.history.forward();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasUnsavedChanges]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const keyword = searchKeyword.trim().toLowerCase();

      const keywordMatched =
        !keyword ||
        row.part_number?.toLowerCase().includes(keyword) ||
        row.part_name?.toLowerCase().includes(keyword) ||
        row.drawing_no?.toLowerCase().includes(keyword);

      const statusMatched =
        statusFilter === "all" || row.qc_status === statusFilter;

      const typeMatched =
        inspectionTypeFilter === "all" ||
        row.inspection_type === inspectionTypeFilter;

      const inspectorMatched =
        inspectorFilter === "all" || row.inspector === inspectorFilter;

      return keywordMatched && statusMatched && typeMatched && inspectorMatched;
    });
  }, [rows, searchKeyword, statusFilter, inspectionTypeFilter, inspectorFilter]);

  const totalCount = rows.length;
  const waitingCount = rows.filter(
    (row) => row.qc_status === "requested" || row.qc_status === "scheduled"
  ).length;
  const inspectingCount = rows.filter(
    (row) => row.qc_status === "inspecting"
  ).length;
  const passedCount = rows.filter((row) => row.qc_status === "passed").length;

  const inspectors = Array.from(
    new Set(rows.map((row) => row.inspector).filter(Boolean))
  );

  function handleSelectRow(row: any) {
    if (selectedRowId === row.id) {
      setSelectedRowId(null);
      return;
    }

    const draft = draftsByRowId[row.id];

    setSelectedRowId(row.id);
    setSelectedStatus(row.qc_status);
    setSelectedDecision(draft?.decision ?? "");
    setMemo(draft?.memo ?? row.memo ?? "");
  }

  function setRowChanged(rowId: string, changed: boolean) {
    setChangedIds((prev) => {
      const next = new Set(prev);

      if (changed) {
        next.add(rowId);
      } else {
        next.delete(rowId);
      }
      return next;
    });
  }

  function updateSelectedDraft(
    updater: (current: InspectionDraft) => InspectionDraft,
  ) {
    if (!selectedRow) {
      return;
    }

    setDraftsByRowId((prev) => {
      const current = prev[selectedRow.id] ?? {
        decision: "",
        memo: selectedRow.memo ?? "",
        evidence: createEmptyEvidenceDraft(),
      };

      return {
        ...prev,
        [selectedRow.id]: updater(current),
      };
    });

    setRowChanged(selectedRow.id, true);
  }

  function handleDecisionChange(value: string) {
    setSelectedDecision(value);
    updateSelectedDraft((current) => ({
      ...current,
      decision: value,
    }));
  }

  function handleMemoChange(value: string) {
    setMemo(value);
    updateSelectedDraft((current) => ({
      ...current,
      memo: value,
    }));
  }

  function openEvidenceFilePicker(
    fileType: QualityFileType,
    input: HTMLInputElement | null,
  ) {
    if (!input || saving || uploadingType !== null) {
      return;
    }

    setPressedFileType(fileType);

    const releasePressedState = () => {
      window.setTimeout(() => {
        setPressedFileType(null);
      }, 350);
    };

    window.addEventListener("focus", releasePressedState, { once: true });
    input.click();
  }

  function handleEvidenceFileChange(
    fileType: QualityFileType,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setPressedFileType(null);

    if (!file) {
      return;
    }

    clearEvidenceError();
    updateSelectedDraft((current) => ({
      ...current,
      evidence: {
        ...current.evidence,
        inspectionReport:
          fileType === "inspection_report"
            ? file
            : current.evidence.inspectionReport,
        measurementData:
          fileType === "measurement_data"
            ? file
            : current.evidence.measurementData,
      },
    }));
  }

  function handleImageFilesChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    setPressedFileType(null);

    if (!selectedFiles.length) {
      return;
    }

    clearEvidenceError();
    updateSelectedDraft((current) => ({
      ...current,
      evidence: {
        ...current.evidence,
        images: [...current.evidence.images, ...selectedFiles],
      },
    }));
  }

  function handleRemovePendingImage(index: number) {
    updateSelectedDraft((current) => ({
      ...current,
      evidence: {
        ...current.evidence,
        images: current.evidence.images.filter(
          (_, imageIndex) => imageIndex !== index,
        ),
      },
    }));
  }

  async function handleRemoveEvidenceFile(
    fileId: string,
    fileName: string | null,
  ) {
    const confirmed = window.confirm(
      `${fileName ?? "선택한 파일"}을 삭제하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    const removed = await removeFile(fileId);
    if (removed) {
      alert("파일이 삭제되었습니다.");
    }
  }

  async function handleSave() {
    if (!selectedRow) return;

    const draft = draftsByRowId[selectedRow.id];
    const previousStatus = selectedRow.qc_status;
    const nextStatus = draft?.decision || selectedDecision || selectedStatus;
    const nextMemo = draft?.memo ?? memo;
    const evidence = draft?.evidence ?? createEmptyEvidenceDraft();
    const inspectionChanged =
      nextStatus !== previousStatus || nextMemo !== selectedRow.memo;
    const evidenceChanged =
      evidence.inspectionReport !== null ||
      evidence.measurementData !== null ||
      evidence.images.length > 0;

    if (!inspectionChanged && !evidenceChanged) {
      setDraftsByRowId((prev) => {
        const next = { ...prev };
        delete next[selectedRow.id];
        return next;
      });
      setRowChanged(selectedRow.id, false);
      return;
    }

    setSaving(true);
    clearEvidenceError();

    try {
      if (inspectionChanged) {
        const { error: updateError } = await supabase
          .from("qc_requests")
          .update({
            qc_status: nextStatus,
            memo: nextMemo,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedRow.id);

        if (updateError) {
          throw new Error(`검사 결과 저장 실패: ${updateError.message}`);
        }

        await supabase.from("workflow_status_histories").insert({
          bom_item_id: selectedRow.bom_item_id,
          workflow_type: "qc",
          from_status: previousStatus,
          to_status: nextStatus,
          memo:
            nextMemo ||
            `검사관리 상태 변경: ${previousStatus} → ${nextStatus}`,
          changed_at: new Date().toISOString(),
        });

        await supabase.from("activity_logs").insert({
          project_id: selectedRow.project_id,
          bom_item_id: selectedRow.bom_item_id,
          target_type: "qc",
          target_id: selectedRow.id,
          action: "qc_status_change",
          before_value: previousStatus,
          after_value: nextStatus,
          memo:
            nextMemo ||
            `검사관리 상태 변경: ${previousStatus} → ${nextStatus}`,
          created_at: new Date().toISOString(),
        });
      }

      if (inspectionChanged && nextStatus === "passed") {
      await supabase.from("activity_logs").insert({
        project_id: selectedRow.project_id,
        bom_item_id: selectedRow.bom_item_id,
        target_type: "shipment",
        target_id: selectedRow.id,
        action: "qc_passed_shipment_ready",
        before_value: previousStatus,
        after_value: nextStatus,
        memo: "QC 승인 완료. 출하관리 이관 대상",
        created_at: new Date().toISOString(),
      });
      }

      if (inspectionChanged && nextStatus === "failed") {
        const { data: existingNcr } = await supabase
          .from("ncr_reports")
          .select("id")
          .eq("qc_request_id", selectedRow.id)
          .maybeSingle();

        if (!existingNcr?.id) {
          await supabase.from("ncr_reports").insert({
            bom_item_id: selectedRow.bom_item_id,
            qc_request_id: selectedRow.id,
            title: `${selectedRow.part_number} NCR 발생`,
            status: "registered",
            description:
              nextMemo || "검사관리에서 부적합 판정으로 NCR 자동 생성",
            created_at: new Date().toISOString(),
          });

          await supabase.from("activity_logs").insert({
            project_id: selectedRow.project_id,
            bom_item_id: selectedRow.bom_item_id,
            target_type: "ncr",
            target_id: selectedRow.id,
            action: "qc_failed_ncr_created",
            before_value: previousStatus,
            after_value: nextStatus,
            memo: "QC 부적합 판정. NCR 자동 생성",
            created_at: new Date().toISOString(),
          });
        }
      }

      if (evidence.inspectionReport) {
        const uploaded = await uploadFile(
          "inspection_report",
          evidence.inspectionReport,
        );

        if (!uploaded) {
          throw new Error("검사성적서 저장에 실패했습니다.");
        }
      }

      if (evidence.measurementData) {
        const uploaded = await uploadFile(
          "measurement_data",
          evidence.measurementData,
        );

        if (!uploaded) {
          throw new Error("측정데이터 저장에 실패했습니다.");
        }
      }

      for (const imageFile of evidence.images) {
        const uploaded = await uploadFile("image", imageFile);

        if (!uploaded) {
          throw new Error(`${imageFile.name} 저장에 실패했습니다.`);
        }
      }

      if (inspectionChanged) {
        setRows((prev) =>
          prev.map((row) =>
            row.id === selectedRow.id
              ? {
                  ...row,
                  qc_status: nextStatus,
                  memo: nextMemo,
                  updated_at: new Date().toISOString(),
                }
              : row,
          ),
        );
      }

      setDraftsByRowId((prev) => {
        const next = { ...prev };
        delete next[selectedRow.id];
        return next;
      });
      setRowChanged(selectedRow.id, false);
      setSelectedDecision("");
      setMemo(nextMemo);

      alert(
        inspectionChanged && evidenceChanged
          ? "검사결과와 증빙자료가 저장되었습니다."
          : inspectionChanged
            ? "검사결과가 저장되었습니다."
            : "검사 증빙자료가 저장되었습니다.",
      );
    } catch (error) {
      console.error("검사결과 및 증빙자료 저장 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : "검사결과 저장에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-sm font-bold text-slate-500">
          검사관리 데이터를 불러오는 중입니다.
        </div>
      </WorkspaceLayout>
    );
  }

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

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black text-slate-500">
                품질관리 &gt; 검사관리
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                검사관리
              </h1>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                선택한 프로젝트의 검사 진행 현황과 검사 결과 및 증빙 자료를 관리합니다.
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
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <RefreshCw size={13} />
                마지막 업데이트
                <span className="text-slate-950">실시간 데이터 기준</span>
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[240px_repeat(4,1fr)] items-center divide-x divide-slate-100 px-4 py-3">
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
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    <ClipboardCheck size={17} />
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-500">
                      전체 검사요청
                    </div>
                    <div className="mt-0.5 text-xl font-black text-slate-950">
                      {totalCount}
                      <span className="ml-1 text-xs font-bold text-slate-500">
                        건
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <Timer size={17} />
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-500">
                      검사 대기
                    </div>
                    <div className="mt-0.5 text-xl font-black text-slate-950">
                      {waitingCount}
                      <span className="ml-1 text-xs font-bold text-slate-500">
                        건
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <CalendarDays size={17} />
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-500">
                      검사 진행중
                    </div>
                    <div className="mt-0.5 text-xl font-black text-slate-950">
                      {inspectingCount}
                      <span className="ml-1 text-xs font-bold text-slate-500">
                        건
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={17} />
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-500">
                      승인 완료
                    </div>
                    <div className="mt-0.5 text-xl font-black text-slate-950">
                      {passedCount}
                      <span className="ml-1 text-xs font-bold text-slate-500">
                        건
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid grid-cols-[1.5fr_120px_120px_120px_190px_80px] gap-2">
              <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-400">
                <Search size={15} />
                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="품목명, 도면번호 검색"
                  className="w-full bg-transparent outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none"
              >
                <option value="all">상태 전체</option>
                {QC_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={inspectionTypeFilter}
                onChange={(event) => setInspectionTypeFilter(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none"
              >
                <option value="all">유형 전체</option>
                <option value="외관, 치수 검사">외관, 치수 검사</option>
                <option value="도금 검사">도금 검사</option>
                <option value="기능 검사">기능 검사</option>
              </select>

              <select
                value={inspectorFilter}
                onChange={(event) => setInspectorFilter(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none"
              >
                <option value="all">검사자 전체</option>
                {inspectors.map((inspector) => (
                  <option key={inspector} value={inspector}>
                    {inspector}
                  </option>
                ))}
              </select>

              <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700">
                <CalendarDays size={14} />
                2025-05-01 ~ 2025-05-31
              </div>

              <button className="h-9 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700">
                초기화
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-xs font-black text-slate-600">
                전체 {filteredRows.length}건
              </div>

              <div className="flex items-center gap-2">
                <button className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700">
                  <Download size={14} />
                  엑셀 다운로드
                </button>

                <div className="flex h-9 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 text-xs font-black text-orange-600">
                  <AlertCircle size={14} />
                  변경된 검사 {changedIds.size}건
                </div>

                <button
                  onClick={handleSave}
                  disabled={!selectedRow || saving}
                  className="flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white hover:bg-blue-700 disabled:bg-slate-300"
                >
                  <Save size={14} />
                  {saving ? "저장중" : "검사결과 저장"}
                </button>
              </div>
            </div>

            <div className="g1-scroll-hide max-h-[585px] overflow-auto">
              <table className="w-full min-w-[1120px] text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-black text-slate-500">
                  <tr>
                    <th className="px-3 py-3">선택</th>
                    <th className="px-3 py-3">No.</th>
                    <th className="px-3 py-3">품목 코드</th>
                    <th className="px-3 py-3">품목명</th>
                    <th className="px-3 py-3">도면번호</th>
                    <th className="px-3 py-3">검사유형</th>
                    <th className="px-3 py-3">현재 상태</th>
                    <th className="px-3 py-3">검사자</th>
                    <th className="px-3 py-3">검사 예정일</th>
                    <th className="px-3 py-3">검사일</th>
                    <th className="px-3 py-3">비고</th>
                    <th className="px-3 py-3 text-center">상세</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row) => (
                    <Fragment key={row.id}>
                      <tr
                        onClick={() => handleSelectRow(row)}
                        className={[
                          "cursor-pointer hover:bg-slate-50",
                          selectedRowId === row.id ? "bg-blue-50/50" : "",
                        ].join(" ")}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRowId === row.id}
                            readOnly
                            className="h-4 w-4 accent-blue-600"
                          />
                        </td>

                        <td className="px-3 py-3 font-bold text-slate-600">
                          {row.no}
                        </td>

                        <td className="px-3 py-3 font-black text-slate-950">
                          {row.part_number}
                        </td>

                        <td className="px-3 py-3 font-bold text-slate-800">
                          {row.part_name}
                        </td>

                        <td className="px-3 py-3 font-semibold text-slate-600">
                          {row.drawing_no}
                        </td>

                        <td className="px-3 py-3 font-bold text-slate-700">
                          {row.inspection_type}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-black ${getQcStatusBadgeClass(
                              row.qc_status
                            )}`}
                          >
                            {getQcStatusLabel(row.qc_status)}
                          </span>
                        </td>

                        <td className="px-3 py-3 font-bold text-slate-700">
                          {row.inspector}
                        </td>

                        <td className="px-3 py-3 font-bold text-slate-700">
                          {formatDate(row.inspection_date)}
                        </td>

                        <td className="px-3 py-3 font-bold text-slate-700">
                          {row.qc_status === "passed" || row.qc_status === "failed"
                            ? formatDate(row.updated_at)
                            : "-"}
                        </td>

                        <td className="px-3 py-3 font-semibold text-slate-500">
                          {row.ncr_no}
                        </td>

                        <td className="px-3 py-3 text-center">
                          <ChevronDown
                            size={15}
                            className={[
                              "mx-auto text-slate-500 transition",
                              selectedRowId === row.id ? "rotate-180" : "",
                            ].join(" ")}
                          />
                        </td>
                      </tr>

                      {selectedRowId === row.id && (
                        <tr>
                          <td colSpan={12} className="bg-white p-0">
                            <div className="border-t border-slate-200 p-4">
                              <div className="mb-4 flex items-center gap-3">
                                <h2 className="text-sm font-black text-slate-950">
                                  {row.no}. {row.part_number} / {row.part_name}
                                </h2>
                                <span className="text-xs font-bold text-slate-500">
                                  {row.inspection_type}
                                </span>
                              </div>

                              <div className="grid items-stretch gap-4 xl:grid-cols-2">
                                <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                                  <h3 className="mb-3 text-xs font-black text-slate-700">
                                    검사 결과
                                  </h3>

                                  <div className="space-y-3">
                                    <div>
                                      <label className="mb-1 block text-xs font-black text-slate-500">
                                        현재 상태
                                      </label>
                                      <div className="flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-blue-600">
                                        {getQcStatusLabel(selectedStatus)}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="mb-1 block text-xs font-black text-slate-500">
                                        검사 판정
                                      </label>
                                      <select
                                        value={selectedDecision}
                                        onChange={(event) =>
                                          handleDecisionChange(event.target.value)
                                        }
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none"
                                      >
                                        {QC_DECISION_OPTIONS.map((option) => (
                                          <option
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="mb-1 block text-xs font-black text-slate-500">
                                        검사 메모
                                      </label>
                                      <textarea
                                        value={memo}
                                        onChange={(event) =>
                                          handleMemoChange(event.target.value)
                                        }
                                        maxLength={500}
                                        placeholder="검사 관련 메모를 입력하세요."
                                        className="h-32 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700 outline-none"
                                      />
                                      <div className="text-right text-[11px] font-bold text-slate-400">
                                        {memo.length} / 500
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                                  <h3 className="mb-3 text-xs font-black text-slate-700">
                                    검사 증빙자료 업로드
                                  </h3>

                                  <div className="space-y-3">
                                    <input
                                      ref={inspectionReportInputRef}
                                      type="file"
                                      accept="application/pdf,.pdf"
                                      onChange={(event) =>
                                        void handleEvidenceFileChange(
                                          "inspection_report",
                                          event,
                                        )
                                      }
                                      className="hidden"
                                    />

                                    <input
                                      ref={measurementDataInputRef}
                                      type="file"
                                      accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,.xlsx"
                                      onChange={(event) =>
                                        void handleEvidenceFileChange(
                                          "measurement_data",
                                          event,
                                        )
                                      }
                                      className="hidden"
                                    />

                                    <input
                                      ref={imageInputRef}
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                                      multiple
                                      onChange={(event) =>
                                        void handleImageFilesChange(event)
                                      }
                                      className="hidden"
                                    />

                                    {evidenceError ? (
                                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-700">
                                        {evidenceError}
                                      </div>
                                    ) : null}

                                    <div
                                      className={[
                                        "flex items-center justify-between rounded-xl border px-3 py-3 transition",
                                        pendingEvidence.inspectionReport
                                          ? "border-blue-300 bg-blue-50/60"
                                          : inspectionReport
                                            ? "border-emerald-200 bg-emerald-50/40"
                                            : "border-slate-200 bg-white",
                                      ].join(" ")}
                                    >
                                      <div className="flex min-w-0 items-center gap-2">
                                        <FileText size={16} className="text-red-500" />
                                        <div className="min-w-0">
                                          <div className="truncate text-xs font-black text-slate-800">
                                            {pendingEvidence.inspectionReport
                                              ?.name ??
                                              inspectionReport?.file_name ??
                                              `검사성적서_${row.part_number}.pdf`}
                                          </div>
                                          <div className="text-[11px] font-semibold text-slate-400">
                                            {pendingEvidence.inspectionReport
                                              ? "검사결과 저장 대기"
                                              : evidenceLoading
                                              ? "파일 확인 중..."
                                              : inspectionReport
                                                ? "업로드 완료"
                                                : "PDF 파일을 업로드해 주세요."}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openEvidenceFilePicker(
                                            "inspection_report",
                                            inspectionReportInputRef.current,
                                          )
                                        }
                                        disabled={saving || uploadingType !== null}
                                        className={[
                                          "ml-3 flex h-8 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-black transition-all duration-100 focus:outline-none focus:ring-4 focus:ring-blue-200 active:translate-y-[3px] active:scale-[0.98] active:shadow-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:active:scale-100",
                                          uploadingType === "inspection_report" ||
                                          pressedFileType === "inspection_report"
                                            ? "bg-blue-700 text-white shadow-none translate-y-[3px]"
                                            : "border border-blue-700 bg-blue-600 text-white shadow-[0_3px_0_#1d4ed8] hover:bg-blue-700",
                                          uploadingType !== null &&
                                          uploadingType !== "inspection_report"
                                            ? "opacity-40"
                                            : "",
                                        ].join(" ")}
                                      >
                                        {uploadingType === "inspection_report" ? (
                                          <Loader2 size={13} className="animate-spin" />
                                        ) : (
                                          <Upload size={13} />
                                        )}
                                        {uploadingType === "inspection_report"
                                          ? "업로드 중..."
                                          : pendingEvidence.inspectionReport ||
                                              inspectionReport
                                            ? "재업로드"
                                            : "업로드"}
                                      </button>
                                    </div>

                                    <div
                                      className={[
                                        "flex items-center justify-between rounded-xl border px-3 py-3 transition",
                                        pendingEvidence.measurementData
                                          ? "border-blue-300 bg-blue-50/60"
                                          : measurementData
                                            ? "border-emerald-200 bg-emerald-50/40"
                                            : "border-slate-200 bg-white",
                                      ].join(" ")}
                                    >
                                      <div className="flex min-w-0 items-center gap-2">
                                        <FileSpreadsheet
                                          size={16}
                                          className="text-emerald-600"
                                        />
                                        <div className="min-w-0">
                                          <div className="truncate text-xs font-black text-slate-800">
                                            {pendingEvidence.measurementData
                                              ?.name ??
                                              measurementData?.file_name ??
                                              `측정데이터_${row.part_number}.xlsx`}
                                          </div>
                                          <div className="text-[11px] font-semibold text-slate-400">
                                            {pendingEvidence.measurementData
                                              ? "검사결과 저장 대기"
                                              : evidenceLoading
                                              ? "파일 확인 중..."
                                              : measurementData
                                                ? "업로드 완료"
                                                : "XLS 또는 XLSX 파일을 업로드해 주세요."}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openEvidenceFilePicker(
                                            "measurement_data",
                                            measurementDataInputRef.current,
                                          )
                                        }
                                        disabled={saving || uploadingType !== null}
                                        className={[
                                          "ml-3 flex h-8 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-black transition-all duration-100 focus:outline-none focus:ring-4 focus:ring-blue-200 active:translate-y-[3px] active:scale-[0.98] active:shadow-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:active:scale-100",
                                          uploadingType === "measurement_data" ||
                                          pressedFileType === "measurement_data"
                                            ? "bg-blue-700 text-white shadow-none translate-y-[3px]"
                                            : "border border-blue-700 bg-blue-600 text-white shadow-[0_3px_0_#1d4ed8] hover:bg-blue-700",
                                          uploadingType !== null &&
                                          uploadingType !== "measurement_data"
                                            ? "opacity-40"
                                            : "",
                                        ].join(" ")}
                                      >
                                        {uploadingType === "measurement_data" ? (
                                          <Loader2 size={13} className="animate-spin" />
                                        ) : (
                                          <Upload size={13} />
                                        )}
                                        {uploadingType === "measurement_data"
                                          ? "업로드 중..."
                                          : pendingEvidence.measurementData ||
                                              measurementData
                                            ? "재업로드"
                                            : "업로드"}
                                      </button>
                                    </div>

                                    <div>
                                      <div className="mb-2 flex items-center justify-between">
                                        <div className="text-xs font-black text-slate-700">
                                          사진
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openEvidenceFilePicker(
                                              "image",
                                              imageInputRef.current,
                                            )
                                          }
                                          disabled={saving || uploadingType !== null}
                                          className={[
                                            "flex h-8 items-center gap-1 rounded-lg border border-blue-700 bg-blue-600 px-3 text-xs font-black text-white shadow-[0_3px_0_#1d4ed8] transition-all duration-100 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 active:translate-y-[3px] active:scale-[0.98] active:shadow-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40 disabled:active:scale-100",
                                            pressedFileType === "image"
                                              ? "translate-y-[3px] bg-blue-700 shadow-none"
                                              : "",
                                          ].join(" ")}
                                        >
                                          {uploadingType === "image" ? (
                                            <Loader2 size={13} className="animate-spin" />
                                          ) : (
                                            <Upload size={13} />
                                          )}
                                          {uploadingType === "image"
                                            ? "업로드 중..."
                                            : "사진 업로드"}
                                        </button>
                                      </div>

                                      {images.length > 0 ||
                                      pendingEvidence.images.length > 0 ? (
                                        <div className="grid grid-cols-4 gap-2">
                                          {images.map((image) => (
                                            <div
                                              key={image.id}
                                              className="group relative h-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                                            >
                                              {previewUrls[image.id] ? (
                                                <img
                                                  src={previewUrls[image.id]}
                                                  alt={image.file_name ?? "검사사진"}
                                                  className="h-full w-full object-cover"
                                                />
                                              ) : (
                                                <div className="flex h-full items-center justify-center text-slate-400">
                                                  <ImageIcon size={18} />
                                                </div>
                                              )}

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  void handleRemoveEvidenceFile(
                                                    image.id,
                                                    image.file_name,
                                                  )
                                                }
                                                disabled={deletingId === image.id}
                                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed"
                                                aria-label="검사사진 삭제"
                                              >
                                                <X size={13} />
                                              </button>
                                            </div>
                                          ))}

                                          {pendingEvidence.images.map(
                                            (imageFile, imageIndex) => (
                                              <div
                                                key={`${imageFile.name}-${imageFile.lastModified}-${imageIndex}`}
                                                className="group relative flex h-16 min-w-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-blue-300 bg-blue-50 px-2 text-blue-500"
                                              >
                                                <ImageIcon size={17} />
                                                <div className="mt-1 w-full truncate text-center text-[10px] font-bold">
                                                  {imageFile.name}
                                                </div>
                                                <div className="text-[9px] font-black text-blue-600">
                                                  저장 대기
                                                </div>

                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleRemovePendingImage(
                                                      imageIndex,
                                                    )
                                                  }
                                                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-0 transition group-hover:opacity-100"
                                                  aria-label="저장 대기 검사사진 제거"
                                                >
                                                  <X size={13} />
                                                </button>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-4 gap-2">
                                          {[1, 2, 3, 4].map((item) => (
                                            <div
                                              key={item}
                                              className="flex h-16 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-300"
                                            >
                                              <ImageIcon size={18} />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-4 py-12 text-center text-sm font-bold text-slate-400"
                      >
                        표시할 검사 항목이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

      </div>
    </WorkspaceLayout>
  );
}

type PendingEvidenceDraft = {
  inspectionReport: File | null;
  measurementData: File | null;
  images: File[];
};

type InspectionDraft = {
  decision: string;
  memo: string;
  evidence: PendingEvidenceDraft;
};

function createEmptyEvidenceDraft(): PendingEvidenceDraft {
  return {
    inspectionReport: null,
    measurementData: null,
    images: [],
  };
}