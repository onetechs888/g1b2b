import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PageHeader from "@/components/workspace/PageHeader";
import KpiCard from "@/components/workspace/KpiCard";
import RightDetailPanel from "@/components/workspace/RightDetailPanel";

interface PageProps {
  params: {
    id: string;
  };
}

export default function ProductionItemPage({ params }: PageProps) {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <PageHeader
          title="공정변경"
          description="BOM 품목의 생산 공정을 변경합니다."
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs text-blue-600">선택 품목</div>
          <div className="mt-1 text-lg font-semibold text-blue-900">
            {params.id}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KpiCard title="현재공정" value="가공중" />
          <KpiCard title="다음공정" value="가공완료" />
          <KpiCard title="Revision" value="REV-A" />
          <KpiCard title="담당자" value="원동협" />
        </div>

        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-8 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">
              공정 변경
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  현재공정
                </label>
                <input
                  value="가공중"
                  readOnly
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  변경할 공정
                </label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option>소재준비</option>
                  <option>소재검수</option>
                  <option>가공대기</option>
                  <option>가공중</option>
                  <option>가공완료</option>
                  <option>후공정</option>
                  <option>검사요청</option>
                  <option>출하준비</option>
                  <option>출하</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  작업 메모
                </label>
                <textarea
                  rows={4}
                  placeholder="공정 변경 사유 또는 작업 내용을 입력하세요."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button className="rounded-md border border-gray-300 px-4 py-2 text-sm">
                  취소
                </button>
                <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                  공정 변경 저장
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-4">
            <RightDetailPanel
              title="품목 상세"
              items={[
                { label: "품목번호", value: params.id },
                { label: "프로젝트", value: "PO-01 Chamber" },
                { label: "도면번호", value: "DWG-001" },
                { label: "현재상태", value: "진행중" },
              ]}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}