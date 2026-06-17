import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

function getShipmentStatusLabel(status: string) {
  if (status === "ready") return "포장 및 출하준비";
  if (status === "shipped") return "출하 및 납품완료";
  return status ?? "-";
}

export default async function ShipmentPage() {
  const { data: shipmentsData, error: shipmentError } = await supabase
    .from("shipments")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: bomItems, error: bomError } = await supabase
    .from("bom_items")
    .select("*");

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id, project_code, project_name, due_date");

  if (shipmentError || bomError || projectError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">
            출하 데이터를 불러오지 못했습니다.
          </div>

          <pre className="mt-2 whitespace-pre-wrap text-xs">
            {JSON.stringify(shipmentError || bomError || projectError, null, 2)}
          </pre>
        </div>
      </WorkspaceLayout>
    );
  }

  const bomMap = new Map();

  bomItems?.forEach((item) => {
    bomMap.set(String(item.id), item);
  });

  const projectMap = new Map();

  projects?.forEach((project) => {
    projectMap.set(String(project.id), project);
  });

  const shipmentRows =
    shipmentsData?.map((shipment) => {
      const bom = bomMap.get(String(shipment.bom_item_id));
      const project = bom ? projectMap.get(String(bom.project_id)) : null;

      return {
        id: shipment.id,

        shipment_id: shipment.id.slice(0, 8),

        project_no: project?.project_code ?? "-",

        project_name: project?.project_name ?? "-",

        due_date: project?.due_date ?? "-",

        bom_item_id: bom?.part_number ?? "-",

        item_name: bom?.part_name ?? "-",

        quantity: shipment.shipped_quantity,

        shipment_date: shipment.shipment_date ?? "-",

        shipment_status: getShipmentStatusLabel(shipment.shipment_status),

        status:
          shipment.shipment_status === "shipped"
            ? "완료"
            : "진행중",

        action: "출하관리",
      };
    }) ?? [];

  const currentProject = shipmentRows[0];

  const readyCount = shipmentRows.filter(
    (item) => item.shipment_status === "포장 및 출하준비"
  ).length;

  const shippedCount = shipmentRows.filter(
    (item) => item.shipment_status === "출하 및 납품완료"
  ).length;

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="출하관리"
          description="포장 및 출하준비 / 출하 및 납품완료를 관리합니다."
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">프로젝트 정보</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            {currentProject?.project_no ?? "-"} /{" "}
            {currentProject?.project_name ?? "-"}
          </div>
          <div className="mt-2 text-sm text-blue-700">
            납기일: {currentProject?.due_date ?? "-"}
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">출하관리 Workflow</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            포장 및 출하준비 → 출하 및 납품완료
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <KpiCard
            title="포장 및 출하준비"
            value={readyCount}
          />

          <KpiCard
            title="출하 및 납품완료"
            value={shippedCount}
          />
        </div>

        <div className="flex gap-4 items-start">
          <div className="min-w-0 flex-1">
            <DataTable
              columns={[
                {
                  key: "project_no",
                  label: "프로젝트번호",
                },
                {
                  key: "project_name",
                  label: "프로젝트명",
                },
                {
                  key: "shipment_id",
                  label: "출하번호",
                },
                {
                  key: "bom_item_id",
                  label: "품목번호",
                },
                {
                  key: "item_name",
                  label: "품목명",
                },
                {
                  key: "quantity",
                  label: "수량",
                },
                {
                  key: "shipment_date",
                  label: "출하일",
                },
                {
                  key: "shipment_status",
                  label: "출하상태",
                },
                {
                  key: "status",
                  label: "상태",
                  type: "status",
                },
                {
                  key: "action",
                  label: "액션",
                  type: "link",
                  hrefPrefix:
                    "/workspace/partner/shipment/item/",
                },
              ]}
              data={shipmentRows}
            />
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="출하 데이터"
              items={[
                {
                  label: "프로젝트번호",
                  value: currentProject?.project_no ?? "-",
                },
                {
                  label: "프로젝트명",
                  value: currentProject?.project_name ?? "-",
                },
                {
                  label: "총 출하건수",
                  value: shipmentRows.length,
                },
                {
                  label: "출하준비",
                  value: readyCount,
                },
                {
                  label: "출하완료",
                  value: shippedCount,
                },
                {
                  label: "데이터 기준",
                  value: "shipments + bom_items",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}