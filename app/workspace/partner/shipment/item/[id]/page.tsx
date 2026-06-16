"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

function getShipmentStatusLabel(status: string) {
  if (status === "ready") return "포장 및 출하준비";
  if (status === "shipped") return "출하 및 납품완료";
  return status || "-";
}

export default function ShipmentItemPage() {
  const router = useRouter();

  const [shipmentId, setShipmentId] = useState("");
  const [currentStatus, setCurrentStatus] = useState("-");
  const [nextStatus, setNextStatus] = useState("shipped");

  const [partNumber, setPartNumber] = useState("-");
  const [partName, setPartName] = useState("-");
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);

  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const value = path.split("/").pop() ?? "";
    setShipmentId(decodeURIComponent(value));
  }, []);

  useEffect(() => {
    if (!shipmentId) return;

    const fetchShipment = async () => {
      const { data: shipment, error: shipmentError } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", shipmentId)
        .single();

      if (shipmentError || !shipment) {
        console.error("출하 조회 실패:", shipmentError);
        return;
      }

      const { data: bomItem, error: bomError } = await supabase
        .from("bom_items")
        .select("part_number, part_name, quantity, unit_price")
        .eq("id", shipment.bom_item_id)
        .single();

      if (bomError || !bomItem) {
        console.error("BOM 조회 실패:", bomError);
        return;
      }

      setCurrentStatus(shipment.shipment_status);
      setNextStatus(shipment.shipment_status);
      setPartNumber(bomItem.part_number);
      setPartName(bomItem.part_name);
      setQuantity(Number(shipment.shipped_quantity ?? bomItem.quantity ?? 0));
      setUnitPrice(Number(bomItem.unit_price ?? 0));
    };

    fetchShipment();
  }, [shipmentId]);

  const handleSave = async () => {
    if (!shipmentId) {
      alert("출하 ID를 찾지 못했습니다.");
      return;
    }

    setSaving(true);

    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("*")
      .eq("id", shipmentId)
      .single();

    if (shipmentError || !shipment) {
      alert("출하 정보를 찾지 못했습니다.");
      console.error("출하 조회 실패:", shipmentError);
      setSaving(false);
      return;
    }

    const { data: bomItem, error: bomError } = await supabase
      .from("bom_items")
      .select("id, project_id, part_number, part_name, quantity, unit_price")
      .eq("id", shipment.bom_item_id)
      .single();

    if (bomError || !bomItem) {
      alert("BOM 정보를 찾지 못했습니다.");
      console.error("BOM 조회 실패:", bomError);
      setSaving(false);
      return;
    }

    const previousStatus = shipment.shipment_status;
    const saveMemo = memo || "출하 상태 변경";

    const { error: updateError } = await supabase
      .from("shipments")
      .update({
        shipment_status: nextStatus,
        shipment_date: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq("id", shipmentId);

    if (updateError) {
      alert("출하 상태 저장 실패");
      console.error("출하 UPDATE 실패:", updateError);
      setSaving(false);
      return;
    }

    let settlementId: string | null = null;

    if (nextStatus === "shipped") {
      const shippedQuantity = Number(shipment.shipped_quantity ?? bomItem.quantity ?? 0);
      const price = Number(bomItem.unit_price ?? 0);
      const amount = shippedQuantity * price;
      const vat = Math.round(amount * 0.1);
      const totalAmount = amount + vat;

      const { data: existingSettlement, error: existingSettlementError } =
        await supabase
          .from("settlements")
          .select("id")
          .eq("shipment_id", shipment.id)
          .maybeSingle();

      if (existingSettlementError) {
        alert("기존 정산 데이터 조회 실패");
        console.error("정산 조회 실패:", existingSettlementError);
        setSaving(false);
        return;
      }

      if (existingSettlement?.id) {
        settlementId = existingSettlement.id;
      } else {
        const { data: settlement, error: settlementError } = await supabase
          .from("settlements")
          .insert({
            bom_item_id: bomItem.id,
            shipment_id: shipment.id,
            partner_company_id: null,
            amount,
            vat,
            total_amount: totalAmount,
            status: "shipment_completed",
            invoice_no: null,
            invoice_date: null,
            payment_due_date: null,
            payment_date: null,
            memo: "출하 및 납품완료 자동 정산 생성",
          })
          .select("id")
          .single();

        if (settlementError || !settlement) {
          alert("출하 상태는 저장됐지만 정산관리 자동 생성에 실패했습니다.");
          console.error("정산 INSERT 실패:", settlementError);
          setSaving(false);
          return;
        }

        settlementId = settlement.id;
      }
    }

    const { error: historyError } = await supabase
      .from("workflow_status_histories")
      .insert({
        bom_item_id: bomItem.id,
        workflow_type: "shipment",
        from_status: previousStatus,
        to_status: nextStatus,
        changed_by: null,
        changed_at: new Date().toISOString(),
        source_table: "shipments",
        source_id: shipment.id,
        memo: saveMemo,
      });

    if (historyError) {
      alert("출하 상태는 저장됐지만 상태 이력 저장에 실패했습니다.");
      console.error("WORKFLOW INSERT 실패:", historyError);
      setSaving(false);
      return;
    }

    const { error: activityError } = await supabase
      .from("activity_logs")
      .insert({
        user_id: null,
        company_id: null,
        project_id: bomItem.project_id,
        bom_item_id: bomItem.id,
        target_type: "shipment",
        target_id: shipment.id,
        action:
          nextStatus === "shipped"
            ? "shipment_completed_settlement_created"
            : "shipment_status_change",
        before_value: {
          shipment_status: previousStatus,
        },
        after_value: {
          shipment_status: nextStatus,
          settlement_id: settlementId,
        },
        memo: saveMemo,
      });

    if (activityError) {
      alert("출하 상태와 이력은 저장됐지만 Activity Log 저장에 실패했습니다.");
      console.error("ACTIVITY INSERT 실패:", activityError);
      setSaving(false);
      return;
    }

    alert(
      nextStatus === "shipped"
        ? "출하 및 납품완료 처리되었습니다. 정산관리로 자동 이관되었습니다."
        : "출하 상태가 저장되었습니다."
    );

    router.push("/workspace/partner/shipment");
    router.refresh();
  };

  const amount = quantity * unitPrice;
  const vat = Math.round(amount * 0.1);
  const totalAmount = amount + vat;

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="출하관리"
          description="출하 상태를 변경하고 완료 시 정산관리로 자동 이관합니다."
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">Shipment ID</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            {shipmentId || "로딩중..."}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KpiCard title="현재상태" value={getShipmentStatusLabel(currentStatus)} />
          <KpiCard title="변경상태" value={getShipmentStatusLabel(nextStatus)} />
          <KpiCard title="공급가액" value={amount.toLocaleString()} />
          <KpiCard title="총금액" value={totalAmount.toLocaleString()} />
        </div>

        <div className="flex items-start gap-4">
          <section className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">
              출하 상태 변경
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  변경할 출하 상태
                </label>

                <select
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  <option value="ready">포장 및 출하준비</option>
                  <option value="shipped">출하 및 납품완료</option>
                </select>
              </div>

              <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
                <div>품목번호: {partNumber}</div>
                <div>품목명: {partName}</div>
                <div>수량: {quantity}</div>
                <div>단가: {unitPrice.toLocaleString()}</div>
                <div>공급가액: {amount.toLocaleString()}</div>
                <div>VAT: {vat.toLocaleString()}</div>
                <div>총금액: {totalAmount.toLocaleString()}</div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  출하 메모
                </label>

                <textarea
                  rows={4}
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  placeholder="출하 및 납품 관련 메모를 입력하세요."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/workspace/partner/shipment")}
                  className="h-11 rounded-md border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700"
                >
                  취소
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-11 rounded-md bg-black px-6 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "저장중..." : "출하 상태 저장"}
                </button>
              </div>
            </div>
          </section>

          <aside className="w-80 shrink-0">
            <RightDetailPanel
              title="출하 상세"
              items={[
                { label: "품목번호", value: partNumber },
                { label: "품목명", value: partName },
                { label: "현재상태", value: getShipmentStatusLabel(currentStatus) },
                { label: "완료 시", value: "settlements 자동 생성" },
                { label: "정산상태", value: "shipment_completed" },
              ]}
            />
          </aside>
        </div>
      </div>
    </WorkspaceLayout>
  );
}