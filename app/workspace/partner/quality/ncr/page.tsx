"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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

export default function NcrManagementPage() {
  const searchParams = useSearchParams();
  const selectedProjectCode = searchParams.get("project");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

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
        projectData?.some((project) => project.project_code === selectedProjectCode)
          ? projectData.find((project) => project.project_code === selectedProjectCode)
          : projectData?.[0];

      setProjects(projectData ?? []);

      if (!currentProject?.id) {
        setRows([]);
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

      bomItems?.forEach((item) => {
        bomMap.set(String(item.id), item);
      });

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

      const firstRow = nextRows[0];

      if (firstRow) {
        setSelectedRowId(firstRow.id);
        setStatus(firstRow.status);
        setRootCause(firstRow.root_cause ?? "");
        setCorrectiveAction(firstRow.corrective_action ?? "");
        setPreventiveAction(firstRow.preventive_action ?? "");
      } else {
        setSelectedRowId(null);
        setStatus("registered");
        setRootCause("");
        setCorrectiveAction("");
        setPreventiveAction("");
      }

      setLoading(false);
    }

    fetchData();
  }, [selectedProjectCode]);

  const selectedRow = useMemo(() => {
    return rows.find((row) => row.id === selectedRowId) ?? null;
  }, [rows, selectedRowId]);

  const totalCount = rows.length;
  const registeredCount = rows.filter((row) => row.status === "registered").length;
  const inActionCount = rows.filter((row) => row.status === "in_action").length;
  const reinspectionCount = rows.filter((row) => row.status === "reinspection").length;
  const closedCount = rows.filter((row) => row.status === "closed").length;
  const rejectedCount = rows.filter((row) => row.status === "rejected").length;

  function handleSelectRow(row: any) {
    setSelectedRowId(row.id);
    setStatus(row.status);
    setRootCause(row.root_cause ?? "");
    setCorrectiveAction(row.corrective_action ?? "");
    setPreventiveAction(row.preventive_action ?? "");
  }

  async function handleSave() {
    if (!selectedRow) return;

    setSaving(true);

    const previousStatus = selectedRow.status;
    const nextStatus = status;

    const { error: updateError } = await supabase
      .from("ncr_reports")
      .update({
        status: nextStatus,
        root_cause: rootCause,
        corrective_action: correctiveAction,
        preventive_action: preventiveAction,
        closed_at: nextStatus === "closed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
    });

    if (nextStatus === "reinspection") {
      await supabase
        .from("qc_requests")
        .update({
          qc_status: "scheduled",
          memo: "NCR 조치 후 재검사 요청",
          updated_at: new Date().toISOString(),
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
        created_at: new Date().toISOString(),
      });
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
              closed_at: nextStatus === "closed" ? new Date().toISOString() : null,
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
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm font-black text-slate-500">
              품질관리 &gt; NCR 관리
            </div>

            <h1 className="mt-2 text-2xl font-black text-slate-950">
              NCR 관리
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              부적합 사항의 원인 분석, 조치, 재검사, 종결 상태를 관리합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              NCR 번호, 품목명, 도면번호 검색
            </div>

            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              필터
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-[240px_repeat(5,1fr)] items-center gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500">
                프로젝트 (PO)
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

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">전체 NCR</div>
              <div className="mt-2 text-2xl font-black text-slate-950">
                {totalCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">등록</div>
              <div className="mt-2 text-2xl font-black text-blue-600">
                {registeredCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">조치중</div>
              <div className="mt-2 text-2xl font-black text-orange-600">
                {inActionCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">재검사</div>
              <div className="mt-2 text-2xl font-black text-purple-600">
                {reinspectionCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">종결/반려</div>
              <div className="mt-2 text-2xl font-black text-emerald-600">
                {closedCount + rejectedCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-[1fr_320px] gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-72 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
                  NCR 번호 / 품목명 검색
                </div>

                <select className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  <option>상태 전체</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={!selectedRow || saving}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700 disabled:bg-slate-300"
              >
                {saving ? "저장 중..." : "NCR 결과 저장"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black text-slate-500">
                  <tr>
                    <th className="px-4 py-3">No.</th>
                    <th className="px-4 py-3">NCR 번호</th>
                    <th className="px-4 py-3">품목</th>
                    <th className="px-4 py-3">도면번호</th>
                    <th className="px-4 py-3">제목</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">발생일</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const active = selectedRowId === row.id;

                    return (
                      <tr
                        key={row.id}
                        onClick={() => handleSelectRow(row)}
                        className={[
                          "cursor-pointer hover:bg-blue-50",
                          active ? "bg-blue-50" : "",
                        ].join(" ")}
                      >
                        <td className="px-4 py-3 font-bold text-slate-600">
                          {row.no}
                        </td>

                        <td className="px-4 py-3 font-black text-blue-600">
                          {row.ncr_no}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-black text-slate-950">
                            {row.part_number}
                          </div>
                          <div className="text-xs font-medium text-slate-500">
                            {row.part_name}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-600">
                          {row.drawing_no}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-800">
                          {row.title}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-black ${getNcrStatusBadgeClass(
                              row.status
                            )}`}
                          >
                            {getNcrStatusLabel(row.status)}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-600">
                          {row.created_at === "-"
                            ? "-"
                            : String(row.created_at).slice(0, 10)}
                        </td>
                      </tr>
                    );
                  })}

                  {!rows.length ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                      >
                        NCR 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {selectedRow ? (
              <div className="border-t border-slate-200 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      {selectedRow.ncr_no} / {selectedRow.part_name}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {selectedRow.title}
                    </p>
                  </div>

                  <span
                    className={`rounded-lg px-3 py-1.5 text-xs font-black ${getNcrStatusBadgeClass(
                      status
                    )}`}
                  >
                    {getNcrStatusLabel(status)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-5">
                  <div>
                    <h3 className="mb-3 text-sm font-black text-slate-950">
                      기본 정보
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">품목 코드</span>
                        <span className="font-bold">{selectedRow.part_number}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">품목명</span>
                        <span className="font-bold">{selectedRow.part_name}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">도면 번호</span>
                        <span className="font-bold">{selectedRow.drawing_no}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">소재</span>
                        <span className="font-bold">{selectedRow.material}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">수량</span>
                        <span className="font-bold">
                          {selectedRow.quantity} {selectedRow.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-black text-slate-950">
                      원인 분석
                    </h3>

                    <textarea
                      value={rootCause}
                      onChange={(event) => setRootCause(event.target.value)}
                      rows={8}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="부적합 원인을 입력하세요."
                    />
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-black text-slate-950">
                      조치 내용
                    </h3>

                    <textarea
                      value={correctiveAction}
                      onChange={(event) =>
                        setCorrectiveAction(event.target.value)
                      }
                      rows={8}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="시정 조치 내용을 입력하세요."
                    />
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-black text-slate-950">
                      상태 / 재발 방지
                    </h3>

                    <label className="mb-2 block text-xs font-bold text-slate-500">
                      NCR 상태
                    </label>

                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                    >
                      {NCR_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <label className="mb-2 mt-4 block text-xs font-bold text-slate-500">
                      재발 방지
                    </label>

                    <textarea
                      value={preventiveAction}
                      onChange={(event) =>
                        setPreventiveAction(event.target.value)
                      }
                      rows={5}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="재발 방지 대책을 입력하세요."
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black text-slate-950">첨부파일</h2>

            {selectedRow ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-sm font-black text-slate-950">
                    부적합보고서_{selectedRow.part_number}.pdf
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    PDF / 업로드 예정
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-sm font-black text-slate-950">
                    원인분석_{selectedRow.part_number}.pdf
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    PDF / 업로드 예정
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-sm font-black text-slate-950">
                    개선대책_{selectedRow.part_number}.pdf
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    PDF / 업로드 예정
                  </div>
                </div>

                <button className="w-full rounded-xl border border-blue-500 px-4 py-3 text-sm font-black text-blue-600">
                  모든 파일 다운로드
                </button>
              </div>
            ) : (
              <div className="mt-10 text-center text-sm font-bold text-slate-400">
                NCR 항목을 선택하세요.
              </div>
            )}
          </aside>
        </div>
      </div>
    </WorkspaceLayout>
  );
}