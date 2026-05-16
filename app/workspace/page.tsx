export default function WorkspacePage() {
    const customerProjects = [
      {
        title: "알루미늄 브라켓 1,000EA 제작",
        type: "발주중",
        category: "MCT · CNC 가공",
        status: "파트너 참여 접수중",
        deadline: "2026-06-30",
      },
      {
        title: "판금 케이스 제작",
        type: "입찰중",
        category: "판금 · 레이저",
        status: "견적 검토중",
        deadline: "2026-07-10",
      },
      {
        title: "자동화 장비 커버 제작",
        type: "진행중",
        category: "판금 · 절곡",
        status: "생산 진행률 45%",
        deadline: "2026-08-20",
      },
    ];
  
    const partnerProjects = [
      {
        title: "정밀 가이드 블록 가공",
        type: "수주중",
        category: "MCT · CNC 가공",
        status: "가공 진행중",
        deadline: "2026-08-14",
      },
      {
        title: "스틸 베이스 프레임 제작",
        type: "입찰 참여",
        category: "용접 · 제관",
        status: "견적 제출 완료",
        deadline: "2026-08-05",
      },
      {
        title: "플라스틱 커버 3,000EA 사출",
        type: "품질 대응",
        category: "사출성형",
        status: "초도품 검토 요청",
        deadline: "2026-07-22",
      },
    ];
  
    return (
      <main className="min-h-screen bg-[#f6f6f4] text-black">
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-20">
            <p className="text-sm font-semibold text-gray-500 mb-4">
              Work Management
            </p>
  
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              업무관리
            </h1>
  
            <p className="text-base text-gray-600 leading-relaxed max-w-3xl">
              고객사는 발주중인 품목과 입찰중인 프로젝트를 확인하고,
              파트너사는 수주중인 품목과 참여 현황을 관리할 수 있습니다.
            </p>
          </div>
        </section>
  
        <section className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">고객사</p>
              <h3 className="text-2xl font-extrabold">3건</h3>
              <p className="text-xs text-gray-500 mt-2">진행 프로젝트</p>
            </div>
  
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">파트너사</p>
              <h3 className="text-2xl font-extrabold">3건</h3>
              <p className="text-xs text-gray-500 mt-2">참여 프로젝트</p>
            </div>
  
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">품질 / 생산</p>
              <h3 className="text-2xl font-extrabold">1건</h3>
              <p className="text-xs text-gray-500 mt-2">검토 필요</p>
            </div>
  
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">납기</p>
              <h3 className="text-2xl font-extrabold">2건</h3>
              <p className="text-xs text-gray-500 mt-2">일정 확인 필요</p>
            </div>
          </div>
        </section>
  
        <section className="max-w-7xl mx-auto px-8 pb-16">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold mb-2">
                  고객사 업무 현황
                </h2>
  
                <p className="text-sm text-gray-500">
                  발주중인 품목, 입찰중인 프로젝트, 진행중 프로젝트를 확인합니다.
                </p>
              </div>
  
              <div className="space-y-4">
                {customerProjects.map((project) => (
                  <div
                    key={project.title}
                    className="border border-gray-200 rounded-2xl p-5 bg-[#fafafa]"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-xs text-gray-500">
                          {project.type}
                        </span>
  
                        <h3 className="text-base font-bold mt-1">
                          {project.title}
                        </h3>
                      </div>
  
                      <span className="text-xs border border-gray-300 rounded-full px-3 py-1 bg-white">
                        {project.category}
                      </span>
                    </div>
  
                    <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-600">
                      <p>상태: {project.status}</p>
                      <p>납기: {project.deadline}</p>
                    </div>
  
                    <button className="mt-4 w-full bg-black text-white rounded-xl px-4 py-2 text-xs font-semibold hover:opacity-90 transition">
                      상세 관리
                    </button>
                  </div>
                ))}
              </div>
            </div>
  
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold mb-2">
                  파트너사 업무 현황
                </h2>
  
                <p className="text-sm text-gray-500">
                  수주중인 품목, 입찰 참여 현황, 품질 대응 상태를 확인합니다.
                </p>
              </div>
  
              <div className="space-y-4">
                {partnerProjects.map((project) => (
                  <div
                    key={project.title}
                    className="border border-gray-200 rounded-2xl p-5 bg-[#fafafa]"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-xs text-gray-500">
                          {project.type}
                        </span>
  
                        <h3 className="text-base font-bold mt-1">
                          {project.title}
                        </h3>
                      </div>
  
                      <span className="text-xs border border-gray-300 rounded-full px-3 py-1 bg-white">
                        {project.category}
                      </span>
                    </div>
  
                    <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-600">
                      <p>상태: {project.status}</p>
                      <p>납기: {project.deadline}</p>
                    </div>
  
                    <button className="mt-4 w-full border border-gray-300 bg-white rounded-xl px-4 py-2 text-xs font-semibold hover:border-black transition">
                      상세 관리
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
  
        <section className="max-w-7xl mx-auto px-8 pb-24">
          <div className="bg-white border border-gray-200 rounded-[2rem] p-10 shadow-sm">
            <div className="border-l-4 border-black pl-6 mb-8">
              <p className="text-sm font-semibold text-gray-500 mb-3">
                Project Operation
              </p>
  
              <h2 className="text-3xl font-extrabold mb-4">
                진행 프로젝트 통합 관리
              </h2>
  
              <p className="text-sm text-gray-600 leading-relaxed max-w-4xl">
                발주, 입찰, 수주, 품질 대응, 생산 진행률, 납기 확인까지
                제조 프로젝트 진행 상황을 하나의 업무관리 화면에서 확인할 수 있도록
                확장할 예정입니다.
              </p>
            </div>
  
            <div className="grid md:grid-cols-4 gap-4">
              {[
                "발주중 품목",
                "입찰중 프로젝트",
                "수주중 품목",
                "품질 / 납기 대응",
              ].map((item) => (
                <div
                  key={item}
                  className="border border-gray-200 rounded-2xl p-5 bg-[#fafafa]"
                >
                  <h3 className="text-sm font-bold">{item}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }