import { supabase } from "@/lib/supabase";

import type {
  BiddingForm,
  SourcingBomItem,
} from "@/lib/sourcing/types";

export type BiddingRequestStatus =
  | "draft"
  | "open";

type CustomerContext = {
  userId: string;
  companyId: string;
};

type SaveBiddingRequestParams = {
  form: BiddingForm;
  status: BiddingRequestStatus;
};

type SubmitBiddingRequestParams = {
  form: BiddingForm;
  bomItems: SourcingBomItem[];
};

export type SavedBiddingRequest = {
  id: string;
  project_name: string;
  status: BiddingRequestStatus;
};

type BiddingBomInsertRow = {
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
 * 활성화된 고객 계정인지 확인합니다.
 */
async function getCustomerContext(): Promise<CustomerContext> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
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
    .select(
      "id, company_id, role, status",
    )
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw profileError;
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

  if (userProfile.role !== "customer") {
    throw new Error(
      "고객 계정만 입찰요청을 생성할 수 있습니다.",
    );
  }

  if (
    userProfile.status !== "active" &&
    userProfile.status !== "approved"
  ) {
    throw new Error(
      "활성화된 고객 계정이 아닙니다.",
    );
  }

  return {
    userId: user.id,
    companyId:
      userProfile.company_id,
  };
}

/**
 * 입찰 마감일 문자열을
 * Supabase timestamptz 형식으로 변환합니다.
 */
function toBidDeadline(
  value: string,
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    throw new Error(
      "입찰 마감일 형식이 올바르지 않습니다.",
    );
  }

  return date.toISOString();
}

/**
 * BOM 수량을 검증합니다.
 */
function normalizeQuantity(
  quantity: number,
) {
  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      "BOM 품목의 수량은 0보다 커야 합니다.",
    );
  }

  return quantity;
}

/**
 * 단가를 검증합니다.
 */
function normalizeUnitPrice(
  unitPrice: number | null,
) {
  if (unitPrice === null) {
    return null;
  }

  if (
    !Number.isFinite(unitPrice) ||
    unitPrice < 0
  ) {
    throw new Error(
      "BOM 품목의 참고 단가가 올바르지 않습니다.",
    );
  }

  return unitPrice;
}

/**
 * RFQ 기본정보를 저장합니다.
 */
async function createBiddingRequest({
  form,
  status,
}: SaveBiddingRequestParams): Promise<SavedBiddingRequest> {
  const customerContext =
    await getCustomerContext();

  const {
    data: savedBiddingRequest,
    error: insertError,
  } = await supabase
    .from("bidding_requests")
    .insert({
      customer_company_id:
        customerContext.companyId,

      selected_partner_company_id:
        null,

      project_id: null,

      project_name:
        form.projectName.trim(),

      status,

      bid_deadline:
        toBidDeadline(
          form.bidDeadline,
        ),

      due_date:
        form.dueDate || null,

      minimum_partner_tier:
        form.minimumPartnerTier ||
        null,

      description:
        form.description.trim() ||
        null,

      memo:
        form.memo.trim() ||
        null,

      created_by:
        customerContext.userId,
    })
    .select(
      "id, project_name, status",
    )
    .single();

  if (insertError) {
    throw insertError;
  }

  if (!savedBiddingRequest) {
    throw new Error(
      "입찰요청 저장 결과를 확인할 수 없습니다.",
    );
  }

  return {
    id: savedBiddingRequest.id,
    project_name:
      savedBiddingRequest.project_name,
    status:
      savedBiddingRequest.status as BiddingRequestStatus,
  };
}

/**
 * RFQ에 연결할 BOM INSERT 데이터를 생성합니다.
 */
function createBiddingBomRows(
  biddingRequestId: string,
  bomItems: SourcingBomItem[],
  dueDate: string,
): BiddingBomInsertRow[] {
  return bomItems.map(
    (item, index) => {
      const partName =
        item.partName.trim();

      if (!partName) {
        throw new Error(
          `BOM ${index + 1}행의 품명을 확인해 주세요.`,
        );
      }

      const quantity =
        normalizeQuantity(
          item.quantity,
        );

      const unitPrice =
        normalizeUnitPrice(
          item.unitPrice,
        );

      return {
        bidding_request_id:
          biddingRequestId,

        part_number:
          item.partNo.trim() ||
          null,

        part_name:
          partName,

        /**
         * 현재 프론트 타입의 specification을
         * drawing_no로 임의 변환하지 않습니다.
         */
        drawing_no: null,

        revision: null,

        material:
          item.material.trim() ||
          null,

        surface_treatment: null,

        process_type: null,

        quantity,

        unit: null,

        reference_unit_price:
          unitPrice,

        reference_total_price:
          unitPrice === null
            ? null
            : quantity *
              unitPrice,

        lead_time: null,

        priority_level: null,

        due_date:
          dueDate || null,
      };
    },
  );
}

/**
 * BOM 저장 실패 시 먼저 생성된 RFQ를 정리합니다.
 *
 * 실제 DB 트랜잭션 RPC를 도입하기 전까지 사용하는
 * 보상 삭제 처리입니다.
 */
async function cleanupBiddingRequest(
  biddingRequestId: string,
) {
  const {
    error: cleanupError,
  } = await supabase
    .from("bidding_requests")
    .delete()
    .eq(
      "id",
      biddingRequestId,
    );

  if (cleanupError) {
    console.error(
      "RFQ 보상 삭제 실패:",
      cleanupError,
    );
  }
}

/**
 * 입찰요청을 임시저장합니다.
 *
 * 임시저장 단계에서는
 * bidding_requests 기본정보만 저장합니다.
 */
export async function saveBiddingRequestDraft(
  form: BiddingForm,
) {
  return createBiddingRequest({
    form,
    status: "draft",
  });
}

/**
 * RFQ를 공개 상태로 생성하고
 * BOM 품목을 함께 저장합니다.
 */
export async function submitBiddingRequest({
  form,
  bomItems,
}: SubmitBiddingRequestParams): Promise<SavedBiddingRequest> {
  if (bomItems.length === 0) {
    throw new Error(
      "저장할 BOM 품목이 없습니다.",
    );
  }

  const savedBiddingRequest =
    await createBiddingRequest({
      form,
      status: "open",
    });

  try {
    const biddingBomRows =
      createBiddingBomRows(
        savedBiddingRequest.id,
        bomItems,
        form.dueDate,
      );

    const {
      error: bomInsertError,
    } = await supabase
      .from(
        "bidding_bom_items",
      )
      .insert(
        biddingBomRows,
      );

    if (bomInsertError) {
      throw bomInsertError;
    }

    return savedBiddingRequest;
  } catch (error) {
    await cleanupBiddingRequest(
      savedBiddingRequest.id,
    );

    throw error;
  }
}