import Link from "next/link";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerProjectBomPage({ params }: Props) {
  const { id } = await params;

  const bomItems = [
    ["1", "Chamber 본체", "DRW-001", "2 EA", "가공중", 65, "2026-06-20", "정상"],
    ["2", "Cover", "DRW-002", "1 EA", "후공정", 40, "2026-06-22", "정상"],
    ["3", "Bracket", "DRW-003", "4 EA", "검사중", 80, "2026-06-18", "주의"],
    ["4", "Shaft", "DRW-004", "2 EA", "가공중", 55, "2026-06-25", "정상"],
    ["5", "Bolt", "DRW-005", "8 EA", "대기", 0, "2026-06-30", "주의"],
    ["6", "Block", "DRW-006", "6 EA", "후공정", 30, "2026-06-28", "정상"],
    ["7", "Pin", "DRW-007", "10 EA", "검사중", 70, "2026-06-21", "정상"],
    ["8", "Plate", "DRW-008", "1 EA", "가공중", 60, "2026-07-01", "지연"],
  ];

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:flex flex-col justify-between border-r border-gray-200 bg-white px-4 py-8">
          <div>
            <div className="mb-12 px-2">
              <h1 className="text-4xl font-extrabold tracking-tight">G1B2B</h1>
              <p className="mt-2 text-sm text-gray-500">Customer Workspace</p>
            </div>

            <nav className="space-y-2 text-sm">
              {[
                ["업무관리", "/workspace"],
                ["고객 업무관리", "/workspace/customer"],
                ["품질관리", "/workspace/quality"],
                ["설정", "/workspace/settings"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className={`block rounded-2xl px-4 py-3 font-semibold transition ${
                    label === "고객 업무관리"
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-bold">Customer PM Center</p>
            <p className="mt-3 text-xs text-gray-500">김지현 PM</p>
          </div>
        </aside>

        <section className="px-10 py-9">
          <div className="mb-5 text-xs text-gray-500">
            고객 업무관리 〉 프로젝트 〉 BOM 관리
          </div>

          <header className="mb-6 flex items-start justify-between gap-6">
            <div>
              <h2 className="text-3xl font-extrabold mb-3">BOM 품목 리스트</h2>
              <p className="text-sm text-gray-600">
                {id} · Chamber 부품 제작 외 15종
              </p>
            </div>

            <button className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold hover:border-black transition">
              엑셀 다운로드
            </button>
          </header>

          <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid lg:grid-cols-[320px_180px_1fr_auto] gap-6 items-center">
              <div>
                <p className="text-sm font-bold mb-3">해당 프로젝트 전체 진행률</p>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-extrabold">68%</span>
                  <div className="h-2 w-48 rounded-full bg-gray-200">
                    <div className="h-2 rounded-full bg-black" style={{ width: "68%" }} />
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-500">22 / 32 품목 진행중</p>
              </div>

              <div className="border-l border-gray-200 pl-6">
                <p className="text-sm font-bold mb-3">납기 위험 현황</p>
                <span className="rounded-full border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-bold text-yellow-700">
                  주의
                </span>
                <p className="mt-3 text-sm text-gray-500">납기 임박 품목 3개</p>
              </div>

              <div className="border-l border-gray-200 pl-6">
                <p className="text-sm font-bold mb-3">PM 메모</p>
                <p className="text-sm text-gray-700">
                  가공 공차는 도면 기준으로 진행 부탁드립니다.
                </p>
                <p className="mt-3 text-xs text-gray-400">
                  김지현 PM · 2026-05-20 14:30
                </p>
              </div>

              <button className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold hover:border-black transition">
                메모 보기
              </button>
            </div>
          </section>

          <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <input
                placeholder="품목명 또는 도면번호 검색"
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              />

              <button className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold hover:border-black transition">
                필터
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5">
              <h3 className="text-xl font-extrabold">전체 품목 (32)</h3>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="bg-[#fafafa] text-xs text-gray-500">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">NO.</th>
                    <th className="px-6 py-4 text-left font-semibold">품목명</th>
                    <th className="px-6 py-4 text-left font-semibold">도면번호</th>
                    <th className="px-6 py-4 text-left font-semibold">수량</th>
                    <th className="px-6 py-4 text-left font-semibold">현재 상태</th>
                    <th className="px-6 py-4 text-left font-semibold">개별 품목 진행률</th>
                    <th className="px-6 py-4 text-left font-semibold">납기일</th>
                    <th className="px-6 py-4 text-left font-semibold">납기 위험</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {bomItems.map(([no, name, drawing, qty, status, progress, due, risk]) => (
                    <tr key={no} className="hover:bg-[#fafafa]">
                      <td className="px-6 py-4">{no}</td>
                      <td className="px-6 py-4 font-semibold">{name}</td>
                      <td className="px-6 py-4 text-gray-600">{drawing}</td>
                      <td className="px-6 py-4">{qty}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            status === "대기"
                              ? "bg-gray-200 text-gray-500"
                              : "bg-black text-white"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-9">{progress}%</span>
                          <div className="h-2 w-28 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-black"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{due}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            risk === "지연"
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : risk === "주의"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              : "bg-green-50 text-green-700 border border-green-200"
                          }`}
                        >
                          {risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <p className="text-xs text-gray-500">전체 32개 품목</p>

              <div className="flex items-center gap-2">
                {["‹", "1", "2", "3", "4", "›"].map((page) => (
                  <button
                    key={page}
                    className={`h-9 min-w-9 rounded-lg border px-3 text-xs font-semibold ${
                      page === "1"
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-white hover:border-black"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold">
                10개씩 보기
              </button>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}