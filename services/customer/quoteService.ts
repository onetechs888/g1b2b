import { supabase } from "@/lib/supabase";

/* =========================================================
 * 공통 타입
 * ======================================================= */

export type CustomerQuoteStatus =
  | "submitted"
  | "waiting"
  | "awarded"
  | "rejected";

/* =========================================================
 * Customer 입찰현황 목록 타입
 * ======================================================= */

export type CustomerQuoteListItem = {
  id: string;

  bidding_request_id: string;

  project_name: string;

  customer_company_name: string;

  partner_company_id: string;
  partner_company_name: string;

  status: CustomerQuoteStatus;

  bom_count: number;
  total_amount: number;

  submitted_at: string | null;

  due_date: string | null;

  created_at: string;
};


/* =========================================================
 * Customer RFQ 중심 입찰현황 타입
 *
 * 기존 CustomerQuoteListItem / getSubmittedQuotes()는
 * RFQ 상세/기존 화면 호환을 위해 그대로 유지합니다.
 * ======================================================= */

export type CustomerBiddingListStatus =
  | "draft"
  | "waiting"
  | "in_progress"
  | "completed";

export type CustomerBiddingListItem = {
  id: string;

  project_name: string;

  customer_company_name: string;

  request_status: string;

  display_status: CustomerBiddingListStatus;

  bid_deadline: string | null;

  due_date: string | null;

  minimum_partner_tier: string | null;

  selected_partner_company_id: string | null;

  selected_partner_company_name: string | null;

  project_id: string | null;

  bom_count: number;

  participant_count: number;

  submitted_count: number;

  lowest_amount: number | null;

  highest_amount: number | null;

  average_amount: number | null;

  latest_submitted_at: string | null;

  created_at: string;

  updated_at: string;
};

/* =========================================================
 * RFQ 상세 타입
 * ======================================================= */

export type CustomerRfqDetail = {
  id: string;

  customer_company_id: string;

  selected_partner_company_id: string | null;

  project_id: string | null;

  project_name: string;

  status: string;

  bid_deadline: string | null;

  due_date: string | null;

  minimum_partner_tier: string | null;

  description: string | null;

  memo: string | null;

  created_at: string;

  updated_at: string;
};

/* =========================================================
 * 견적 품목 상세 타입
 * ======================================================= */

export type CustomerQuoteItem = {
  id: string;

  quote_id: string;

  bom_item_id: string;

  part_number: string | null;

  part_name: string;

  drawing_no: string | null;

  revision: string | null;

  material: string | null;

  bom_quantity: number;

  quoted_quantity: number;

  unit: string | null;

  unit_price: number;

  total_price: number;

  lead_time_days: number | null;

  proposed_due_date: string | null;

  memo: string | null;
};

/* =========================================================
 * Partner별 견적 타입
 * ======================================================= */

export type CustomerPartnerQuote = {
  id: string;

  bidding_request_id: string;

  partner_company_id: string;

  partner_company_name: string;

  status: CustomerQuoteStatus;

  memo: string | null;

  submitted_at: string | null;

  created_at: string;

  updated_at: string;

  total_amount: number;

  item_count: number;

  average_lead_time_days: number | null;

  max_lead_time_days: number | null;

  proposed_due_date: string | null;

  items: CustomerQuoteItem[];
};

/* =========================================================
 * BOM 기준 업체별 비교 타입
 * ======================================================= */

export type CustomerQuoteComparisonVendor = {
  quote_id: string;

  partner_company_id: string;

  partner_company_name: string;

  quote_status: CustomerQuoteStatus;

  quoted_quantity: number;

  unit: string | null;

  unit_price: number;

  total_price: number;

  lead_time_days: number | null;

  proposed_due_date: string | null;

  memo: string | null;
};

export type CustomerQuoteComparisonItem = {
  bom_item_id: string;

  part_number: string | null;

  part_name: string;

  drawing_no: string | null;

  revision: string | null;

  material: string | null;

  quantity: number;

  unit: string | null;

  vendors: CustomerQuoteComparisonVendor[];

  lowest_unit_price: number | null;

  highest_unit_price: number | null;

  lowest_total_price: number | null;

  highest_total_price: number | null;
};

/* =========================================================
 * RFQ 상세 비교 최종 반환 타입
 * ======================================================= */

