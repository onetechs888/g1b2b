"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

const qcStatusOptions = [
  { label: "검수대기", value: "scheduled" },
  { label: "검수중", value: "inspecting" },
  { label: "승인", value: "passed" },
  { label: "NCR", value: "failed" },
  { label: "보류", value: "hold" },
];

function getQcStatusLabel(status: string) {
  if (status === "requested") return "검사요청";
  if (status === "scheduled") return "검수대기";
  if (status === "inspecting") return "검수중";
  if (status === "passed") return "승인";
  if (status === "failed") return "NCR";
  if (status === "hold") return "보류";
  return status || "-";
}

export default function QualityItemPage() {
  const router = useRouter();

  const [requestId, setRequestId] = useState("");
  const [currentStatus, setCurrentStatus] = useState("-");
  const [nextStatus, setNextStatus] = useState("scheduled");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const value = path.split("/").pop() ?? "";
    setRequestId(decodeURIComponent(value));
  }, []);

  useEffect(() => {
    if (!requestId) return;

    const fetchCurrentQc = async () => {
      const { data, error } = await supabase
        .from("qc_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (error || !data) {
        console.error("QC 조회 실패:", error);
        return;
      }

      setCurrentStatus(data.qc_status);
      setNextStatus(data.qc_status);
    };

    fetchCurrentQc();
  }, [requestId]);

  const handleSave = async () => {
    if (!requestId) {
      alert("QC 요청 ID를 찾지 못했습니다.");
      return;
    }

    setSaving(true);

    const normalizedNextStatus = nextStatus.trim().toLowerCase();

    const { data: currentQc, error: qcError } = await supabase
      .from("qc_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (qcError || !currentQc) {
      alert("QC 정보를 찾지 못했습니다.");
      console.error("QC 조회 실패:", qcError);
      setSaving(false);
      return;
    }

    const { data: bomItem, error: bomError } = await supabase
      .from("bom_items")
      .select("id, project_id, part_number, part_name, quantity")
      .eq("id", currentQc.bom_item_id)
      .single();

    if (bomError || !bomItem) {
      alert("BOM 정보를 찾지 못했습니다.");
      console.error("BOM 조회 실패:", bomError);
      setSaving(false);
      return;
    }

    const previousStatus = currentQc.qc_status;
    const saveMemo = memo || "QC 상태 변경";

    const { error: updateError } = await supabase
      .from("qc_requests")
      .update({
        qc_status: normalizedNextStatus,
        memo: saveMemo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      alert("QC 상태 저장 실패");
      console.error("QC UPDATE 실패:", updateError);
      setSaving(false);
      return;
    }

    let shipmentId: string | null = null;
    let ncrReportId: string | null = null;

    if (normalizedNextStatus === "passed") {
      const { data: existingShipment, error: existingShipmentError } =
        await supabase
          .from("shipments")
          .select("id")
          .eq("bom_item_id", bomItem.id)
          .maybeSingle();

      if (existingShipmentError) {
        alert("기존 출하 데이터 조회에 실패했습니다.");
        console.error("SHIPMENT 조회 실패:", existingShipmentError);
        setSaving(false);
        return;
      }

      if (existingShipment?.id) {
        shipmentId = existingShipment.id;
      } else {
        const { data: shipment, error: shipmentError } = await supabase
          .from("shipments")
          .insert({
            bom_item_id: bomItem.id,
            shipment_type: "full",
            shipped_quantity: bomItem.quantity ?? 1,
            tracking_number: null,
            shipment_status: "ready",
            shipment_date: new Date().toISOString().slice(0, 10),
            created_by: null,
          })
          .select("id")
          .single();

        if (shipmentError || !shipment) {
          alert("QC 승인은 저장됐지만 출하관리 자동 생성에 실패했습니다.");
          console.error("SHIPMENT INSERT 실패:", shipmentError);
          setSaving(false);
          return;
        }

        shipmentId = shipment.id;
      }
    }

    if (normalizedNextStatus === "failed") {
      const { data: existingNcr, error: existingNcrError } = await supabase
        .from("ncr_reports")
        .select("id")
        .eq("qc_request_id", currentQc.id)
        .maybeSingle();

      if (existingNcrError) {
        alert("기존 NCR 데이터 조회에 실패했습니다.");
        console.error("NCR 조회 실패:", existingNcrError);
        setSaving(false);
        return;
      }

      if (existingNcr?.id) {
        ncrReportId = existingNcr.id;
      } else {
        const { data: ncrReport, error: ncrError } = await supabase
          .from("ncr_reports")
          .insert({
            bom_item_id: bomItem.id,
            qc_request_id: currentQc.id,
            title: `${bomItem.part_name} 품질 부적합`,
            description: saveMemo,
            status: "registered",
          })
          .select("id")
          .single();

        if (ncrError || !ncrReport) {
          alert("QC 상태는 NCR로 저장됐지만 NCR 리포트 생성에 실패했습니다.");
          console.error("NCR INSERT 실패:", ncrError);
          setSaving(false);
          return;
        }

        ncrReportId = ncrReport.id;
      }
    }

    const { error: historyError } = await supabase
      .from("workflow_status_histories")
      .insert({
        bom_item_id: bomItem.id,
        workflow_type: "qc",
        from_status: previousStatus,
        to_status: normalizedNextStatus,
        changed_by: null,
        changed_at: new Date().toISOString(),
        source_table: "qc_requests",
        source_id: currentQc.id,
        memo: saveMemo,
      });

    if (historyError) {
      alert("QC 상태는 저장됐지만 상태 이력 저장에 실패했습니다.");
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
        target_type: "qc_request",
        target_id: currentQc.id,
        action:
          normalizedNextStatus === "passed"
            ? "qc_approved_shipment_created"
            : normalizedNextStatus === "failed"
              ? "qc_ncr_created"
              : "qc_status_change",
        before_value: {
          qc_status: previousStatus,
        },
        after_value: {
          qc_status: normalizedNextStatus,
          shipment_id: shipmentId,
          ncr_report_id: ncrReportId,
        },
        memo: saveMemo,
      });

    if (activityError) {
      alert("QC 상태와 이력은 저장됐지만 Activity Log 저장에 실패했습니다.");
      console.error("ACTIVITY INSERT 실패:", activityError);
      setSaving(false);
      return;
    }

    alert(
      normalizedNextStatus === "passed"
        ? "QC 승인 완료. 출하관리로 자동 이관되었습니다."
        : normalizedNextStatus === "failed"
          ? "NCR이 등록되었습니다."
          : "QC 상태가 저장되었습니다."
    );

    router.push("/workspace/partner/quality");
    router.refresh();
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="검사관리"
          description="검수 상태를 변경하고 승인 시 출하관리로 자동 이관합니다."
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">QC Request</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            {requestId || "로딩중..."}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KpiCard title="현재상태" value={getQcStatusLabel(currentStatus)} />
          <KpiCard title="변경상태" value={getQcStatusLabel(nextStatus)} />
          <KpiCard title="승인 시" value="출하 이관" />
          <KpiCard title="NCR 시" value="NCR 생성" />
        </div>

        <div className="flex items-start gap-4">
          <section className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">
              검사 상태 변경
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  변경할 검사 상태
                </label>

                <select
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  {qcStatusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  검사 메모 / NCR 사유
                </label>

                <textarea
                  rows={4}
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  placeholder="검사 결과, 승인 사유, NCR 사유 등을 입력하세요."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/workspace/partner/quality")}
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
                  {saving ? "저장중..." : "검사 상태 저장"}
                </button>
              </div>
            </div>
          </section>

          <aside className="w-80 shrink-0">
            <RightDetailPanel
              title="검사 상세"
              items={[
                { label: "QC ID", value: requestId || "-" },
                { label: "현재상태", value: getQcStatusLabel(currentStatus) },
                { label: "승인", value: "shipments 자동 생성" },
                { label: "출하상태", value: "포장 및 출하준비" },
                { label: "NCR", value: "ncr_reports 자동 생성" },
              ]}
            />
          </aside>
        </div>
      </div>
    </WorkspaceLayout>
  );
}