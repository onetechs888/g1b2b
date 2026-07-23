"use client";

import type { PartnerBiddingBomItem } from "@/services/partner/biddingService";

type Props = {
  item: PartnerBiddingBomItem;
};

function Value({
  value,
}: {
  value?: string | number | null;
}) {
  return (
    <span className="font-black text-slate-900">
      {value === null ||
      value === undefined ||
      value === ""
        ? "-"
        : value}
    </span>
  );
}

export default function ItemInformation({
  item,
}: Props) {
  return (
    <section className="space-y-4 p-4">
      <div className="rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-black">
            품목 기본정보
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4">
          <Info
            title="품목명"
            value={item.part_name}
          />

          <Info
            title="품목번호"
            value={item.part_number}
          />

          <Info
            title="도면번호"
            value={item.drawing_no}
          />

          <Info
            title="재질"
            value={item.material}
          />

          <Info
            title="표면처리"
            value={item.surface_treatment}
          />

          <Info
            title="단위"
            value={item.unit}
          />

          <Info
            title="요청수량"
            value={`${item.quantity} ${item.unit ?? ""}`}
          />

          <Info
            title="Revision"
            value={item.revision}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-black">
            제작 참고사항
          </h3>
        </div>

        <div className="p-4">
          <TextArea
            title="안내"
            value="추가 품목 정보가 없습니다."
          />
        </div>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <h4 className="text-sm font-black text-blue-700">
          견적 작성 안내
        </h4>

        <ul className="mt-3 space-y-2 text-xs leading-5 text-blue-700">
          <li>
            • 고객 참고단가는 제공되지 않습니다.
          </li>

          <li>
            • 실제 제조 가능한 금액으로 견적을 작성합니다.
          </li>

          <li>
            • 특이사항은 품목 메모에 작성합니다.
          </li>

          <li>
            • 제출 후에는 수정이 제한됩니다.
          </li>
        </ul>
      </div>
    </section>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-500">
        {title}
      </div>

      <div className="mt-1 text-sm">
        <Value value={value} />
      </div>
    </div>
  );
}

function TextArea({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold text-slate-500">
        {title}
      </div>

      <div className="min-h-[80px] rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
        {value || "-"}
      </div>
    </div>
  );
}