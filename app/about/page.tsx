export default function AboutPage() {
  const customerSteps = [
    "회원가입 및 고객사 정보 등록",
    "입찰 또는 발주 방식 선택",
    "도면 및 요구사항 등록",
    "파트너 견적 / 참여 신청 확인",
    "파트너 선정 및 프로젝트 진행",
  ];

  const partnerSteps = [
    "파트너 회원가입 및 회사 정보 등록",
    "업종 / 설비 / 인증 / 지역 정보 입력",
    "기업 등급 부여",
    "입찰 또는 발주 건 참여",
    "실적 누적 및 분기별 등급 상향 심사 요청",
  ];

  const grades = [
    ["D 등급", "D3 ~ D1"],
    ["C 등급", "C3 ~ C1"],
    ["B 등급", "B3 ~ B1"],
    ["A 등급", "A3 ~ A1"],
  ];

  const gradeLevels = [
    "D3",
    "D2",
    "D1",
    "C3",
    "C2",
    "C1",
    "B3",
    "B2",
    "B1",
    "A3",
    "A2",
    "A1",
  ];

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/about-bg.png')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#f6f6f4] via-[#f6f6f4]/95 to-[#f6f6f4]/35" />

        <div className="relative max-w-7xl mx-auto px-8 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-gray-500 mb-4">
              Platform Guide
            </p>

            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              G1B2B 이용안내
            </h1>

            <p className="text-base text-gray-600 leading-relaxed">
              고객사와 파트너사를 연결하고, 더 안전하고 효율적인 제조 협업을
              지원하는 G1B2B 플랫폼 이용 방법을 안내합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 고객사 / 파트너사 흐름 */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 고객사 */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold mb-3">
              고객사 이용 흐름
            </h2>

            <p className="text-sm text-gray-500 mb-8">
              제조 프로젝트를 등록하고 적합한 파트너를 선정하는 흐름입니다.
            </p>

            <div className="space-y-4">
              {customerSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 border border-gray-200 rounded-2xl p-4"
                >
                  <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>

                  <p className="text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 파트너사 */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold mb-3">
              파트너사 이용 흐름
            </h2>

            <p className="text-sm text-gray-500 mb-8">
              회사 정보를 등록하고 프로젝트에 참여하는 흐름입니다.
            </p>

            <div className="space-y-4">
              {partnerSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 border border-gray-200 rounded-2xl p-4"
                >
                  <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>

                  <p className="text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 입찰 / 발주 차이 */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold mb-3">
            입찰과 발주의 차이
          </h2>

          <p className="text-sm text-gray-500">
            프로젝트 성격에 따라 입찰 방식과 발주 방식을 구분하여 사용할 수 있습니다.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 입찰 */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <p className="text-sm font-semibold text-gray-500 mb-3">
              Bid
            </p>

            <h3 className="text-2xl font-extrabold mb-4">
              입찰
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              고객사가 도면과 요구사항을 등록하면 여러 파트너사가 견적을
              제안하는 방식입니다. 견적, 납기, 품질 대응력 등을 비교하여
              최적의 파트너를 선정할 수 있습니다.
            </p>

            <ul className="space-y-2 text-sm text-gray-500">
              <li>• 견적 비교 중심 프로젝트</li>
              <li>• 협의형 제조 프로젝트</li>
              <li>• 복수 업체 견적 검토</li>
            </ul>
          </div>

          {/* 발주 */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <p className="text-sm font-semibold text-gray-500 mb-3">
              Order
            </p>

            <h3 className="text-2xl font-extrabold mb-4">
              발주
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              고객사가 타겟금액과 납기 조건을 정해 등록하는 방식입니다.
              조건에 맞는 파트너사가 참여 신청을 하고 고객사가 선택할 수 있습니다.
            </p>

            <ul className="space-y-2 text-sm text-gray-500">
              <li>• 타겟금액 기반 프로젝트</li>
              <li>• 반복 생산 및 양산 품목</li>
              <li>• 조건 기반 참여 신청</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 등급 체계 */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold mb-3">
            기업 등급 체계
          </h2>

          <p className="text-sm text-gray-500">
            품질, 운영 시스템, 수행 이력 등을 기반으로 D3부터 A1까지 기업 등급을 구분합니다.
          </p>
        </div>

        {/* 등급 리스트 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {gradeLevels.map((grade) => (
            <div
              key={grade}
              className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm"
            >
              <div className="text-2xl font-extrabold mb-1">
                {grade}
              </div>

              <div className="text-xs text-gray-500">
                기업 등급
              </div>
            </div>
          ))}
        </div>

        {/* 등급 설명 */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <h3 className="text-2xl font-extrabold mb-6">
            등급별 프로젝트 참여 체계
          </h3>

          <div className="grid md:grid-cols-4 gap-4">
            {grades.map(([title, range]) => (
              <div
                key={title}
                className="border border-gray-200 rounded-2xl p-5"
              >
                <h4 className="text-lg font-bold mb-1">
                  {title}
                </h4>

                <p className="text-xs text-gray-500 mb-4">
                  {range}
                </p>

                <p className="text-sm text-gray-600 leading-relaxed">
                  등급에 따라 참여 가능한 프로젝트 범위와
                  입찰 조건이 달라질 수 있습니다.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 분기별 등급 상향 심사 */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <div className="bg-white border border-gray-200 rounded-[2rem] p-10 shadow-sm">
          <div className="border-l-4 border-black pl-6 mb-8">
            <p className="text-sm font-semibold text-gray-500 mb-3">
              Quarterly Grade Review
            </p>

            <h2 className="text-3xl font-extrabold mb-4">
              분기별 업체 등급 상향 심사 요청
            </h2>

            <p className="text-sm text-gray-600 leading-relaxed max-w-4xl">
              파트너사는 수행 실적, 품질 대응 이력, 납기 준수율, 인증 현황,
              고객 평가 등을 기반으로 분기별 등급 상향 심사를 요청할 수 있습니다.
              등급이 상향되면 더 높은 수준의 프로젝트 참여 기회가 제공될 수 있습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              "수행 실적",
              "품질 대응 이력",
              "납기 준수율",
              "인증 및 설비 현황",
            ].map((item) => (
              <div
                key={item}
                className="border border-gray-200 rounded-2xl p-5 bg-[#fafafa]"
              >
                <h3 className="text-sm font-bold">
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