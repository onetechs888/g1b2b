"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

const QC_STATUS_OPTIONS = [
  { value: "requested", label: "검사요청" },
  { value: "scheduled", label: "검사 예정" },
  { value: "inspecting", label: "검사 진행중" },
  { value: "passed", label: "승인 완료 / 출하관리 이관" },
  { value: "failed", label: "NCR / 생산·영업 이관" },
  { value: "hold", label: "보류" },
];

function getQcStatusLabel(status: string) {
  if (status === "requested") return "검사요청";
  if (status === "scheduled") return "검사 예정";
  if (status === "inspecting") return "검사 진행중";
  if (status === "passed") return "승인 완료";
  if (status === "failed") return "NCR";
  if (status === "hold") return "보류";
  return status ?? "-";
}

function getQcStatusBadgeClass(status: string) {
  if (status === "requested") return "bg-slate-100 text-slate-700";
  if (status === "scheduled") return "bg-cyan-50 text-cyan-600";
  if (status === "inspecting") return "bg-blue-50 text-blue-600";
  if (status === "passed") return "bg-emerald-50 text-emerald-600";
  if (status === "failed") return "bg-red-50 text-red-600";
  if (status === "hold") return "bg-orange-50 text-orange-600";
  return "bg-slate-50 text-slate-600";
}

function getStatusDescription(status: string) {
  if (status === "requested") return "생산관리에서 검수요청된 상태입니다.";
  if (status === "scheduled") return "검사 예정 상태입니다.";
  if (status === "inspecting") return "검사가 진행 중입니다.";
  if (status === "passed") return "승인 완료 시 출하관리 이관 대상으로 처리됩니다.";
  if (status === "failed") return "NCR 처리 시 생산관리 및 영업담당자 확인 대상으로 이관됩니다.";
  if (status === "hold") return "보류 상태입니다. 추가 확인 후 재처리가 필요합니다.";
  return "-";
}