export type CustomerQuoteComparison = {
  rfq: CustomerRfqDetail;

  customer_company_name: string;

  selected_partner_company_name: string | null;

  participant_count: number;

  submitted_quote_count: number;

  lowest_total_amount: number | null;

  highest_total_amount: number | null;

  average_total_amount: number | null;

  quotes: CustomerPartnerQuote[];

  comparison_items: CustomerQuoteComparisonItem[];
};

/* =========================================================
 * Customer Context
 * ======================================================= */

type CustomerContext = {
  companyId: string;
};

async function getCustomerContext(): Promise<CustomerContext> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("users")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    throw new Error(
      "사용자 정보를 찾을 수 없습니다.",
    );
  }

  if (profile.role !== "customer") {
    throw new Error(
      "Customer 계정만 조회 가능합니다.",
    );
  }

  if (!profile.company_id) {
    throw new Error(
      "Customer 회사정보를 찾을 수 없습니다.",
    );
  }

  return {
    companyId: profile.company_id,
  };
}

/* =========================================================
 * 1. Customer RFQ 중심 입찰현황
 *
 * 화면 상태 기준:
 *
 * draft
 * → 임시저장
 *
 * 공개 RFQ + Partner 제출견적 0건
 * → 입찰대기
 *
 * Partner 제출견적 1건 이상 + 미선정
 * → 입찰중
 *
 * selected_partner_company_id 존재
 * 또는 request.status = awarded / project_created
 * → 선정완료
 *
 * 중요:
 * - 목록 기준은 bidding_requests 입니다.
 * - 따라서 아직 견적이 없는 신규 RFQ와 임시저장 RFQ도 조회됩니다.
 * - 기존 getSubmittedQuotes()는 삭제/변경하지 않습니다.
 * ======================================================= */

export async function getCustomerBiddingList(): Promise<
  CustomerBiddingListItem[]
