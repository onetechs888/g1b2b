import Link from "next/link";

function FolderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3.5 19c.7-3 2.8-5 5.5-5s4.8 2 5.5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M15.5 11a2.7 2.7 0 1 0 0-5.4M17 14c1.8.6 3 2.2 3.5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClipboardIcon() {
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
        d="M9 4V2h6v2M9 12l2 2 4-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3 4.5 7.2 12 11.5l7.5-4.3L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 7.2v8.6L12 20l7.5-4.2V7.2M12 11.5V20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SidebarIcon({ type }: { type: "work" | "quality" | "partner" | "setting" }) {
  if (type === "quality") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 3 5 6v5c0 4.5 2.8 8.3 7 10 4.2-1.7 7-5.5 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="m9 12 2 2 4-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "partner") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 19c.7-3 2.8-5 5.5-5 2 0 3.7.9 4.7 2.4M14.5 15c2.2.2 4 1.7 4.8 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "setting") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M19 13.5v-3l-2-.5-.8-1.9 1-1.8-2.1-2.1-1.8 1-1.9-.8L10 1.5H7l-.5 2-1.9.8-1.8-1L.7 5.4l1 1.8-.8 1.9-2 .5v3l2 .5.8 1.9-1 1.8 2.1 2.1 1.8-1 1.9.8.5 2h3l.5-2 1.9-.8 1.8 1 2.1-2.1-1-1.8.8-1.9 2-.6Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" transform="translate(2 1)" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function CustomerWorkspacePage() {
  const summaryCards = [
    {
      title: "진행중 프로젝트",
      value: "12",
      desc: "운영중",
      icon: <FolderIcon />,
    },
    {
      title: "참여 신청 업체",
      value: "28",
      desc: "검토 필요",
      icon: <UsersIcon />,
    },
    {
      title: "품질 검수 요청",
      value: "7",
      desc: "G1 진행",
      icon: <ClipboardIcon />,
    },
    {
      title: "납품 확인 대기",
      value: "5",
      desc: "확인 필요",
      icon: <BoxIcon />,
    },
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
                ["업무관리", "/workspace", "work"],
                ["고객 업무관리", "/workspace/customer", "work"],
                ["품질관리", "/workspace/quality", "quality"],
                ["설정", "/workspace/settings", "setting"],
              ].map(([label, href, type]) => (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition ${
                    label === "고객 업무관리"
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  <SidebarIcon type={type as "work" | "quality" | "partner" | "setting"} />
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
                    <h3 className="mt-2 text-3xl font-extrabold">{card.value}</h3>
                    <p className="mt-2 text-sm text-gray-500">{card.desc}</p>
                  </div>
                </div>
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
                          href={`/workspace/projects/${project.id}`}
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
                        <td className="px-6 py-4">
                          <span className={`rounded-md px-3 py-1 text-xs font-semibold ${item.grade === "A" ? "bg-black text-white" : "border border-gray-300"}`}>
                            {item.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-md px-3 py-1 text-xs font-semibold ${item.status === "승인" ? "bg-black text-white" : item.status === "거절" ? "bg-gray-200 text-gray-500" : "border border-gray-300"}`}>
                            {item.status}
                          </span>
                        </td>
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