import { supabase } from "@/lib/supabase";

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
  reference_unit_price: number | null;
  reference_total_price: number | null;
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
  reference_unit_price: number | null;
  reference_total_price: number | null;
  lead_time: number | null;
  priority_level: number | null;
  due_date: string | null;
};

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
  const companyNameMap = new Map<
    string,
    string
  >();

  const uniqueCompanyIds = Array.from(
    new Set(
      companyIds.filter(
        (companyId) =>
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
 * 파트너 입찰 상세정보를 조회합니다.
 *
 * 조회 순서:
 * 1. bidding_requests
 * 2. companies
 * 3. bidding_bom_items
 * 4. Service에서 결과 병합
 */
export async function getPartnerBiddingDetail(
  biddingRequestId: string,
): Promise<PartnerBiddingDetail> {
  await getPartnerContext();

  const normalizedBiddingRequestId =
    biddingRequestId.trim();

  if (!normalizedBiddingRequestId) {
    throw new Error(
      "입찰요청 ID를 확인할 수 없습니다.",
    );
  }

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
      reference_unit_price,
      reference_total_price,
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

        reference_unit_price:
          bomItem.reference_unit_price,

        reference_total_price:
          bomItem.reference_total_price,

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