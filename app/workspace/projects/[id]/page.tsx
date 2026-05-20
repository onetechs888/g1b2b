import Link from "next/link";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectBomPage({ params }: Props) {
  const { id } = await params;

  const bomItems = [
    ["1", "Chamber 본체", "DRW-001", "250 x 150 x 20T", "AL6061", "2", "EA", "가공중", 65, "2026-06-20"],
    ["2", "Cover", "DRW-002", "200 x 100 x 10T", "SUS304", "1", "EA", "후공정", 40, "2026-06-22"],
    ["3", "Bracket", "DRW-003", "120 x 80 x 6T", "AL6061", "4", "EA", "검사중", 80, "2026-06-18"],
    ["4", "Shaft", "DRW-004", "Ø20 x 120L", "S45C", "2", "EA", "가공중", 55, "2026-06-25"],
    ["5", "Bolt", "DRW-005", "M8 x 25L", "SS400", "8", "EA", "대기", 0, "2026-06-30"],
    ["6", "Block", "DRW-006", "50 x 50 x 30T", "AL6061", "6", "EA", "후공정", 30, "2026-06-28"],
    ["7", "Pin", "DRW-007", "Ø10 x 30L", "SUS304", "10", "EA", "검사중", 70, "2026-06-21"],
    ["8", "Plate", "DRW-008", "300 x 200 x 8T", "AL6061", "1", "EA", "가공중", 60, "2026-07-01"],
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
                ["파트너사 업무관리", "/workspace/partner"],
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
            <p className="mt-3 text-xs text-gray-500">발주 · 검수 · 납품 관리</p>
            <p className="mt-2 text-xs text-gray-500">G1B2B Manufacturing OS</p>
          </div>
        </aside>

        <section className="px-10 py-9">
          <div className="mb-6 text-xs text-gray-500">
            고객 업무관리 〉 프로젝트 〉 BOM 관리
          </div>

          <header className="mb-7 flex items-start justify-between gap-6">
            <div>
              <h2 className="text-3xl font-extrabold mb-3">BOM 품목 리스트</h2>
              <p className="text-sm text-gray-600">
                {id} · 총 32개 품목의 진행 현황을 확인합니다.
              </p>
            </div>

            <div className="flex gap-3">
              <button className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold hover:border-black transition">
                엑셀 다운로드
              </button>

              <button className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white hover:opacity-90">
                + 품목 추가
              </button>
            </div>
          </header>

          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid lg:grid-cols-[420px_1fr] gap-4">
              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold">PM 메모</p>
                      <p className="truncate text-sm text-gray-600">
                        가공 공차는 도면 기준으로 진행 부탁드립니다.
                      </p>
                    </div>

                    <p className="mt-2 text-xs text-gray-400">
                      김지현 PM · 2026-05-20 14:30
                    </p>
                  </div>

                  <button className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold hover:border-black">
                    수정
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-3">
                <div className="grid grid-cols-[1fr_auto_auto] gap-3">
                  <input
                    placeholder="품목명, 도면번호 검색"
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                  />

                  <button className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold hover:border-black">
                    필터
                  </button>

                  <button className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold hover:border-black">
                    컬럼 설정
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5">
              <h3 className="text-xl font-extrabold">전체 품목 (32)</h3>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[1180px] text-sm">
                <thead className="bg-[#fafafa] text-xs text-gray-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">NO.</th>
                    <th className="px-5 py-4 text-left font-semibold">품목명</th>
                    <th className="px-5 py-4 text-left font-semibold">도면번호</th>
                    <th className="px-5 py-4 text-left font-semibold">규격</th>
                    <th className="px-5 py-4 text-left font-semibold">재질</th>
                    <th className="px-5 py-4 text-left font-semibold">수량</th>
                    <th className="px-5 py-4 text-left font-semibold">단위</th>
                    <th className="px-5 py-4 text-left font-semibold">현재 상태</th>
                    <th className="px-5 py-4 text-left font-semibold">진행률</th>
                    <th className="px-5 py-4 text-left font-semibold">납기일</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {bomItems.map(([no, name, drawing, spec, material, qty, unit, status, progress, due]) => (
                    <tr key={no} className="hover:bg-[#fafafa]">
                      <td className="px-5 py-4">{no}</td>
                      <td className="px-5 py-4 font-semibold">{name}</td>
                      <td className="px-5 py-4 text-gray-600">{drawing}</td>
                      <td className="px-5 py-4 text-gray-600">{spec}</td>
                      <td className="px-5 py-4 text-gray-600">{material}</td>
                      <td className="px-5 py-4 text-gray-600">{qty}</td>
                      <td className="px-5 py-4 text-gray-600">{unit}</td>
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-black"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <p className="text-xs text-gray-500">전체 32개 항목</p>

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