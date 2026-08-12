"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CircleDollarSign,
  Clock3,
  Factory,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { useCustomerProjectDetail } from "@/hooks/customer/useCustomerProjectDetail";

import type {
  CustomerProjectActivity,
  CustomerProjectDetailBomItem,
} from "@/services/customer/projectService";

/* =========================================================
 * Types
 * ======================================================= */

type DetailTab =
  | "all"
  | "production"
  | "quality"
  | "shipment"
  | "settlement";

/* =========================================================
 * Utils
 * ======================================================= */

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(
      `${value}T00:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(date);
}

function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function formatCurrency(
  value: number | null,
) {
  if (
    value === null
  ) {
    return "-";
  }

  return `₩${value.toLocaleString(
    "ko-KR",
  )}`;
}

function getProjectStatusClass(
  status: string | null,
) {
  switch (status) {
    case "production":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "qc":
      return "bg-violet-50 text-violet-700 border-violet-200";

    case "shipment":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "completed":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "hold":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function getTargetLabel(
  targetType: string,
) {
  switch (
    targetType
  ) {
    case "production":
      return "생산";

    case "qc":
    case "quality":
      return "품질";

    case "shipment":
      return "출하";

    case "settlement":
      return "정산";

    case "project":
      return "프로젝트";

    case "document":
      return "문서";

    default:
      return targetType;
  }
}

function getQualityLabel(
  status: string | null,
) {
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
      return "NCR";

    case "hold":
      return "보류";

    default:
      return status ?? "-";
  }
}

function getShipmentLabel(
  status: string | null,
) {
  switch (status) {
    case "ready":
      return "출하대기";

    case "partial_shipped":
    case "shipped":
    case "delivered":
      return "출하준비";

    case "completed":
      return "출하완료";

    default:
      return status ?? "-";
  }
}

function getSettlementLabel(
  status: string | null,
) {
  if (!status) {
    return "-";
  }

  switch (status) {
    case "shipment_completed":
      return "청구 준비";

    case "invoice_sent":
      return "청구 완료";

    case "payment_scheduled":
      return "입금 예정";

    case "paid":
      return "입금 완료";

    case "hold":
      return "보류";

    default:
      return status;
  }
}

function getActivityTitle(
  activity: CustomerProjectActivity,
) {
  if (
    activity.memo
  ) {
    return activity.memo;
  }

  return activity.action;
}

function getOverallProgress(
  items: CustomerProjectDetailBomItem[],
) {
  if (
    items.length === 0
  ) {
    return 0;
  }

  const sum =
    items.reduce(
      (
        total,
        item,
      ) =>
        total +
        Math.max(
          0,
          Math.min(
            100,
            item.production.progress,
          ),
        ),
      0,
    );

  return Math.round(
    sum /
      items.length,
  );
}

/* =========================================================
 * Page
 * ======================================================= */

export default function CustomerProjectDetailPage() {
  const params =
    useParams();

  const projectId =
    typeof params.id ===
    "string"
      ? params.id
      : "";

  const {
    detail,
    loading,
    error,
    refresh,
  } =
    useCustomerProjectDetail(
      projectId,
    );

  const [
    keyword,
    setKeyword,
  ] =
    useState("");

  const [
    tab,
    setTab,
  ] =
    useState<DetailTab>(
      "all",
    );

  const filteredBomItems =
    useMemo(() => {
      if (!detail) {
        return [];
      }

      const normalizedKeyword =
        keyword
          .trim()
          .toLowerCase();

      return detail.bom_items.filter(
        (item) => {
          const keywordMatch =
            !normalizedKeyword ||
            (
              item.part_number ??
              ""
            )
              .toLowerCase()
              .includes(
                normalizedKeyword,
              ) ||
            item.part_name
              .toLowerCase()
              .includes(
                normalizedKeyword,
              ) ||
            (
              item.drawing_no ??
              ""
            )
              .toLowerCase()
              .includes(
                normalizedKeyword,
              );

          if (
            !keywordMatch
          ) {
            return false;
          }

          if (
            tab === "all"
          ) {
            return true;
          }

          if (
            tab ===
            "production"
          ) {
            return (
              !item.quality
                .qc_status &&
              !item.shipment
                .shipment_status
            );
          }

          if (
            tab ===
            "quality"
          ) {
            return Boolean(
              item.quality
                .qc_status,
            );
          }

          if (
            tab ===
            "shipment"
          ) {
            return Boolean(
              item.shipment
                .shipment_status,
            );
          }

          if (
            tab ===
            "settlement"
          ) {
            return Boolean(
              item.settlement
                .status,
            );
          }

          return true;
        },
      );
    }, [
      detail,
      keyword,
      tab,
    ]);

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
              프로젝트
              상세정보를
              불러오는 중입니다.
            </p>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (
    error ||
    !detail
  ) {
    return (
      <WorkspaceLayout role="customer">
        <div className="flex min-h-[520px] items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <AlertTriangle
              size={28}
              className="mx-auto text-red-500"
            />

            <h1 className="mt-3 text-lg font-black text-red-700">
              프로젝트
              상세정보를
              불러오지
              못했습니다.
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ??
                "데이터를 확인할 수 없습니다."}
            </p>

            <div className="mt-5 flex justify-center gap-2">
              <Link
                href="/workspace/customer"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
              >
                목록으로
              </Link>

              <button
                type="button"
                onClick={() =>
                  void refresh()
                }
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-black text-white"
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
    activities,
  } = detail;

  const overallProductionProgress =
    getOverallProgress(
      bom_items,
    );

  const materialInCount =
    bom_items.filter(
      (item) =>
        item.production
          .process_step ===
        "소재입고",
    ).length;

  const materialInspectionCount =
    bom_items.filter(
      (item) =>
        item.production
          .process_step ===
        "소재검수",
    ).length;

  const internalCount =
    bom_items.filter(
      (item) =>
        item.production
          .process_step ===
        "내부공정",
    ).length;

  const externalCount =
    bom_items.filter(
      (item) =>
        item.production
          .process_step ===
        "외부공정",
    ).length;

  const qcRequestedCount =
    bom_items.filter(
      (item) =>
        item.production
          .process_step ===
        "검수요청",
    ).length;

  const shipmentReadyCount =
    bom_items.filter(
      (item) =>
        item.shipment
          .shipment_status ===
        "ready",
    ).length;

  const shipmentDoneCount =
    bom_items.filter(
      (item) =>
        item.shipment
          .shipment_status ===
        "completed",
    ).length;

  const settlementDoneCount =
    bom_items.filter(
      (item) =>
        item.settlement
          .status ===
        "paid",
    ).length;

  return (
    <WorkspaceLayout role="customer">
      <div className="space-y-4">
        {/* =================================================
         * Header
         * =============================================== */}

        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black text-slate-500">
              <Link
                href="/workspace/customer"
                className="hover:text-blue-700"
              >
                프로젝트
              </Link>

              <span>/</span>

              <span>
                {project.project_code ??
                  "-"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-lg font-black text-blue-700">
                {project.project_code ??
                  "-"}
              </span>

              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                {
                  project.project_name
                }
              </h1>

              <span
                className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-black ${getProjectStatusClass(
                  project.status,
                )}`}
              >
                {
                  project.status_label
                }
              </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              생산 · 품질 · 출하 ·
              정산 현황을 BOM 단위로
              모니터링합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/workspace/customer"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
            >
              <ArrowLeft
                size={15}
              />
              프로젝트 목록
            </Link>

            <button
              type="button"
              onClick={() =>
                void refresh()
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
            >
              <RefreshCw
                size={15}
              />
              새로고침
            </button>
          </div>
        </header>

        {/* =================================================
         * Basic Information
         * =============================================== */}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <InfoCard
            label="프로젝트번호"
            value={
              project.project_code ??
              "-"
            }
          />

          <InfoCard
            label="제조사"
            value={
              project.partner_company_name
            }
          />

          <InfoCard
            label="납기일"
            value={formatDate(
              project.due_date,
            )}
          />

          <InfoCard
            label="전체 BOM"
            value={`${summary.total_bom}개`}
          />

          <InfoCard
            label="생산 진행률"
            value={`${overallProductionProgress}%`}
          />
        </section>

        {/* =================================================
         * Manufacturing Status
         * =============================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">
                제조 진행 현황
              </h2>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                Partner 작업상태가
                Customer Monitoring에
                반영됩니다.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-black text-slate-500">
              <Clock3
                size={14}
              />
              최종 업데이트{" "}
              {formatDateTime(
                project.updated_at,
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StageCard
              title="생산"
              icon={
                Factory
              }
              value={`${overallProductionProgress}%`}
              description={`소재입고 ${materialInCount} · 소재검수 ${materialInspectionCount} · 내부 ${internalCount} · 외부 ${externalCount}`}
            />

            <StageCard
              title="품질"
              icon={
                ShieldCheck
              }
              value={`${summary.quality_completion_rate}%`}
              description={`검수요청 ${qcRequestedCount} · 승인 ${summary.quality_passed_count} · 이슈 ${summary.quality_issue_count}`}
            />

            <StageCard
              title="출하"
              icon={
                Truck
              }
              value={`${summary.shipment_completion_rate}%`}
              description={`출하대기 ${shipmentReadyCount} · 완료 ${shipmentDoneCount}`}
            />

            <StageCard
              title="정산"
              icon={
                CircleDollarSign
              }
              value={`${settlementDoneCount}/${summary.total_bom}`}
              description="BOM 기준 정산 완료"
            />
          </div>
        </section>

        {/* =================================================
         * BOM + Recent Updates
         * =============================================== */}

        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  BOM 품목 진행현황
                </h2>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  품목별 생산 · 품질 ·
                  출하 · 정산 상태를
                  확인합니다.
                </p>
              </div>

              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={
                    keyword
                  }
                  onChange={(
                    event,
                  ) =>
                    setKeyword(
                      event.target
                        .value,
                    )
                  }
                  placeholder="품번, 품명, 도면번호 검색"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 sm:w-[320px]"
                />
              </div>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-5">
              <TabButton
                active={
                  tab === "all"
                }
                onClick={() =>
                  setTab("all")
                }
              >
                전체
              </TabButton>

              <TabButton
                active={
                  tab ===
                  "production"
                }
                onClick={() =>
                  setTab(
                    "production",
                  )
                }
              >
                생산
              </TabButton>

              <TabButton
                active={
                  tab ===
                  "quality"
                }
                onClick={() =>
                  setTab(
                    "quality",
                  )
                }
              >
                품질
              </TabButton>

              <TabButton
                active={
                  tab ===
                  "shipment"
                }
                onClick={() =>
                  setTab(
                    "shipment",
                  )
                }
              >
                출하
              </TabButton>

              <TabButton
                active={
                  tab ===
                  "settlement"
                }
                onClick={() =>
                  setTab(
                    "settlement",
                  )
                }
              >
                정산
              </TabButton>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1500px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <TableHeader>
                      품번
                    </TableHeader>

                    <TableHeader>
                      품명
                    </TableHeader>

                    <TableHeader>
                      도면번호
                    </TableHeader>

                    <TableHeader>
                      Rev
                    </TableHeader>

                    <TableHeader>
                      재질
                    </TableHeader>

                    <TableHeader align="right">
                      수량
                    </TableHeader>

                    <TableHeader>
                      현재공정
                    </TableHeader>

                    <TableHeader>
                      생산 진행률
                    </TableHeader>

                    <TableHeader>
                      품질
                    </TableHeader>

                    <TableHeader>
                      출하
                    </TableHeader>

                    <TableHeader>
                      정산
                    </TableHeader>

                    <TableHeader>
                      최근 업데이트
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {filteredBomItems.map(
                    (
                      item,
                    ) => (
                      <BomRow
                        key={
                          item.id
                        }
                        item={
                          item
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {filteredBomItems.length ===
            0 ? (
              <div className="py-12 text-center text-sm font-bold text-slate-400">
                조건에 맞는 BOM
                품목이 없습니다.
              </div>
            ) : null}
          </div>

          {/* ===============================================
           * Recent Updates
           * ============================================= */}

          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-black text-slate-950">
                최근 업데이트
              </h2>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                해당 프로젝트의 최근
                운영 변경
              </p>
            </div>

            {activities.length ===
            0 ? (
              <div className="flex min-h-[320px] items-center justify-center px-5">
                <p className="text-sm font-bold text-slate-400">
                  최근 업데이트가
                  없습니다.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 px-5">
                {activities
                  .slice(
                    0,
                    10,
                  )
                  .map(
                    (
                      activity,
                    ) => (
                      <div
                        key={
                          activity.id
                        }
                        className="py-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-600">
                            {getTargetLabel(
                              activity.target_type,
                            )}
                          </span>

                          <span className="truncate text-xs font-black text-slate-900">
                            {activity.part_number ??
                              "-"}
                            {activity.part_name
                              ? ` / ${activity.part_name}`
                              : ""}
                          </span>
                        </div>

                        {activity.drawing_no ? (
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">
                            도면번호{" "}
                            {
                              activity.drawing_no
                            }
                          </p>
                        ) : null}

                        <p className="mt-2 text-xs font-bold leading-5 text-slate-700">
                          {getActivityTitle(
                            activity,
                          )}
                        </p>

                        <p className="mt-1 text-[10px] font-semibold text-slate-400">
                          {formatDateTime(
                            activity.created_at,
                          )}
                        </p>
                      </div>
                    ),
                  )}
              </div>
            )}
          </aside>
        </section>
      </div>
    </WorkspaceLayout>
  );
}

/* =========================================================
 * Info Card
 * ======================================================= */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black text-slate-400">
        {label}
      </p>

      <p className="mt-2 truncate text-base font-black text-slate-950">
        {value}
      </p>
    </article>
  );
}

/* =========================================================
 * Stage Card
 * ======================================================= */

function StageCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-slate-200">
          <Icon
            size={17}
          />
        </div>

        <span className="text-xl font-black text-slate-950">
          {value}
        </span>
      </div>

      <p className="mt-3 text-sm font-black text-slate-800">
        {title}
      </p>

      <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}

