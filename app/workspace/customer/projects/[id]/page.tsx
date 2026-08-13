"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Factory,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { useCustomerProjectDetail } from "@/hooks/customer/useCustomerProjectDetail";

import type {
  CustomerProjectDetailBomItem,
} from "@/services/customer/projectService";

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getProcessDotClass(process: string | null) {
  switch (process) {
    case "대기":
      return "bg-slate-400";
    case "소재입고":
      return "bg-blue-500";
    case "소재검수":
      return "bg-cyan-500";
    case "가공대기":
      return "bg-amber-400";
    case "내부공정":
      return "bg-emerald-500";
    case "외부공정":
      return "bg-orange-500";
    case "가공완료":
      return "bg-teal-500";
    case "검수요청":
      return "bg-indigo-500";
    default:
      return "bg-slate-400";
  }
}

function getProcessBadgeClass(process: string | null) {
  switch (process) {
    case "대기":
      return "border-slate-200 bg-slate-50 text-slate-600";
    case "소재입고":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "소재검수":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "가공대기":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "내부공정":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "외부공정":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "가공완료":
      return "border-teal-200 bg-teal-50 text-teal-700";
    case "검수요청":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getCurrentManufacturingStatus(
  item: CustomerProjectDetailBomItem,
) {
  const qualityStatus = item.quality.qc_status;
  const shipmentStatus = item.shipment.shipment_status;

  // NCR은 출하보다 우선합니다.
  // Service에서도 QC가 passed가 아니면 shipment를 현재 출하로
  // 내려주지 않지만, Page에서도 동일한 업무 규칙을 한 번 더 명확히 적용합니다.
  if (qualityStatus === "failed") {
    return {
      label: "NCR",
      dotClass: "bg-red-500",
      badgeClass:
        "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (
    qualityStatus === "passed" &&
    shipmentStatus
  ) {
    return {
      label: "출하",
      dotClass: "bg-purple-500",
      badgeClass:
        "border-purple-200 bg-purple-50 text-purple-700",
    };
  }

  if (qualityStatus) {
    return {
      label: "품질",
      dotClass: "bg-blue-500",
      badgeClass:
        "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  const process =
    item.production.process_step ??
    item.process_type ??
    "대기";

  if (process === "대기") {
    return {
      label: "대기",
      dotClass: "bg-yellow-500",
      badgeClass:
        "border-yellow-200 bg-yellow-50 text-yellow-700",
    };
  }

  return {
    label: "생산",
    dotClass: "bg-emerald-500",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getQualityLabel(status: string | null) {
  switch (status) {
    case "requested":
      return "검수대기";
    case "scheduled":
      return "검수예정";
    case "inspecting":
      return "검수중";
    case "passed":
      return "승인";
    case "failed":
      return "부적합";
    case "hold":
      return "보류";
    default:
      return status ?? "-";
  }
}

function getQualityBadgeClass(status: string | null) {
  switch (status) {
    case "requested":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "scheduled":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "inspecting":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "passed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "failed":
      return "border-red-200 bg-red-50 text-red-700";
    case "hold":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-500";
  }
}

function getShipmentLabel(status: string | null) {
  switch (status) {
    case "ready":
      return "출하준비";
    case "partial_shipped":
      return "부분출하";
    case "shipped":
      return "출하";
    case "delivered":
      return "납품";
    case "completed":
      return "출하완료";
    default:
      return status ?? "-";
  }
}

function getShipmentBadgeClass(status: string | null) {
  switch (status) {
    case "ready":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "partial_shipped":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "shipped":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "delivered":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-500";
  }
}

export default function CustomerProjectDetailPage() {
  const params = useParams();

  const projectId =
    typeof params.id === "string"
      ? params.id
      : "";

  const {
    detail,
    loading,
    error,
    refresh,
  } = useCustomerProjectDetail(projectId);

  const [keyword, setKeyword] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (!detail) return [];

    const normalized = keyword.trim().toLowerCase();

    if (!normalized) {
      return detail.bom_items;
    }

    return detail.bom_items.filter((item) => {
      return (
        (item.part_number ?? "")
          .toLowerCase()
          .includes(normalized) ||
        item.part_name
          .toLowerCase()
          .includes(normalized) ||
        (item.drawing_no ?? "")
          .toLowerCase()
          .includes(normalized)
      );
    });
  }, [detail, keyword]);

  if (loading) {
    return (
      <WorkspaceLayout role="customer">
        <div className="flex min-h-[520px] items-center justify-center">
          <div className="text-center">
            <RefreshCw
              size={24}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-3 text-sm font-bold text-slate-500">
              프로젝트 상세정보를 불러오는 중입니다.
            </p>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (error || !detail) {
    return (
      <WorkspaceLayout role="customer">
        <div className="flex min-h-[520px] items-center justify-center px-6">
          <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <AlertTriangle
              size={28}
              className="mx-auto text-red-500"
            />

            <h1 className="mt-3 text-lg font-black text-red-700">
              프로젝트 상세정보를 불러오지 못했습니다.
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ?? "데이터를 확인할 수 없습니다."}
            </p>

            <div className="mt-5 flex justify-center gap-2">
              <Link
                href="/workspace/customer"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
              >
                목록으로
              </Link>

              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-black text-white"
              >
                다시 불러오기
              </button>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  const {
    project,
    summary,
    bom_items,
  } = detail;

  const productionInProgressCount =
    bom_items.filter((item) => {
      const process =
        item.production.process_step ??
        item.process_type ??
        "대기";

      return (
        process !== "대기" &&
        process !== "검수요청"
      );
    }).length;

  const qcRequestedCount =
    bom_items.filter(
      (item) =>
        (item.production.process_step ??
          item.process_type) === "검수요청",
    ).length;

  const qualityInspectingCount =
    bom_items.filter(
      (item) =>
        item.quality.qc_status === "inspecting",
    ).length;

  const qualityPassedCount =
    bom_items.filter(
      (item) =>
        item.quality.qc_status === "passed",
    ).length;

  const shipmentReadyCount =
    bom_items.filter(
      (item) =>
        item.shipment.shipment_status === "ready",
    ).length;

  const shipmentCompletedCount =
    bom_items.filter(
      (item) =>
        item.shipment.shipment_status === "completed",
    ).length;

  return (
    <WorkspaceLayout role="customer">
      <div className="space-y-3">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                품목별 상세관리
              </h1>

              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                <Package size={18} />
              </div>
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              BOM 품목별 현재 단계와 생산 · 품질 · 출하 상세상태를 확인합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/workspace/customer"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm"
            >
              <ArrowLeft size={15} />
              프로젝트 목록
            </Link>

            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm"
            >
              <RefreshCw size={15} />
              새로고침
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(260px,1.5fr)_repeat(7,minmax(120px,1fr))] items-center divide-x divide-slate-100">
            <div className="px-5 py-4">
              <div className="text-[11px] font-black text-slate-400">
                PROJECT
              </div>

              <div className="mt-1">
                <div className="text-base font-black text-blue-700">
                  {project.project_code ?? "-"}
                </div>

                <div className="mt-0.5 text-sm font-bold text-slate-900">
                  {project.project_name}
                </div>

                <div className="mt-2 text-xs font-semibold text-slate-500">
                  제조사 {project.partner_company_name}
                </div>

                <div className="mt-1 text-xs font-semibold text-slate-500">
                  납기 {formatDate(project.due_date)}
                </div>
              </div>
            </div>

            <SummaryItem
              label="전체 품목"
              value={summary.total_bom}
              icon={Package}
              tone="blue"
            />

            <SummaryItem
              label="생산 진행"
              value={productionInProgressCount}
              icon={Factory}
              tone="emerald"
            />

            <SummaryItem
              label="검수요청"
              value={qcRequestedCount}
              icon={CheckCircle2}
              tone="indigo"
            />

            <SummaryItem
              label="품질검수"
              value={qualityInspectingCount}
              icon={ShieldCheck}
              tone="violet"
            />

            <SummaryItem
              label="품질승인"
              value={qualityPassedCount}
              icon={ShieldCheck}
              tone="green"
            />

            <SummaryItem
              label="출하준비"
              value={shipmentReadyCount}
              icon={Truck}
              tone="orange"
            />

            <SummaryItem
              label="출하완료"
              value={shipmentCompletedCount}
              icon={Truck}
              tone="purple"
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                BOM 품목 목록 ({bom_items.length})
              </h2>

              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                목록에서는 대기 · 생산 · 품질 · NCR · 출하 단계만 표시하고, 상세에서 실제 세부 상태를 확인합니다.
              </p>
            </div>

            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={keyword}
                onChange={(event) =>
                  setKeyword(event.target.value)
                }
                placeholder="품목명, 품번, 도면번호 검색"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 sm:w-[280px]"
              />
            </div>
          </div>

          <div className="max-h-[590px] overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full min-w-[1540px] text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-black text-slate-500">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">품목코드</th>
                  <th className="px-4 py-3">품목명</th>
                  <th className="px-4 py-3">도면번호</th>
                  <th className="px-4 py-3">REV.</th>
                  <th className="px-4 py-3">수량</th>
                  <th className="px-4 py-3">소재</th>
                  <th className="px-4 py-3">현재상태</th>
                  <th className="px-4 py-3">생산진행률</th>
                  <th className="px-4 py-3">품질상태</th>
                  <th className="px-4 py-3">출하상태</th>
                  <th className="px-4 py-3">최근 업데이트</th>
                  <th className="px-4 py-3 text-center">상세</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, index) => (
                  <BomRow
                    key={item.id}
                    index={index + 1}
                    item={item}
                    expanded={expandedItemId === item.id}
                    onToggle={() =>
                      setExpandedItemId((current) =>
                        current === item.id ? null : item.id,
                      )
                    }
                  />
                ))}

                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-4 py-12 text-center text-sm font-bold text-slate-400"
                    >
                      표시할 품목이 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <div className="text-xs font-bold text-slate-500">
              총 {filteredItems.length}건
            </div>

            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
              <Clock3 size={13} />
              최근 업데이트 기준
            </div>
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}

function SummaryItem({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone:
    | "blue"
    | "emerald"
    | "indigo"
    | "violet"
    | "green"
    | "orange"
    | "purple";
}) {
  const toneClassMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${toneClassMap[tone]}`}
        >
          <Icon size={17} />
        </div>

        <div>
          <div className="text-[11px] font-black text-slate-500">
            {label}
          </div>

          <div className="mt-0.5 text-xl font-black text-slate-950">
            {value}
            <span className="ml-1 text-xs font-bold text-slate-500">
              개
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BomRow({
  index,
  item,
  expanded,
  onToggle,
}: {
  index: number;
  item: CustomerProjectDetailBomItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const process =
    item.production.process_step ??
    item.process_type ??
    "대기";

  const currentStatus =
    getCurrentManufacturingStatus(item);

  const hasShipment =
    Boolean(item.shipment.id) ||
    Boolean(item.shipment.shipment_status);

  const hasQuality =
    Boolean(item.quality.id) ||
    Boolean(item.quality.qc_status);

  const detailStage: "production" | "quality" | "shipment" =
    item.quality.qc_status === "failed"
      ? "quality"
      : hasShipment &&
          item.quality.qc_status === "passed"
        ? "shipment"
        : hasQuality
          ? "quality"
          : "production";

  return (
    <>
      <tr className="hover:bg-slate-50">
        <td className="px-4 py-3 font-bold text-slate-600">
          {index}
        </td>

        <td className="px-4 py-3 font-black text-slate-950">
          {item.part_number ?? "-"}
        </td>

        <td className="px-4 py-3 font-bold text-slate-800">
          {item.part_name}
        </td>

        <td className="px-4 py-3 font-semibold text-slate-600">
          {item.drawing_no ?? "-"}
        </td>

        <td className="px-4 py-3 font-bold text-slate-700">
          {item.revision ?? "-"}
        </td>

        <td className="px-4 py-3 font-bold text-slate-700">
          {item.quantity.toLocaleString("ko-KR")}{" "}
          {item.unit ?? ""}
        </td>

        <td className="px-4 py-3 font-bold text-slate-700">
          {item.material ?? "-"}
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${currentStatus.dotClass}`}
            />

            <span
              className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-black ${currentStatus.badgeClass}`}
            >
              {currentStatus.label}
            </span>
          </div>
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-emerald-600"
                style={{
                  width: `${Math.min(
                    Math.max(
                      item.production.progress,
                      0,
                    ),
                    100,
                  )}%`,
                }}
              />
            </div>

            <span className="text-[11px] font-black text-slate-600">
              {item.production.progress}%
            </span>
          </div>
        </td>

        <td className="px-4 py-3">
          <span
            className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-black ${getQualityBadgeClass(
              item.quality.qc_status,
            )}`}
          >
            {getQualityLabel(
              item.quality.qc_status,
            )}
          </span>
        </td>

        <td className="px-4 py-3">
          <span
            className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-black ${
              item.quality.qc_status === "failed"
                ? "border-slate-200 bg-slate-50 text-slate-400"
                : getShipmentBadgeClass(
                    item.shipment.shipment_status,
                  )
            }`}
          >
            {item.quality.qc_status === "failed"
              ? "-"
              : getShipmentLabel(
                  item.shipment.shipment_status,
                )}
          </span>
        </td>

        <td className="px-4 py-3 text-xs font-semibold text-slate-600">
          {formatDateTime(
            item.latest_update_at,
          )}
        </td>

        <td className="px-4 py-3 text-center">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-blue-300 hover:text-blue-700"
          >
            상세
            {expanded ? (
              <ChevronUp size={13} />
            ) : (
              <ChevronDown size={13} />
            )}
          </button>
        </td>
      </tr>

      {expanded ? (
        <tr className="bg-slate-50/70">
          <td colSpan={13} className="px-4 py-0">
            <ItemDynamicDetail
              item={item}
              stage={detailStage}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

const PRODUCTION_FLOW = [
  "대기",
  "소재입고",
  "소재검수",
  "내부공정",
  "외부공정",
  "검수요청",
];

const QUALITY_FLOW = [
  { value: "requested", label: "검수대기" },
  { value: "scheduled", label: "검수예정" },
  { value: "inspecting", label: "검수중" },
  { value: "passed", label: "승인" },
];

const SHIPMENT_FLOW = [
  { value: "ready", label: "출하준비" },
  { value: "shipped", label: "출하" },
  { value: "delivered", label: "납품" },
  { value: "completed", label: "출하완료" },
];

function ItemDynamicDetail({
  item,
  stage,
}: {
  item: CustomerProjectDetailBomItem;
  stage: "production" | "quality" | "shipment";
}) {
  if (stage === "shipment") {
    return (
      <div className="py-4">
        <DetailCard
          title="출하 상세"
          icon={Truck}
          tone="orange"
        >
          <ShipmentFlow
            currentStatus={item.shipment.shipment_status}
          />

          <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailField
              label="현재 상태"
              value={getShipmentLabel(
                item.shipment.shipment_status,
              )}
            />

            <DetailField
              label="출하일"
              value={formatDate(
                item.shipment.shipment_date,
              )}
            />

            <DetailField
              label="출하수량"
              value={
                item.shipment.shipped_quantity === null
                  ? "-"
                  : `${item.shipment.shipped_quantity.toLocaleString(
                      "ko-KR",
                    )} ${item.unit ?? ""}`.trim()
              }
            />

            <DetailField
              label="최근 변경"
              value={formatDateTime(
                item.shipment.updated_at,
              )}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <StageSummaryBadge
              label="생산"
              value="완료"
              completed
            />

            <StageSummaryBadge
              label="품질"
              value={getQualityLabel(
                item.quality.qc_status,
              )}
              completed={
                item.quality.qc_status === "passed"
              }
            />
          </div>
        </DetailCard>
      </div>
    );
  }

  if (stage === "quality") {
    return (
      <div className="py-4">
        <DetailCard
          title="품질 상세"
          icon={ShieldCheck}
          tone="violet"
        >
          <QualityFlow
            currentStatus={item.quality.qc_status}
          />

          <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailField
              label="현재 QC 상태"
              value={getQualityLabel(
                item.quality.qc_status,
              )}
            />

            <DetailField
              label="검사일"
              value={formatDate(
                item.quality.inspection_date,
              )}
            />

            <DetailField
              label="최근 변경"
              value={formatDateTime(
                item.quality.updated_at,
              )}
            />

            <DetailField
              label="메모"
              value={item.quality.memo ?? "-"}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <StageSummaryBadge
              label="생산"
              value="검수요청 완료"
              completed
            />
          </div>
        </DetailCard>
      </div>
    );
  }

  return (
    <div className="py-4">
      <DetailCard
        title="생산 상세"
        icon={Factory}
        tone="emerald"
      >
        <ProductionFlow
          currentProcess={
            item.production.process_step ??
            item.process_type ??
            "대기"
          }
        />

        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailField
            label="현재 공정"
            value={
              item.production.process_step ??
              item.process_type ??
              "대기"
            }
          />

          <DetailField
            label="생산 진행률"
            value={`${item.production.progress}%`}
          />

          <DetailField
            label="최근 변경"
            value={formatDateTime(
              item.production.updated_at,
            )}
          />

          <DetailField
            label="메모"
            value={item.production.memo ?? "-"}
          />
        </div>
      </DetailCard>
    </div>
  );
}

function ProductionFlow({
  currentProcess,
}: {
  currentProcess: string;
}) {
  const rawIndex =
    PRODUCTION_FLOW.indexOf(currentProcess);

  const currentIndex =
    rawIndex >= 0 ? rawIndex : 0;

  return (
    <FlowScroller>
      {PRODUCTION_FLOW.map((step, index) => (
        <FlowStep
          key={step}
          label={step}
          index={index}
          currentIndex={currentIndex}
          total={PRODUCTION_FLOW.length}
        />
      ))}
    </FlowScroller>
  );
}

function QualityFlow({
  currentStatus,
}: {
  currentStatus: string | null;
}) {
  const isException =
    currentStatus === "failed" ||
    currentStatus === "hold";

  const rawIndex =
    QUALITY_FLOW.findIndex(
      (step) => step.value === currentStatus,
    );

  const currentIndex =
    isException
      ? 2
      : rawIndex >= 0
        ? rawIndex
        : 0;

  return (
    <div>
      <FlowScroller>
        {QUALITY_FLOW.map((step, index) => (
          <FlowStep
            key={step.value}
            label={step.label}
            index={index}
            currentIndex={currentIndex}
            total={QUALITY_FLOW.length}
            forceCompleted={
              isException && index <= 2
            }
            suppressCurrent={
              isException && index === 2
            }
          />
        ))}
      </FlowScroller>

      {isException ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle
            size={16}
            className={
              currentStatus === "failed"
                ? "text-red-600"
                : "text-amber-600"
            }
          />

          <div>
            <div className="text-[10px] font-black text-slate-400">
              품질 예외 상태
            </div>

            <div
              className={[
                "mt-0.5 text-xs font-black",
                currentStatus === "failed"
                  ? "text-red-700"
                  : "text-amber-700",
              ].join(" ")}
            >
              {currentStatus === "failed"
                ? "부적합"
                : "보류"}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ShipmentFlow({
  currentStatus,
}: {
  currentStatus: string | null;
}) {
  const normalizedStatus =
    currentStatus === "partial_shipped"
      ? "shipped"
      : currentStatus;

  const rawIndex =
    SHIPMENT_FLOW.findIndex(
      (step) =>
        step.value === normalizedStatus,
    );

  const currentIndex =
    rawIndex >= 0 ? rawIndex : 0;

  return (
    <FlowScroller>
      {SHIPMENT_FLOW.map((step, index) => (
        <FlowStep
          key={step.value}
          label={step.label}
          index={index}
          currentIndex={currentIndex}
          total={SHIPMENT_FLOW.length}
        />
      ))}
    </FlowScroller>
  );
}

function FlowScroller({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-[760px] items-start">
        {children}
      </div>
    </div>
  );
}

function FlowStep({
  label,
  index,
  currentIndex,
  total,
  forceCompleted = false,
  suppressCurrent = false,
}: {
  label: string;
  index: number;
  currentIndex: number;
  total: number;
  forceCompleted?: boolean;
  suppressCurrent?: boolean;
}) {
  const completed =
    forceCompleted || index < currentIndex;

  const current =
    !suppressCurrent &&
    !forceCompleted &&
    index === currentIndex;

  return (
    <div className="flex flex-1 items-start">
      <div className="flex min-w-[105px] flex-col items-center">
        <div
          className={[
            "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black",
            completed
              ? "border-emerald-600 bg-emerald-600 text-white"
              : current
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-400",
          ].join(" ")}
        >
          {completed ? (
            <CheckCircle2 size={15} />
          ) : (
            index + 1
          )}
        </div>

        <div
          className={[
            "mt-2 text-center text-xs font-black",
            current
              ? "text-blue-700"
              : completed
                ? "text-emerald-700"
                : "text-slate-400",
          ].join(" ")}
        >
          {label}
        </div>

        {current ? (
          <div className="mt-1 text-[10px] font-black text-blue-600">
            현재
          </div>
        ) : null}
      </div>

      {index < total - 1 ? (
        <div
          className={[
            "mt-4 h-0.5 flex-1",
            index < currentIndex ||
            forceCompleted
              ? "bg-emerald-500"
              : "bg-slate-200",
          ].join(" ")}
        />
      ) : null}
    </div>
  );
}

function StageSummaryBadge({
  label,
  value,
  completed = false,
}: {
  label: string;
  value: string;
  completed?: boolean;
}) {
  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black",
        completed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {completed ? (
        <CheckCircle2 size={14} />
      ) : null}

      <span>{label}</span>
      <span className="text-slate-400">·</span>
      <span>{value}</span>
    </div>
  );
}

function DetailCard({
  title,
  icon: Icon,
  tone,
  children,
}: {
  title: string;
  icon: React.ElementType;
  tone: "emerald" | "violet" | "orange";
  children: React.ReactNode;
}) {
  const toneClassMap = {
    emerald:
      "border-emerald-200 bg-emerald-50/50 text-emerald-700",
    violet:
      "border-violet-200 bg-violet-50/50 text-violet-700",
    orange:
      "border-orange-200 bg-orange-50/50 text-orange-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg border ${toneClassMap[tone]}`}
        >
          <Icon size={15} />
        </div>

        <h3 className="text-sm font-black text-slate-950">
          {title}
        </h3>
      </div>

      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={
        wide
          ? "md:col-span-2 xl:col-span-2"
          : ""
      }
    >
      <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-xs font-bold leading-5 text-slate-800">
        {value}
      </div>
    </div>
  );
}