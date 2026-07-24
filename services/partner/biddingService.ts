import { supabase } from "@/lib/supabase";

/**
 * 파트너 견적 상태입니다.
 */
export type PartnerQuoteStatus =
  | "draft"
  | "submitted"
  | "waiting"
  | "awarded"
  | "rejected";

/**
 * 파트너 입찰목록에서 사용하는 RFQ 정보입니다.
 */
export type PartnerOpenBiddingRequest = {
  id: string;
  project_name: string;
  status: string;
  bid_deadline: string | null;
  due_date: string | null;
  minimum_partner_tier: string | null;
  description: string | null;
  memo: string | null;
  customer_company_id: string | null;
  customer_company_name: string;
  created_at: string;
  bom_count: number;
};

/**
 * 파트너 입찰 상세페이지에서 사용하는
 * BOM 품목 정보입니다.
 *
 * 고객 참고단가 및 참고금액은
 * 파트너 화면에 제공하지 않습니다.
 */
export type PartnerBiddingBomItem = {
  id: string;
  bidding_request_id: string;
  part_number: string | null;
  part_name: string;
  drawing_no: string | null;
  revision: string | null;
  material: string | null;
  surface_treatment: string | null;
  process_type: string | null;
  quantity: number;
  unit: string | null;
  lead_time: number | null;
  priority_level: number | null;
  due_date: string | null;
};

/**
 * 파트너 입찰 상세조회 결과입니다.
 */
export type PartnerBiddingDetail = {
  request: PartnerOpenBiddingRequest;
  bomItems: PartnerBiddingBomItem[];
};

/**
 * 파트너 품목별 견적정보입니다.
 */
