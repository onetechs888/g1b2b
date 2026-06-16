import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import DataTable from "@/components/workspace/DataTable";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";
import { supabase } from "@/lib/supabase";

export default async function ProductionPage() {
  const { data: bomItems, error: bomError } = await supabase
    .from("bom_items")
    .select("*")
    .order("part_number", { ascending: true });

  const { data: productionUpdates, error: productionError } = await supabase
    .from("production_updates")
    .select("*");

  if (bomError || productionError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">생산 데이터를 불러오지 못했습니다.</div>
          <pre className="mt-2 whitespace-pre-wrap text-xs">
            {JSON.stringify(bomError || productionError, null, 2)}
          </pre>
        </div>
      </WorkspaceLayout>
    );
  }

  const productionMap = new Map();

  productionUpdates?.forEach((update) => {
    productionMap.set(String(update.bom_item_id), update);
  });

  const bomRows =
    bomItems?.map((item) => {
      const latestUpdate = productionMap.get(String(item.id));

      const currentProcess =
        latestUpdate?.process_step ?? item.process_type ?? "대기";

      const progress = latestUpdate?.progress ?? 0;
      const productionStatus = latestUpdate?.status ?? "not_started";

      return {
        id: item.part_number,
        bom_item_id: item.part_number,
        item_name: item.part_name,
        drawing_no: item.drawing_no,
        quantity: item.quantity,
        current_process: currentProcess,
        progress,
        status:
          productionStatus === "completed"
            ? "완료"
            : productionStatus === "in_progress"
              ? "진행중"
              : "대기",
        action: "공정변경",
      };
    }) ?? [];

  const waitingCount = bomRows.filter(
    (item) => item.current_process === "대기"
  ).length;

  const materialInCount = bomRows.filter(
    (item) => item.current_process === "소재입고"
  ).length;

  const materialQcCount = bomRows.filter(
    (item) => item.current_process === "소재검수"
  ).length;

  const internalCount = bomRows.filter(
    (item) => item.current_process === "내부공정"
  ).length;

  const externalCount = bomRows.filter(
    (item) => item.current_process === "외부공정"
  ).length;

  const qcRequestCount = bomRows.filter(
    (item) => item.current_process === "검수요청"
  ).length;

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="생산관리"
          description="BOM 기준 생산 Workflow를 관리합니다."
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">생산관리 Workflow</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            대기 → 소재입고 → 소재검수 → 내부공정 → 외부공정 → 검수요청
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4">
          <KpiCard title="대기" value={waitingCount} />
          <KpiCard title="소재입고" value={materialInCount} />
          <KpiCard title="소재검수" value={materialQcCount} />
          <KpiCard title="내부공정" value={internalCount} />
          <KpiCard title="외부공정" value={externalCount} />
          <KpiCard title="검수요청" value={qcRequestCount} />
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <DataTable
              columns={[
                { key: "bom_item_id", label: "품목번호" },
                { key: "item_name", label: "품목명" },
                { key: "drawing_no", label: "도면번호" },
                { key: "quantity", label: "수량" },
                { key: "current_process", label: "현재상태" },
                { key: "progress", label: "진행률", type: "progress" },
                { key: "status", label: "상태", type: "status" },
                {
                  key: "action",
                  label: "액션",
                  type: "link",
                  hrefPrefix: "/workspace/partner/production/item/",
                },
              ]}
              data={bomRows}
            />
          </div>

          <div className="w-80 shrink-0">
            <RightDetailPanel
              title="생산 데이터"
              items={[
                { label: "데이터 기준", value: "bom_items + production_updates" },
                { label: "총 BOM", value: bomRows.length },
                { label: "대기", value: waitingCount },
                { label: "내부공정", value: internalCount },
                { label: "검수요청", value: qcRequestCount },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}