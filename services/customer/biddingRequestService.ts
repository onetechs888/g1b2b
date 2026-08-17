import { supabase } from "@/lib/supabase";

import type {
  BiddingForm,
  SourcingBomItem,
} from "@/lib/sourcing/types";

export type BiddingRequestStatus =
  | "draft"
  | "open";

export type EditableBiddingRequestStatus =
  | "draft"
  | "open"
  | "evaluation"
  | "awarded"
  | "cancelled"
  | "project_created";

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

export type UpdateBiddingRequestParams = {
  biddingRequestId: string;
  form: BiddingForm;
  bomItems: SourcingBomItem[];
};

export type SavedBiddingRequest = {
  id: string;
  project_name: string;
  status: BiddingRequestStatus;
};

export type EditableBiddingRequest = {
  id: string;
  status: EditableBiddingRequestStatus;
  selected_partner_company_id: string | null;
  project_id: string | null;
  form: BiddingForm;
  bomItems: SourcingBomItem[];
};

export type UpdateBiddingRequestResult = {
  id: string;
  project_name: string;
  status: EditableBiddingRequestStatus;
  revision_required_quote_count: number;
};

export type DeleteBiddingRequestResult = {
  id: string;
  mode: "deleted" | "cancelled";
  revision_required_quote_count: number;
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
  memo: string | null;
  is_active: boolean;
  removed_at: string | null;
};

async function getCustomerContext(): Promise<CustomerContext> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) {
    throw new Error("로그인 사용자 정보를 확인할 수 없습니다.");
  }

  const {
    data: userProfile,
    error: profileError,
  } = await supabase
    .from("users")
    .select("id, company_id, role, status")
    .eq("id", user.id)
    .single();

  if (profileError) throw profileError;

  if (!userProfile) {
    throw new Error("사용자 프로필을 확인할 수 없습니다.");
  }

  if (!userProfile.company_id) {
    throw new Error("사용자의 소속 회사 정보를 확인할 수 없습니다.");
  }

  if (userProfile.role !== "customer") {
    throw new Error("고객 계정만 입찰요청을 관리할 수 있습니다.");
  }

  if (
    userProfile.status !== "active" &&
    userProfile.status !== "approved"
  ) {
    throw new Error("활성화된 고객 계정이 아닙니다.");
  }

  return {
    userId: user.id,
    companyId: userProfile.company_id,
  };
}

function toBidDeadline(value: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("입찰 마감일 형식이 올바르지 않습니다.");
  }

  return date.toISOString();
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("BOM 품목의 수량은 0보다 커야 합니다.");
  }

  return quantity;
}

function normalizeUnitPrice(unitPrice: number | null) {
  if (unitPrice === null) return null;

  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error("BOM 품목의 참고 단가가 올바르지 않습니다.");
  }

  return unitPrice;
}

