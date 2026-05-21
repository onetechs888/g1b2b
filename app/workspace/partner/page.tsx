import Link from "next/link";

function FactoryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 20V9l5 3V8l5 4V6h3v14H4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 16h2M13 16h2M18 16h1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InspectIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="10" r="5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m14 14 5 5M8 10l1.5 1.5L12.5 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 6h11v10H3V6ZM14 10h4l3 3v3h-7v-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 8v4l3 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect
        x="5"
        y="4"
        width="14"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M9 12l2 2 4-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PartnerWorkspacePage() {
  const summaryCards = [
    {
      title: "진행중 생산",
      value: "9",
      desc: "작업중",
      icon: <FactoryIcon />,
    },
    {
      title: "검사 요청",
      value: "4",
      desc: "G1 요청",
      icon: <InspectIcon />,
    },
    {
      title: "출하 대기",
      value: "3",
      desc: "출하 준비",
      icon: <TruckIcon />,
    },
    {
      title: "납기 임박",
      value: "2",
      desc: "7일 이내",
      icon: <ClockIcon />,
    },
    {
      title: "완료",
      value: "18",
      desc: "이번달",
      icon: <CheckIcon />,
    },
  ];

  const projects = [
    {
      id: "PO-2026-0001",
      title: "Chamber 부품 제작 외 15종",
      customer: "미래정밀(주)",
      itemCount: 16,
      process: "가공중",
      progress: 42,
      qc: "검사 예정",
      shipment: "대기",
      due: "2026-06-20",
    },
    {
      id: "PO-2026-0002",
      title: "샤워헤드 부품 제작 외 8종",
      customer: "지원테크",
      itemCount: 9,
      process: "후공정",
      progress: 68,
      qc: "검사 요청 가능",
      shipment: "대기",
      due: "2026-06-18",
    },
    {
      id: "PO-2026-0003",
      title: "베이스 플레이트 제작 외 21종",
      customer: "에이원테크",
      itemCount: 22,
      process: "검사중",
      progress: 83,
      qc: "G1 검사중",
      shipment: "출하 준비",
      due: "2026-06-15",
    },
  ];

  const qcRequests = [
    {
      project: "Chamber 부품 제작 외 15종",
      item: "Chamber Body",
      requestDate: "2026-05-28",
      status: "G1 검사중",
      resultDate: "2026-06-02",
    },
    {
      project: "샤워헤드 부품 제작 외 8종",
      item: "Shower Head Cover",
      requestDate: "2026-05-27",
      status: "검사 예정",
      resultDate: "2026-06-01",
    },
    {
      project: "베이스 플레이트 제작 외 21종",
      item: "Base Plate",
      requestDate: "2026-05-25",
      status: "검사 완료",
      resultDate: "2026-05-29",
    },
  ];

  const partnerTasks = [
    "발주 확인",
    "검사 결과 확인",
    "입찰 참여 관리",
    "출하 등록",
    "공정 상태 업데이트",
    "납품 확인",
    "검사 요청(제품) - G1",
    "정산 관리",
  ];

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:flex flex-col justify-between border-r border-gray-200 bg-white px-4 py-8">
          <div>
            <div className="mb-12 px-2">
              <h1 className="text-4xl font-extrabold tracking-tight">
                G1B2B
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Partner Workspace
              </p>
            </div>

            <nav className="space-y-2 text-sm">
              {[
                ["업무관리", "/workspace"],
                ["파트너 업무관리", "/workspace/partner"],
                ["품질관리", "/workspace/quality"],
                ["설정", "/workspace/settings"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className={`block rounded-2xl px-4 py-3 font-semibold transition ${
                    label === "파트너 업무관리"
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
            <p className="text-sm font-bold">Partner PM Center</p>

            <p className="mt-3 text-xs text-gray-500">
              공정 · 검사 · 출하 관리
            </p>

            <p className="mt-2 text-xs text-gray-500">
              (주)미래정밀
            </p>
          </div>
        </aside>

        <section className="px-10 py-9">
          <header className="mb-8 flex items-start justify-between gap-6">
            <div>
              <h2 className="mb-3 text-3xl font-extrabold">
                파트너 업무관리
              </h2>

              <p className="text-sm text-gray-600">
                수주 프로젝트의 생산, 검사, 출하 업무를 관리합니다.
              </p>
            </div>

            <button className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white hover:opacity-90">
              + 검사 요청
            </button>
          </header>

          <section className="mb-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-[#fafafa]">
                    {card.icon}
                  </div>

                  <div>
                    <p className="text-sm font-bold">{card.title}</p>

                    <h3 className="mt-2 text-3xl font-extrabold">
                      {card.value}
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      {card.desc}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="mb-7 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <h3 className="text-xl font-extrabold">
                진행중 프로젝트
              </h3>

              <span className="text-sm font-semibold text-gray-500">
                전체보기 ›
              </span>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[1280px] text-sm">
                <thead className="bg-[#fafafa] text-xs text-gray-500">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">
                      프로젝트명
                    </th>

                    <th className="px-6 py-4 text-left font-semibold">
                      발주처
                    </th>

                    <th className="px-6 py-4 text-left font-semibold">
                      품목 수
                    </th>

                    <th className="px-6 py-4 text-left font-semibold">
                      현재 공정
                    </th>

                    <th className="px-6 py-4 text-left font-semibold">
                      진행률
                    </th>

                    <th className="px-6 py-4 text-left font-semibold">
                      검사 상태
                    </th>

                    <th className="px-6 py-4 text-left font-semibold">
                      출하 상태
                    </th>

                    <th className="px-6 py-4 text-left font-semibold">
                      납기일
                    </th>

                    <th className="px-6 py-4 text-left font-semibold">
                      관리
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-[#fafafa]"
                    >
                      <td className="px-6 py-5 font-semibold">
                        {project.title}
                      </td>

                      <td className="px-6 py-5">
                        {project.customer}
                      </td>

                      <td className="px-6 py-5">
                        {project.itemCount}종
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white">
                          {project.process}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="w-9">
                            {project.progress}%
                          </span>

                          <div className="h-2 w-28 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-black"
                              style={{
                                width: `${project.progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {project.qc}
                      </td>

                      <td className="px-6 py-5">
                        {project.shipment}
                      </td>

                      <td className="px-6 py-5">
                        {project.due}
                      </td>

                      <td className="px-6 py-5">
                        <Link
                          href={`/workspace/partner/projects/${project.id}`}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold hover:border-black transition"
                        >
                          상세관리
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-extrabold">
                  검사 요청 현황
                </h3>

                <span className="text-xs text-gray-400">
                  QC
                </span>
              </div>

              <div className="space-y-3">
                {qcRequests.map((item) => (
                  <div
                    key={item.item}
                    className="rounded-2xl border border-gray-200 bg-[#fafafa] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">
                          {item.item}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.project}
                        </p>
                      </div>

                      <span className="rounded-lg bg-black px-3 py-1 text-xs font-semibold text-white">
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        요청일 {item.requestDate}
                      </span>

                      <span>
                        결과 예정 {item.resultDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-extrabold">
                  파트너 업무 항목
                </h3>

                <span className="text-xs text-gray-400">
                  TASK
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {partnerTasks.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-[#fafafa] px-4 py-3"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                      ✓
                    </span>

                    <span className="text-xs font-semibold text-gray-700">
                      {item}
                    </span>
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