/* =========================================================
 * BOM Row
 * ======================================================= */

function BomRow({
  item,
}: {
  item: CustomerProjectDetailBomItem;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <TableCell>
        <span className="font-black text-slate-900">
          {item.part_number ??
            "-"}
        </span>
      </TableCell>

      <TableCell>
        <span className="font-bold text-slate-800">
          {
            item.part_name
          }
        </span>
      </TableCell>

      <TableCell>
        {item.drawing_no ??
          "-"}
      </TableCell>

      <TableCell>
        {item.revision ??
          "-"}
      </TableCell>

      <TableCell>
        {item.material ??
          "-"}
      </TableCell>

      <TableCell align="right">
        {item.quantity.toLocaleString(
          "ko-KR",
        )}{" "}
        {item.unit ??
          ""}
      </TableCell>

      <TableCell>
        <span className="font-black text-blue-700">
          {item.production
            .process_step ??
            "대기"}
        </span>
      </TableCell>

      <TableCell>
        <div className="w-[120px]">
          <div className="mb-1 flex justify-between text-[11px] font-black">
            <span>
              {
                item.production
                  .progress
              }
              %
            </span>

            {item.production
              .issue_flag ? (
              <span className="text-red-600">
                이슈
              </span>
            ) : null}
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    item.production
                      .progress,
                  ),
                )}%`,
              }}
            />
          </div>
        </div>
      </TableCell>

      <TableCell>
        <span className="font-bold text-violet-700">
          {getQualityLabel(
            item.quality
              .qc_status,
          )}
        </span>
      </TableCell>

      <TableCell>
        <span className="font-bold text-orange-700">
          {getShipmentLabel(
            item.shipment
              .shipment_status,
          )}
        </span>
      </TableCell>

      <TableCell>
        <div>
          <span className="font-bold text-slate-700">
            {getSettlementLabel(
              item.settlement
                .status,
            )}
          </span>

          {item.settlement
            .total_amount >
          0 ? (
            <p className="mt-1 text-[10px] font-semibold text-slate-400">
              {formatCurrency(
                item.settlement
                  .total_amount,
              )}
            </p>
          ) : null}
        </div>
      </TableCell>

      <TableCell>
        <span className="text-xs font-semibold text-slate-500">
          {formatDateTime(
            item.latest_update_at,
          )}
        </span>
      </TableCell>
    </tr>
  );
}

/* =========================================================
 * Tabs
 * ======================================================= */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={[
        "border-b-2 px-4 py-3 text-xs font-black transition",
        active
          ? "border-blue-600 text-blue-700"
          : "border-transparent text-slate-500 hover:text-slate-800",
      ].join(
        " ",
      )}
    >
      {children}
    </button>
  );
}

/* =========================================================
 * Table
 * ======================================================= */

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?:
    | "left"
    | "center"
    | "right";
}) {
  const alignment =
    align === "center"
      ? "text-center"
      : align ===
          "right"
        ? "text-right"
        : "text-left";

  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-xs font-black text-slate-500 ${alignment}`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?:
    | "left"
    | "center"
    | "right";
}) {
  const alignment =
    align === "center"
      ? "text-center"
      : align ===
          "right"
        ? "text-right"
        : "text-left";

  return (
    <td
      className={`whitespace-nowrap px-4 py-3.5 text-sm text-slate-700 ${alignment}`}
    >
      {children}
    </td>
  );
}