export type PartnerQuoteItem = {
  id: string;
  quote_id: string;
  bom_item_id: string;
  quoted_quantity: number;
  unit: string | null;
  unit_price: number | null;
  total_price: number | null;
  lead_time_days: number | null;
  proposed_due_date: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * 파트너 견적서 Header 정보입니다.
 */
export type PartnerQuote = {
  id: string;
  bidding_request_id: string;
  partner_company_id: string;
  created_by: string;
  status: PartnerQuoteStatus;
  memo: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  items: PartnerQuoteItem[];
};

/**
 * 파트너 견적목록에서 사용하는 견적 정보입니다.
 *
 * 현재 로그인한 파트너 회사가 작성한
 * 견적 Header, RFQ, 고객사, 견적 품목 집계정보를 제공합니다.
 */
export type PartnerQuoteListItem = {
  id: string;
  bidding_request_id: string;

  project_id: string | null;
  project_name: string;

  customer_company_id: string | null;
  customer_company_name: string;

  status: PartnerQuoteStatus;
  memo: string | null;

  bom_count: number;
  total_amount: number;

  rfq_due_date: string | null;

  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * 견적 임시저장 시 사용하는 품목 입력값입니다.
 */
export type SavePartnerQuoteItemInput = {
  bomItemId: string;
  quotedQuantity: number;
  unit: string | null;
  unitPrice: number | null;
  leadTimeDays: number | null;
  proposedDueDate: string | null;
  memo: string | null;
};

/**
 * 견적 임시저장 입력값입니다.
 */
export type SavePartnerQuoteDraftInput = {
  biddingRequestId: string;
  memo: string | null;
  items: SavePartnerQuoteItemInput[];
};

type PartnerContext = {
  userId: string;
  companyId: string;
};

type BiddingRequestRow = {
  id: string;
  project_name: string;
  status: string;
  bid_deadline: string | null;
  due_date: string | null;
  minimum_partner_tier: string | null;
  description: string | null;
  memo: string | null;
  customer_company_id: string | null;
  created_at: string;
};

/**
 * 파트너 견적목록에서 RFQ 기본정보를 조회할 때 사용하는 Row 타입입니다.
 */
type PartnerQuoteRequestRow = {
  id: string;
  project_id: string | null;
  project_name: string;
  customer_company_id: string | null;
  due_date: string | null;
};

type CompanyRow = {
  id: string;
  company_name: string | null;
};

type BiddingBomCountRow = {
  bidding_request_id: string | null;
};

type BiddingBomDetailRow = {
  id: string;
  bidding_request_id: string;
  part_number: string | null;
  part_name: string;
  drawing_no: string | null;
  revision: string | null;
  material: string | null;
  surface_treatment: string | null;
  process_type: string | null;
  quantity: number;
  unit: string | null;
  lead_time: number | null;
  priority_level: number | null;
  due_date: string | null;
};

type BiddingQuoteRow = {
  id: string;
  bidding_request_id: string;
  partner_company_id: string;
  created_by: string;
  status: PartnerQuoteStatus;
  memo: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

type BiddingQuoteItemRow = {
  id: string;
  quote_id: string;
  bom_item_id: string;
  quoted_quantity: number;
  unit: string | null;
  unit_price: number | null;
  total_price: number | null;
  lead_time_days: number | null;
  proposed_due_date: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * 파트너 견적목록에서
 * 품목 수와 총 견적금액을 계산할 때 사용하는 Row 타입입니다.
 */
type PartnerQuoteListItemRow = {
  quote_id: string;
  total_price: number | null;
};

/**
 * 문자열 ID를 검증하고 정리합니다.
 */
function normalizeId(
  value: string,
  errorMessage: string,
): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(errorMessage);
  }

  return normalizedValue;
}

/**
 * 숫자 입력값을 검증합니다.
 */
function validateQuoteItem(
  item: SavePartnerQuoteItemInput,
): void {
  if (!item.bomItemId.trim()) {
    throw new Error(
      "견적 대상 BOM 품목 ID를 확인할 수 없습니다.",
    );
  }

  if (
    !Number.isFinite(item.quotedQuantity) ||
    item.quotedQuantity <= 0
  ) {
    throw new Error(
      "견적 수량은 0보다 커야 합니다.",
    );
  }

  if (
    item.unitPrice !== null &&
    (!Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0)
  ) {
    throw new Error(
      "견적 단가는 0 이상의 숫자여야 합니다.",
    );
  }

  if (
    item.leadTimeDays !== null &&
    (!Number.isInteger(item.leadTimeDays) ||
      item.leadTimeDays < 0)
  ) {
    throw new Error(
      "제안 소요일은 0 이상의 정수여야 합니다.",
    );
  }
}

/**
 * 현재 로그인한 사용자가
 * 활성화된 파트너 계정인지 확인합니다.
 */
async function getPartnerContext(): Promise<PartnerContext> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error(
      "로그인 사용자 정보를 확인할 수 없습니다.",
    );
  }

  const {
    data: userProfile,
    error: profileError,
  } = await supabase
    .from("users")
    .select("id, company_id, role, status")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!userProfile) {
    throw new Error(
      "사용자 프로필을 확인할 수 없습니다.",
    );
  }

  if (!userProfile.company_id) {
    throw new Error(
      "사용자의 소속 회사 정보를 확인할 수 없습니다.",
    );
  }

  if (userProfile.role !== "partner") {
    throw new Error(
      "파트너 계정만 입찰정보를 조회할 수 있습니다.",
    );
  }

  if (
    userProfile.status !== "active" &&
    userProfile.status !== "approved"
  ) {
    throw new Error(
      "활성화된 파트너 계정이 아닙니다.",
    );
  }

  return {
    userId: user.id,
    companyId: userProfile.company_id,
  };
}

/**
 * 고객사 ID 목록을 기준으로
 * 고객사 이름을 조회합니다.
 *
 * Supabase 관계형 JOIN을 사용하지 않고
 * companies 테이블을 별도로 조회합니다.
 */
async function getCompanyNameMap(
  companyIds: string[],
): Promise<Map<string, string>> {
  const companyNameMap = new Map<string, string>();

  const uniqueCompanyIds = Array.from(
    new Set(
      companyIds.filter((companyId) =>
        Boolean(companyId),
      ),
    ),
  );

  if (uniqueCompanyIds.length === 0) {
    return companyNameMap;
  }

  const {
    data: companyData,
    error: companyError,
  } = await supabase
    .from("companies")
    .select("id, company_name")
    .in("id", uniqueCompanyIds);

  if (companyError) {
    throw new Error(companyError.message);
  }

  const companies =
    (companyData ?? []) as CompanyRow[];

  companies.forEach((company) => {
    companyNameMap.set(
      company.id,
      company.company_name?.trim() ||
        "고객사 미확인",
    );
  });

  return companyNameMap;
}

/**
 * 해당 RFQ가 현재 견적 가능한 공개 상태인지 확인합니다.
 */
