export default function SupportPage() {
    const coreServices = [
      [
        "3차원 측정 지원",
        "정밀 측정 장비와 측정 데이터를 기반으로 품질 검토를 지원합니다.",
      ],
      [
        "품질 검토 지원",
        "도면 기준 품질 검토 및 품질 이슈 대응 프로세스를 지원합니다.",
      ],
      [
        "생산 진행률 관리",
        "프로젝트 생산 진행 상태 및 납기 일정을 체계적으로 관리합니다.",
      ],
      [
        "오프라인 입찰 지원",
        "보안이 필요한 프로젝트를 위한 오프라인 입찰 환경을 제공합니다.",
      ],
      [
        "보안 프로젝트 운영",
        "핵심 도면 및 대외비 프로젝트의 외부 유출 방지를 지원합니다.",
      ],
      [
        "고객사 / 파트너사 지원",
        "프로젝트 진행 중 필요한 운영 및 커뮤니케이션 업무를 지원합니다.",
      ],
    ];
  
    const supportWorks = [
      "프로젝트 품질 검토",
      "생산 진행률 관리",
      "납기 일정 검토",
      "오프라인 입찰 운영",
      "보안 프로젝트 지원",
      "고객사 대응 지원",
      "파트너사 운영 지원",
      "도면 및 데이터 관리",
    ];
  
    return (
      <main className="min-h-screen bg-[#f6f6f4] text-black">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-gray-200">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/service-bg.png')",
            }}
          />
  
          <div className="absolute inset-0 bg-gradient-to-r from-[#f6f6f4] via-[#f6f6f4]/95 to-[#f6f6f4]/35" />
  
          <div className="relative max-w-7xl mx-auto px-8 py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-gray-500 mb-4">
                Customer Support
              </p>
  
              <h1 className="text-5xl font-extrabold leading-tight mb-6">
                제조 프로젝트 운영,
                <br />
                G1B2B가 함께 지원합니다
              </h1>
  
              <p className="text-base text-gray-600 leading-relaxed">
                품질, 생산, 보안, 프로젝트 운영까지 제조 업무에 필요한 다양한
                지원 서비스를 제공합니다.
              </p>
            </div>
          </div>
        </section>
  
        {/* 핵심 서비스 이미지 */}
        <section className="max-w-7xl mx-auto px-8 py-16">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold mb-3">
              핵심 서비스
            </h2>
  
            <p className="text-sm text-gray-500">
              제조 프로젝트 운영과 보안 중심 지원 체계를 제공합니다.
            </p>
          </div>
  
          <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
            <img
              src="/images/service.png"
              alt="G1B2B 핵심 서비스"
              className="w-full object-cover"
            />
          </div>
        </section>
  
        {/* 지원 업무 서비스 */}
        <section className="max-w-7xl mx-auto px-8 pb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold mb-3">
              지원 업무 서비스
            </h2>
  
            <p className="text-sm text-gray-500">
              고객사와 파트너사의 안정적인 프로젝트 운영을 지원합니다.
            </p>
          </div>
  
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreServices.map(([title, desc]) => (
              <div
                key={title}
                className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm"
              >
                <h3 className="text-xl font-bold mb-4">
                  {title}
                </h3>
  
                <p className="text-sm text-gray-500 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>
  
        {/* 보안 지원 */}
        <section className="max-w-7xl mx-auto px-8 pb-24">
          <div className="bg-white border border-gray-200 rounded-[2rem] p-10 shadow-sm">
            <div className="border-l-4 border-black pl-6 mb-8">
              <p className="text-sm font-semibold text-gray-500 mb-3">
                Security Support
              </p>
  
              <h2 className="text-3xl font-extrabold mb-4">
                보안 중심 프로젝트 운영 지원
              </h2>
  
              <p className="text-sm text-gray-600 leading-relaxed max-w-4xl">
                핵심 도면 및 대외비 프로젝트의 외부 유출 방지를 위해 보안 중심
                운영 환경을 지원합니다. 필요 시 오프라인 입찰 및 제한된 접근
                권한 기반 프로젝트 운영이 가능합니다.
              </p>
            </div>
  
            <div className="grid md:grid-cols-4 gap-4">
              {supportWorks.map((item) => (
                <div
                  key={item}
                  className="border border-gray-200 rounded-2xl p-5 bg-[#fafafa]"
                >
                  <h3 className="text-sm font-bold leading-relaxed">
                    {item}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }