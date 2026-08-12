import { supabase } from "@/lib/supabase";

/* =========================================================
 * Types
 * ======================================================= */

export type CustomerProjectStatus =
  | "draft"
  | "rfq"
  | "ordered"
  | "production"
  | "qc"
  | "shipment"
  | "completed"
  | "hold"
  | "cancelled";

export type CustomerProjectStageLabel =
  | "등록"
  | "RFQ"
  | "발주"
  | "생산"
  | "품질"
  | "출하"
  | "완료"
  | "보류"
  | "취소"
  | "-";

export type CustomerProjectSummary = {
  total_bom: number;
  production_progress: number;
  production_completed: number;
  production_issue_count: number;
  quality_target_count: number;
  quality_passed_count: number;
  quality_in_progress_count: number;
  quality_issue_count: number;
  quality_completion_rate: number;
  shipment_waiting_count: number;
  shipment_preparing_count: number;
  shipment_completed_count: number;
  shipment_completion_rate: number;
};

export type CustomerProjectListItem = {
  id: string;
  project_code: string | null;
  project_name: string;
  status: CustomerProjectStatus | string | null;
  status_label: CustomerProjectStageLabel;
  customer_company_id: string | null;
  partner_company_id: string | null;
  partner_company_name: string;
  due_date: string | null;
  industry: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  summary: CustomerProjectSummary;
  overall_progress: number;
  current_stage: CustomerProjectStageLabel;
  is_due_risk: boolean;
  d_day: number | null;
};

export type CustomerProjectActivity = {
  id: string;
  project_id: string | null;
  bom_item_id: string | null;
  target_type: string;
  target_id: string | null;
  action: string;
  memo: string | null;
  before_value: unknown;
  after_value: unknown;
  created_at: string;
  part_number: string | null;
  part_name: string | null;
  drawing_no: string | null;
};

export type CustomerProjectDashboard = {
  projects: CustomerProjectListItem[];
  activities: CustomerProjectActivity[];
  kpi: {
    total_active_projects: number;
    production_count: number;
    quality_count: number;
    shipment_count: number;
    due_risk_count: number;
  };
};