async function ensureOpenBiddingRequest(
  biddingRequestId: string,
): Promise<void> {
  const {
    data,
    error,
  } = await supabase
    .from("bidding_requests")
    .select("id, status")
    .eq("id", biddingRequestId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "입찰요청 정보를 찾을 수 없습니다.",
    );
  }

  if (data.status !== "open") {
    throw new Error(
      "현재 견적을 작성할 수 없는 입찰요청입니다.",
    );
  }
}

/**
 * 견적서의 BOM 품목이
 * 해당 RFQ에 속하는지 확인합니다.
 */
async function validateQuoteBomItems(
  biddingRequestId: string,
  items: SavePartnerQuoteItemInput[],
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const bomItemIds = Array.from(
    new Set(
      items.map((item) =>
        item.bomItemId.trim(),
      ),
    ),
  );

  const {
    data,
    error,
  } = await supabase
    .from("bidding_bom_items")
    .select("id")
    .eq(
      "bidding_request_id",
      biddingRequestId,
    )
    .in("id", bomItemIds);

  if (error) {
    throw new Error(error.message);
  }

  const validIds = new Set(
    (data ?? []).map((row) => row.id),
  );

  const invalidItemId = bomItemIds.find(
    (bomItemId) => !validIds.has(bomItemId),
  );

  if (invalidItemId) {
    throw new Error(
      "입찰요청에 포함되지 않은 BOM 품목이 있습니다.",
    );
  }
}

/**
 * 공개 상태의 파트너 입찰목록을 조회합니다.
 */
export async function getOpenBiddingRequests(): Promise<
  PartnerOpenBiddingRequest[]
> {
  await getPartnerContext();

  const {
    data: biddingRequestData,
    error: biddingRequestError,
  } = await supabase
    .from("bidding_requests")
    .select(`
      id,
      project_name,
      status,
      bid_deadline,
      due_date,
      minimum_partner_tier,
      description,
      memo,
      customer_company_id,
      created_at
    `)
    .eq("status", "open")
    .order("created_at", {
      ascending: false,
    });

  if (biddingRequestError) {
    throw new Error(
      biddingRequestError.message,
    );
  }

  const biddingRequests =
    (biddingRequestData ??
      []) as BiddingRequestRow[];

  if (biddingRequests.length === 0) {
    return [];
  }

  const biddingRequestIds =
    biddingRequests.map(
      (biddingRequest) =>
        biddingRequest.id,
    );

  const customerCompanyIds =
    biddingRequests
      .map(
        (biddingRequest) =>
          biddingRequest.customer_company_id,
      )
      .filter(
        (
          companyId,
        ): companyId is string =>
          Boolean(companyId),
      );

  const companyNameMap =
    await getCompanyNameMap(
      customerCompanyIds,
    );

  const {
    data: bomItemData,
    error: bomItemError,
  } = await supabase
    .from("bidding_bom_items")
    .select("bidding_request_id")
    .in(
      "bidding_request_id",
      biddingRequestIds,
    );

  if (bomItemError) {
    throw new Error(
      bomItemError.message,
    );
  }

  const bomItems =
    (bomItemData ??
      []) as BiddingBomCountRow[];

  const bomCountMap = new Map<
    string,
    number
  >();

  bomItems.forEach((bomItem) => {
    if (!bomItem.bidding_request_id) {
      return;
    }

    const currentCount =
      bomCountMap.get(
        bomItem.bidding_request_id,
      ) ?? 0;

    bomCountMap.set(
      bomItem.bidding_request_id,
      currentCount + 1,
    );
  });

  return biddingRequests.map(
    (biddingRequest) => ({
      id: biddingRequest.id,
      project_name:
        biddingRequest.project_name,
      status:
        biddingRequest.status,
      bid_deadline:
        biddingRequest.bid_deadline,
      due_date:
        biddingRequest.due_date,
      minimum_partner_tier:
        biddingRequest.minimum_partner_tier,
      description:
        biddingRequest.description,
      memo:
        biddingRequest.memo,
      customer_company_id:
        biddingRequest.customer_company_id,
      customer_company_name:
        biddingRequest.customer_company_id
          ? companyNameMap.get(
              biddingRequest.customer_company_id,
            ) ?? "고객사 미확인"
          : "고객사 미확인",
      created_at:
        biddingRequest.created_at,
      bom_count:
        bomCountMap.get(
          biddingRequest.id,
        ) ?? 0,
    }),
  );
}

