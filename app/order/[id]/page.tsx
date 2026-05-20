import { supabase } from "@/lib/supabase";
import ParticipationButton from "@/components/ParticipationButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type BomItem = {
  id: number;
  order_id: number;
  part_name: string | null;
  material: string | null;
  spec: string | null;
  quantity: string | null;
  process: string | null;
  surface_treatment: string | null;
  heat_treatment: string | null;
  drawing_no: string | null;
  revision: string | null;
  note: string | null;
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle();

  const { data: bomItems } = await supabase
    .from("order_bom_items")
    .select("*")
    .eq("order_id", Number(id))
    .order("id", { ascending: true });

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#f6f6f4] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-3">
            발주 정보를 찾을 수 없습니다.
          </h1>

          <a href="/order" className="text-sm text-gray-500 hover:text-black">
            발주 목록으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  const safeBomItems = (bomItems || []) as BomItem[];

  const isStepFile =
    order.file_name?.toLowerCase().endsWith(".step") ||
    order.file_name?.toLowerCase().endsWith(".stp");

  const orderStatus = order.status || "진행중";
  const isClosed = orderStatus === "마감";

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <section className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-7">
          <a href="/order" className="text-xs text-gray-500 hover:text-black">
            ← 발주 목록
          </a>

          <div className="flex flex-wrap items-center gap-3 mt-4 mb-3">
            <h1 className="text-3xl font-extrabold">{order.title}</h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isClosed
                  ? "bg-gray-200 text-gray-600"
                  : "bg-black text-white"
              }`}
            >
              {orderStatus}
            </span>
          </div>

          <p className="text-xs text-gray-600">
            발주 조건, BOM 구성, 첨부파일, STEP 검토 영역, 참여 가능 등급을 확인할 수 있습니다.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold mb-1">발주 정보</h2>

                  <p className="text-[11px] text-gray-500">
                    기본 발주 조건을 확인합니다.
                  </p>
                </div>

                <span className="text-[11px] text-gray-400">
                  Order Info
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-3 h-[145px] overflow-y-scroll pr-2">
                {[
                  ["가공 방식", order.category],
                  ["타겟 금액", order.target_price],
                  ["희망 납기", order.deadline],
                  ["참여 가능 등급", order.grade],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-[#fafafa] border border-gray-200 p-3"
                  >
                    <p className="text-[10px] text-gray-500 mb-1">{label}</p>

                    <p className="text-xs font-semibold">
                      {value || "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold mb-1">
                    BOM / 구성 품목
                  </h2>

                  <p className="text-[11px] text-gray-500">
                    제작에 필요한 구성품, 공정, 도면 정보를 확인합니다.
                  </p>
                </div>

                <span className="text-[11px] text-gray-400">
                  {safeBomItems.length} Items
                </span>
              </div>

              <div className="h-[230px] overflow-scroll rounded-2xl border border-gray-200">
                <table className="w-full min-w-[980px] text-xs">
                  <thead className="sticky top-0 z-10 bg-[#fafafa] text-[11px] text-gray-500">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold">
                        품목명
                      </th>

                      <th className="px-3 py-3 text-left font-semibold">
                        재질
                      </th>

                      <th className="px-3 py-3 text-left font-semibold">
                        규격
                      </th>

                      <th className="px-3 py-3 text-left font-semibold">
                        수량
                      </th>

                      <th className="px-3 py-3 text-left font-semibold">
                        공정
                      </th>

                      <th className="px-3 py-3 text-left font-semibold">
                        표면처리
                      </th>

                      <th className="px-3 py-3 text-left font-semibold">
                        열처리
                      </th>

                      <th className="px-3 py-3 text-left font-semibold">
                        도면번호
                      </th>

                      <th className="px-3 py-3 text-left font-semibold">
                        Rev.
                      </th>

                      <th className="px-3 py-3 text-left font-semibold">
                        비고
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {safeBomItems.length > 0 ? (
                      safeBomItems.map((item) => (
                        <tr key={item.id} className="hover:bg-[#fafafa]">
                          <td className="px-3 py-3 font-semibold">
                            {item.part_name || "-"}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            {item.material || "-"}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            {item.spec || "-"}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            {item.quantity || "-"}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            {item.process || "-"}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            {item.surface_treatment || "-"}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            {item.heat_treatment || "-"}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            {item.drawing_no || "-"}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            {item.revision || "-"}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            {item.note || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-4 py-8 text-center text-xs text-gray-400"
                        >
                          등록된 BOM 데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-[11px] text-gray-400">
                추후 발주 등록 시 BOM 직접 입력 또는 엑셀 업로드 기능을 연결할 예정입니다.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-bold mb-3">보안 안내</h2>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                등급 미달 파트너사의 도면 열람은 제한될 예정이며,
                대외비 프로젝트는 보안 입찰 또는 오프라인 입찰 방식으로
                전환할 수 있습니다.
              </p>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-bold mb-3">첨부파일</h2>

              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-4">
                <p className="text-xs font-semibold mb-2 break-all">
                  {order.file_name || "첨부된 파일이 없습니다."}
                </p>

                <p className="text-[11px] text-gray-500 mb-4">
                  도면 및 STEP 파일 열람 / 다운로드
                </p>

                {order.file_url ? (
                  <a
                    href={order.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-xl bg-black py-3 text-center text-xs font-semibold text-white transition hover:opacity-90"
                  >
                    파일 열기 / 다운로드
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full rounded-xl bg-gray-300 py-3 text-xs font-semibold text-gray-500"
                  >
                    파일 없음
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold">STEP 검토 영역</h2>

                <span className="text-[11px] text-gray-400">
                  {isStepFile ? "STEP 파일" : "추후 지원"}
                </span>
              </div>

              <div className="h-[170px] rounded-2xl border border-dashed border-gray-300 bg-[#fafafa] flex items-center justify-center text-center px-4">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {isStepFile ? (
                    <>
                      STEP 파일이 첨부되었습니다.
                      <br />
                      추후 3D 미리보기 기능을 연결할 예정입니다.
                    </>
                  ) : (
                    <>
                      STEP 파일 업로드 시
                      <br />
                      추후 3D 미리보기 기능을 연결할 예정입니다.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-bold mb-3">참여 조건</h2>

              <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                고객사가 지정한 등급 이상의 파트너사만 상세 도면 열람과 참여 신청이 가능하도록 운영할 예정입니다.
              </p>

              <div className="rounded-2xl bg-[#fafafa] border border-gray-200 p-4 mb-4">
                <p className="text-[11px] text-gray-500 mb-1">
                  요구 등급
                </p>

                <p className="text-lg font-extrabold">
                  {order.grade}
                </p>
              </div>

              {isClosed ? (
                <button
                  disabled
                  className="w-full rounded-2xl bg-gray-300 py-3 text-xs font-semibold text-gray-500"
                >
                  마감된 발주입니다
                </button>
              ) : (
                <ParticipationButton orderId={order.id} />
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}