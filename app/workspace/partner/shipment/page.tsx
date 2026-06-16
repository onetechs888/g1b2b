import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

function getShipmentStatusLabel(status: string) {
  if (status === "ready") return "포장 및 출하준비";
  if (status === "shipped") return "출하 및 납품완료";
  return status;
}

export default async function ShipmentPage() {
  const { data: shipmentsData, error: shipmentError } = await supabase
    .from("shipments")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: bomItems, error: bomError } = await supabase
    .from("bom_items")
    .select("*");

  if (shipmentError || bomError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">
            출하 데이터를 불러오지 못했습니다.
          </div>

          <pre className="mt-2 text-xs">
            {JSON.stringify(shipmentError || bomError, null, 2)}
          </pre>
        </div>
      </WorkspaceLayout>
    );
  }

  const bomMap = new Map();

  bomItems?.forEach((item) => {
    bomMap.set(item.id, item);
  });

  const shipmentRows =
    shipmentsData?.map((shipment) => {
      const bom = bomMap.get(shipment.bom_item_id);

      return {
        id: shipment.id,

        shipment_id: shipment.id.slice(0, 8),

        bom_item_id: bom?.part_number ?? "-",

        item_name: bom?.part_name ?? "-",

        quantity: shipment.shipped_quantity,

        shipment_date:
          shipment.shipment_date ?? "-",

        shipment_status: getShipmentStatusLabel(
          shipment.shipment_status
        ),

        status:
          shipment.shipment_status === "shipped"
            ? "완료"
            : "진행중",

        action: "출하관리",
      };
    }) ?? [];

  const readyCount = shipmentRows.filter(
    (item) =>
      item.shipment_status === "포장 및 출하준비"
  ).length;

  const shippedCount = shipmentRows.filter(
    (item) =>
      item.shipment_status === "출하 및 납품완료"
  ).length;

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="출하관리"
          description="포장 및 출하준비 / 출하 및 납품완료를 관리합니다."
        />

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
          <div className="flex-1">
            <DataTable
              columns={[
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
                  value: "shipments",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}