/**
 * 현재 로그인한 파트너 회사가 작성한
 * 전체 견적목록을 조회합니다.
 *
 * 조회 순서:
 * 1. 현재 파트너 회사 확인
 * 2. bidding_quotes 조회
 * 3. bidding_requests 조회
 * 4. companies에서 고객사명 조회
 * 5. bidding_quote_items에서 품목 수와 총액 집계
 */
export async function getPartnerQuoteList(): Promise<
  PartnerQuoteListItem[]
> {
  const partnerContext =
    await getPartnerContext();

  /**
   * 1. 현재 파트너 회사가 작성한 견적 Header 조회
   */
  const {
    data: quoteData,
    error: quoteError,
  } = await supabase
    .from("bidding_quotes")
    .select(`
      id,
      bidding_request_id,
      partner_company_id,
      created_by,
      status,
      memo,
      submitted_at,
      created_at,
      updated_at
    `)
    .eq(
      "partner_company_id",
      partnerContext.companyId,
    )
    .in("status", [
      "submitted",
      "waiting",
      "awarded",
      "rejected",
    ])
    .order("updated_at", {
      ascending: false,
    });

  if (quoteError) {
    throw new Error(
      quoteError.message,
    );
  }

  const quotes =
    (quoteData ??
      []) as BiddingQuoteRow[];

  if (quotes.length === 0) {
    return [];
  }

  /**
   * 중복 조회를 방지하기 위해
   * RFQ ID와 견적 ID를 각각 정리합니다.
   */
  const biddingRequestIds =
    Array.from(
      new Set(
        quotes.map(
          (quote) =>
            quote.bidding_request_id,
        ),
      ),
    );

  const quoteIds =
    quotes.map(
      (quote) => quote.id,
    );

  /**
   * 2. 견적과 연결된 RFQ 정보 조회
   */
  const {
    data: biddingRequestData,
    error: biddingRequestError,
  } = await supabase
    .from("bidding_requests")
    .select(`
      id,
      project_id,
      project_name,
      customer_company_id,
      due_date
    `)
    .in(
      "id",
      biddingRequestIds,
    );

  if (biddingRequestError) {
    throw new Error(
      biddingRequestError.message,
    );
  }

  const biddingRequests =
    (biddingRequestData ??
      []) as PartnerQuoteRequestRow[];

  const biddingRequestMap =
    new Map<
      string,
      PartnerQuoteRequestRow
    >();

  biddingRequests.forEach(
    (biddingRequest) => {
      biddingRequestMap.set(
        biddingRequest.id,
        biddingRequest,
      );
    },
  );

  /**
   * 3. 고객사 이름 조회
   */
  const customerCompanyIds =
    biddingRequests
      .map(
        (biddingRequest) =>
          biddingRequest.customer_company_id,
      )
      .filter(
        (
          companyId,
        ): companyId is string =>
          Boolean(companyId),
      );

  const companyNameMap =
    await getCompanyNameMap(
      customerCompanyIds,
    );

  /**
   * 4. 견적 품목 조회
   *
   * 목록에서는 품목 상세가 아니라
   * 품목 수와 총 견적금액만 계산합니다.
   */
  const {
    data: quoteItemData,
    error: quoteItemError,
  } = await supabase
    .from("bidding_quote_items")
    .select(`
      quote_id,
      total_price
    `)
    .in(
      "quote_id",
      quoteIds,
    );

  if (quoteItemError) {
    throw new Error(
      quoteItemError.message,
    );
  }

  const quoteItems =
    (quoteItemData ??
      []) as PartnerQuoteListItemRow[];

  /**
   * 견적별 BOM 품목 수
   */
  const bomCountMap =
    new Map<string, number>();

  /**
   * 견적별 총 견적금액
   */
  const totalAmountMap =
    new Map<string, number>();

  quoteItems.forEach(
    (quoteItem) => {
      const currentBomCount =
        bomCountMap.get(
          quoteItem.quote_id,
        ) ?? 0;

      bomCountMap.set(
        quoteItem.quote_id,
        currentBomCount + 1,
      );

      const currentTotalAmount =
        totalAmountMap.get(
          quoteItem.quote_id,
        ) ?? 0;

      const itemTotalPrice =
        quoteItem.total_price === null
          ? 0
          : Number(
              quoteItem.total_price,
            );

      totalAmountMap.set(
        quoteItem.quote_id,
        currentTotalAmount +
          itemTotalPrice,
      );
    },
  );

  /**
   * 5. 페이지에서 바로 사용할 수 있는 형태로 변환
   */
  return quotes.map((quote) => {
    const biddingRequest =
      biddingRequestMap.get(
        quote.bidding_request_id,
      );

    const customerCompanyId =
      biddingRequest
        ?.customer_company_id ??
      null;

    return {
      id: quote.id,

      bidding_request_id:
        quote.bidding_request_id,

      project_id:
        biddingRequest?.project_id ??
        null,

      project_name:
        biddingRequest
          ?.project_name ??
        "프로젝트명 미확인",

      customer_company_id:
        customerCompanyId,

      customer_company_name:
        customerCompanyId
          ? companyNameMap.get(
              customerCompanyId,
            ) ??
            "고객사 미확인"
          : "고객사 미확인",

      status:
        quote.status,

      memo:
        quote.memo,

      bom_count:
        bomCountMap.get(
          quote.id,
        ) ?? 0,

      total_amount:
        totalAmountMap.get(
          quote.id,
        ) ?? 0,

      rfq_due_date:
        biddingRequest
          ?.due_date ??
        null,

      submitted_at:
        quote.submitted_at,

      created_at:
        quote.created_at,

      updated_at:
        quote.updated_at,
    };
  });
}