> {
  const customer =
    await getCustomerContext();

  /**
   * 1.
   * 현재 Customer 회사의 RFQ 전체 조회
   *
   * draft 포함.
   */

  const {
    data: requestRows,
    error: requestError,
  } = await supabase
    .from("bidding_requests")
    .select(`
      id,
      project_name,
      status,
      bid_deadline,
      due_date,
      minimum_partner_tier,
      selected_partner_company_id,
      project_id,
      created_at,
      updated_at
    `)
    .eq(
      "customer_company_id",
      customer.companyId,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (requestError) {
    throw requestError;
  }

  if (!requestRows?.length) {
    return [];
  }

  const requestIds =
    requestRows.map(
      (request) =>
        request.id,
    );

  /**
   * 2.
   * Customer 회사명 조회
   */

  const {
    data: customerCompany,
    error: customerCompanyError,
  } = await supabase
    .from("companies")
    .select(
      "company_name",
    )
    .eq(
      "id",
      customer.companyId,
    )
    .single();

  if (customerCompanyError) {
    throw customerCompanyError;
  }

  /**
   * 3.
   * RFQ별 BOM 품목 수 조회
   */

  const {
    data: bomRows,
    error: bomError,
  } = await supabase
    .from("bidding_bom_items")
    .select(`
      id,
      bidding_request_id
    `)
    .in(
      "bidding_request_id",
      requestIds,
    );

  if (bomError) {
    throw bomError;
  }

  const bomCountMap =
    new Map<string, number>();

  (
    bomRows ?? []
  ).forEach((bom) => {
    bomCountMap.set(
      bom.bidding_request_id,
      (bomCountMap.get(
        bom.bidding_request_id,
      ) ?? 0) + 1,
    );
  });

  /**
   * 4.
   * RFQ별 Partner 견적 조회
   *
   * Customer 입찰현황에서 실제 진행상태를 판단할
   * 제출/검토/선정 관련 견적만 사용합니다.
   */

  const {
    data: quoteRows,
    error: quoteError,
  } = await supabase
    .from("bidding_quotes")
    .select(`
      id,
      bidding_request_id,
      partner_company_id,
      status,
      submitted_at,
      created_at
    `)
    .in(
      "bidding_request_id",
      requestIds,
    )
    .in("status", [
      "submitted",
      "waiting",
      "awarded",
      "rejected",
    ]);

  if (quoteError) {
    throw quoteError;
  }

  const normalizedQuoteRows =
    quoteRows ?? [];

  /**
   * 5.
   * 견적 품목 금액 조회
   */

  const quoteIds =
    normalizedQuoteRows.map(
      (quote) =>
        quote.id,
    );

  const quoteAmountMap =
    new Map<string, number>();

  if (quoteIds.length > 0) {
    const {
      data: quoteItemRows,
      error: quoteItemError,
    } = await supabase
      .from(
        "bidding_quote_items",
      )
      .select(`
        quote_id,
        total_price
      `)
      .in(
        "quote_id",
        quoteIds,
      );

    if (quoteItemError) {
      throw quoteItemError;
    }

    (
      quoteItemRows ?? []
    ).forEach((item) => {
      quoteAmountMap.set(
        item.quote_id,
        (quoteAmountMap.get(
          item.quote_id,
        ) ?? 0) +
          Number(
            item.total_price ??
              0,
          ),
      );
    });
  }

  /**
   * 6.
   * RFQ별 견적 Group
   */

  const quoteGroupMap =
    new Map<
      string,
      typeof normalizedQuoteRows
    >();

  normalizedQuoteRows.forEach(
    (quote) => {
      const current =
        quoteGroupMap.get(
          quote.bidding_request_id,
        ) ?? [];

      current.push(
        quote,
      );

      quoteGroupMap.set(
        quote.bidding_request_id,
        current,
      );
    },
  );

  /**
   * 7.
   * 선정 Partner 회사명 조회
   */

  const selectedPartnerIds = [
    ...new Set(
      requestRows
        .map(
          (request) =>
            request.selected_partner_company_id,
        )
        .filter(
          (
            value,
          ): value is string =>
            Boolean(value),
        ),
    ),
  ];

  const selectedPartnerNameMap =
    new Map<string, string>();

  if (
    selectedPartnerIds.length > 0
  ) {
    const {
      data: partnerCompanies,
      error: partnerCompanyError,
    } = await supabase
      .from("companies")
      .select(
        "id, company_name",
      )
      .in(
        "id",
        selectedPartnerIds,
      );

    if (partnerCompanyError) {
      throw partnerCompanyError;
    }

    (
      partnerCompanies ?? []
    ).forEach((company) => {
      selectedPartnerNameMap.set(
        company.id,
        company.company_name,
      );
    });
  }

  /**
   * 8.
   * RFQ 중심 최종 목록 반환
   */

  return requestRows.map(
    (request) => {
      const requestQuotes =
        quoteGroupMap.get(
          request.id,
        ) ?? [];

      /**
       * 실제 제출 견적:
       * rejected는 과거 제출 이력일 수 있지만
       * 현재 진행 중인 유효 견적 수에서는 제외합니다.
       */

      const submittedQuotes =
        requestQuotes.filter(
          (quote) =>
            quote.status ===
              "submitted" ||
            quote.status ===
              "waiting" ||
            quote.status ===
              "awarded",
        );

      /**
       * 참여업체 수는 해당 RFQ에 견적을 제출했던
       * Partner 회사 기준으로 중복 제거하여 계산합니다.
       */

      const participantCount =
        new Set(
          requestQuotes.map(
            (quote) =>
              quote.partner_company_id,
          ),
        ).size;

      const amounts =
        submittedQuotes.map(
          (quote) =>
            quoteAmountMap.get(
              quote.id,
            ) ?? 0,
        );

      const latestSubmittedAt =
        submittedQuotes
          .map(
            (quote) =>
              quote.submitted_at,
          )
          .filter(
            (
              value,
            ): value is string =>
              Boolean(value),
          )
          .sort()
          .at(-1) ?? null;

      let displayStatus:
        CustomerBiddingListStatus;

      if (
        request.status ===
        "draft"
      ) {
        displayStatus =
          "draft";
      } else if (
        Boolean(
          request.selected_partner_company_id,
        ) ||
        request.status ===
          "awarded" ||
        request.status ===
          "project_created"
      ) {
        displayStatus =
          "completed";
      } else if (
        submittedQuotes.length >
        0
      ) {
        displayStatus =
          "in_progress";
      } else {
        displayStatus =
          "waiting";
      }

      return {
        id:
          request.id,

        project_name:
          request.project_name,

        customer_company_name:
          customerCompany
            ?.company_name ?? "-",

        request_status:
          request.status,

        display_status:
          displayStatus,

        bid_deadline:
          request.bid_deadline,

        due_date:
          request.due_date,

        minimum_partner_tier:
          request.minimum_partner_tier,

        selected_partner_company_id:
          request.selected_partner_company_id,

        selected_partner_company_name:
          request.selected_partner_company_id
            ? selectedPartnerNameMap.get(
                request.selected_partner_company_id,
              ) ?? null
            : null,

        project_id:
          request.project_id,

        bom_count:
          bomCountMap.get(
            request.id,
          ) ?? 0,

        participant_count:
          participantCount,

        submitted_count:
          submittedQuotes.length,

        lowest_amount:
          amounts.length > 0
            ? Math.min(
                ...amounts,
              )
            : null,

        highest_amount:
          amounts.length > 0
            ? Math.max(
                ...amounts,
              )
            : null,

        average_amount:
          amounts.length > 0
            ? Math.round(
                amounts.reduce(
                  (
                    sum,
                    amount,
                  ) =>
                    sum + amount,
                  0,
                ) /
                  amounts.length,
              )
            : null,

        latest_submitted_at:
          latestSubmittedAt,

        created_at:
          request.created_at,

        updated_at:
          request.updated_at,
      };
    },
  );
}

/* =========================================================
 * 2. Customer 제출 견적 목록
 *
 * 기존 화면 / 상세 비교 호환을 위해 그대로 유지합니다.
 * ======================================================= */

export async function getSubmittedQuotes(): Promise<
  CustomerQuoteListItem[]
> {
  const customer =
    await getCustomerContext();

  /**
   * 1.
   * 현재 Customer 회사 RFQ 조회
   */

  const {
    data: requestRows,
    error: requestError,
  } = await supabase
    .from("bidding_requests")
    .select(`
      id,
      project_name,
      due_date,
      customer_company_id
    `)
    .eq(
      "customer_company_id",
      customer.companyId,
    );

  if (requestError) {
    throw requestError;
  }

  if (!requestRows?.length) {
    return [];
  }

  const requestIds =
    requestRows.map(
      (item) => item.id,
    );

  /**
   * 2.
   * 해당 RFQ 제출 견적 조회
   */

  const {
    data: quoteRows,
    error: quoteError,
  } = await supabase
    .from("bidding_quotes")
    .select(`
      id,
      bidding_request_id,
      partner_company_id,
      status,
      submitted_at,
      created_at
    `)
    .in(
      "bidding_request_id",
      requestIds,
    )
    .in("status", [
      "submitted",
      "waiting",
      "awarded",
      "rejected",
    ]);

  if (quoteError) {
    throw quoteError;
  }

  if (!quoteRows?.length) {
    return [];
  }

  /**
   * 3.
   * Partner 회사 조회
   */

  const partnerIds = [
    ...new Set(
      quoteRows.map(
        (item) =>
          item.partner_company_id,
      ),
    ),
  ];

  const {
    data: companies,
    error: companyError,
  } = await supabase
    .from("companies")
    .select(
      "id, company_name",
    )
    .in("id", partnerIds);

  if (companyError) {
    throw companyError;
  }

  const companyMap =
    new Map<string, string>();

  companies?.forEach(
    (company) => {
      companyMap.set(
        company.id,
        company.company_name,
      );
    },
  );

  /**
   * 4.
   * Customer 회사 조회
   */

  const {
    data: customerCompany,
    error: customerCompanyError,
  } = await supabase
    .from("companies")
    .select("company_name")
    .eq(
      "id",
      customer.companyId,
    )
    .single();

  if (customerCompanyError) {
    throw customerCompanyError;
  }

  /**
   * 5.
   * 견적 품목 조회
   */

  const quoteIds =
    quoteRows.map(
      (item) => item.id,
    );

  const {
    data: quoteItems,
    error: quoteItemError,
  } = await supabase
    .from(
      "bidding_quote_items",
    )
    .select(`
      quote_id,
      total_price
    `)
    .in(
      "quote_id",
      quoteIds,
    );

  if (quoteItemError) {
    throw quoteItemError;
  }

  /**
   * 6.
   * 견적별 총액 / 품목수 계산
   */

  const amountMap =
    new Map<string, number>();

  const countMap =
    new Map<string, number>();

  quoteItems?.forEach(
    (item) => {
      const currentAmount =
        amountMap.get(
          item.quote_id,
        ) ?? 0;

      amountMap.set(
        item.quote_id,
        currentAmount +
          Number(
            item.total_price ??
              0,
          ),
      );

      const currentCount =
        countMap.get(
          item.quote_id,
        ) ?? 0;

      countMap.set(
        item.quote_id,
        currentCount + 1,
      );
    },
  );

  /**
   * 7.
   * RFQ Map
   */

  const requestMap =
    new Map<
      string,
      (typeof requestRows)[number]
    >();

  requestRows.forEach(
    (item) => {
      requestMap.set(
        item.id,
        item,
      );
    },
  );

  /**
   * 8.
   * 최종 반환
   */

  return quoteRows.map(
    (quote) => {
      const request =
        requestMap.get(
          quote.bidding_request_id,
        );

      return {
        id: quote.id,

        bidding_request_id:
          quote.bidding_request_id,

        project_name:
          request?.project_name ??
          "-",

        customer_company_name:
          customerCompany
            ?.company_name ?? "-",

        partner_company_id:
          quote.partner_company_id,

        partner_company_name:
          companyMap.get(
            quote.partner_company_id,
          ) ?? "-",

        status:
          quote.status as CustomerQuoteStatus,

        bom_count:
          countMap.get(
            quote.id,
          ) ?? 0,

        total_amount:
          amountMap.get(
            quote.id,
          ) ?? 0,

        submitted_at:
          quote.submitted_at,

        due_date:
          request?.due_date ??
          null,

        created_at:
          quote.created_at,
      };
    },
  );
}

/* =========================================================
 * 3. Customer RFQ 상세 / 업체별 견적 비교
 * ======================================================= */

export async function getCustomerQuoteComparison(
  biddingRequestId: string,
): Promise<CustomerQuoteComparison> {
  if (!biddingRequestId) {
    throw new Error(
      "RFQ ID가 필요합니다.",
    );
  }

  const customer =
    await getCustomerContext();

  /**
   * 1.
   * RFQ 기본정보 조회
   *
   * 반드시 현재 로그인한 Customer 회사의
   * RFQ만 조회한다.
   */

  const {
    data: request,
    error: requestError,
  } = await supabase
    .from("bidding_requests")
    .select(`
      id,
      customer_company_id,
      selected_partner_company_id,
      project_id,
      project_name,
      status,
      bid_deadline,
      due_date,
      minimum_partner_tier,
      description,
      memo,
      created_at,
      updated_at
    `)
    .eq(
      "id",
      biddingRequestId,
    )
    .eq(
      "customer_company_id",
      customer.companyId,
    )
    .single();

  if (requestError) {
    throw requestError;
  }

  if (!request) {
    throw new Error(
      "입찰요청 정보를 찾을 수 없습니다.",
    );
  }

  /**
   * 2.
   * Customer 회사명 조회
   */

  const {
    data: customerCompany,
    error: customerCompanyError,
  } = await supabase
    .from("companies")
    .select(
      "id, company_name",
    )
    .eq(
      "id",
      customer.companyId,
    )
    .single();

  if (customerCompanyError) {
    throw customerCompanyError;
  }

  /**
   * 3.
   * 해당 RFQ의 제출 견적 전체 조회
   */

  const {
    data: quoteRows,
    error: quoteError,
  } = await supabase
    .from("bidding_quotes")
    .select(`
      id,
      bidding_request_id,
      partner_company_id,
      status,
      memo,
      submitted_at,
      created_at,
      updated_at
    `)
    .eq(
      "bidding_request_id",
      biddingRequestId,
    )
    .in("status", [
      "submitted",
      "waiting",
      "awarded",
      "rejected",
    ])
    .order(
      "submitted_at",
      {
        ascending: true,
      },
    );

  if (quoteError) {
    throw quoteError;
  }

  /**
   * 견적이 아직 없는 경우에도
   * RFQ 상세 자체는 반환한다.
   */

  if (!quoteRows?.length) {
    let selectedPartnerCompanyName:
      | string
      | null = null;

    if (
      request.selected_partner_company_id
    ) {
      const {
        data: selectedCompany,
        error:
          selectedCompanyError,
      } = await supabase
        .from("companies")
        .select(
          "company_name",
        )
        .eq(
          "id",
          request.selected_partner_company_id,
        )
        .single();

      if (
        selectedCompanyError
      ) {
        throw selectedCompanyError;
      }

      selectedPartnerCompanyName =
        selectedCompany
          ?.company_name ??
        null;
    }

    return {
      rfq: {
        id: request.id,

        customer_company_id:
          request.customer_company_id,

        selected_partner_company_id:
          request.selected_partner_company_id,

        project_id:
          request.project_id,

        project_name:
          request.project_name,

        status:
          request.status,

        bid_deadline:
          request.bid_deadline,

        due_date:
          request.due_date,

        minimum_partner_tier:
          request.minimum_partner_tier,

        description:
          request.description,

        memo:
          request.memo,

        created_at:
          request.created_at,

        updated_at:
          request.updated_at,
      },

      customer_company_name:
        customerCompany
          ?.company_name ?? "-",

      selected_partner_company_name:
        selectedPartnerCompanyName,

      participant_count: 0,

      submitted_quote_count: 0,

      lowest_total_amount: null,

      highest_total_amount: null,

      average_total_amount: null,

      quotes: [],

      comparison_items: [],
    };
  }

  /**
   * 4.
   * Partner 회사정보 조회
   */

  const partnerIds = [
    ...new Set(
      quoteRows.map(
        (quote) =>
          quote.partner_company_id,
      ),
    ),
  ];

  const {
    data: partnerCompanies,
    error: partnerCompanyError,
  } = await supabase
    .from("companies")
    .select(
      "id, company_name",
    )
    .in(
      "id",
      partnerIds,
    );

  if (partnerCompanyError) {
    throw partnerCompanyError;
  }

  const partnerCompanyMap =
    new Map<string, string>();

  partnerCompanies?.forEach(
    (company) => {
      partnerCompanyMap.set(
        company.id,
        company.company_name,
      );
    },
  );

  /**
   * 5.
   * 모든 견적 품목 조회
   */

  const quoteIds =
    quoteRows.map(
      (quote) => quote.id,
    );

  const {
    data: quoteItemRows,
    error: quoteItemError,
  } = await supabase
    .from(
      "bidding_quote_items",
    )
    .select(`
      id,
      quote_id,
      bom_item_id,
      quoted_quantity,
      unit,
      unit_price,
      total_price,
      lead_time_days,
      proposed_due_date,
      memo,
      created_at,
      updated_at
    `)
    .in(
      "quote_id",
      quoteIds,
    );

  if (quoteItemError) {
    throw quoteItemError;
  }

  /**
   * 6.
   * 견적 품목이 참조하는 BOM 조회
   */

  const bomItemIds = [
    ...new Set(
      (quoteItemRows ?? []).map(
        (item) =>
          item.bom_item_id,
      ),
    ),
  ];

  const bomItemMap =
    new Map<
      string,
      {
        id: string;
        part_number:
          | string
          | null;
        part_name: string;
        drawing_no:
          | string
          | null;
        revision:
          | string
          | null;
        material:
          | string
          | null;
        quantity: number;
        unit:
          | string
          | null;
      }
    >();

  if (bomItemIds.length > 0) {
    const {
      data: bomRows,
      error: bomError,
    } = await supabase
      .from("bidding_bom_items")
      .select(`
        id,
        part_number,
        part_name,
        drawing_no,
        revision,
        material,
        quantity,
        unit
      `)
      .in(
        "id",
        bomItemIds,
      );

    if (bomError) {
      throw bomError;
    }

    bomRows?.forEach(
      (bom) => {
        bomItemMap.set(
          bom.id,
          {
            id: bom.id,

            part_number:
              bom.part_number,

            part_name:
              bom.part_name,

            drawing_no:
              bom.drawing_no,

            revision:
              bom.revision,

            material:
              bom.material,

            quantity:
              Number(
                bom.quantity ??
                  0,
              ),

            unit:
              bom.unit,
          },
        );
      },
    );
  }

  /**
   * 7.
   * quote_id 기준 품목 Group
   */

  const quoteItemMap =
    new Map<
      string,
      CustomerQuoteItem[]
    >();

  (
    quoteItemRows ?? []
  ).forEach((item) => {
    const bom =
      bomItemMap.get(
        item.bom_item_id,
      );

    const mergedItem:
      CustomerQuoteItem = {
      id: item.id,

      quote_id:
        item.quote_id,

      bom_item_id:
        item.bom_item_id,

      part_number:
        bom?.part_number ??
        null,

      part_name:
        bom?.part_name ??
        "품목정보 없음",

      drawing_no:
        bom?.drawing_no ??
        null,

      revision:
        bom?.revision ??
        null,

      material:
        bom?.material ??
        null,

      bom_quantity:
        bom?.quantity ?? 0,

      quoted_quantity:
        Number(
          item.quoted_quantity ??
            0,
        ),

      unit:
        item.unit ??
        bom?.unit ??
        null,

      unit_price:
        Number(
          item.unit_price ??
            0,
        ),

      total_price:
        Number(
          item.total_price ??
            0,
        ),

      lead_time_days:
        item.lead_time_days,

      proposed_due_date:
        item.proposed_due_date,

      memo:
        item.memo,
    };

    const currentItems =
      quoteItemMap.get(
        item.quote_id,
      ) ?? [];

    currentItems.push(
      mergedItem,
    );

    quoteItemMap.set(
      item.quote_id,
      currentItems,
    );
  });

  /**
   * 8.
   * Partner별 견적 데이터 생성
   */

  const partnerQuotes:
    CustomerPartnerQuote[] =
    quoteRows.map(
      (quote) => {
        const items =
          quoteItemMap.get(
            quote.id,
          ) ?? [];

        const totalAmount =
          items.reduce(
            (sum, item) =>
              sum +
              item.total_price,
            0,
          );

        const leadTimes =
          items
            .map(
              (item) =>
                item.lead_time_days,
            )
            .filter(
              (
                value,
              ): value is number =>
                value !== null,
            );

        const averageLeadTime =
          leadTimes.length > 0
            ? Math.round(
                leadTimes.reduce(
                  (
                    sum,
                    value,
                  ) =>
                    sum + value,
                  0,
                ) /
                  leadTimes.length,
              )
            : null;

        const maxLeadTime =
          leadTimes.length > 0
            ? Math.max(
                ...leadTimes,
              )
            : null;

        const proposedDueDates =
          items
            .map(
              (item) =>
                item.proposed_due_date,
            )
            .filter(
              (
                value,
              ): value is string =>
                Boolean(value),
            )
            .sort();

        /**
         * 품목별 제안납기가 여러 개인 경우
         * 가장 늦은 날짜를 견적 전체 예상납기로 사용.
         */
        const proposedDueDate =
          proposedDueDates.at(
            -1,
          ) ?? null;

        return {
          id: quote.id,

          bidding_request_id:
            quote.bidding_request_id,

          partner_company_id:
            quote.partner_company_id,

          partner_company_name:
            partnerCompanyMap.get(
              quote.partner_company_id,
            ) ?? "-",

          status:
            quote.status as CustomerQuoteStatus,

          memo:
            quote.memo,

          submitted_at:
            quote.submitted_at,

          created_at:
            quote.created_at,

          updated_at:
            quote.updated_at,

          total_amount:
            totalAmount,

          item_count:
            items.length,

          average_lead_time_days:
            averageLeadTime,

          max_lead_time_days:
            maxLeadTime,

          proposed_due_date:
            proposedDueDate,

          items,
        };
      },
    );

  /**
   * 9.
   * BOM 기준 품목별 업체 비교 데이터 생성
   */

  const comparisonMap =
    new Map<
      string,
      CustomerQuoteComparisonItem
    >();

  partnerQuotes.forEach(
    (quote) => {
      quote.items.forEach(
        (item) => {
          const existing =
            comparisonMap.get(
              item.bom_item_id,
            );

          const vendor:
            CustomerQuoteComparisonVendor =
            {
              quote_id:
                quote.id,

              partner_company_id:
                quote.partner_company_id,

              partner_company_name:
                quote.partner_company_name,

              quote_status:
                quote.status,

              quoted_quantity:
                item.quoted_quantity,

              unit:
                item.unit,

              unit_price:
                item.unit_price,

              total_price:
                item.total_price,

              lead_time_days:
                item.lead_time_days,

              proposed_due_date:
                item.proposed_due_date,

              memo:
                item.memo,
            };

          if (!existing) {
            comparisonMap.set(
              item.bom_item_id,
              {
                bom_item_id:
                  item.bom_item_id,

                part_number:
                  item.part_number,

                part_name:
                  item.part_name,

                drawing_no:
                  item.drawing_no,

                revision:
                  item.revision,

                material:
                  item.material,

                quantity:
                  item.bom_quantity,

                unit:
                  item.unit,

                vendors: [
                  vendor,
                ],

                lowest_unit_price:
                  null,

                highest_unit_price:
                  null,

                lowest_total_price:
                  null,

                highest_total_price:
                  null,
              },
            );

            return;
          }

          existing.vendors.push(
            vendor,
          );
        },
      );
    },
  );

  /**
   * 10.
   * 품목별 최저 / 최고 단가 계산
   */

  const comparisonItems =
    Array.from(
      comparisonMap.values(),
    ).map((item) => {
      const unitPrices =
        item.vendors
          .map(
            (vendor) =>
              vendor.unit_price,
          )
          .filter(
            (value) =>
              Number.isFinite(
                value,
              ),
          );

      const totalPrices =
        item.vendors
          .map(
            (vendor) =>
              vendor.total_price,
          )
          .filter(
            (value) =>
              Number.isFinite(
                value,
              ),
          );

      return {
        ...item,

        lowest_unit_price:
          unitPrices.length > 0
            ? Math.min(
                ...unitPrices,
              )
            : null,

        highest_unit_price:
          unitPrices.length > 0
            ? Math.max(
                ...unitPrices,
              )
            : null,

        lowest_total_price:
          totalPrices.length > 0
            ? Math.min(
                ...totalPrices,
              )
            : null,

        highest_total_price:
          totalPrices.length > 0
            ? Math.max(
                ...totalPrices,
              )
            : null,
      };
    });

  /**
   * 11.
   * RFQ 전체 견적 통계
   */

  const totalAmounts =
    partnerQuotes.map(
      (quote) =>
        quote.total_amount,
    );

  const lowestTotalAmount =
    totalAmounts.length > 0
      ? Math.min(
          ...totalAmounts,
        )
      : null;

  const highestTotalAmount =
    totalAmounts.length > 0
      ? Math.max(
          ...totalAmounts,
        )
      : null;

  const averageTotalAmount =
    totalAmounts.length > 0
      ? Math.round(
          totalAmounts.reduce(
            (sum, value) =>
              sum + value,
            0,
          ) /
            totalAmounts.length,
        )
      : null;

  /**
   * 12.
   * 선정 Partner 회사명
   */

  let selectedPartnerCompanyName:
    | string
    | null = null;

  if (
    request.selected_partner_company_id
  ) {
    selectedPartnerCompanyName =
      partnerCompanyMap.get(
        request.selected_partner_company_id,
      ) ?? null;

    /**
     * 현재 견적 목록에 없는 회사라면
     * companies에서 별도 조회.
     */
    if (
      !selectedPartnerCompanyName
    ) {
      const {
        data: selectedCompany,
        error:
          selectedCompanyError,
      } = await supabase
        .from("companies")
        .select(
          "company_name",
        )
        .eq(
          "id",
          request.selected_partner_company_id,
        )
        .single();

      if (
        selectedCompanyError
      ) {
        throw selectedCompanyError;
      }

      selectedPartnerCompanyName =
        selectedCompany
          ?.company_name ??
        null;
    }
  }

  /**
   * 13.
   * 최종 반환
   */

  return {
    rfq: {
      id: request.id,

      customer_company_id:
        request.customer_company_id,

      selected_partner_company_id:
        request.selected_partner_company_id,

      project_id:
        request.project_id,

      project_name:
        request.project_name,

      status:
        request.status,

      bid_deadline:
        request.bid_deadline,

      due_date:
        request.due_date,

      minimum_partner_tier:
        request.minimum_partner_tier,

      description:
        request.description,

      memo:
        request.memo,

      created_at:
        request.created_at,

      updated_at:
        request.updated_at,
    },

    customer_company_name:
      customerCompany
        ?.company_name ?? "-",

    selected_partner_company_name:
      selectedPartnerCompanyName,

    participant_count:
      partnerQuotes.length,

    submitted_quote_count:
      partnerQuotes.filter(
        (quote) =>
          quote.status ===
            "submitted" ||
          quote.status ===
            "waiting" ||
          quote.status ===
            "awarded",
      ).length,

    lowest_total_amount:
      lowestTotalAmount,

    highest_total_amount:
      highestTotalAmount,

    average_total_amount:
      averageTotalAmount,

    quotes:
      partnerQuotes,

    comparison_items:
      comparisonItems,
  };
}

/* =========================================================
 * 4. Customer 업체 선정
 * ======================================================= */

export type SelectBiddingPartnerResult = {
  success: boolean;

  bidding_request_id: string;

  selected_quote_id: string;

  selected_partner_company_id: string;

  bidding_request_status: "awarded";

  selected_quote_status: "awarded";

  rejected_quote_count: number;
};

export async function selectBiddingPartner(
  biddingRequestId: string,
  quoteId: string,
): Promise<SelectBiddingPartnerResult> {
  if (!biddingRequestId) {
    throw new Error(
      "RFQ ID가 필요합니다.",
    );
  }

  if (!quoteId) {
    throw new Error(
      "선정할 견적 ID가 필요합니다.",
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "select_bidding_partner",
    {
      p_bidding_request_id:
        biddingRequestId,

      p_quote_id:
        quoteId,
    },
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "업체 선정 결과를 확인할 수 없습니다.",
    );
  }

  return data as SelectBiddingPartnerResult;
}