export default function QualityInspectionPage() {
  const searchParams = useSearchParams();
  const selectedProjectCode = searchParams.get("project");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState("requested");
  const [memo, setMemo] = useState("");

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

      const { data: qcRequests } = bomIds.length
        ? await supabase
            .from("qc_requests")
            .select("*")
            .in("bom_item_id", bomIds)
            .order("created_at", { ascending: false })
        : { data: [] };

      const bomMap = new Map();

      bomItems?.forEach((item) => {
        bomMap.set(String(item.id), item);
      });

      const nextRows =
        qcRequests?.map((request, index) => {
          const bom = bomMap.get(String(request.bom_item_id));

          return {
            no: index + 1,
            id: request.id,
            bom_item_id: request.bom_item_id,
            project_id: currentProject.id,
            part_number: bom?.part_number ?? "-",
            part_name: bom?.part_name ?? "-",
            drawing_no: bom?.drawing_no ?? "-",
            revision: bom?.revision ?? "-",
            material: bom?.material ?? "-",
            quantity: bom?.quantity ?? 0,
            unit: bom?.unit ?? "",
            qc_status: request.qc_status ?? "requested",
            inspection_date: request.inspection_date ?? "-",
            priority: request.priority ?? false,
            memo: request.memo ?? "",
            created_at: request.created_at ?? "-",
            updated_at: request.updated_at ?? "-",
            inspector: request.inspector_id ? "검사자 지정" : "-",
          };
        }) ?? [];

      setRows(nextRows);

      const firstRow = nextRows[0];

      if (firstRow) {
        setSelectedRowId(firstRow.id);
        setSelectedStatus(firstRow.qc_status);
        setMemo(firstRow.memo ?? "");
      } else {
        setSelectedRowId(null);
        setMemo("");
      }

      setLoading(false);
    }

    fetchData();
  }, [selectedProjectCode]);

  const selectedRow = useMemo(() => {
    return rows.find((row) => row.id === selectedRowId) ?? null;
  }, [rows, selectedRowId]);

  const totalCount = rows.length;
  const requestedCount = rows.filter((row) => row.qc_status === "requested").length;
  const scheduledCount = rows.filter((row) => row.qc_status === "scheduled").length;
  const inspectingCount = rows.filter((row) => row.qc_status === "inspecting").length;
  const passedCount = rows.filter((row) => row.qc_status === "passed").length;
  const failedCount = rows.filter((row) => row.qc_status === "failed").length;
  const holdCount = rows.filter((row) => row.qc_status === "hold").length;

  function handleSelectRow(row: any) {
    setSelectedRowId(row.id);
    setSelectedStatus(row.qc_status);
    setMemo(row.memo ?? "");
  }

  async function handleSave() {
    if (!selectedRow) return;

    setSaving(true);

    const previousStatus = selectedRow.qc_status;
    const nextStatus = selectedStatus;

    const { error: updateError } = await supabase
      .from("qc_requests")
      .update({
        qc_status: nextStatus,
        memo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedRow.id);

    if (updateError) {
      console.error("QC 상태 변경 실패:", updateError);
      alert(`QC 상태 변경 실패: ${updateError.message}`);
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

      if (!existingNcr) {
        const { error: ncrError } = await supabase.from("ncr_reports").insert({
          bom_item_id: selectedRow.bom_item_id,
          qc_request_id: selectedRow.id,
          title: `${selectedRow.part_number} NCR 발생`,
          description: memo || "검사관리에서 NCR 상태로 변경되어 자동 생성",
          status: "registered",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (ncrError) {
          console.error("NCR 자동 생성 실패:", ncrError);
          alert(`NCR 자동 생성 실패: ${ncrError.message}`);
        }
      }

      await supabase.from("activity_logs").insert({
        project_id: selectedRow.project_id,
        bom_item_id: selectedRow.bom_item_id,
        target_type: "production",
        target_id: selectedRow.id,
        action: "qc_failed_to_production",
        before_value: previousStatus,
        after_value: nextStatus,
        memo: "NCR 발생. 생산관리 확인 및 특채/재진행 검토 대상",
        created_at: new Date().toISOString(),
      });

      await supabase.from("activity_logs").insert({
        project_id: selectedRow.project_id,
        bom_item_id: selectedRow.bom_item_id,
        target_type: "sales",
        target_id: selectedRow.id,
        action: "qc_failed_to_sales",
        before_value: previousStatus,
        after_value: nextStatus,
        memo: "NCR 발생. 영업담당자 고객 협의 대상",
        created_at: new Date().toISOString(),
      });
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

    setSaving(false);
    alert("검사 상태가 저장되었습니다.");
  }

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-sm font-bold text-slate-500">
          검사관리 데이터를 불러오는 중...
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
              품질관리 &gt; 검사관리
            </div>

            <h1 className="mt-2 text-2xl font-black text-slate-950">
              검사관리
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              검사 상태를 기준으로 승인, NCR, 보류 흐름을 관리합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              프로젝트명, PO번호, 고객사 검색
            </div>

            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              필터
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-[240px_repeat(6,1fr)] items-center gap-4">
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
              <div className="text-xs font-bold text-slate-500">전체</div>
              <div className="mt-2 text-2xl font-black text-slate-950">
                {totalCount}<span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">검사요청</div>
              <div className="mt-2 text-2xl font-black text-slate-700">
                {requestedCount}<span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">검사 예정</div>
              <div className="mt-2 text-2xl font-black text-cyan-600">
                {scheduledCount}<span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">검사 진행중</div>
              <div className="mt-2 text-2xl font-black text-blue-600">
                {inspectingCount}<span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">승인 완료</div>
              <div className="mt-2 text-2xl font-black text-emerald-600">
                {passedCount}<span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">NCR/보류</div>
              <div className="mt-2 text-2xl font-black text-red-600">
                {failedCount + holdCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-[1fr_320px] gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-64 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
                  품목명, 도면번호 검색
                </div>

                <select className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  <option>검사 상태 전체</option>
                </select>

                <select className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  <option>검사 유형 전체</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
                  초기화
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!selectedRow || saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700 disabled:bg-slate-300"
                >
                  {saving ? "저장 중..." : "검사상태 저장"}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black text-slate-500">
                  <tr>
                    <th className="px-4 py-3">No.</th>
                    <th className="px-4 py-3">품목 코드</th>
                    <th className="px-4 py-3">품목명</th>
                    <th className="px-4 py-3">도면번호</th>
                    <th className="px-4 py-3">검사유형</th>
                    <th className="px-4 py-3">현재 상태</th>
                    <th className="px-4 py-3">검사자</th>
                    <th className="px-4 py-3">검사 예정일</th>
                    <th className="px-4 py-3">비고</th>
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

                        <td className="px-4 py-3 font-black text-slate-950">
                          {row.part_number}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-800">
                          {row.part_name}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-600">
                          {row.drawing_no}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-700">
                          외관 / 치수
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-black ${getQcStatusBadgeClass(
                              row.qc_status
                            )}`}
                          >
                            {getQcStatusLabel(row.qc_status)}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-700">
                          {row.inspector}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-600">
                          {row.inspection_date}
                        </td>

                        <td className="px-4 py-3 text-xs font-medium text-slate-500">
                          {row.memo || "-"}
                        </td>
                      </tr>
                    );
                  })}

                  {!rows.length ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                      >
                        검사 요청 데이터가 없습니다.
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
                      {selectedRow.part_number} / {selectedRow.part_name}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      외관, 치수 검사
                    </p>
                  </div>

                  <span
                    className={`rounded-lg px-3 py-1.5 text-xs font-black ${getQcStatusBadgeClass(
                      selectedStatus
                    )}`}
                  >
                    {getQcStatusLabel(selectedStatus)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-5">
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
                      검사 상태
                    </h3>

                    <label className="mb-2 block text-xs font-bold text-slate-500">
                      현재 상태
                    </label>

                    <select
                      value={selectedStatus}
                      onChange={(event) => setSelectedStatus(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                    >
                      {QC_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-600">
                      {getStatusDescription(selectedStatus)}
                    </div>

                    <label className="mb-2 mt-4 block text-xs font-bold text-slate-500">
                      검사 메모 / 조치 의견
                    </label>

                    <textarea
                      value={memo}
                      onChange={(event) => setMemo(event.target.value)}
                      rows={5}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="검사 결과, 보류 사유, NCR 조치 의견 등을 입력하세요."
                    />
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-black text-slate-950">
                      검사 첨부자료
                    </h3>

                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 p-3">
                        <div className="font-black text-slate-950">
                          검사성적서_{selectedRow.part_number}.pdf
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          PDF / 업로드 예정
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-3">
                        <div className="font-black text-slate-950">
                          측정데이터_{selectedRow.part_number}.xlsx
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          XLSX / 업로드 예정
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-16 rounded-lg bg-slate-100" />
                        <div className="h-16 rounded-lg bg-slate-100" />
                        <div className="flex h-16 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">
                          +1
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950">첨부파일</h2>
              <button className="text-lg font-black text-slate-400">×</button>
            </div>

            {selectedRow ? (
              <div className="mt-5 space-y-5">
                <div>
                  <h3 className="mb-3 text-sm font-black text-slate-950">
                    도면 미리보기
                  </h3>
                  <div className="h-36 rounded-xl border border-slate-200 bg-slate-50" />
                  <button className="mt-3 w-full rounded-xl border border-blue-200 px-4 py-2 text-sm font-black text-blue-600">
                    도면 다운로드
                  </button>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-black text-slate-950">
                    검사성적서 미리보기
                  </h3>
                  <div className="h-36 rounded-xl border border-slate-200 bg-slate-50" />
                  <button className="mt-3 w-full rounded-xl border border-blue-200 px-4 py-2 text-sm font-black text-blue-600">
                    성적서 다운로드
                  </button>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-black text-slate-950">
                    측정데이터
                  </h3>
                  <div className="rounded-xl border border-slate-200 p-3 text-sm font-bold">
                    측정데이터_{selectedRow.part_number}.xlsx
                  </div>
                </div>

                <button className="w-full rounded-xl border border-blue-500 px-4 py-3 text-sm font-black text-blue-600">
                  모든 파일 다운로드
                </button>
              </div>
            ) : (
              <div className="mt-10 text-center text-sm font-bold text-slate-400">
                검사 항목을 선택하세요.
              </div>
            )}
          </aside>
        </div>
      </div>
    </WorkspaceLayout>
  );
}