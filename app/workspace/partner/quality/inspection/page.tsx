"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  ImageIcon,
  RefreshCw,
  Save,
  Search,
  Upload,
  X,
  Timer,
} from "lucide-react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

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

      const firstRow = nextRows[0];

      if (firstRow) {
        setSelectedRowId(firstRow.id);
        setSelectedStatus(firstRow.qc_status);
        setSelectedDecision("");
        setMemo(firstRow.memo ?? "");
      } else {
        setSelectedRowId(null);
        setSelectedStatus("scheduled");
        setSelectedDecision("");
        setMemo("");
      }

      setChangedIds(new Set());
      setLoading(false);
    }

    fetchData();
  }, [selectedProjectCode]);

  const selectedRow = useMemo(() => {
    return rows.find((row) => row.id === selectedRowId) ?? null;
  }, [rows, selectedRowId]);

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
    setSelectedRowId((prev) => (prev === row.id ? null : row.id));
    setSelectedStatus(row.qc_status);
    setSelectedDecision("");
    setMemo(row.memo ?? "");
  }

  function markChanged(nextStatus: string, nextMemo: string) {
    if (!selectedRow) return;

    setChangedIds((prev) => {
      const next = new Set(prev);

      if (nextStatus !== selectedRow.qc_status || nextMemo !== selectedRow.memo) {
        next.add(selectedRow.id);
      } else {
        next.delete(selectedRow.id);
      }

      return next;
    });
  }

  function handleLocalStatusChange(value: string) {
    setSelectedStatus(value);
    markChanged(value, memo);
  }

  function handleMemoChange(value: string) {
    setMemo(value);
    markChanged(selectedStatus, value);
  }

  async function handleSave() {
    if (!selectedRow) return;

    setSaving(true);

    const previousStatus = selectedRow.qc_status;
    const nextStatus = selectedDecision || selectedStatus;

    const { error: updateError } = await supabase
      .from("qc_requests")
      .update({
        qc_status: nextStatus,
        memo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedRow.id);

    if (updateError) {
      alert(`검사 결과 저장 실패: ${updateError.message}`);
      setSaving(false);
      return;
    }

    await supabase.from("workflow_status_histories").insert({
      bom_item_id: selectedRow.bom_item_id,
      workflow_type: "qc",
      from_status: previousStatus,
      to_status: nextStatus,
      memo: memo || `검사관리 상태 변경: ${previousStatus} → ${nextStatus}`,
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
      memo: memo || `검사관리 상태 변경: ${previousStatus} → ${nextStatus}`,
      created_at: new Date().toISOString(),
    });

    if (nextStatus === "passed") {
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

    if (nextStatus === "failed") {
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
          description: memo || "검사관리에서 부적합 판정으로 NCR 자동 생성",
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

    setRows((prev) =>
      prev.map((row) =>
        row.id === selectedRow.id
          ? {
              ...row,
              qc_status: nextStatus,
              memo,
              updated_at: new Date().toISOString(),
            }
          : row
      )
    );

    setChangedIds((prev) => {
      const next = new Set(prev);
      next.delete(selectedRow.id);
      return next;
    });

    setSelectedDecision("");
    setSaving(false);
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

      <div className="grid grid-cols-[1fr_310px] gap-3">
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

                              <div className="grid grid-cols-[1fr_1fr_1.35fr] gap-5">
                                <div>
                                  <h3 className="mb-3 text-xs font-black text-slate-700">
                                    기본 정보
                                  </h3>

                                  <div className="space-y-2 text-xs">
                                    {[
                                      ["품목 코드", row.part_number],
                                      ["품명", row.part_name],
                                      ["도면 번호", row.drawing_no],
                                      ["검사유형", row.inspection_type],
                                      ["검사자", row.inspector],
                                      ["검사예정일", formatDate(row.inspection_date)],
                                      ["검사일", formatDate(row.updated_at)],
                                      ["메모", row.memo || "-"],
                                    ].map(([label, value]) => (
                                      <div
                                        key={label}
                                        className="grid grid-cols-[88px_1fr]"
                                      >
                                        <div className="font-bold text-slate-500">
                                          {label}
                                        </div>
                                        <div className="font-black text-slate-800">
                                          {value}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <h3 className="mb-3 text-xs font-black text-slate-700">
                                    검사 결과
                                  </h3>

                                  <div className="space-y-3">
                                    <div>
                                      <label className="mb-1 block text-xs font-black text-slate-500">
                                        현재 상태
                                      </label>
                                      <select
                                        value={selectedStatus}
                                        onChange={(event) =>
                                          handleLocalStatusChange(event.target.value)
                                        }
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-blue-600 outline-none"
                                      >
                                        {QC_STATUS_OPTIONS.map((option) => (
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
                                        검사 판정
                                      </label>
                                      <select
                                        value={selectedDecision}
                                        onChange={(event) =>
                                          setSelectedDecision(event.target.value)
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
                                        className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700 outline-none"
                                      />
                                      <div className="text-right text-[11px] font-bold text-slate-400">
                                        {memo.length} / 500
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="mb-3 text-xs font-black text-slate-700">
                                    검사 증빙자료 업로드
                                  </h3>

                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
                                      <div className="flex items-center gap-2">
                                        <FileText
                                          size={16}
                                          className="text-red-500"
                                        />
                                        <div>
                                          <div className="text-xs font-black text-slate-800">
                                            검사성적서_{row.part_number}.pdf
                                          </div>
                                          <div className="text-[11px] font-semibold text-slate-400">
                                            파트너 제출 문서
                                          </div>
                                        </div>
                                      </div>
                                      <button className="flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600">
                                        <Upload size={13} />
                                        업로드
                                      </button>
                                    </div>

                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
                                      <div className="flex items-center gap-2">
                                        <FileSpreadsheet
                                          size={16}
                                          className="text-emerald-600"
                                        />
                                        <div>
                                          <div className="text-xs font-black text-slate-800">
                                            측정데이터_{row.part_number}.xlsx
                                          </div>
                                          <div className="text-[11px] font-semibold text-slate-400">
                                            측정값 / 원본 데이터
                                          </div>
                                        </div>
                                      </div>
                                      <button className="flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600">
                                        <Upload size={13} />
                                        업로드
                                      </button>
                                    </div>

                                    <div>
                                      <div className="mb-2 flex items-center justify-between">
                                        <div className="text-xs font-black text-slate-700">
                                          사진
                                        </div>
                                        <button className="flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600">
                                          <Upload size={13} />
                                          사진 업로드
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-4 gap-2">
                                        {[1, 2, 3, 4].map((item) => (
                                          <div
                                            key={item}
                                            className="flex h-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400"
                                          >
                                            <ImageIcon size={18} />
                                          </div>
                                        ))}
                                      </div>
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

        <aside className="sticky top-3 h-[calc(100vh-24px)] rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                {selectedRow
                  ? `${selectedRow.part_number} / ${selectedRow.part_name}`
                  : "검사 상세"}
              </h2>
            </div>

            <button className="text-slate-400">
              <X size={18} />
            </button>
          </div>

          <div className="g1-scroll-hide h-[calc(100%-64px)] space-y-5 overflow-y-auto p-4">
            {selectedRow ? (
              <>
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-700">
                      도면 PDF 미리보기
                    </h3>
                    <button className="flex items-center gap-1 text-xs font-black text-blue-600">
                      <Download size={13} />
                      다운로드
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="flex h-40 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <div className="text-center">
                        <Eye size={28} className="mx-auto" />
                        <div className="mt-2 text-[11px] font-black">
                          PDF VIEWER
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs font-black text-slate-800">
                      {selectedRow.drawing_no}_Rev.{selectedRow.revision}.pdf
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-slate-400">
                      고객 배포 도면 / 다운로드 문서
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-xs font-black text-slate-700">
                    검사성적서 미리보기
                  </h3>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="flex h-40 items-center justify-center rounded-lg bg-red-50 text-red-500">
                      <div className="text-center">
                        <FileText size={28} className="mx-auto" />
                        <div className="mt-2 text-[11px] font-black">
                          REPORT PREVIEW
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs font-black text-slate-800">
                      검사성적서_{selectedRow.part_number}.pdf
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-slate-400">
                      업로드된 검사성적서 미리보기
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-xs font-black text-slate-700">
                    측정데이터 미리보기
                  </h3>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <FileSpreadsheet size={16} className="text-emerald-600" />
                      <div>
                        <div className="text-xs font-black text-slate-800">
                          측정데이터_{selectedRow.part_number}.xlsx
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          주요 측정값 Preview
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 font-black text-slate-500">
                          <tr>
                            <th className="px-2 py-2">항목</th>
                            <th className="px-2 py-2">기준</th>
                            <th className="px-2 py-2">측정</th>
                            <th className="px-2 py-2">판정</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                          {[
                            ["A", "20.00", "20.01", "OK"],
                            ["B", "15.00", "14.99", "OK"],
                            ["C", "8.00", "8.03", "OK"],
                          ].map((item) => (
                            <tr key={item[0]}>
                              <td className="px-2 py-2">{item[0]}</td>
                              <td className="px-2 py-2">{item[1]}</td>
                              <td className="px-2 py-2">{item[2]}</td>
                              <td className="px-2 py-2 text-emerald-600">
                                {item[3]}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-700">
                      검사 사진 미리보기
                    </h3>
                    <button className="text-xs font-black text-blue-600">
                      전체 보기
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="flex h-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400"
                      >
                        <ImageIcon size={17} />
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <div className="py-20 text-center text-sm font-bold text-slate-400">
                선택된 검사 항목이 없습니다.
              </div>
            )}
          </div>
        </aside>
      </div>
    </WorkspaceLayout>
  );
}