async function getOwnedBiddingRequest(
  biddingRequestId: string,
) {
  if (!biddingRequestId) {
    throw new Error("RFQ ID가 필요합니다.");
  }

  const customerContext = await getCustomerContext();

  const {
    data: request,
    error,
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
    .eq("id", biddingRequestId)
    .eq("customer_company_id", customerContext.companyId)
    .single();

  if (error) throw error;

  if (!request) {
    throw new Error("입찰요청 정보를 찾을 수 없습니다.");
  }

  return {
    customerContext,
    request,
  };
}

function assertBiddingRequestEditable(
  request: {
    status: string;
    selected_partner_company_id: string | null;
    project_id: string | null;
  },
) {
  if (
    request.selected_partner_company_id ||
    request.status === "awarded" ||
    request.status === "project_created" ||
    request.project_id
  ) {
    throw new Error(
      "선정 완료된 입찰요청은 수정하거나 삭제할 수 없습니다.",
    );
  }

  if (request.status === "cancelled") {
    throw new Error("취소된 입찰요청은 수정할 수 없습니다.");
  }

  if (
    request.status !== "draft" &&
    request.status !== "open" &&
    request.status !== "evaluation"
  ) {
    throw new Error(
      `수정할 수 없는 RFQ 상태입니다. (${request.status})`,
    );
  }
}

async function createBiddingRequest({
  form,
  status,
}: SaveBiddingRequestParams): Promise<SavedBiddingRequest> {
  const customerContext = await getCustomerContext();

  const {
    data: savedBiddingRequest,
    error: insertError,
  } = await supabase
    .from("bidding_requests")
    .insert({
      customer_company_id: customerContext.companyId,
      selected_partner_company_id: null,
      project_id: null,
      project_name: form.projectName.trim(),
      status,
      bid_deadline: toBidDeadline(form.bidDeadline),
      due_date: form.dueDate || null,
      minimum_partner_tier:
        form.minimumPartnerTier || null,
      description: form.description.trim() || null,
      memo: form.memo.trim() || null,
      created_by: customerContext.userId,
    })
    .select("id, project_name, status")
    .single();

  if (insertError) throw insertError;

  if (!savedBiddingRequest) {
    throw new Error("입찰요청 저장 결과를 확인할 수 없습니다.");
  }

  return {
    id: savedBiddingRequest.id,
    project_name: savedBiddingRequest.project_name,
    status:
      savedBiddingRequest.status as BiddingRequestStatus,
  };
}

function createBiddingBomRows(
  biddingRequestId: string,
  bomItems: SourcingBomItem[],
  dueDate: string,
): BiddingBomInsertRow[] {
  return bomItems.map((item, index) => {
    const partName = item.partName.trim();

    if (!partName) {
      throw new Error(
        `BOM ${index + 1}행의 품명을 확인해 주세요.`,
      );
    }

    const quantity = normalizeQuantity(item.quantity);
    const unitPrice = normalizeUnitPrice(item.unitPrice);

    return {
      bidding_request_id: biddingRequestId,
      part_number: item.partNo.trim() || null,
      part_name: partName,
      drawing_no: null,
      revision: null,
      material: item.material.trim() || null,
      surface_treatment: null,
      process_type: null,
      quantity,
      unit: null,
      reference_unit_price: unitPrice,
      reference_total_price:
        unitPrice === null
          ? null
          : quantity * unitPrice,
      lead_time: null,
      priority_level: null,
      due_date: dueDate || null,
      memo: item.memo.trim() || null,
      is_active: true,
      removed_at: null,
    };
  });
}

async function cleanupBiddingRequest(
  biddingRequestId: string,
) {
  const {
    error: cleanupError,
  } = await supabase
    .from("bidding_requests")
    .delete()
    .eq("id", biddingRequestId);

  if (cleanupError) {
    console.error(
      "RFQ 보상 삭제 실패:",
      cleanupError,
    );
  }
}

async function markQuotesRevisionRequired(
  biddingRequestId: string,
  reason: string,
): Promise<number> {
  const {
    data: quoteRows,
    error: quoteReadError,
  } = await supabase
    .from("bidding_quotes")
    .select("id")
    .eq("bidding_request_id", biddingRequestId)
    .in("status", [
      "submitted",
      "waiting",
    ]);

  if (quoteReadError) throw quoteReadError;

  if (!quoteRows?.length) {
    return 0;
  }

  const quoteIds = quoteRows.map(
    (quote) => quote.id,
  );

  const {
    error: updateError,
  } = await supabase
    .from("bidding_quotes")
    .update({
      revision_required: true,
      revision_reason: reason,
    })
    .in("id", quoteIds);

  if (updateError) throw updateError;

  return quoteIds.length;
}

export async function getBiddingRequestForEdit(
  biddingRequestId: string,
): Promise<EditableBiddingRequest> {
  const {
    request,
  } = await getOwnedBiddingRequest(
    biddingRequestId,
  );

  assertBiddingRequestEditable(request);

  const {
    data: bomRows,
    error: bomError,
  } = await supabase
    .from("bidding_bom_items")
    .select(`
      id,
      part_number,
      part_name,
      material,
      quantity,
      reference_unit_price,
      memo,
      is_active
    `)
    .eq("bidding_request_id", biddingRequestId)
    .eq("is_active", true);

  if (bomError) throw bomError;

  const bomItems: SourcingBomItem[] =
    (bomRows ?? []).map(
      (bom, index) => ({
        tempId: bom.id,
        sourceSheetName: "SAVED",
        sourceRowNumber: index + 1,
        partNo: bom.part_number ?? "",
        partName: bom.part_name,
        quantity: Number(bom.quantity ?? 0),
        material: bom.material ?? "",
        specification: "",
        unitPrice:
          bom.reference_unit_price === null
            ? null
            : Number(
                bom.reference_unit_price,
              ),
        memo: bom.memo ?? "",
        files: [],
      }),
    );

  return {
    id: request.id,
    status:
      request.status as EditableBiddingRequestStatus,
    selected_partner_company_id:
      request.selected_partner_company_id,
    project_id: request.project_id,
    form: {
      projectName: request.project_name,
      bidDeadline:
        toDateTimeLocal(
          request.bid_deadline,
        ),
      dueDate:
        request.due_date ?? "",
      minimumPartnerTier:
        request.minimum_partner_tier ?? "",
      description:
        request.description ?? "",
      memo: request.memo ?? "",
    },
    bomItems,
  };
}

async function syncBiddingBomItems(
  biddingRequestId: string,
  bomItems: SourcingBomItem[],
  dueDate: string,
) {
  const {
    data: existingRows,
    error: existingError,
  } = await supabase
    .from("bidding_bom_items")
    .select("id")
    .eq("bidding_request_id", biddingRequestId)
    .eq("is_active", true);

  if (existingError) throw existingError;

  const existingIds =
    new Set(
      (existingRows ?? []).map(
        (row) => row.id,
      ),
    );

  const retainedExistingIds =
    new Set(
      bomItems
        .map((item) => item.tempId)
        .filter((tempId) =>
          existingIds.has(tempId),
        ),
    );

  const existingItems =
    bomItems.filter((item) =>
      existingIds.has(item.tempId),
    );

  for (
    let index = 0;
    index < existingItems.length;
    index += 1
  ) {
    const item = existingItems[index];
    const partName = item.partName.trim();

    if (!partName) {
      throw new Error(
        `BOM ${index + 1}행의 품명을 확인해 주세요.`,
      );
    }

    const quantity =
      normalizeQuantity(item.quantity);

    const unitPrice =
      normalizeUnitPrice(item.unitPrice);

    const {
      error: updateError,
    } = await supabase
      .from("bidding_bom_items")
      .update({
        part_number:
          item.partNo.trim() || null,
        part_name: partName,
        material:
          item.material.trim() || null,
        quantity,
        reference_unit_price:
          unitPrice,
        reference_total_price:
          unitPrice === null
            ? null
            : quantity * unitPrice,
        due_date:
          dueDate || null,
        memo:
          item.memo.trim() || null,
        is_active: true,
        removed_at: null,
      })
      .eq("id", item.tempId)
      .eq(
        "bidding_request_id",
        biddingRequestId,
      );

    if (updateError) throw updateError;
  }

  const newItems =
    bomItems.filter(
      (item) =>
        !existingIds.has(item.tempId),
    );

  if (newItems.length > 0) {
    const insertRows =
      createBiddingBomRows(
        biddingRequestId,
        newItems,
        dueDate,
      );

    const {
      error: insertError,
    } = await supabase
      .from("bidding_bom_items")
      .insert(insertRows);

    if (insertError) throw insertError;
  }

  const removedIds =
    [...existingIds].filter(
      (id) =>
        !retainedExistingIds.has(id),
    );

  if (removedIds.length > 0) {
    const {
      error: removeError,
    } = await supabase
      .from("bidding_bom_items")
      .update({
        is_active: false,
        removed_at:
          new Date().toISOString(),
      })
      .in("id", removedIds)
      .eq(
        "bidding_request_id",
        biddingRequestId,
      );

    if (removeError) throw removeError;
  }
}

export async function updateBiddingRequest({
  biddingRequestId,
  form,
  bomItems,
}: UpdateBiddingRequestParams): Promise<UpdateBiddingRequestResult> {
  if (!form.projectName.trim()) {
    throw new Error("프로젝트명을 입력해 주세요.");
  }

  const {
    request,
  } = await getOwnedBiddingRequest(
    biddingRequestId,
  );

  assertBiddingRequestEditable(request);

  if (
    request.status !== "draft" &&
    bomItems.length === 0
  ) {
    throw new Error(
      "공개된 RFQ는 BOM 품목이 최소 1개 이상 필요합니다.",
    );
  }

  const {
    data: updatedRequest,
    error: updateError,
  } = await supabase
    .from("bidding_requests")
    .update({
      project_name:
        form.projectName.trim(),
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
    })
    .eq("id", biddingRequestId)
    .select(
      "id, project_name, status",
    )
    .single();

  if (updateError) throw updateError;

  if (!updatedRequest) {
    throw new Error(
      "입찰요청 수정 결과를 확인할 수 없습니다.",
    );
  }

  await syncBiddingBomItems(
    biddingRequestId,
    bomItems,
    form.dueDate,
  );

  let revisionRequiredQuoteCount = 0;

  if (
    request.status === "open" ||
    request.status === "evaluation"
  ) {
    revisionRequiredQuoteCount =
      await markQuotesRevisionRequired(
        biddingRequestId,
        "RFQ 변경",
      );
  }

  return {
    id: updatedRequest.id,
    project_name:
      updatedRequest.project_name,
    status:
      updatedRequest.status as EditableBiddingRequestStatus,
    revision_required_quote_count:
      revisionRequiredQuoteCount,
  };
}

export async function submitExistingBiddingRequest({
  biddingRequestId,
  form,
  bomItems,
}: UpdateBiddingRequestParams): Promise<UpdateBiddingRequestResult> {
  if (!form.projectName.trim()) {
    throw new Error("프로젝트명을 입력해 주세요.");
  }

  if (!form.bidDeadline) {
    throw new Error("입찰 마감일을 선택해 주세요.");
  }

  if (!form.dueDate) {
    throw new Error("희망 납기일을 선택해 주세요.");
  }

  if (bomItems.length === 0) {
    throw new Error(
      "BOM 품목이 최소 1개 이상 필요합니다.",
    );
  }

  const {
    request,
  } = await getOwnedBiddingRequest(
    biddingRequestId,
  );

  assertBiddingRequestEditable(request);

  if (request.status !== "draft") {
    throw new Error(
      "임시저장 상태의 RFQ만 제출 상태로 전환할 수 있습니다.",
    );
  }

  const {
    data: updatedRequest,
    error: updateError,
  } = await supabase
    .from("bidding_requests")
    .update({
      project_name:
        form.projectName.trim(),
      status: "open",
      bid_deadline:
        toBidDeadline(form.bidDeadline),
      due_date:
        form.dueDate || null,
      minimum_partner_tier:
        form.minimumPartnerTier || null,
      description:
        form.description.trim() || null,
      memo:
        form.memo.trim() || null,
    })
    .eq("id", biddingRequestId)
    .select("id, project_name, status")
    .single();

  if (updateError) {
    throw updateError;
  }

  if (!updatedRequest) {
    throw new Error(
      "입찰요청 제출 결과를 확인할 수 없습니다.",
    );
  }

  await syncBiddingBomItems(
    biddingRequestId,
    bomItems,
    form.dueDate,
  );

  return {
    id: updatedRequest.id,
    project_name:
      updatedRequest.project_name,
    status:
      updatedRequest.status as EditableBiddingRequestStatus,
    revision_required_quote_count: 0,
  };
}

export async function deleteBiddingRequest(
  biddingRequestId: string,
): Promise<DeleteBiddingRequestResult> {
  const {
    request,
  } = await getOwnedBiddingRequest(
    biddingRequestId,
  );

  assertBiddingRequestEditable(request);

  if (request.status === "draft") {
    const {
      error: deleteError,
    } = await supabase
      .from("bidding_requests")
      .delete()
      .eq("id", biddingRequestId);

    if (deleteError) throw deleteError;

    return {
      id: biddingRequestId,
      mode: "deleted",
      revision_required_quote_count: 0,
    };
  }

  const {
    error: cancelError,
  } = await supabase
    .from("bidding_requests")
    .update({
      status: "cancelled",
    })
    .eq("id", biddingRequestId);

  if (cancelError) throw cancelError;

  const revisionRequiredQuoteCount =
    await markQuotesRevisionRequired(
      biddingRequestId,
      "RFQ 취소",
    );

  return {
    id: biddingRequestId,
    mode: "cancelled",
    revision_required_quote_count:
      revisionRequiredQuoteCount,
  };
}

export async function saveBiddingRequestDraft(
  form: BiddingForm,
  bomItems: SourcingBomItem[] = [],
): Promise<SavedBiddingRequest> {
  const savedBiddingRequest =
    await createBiddingRequest({
      form,
      status: "draft",
    });

  if (bomItems.length === 0) {
    return savedBiddingRequest;
  }

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
      .from("bidding_bom_items")
      .insert(biddingBomRows);

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
      .from("bidding_bom_items")
      .insert(biddingBomRows);

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