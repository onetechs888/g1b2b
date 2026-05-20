import Link from "next/link";

function BuildingIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="12" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 7h2M13 7h2M8 11h2M13 11h2M8 15h2M13 15h2M18 10h2v11h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FactoryIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M4 20V9l5 3V8l5 4V6h3v14H4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 16h2M13 16h2M18 16h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 5 6v5c0 4.5 2.8 8.3 7 10 4.2-1.7 7-5.5 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SummaryIcon({ type }: { type: "doc" | "users" | "check" | "truck" }) {
  if (type === "users") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 19c.7-3 2.8-5 5.5-5s4.8 2 5.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M15.5 11a2.7 2.7 0 1 0 0-5.4M17 14c1.8.6 3 2.2 3.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "check") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 4V2h6v2M8.5 12l2 2 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "truck") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M3 6h11v10H3V6ZM14 10h4l3 3v3h-7v-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function WorkspacePage() {
  const workspaceCards = [
    {
      title: "고객 업무관리",
      desc: "발주부터 납품까지, 고객 관점의 제조 프로젝트를 종합적으로 관리합니다.",
      href: "/workspace/customer",
      button: "고객 업무관리 바로가기",
      Icon: BuildingIcon,
      items: ["발주 관리", "입찰 관리", "참여 신청 업체 관리", "진행 현황 확인", "검수 요청(도면) - G1", "납품 확인"],
    },
    {
      title: "파트너 업무관리",
      desc: "수주부터 출하까지, 파트너 관점의 생산 및 납품 프로세스를 관리합니다.",
      href: "/workspace/partner",
      button: "파트너 업무관리 바로가기",
      Icon: FactoryIcon,
      items: ["발주 확인", "입찰 관리", "공정 상태 업데이트", "검사 요청(제품) - G1", "출하 등록"],
    },
    {
      title: "품질관리",
      desc: "G1B2B 검수센터에서 검사 진행 현황과 성적서 관리를 운영합니다.",
      href: "/workspace/quality",
      button: "품질관리 바로가기",
      Icon: ShieldIcon,
      items: ["검수 요청 현황", "검사 진행 현황", "성적서 관리", "출하 승인 관리"],
    },
  ];

  const summaryItems = [
    ["진행중 프로젝트", "12건", "전체 프로젝트", "doc"],
    ["참여 신청 대기", "8건", "검토 필요", "users"],
    ["검수 요청 건", "7건", "G1 검수 대기", "check"],
    ["출하 예정 건", "5건", "이번주 출하", "truck"],
  ] as const;

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:flex flex-col justify-between border-r border-gray-200 bg-white px-5 py-8">
          <div>
            <div className="mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight">G1B2B</h1>
              <p className="mt-2 text-sm text-gray-500">Manufacturing OS</p>
            </div>

            <nav className="space-y-2 text-sm">
              {[
                ["업무관리", "/workspace"],
                ["품질관리", "/workspace/quality"],
                ["설정", "/workspace/settings"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className={`block rounded-2xl px-4 py-3 font-semibold transition ${
                    label === "업무관리"
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-[#fafafa] p-5">
            <p className="text-sm font-bold">G1B2B 운영센터</p>
            <div className="mt-4 space-y-1 text-xs text-gray-500">
              <p>070-1234-5678</p>
              <p>support@g1b2b.com</p>
            </div>
          </div>
        </aside>

        <section className="px-8 py-8">
          <header className="mb-8 border-b border-gray-200 pb-8">
            <h2 className="text-3xl font-extrabold mb-3">업무관리</h2>
            <p className="text-sm text-gray-600">
              G1B2B의 업무 영역을 선택하여 고객, 파트너, 품질 흐름을 관리합니다.
            </p>
          </header>

          <section className="grid xl:grid-cols-3 gap-5">
            {workspaceCards.map((card) => {
              const Icon = card.Icon;

              return (
                <article
                  key={card.title}
                  className="flex min-h-[500px] flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-[#fafafa] text-black">
                    <Icon />
                  </div>

                  <h3 className="mb-3 text-2xl font-extrabold">{card.title}</h3>

                  <p className="mb-5 min-h-[50px] text-sm leading-relaxed text-gray-600">
                    {card.desc}
                  </p>

                  <div className="mb-7 border-t border-gray-200 pt-5">
                    <div className="space-y-3">
                      {card.items.map((item) => (
                        <div key={item} className="flex items-center gap-3">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                            ✓
                          </span>
                          <span className="text-sm font-semibold text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <Link
                      href={card.href}
                      className="block rounded-2xl bg-black px-5 py-4 text-center text-sm font-bold text-white transition hover:opacity-90"
                    >
                      {card.button} →
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h3 className="text-xl font-extrabold">오늘의 요약 현황</h3>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              {summaryItems.map(([label, value, desc, icon]) => (
                <div
                  key={label}
                  className="flex items-center gap-5 rounded-3xl border border-gray-200 bg-[#fafafa] p-5"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-black">
                    <SummaryIcon type={icon} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500">{label}</p>
                    <p className="mt-2 text-3xl font-extrabold">{value}</p>
                    <p className="mt-1 text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}