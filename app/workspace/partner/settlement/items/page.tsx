"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

const SETTLEMENT_STATUS_OPTIONS = [
  { value: "invoice_requested", label: "청구서류 송부" },
  { value: "invoice_issued", label: "청구완료" },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getSettlementStatusLabel(status: string) {
  if (status === "shipment_completed") return "출하완료";
  if (status === "invoice_requested") return "청구서류 송부";
  if (status === "invoice_issued") return "청구완료";
  if (status === "payment_scheduled") return "입금예정";
  if (status === "completed") return "입금완료";
  return status ?? "-";
}

function getSettlementStatusBadgeClass(status: string) {
  if (status === "shipment_completed") return "bg-slate-100 text-slate-700";
  if (status === "invoice_requested") return "bg-cyan-50 text-cyan-600";
  if (status === "invoice_issued") return "bg-blue-50 text-blue-600";
  if (status === "payment_scheduled") return "bg-purple-50 text-purple-600";
  if (status === "completed") return "bg-emerald-50 text-emerald-600";
  return "bg-slate-50 text-slate-600";
}

function isCustomerStatus(status: string) {
  return status === "payment_scheduled" || status === "completed";
}

export default function SettlementItemsPage() {
  const searchParams = useSearchParams();
  const selectedProjectCode = searchParams.get("project");
  const isAllProjects = !selectedProjectCode || selectedProjectCode === "all";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const [settlementStatus, setSettlementStatus] =
    useState("invoice_requested");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .order("project_code", { ascending: true });

      setProjects(projectData ?? []);

      const currentProject =
        !isAllProjects &&
        projectData?.some(
          (project) => project.project_code === selectedProjectCode
        )
          ? projectData.find(
              (project) => project.project_code === selectedProjectCode
            )
          : null;

      let bomQuery = supabase
        .from("bom_items")
        .select("*")
        .order("part_number", { ascending: true });

      if (!isAllProjects && currentProject?.id) {
        bomQuery = bomQuery.eq("project_id", currentProject.id);
      }

      const { data: bomItems } = await bomQuery;
      const bomIds = bomItems?.map((item) => item.id) ?? [];

      const { data: shipments } = bomIds.length
        ? await supabase
            .from("shipments")
            .select("*")
            .in("bom_item_id", bomIds)
            .eq("shipment_status", "completed")
            .order("created_at", { ascending: false })
        : { data: [] };

      const shipmentIds = shipments?.map((shipment) => shipment.id) ?? [];

      const { data: settlements } = shipmentIds.length
        ? await supabase
            .from("settlements")
            .select("*")
            .in("shipment_id", shipmentIds)
            .order("created_at", { ascending: false })
        : { data: [] };

      const bomMap = new Map<string, any>();
      bomItems?.forEach((item) => {
        bomMap.set(String(item.id), item);
      });

      const settlementMap = new Map<string, any>();
      settlements?.forEach((settlement) => {
        settlementMap.set(String(settlement.shipment_id), settlement);
      });

      const nextRows =
        shipments?.map((shipment, index) => {
          const bom = bomMap.get(String(shipment.bom_item_id));
          const settlement = settlementMap.get(String(shipment.id));

          const quantity = getNumber(bom?.quantity);
          const unitPrice = getNumber(bom?.unit_price);
          const supplyAmount = quantity * unitPrice;
          const vatAmount = Math.round(supplyAmount * 0.1);
          const totalAmount = supplyAmount + vatAmount;

          return {
            no: index + 1,
            project_id: bom?.project_id ?? null,
            bom_item_id: shipment.bom_item_id,
            shipment_id: shipment.id,
            settlement_id: settlement?.id ?? null,
            partner_company_id:
              settlement?.partner_company_id ??
              bom?.partner_company_id ??
              null,
            part_number: bom?.part_number ?? "-",
            part_name: bom?.part_name ?? "-",
            drawing_no: bom?.drawing_no ?? "-",
            quantity,
            supply_amount: supplyAmount,
            vat_amount: vatAmount,
            total_amount: totalAmount,
            settlement_status: settlement?.status ?? "shipment_completed",
            memo: settlement?.memo ?? "",
            shipment_date: shipment.shipment_date ?? shipment.created_at ?? "-",
          };
        }) ?? [];

      setRows(nextRows);

      const firstRow = nextRows[0];

      if (firstRow) {
        setSelectedRowId(firstRow.shipment_id);
        setSettlementStatus(
          isCustomerStatus(firstRow.settlement_status)
            ? firstRow.settlement_status
            : firstRow.settlement_status === "shipment_completed"
            ? "invoice_requested"
            : firstRow.settlement_status
        );
        setMemo(firstRow.memo || "");
      } else {
        setSelectedRowId(null);
      }

      setLoading(false);
    }

    fetchData();
  }, [selectedProjectCode, isAllProjects]);

  const selectedRow = useMemo(() => {
    return rows.find((row) => row.shipment_id === selectedRowId) ?? null;
  }, [rows, selectedRowId]);

  const totalCount = rows.length;

  const invoiceRequestedCount = rows.filter(
    (row) => row.settlement_status === "invoice_requested"
  ).length;

  const invoiceIssuedCount = rows.filter(
    (row) => row.settlement_status === "invoice_issued"
  ).length;

  const customerProgressCount = rows.filter((row) =>
    isCustomerStatus(row.settlement_status)
  ).length;

  function handleSelectRow(row: any) {
    if (selectedRowId === row.shipment_id) {
      setSelectedRowId(null);
      return;
    }

    setSelectedRowId(row.shipment_id);
    setSettlementStatus(
      isCustomerStatus(row.settlement_status)
        ? row.settlement_status
        : row.settlement_status === "shipment_completed"
        ? "invoice_requested"
        : row.settlement_status
    );
    setMemo(row.memo || "");
  }

  async function handleSave() {
    if (!selectedRow) return;

    if (isCustomerStatus(selectedRow.settlement_status)) {
      alert("입금예정/입금완료 상태는 고객 영역에서 변경해야 합니다.");
      return;
    }

    setSaving(true);

    const now = new Date().toISOString();
    const previousStatus = selectedRow.settlement_status;
    const nextStatus = settlementStatus;

    let settlementId = selectedRow.settlement_id;

    const payload = {
      bom_item_id: selectedRow.bom_item_id,
      shipment_id: selectedRow.shipment_id,
      partner_company_id: selectedRow.partner_company_id,
      amount: selectedRow.supply_amount,
      vat: selectedRow.vat_amount,
      total_amount: selectedRow.total_amount,
      status: nextStatus,
      memo,
      updated_at: now,
    };

    if (settlementId) {
      const { error } = await supabase
        .from("settlements")
        .update(payload)
        .eq("id", settlementId);

      if (error) {
        alert(`정산 저장 실패: ${error.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("settlements")
        .insert({
          ...payload,
          created_at: now,
        })
        .select("id")
        .single();

      if (error) {
        alert(`정산 생성 실패: ${error.message}`);
        setSaving(false);
        return;
      }

      settlementId = data?.id;
    }

    await supabase.from("activity_logs").insert({
      project_id: selectedRow.project_id,
      bom_item_id: selectedRow.bom_item_id,
      target_type: "settlement",
      target_id: settlementId,
      action: "settlement_status_change",
      before_value: previousStatus,
      after_value: nextStatus,
      memo:
        memo ||
        `정산 상태 변경: ${getSettlementStatusLabel(
          previousStatus
        )} → ${getSettlementStatusLabel(nextStatus)}`,
      created_at: now,
    });

    await supabase.from("workflow_status_histories").insert({
      project_id: selectedRow.project_id,
      bom_item_id: selectedRow.bom_item_id,
      workflow_type: "settlement",
      from_status: previousStatus,
      to_status: nextStatus,
      memo:
        memo ||
        `정산 상태 변경: ${getSettlementStatusLabel(
          previousStatus
        )} → ${getSettlementStatusLabel(nextStatus)}`,
      changed_at: now,
    });

    setRows((prev) =>
      prev.map((row) =>
        row.shipment_id === selectedRow.shipment_id
          ? {
              ...row,
              settlement_id: settlementId,
              settlement_status: nextStatus,
              memo,
            }
          : row
      )
    );

    setSaving(false);
    alert("정산 정보가 저장되었습니다.");
  }

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-sm font-bold text-slate-500">
          정산관리 데이터를 불러오는 중...
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div>
          <div className="text-sm font-black text-slate-500">
            정산관리 &gt; 정산대상관리
          </div>

          <h1 className="mt-2 text-2xl font-black text-slate-950">
            정산대상관리
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            파트너는 청구서류 송부와 청구완료까지만 관리합니다.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-[240px_repeat(4,1fr)] items-center gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500">
                프로젝트 (PO)
              </div>
              <div className="mt-3">
                <ProjectSelector
                  projects={[
                    { id: "all", name: "전체 프로젝트" },
                    ...projects.map((project) => ({
                      id: project.project_code,
                      name: `${project.project_code} / ${project.project_name}`,
                    })),
                  ]}
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
              <div className="text-xs font-bold text-slate-500">
                청구서류 송부
              </div>
              <div className="mt-2 text-2xl font-black text-cyan-600">
                {invoiceRequestedCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">청구완료</div>
              <div className="mt-2 text-2xl font-black text-blue-600">
                {invoiceIssuedCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                고객 처리중
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-600">
                {customerProgressCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="w-72 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              품목명, 도면번호 검색
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedRow || saving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {saving ? "저장 중..." : "정산 저장"}
            </button>
          </div>

          <div className="max-h-[640px] overflow-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-black text-slate-500">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">품목 코드</th>
                  <th className="px-4 py-3">품목명</th>
                  <th className="px-4 py-3">도면번호</th>
                  <th className="px-4 py-3">수량</th>
                  <th className="px-4 py-3">공급가액</th>
                  <th className="px-4 py-3">VAT</th>
                  <th className="px-4 py-3">합계</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const active = selectedRowId === row.shipment_id;

                  return (
                    <Fragment key={row.shipment_id}>
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
                          {row.quantity}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {formatMoney(row.supply_amount)}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {formatMoney(row.vat_amount)}
                        </td>
                        <td className="px-4 py-3 font-black text-slate-950">
                          {formatMoney(row.total_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-black ${getSettlementStatusBadgeClass(
                              row.settlement_status
                            )}`}
                          >
                            {getSettlementStatusLabel(row.settlement_status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-black text-blue-600">
                          {active ? "닫기" : "수정"}
                        </td>
                      </tr>

                      {active ? (
                        <tr>
                          <td colSpan={10} className="bg-slate-50 px-5 py-5">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                              <div className="mb-5 flex items-center justify-between">
                                <div>
                                  <h2 className="text-lg font-black text-slate-950">
                                    {row.part_number} / {row.part_name}
                                  </h2>
                                  <p className="mt-1 text-sm font-medium text-slate-500">
                                    청구 상태, 청구서류 첨부, 메모를 관리합니다.
                                  </p>
                                </div>

                                <span
                                  className={`rounded-lg px-3 py-1.5 text-xs font-black ${getSettlementStatusBadgeClass(
                                    row.settlement_status
                                  )}`}
                                >
                                  {getSettlementStatusLabel(
                                    row.settlement_status
                                  )}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-5">
                                <div>
                                  <h3 className="mb-3 text-sm font-black text-slate-950">
                                    정산 금액
                                  </h3>

                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">
                                        공급가액
                                      </span>
                                      <span className="font-bold">
                                        {formatMoney(row.supply_amount)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">VAT</span>
                                      <span className="font-bold">
                                        {formatMoney(row.vat_amount)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-100 pt-2">
                                      <span className="text-slate-500">합계</span>
                                      <span className="font-black">
                                        {formatMoney(row.total_amount)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="mb-3 text-sm font-black text-slate-950">
                                    청구 정보
                                  </h3>

                                  <label className="mb-2 block text-xs font-bold text-slate-500">
                                    상태
                                  </label>

                                  <select
                                    value={settlementStatus}
                                    onChange={(event) =>
                                      setSettlementStatus(event.target.value)
                                    }
                                    disabled={isCustomerStatus(
                                      row.settlement_status
                                    )}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold disabled:bg-slate-100 disabled:text-slate-400"
                                  >
                                    {SETTLEMENT_STATUS_OPTIONS.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>

                                  <label className="mb-2 mt-4 block text-xs font-bold text-slate-500">
                                    청구서류 첨부
                                  </label>

                                  <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                                    <div className="text-sm font-black text-slate-700">
                                      거래명세서 / 세금계산서 / 청구서 업로드
                                    </div>

                                    <div className="mt-2 text-xs font-medium text-slate-500">
                                      PDF, JPG, PNG, XLSX 파일 첨부 예정
                                    </div>

                                    <input
                                      type="file"
                                      disabled={isCustomerStatus(
                                        row.settlement_status
                                      )}
                                      className="mt-4 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 disabled:bg-slate-100"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <h3 className="mb-3 text-sm font-black text-slate-950">
                                    정산 메모
                                  </h3>

                                  <textarea
                                    value={memo}
                                    onChange={(event) =>
                                      setMemo(event.target.value)
                                    }
                                    disabled={isCustomerStatus(
                                      row.settlement_status
                                    )}
                                    rows={10}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
                                    placeholder="거래명세서 송부, 세금계산서, 고객 협의사항 등을 입력하세요."
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
                      colSpan={10}
                      className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                    >
                      출하완료 기준 정산대상 품목이 없습니다.
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