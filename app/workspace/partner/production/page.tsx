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
          <div className="font-semibold">
            생산 데이터를 불러오지 못했습니다.
          </div>
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
        latestUpdate?.process_step ?? item.process_type ?? "-";

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
          productionStatus === "in_progress"
            ? "진행중"
            : productionStatus === "completed"
              ? "완료"
              : productionStatus === "delayed"
                ? "주의"
                : productionStatus === "issue"
                  ? "NCR"
                  : "대기",
        action: "공정변경",
      };
    }) ?? [];

  const waitingCount = bomRows.filter(
    (item) => item.current_process === "가공대기"
  ).length;

  const processingCount = bomRows.filter(
    (item) => item.current_process === "가공중"
  ).length;

  const postProcessCount = bomRows.filter(
    (item) => item.current_process === "후공정"
  ).length;

  const inspectionCount = bomRows.filter(
    (item) => item.current_process === "검사대기"
  ).length;

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="생산관리"
          description="BOM 기준 생산 현황을 관리합니다."
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">데이터 기준</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            Supabase bom_items + production_updates
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KpiCard title="가공대기" value={waitingCount} />
          <KpiCard title="가공중" value={processingCount} />
          <KpiCard title="후공정" value={postProcessCount} />
          <KpiCard title="검사대기" value={inspectionCount} />
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <DataTable
              columns={[
                { key: "bom_item_id", label: "품목번호" },
                { key: "item_name", label: "품목명" },
                { key: "drawing_no", label: "도면번호" },
                { key: "quantity", label: "수량" },
                { key: "current_process", label: "현재공정" },
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
                {
                  label: "데이터 기준",
                  value: "bom_items + production_updates",
                },
                { label: "총 BOM", value: bomRows.length },
                {
                  label: "생산 업데이트",
                  value: productionUpdates?.length ?? 0,
                },
                { label: "가공중", value: processingCount },
                { label: "검사대기", value: inspectionCount },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}