/**
 * 파트너 입찰 상세정보를 조회합니다.
 *
 * 고객 참고단가 및 참고금액은
 * 조회하지 않습니다.
 */
export async function getPartnerBiddingDetail(
  biddingRequestId: string,
): Promise<PartnerBiddingDetail> {
  await getPartnerContext();

  const normalizedBiddingRequestId =
    normalizeId(
      biddingRequestId,
      "입찰요청 ID를 확인할 수 없습니다.",
    );

  const {
    data: biddingRequestData,
    error: biddingRequestError,
  } = await supabase
    .from("bidding_requests")
    .select(`
      id,
      project_name,
      status,
      bid_deadline,
      due_date,
      minimum_partner_tier,
      description,
      memo,
      customer_company_id,
      created_at
    `)
    .eq(
      "id",
      normalizedBiddingRequestId,
    )
    .eq("status", "open")
    .maybeSingle();

  if (biddingRequestError) {
    throw new Error(
      biddingRequestError.message,
    );
  }

  if (!biddingRequestData) {
    throw new Error(
      "조회할 수 있는 입찰요청을 찾지 못했습니다.",
    );
  }

  const biddingRequest =
    biddingRequestData as BiddingRequestRow;

  let customerCompanyName =
    "고객사 미확인";

  if (
    biddingRequest.customer_company_id
  ) {
    const companyNameMap =
      await getCompanyNameMap([
        biddingRequest.customer_company_id,
      ]);

    customerCompanyName =
      companyNameMap.get(
        biddingRequest.customer_company_id,
      ) ?? "고객사 미확인";
  }

  const {
    data: bomItemData,
    error: bomItemError,
  } = await supabase
    .from("bidding_bom_items")
    .select(`
      id,
      bidding_request_id,
      part_number,
      part_name,
      drawing_no,
      revision,
      material,
      surface_treatment,
      process_type,
      quantity,
      unit,
      lead_time,
      priority_level,
      due_date
    `)
    .eq(
      "bidding_request_id",
      normalizedBiddingRequestId,
    )
    .order("part_name", {
      ascending: true,
    });

  if (bomItemError) {
    throw new Error(
      bomItemError.message,
    );
  }

  const bomItems =
    (bomItemData ??
      []) as BiddingBomDetailRow[];

  return {
    request: {
      id: biddingRequest.id,
      project_name:
        biddingRequest.project_name,
      status:
        biddingRequest.status,
      bid_deadline:
        biddingRequest.bid_deadline,
      due_date:
        biddingRequest.due_date,
      minimum_partner_tier:
        biddingRequest.minimum_partner_tier,
      description:
        biddingRequest.description,
      memo:
        biddingRequest.memo,
      customer_company_id:
        biddingRequest.customer_company_id,
      customer_company_name:
        customerCompanyName,
      created_at:
        biddingRequest.created_at,
      bom_count:
        bomItems.length,
    },

    bomItems: bomItems.map(
      (bomItem) => ({
        id: bomItem.id,
        bidding_request_id:
          bomItem.bidding_request_id,
        part_number:
          bomItem.part_number,
        part_name:
          bomItem.part_name,
        drawing_no:
          bomItem.drawing_no,
        revision:
          bomItem.revision,
        material:
          bomItem.material,
        surface_treatment:
          bomItem.surface_treatment,
        process_type:
          bomItem.process_type,
        quantity:
          bomItem.quantity,
        unit:
          bomItem.unit,
        lead_time:
          bomItem.lead_time,
        priority_level:
          bomItem.priority_level,
        due_date:
          bomItem.due_date,
      }),
    ),
  };
}

