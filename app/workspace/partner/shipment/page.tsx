import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";

import {
  shipmentSummary,
  shipments,
} from "@/data/shipmentMockData";

export default function ShipmentPage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="출하관리"
          description="출하 준비 및 출하 현황을 관리합니다."
        />

        <div className="grid grid-cols-4 gap-4">
          <KpiCard title="출하예정" value={shipmentSummary.scheduled} />
          <KpiCard title="출하준비" value={shipmentSummary.preparing} />
          <KpiCard title="출하완료" value={shipmentSummary.shipped} />
          <KpiCard title="지연위험" value={shipmentSummary.delayed} />
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <DataTable
columns={[
  { key: "shipment_id", label: "출하번호" },
  { key: "project_id", label: "PO 번호" },
  { key: "bom_item_id", label: "BOM ID" },
  { key: "item_name", label: "품목" },
  { key: "quantity", label: "수량" },
  { key: "planned_ship_date", label: "출하예정일" },
  { key: "shipment_status", label: "출하상태" },
  { key: "status", label: "상태", type: "status" },
]}
              data={shipments}
            />
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="출하 상세"
              items={[
                { label: "담당자", value: "원동협" },
                { label: "출하예정", value: "4건" },
                { label: "출하완료", value: "12건" },
                { label: "최근 출하", value: "SHIP-001" },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}