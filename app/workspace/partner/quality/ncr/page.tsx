"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Filter,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Timer,
} from "lucide-react";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

const NCR_STATUS_OPTIONS = [
  { value: "registered", label: "등록" },
  { value: "in_action", label: "조치중" },
  { value: "reinspection", label: "재검사" },
  { value: "closed", label: "종결" },
  { value: "rejected", label: "반려" },
];

function getNcrStatusLabel(status: string) {
  if (status === "registered") return "등록";
  if (status === "in_action") return "조치중";
  if (status === "reinspection") return "재검사";
  if (status === "closed") return "종결";
  if (status === "rejected") return "반려";
  return status ?? "-";
}

function getNcrStatusBadgeClass(status: string) {
  if (status === "registered") return "bg-blue-50 text-blue-600";
  if (status === "in_action") return "bg-orange-50 text-orange-600";
  if (status === "reinspection") return "bg-purple-50 text-purple-600";
  if (status === "closed") return "bg-emerald-50 text-emerald-600";
  if (status === "rejected") return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

function formatDate(value: string | null | undefined) {
  if (!value || value === "-") return "-";
  return String(value).slice(0, 10).replaceAll("-", ". ") + ".";
}

export default function NcrManagementPage() {
  const searchParams = useSearchParams();
  const selectedProjectCode = searchParams.get("project");
  const filterSearchRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [status, setStatus] = useState("registered");
  const [rootCause, setRootCause] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");

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
          : projectData?.[0];

      setProjects(projectData ?? []);

      if (!currentProject?.id) {
        setRows([]);
        setSelectedRowId(null);
        setLoading(false);
        return;
      }

      const { data: bomItems } = await supabase
        .from("bom_items")
        .select("*")
        .eq("project_id", currentProject.id)
        .order("part_number", { ascending: true });

      const bomIds = bomItems?.map((item) => item.id) ?? [];

      const { data: ncrReports } = bomIds.length
        ? await supabase
            .from("ncr_reports")
            .select("*")
            .in("bom_item_id", bomIds)
            .order("created_at", { ascending: false })
        : { data: [] };

      const bomMap = new Map();
      bomItems?.forEach((item) => bomMap.set(String(item.id), item));

      const nextRows =
        ncrReports?.map((ncr, index) => {
          const bom = bomMap.get(String(ncr.bom_item_id));

          return {
            no: index + 1,
            id: ncr.id,
            bom_item_id: ncr.bom_item_id,
            qc_request_id: ncr.qc_request_id,
            project_id: currentProject.id,
            ncr_no: `NCR-${String(index + 1).padStart(4, "0")}`,
            part_number: bom?.part_number ?? "-",
            part_name: bom?.part_name ?? "-",
            drawing_no: bom?.drawing_no ?? "-",
            material: bom?.material ?? "-",
            quantity: bom?.quantity ?? 0,
            unit: bom?.unit ?? "",
            title: ncr.title ?? "-",
            description: ncr.description ?? "",
            root_cause: ncr.root_cause ?? "",
            corrective_action: ncr.corrective_action ?? "",
            preventive_action: ncr.preventive_action ?? "",
            status: ncr.status ?? "registered",
            created_at: ncr.created_at ?? "-",
            closed_at: ncr.closed_at ?? null,
          };
        }) ?? [];

      setRows(nextRows);
      setSelectedRowId(null);
      setStatus("registered");
      setRootCause("");
      setCorrectiveAction("");
      setPreventiveAction("");
      setLoading(false);
    }

    fetchData();
  }, [selectedProjectCode]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? null,
    [rows, selectedRowId]
  );

  const filteredRows = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesKeyword =
        !keyword ||
        [
          row.ncr_no,
          row.part_number,
          row.part_name,
          row.drawing_no,
          row.title,
        ].some((value) => String(value ?? "").toLowerCase().includes(keyword));

      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;
      const createdDate = String(row.created_at ?? "").slice(0, 10);
      const matchesStartDate = !startDate || createdDate >= startDate;
      const matchesEndDate = !endDate || createdDate <= endDate;

      return (
        matchesKeyword &&
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [rows, searchKeyword, statusFilter, startDate, endDate]);

  const totalCount = rows.length;
  const actionRequiredCount = rows.filter(
    (row) => row.status === "registered" || row.status === "in_action"
  ).length;
  const reinspectionCount = rows.filter(
    (row) => row.status === "reinspection"
  ).length;
  const completedCount = rows.filter(
    (row) => row.status === "closed" || row.status === "rejected"
  ).length;

  function clearSelectedRow() {
    setSelectedRowId(null);
    setStatus("registered");
    setRootCause("");
    setCorrectiveAction("");
    setPreventiveAction("");
  }

  function handleSelectRow(row: any) {
    if (selectedRowId === row.id) {
      clearSelectedRow();
      return;
    }

    setSelectedRowId(row.id);
    setStatus(row.status);
    setRootCause(row.root_cause ?? "");
    setCorrectiveAction(row.corrective_action ?? "");
    setPreventiveAction(row.preventive_action ?? "");
  }

  function handleResetFilters() {
    setSearchKeyword("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  }

  async function handleSave() {
    if (!selectedRow) return;

    setSaving(true);
    const now = new Date().toISOString();
    const previousStatus = selectedRow.status;
    const nextStatus = status;

    const { error: updateError } = await supabase
      .from("ncr_reports")
      .update({
        status: nextStatus,
        root_cause: rootCause,
        corrective_action: correctiveAction,
        preventive_action: preventiveAction,
        closed_at: nextStatus === "closed" ? now : null,
        updated_at: now,
      })
      .eq("id", selectedRow.id);

    if (updateError) {
      console.error("NCR 저장 실패:", updateError);
      alert(`NCR 저장 실패: ${updateError.message}`);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      project_id: selectedRow.project_id,
      bom_item_id: selectedRow.bom_item_id,
      target_type: "ncr",
      target_id: selectedRow.id,
      action: "ncr_status_change",
      before_value: previousStatus,
      after_value: nextStatus,
      memo: `NCR 상태 변경: ${previousStatus} → ${nextStatus}`,
      created_at: now,
    });

    if (nextStatus === "reinspection") {
      await supabase
        .from("qc_requests")
        .update({
          qc_status: "scheduled",
          is_active: true,
          memo: "NCR 조치 후 재검사 요청",
          updated_at: now,
        })
        .eq("id", selectedRow.qc_request_id);

      await supabase.from("activity_logs").insert({
        project_id: selectedRow.project_id,
        bom_item_id: selectedRow.bom_item_id,
        target_type: "qc",
        target_id: selectedRow.qc_request_id,
        action: "ncr_reinspection_requested",
        before_value: "failed",
        after_value: "scheduled",
        memo: "NCR 조치 후 재검사 요청",
        created_at: now,
      });
    }

    if (nextStatus === "closed") {
      await supabase
        .from("qc_requests")
        .update({
          qc_status: "passed",
          is_active: true,
          memo: "NCR 종결에 따른 품질 승인",
          updated_at: now,
        })
        .eq("id", selectedRow.qc_request_id);

      await supabase.from("activity_logs").insert({
        project_id: selectedRow.project_id,
        bom_item_id: selectedRow.bom_item_id,
        target_type: "qc",
        target_id: selectedRow.qc_request_id,
        action: "ncr_closed_qc_passed",
        before_value: "failed",
        after_value: "passed",
        memo: "NCR 종결 처리로 QC 승인 상태 전환",
        created_at: now,
      });

      const { data: existingShipment } = await supabase
        .from("shipments")
        .select("id")
        .eq("bom_item_id", selectedRow.bom_item_id)
        .maybeSingle();

      if (!existingShipment) {
        await supabase.from("shipments").insert({
          project_id: selectedRow.project_id,
          bom_item_id: selectedRow.bom_item_id,
          status: "ready",
          created_at: now,
          updated_at: now,
        });

        await supabase.from("activity_logs").insert({
          project_id: selectedRow.project_id,
          bom_item_id: selectedRow.bom_item_id,
          target_type: "shipment",
          target_id: selectedRow.bom_item_id,
          action: "shipment_auto_created",
          before_value: null,
          after_value: "ready",
          memo: "NCR 종결 및 QC 승인에 따른 출하 자동 생성",
          created_at: now,
        });
      }
    }

    setRows((prev) =>
      prev.map((row) =>
        row.id === selectedRow.id
          ? {
              ...row,
              status: nextStatus,
              root_cause: rootCause,
              corrective_action: correctiveAction,
              preventive_action: preventiveAction,
              closed_at: nextStatus === "closed" ? now : null,
            }
          : row
      )
    );

    setSaving(false);
    alert("NCR 정보가 저장되었습니다.");
  }

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-sm font-bold text-slate-500">
          NCR 데이터를 불러오는 중...
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black text-slate-500">
              품질관리 &gt; NCR 관리
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              NCR 관리
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              부적합 사항의 원인 분석, 조치, 재검사, 종결 상태를 관리합니다.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-[300px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-400 shadow-sm">
                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="NCR 번호, 품목명, 도면번호 검색"
                  className="w-full bg-transparent outline-none placeholder:text-slate-400"
                />
                <Search className="shrink-0 text-slate-500" size={16} />
              </div>
              <button
                type="button"
                onClick={() => filterSearchRef.current?.focus()}
                className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm"
              >
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
                projects={projects.map((project) => ({
                  id: project.project_code,
                  name: `${project.project_code} / ${project.project_name}`,
                }))}
              />
            </div>

            <KpiItem
              icon={<ClipboardCheck size={17} />}
              iconClass="bg-slate-100 text-slate-700"
              label="전체 NCR"
              count={totalCount}
            />
            <KpiItem
              icon={<AlertCircle size={17} />}
              iconClass="bg-orange-50 text-orange-600"
              label="조치 필요"
              count={actionRequiredCount}
            />
            <KpiItem
              icon={<Timer size={17} />}
              iconClass="bg-purple-50 text-purple-600"
              label="재검사"
              count={reinspectionCount}
            />
            <KpiItem
              icon={<CheckCircle2 size={17} />}
              iconClass="bg-emerald-50 text-emerald-600"
              label="처리 완료"
              count={completedCount}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-[1fr_140px_160px_160px_82px] gap-2">
            <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-400">
              <Search size={15} />
              <input
                ref={filterSearchRef}
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="NCR 번호, 품목명, 도면번호 검색"
                className="w-full bg-transparent outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none"
            >
              <option value="all">상태 전체</option>
              {NCR_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="relative flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <CalendarDays size={14} className="shrink-0 text-slate-500" />
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="min-w-0 w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                aria-label="발생일 시작일"
              />
            </div>

            <div className="relative flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <CalendarDays size={14} className="shrink-0 text-slate-500" />
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="min-w-0 w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                aria-label="발생일 종료일"
              />
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700"
            >
              <RotateCcw size={13} />
              초기화
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="text-xs font-black text-slate-600">
              전체 {filteredRows.length}건
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedRow || saving}
              className="flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              <Save size={14} />
              {saving ? "저장 중..." : "NCR 결과 저장"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-black text-slate-500">
                <tr>
                  <th className="px-3 py-3">선택</th>
                  <th className="px-3 py-3">No.</th>
                  <th className="px-3 py-3">NCR 번호</th>
                  <th className="px-3 py-3">품목 코드</th>
                  <th className="px-3 py-3">품목명</th>
                  <th className="px-3 py-3">도면번호</th>
                  <th className="px-3 py-3">제목</th>
                  <th className="px-3 py-3">상태</th>
                  <th className="px-3 py-3">발생일</th>
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
                      <td className="px-3 py-3 font-black text-blue-600">
                        {row.ncr_no}
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
                      <td className="px-3 py-3 font-bold text-slate-800">
                        {row.title}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-black ${getNcrStatusBadgeClass(
                            row.status
                          )}`}
                        >
                          {getNcrStatusLabel(row.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-700">
                        {formatDate(row.created_at)}
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
                        <td colSpan={10} className="bg-white p-0">
                          <div className="border-t border-slate-200 p-4">
                            <div className="mb-4 flex items-center gap-3">
                              <h2 className="text-sm font-black text-slate-950">
                                {row.ncr_no} / {row.part_number} / {row.part_name}
                              </h2>
                              <span
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-black ${getNcrStatusBadgeClass(
                                  status
                                )}`}
                              >
                                {getNcrStatusLabel(status)}
                              </span>
                            </div>

                            <div className="grid items-stretch gap-4 xl:grid-cols-2">
                              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                                <h3 className="mb-3 text-xs font-black text-slate-700">
                                  원인 분석 / 조치 내용
                                </h3>
                                <div className="grid gap-3 lg:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-black text-slate-500">
                                      원인 분석
                                    </label>
                                    <textarea
                                      value={rootCause}
                                      onChange={(event) =>
                                        setRootCause(event.target.value)
                                      }
                                      className="h-44 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700 outline-none"
                                      placeholder="부적합 원인을 입력하세요."
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-black text-slate-500">
                                      조치 내용
                                    </label>
                                    <textarea
                                      value={correctiveAction}
                                      onChange={(event) =>
                                        setCorrectiveAction(event.target.value)
                                      }
                                      className="h-44 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700 outline-none"
                                      placeholder="시정 조치 내용을 입력하세요."
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                                <h3 className="mb-3 text-xs font-black text-slate-700">
                                  상태 / 재발 방지 / 첨부파일
                                </h3>
                                <div className="grid gap-3 lg:grid-cols-2">
                                  <div className="space-y-3">
                                    <div>
                                      <label className="mb-1 block text-xs font-black text-slate-500">
                                        NCR 상태
                                      </label>
                                      <select
                                        value={status}
                                        onChange={(event) =>
                                          setStatus(event.target.value)
                                        }
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none"
                                      >
                                        {NCR_STATUS_OPTIONS.map((option) => (
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
                                        재발 방지
                                      </label>
                                      <textarea
                                        value={preventiveAction}
                                        onChange={(event) =>
                                          setPreventiveAction(event.target.value)
                                        }
                                        className="h-[118px] w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700 outline-none"
                                        placeholder="재발 방지 대책을 입력하세요."
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <div className="mb-1 text-xs font-black text-slate-500">
                                      첨부파일
                                    </div>
                                    <div className="space-y-2">
                                      {[
                                        `부적합보고서_${row.part_number}.pdf`,
                                        `원인분석_${row.part_number}.pdf`,
                                        `개선대책_${row.part_number}.pdf`,
                                      ].map((fileName) => (
                                        <div
                                          key={fileName}
                                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                                        >
                                          <div className="truncate text-xs font-black text-slate-800">
                                            {fileName}
                                          </div>
                                          <div className="mt-0.5 text-[11px] font-semibold text-slate-400">
                                            PDF / 업로드 예정
                                          </div>
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
                      colSpan={10}
                      className="px-4 py-12 text-center text-sm font-bold text-slate-400"
                    >
                      표시할 NCR 항목이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}

function KpiItem({
  icon,
  iconClass,
  label,
  count,
}: {
  icon: ReactNode;
  iconClass: string;
  label: string;
  count: number;
}) {
  return (
    <div className="px-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${iconClass}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-[11px] font-black text-slate-500">{label}</div>
          <div className="mt-0.5 text-xl font-black text-slate-950">
            {count}
            <span className="ml-1 text-xs font-bold text-slate-500">건</span>
          </div>
        </div>
      </div>
    </div>
  );
}