/**
 * 현재 파트너 회사가 작성한 견적서를 조회합니다.
 *
 * 아직 견적서가 없으면 null을 반환합니다.
 */
export async function getPartnerQuote(
  biddingRequestId: string,
): Promise<PartnerQuote | null> {
  const partnerContext =
    await getPartnerContext();

  const normalizedBiddingRequestId =
    normalizeId(
      biddingRequestId,
      "입찰요청 ID를 확인할 수 없습니다.",
    );

  const {
    data: quoteData,
    error: quoteError,
  } = await supabase
    .from("bidding_quotes")
    .select(`
      id,
      bidding_request_id,
      partner_company_id,
      created_by,
      status,
      memo,
      submitted_at,
      created_at,
      updated_at
    `)
    .eq(
      "bidding_request_id",
      normalizedBiddingRequestId,
    )
    .eq(
      "partner_company_id",
      partnerContext.companyId,
    )
    .maybeSingle();

  if (quoteError) {
    throw new Error(quoteError.message);
  }

  if (!quoteData) {
    return null;
  }

  const quote =
    quoteData as BiddingQuoteRow;

  const {
    data: quoteItemData,
    error: quoteItemError,
  } = await supabase
    .from("bidding_quote_items")
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
    .eq("quote_id", quote.id)
    .order("created_at", {
      ascending: true,
    });

  if (quoteItemError) {
    throw new Error(
      quoteItemError.message,
    );
  }

  const quoteItems =
    (quoteItemData ??
      []) as BiddingQuoteItemRow[];

  return {
    id: quote.id,
    bidding_request_id:
      quote.bidding_request_id,
    partner_company_id:
      quote.partner_company_id,
    created_by:
      quote.created_by,
    status:
      quote.status,
    memo:
      quote.memo,
    submitted_at:
      quote.submitted_at,
    created_at:
      quote.created_at,
    updated_at:
      quote.updated_at,
    items: quoteItems.map(
      (item) => ({
        id: item.id,
        quote_id:
          item.quote_id,
        bom_item_id:
          item.bom_item_id,
        quoted_quantity:
          Number(item.quoted_quantity),
        unit:
          item.unit,
        unit_price:
          item.unit_price === null
            ? null
            : Number(item.unit_price),
        total_price:
          item.total_price === null
            ? null
            : Number(item.total_price),
        lead_time_days:
          item.lead_time_days,
        proposed_due_date:
          item.proposed_due_date,
        memo:
          item.memo,
        created_at:
          item.created_at,
        updated_at:
          item.updated_at,
      }),
    ),
  };
}

/**
 * 해당 RFQ에 대한 파트너 견적서를 조회하거나
 * 존재하지 않으면 draft 상태로 생성합니다.
 */
export async function getOrCreatePartnerQuote(
  biddingRequestId: string,
): Promise<PartnerQuote> {
  const partnerContext =
    await getPartnerContext();

  const normalizedBiddingRequestId =
    normalizeId(
      biddingRequestId,
      "입찰요청 ID를 확인할 수 없습니다.",
    );

  const existingQuote =
    await getPartnerQuote(
      normalizedBiddingRequestId,
    );

  if (existingQuote) {
    return existingQuote;
  }

  await ensureOpenBiddingRequest(
    normalizedBiddingRequestId,
  );

  const {
    error: insertError,
  } = await supabase
    .from("bidding_quotes")
    .insert({
      bidding_request_id:
        normalizedBiddingRequestId,
      partner_company_id:
        partnerContext.companyId,
      created_by:
        partnerContext.userId,
      status: "draft",
      memo: null,
      submitted_at: null,
    });

  if (
    insertError &&
    insertError.code !== "23505"
  ) {
    throw new Error(insertError.message);
  }

  const createdQuote =
    await getPartnerQuote(
      normalizedBiddingRequestId,
    );

  if (!createdQuote) {
    throw new Error(
      "견적서를 생성하지 못했습니다.",
    );
  }

  return createdQuote;
}