export type CustomerProjectDetailProject = {
  id: string;
  project_code: string | null;
  project_name: string;
  customer_company_id: string | null;
  partner_company_id: string | null;
  partner_company_name: string;
  status: string | null;
  status_label: CustomerProjectStageLabel;
  industry: string | null;
  due_date: string | null;
  description: string | null;
  project_origin: string | null;
  bidding_request_id: string | null;
  order_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CustomerProjectDetailBomItem = {
  id: string;
  project_id: string | null;
  part_number: string | null;
  part_name: string;
  drawing_no: string | null;
  revision: string | null;
  material: string | null;
  surface_treatment: string | null;
  quantity: number;
  unit: string | null;
  process_type: string | null;
  bom_status: string | null;
  due_date: string | null;
  unit_price: number | null;
  total_price: number | null;

  production: {
    progress: number;
    status: string | null;
    process_step: string | null;
    issue_flag: boolean;
    memo: string | null;
    updated_at: string | null;
  };

  quality: {
    id: string | null;
    qc_status: string | null;
    inspection_date: string | null;
    priority: boolean;
    memo: string | null;
    updated_at: string | null;
  };

  shipment: {
    id: string | null;
    shipment_status: string | null;
    shipment_date: string | null;
    shipped_quantity: number | null;
    updated_at: string | null;
  };

  settlement: {
    id: string | null;
    status: string | null;
    amount: number;
    vat: number;
    total_amount: number;
    invoice_no: string | null;
    invoice_date: string | null;
    payment_due_date: string | null;
    payment_date: string | null;
    memo: string | null;
    updated_at: string | null;
  };

  latest_update_at: string | null;
};

export type CustomerProjectDetail = {
  project: CustomerProjectDetailProject;
  summary: CustomerProjectSummary;
  bom_items: CustomerProjectDetailBomItem[];
  activities: CustomerProjectActivity[];
};

/* =========================================================
 * Internal Types
 * ======================================================= */

type CustomerContext = {
  userId: string;
  companyId: string;
};

type ProjectRow = {
  id: string;
  project_code: string | null;
  project_name: string;
  customer_company_id: string | null;
  partner_company_id: string | null;
  status: string | null;
  industry: string | null;
  due_date: string | null;
  description: string | null;
  project_origin?: string | null;
  bidding_request_id?: string | null;
  order_id?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CompanyRow = {
  id: string;
  company_name: string;
};

type ProjectSummaryRpcResponse = {
  project?: {
    id?: string;
  };
  summary?: Partial<CustomerProjectSummary>;
};

type ActivityRow = {
  id: string;
  project_id: string | null;
  bom_item_id: string | null;
  target_type: string;
  target_id: string | null;
  action: string;
  memo: string | null;
  before_value: unknown;
  after_value: unknown;
  created_at: string;
};

type ActivityBomRow = {
  id: string;
  part_number: string | null;
  part_name: string;
  drawing_no: string | null;
};

type BomDetailRow = {
  id: string;
  project_id: string | null;
  part_number: string | null;
  part_name: string;
  drawing_no: string | null;
  revision: string | null;
  material: string | null;
  surface_treatment: string | null;
  quantity: number;
  unit: string | null;
  process_type: string | null;
  status: string | null;
  due_date: string | null;
  unit_price: number | null;
  total_price: number | null;
  updated_at: string | null;
};

type ProductionRow = {
  bom_item_id: string | null;
  progress: number | null;
  status: string | null;
  process_step: string | null;
  issue_flag: boolean | null;
  memo: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type QualityRow = {
  id: string;
  bom_item_id: string | null;
  qc_status: string | null;
  inspection_date: string | null;
  priority: boolean | null;
  memo: string | null;
  updated_at: string | null;
};

type ShipmentRow = {
  id: string;
  bom_item_id: string | null;
  shipment_status: string | null;
  shipment_date: string | null;
  shipped_quantity: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type SettlementRow = {
  id: string;
  bom_item_id: string;
  status: string | null;
  amount: number | null;
  vat: number | null;
  total_amount: number | null;
  invoice_no: string | null;
  invoice_date: string | null;
  payment_due_date: string | null;
  payment_date: string | null;
  memo: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/* =========================================================
 * Utils
 * ======================================================= */

export function getCustomerProjectStatusLabel(
  status: string | null,
): CustomerProjectStageLabel {
  switch (status) {
    case "draft":
      return "등록";
    case "rfq":
      return "RFQ";
    case "ordered":
      return "발주";
    case "production":
      return "생산";
    case "qc":
      return "품질";
    case "shipment":
      return "출하";
    case "completed":
      return "완료";
    case "hold":
      return "보류";
    case "cancelled":
      return "취소";
    default:
      return "-";
  }
}

function createEmptyProjectSummary(): CustomerProjectSummary {
  return {
    total_bom: 0,
    production_progress: 0,
    production_completed: 0,
    production_issue_count: 0,
    quality_target_count: 0,
    quality_passed_count: 0,
    quality_in_progress_count: 0,
    quality_issue_count: 0,
    quality_completion_rate: 0,
    shipment_waiting_count: 0,
    shipment_preparing_count: 0,
    shipment_completed_count: 0,
    shipment_completion_rate: 0,
  };
}

function normalizeProjectSummary(
  value: ProjectSummaryRpcResponse | null,
): CustomerProjectSummary {
  const summary = value?.summary ?? {};

  return {
    total_bom: Number(summary.total_bom ?? 0) || 0,
    production_progress: Number(summary.production_progress ?? 0) || 0,
    production_completed: Number(summary.production_completed ?? 0) || 0,
    production_issue_count: Number(summary.production_issue_count ?? 0) || 0,
    quality_target_count: Number(summary.quality_target_count ?? 0) || 0,
    quality_passed_count: Number(summary.quality_passed_count ?? 0) || 0,
    quality_in_progress_count:
      Number(summary.quality_in_progress_count ?? 0) || 0,
    quality_issue_count: Number(summary.quality_issue_count ?? 0) || 0,
    quality_completion_rate: Number(summary.quality_completion_rate ?? 0) || 0,
    shipment_waiting_count: Number(summary.shipment_waiting_count ?? 0) || 0,
    shipment_preparing_count:
      Number(summary.shipment_preparing_count ?? 0) || 0,
    shipment_completed_count:
      Number(summary.shipment_completed_count ?? 0) || 0,
    shipment_completion_rate:
      Number(summary.shipment_completion_rate ?? 0) || 0,
  };
}

function calculateOverallProgress(
  status: string | null,
  summary: CustomerProjectSummary,
): number {
  if (status === "completed") return 100;

  if (status === "shipment") {
    return Math.max(
      80,
      Math.min(
        99,
        80 + Math.round(summary.shipment_completion_rate * 0.19),
      ),
    );
  }

  if (status === "qc") {
    return Math.max(
      60,
      Math.min(
        79,
        60 + Math.round(summary.quality_completion_rate * 0.19),
      ),
    );
  }

  if (status === "production") {
    return Math.max(
      1,
      Math.min(
        59,
        Math.round(summary.production_progress * 0.59),
      ),
    );
  }

  if (status === "ordered") return 10;
  if (status === "rfq") return 5;
  if (status === "draft") return 0;

  if (status === "hold") {
    return Math.max(
      0,
      Math.min(
        99,
        Math.round(summary.production_progress),
      ),
    );
  }

  return 0;
}

function calculateDDay(dueDate: string | null): number | null {
  if (!dueDate) return null;

  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const diff = due.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getLatestTimestamp(
  values: Array<string | null | undefined>,
): string | null {
  const valid = values
    .filter((value): value is string => Boolean(value))
    .map((value) => ({
      value,
      time: new Date(value).getTime(),
    }))
    .filter((item) => Number.isFinite(item.time))
    .sort((a, b) => b.time - a.time);

  return valid[0]?.value ?? null;
}

function getInitialProgress(process: string | null): number {
  switch (process) {
    case "소재입고":
      return 20;
    case "소재검수":
      return 35;
    case "내부공정":
      return 60;
    case "외부공정":
      return 80;
    case "검수요청":
      return 100;
    case "대기":
    default:
      return 0;
  }
}

/* =========================================================
 * Customer Context
 * ======================================================= */

async function getCustomerContext(): Promise<CustomerContext> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("로그인이 필요합니다.");

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("users")
    .select("id, company_id, role, status")
    .eq("id", user.id)
    .single();

  if (profileError) throw profileError;
  if (!profile) throw new Error("사용자 정보를 찾을 수 없습니다.");

  if (profile.role !== "customer") {
    throw new Error("Customer 계정만 조회할 수 있습니다.");
  }

  if (!profile.company_id) {
    throw new Error("Customer 회사 정보를 찾을 수 없습니다.");
  }

  return {
    userId: user.id,
    companyId: profile.company_id,
  };
}

/* =========================================================
 * Shared Loaders
 * ======================================================= */

async function getProjectSummary(
  projectId: string,
): Promise<CustomerProjectSummary> {
  const { data, error } = await supabase.rpc(
    "get_customer_project_summary",
    {
      p_project_id: projectId,
    },
  );

  if (error) {
    console.error(
      "Customer Project Summary 조회 실패:",
      projectId,
      error,
    );

    return createEmptyProjectSummary();
  }

  return normalizeProjectSummary(
    data as ProjectSummaryRpcResponse | null,
  );
}

async function getActivityRowsWithBom(
  projectIds: string[],
  limit = 30,
): Promise<CustomerProjectActivity[]> {
  if (projectIds.length === 0) return [];

  const {
    data: activityData,
    error: activityError,
  } = await supabase
    .from("activity_logs")
    .select(`
      id,
      project_id,
      bom_item_id,
      target_type,
      target_id,
      action,
      memo,
      before_value,
      after_value,
      created_at
    `)
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (activityError) throw activityError;

  const activityRows = (activityData ?? []) as ActivityRow[];

  const activityBomIds = Array.from(
    new Set(
      activityRows
        .map((activity) => activity.bom_item_id)
        .filter((bomItemId): bomItemId is string => Boolean(bomItemId)),
    ),
  );

  const bomMap = new Map<string, ActivityBomRow>();

  if (activityBomIds.length > 0) {
    const {
      data: bomData,
      error: bomError,
    } = await supabase
      .from("bom_items")
      .select(`
        id,
        part_number,
        part_name,
        drawing_no
      `)
      .in("id", activityBomIds);

    if (bomError) throw bomError;

    ((bomData ?? []) as ActivityBomRow[]).forEach((bomItem) => {
      bomMap.set(bomItem.id, bomItem);
    });
  }

  return activityRows.map((activity) => {
    const bom = activity.bom_item_id
      ? bomMap.get(activity.bom_item_id)
      : null;

    return {
      id: activity.id,
      project_id: activity.project_id,
      bom_item_id: activity.bom_item_id,
      target_type: activity.target_type,
      target_id: activity.target_id,
      action: activity.action,
      memo: activity.memo,
      before_value: activity.before_value,
      after_value: activity.after_value,
      created_at: activity.created_at,
      part_number: bom?.part_number ?? null,
      part_name: bom?.part_name ?? null,
      drawing_no: bom?.drawing_no ?? null,
    };
  });
}

/* =========================================================
 * Dashboard
 * ======================================================= */

export async function getCustomerProjectDashboard(): Promise<CustomerProjectDashboard> {
  const customer = await getCustomerContext();

  const {
    data: projectData,
    error: projectError,
  } = await supabase
    .from("projects")
    .select(`
      id,
      project_code,
      project_name,
      customer_company_id,
      partner_company_id,
      status,
      industry,
      due_date,
      description,
      created_at,
      updated_at
    `)
    .eq("customer_company_id", customer.companyId)
    .neq("status", "completed")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (projectError) throw projectError;

  const projects = (projectData ?? []) as ProjectRow[];

  const partnerIds = Array.from(
    new Set(
      projects
        .map((project) => project.partner_company_id)
        .filter((companyId): companyId is string => Boolean(companyId)),
    ),
  );

  const partnerMap = new Map<string, string>();

  if (partnerIds.length > 0) {
    const {
      data: companyData,
      error: companyError,
    } = await supabase
      .from("companies")
      .select("id, company_name")
      .in("id", partnerIds);

    if (companyError) throw companyError;

    ((companyData ?? []) as CompanyRow[]).forEach((company) => {
      partnerMap.set(company.id, company.company_name);
    });
  }

  const projectItems = await Promise.all(
    projects.map(
      async (project): Promise<CustomerProjectListItem> => {
        const summary = await getProjectSummary(project.id);
        const dDay = calculateDDay(project.due_date);

        const isDueRisk =
          dDay !== null &&
          dDay <= 7 &&
          dDay >= 0 &&
          project.status !== "completed";

        return {
          id: project.id,
          project_code: project.project_code,
          project_name: project.project_name,
          status: project.status,
          status_label: getCustomerProjectStatusLabel(project.status),
          customer_company_id: project.customer_company_id,
          partner_company_id: project.partner_company_id,
          partner_company_name: project.partner_company_id
            ? partnerMap.get(project.partner_company_id) ??
              "제조사 미확인"
            : "제조사 미지정",
          due_date: project.due_date,
          industry: project.industry,
          description: project.description,
          created_at: project.created_at,
          updated_at: project.updated_at,
          summary,
          overall_progress: calculateOverallProgress(
            project.status,
            summary,
          ),
          current_stage: getCustomerProjectStatusLabel(project.status),
          is_due_risk: isDueRisk,
          d_day: dDay,
        };
      },
    ),
  );

  const projectIds = projectItems.map((project) => project.id);

  const activities = await getActivityRowsWithBom(
    projectIds,
    30,
  );

  const kpi = {
    total_active_projects: projectItems.length,
    production_count: projectItems.filter(
      (project) => project.status === "production",
    ).length,
    quality_count: projectItems.filter(
      (project) => project.status === "qc",
    ).length,
    shipment_count: projectItems.filter(
      (project) => project.status === "shipment",
    ).length,
    due_risk_count: projectItems.filter(
      (project) => project.is_due_risk,
    ).length,
  };

  return {
    projects: projectItems,
    activities,
    kpi,
  };
}

/* =========================================================
 * Detail
 * ======================================================= */

export async function getCustomerProjectDetail(
  projectId: string,
): Promise<CustomerProjectDetail> {
  if (!projectId.trim()) {
    throw new Error("Project ID가 필요합니다.");
  }

  const customer = await getCustomerContext();

  const {
    data: projectData,
    error: projectError,
  } = await supabase
    .from("projects")
    .select(`
      id,
      project_code,
      project_name,
      customer_company_id,
      partner_company_id,
      status,
      industry,
      due_date,
      description,
      project_origin,
      bidding_request_id,
      order_id,
      created_at,
      updated_at
    `)
    .eq("id", projectId)
    .eq("customer_company_id", customer.companyId)
    .single();

  if (projectError) throw projectError;
  if (!projectData) {
    throw new Error("프로젝트 정보를 찾을 수 없습니다.");
  }

  const project = projectData as ProjectRow;

  let partnerCompanyName = "제조사 미지정";

  if (project.partner_company_id) {
    const {
      data: companyData,
      error: companyError,
    } = await supabase
      .from("companies")
      .select("company_name")
      .eq("id", project.partner_company_id)
      .single();

    if (companyError) throw companyError;

    partnerCompanyName =
      companyData?.company_name ?? "제조사 미확인";
  }

  const {
    data: bomData,
    error: bomError,
  } = await supabase
    .from("bom_items")
    .select(`
      id,
      project_id,
      part_number,
      part_name,
      drawing_no,
      revision,
      material,
      surface_treatment,
      quantity,
      unit,
      process_type,
      status,
      due_date,
      unit_price,
      total_price,
      updated_at
    `)
    .eq("project_id", project.id)
    .order("part_number", { ascending: true });

  if (bomError) throw bomError;

  const bomRows = (bomData ?? []) as BomDetailRow[];
  const bomIds = bomRows.map((bomItem) => bomItem.id);

  const productionMap = new Map<string, ProductionRow>();
  const qualityMap = new Map<string, QualityRow>();
  const shipmentMap = new Map<string, ShipmentRow>();
  const settlementMap = new Map<string, SettlementRow>();

  if (bomIds.length > 0) {
    const [
      productionResult,
      qualityResult,
      shipmentResult,
      settlementResult,
    ] = await Promise.all([
      supabase
        .from("production_updates")
        .select(`
          bom_item_id,
          progress,
          status,
          process_step,
          issue_flag,
          memo,
          created_at,
          updated_at
        `)
        .in("bom_item_id", bomIds)
        .order("updated_at", { ascending: false }),

      supabase
        .from("qc_requests")
        .select(`
          id,
          bom_item_id,
          qc_status,
          inspection_date,
          priority,
          memo,
          updated_at
        `)
        .in("bom_item_id", bomIds)
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),

      supabase
        .from("shipments")
        .select(`
          id,
          bom_item_id,
          shipment_status,
          shipment_date,
          shipped_quantity,
          created_at,
          updated_at
        `)
        .in("bom_item_id", bomIds)
        .order("updated_at", { ascending: false }),

      supabase
        .from("settlements")
        .select(`
          id,
          bom_item_id,
          status,
          amount,
          vat,
          total_amount,
          invoice_no,
          invoice_date,
          payment_due_date,
          payment_date,
          memo,
          created_at,
          updated_at
        `)
        .in("bom_item_id", bomIds)
        .order("updated_at", { ascending: false }),
    ]);

    if (productionResult.error) throw productionResult.error;
    if (qualityResult.error) throw qualityResult.error;
    if (shipmentResult.error) throw shipmentResult.error;
    if (settlementResult.error) throw settlementResult.error;

    ((productionResult.data ?? []) as ProductionRow[]).forEach(
      (row) => {
        if (!row.bom_item_id) return;
        if (!productionMap.has(row.bom_item_id)) {
          productionMap.set(row.bom_item_id, row);
        }
      },
    );

    ((qualityResult.data ?? []) as QualityRow[]).forEach((row) => {
      if (!row.bom_item_id) return;
      if (!qualityMap.has(row.bom_item_id)) {
        qualityMap.set(row.bom_item_id, row);
      }
    });

    ((shipmentResult.data ?? []) as ShipmentRow[]).forEach(
      (row) => {
        if (!row.bom_item_id) return;
        if (!shipmentMap.has(row.bom_item_id)) {
          shipmentMap.set(row.bom_item_id, row);
        }
      },
    );

    ((settlementResult.data ?? []) as SettlementRow[]).forEach(
      (row) => {
        if (!settlementMap.has(row.bom_item_id)) {
          settlementMap.set(row.bom_item_id, row);
        }
      },
    );
  }

  const bomItems: CustomerProjectDetailBomItem[] = bomRows.map(
    (bomItem) => {
      const production = productionMap.get(bomItem.id);
      const quality = qualityMap.get(bomItem.id);
      const shipment = shipmentMap.get(bomItem.id);
      const settlement = settlementMap.get(bomItem.id);

      const effectiveProcess =
        production?.process_step ??
        bomItem.process_type ??
        "대기";

      const effectiveProgress =
        production?.progress ??
        getInitialProgress(effectiveProcess);

      return {
        id: bomItem.id,
        project_id: bomItem.project_id,
        part_number: bomItem.part_number,
        part_name: bomItem.part_name,
        drawing_no: bomItem.drawing_no,
        revision: bomItem.revision,
        material: bomItem.material,
        surface_treatment: bomItem.surface_treatment,
        quantity: Number(bomItem.quantity ?? 0),
        unit: bomItem.unit,
        process_type: effectiveProcess,
        bom_status: bomItem.status,
        due_date: bomItem.due_date,
        unit_price:
          bomItem.unit_price === null
            ? null
            : Number(bomItem.unit_price),
        total_price:
          bomItem.total_price === null
            ? null
            : Number(bomItem.total_price),

        production: {
          progress: Number(effectiveProgress ?? 0),
          status: production?.status ?? null,
          process_step: effectiveProcess,
          issue_flag: Boolean(production?.issue_flag ?? false),
          memo: production?.memo ?? null,
          updated_at: production?.updated_at ?? null,
        },

        quality: {
          id: quality?.id ?? null,
          qc_status: quality?.qc_status ?? null,
          inspection_date: quality?.inspection_date ?? null,
          priority: Boolean(quality?.priority ?? false),
          memo: quality?.memo ?? null,
          updated_at: quality?.updated_at ?? null,
        },

        shipment: {
          id: shipment?.id ?? null,
          shipment_status: shipment?.shipment_status ?? null,
          shipment_date: shipment?.shipment_date ?? null,
          shipped_quantity:
            shipment?.shipped_quantity === null ||
            shipment?.shipped_quantity === undefined
              ? null
              : Number(shipment.shipped_quantity),
          updated_at: shipment?.updated_at ?? null,
        },

        settlement: {
          id: settlement?.id ?? null,
          status: settlement?.status ?? null,
          amount: Number(settlement?.amount ?? 0),
          vat: Number(settlement?.vat ?? 0),
          total_amount: Number(settlement?.total_amount ?? 0),
          invoice_no: settlement?.invoice_no ?? null,
          invoice_date: settlement?.invoice_date ?? null,
          payment_due_date: settlement?.payment_due_date ?? null,
          payment_date: settlement?.payment_date ?? null,
          memo: settlement?.memo ?? null,
          updated_at: settlement?.updated_at ?? null,
        },

        latest_update_at: getLatestTimestamp([
          production?.updated_at,
          quality?.updated_at,
          shipment?.updated_at,
          settlement?.updated_at,
          bomItem.updated_at,
        ]),
      };
    },
  );

  const [summary, activities] = await Promise.all([
    getProjectSummary(project.id),
    getActivityRowsWithBom([project.id], 50),
  ]);

  return {
    project: {
      id: project.id,
      project_code: project.project_code,
      project_name: project.project_name,
      customer_company_id: project.customer_company_id,
      partner_company_id: project.partner_company_id,
      partner_company_name: partnerCompanyName,
      status: project.status,
      status_label: getCustomerProjectStatusLabel(project.status),
      industry: project.industry,
      due_date: project.due_date,
      description: project.description,
      project_origin: project.project_origin ?? null,
      bidding_request_id: project.bidding_request_id ?? null,
      order_id: project.order_id ?? null,
      created_at: project.created_at,
      updated_at: project.updated_at,
    },
    summary,
    bom_items: bomItems,
    activities,
  };
}