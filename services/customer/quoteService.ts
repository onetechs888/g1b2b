import { supabase } from "@/lib/supabase";

export type CustomerQuoteStatus =
  | "submitted"
  | "waiting"
  | "awarded"
  | "rejected";

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

type CustomerContext = {
  companyId: string;
};

async function getCustomerContext(): Promise<CustomerContext> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    throw new Error("사용자 정보를 찾을 수 없습니다.");
  }

  if (profile.role !== "customer") {
    throw new Error("Customer 계정만 조회 가능합니다.");
  }

  return {
    companyId: profile.company_id,
  };
}

export async function getSubmittedQuotes(): Promise<
  CustomerQuoteListItem[]
> {
  const customer = await getCustomerContext();

  /**
   * 1.
   * 현재 고객사의 RFQ 조회
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

  const requestIds = requestRows.map(
    (item) => item.id,
  );

  /**
   * 2.
   * 제출된 견적 조회
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
        (item) => item.partner_company_id,
      ),
    ),
  ];

  const {
    data: companies,
  } = await supabase
    .from("companies")
    .select("id, company_name")
    .in("id", partnerIds);

  const companyMap = new Map();

  companies?.forEach((company) => {
    companyMap.set(
      company.id,
      company.company_name,
    );
  });

  /**
   * 4.
   * 고객사 조회
   */

  const {
    data: customerCompany,
  } = await supabase
    .from("companies")
    .select("company_name")
    .eq("id", customer.companyId)
    .single();

  /**
   * 5.
   * 품목 금액 계산
   */

  const quoteIds = quoteRows.map(
    (item) => item.id,
  );

  const {
    data: quoteItems,
  } = await supabase
    .from("bidding_quote_items")
    .select(`
      quote_id,
      total_price
    `)
    .in("quote_id", quoteIds);

  const amountMap = new Map<
    string,
    number
  >();

  const countMap = new Map<
    string,
    number
  >();

  quoteItems?.forEach((item) => {
    amountMap.set(
      item.quote_id,
      (amountMap.get(item.quote_id) ?? 0) +
        Number(item.total_price ?? 0),
    );

    countMap.set(
      item.quote_id,
      (countMap.get(item.quote_id) ?? 0) +
        1,
    );
  });

  /**
   * 6.
   * Request Map
   */

  const requestMap = new Map();

  requestRows.forEach((item) => {
    requestMap.set(item.id, item);
  });

  /**
   * 7.
   * 반환
   */

  return quoteRows.map((quote) => {
    const request = requestMap.get(
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
        customerCompany?.company_name ??
        "-",

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
  });
}