/**
 * 견적서 전체 메모와 품목별 견적을
 * draft 상태로 임시저장합니다.
 */
export async function savePartnerQuoteDraft(
  input: SavePartnerQuoteDraftInput,
): Promise<PartnerQuote> {
  await getPartnerContext();

  const normalizedBiddingRequestId =
    normalizeId(
      input.biddingRequestId,
      "입찰요청 ID를 확인할 수 없습니다.",
    );

  input.items.forEach(
    validateQuoteItem,
  );

  await validateQuoteBomItems(
    normalizedBiddingRequestId,
    input.items,
  );

  const quote =
    await getOrCreatePartnerQuote(
      normalizedBiddingRequestId,
    );

  if (quote.status !== "draft") {
    throw new Error(
      "이미 제출된 견적서는 수정할 수 없습니다.",
    );
  }

  const normalizedMemo =
    input.memo?.trim() || null;

  const {
    error: quoteUpdateError,
  } = await supabase
    .from("bidding_quotes")
    .update({
      memo: normalizedMemo,
    })
    .eq("id", quote.id)
    .eq("status", "draft");

  if (quoteUpdateError) {
    throw new Error(
      quoteUpdateError.message,
    );
  }

  if (input.items.length > 0) {
    const quoteItemPayload =
      input.items.map((item) => ({
        quote_id: quote.id,
        bom_item_id:
          item.bomItemId.trim(),
        quoted_quantity:
          item.quotedQuantity,
        unit:
          item.unit?.trim() || null,
        unit_price:
          item.unitPrice,
        lead_time_days:
          item.leadTimeDays,
        proposed_due_date:
          item.proposedDueDate || null,
        memo:
          item.memo?.trim() || null,
      }));

    const {
      error: quoteItemsError,
    } = await supabase
      .from("bidding_quote_items")
      .upsert(
        quoteItemPayload,
        {
          onConflict:
            "quote_id,bom_item_id",
        },
      );

    if (quoteItemsError) {
      throw new Error(
        quoteItemsError.message,
      );
    }
  }

  const savedQuote =
    await getPartnerQuote(
      normalizedBiddingRequestId,
    );

  if (!savedQuote) {
    throw new Error(
      "저장된 견적서를 다시 불러오지 못했습니다.",
    );
  }

  return savedQuote;
}

/**
 * 견적서 전체 메모만 저장합니다.
 */
export async function savePartnerQuoteMemo(
  biddingRequestId: string,
  memo: string | null,
): Promise<PartnerQuote> {
  const quote =
    await getOrCreatePartnerQuote(
      biddingRequestId,
    );

  if (quote.status !== "draft") {
    throw new Error(
      "이미 제출된 견적서는 수정할 수 없습니다.",
    );
  }

  const {
    error,
  } = await supabase
    .from("bidding_quotes")
    .update({
      memo: memo?.trim() || null,
    })
    .eq("id", quote.id)
    .eq("status", "draft");

  if (error) {
    throw new Error(error.message);
  }

  const updatedQuote =
    await getPartnerQuote(
      biddingRequestId,
    );

  if (!updatedQuote) {
    throw new Error(
      "저장된 견적서를 다시 불러오지 못했습니다.",
    );
  }

  return updatedQuote;
}

/**
 * 품목 한 건의 견적정보를 저장합니다.
 */
