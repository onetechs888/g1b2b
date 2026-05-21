import Link from "next/link";

export default function CustomerWorkspacePage() {
  const summaryCards = [
    ["진행중 프로젝트", "12", "운영중"],
    ["참여 신청 업체", "28", "검토 필요"],
    ["품질 검수 요청", "7", "G1 진행"],
    ["납품 확인 대기", "5", "확인 필요"],
  ];

  const projects = [
    {
      id: "PO-2026-0001",
      title: "Chamber 부품 제작 외 15종",
      itemCount: 16,
      partner: "미래정밀(주)",
      step: "가공중",
      progress: 42,
      due: "2026-06-20",
    },
    {
      id: "PO-2026-0002",
      title: "샤워헤드 부품 제작 외 8종",
      itemCount: 9,
      partner: "지원테크",
      step: "후공정",
      progress: 68,
      due: "2026-06-18",
    },
    {
      id: "PO-2026-0003",
      title: "베이스 플레이트 제작 외 21종",
      itemCount: 22,
      partner: "에이원테크",
      step: "검사중",
      progress: 83,
      due: "2026-06-15",
    },
  ];

  const requests = [
    {
      company: "(주)테스트텍",
      project: "Chamber 부품 제작 외 15종",
      grade: "B",
      status: "검토중",
      date: "2026-05-30",
    },
    {
      company: "(주)이노파트",
      project: "샤워헤드 부품 제작 외 8종",
      grade: "A",
      status: "승인",
      date: "2026-05-29",
    },
    {
      company: "삼원테크(주)",
      project: "브라켓 가공 외 6종",
      grade: "C",
      status: "거절",
      date: "2026-05-28",
    },
  ];

  const customerTasks = [
    "발주 관리",
    "진행 현황 확인",
    "입찰 관리",
    "품질 검수 요청(도면) - G1",
    "참여 신청 업체 관리",
    "납품 확인",
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
            <p className="mt-3 text-xs text-gray-500">발주 · 검수 · 납품 관리</p>
            <p className="mt-2 text-xs text-gray-500">G1B2B Manufacturing OS</p>
          </div>
        </aside>

        <section className="px-10 py-9">
          <header className="mb-8 flex items-start justify-between gap-6">
            <div>
              <h2 className="text-3xl font-extrabold mb-3">고객 업무관리</h2>
              <p className="text-sm text-gray-600">
                발주, 입찰, 참여업체, 검수 요청 및 납품 확인을 관리합니다.
              </p>
            </div>

            <Link
              href="/order/new"
              className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              + 새 발주 등록
            </Link>
          </header>

          <section className="mb-7 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {summaryCards.map(([label, value, desc]) => (
              <article
                key={label}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-bold">{label}</p>
                <h3 className="mt-2 text-3xl font-extrabold">{value}</h3>
                <p className="mt-2 text-sm text-gray-500">{desc}</p>
              </article>
            ))}
          </section>

          <section className="mb-7 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <h3 className="text-xl font-extrabold">진행중 프로젝트</h3>
              <span className="text-sm font-semibold text-gray-500">전체보기 ›</span>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-[#fafafa] text-xs text-gray-500">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">프로젝트명</th>
                    <th className="px-6 py-4 text-left font-semibold">품목 수</th>
                    <th className="px-6 py-4 text-left font-semibold">참여 업체</th>
                    <th className="px-6 py-4 text-left font-semibold">현재 단계</th>
                    <th className="px-6 py-4 text-left font-semibold">진행률</th>
                    <th className="px-6 py-4 text-left font-semibold">납기일</th>
                    <th className="px-6 py-4 text-left font-semibold">상세</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-[#fafafa]">
                      <td className="px-6 py-5 font-semibold">{project.title}</td>
                      <td className="px-6 py-5">{project.itemCount}종</td>
                      <td className="px-6 py-5">{project.partner}</td>
                      <td className="px-6 py-5">
                        <span className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white">
                          {project.step}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="w-9">{project.progress}%</span>
                          <div className="h-2 w-28 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-black"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">{project.due}</td>
                      <td className="px-6 py-5">
                        <Link
                          href={`/workspace/customer/projects/${project.id}`}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold hover:border-black transition"
                        >
                          상세보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid xl:grid-cols-2 gap-5">
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <h3 className="text-xl font-extrabold">참여 신청 업체</h3>
                <span className="text-sm font-semibold text-gray-500">전체보기 ›</span>
              </div>

              <div className="overflow-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="bg-[#fafafa] text-xs text-gray-500">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">업체명</th>
                      <th className="px-6 py-4 text-left font-semibold">프로젝트명</th>
                      <th className="px-6 py-4 text-left font-semibold">등급</th>
                      <th className="px-6 py-4 text-left font-semibold">상태</th>
                      <th className="px-6 py-4 text-left font-semibold">신청일</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {requests.map((item) => (
                      <tr key={`${item.company}-${item.project}`}>
                        <td className="px-6 py-4 font-semibold">{item.company}</td>
                        <td className="px-6 py-4">{item.project}</td>
                        <td className="px-6 py-4">{item.grade}</td>
                        <td className="px-6 py-4">{item.status}</td>
                        <td className="px-6 py-4">{item.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-5">
                <h3 className="text-xl font-extrabold">고객 업무 항목</h3>
              </div>

              <div className="grid grid-cols-2 gap-x-10 gap-y-6 p-8">
                {customerTasks.map((task) => (
                  <div key={task} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-black text-[10px] font-bold text-white">
                      ✓
                    </span>
                    <span className="text-sm font-semibold">{task}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}