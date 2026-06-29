"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

const SHIPMENT_STATUS_OPTIONS = [
  { value: "ready", label: "출하대기" },
  { value: "shipped", label: "출하준비" },
  { value: "completed", label: "출하완료" },
];

function getShipmentStatusLabel(status: string) {
  if (status === "ready") return "출하대기";
  if (status === "shipped") return "출하준비";
  if (status === "completed") return "출하완료";
  return status ?? "-";
}

function getShipmentStatusBadgeClass(status: string) {
  if (status === "ready") return "bg-orange-50 text-orange-600";
  if (status === "shipped") return "bg-green-50 text-green-600";
  if (status === "completed") return "bg-blue-50 text-blue-600";
  return "bg-slate-50 text-slate-600";
}

export default function ShipmentItemsPage() {
  const searchParams = useSearchParams();
  const selectedProjectCode = searchParams.get("project");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const [shipmentStatus, setShipmentStatus] = useState("ready");
  const [shippedQuantity, setShippedQuantity] = useState<number>(0);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .order("project_code", { ascending: true });

      const isAllProjects =
  !selectedProjectCode || selectedProjectCode === "all";

const currentProject =
  !isAllProjects &&
  projectData?.some(
    (project) => project.project_code === selectedProjectCode
  )
    ? projectData.find(
        (project) => project.project_code === selectedProjectCode
      )
    : null;

      setProjects(projectData ?? []);

      if (!isAllProjects && !currentProject?.id) {
  setRows([]);
  setLoading(false);
  return;
}

      let bomQuery = supabase
  .from("bom_items")
  .select("*")
  .order("part_number", { ascending: true });

if (!isAllProjects && currentProject?.id) {
  bomQuery = bomQuery.eq("project_id", currentProject.id);
}

const { data: bomItems } = await bomQuery;

      const bomIds = bomItems?.map((item) => item.id) ?? [];

      const { data: qcRequests } = bomIds.length
        ? await supabase
            .from("qc_requests")
            .select("*")
            .in("bom_item_id", bomIds)
            .eq("qc_status", "passed")
        : { data: [] };

      const passedBomIds = qcRequests?.map((item) => item.bom_item_id) ?? [];

      const { data: shipments } = passedBomIds.length
        ? await supabase
            .from("shipments")
            .select("*")
            .in("bom_item_id", passedBomIds)
            .order("created_at", { ascending: false })
        : { data: [] };

      const bomMap = new Map();
      bomItems?.forEach((item) => {
        bomMap.set(String(item.id), item);
      });

      const shipmentMap = new Map();
      shipments?.forEach((shipment) => {
        shipmentMap.set(String(shipment.bom_item_id), shipment);
      });

      const nextRows =
        passedBomIds.map((bomId, index) => {
          const bom = bomMap.get(String(bomId));
          const shipment = shipmentMap.get(String(bomId));

          return {
            no: index + 1,
            project_id: bom?.project_id ?? currentProject?.id ?? null,
            shipment_id: shipment?.id ?? null,
            bom_item_id: bomId,
            partner_company_id: bom?.partner_company_id ?? null,
            part_number: bom?.part_number ?? "-",
            part_name: bom?.part_name ?? "-",
            drawing_no: bom?.drawing_no ?? "-",
            quantity: bom?.quantity ?? 0,
            unit: bom?.unit ?? "",
            unit_price: bom?.unit_price ?? 0,
            total_price: bom?.total_price ?? 0,
            shipment_type: shipment?.shipment_type ?? "full",
            shipped_quantity: shipment?.shipped_quantity ?? 0,
            tracking_number: shipment?.tracking_number ?? "",
            shipment_status: shipment?.shipment_status ?? "ready",
            shipment_date: shipment?.shipment_date ?? "",
            updated_at: shipment?.updated_at ?? shipment?.created_at ?? "-",
          };
        }) ?? [];

      setRows(nextRows);

      const firstRow = nextRows[0];

      if (firstRow) {
        setSelectedRowId(firstRow.bom_item_id);
        setShipmentStatus(firstRow.shipment_status);
        setShippedQuantity(firstRow.shipped_quantity || firstRow.quantity || 0);
        setTrackingNumber(firstRow.tracking_number ?? "");
        setShipmentDate(firstRow.shipment_date ?? "");
        setMemo("");
      } else {
        setSelectedRowId(null);
      }

      setLoading(false);
    }

    fetchData();
  }, [selectedProjectCode]);

  const selectedRow = useMemo(() => {
    return rows.find((row) => row.bom_item_id === selectedRowId) ?? null;
  }, [rows, selectedRowId]);

  const totalCount = rows.length;
  const readyCount = rows.filter((row) => row.shipment_status === "ready").length;
  const shippedCount = rows.filter((row) => row.shipment_status === "shipped").length;
  const completedCount = rows.filter(
    (row) => row.shipment_status === "completed"
  ).length;

  function handleSelectRow(row: any) {
    if (selectedRowId === row.bom_item_id) {
      setSelectedRowId(null);
      return;
    }

    setSelectedRowId(row.bom_item_id);
    setShipmentStatus(row.shipment_status);
    setShippedQuantity(row.shipped_quantity || row.quantity || 0);
    setTrackingNumber(row.tracking_number ?? "");
    setShipmentDate(row.shipment_date ?? "");
    setMemo("");
  }

  async function handleSave() {
    if (!selectedRow) return;

    setSaving(true);

    const now = new Date().toISOString();
    const previousStatus = selectedRow.shipment_status;
    const nextStatus = shipmentStatus;

    let shipmentId = selectedRow.shipment_id;

    if (shipmentId) {
      const { error } = await supabase
        .from("shipments")
        .update({
          shipment_status: nextStatus,
          shipped_quantity: shippedQuantity,
          tracking_number: trackingNumber,
          shipment_date: shipmentDate || null,
          updated_at: now,
        })
        .eq("id", shipmentId);

      if (error) {
        alert(`출하 저장 실패: ${error.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("shipments")
        .insert({
          bom_item_id: selectedRow.bom_item_id,
          shipment_type: "full",
          shipped_quantity: shippedQuantity,
          tracking_number: trackingNumber,
          shipment_status: nextStatus,
          shipment_date: shipmentDate || null,
          created_at: now,
          updated_at: now,
        })
        .select("id")
        .single();

      if (error) {
        alert(`출하 생성 실패: ${error.message}`);
        setSaving(false);
        return;
      }

      shipmentId = data?.id;
    }

    await supabase.from("activity_logs").insert({
      project_id: selectedRow.project_id,
      bom_item_id: selectedRow.bom_item_id,
      target_type: "shipment",
      target_id: shipmentId,
      action: "shipment_status_change",
      before_value: previousStatus,
      after_value: nextStatus,
      memo: memo || `출하 상태 변경: ${previousStatus} → ${nextStatus}`,
      created_at: now,
    });

    if (nextStatus === "completed") {
      const { data: existingSettlement } = await supabase
        .from("settlements")
        .select("id")
        .eq("shipment_id", shipmentId)
        .maybeSingle();

      if (!existingSettlement) {
        const amount =
          selectedRow.total_price ||
          Number(selectedRow.unit_price || 0) *
            Number(selectedRow.quantity || 0);
        const vat = Math.round(amount * 0.1);
        const totalAmount = amount + vat;

        await supabase.from("settlements").insert({
          bom_item_id: selectedRow.bom_item_id,
          shipment_id: shipmentId,
          partner_company_id: selectedRow.partner_company_id,
          amount,
          vat,
          total_amount: totalAmount,
          status: "shipment_completed",
          memo: "출하완료에 따른 정산 자동 생성",
          created_at: now,
          updated_at: now,
        });

        await supabase.from("activity_logs").insert({
          project_id: selectedRow.project_id,
          bom_item_id: selectedRow.bom_item_id,
          target_type: "settlement",
          target_id: shipmentId,
          action: "shipment_completed_settlement_created",
          memo: "출하완료에 따른 정산 자동 생성",
          created_at: now,
        });
      }
    }

    setRows((prev) =>
      prev.map((row) =>
        row.bom_item_id === selectedRow.bom_item_id
          ? {
              ...row,
              shipment_id: shipmentId,
              shipment_status: nextStatus,
              shipped_quantity: shippedQuantity,
              tracking_number: trackingNumber,
              shipment_date: shipmentDate,
              updated_at: now,
            }
          : row
      )
    );

    setSaving(false);
    alert("출하 상태가 저장되었습니다.");
  }

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-sm font-bold text-slate-500">
          출하관리 데이터를 불러오는 중...
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
              출하관리 &gt; 출하관리
            </div>

            <h1 className="mt-2 text-2xl font-black text-slate-950">
              출하관리
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              QC 승인 완료 품목의 출하대기, 출하준비, 출하완료 상태를 관리합니다.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-[240px_repeat(4,1fr)] items-center gap-4">
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
              <div className="text-xs font-bold text-slate-500">전체 대상</div>
              <div className="mt-2 text-2xl font-black text-slate-950">
                {totalCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">출하대기</div>
              <div className="mt-1 text-[11px] font-bold text-slate-400">
                가공 및 검수완료
              </div>
              <div className="mt-2 text-2xl font-black text-orange-600">
                {readyCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">출하준비</div>
              <div className="mt-1 text-[11px] font-bold text-slate-400">
                포장완료
              </div>
              <div className="mt-2 text-2xl font-black text-green-600">
                {shippedCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">출하완료</div>
              <div className="mt-1 text-[11px] font-bold text-slate-400">
                납품 및 거래명세서 송부
              </div>
              <div className="mt-2 text-2xl font-black text-blue-600">
                {completedCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-72 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
                품목명, 도면번호 검색
              </div>

              <select className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                <option>전체 상태</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedRow || saving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {saving ? "저장 중..." : "상태 저장"}
            </button>
          </div>

          <div className="max-h-[640px] overflow-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black text-slate-500">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">품목 코드</th>
                  <th className="px-4 py-3">품목명</th>
                  <th className="px-4 py-3">도면번호</th>
                  <th className="px-4 py-3">수량</th>
                  <th className="px-4 py-3">출하수량</th>
                  <th className="px-4 py-3">현재 상태</th>
                  <th className="px-4 py-3">출하일</th>
                  <th className="px-4 py-3">수정</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const active = selectedRowId === row.bom_item_id;

                  return (
                    <Fragment key={row.bom_item_id}>
                      <tr
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
                          {row.quantity} {row.unit}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-700">
                          {row.shipped_quantity} {row.unit}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-black ${getShipmentStatusBadgeClass(
                              row.shipment_status
                            )}`}
                          >
                            {getShipmentStatusLabel(row.shipment_status)}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-600">
                          {row.shipment_date || "-"}
                        </td>

                        <td className="px-4 py-3 font-black text-blue-600">
                          {active ? "닫기" : "수정"}
                        </td>
                      </tr>

                      {active ? (
                        <tr>
                          <td colSpan={9} className="bg-slate-50 px-5 py-5">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                              <div className="mb-5 flex items-center justify-between">
                                <div>
                                  <h2 className="text-lg font-black text-slate-950">
                                    {row.part_number} / {row.part_name}
                                  </h2>
                                  <p className="mt-1 text-sm font-medium text-slate-500">
                                    해당 품목의 출하 상태와 출하 정보를 수정합니다.
                                  </p>
                                </div>

                                <span
                                  className={`rounded-lg px-3 py-1.5 text-xs font-black ${getShipmentStatusBadgeClass(
                                    shipmentStatus
                                  )}`}
                                >
                                  {getShipmentStatusLabel(shipmentStatus)}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-5">
                                <div>
                                  <h3 className="mb-3 text-sm font-black text-slate-950">
                                    품목 정보
                                  </h3>

                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">
                                        품목 코드
                                      </span>
                                      <span className="font-bold">
                                        {row.part_number}
                                      </span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-slate-500">
                                        품목명
                                      </span>
                                      <span className="font-bold">
                                        {row.part_name}
                                      </span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-slate-500">
                                        도면 번호
                                      </span>
                                      <span className="font-bold">
                                        {row.drawing_no}
                                      </span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-slate-500">
                                        총 수량
                                      </span>
                                      <span className="font-bold">
                                        {row.quantity} {row.unit}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="mb-3 text-sm font-black text-slate-950">
                                    출하 정보
                                  </h3>

                                  <label className="mb-2 block text-xs font-bold text-slate-500">
                                    출하 상태
                                  </label>

                                  <select
                                    value={shipmentStatus}
                                    onChange={(event) =>
                                      setShipmentStatus(event.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                                  >
                                    {SHIPMENT_STATUS_OPTIONS.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>

                                  <label className="mb-2 mt-4 block text-xs font-bold text-slate-500">
                                    출하수량
                                  </label>

                                  <input
                                    type="number"
                                    value={shippedQuantity}
                                    onChange={(event) =>
                                      setShippedQuantity(
                                        Number(event.target.value)
                                      )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                  />

                                  <label className="mb-2 mt-4 block text-xs font-bold text-slate-500">
                                    출하일
                                  </label>

                                  <input
                                    type="date"
                                    value={shipmentDate}
                                    onChange={(event) =>
                                      setShipmentDate(event.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                  />
                                </div>

                                <div>
                                  <h3 className="mb-3 text-sm font-black text-slate-950">
                                    출하 메모
                                  </h3>

                                  <label className="mb-2 block text-xs font-bold text-slate-500">
                                    메모
                                  </label>

                                  <textarea
                                    value={memo}
                                    onChange={(event) =>
                                      setMemo(event.target.value)
                                    }
                                    rows={7}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="포장상태, 납품 특이사항, 거래명세서 송부 여부 등을 입력하세요."
                                  />
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}

                {!rows.length ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                    >
                      출하 대상 품목이 없습니다. QC 승인 완료 품목이 필요합니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}