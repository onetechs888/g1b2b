import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle();

  const bomItems = [
    ["브라켓 본체", "AL6061", "120 × 80 × 25", "100EA", "MCT 가공"],
    ["고정 플레이트", "S45C", "90 × 60 × 12", "100EA", "흑착색"],
    ["스페이서", "SUS304", "Ø12 × 30", "200EA", "선반 가공"],
  ];

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

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <section className="max-w-6xl mx-auto px-8 py-14">
        <div className="mb-8">
          <a href="/order" className="text-xs text-gray-500 hover:text-black">
            ← 발주 목록
          </a>

          <h1 className="text-4xl font-extrabold mt-5 mb-4">
            {order.title}
          </h1>

          <p className="text-sm text-gray-600">
            발주 조건, BOM 구성, 첨부파일, 참여 가능 등급을 확인할 수 있습니다.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-6">발주 정보</h2>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  ["가공 방식", order.category],
                  ["타겟 금액", order.target_price],
                  ["희망 납기", order.deadline],
                  ["참여 가능 등급", order.grade],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-[#fafafa] border border-gray-200 p-5"
                  >
                    <p className="text-xs text-gray-500 mb-2">{label}</p>
                    <p className="text-base font-bold">{value || "-"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">BOM / 구성 품목</h2>
                  <p className="text-xs text-gray-500">
                    제작에 필요한 주요 구성품 정보를 확인합니다.
                  </p>
                </div>

                <span className="text-xs text-gray-400">
                  Sample BOM
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-[#fafafa] text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">품목명</th>
                      <th className="px-4 py-3 text-left font-semibold">재질</th>
                      <th className="px-4 py-3 text-left font-semibold">규격</th>
                      <th className="px-4 py-3 text-left font-semibold">수량</th>
                      <th className="px-4 py-3 text-left font-semibold">비고</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {bomItems.map(([name, material, size, qty, note]) => (
                      <tr key={name}>
                        <td className="px-4 py-4 font-semibold">{name}</td>
                        <td className="px-4 py-4 text-gray-600">{material}</td>
                        <td className="px-4 py-4 text-gray-600">{size}</td>
                        <td className="px-4 py-4 text-gray-600">{qty}</td>
                        <td className="px-4 py-4 text-gray-600">{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-xs text-gray-400">
                추후 발주 등록 시 BOM 직접 입력 또는 엑셀 업로드 기능을 연결할 예정입니다.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-lg font-bold mb-4">보안 안내</h2>

              <p className="text-xs text-gray-500 leading-relaxed">
                등급 미달 파트너사의 도면 열람은 제한될 예정이며, 대외비 프로젝트는
                보안 입찰 또는 오프라인 입찰 방식으로 전환할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-7 shadow-sm">
              <h2 className="text-lg font-bold mb-4">첨부파일</h2>

              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-5">
                <p className="text-sm font-semibold mb-2">
                  {order.file_name || "첨부된 파일이 없습니다."}
                </p>

                <p className="text-xs text-gray-500 mb-4">
                  도면 및 3D 파일 다운로드 기능을 연결할 예정입니다.
                </p>

                <button
                  disabled={!order.file_name}
                  className="w-full rounded-xl bg-black py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500"
                >
                  다운로드
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">3D 뷰어</h2>
                <span className="text-xs text-gray-400">준비중</span>
              </div>

              <div className="h-56 rounded-2xl border border-dashed border-gray-300 bg-[#fafafa] flex items-center justify-center text-center">
                <p className="text-xs text-gray-500 leading-relaxed">
                  STEP / STL / OBJ 파일을
                  <br />
                  웹에서 미리보기 할 수 있도록 연결 예정
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-7 shadow-sm">
              <h2 className="text-lg font-bold mb-3">참여 조건</h2>

              <p className="text-xs text-gray-500 leading-relaxed mb-5">
                고객사가 지정한 등급 이상의 파트너사만 상세 도면 열람과
                참여 신청이 가능하도록 운영할 예정입니다.
              </p>

              <div className="rounded-2xl bg-[#fafafa] border border-gray-200 p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">요구 등급</p>
                <p className="text-xl font-extrabold">{order.grade}</p>
              </div>

              <button className="w-full bg-black text-white rounded-2xl py-4 text-sm font-semibold hover:opacity-90 transition">
                참여 신청하기
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}