export async function savePartnerQuoteItem(
  biddingRequestId: string,
  item: SavePartnerQuoteItemInput,
): Promise<PartnerQuote> {
  validateQuoteItem(item);

  const normalizedBiddingRequestId =
    normalizeId(
      biddingRequestId,
      "입찰요청 ID를 확인할 수 없습니다.",
    );

  await validateQuoteBomItems(
    normalizedBiddingRequestId,
    [item],
  );

  const quote =
    await getOrCreatePartnerQuote(
      normalizedBiddingRequestId,
    );

  if (quote.status !== "draft") {
    throw new Error(
      "이미 제출된 견적서는 수정할 수 없습니다.",
    );
  }

  const {
    error,
  } = await supabase
    .from("bidding_quote_items")
    .upsert(
      {
        quote_id: quote.id,
        bom_item_id:
          item.bomItemId.trim(),
        quoted_quantity:
          item.quotedQuantity,
        unit:
          item.unit?.trim() || null,
        unit_price:
          item.unitPrice,
        lead_time_days:
          item.leadTimeDays,
        proposed_due_date:
          item.proposedDueDate || null,
        memo:
          item.memo?.trim() || null,
      },
      {
        onConflict:
          "quote_id,bom_item_id",
      },
    );

  if (error) {
    throw new Error(error.message);
  }

  const updatedQuote =
    await getPartnerQuote(
      normalizedBiddingRequestId,
    );

  if (!updatedQuote) {
    throw new Error(
      "저장된 견적서를 다시 불러오지 못했습니다.",
    );
  }

  return updatedQuote;
}

/**
 * 견적서를 고객에게 제출합니다.
 *
 * 제출 조건:
 * - 견적서가 draft 상태여야 함
 * - RFQ의 모든 BOM 품목에 대한 견적이 있어야 함
 * - 모든 품목에 단가가 입력되어 있어야 함
 */
export async function submitPartnerQuote(
  biddingRequestId: string,
): Promise<PartnerQuote> {
  const normalizedBiddingRequestId =
    normalizeId(
      biddingRequestId,
      "입찰요청 ID를 확인할 수 없습니다.",
    );

  await ensureOpenBiddingRequest(
    normalizedBiddingRequestId,
  );

  const quote =
    await getPartnerQuote(
      normalizedBiddingRequestId,
    );

  if (!quote) {
    throw new Error(
      "제출할 견적서가 없습니다. 먼저 견적을 임시저장해 주세요.",
    );
  }

  if (quote.status !== "draft") {
    throw new Error(
      "이미 제출되었거나 처리 중인 견적서입니다.",
    );
  }

  const {
    data: bomItemData,
    error: bomItemError,
  } = await supabase
    .from("bidding_bom_items")
    .select("id, part_name")
    .eq(
      "bidding_request_id",
      normalizedBiddingRequestId,
    );

  if (bomItemError) {
    throw new Error(
      bomItemError.message,
    );
  }

  const bomItems =
    bomItemData ?? [];

  if (bomItems.length === 0) {
    throw new Error(
      "견적 대상 BOM 품목이 없습니다.",
    );
  }

  const quoteItemMap = new Map(
    quote.items.map((item) => [
      item.bom_item_id,
      item,
    ]),
  );

  const missingItems =
    bomItems.filter((bomItem) => {
      const quoteItem =
        quoteItemMap.get(bomItem.id);

      return (
        !quoteItem ||
        quoteItem.unit_price === null
      );
    });

  if (missingItems.length > 0) {
    const missingNames =
      missingItems
        .slice(0, 5)
        .map(
          (item) =>
            item.part_name ||
            "품목명 미확인",
        )
        .join(", ");

    const remainingCount =
      missingItems.length - 5;

    const remainingText =
      remainingCount > 0
        ? ` 외 ${remainingCount}개`
        : "";

    throw new Error(
      `단가가 입력되지 않은 품목이 있습니다: ${missingNames}${remainingText}`,
    );
  }

  const submittedAt =
    new Date().toISOString();

  const {
    error: submitError,
  } = await supabase
    .from("bidding_quotes")
    .update({
      status: "submitted",
      submitted_at: submittedAt,
    })
    .eq("id", quote.id)
    .eq("status", "draft");

  if (submitError) {
    throw new Error(
      submitError.message,
    );
  }

  const submittedQuote =
    await getPartnerQuote(
      normalizedBiddingRequestId,
    );

  if (!submittedQuote) {
    throw new Error(
      "제출된 견적서를 다시 불러오지 못했습니다.",
    );
  }

  if (
    submittedQuote.status !== "submitted"
  ) {
    throw new Error(
      "견적서 제출 상태가 정상적으로 반영되지 않았습니다.",
    );
  }

  return submittedQuote;
}