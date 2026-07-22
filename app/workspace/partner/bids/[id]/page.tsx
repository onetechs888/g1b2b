"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { usePartnerBidDetail } from "@/hooks/partner/usePartnerBidDetail";
import type { PartnerBiddingBomItem } from "@/services/partner/biddingService";

type DetailTab =
  | "bom"
  | "project"
  | "attachments"
  | "communication"
  | "history";

type SideTab =
  | "drawing"
  | "item"
  | "files";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "-";
  }

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

function formatNumber(
  value: number | null,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  return new Intl.NumberFormat(
    "ko-KR",
  ).format(value);
}

function getStartOfDay(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
}

function getDeadlineInformation(
  value: string | null,
) {
  if (!value) {
    return {
      label: "마감일 미정",
      dDay: "-",
      isClosed: false,
      isUrgent: false,
    };
  }

  const deadline = new Date(value);

  if (
    Number.isNaN(deadline.getTime())
  ) {
    return {
      label: "마감일 미정",
      dDay: "-",
      isClosed: false,
      isUrgent: false,
    };
  }

  const today = getStartOfDay(
    new Date(),
  );

  const target =
    getStartOfDay(deadline);

  const difference = Math.ceil(
    (target.getTime() -
      today.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (difference < 0) {
    return {
      label: "입찰 마감",
      dDay: "마감",
      isClosed: true,
      isUrgent: false,
    };
  }

  if (difference === 0) {
    return {
      label: "오늘 마감",
      dDay: "D-Day",
      isClosed: false,
      isUrgent: true,
    };
  }

  return {
    label:
      difference <= 7
        ? "마감 임박"
        : "입찰 진행중",
    dDay: `D-${difference}`,
    isClosed: false,
    isUrgent: difference <= 7,
  };
}

function getStatusLabel(
  status: string,
) {
  switch (status) {
    case "open":
      return "입찰 진행중";

    case "draft":
      return "임시저장";

    case "closed":
      return "입찰 마감";

    case "awarded":
      return "파트너 선정";

    case "cancelled":
      return "취소";

    default:
      return status;
  }
}

function getTierLabel(
  tier: string | null,
) {
  if (!tier) {
    return "제한 없음";
  }

  const normalized =
    tier.trim().toUpperCase();

  if (
    normalized.startsWith("T") &&
    !normalized.includes("이상")
  ) {
    return `${normalized} 이상`;
  }

  return tier;
}

function getRfqNumber(id: string) {
  const normalized = id
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `RFQ-${normalized}`;
}

function getItemDisplayCode(
  item: PartnerBiddingBomItem,
) {
  return (
    item.drawing_no ||
    item.part_number ||
    "-"
  );
}

export default function PartnerBidDetailPage() {
  const params = useParams();

  const biddingRequestId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const {
    biddingDetail,
    loading,
    error,
    refresh,
  } = usePartnerBidDetail(
    biddingRequestId,
  );

  const [activeTab, setActiveTab] =
    useState<DetailTab>("bom");

  const [
    activeSideTab,
    setActiveSideTab,
  ] = useState<SideTab>("drawing");

  const [
    selectedBomId,
    setSelectedBomId,
  ] = useState<string | null>(null);

  const [
    incompleteOnly,
    setIncompleteOnly,
  ] = useState(false);

  useEffect(() => {
    if (
      !biddingDetail ||
      biddingDetail.bomItems.length === 0
    ) {
      setSelectedBomId(null);
      return;
    }

    const exists =
      biddingDetail.bomItems.some(
        (item) =>
          item.id === selectedBomId,
      );

    if (!exists) {
      setSelectedBomId(
        biddingDetail.bomItems[0].id,
      );
    }
  }, [
    biddingDetail,
    selectedBomId,
  ]);

  const selectedBom = useMemo(() => {
    if (!biddingDetail) {
      return null;
    }

    return (
      biddingDetail.bomItems.find(
        (item) =>
          item.id === selectedBomId,
      ) ??
      biddingDetail.bomItems[0] ??
      null
    );
  }, [
    biddingDetail,
    selectedBomId,
  ]);

  const visibleBomItems =
    useMemo(() => {
      if (!biddingDetail) {
        return [];
      }

      if (!incompleteOnly) {
        return biddingDetail.bomItems;
      }

      return biddingDetail.bomItems.filter(
        (item) =>
          !item.part_number ||
          !item.drawing_no ||
          !item.material,
      );
    }, [
      biddingDetail,
      incompleteOnly,
    ]);

  if (loading) {
    return (
      <WorkspaceLayout role="partner">
        <div className="min-h-full bg-[#f7f9fc] p-6">
          <div className="mx-auto flex min-h-[560px] max-w-[1700px] items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-semibold text-slate-600">
                입찰 상세정보를 불러오는
                중입니다.
              </p>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (error || !biddingDetail) {
    return (
      <WorkspaceLayout role="partner">
        <div className="min-h-full bg-[#f7f9fc] p-6">
          <div className="mx-auto max-w-[1700px] rounded-xl border border-red-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-black text-red-600">
              !
            </div>

            <h1 className="mt-4 text-lg font-extrabold text-slate-900">
              입찰정보를 불러오지
              못했습니다.
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error ??
                "조회할 수 있는 입찰요청이 없습니다."}
            </p>

            <div className="mt-6 flex justify-center gap-2">
              <Link
                href="/workspace/partner/bids"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                입찰목록
              </Link>

              <button
                type="button"
                onClick={() => {
                  void refresh();
                }}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                다시 불러오기
              </button>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  const { request, bomItems } =
    biddingDetail;

  const deadline =
    getDeadlineInformation(
      request.bid_deadline,
    );

  const rfqNumber =
    getRfqNumber(request.id);

  return (
    <WorkspaceLayout role="partner">
      <div className="min-h-full bg-[#f7f9fc]">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-5 lg:px-6">
          <header className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href="/workspace/partner/bids"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-slate-700 transition hover:bg-slate-50"
                  aria-label="입찰목록으로 이동"
                >
                  ‹
                </Link>

                <div>
                  <h1 className="text-[25px] font-black tracking-tight text-slate-950">
                    입찰상세
                  </h1>

                  <p className="mt-0.5 text-sm text-slate-600">
                    선택한 RFQ의 BOM
                    정보와 요청 조건을
                    확인할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/workspace/partner/bids"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                입찰목록
              </Link>

              <Link
                href={`/workspace/partner/quotes?biddingRequestId=${encodeURIComponent(
                  request.id,
                )}`}
                className={`inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-bold text-white transition ${
                  deadline.isClosed
                    ? "pointer-events-none bg-slate-400"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                견적 작성
              </Link>
            </div>
          </header>

          <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_430px]">
            <main className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <section className="border-b border-slate-200 px-5 py-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <strong className="text-xl font-black text-blue-700">
                        {rfqNumber}
                      </strong>

                      <h2 className="truncate text-xl font-black text-slate-950">
                        {request.project_name}
                      </h2>

                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${
                          deadline.isClosed
                            ? "bg-red-50 text-red-700"
                            : deadline.isUrgent
                              ? "bg-amber-50 text-amber-700"
                              : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {deadline.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled
                      title="첨부파일 연동 후 활성화됩니다."
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-400 disabled:cursor-not-allowed"
                    >
                      ↓ RFQ 문서 다운로드
                    </button>

                    <button
                      type="button"
                      disabled
                      title="엑셀 다운로드 연동 후 활성화됩니다."
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-400 disabled:cursor-not-allowed"
                    >
                      ↓ 엑셀 다운로드
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                  <HeaderInfo
                    label="고객사"
                    value={
                      request.customer_company_name
                    }
                  />

                  <HeaderInfo
                    label="참여 가능 Tier"
                    value={getTierLabel(
                      request.minimum_partner_tier,
                    )}
                  />

                  <HeaderInfo
                    label="입찰 마감일"
                    value={formatDate(
                      request.bid_deadline,
                    )}
                    subValue={
                      deadline.dDay
                    }
                    highlight
                  />

                  <HeaderInfo
                    label="납품 요청일"
                    value={formatDate(
                      request.due_date,
                    )}
                  />

                  <HeaderInfo
                    label="BOM 품목"
                    value={`${formatNumber(
                      request.bom_count,
                    )}개`}
                  />

                  <HeaderInfo
                    label="입찰 상태"
                    value={getStatusLabel(
                      request.status,
                    )}
                  />
                </div>
              </section>

              <nav className="flex overflow-x-auto border-b border-slate-200 px-5">
                <DetailTabButton
                  active={
                    activeTab === "bom"
                  }
                  onClick={() =>
                    setActiveTab("bom")
                  }
                >
                  BOM 견적서
                </DetailTabButton>

                <DetailTabButton
                  active={
                    activeTab === "project"
                  }
                  onClick={() =>
                    setActiveTab(
                      "project",
                    )
                  }
                >
                  프로젝트 정보
                </DetailTabButton>

                <DetailTabButton
                  active={
                    activeTab ===
                    "attachments"
                  }
                  onClick={() =>
                    setActiveTab(
                      "attachments",
                    )
                  }
                >
                  첨부문서
                </DetailTabButton>

                <DetailTabButton
                  active={
                    activeTab ===
                    "communication"
                  }
                  onClick={() =>
                    setActiveTab(
                      "communication",
                    )
                  }
                >
                  커뮤니케이션
                </DetailTabButton>

                <DetailTabButton
                  active={
                    activeTab === "history"
                  }
                  onClick={() =>
                    setActiveTab(
                      "history",
                    )
                  }
                >
                  이력
                </DetailTabButton>
              </nav>

              {activeTab === "bom" && (
                <BomContent
                  bomItems={bomItems}
                  visibleBomItems={
                    visibleBomItems
                  }
                  selectedBomId={
                    selectedBom?.id ??
                    null
                  }
                  incompleteOnly={
                    incompleteOnly
                  }
                  onIncompleteOnlyChange={
                    setIncompleteOnly
                  }
                  onSelectBom={
                    setSelectedBomId
                  }
                />
              )}

              {activeTab ===
                "project" && (
                <ProjectContent
                  projectName={
                    request.project_name
                  }
                  customerName={
                    request.customer_company_name
                  }
                  description={
                    request.description
                  }
                  memo={request.memo}
                  createdAt={
                    request.created_at
                  }
                  bidDeadline={
                    request.bid_deadline
                  }
                  dueDate={
                    request.due_date
                  }
                  tier={
                    request.minimum_partner_tier
                  }
                />
              )}

              {activeTab ===
                "attachments" && (
                <EmptyTabContent
                  title="등록된 첨부문서가 없습니다."
                  description="RFQ 파일 업로드 기능이 연결되면 PDF, DWG, STEP 파일이 이 영역에 표시됩니다."
                />
              )}

              {activeTab ===
                "communication" && (
                <EmptyTabContent
                  title="등록된 커뮤니케이션이 없습니다."
                  description="입찰 문의 및 답변 기능 연결 후 대화 이력이 표시됩니다."
                />
              )}

              {activeTab ===
                "history" && (
                <div className="p-5">
                  <div className="rounded-lg border border-slate-200">
                    <div className="flex items-start gap-4 p-5">
                      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-600" />

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          RFQ 등록
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(
                            request.created_at,
                          )}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          고객사가 RFQ와
                          BOM 품목을
                          등록했습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>

            <aside className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {selectedBom ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-black text-slate-950">
                        {selectedBom.part_name}
                      </h2>

                      <p className="mt-1 text-sm font-bold text-blue-700">
                        (
                        {getItemDisplayCode(
                          selectedBom,
                        )}
                        )
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBomId(
                          null,
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-slate-500 transition hover:bg-slate-100"
                      aria-label="선택 해제"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex border-b border-slate-200 px-3">
                    <SideTabButton
                      active={
                        activeSideTab ===
                        "drawing"
                      }
                      onClick={() =>
                        setActiveSideTab(
                          "drawing",
                        )
                      }
                    >
                      도면 미리보기
                    </SideTabButton>

                    <SideTabButton
                      active={
                        activeSideTab ===
                        "item"
                      }
                      onClick={() =>
                        setActiveSideTab(
                          "item",
                        )
                      }
                    >
                      품목 정보
                    </SideTabButton>

                    <SideTabButton
                      active={
                        activeSideTab ===
                        "files"
                      }
                      onClick={() =>
                        setActiveSideTab(
                          "files",
                        )
                      }
                    >
                      첨부파일
                    </SideTabButton>
                  </div>

                  {activeSideTab ===
                    "drawing" && (
                    <DrawingPreview
                      item={selectedBom}
                    />
                  )}

                  {activeSideTab ===
                    "item" && (
                    <ItemInformation
                      item={selectedBom}
                    />
                  )}

                  {activeSideTab ===
                    "files" && (
                    <EmptySideContent
                      title="연결된 파일이 없습니다."
                      description="파일 업로드 기능 연결 후 품목별 PDF, DWG, STEP 파일이 표시됩니다."
                    />
                  )}

                  <div className="border-t border-slate-200 p-4">
                    <h3 className="text-sm font-black text-slate-950">
                      품목 정보
                    </h3>

                    <div className="mt-3 rounded-lg border border-slate-200">
                      <InfoRow
                        label="품명"
                        value={
                          selectedBom.part_name
                        }
                      />

                      <InfoRow
                        label="품번"
                        value={
                          selectedBom.part_number ||
                          "-"
                        }
                      />

                      <InfoRow
                        label="도면번호"
                        value={
                          selectedBom.drawing_no ||
                          "-"
                        }
                      />

                      <InfoRow
                        label="수량"
                        value={`${formatNumber(
                          selectedBom.quantity,
                        )} ${
                          selectedBom.unit ||
                          ""
                        }`}
                      />

                      <InfoRow
                        label="소재"
                        value={
                          selectedBom.material ||
                          "-"
                        }
                      />

                      <InfoRow
                        label="표면처리"
                        value={
                          selectedBom.surface_treatment ||
                          "-"
                        }
                        isLast
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 p-4">
                    <h3 className="text-sm font-black text-slate-950">
                      요청사항
                    </h3>

                    <div className="mt-3 min-h-[90px] rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm leading-6 text-slate-600">
                        {request.memo ||
                          "등록된 고객 요청사항이 없습니다."}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/workspace/partner/bids"
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-white text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                      >
                        입찰목록
                      </Link>

                      <Link
                        href={`/workspace/partner/quotes?biddingRequestId=${encodeURIComponent(
                          request.id,
                        )}`}
                        className={`inline-flex h-10 items-center justify-center rounded-lg text-sm font-bold text-white transition ${
                          deadline.isClosed
                            ? "pointer-events-none bg-slate-400"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        견적 작성
                      </Link>
                    </div>

                    <p className="mt-3 text-center text-xs text-slate-500">
                      견적 금액 입력은 견적
                      작성 화면에서
                      진행합니다.
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[650px] items-center justify-center p-8 text-center">
                  <div>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500">
                      BOM
                    </div>

                    <p className="mt-4 text-sm font-bold text-slate-700">
                      선택된 품목이 없습니다.
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      왼쪽 BOM 목록에서
                      확인할 품목을 선택해
                      주세요.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

type HeaderInfoProps = {
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
};

function HeaderInfo({
  label,
  value,
  subValue,
  highlight = false,
}: HeaderInfoProps) {
  return (
    <div className="min-w-0 border-l border-slate-200 pl-4 first:border-l-0 first:pl-0">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <p className="truncate text-sm font-black text-slate-900">
          {value}
        </p>

        {subValue && (
          <span
            className={`text-xs font-black ${
              highlight
                ? "text-red-600"
                : "text-slate-500"
            }`}
          >
            ({subValue})
          </span>
        )}
      </div>
    </div>
  );
}

type DetailTabButtonProps = {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
};

function DetailTabButton({
  children,
  active,
  onClick,
}: DetailTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-12 shrink-0 px-5 text-sm font-bold transition ${
        active
          ? "text-blue-700"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}

      {active && (
        <span className="absolute inset-x-3 bottom-0 h-0.5 bg-blue-600" />
      )}
    </button>
  );
}

type SideTabButtonProps = {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
};

function SideTabButton({
  children,
  active,
  onClick,
}: SideTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-11 flex-1 whitespace-nowrap px-2 text-xs font-bold transition ${
        active
          ? "text-blue-700"
          : "text-slate-600"
      }`}
    >
      {children}

      {active && (
        <span className="absolute inset-x-2 bottom-0 h-0.5 bg-blue-600" />
      )}
    </button>
  );
}

type BomContentProps = {
  bomItems: PartnerBiddingBomItem[];
  visibleBomItems: PartnerBiddingBomItem[];
  selectedBomId: string | null;
  incompleteOnly: boolean;
  onIncompleteOnlyChange: (
    value: boolean,
  ) => void;
  onSelectBom: (id: string) => void;
};

function BomContent({
  bomItems,
  visibleBomItems,
  selectedBomId,
  incompleteOnly,
  onIncompleteOnlyChange,
  onSelectBom,
}: BomContentProps) {
  return (
    <section>
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-black text-slate-950">
            BOM 목록
          </h3>

          <span className="text-sm font-semibold text-slate-500">
            총{" "}
            {formatNumber(
              bomItems.length,
            )}
            개 품목
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={incompleteOnly}
              onChange={(event) =>
                onIncompleteOnlyChange(
                  event.target.checked,
                )
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />

            정보 미등록 품목만 보기
          </label>

          <button
            type="button"
            disabled
            title="파일 연동 후 활성화됩니다."
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-400 disabled:cursor-not-allowed"
          >
            ↓ 품목 일괄 다운로드
          </button>
        </div>
      </div>

      {visibleBomItems.length === 0 ? (
        <div className="flex min-h-[420px] items-center justify-center p-8 text-center">
          <div>
            <p className="text-sm font-bold text-slate-700">
              표시할 BOM 품목이
              없습니다.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              필터를 해제하거나 RFQ
              BOM 등록 상태를 확인해
              주세요.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <TableHeader align="center">
                  No.
                </TableHeader>

                <TableHeader>
                  품명
                </TableHeader>

                <TableHeader>
                  품번
                </TableHeader>

                <TableHeader>
                  도면번호
                </TableHeader>

                <TableHeader align="center">
                  Rev.
                </TableHeader>

                <TableHeader align="center">
                  수량
                </TableHeader>

                <TableHeader>
                  소재
                </TableHeader>

                <TableHeader>
                  공정
                </TableHeader>

                <TableHeader>
                  표면처리
                </TableHeader>

                <TableHeader>
                  품목 납기
                </TableHeader>

                <TableHeader align="center">
                  상태
                </TableHeader>
              </tr>
            </thead>

            <tbody>
              {visibleBomItems.map(
                (item, index) => {
                  const isSelected =
                    selectedBomId ===
                    item.id;

                  const isComplete =
                    Boolean(
                      item.part_name &&
                        item.quantity,
                    );

                  return (
                    <tr
                      key={item.id}
                      onClick={() =>
                        onSelectBom(
                          item.id,
                        )
                      }
                      className={`cursor-pointer border-b border-slate-100 transition last:border-b-0 ${
                        isSelected
                          ? "bg-blue-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <TableCell align="center">
                        <div className="flex items-center justify-center gap-2">
                          {isSelected && (
                            <span className="h-5 w-0.5 rounded-full bg-blue-600" />
                          )}

                          {index + 1}
                        </div>
                      </TableCell>

                      <TableCell>
                        <p
                          className={`font-bold ${
                            isSelected
                              ? "text-blue-700"
                              : "text-slate-900"
                          }`}
                        >
                          {item.part_name}
                        </p>
                      </TableCell>

                      <TableCell>
                        {item.part_number ||
                          "-"}
                      </TableCell>

                      <TableCell>
                        <span
                          className={
                            item.drawing_no
                              ? "font-bold text-blue-700"
                              : "text-slate-400"
                          }
                        >
                          {item.drawing_no ||
                            "-"}
                        </span>
                      </TableCell>

                      <TableCell align="center">
                        {item.revision ||
                          "-"}
                      </TableCell>

                      <TableCell align="center">
                        <span className="font-bold text-slate-900">
                          {formatNumber(
                            item.quantity,
                          )}{" "}
                          {item.unit || ""}
                        </span>
                      </TableCell>

                      <TableCell>
                        {item.material ||
                          "-"}
                      </TableCell>

                      <TableCell>
                        {item.process_type ||
                          "-"}
                      </TableCell>

                      <TableCell>
                        {item.surface_treatment ||
                          "-"}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          item.due_date,
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${
                            isComplete
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isComplete
                            ? "정보 확인"
                            : "정보 미등록"}
                        </span>
                      </TableCell>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-600">
          총{" "}
          {formatNumber(
            visibleBomItems.length,
          )}
          개 품목 표시
        </p>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span>
            PDF · 파일 연동 예정
          </span>

          <span>
            DWG · 파일 연동 예정
          </span>

          <span>
            STEP · 파일 연동 예정
          </span>
        </div>
      </div>
    </section>
  );
}

type DrawingPreviewProps = {
  item: PartnerBiddingBomItem;
};

function DrawingPreview({
  item,
}: DrawingPreviewProps) {
  return (
    <div className="p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-md bg-red-500 px-3 py-1 text-xs font-black text-white">
          PDF
        </span>

        <span className="rounded-md bg-blue-600 px-3 py-1 text-xs font-black text-white">
          DWG
        </span>

        <span className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-black text-white">
          STEP
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <div className="flex h-9 items-center justify-between bg-slate-950 px-4 text-xs font-semibold text-white">
          <span>1 / 1</span>

          <span>도면 미리보기</span>

          <span>100%</span>
        </div>

        <div className="flex min-h-[320px] items-center justify-center bg-slate-50 p-8">
          <div className="w-full max-w-[340px]">
            <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-lg font-black text-slate-500">
                DWG
              </div>

              <p className="mt-4 text-sm font-bold text-slate-700">
                도면 미리보기 준비
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {item.drawing_no
                  ? `도면번호 ${item.drawing_no}`
                  : "연결된 도면번호가 없습니다."}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Storage 파일 연결 후 실제
                도면이 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ItemInformationProps = {
  item: PartnerBiddingBomItem;
};

function ItemInformation({
  item,
}: ItemInformationProps) {
  return (
    <div className="p-4">
      <div className="rounded-lg border border-slate-200">
        <InfoRow
          label="품명"
          value={item.part_name}
        />

        <InfoRow
          label="품번"
          value={
            item.part_number || "-"
          }
        />

        <InfoRow
          label="도면번호"
          value={
            item.drawing_no || "-"
          }
        />

        <InfoRow
          label="Revision"
          value={
            item.revision || "-"
          }
        />

        <InfoRow
          label="수량"
          value={`${formatNumber(
            item.quantity,
          )} ${item.unit || ""}`}
        />

        <InfoRow
          label="소재"
          value={item.material || "-"}
        />

        <InfoRow
          label="공정"
          value={
            item.process_type || "-"
          }
        />

        <InfoRow
          label="표면처리"
          value={
            item.surface_treatment ||
            "-"
          }
        />

        <InfoRow
          label="요청 납기"
          value={formatDate(
            item.due_date,
          )}
          isLast
        />
      </div>
    </div>
  );
}

type ProjectContentProps = {
  projectName: string;
  customerName: string;
  description: string | null;
  memo: string | null;
  createdAt: string;
  bidDeadline: string | null;
  dueDate: string | null;
  tier: string | null;
};

function ProjectContent({
  projectName,
  customerName,
  description,
  memo,
  createdAt,
  bidDeadline,
  dueDate,
  tier,
}: ProjectContentProps) {
  return (
    <div className="p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-black text-slate-950">
              프로젝트 기본정보
            </h3>
          </div>

          <div className="p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <ProjectInfo
                label="프로젝트명"
                value={projectName}
              />

              <ProjectInfo
                label="고객사"
                value={customerName}
              />

              <ProjectInfo
                label="RFQ 등록일"
                value={formatDateTime(
                  createdAt,
                )}
              />

              <ProjectInfo
                label="최소 참여 Tier"
                value={getTierLabel(
                  tier,
                )}
              />

              <ProjectInfo
                label="입찰 마감일"
                value={formatDateTime(
                  bidDeadline,
                )}
              />

              <ProjectInfo
                label="납품 요청일"
                value={formatDate(
                  dueDate,
                )}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-black text-slate-950">
              요청사항
            </h3>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <p className="text-xs font-bold text-slate-500">
                요청 설명
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {description ||
                  "등록된 요청 설명이 없습니다."}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-500">
                고객 메모
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {memo ||
                  "등록된 고객 메모가 없습니다."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

type ProjectInfoProps = {
  label: string;
  value: string;
};

function ProjectInfo({
  label,
  value,
}: ProjectInfoProps) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

type EmptyTabContentProps = {
  title: string;
  description: string;
};

function EmptyTabContent({
  title,
  description,
}: EmptyTabContentProps) {
  return (
    <div className="flex min-h-[480px] items-center justify-center p-8 text-center">
      <div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500">
          -
        </div>

        <p className="mt-4 text-sm font-bold text-slate-700">
          {title}
        </p>

        <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

type EmptySideContentProps = {
  title: string;
  description: string;
};

function EmptySideContent({
  title,
  description,
}: EmptySideContentProps) {
  return (
    <div className="flex min-h-[340px] items-center justify-center p-8 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-base font-black text-slate-500">
          -
        </div>

        <p className="mt-4 text-sm font-bold text-slate-700">
          {title}
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
  isLast?: boolean;
};

function InfoRow({
  label,
  value,
  isLast = false,
}: InfoRowProps) {
  return (
    <div
      className={`grid grid-cols-[92px_1fr] gap-3 px-4 py-3 ${
        isLast
          ? ""
          : "border-b border-slate-100"
      }`}
    >
      <span className="text-xs font-semibold text-slate-500">
        {label}
      </span>

      <span className="text-sm font-bold text-slate-800">
        {value}
      </span>
    </div>
  );
}

type TableHeaderProps = {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
};

function TableHeader({
  children,
  align = "left",
}: TableHeaderProps) {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <th
      className={`whitespace-nowrap px-3 py-3 text-xs font-black text-slate-600 ${alignClass}`}
    >
      {children}
    </th>
  );
}

type TableCellProps = {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
};

function TableCell({
  children,
  align = "left",
}: TableCellProps) {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <td
      className={`whitespace-nowrap px-3 py-3 text-sm text-slate-700 ${alignClass}`}
    >
      {children}
    </td>
  );
}