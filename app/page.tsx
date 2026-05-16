export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/main-bg.png')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#f6f6f4] via-[#f6f6f4]/95 to-[#f6f6f4]/35" />

        <div className="relative max-w-7xl mx-auto px-8 py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
              더 나은 제조를 위한
              <br />
              가장 확실한 연결
            </h1>

            <p className="text-sm text-gray-600 leading-relaxed mb-10 max-w-xl">
              G1B2B는 검증된 파트너와 효율적인 매칭으로
              제조 비즈니스의 성공을 함께 만듭니다.
            </p>

            {/* 발주 / 입찰 카드 */}
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
              {/* 발주 */}
              <a
                href="/order"
                className="group bg-white/55 backdrop-blur-md rounded-3xl p-6 shadow-sm hover:bg-white/70 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-extrabold mb-3">
                      발주
                    </h3>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      제조 발주 프로젝트를
                      확인할 수 있습니다.
                    </p>
                  </div>

                  <span className="text-2xl text-gray-400 group-hover:text-black transition">
                    →
                  </span>
                </div>
              </a>

              {/* 입찰 */}
              <a
                href="/bid"
                className="group bg-white/55 backdrop-blur-md rounded-3xl p-6 shadow-sm hover:bg-white/70 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-extrabold mb-3">
                      입찰
                    </h3>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      입찰 프로젝트를
                      확인하고 참여할 수 있습니다.
                    </p>
                  </div>

                  <span className="text-2xl text-gray-400 group-hover:text-black transition">
                    →
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 핵심 방향 */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold mb-3">
            제조 비즈니스의 모든 과정을 더 안전하고 효율적으로
          </h2>

          <p className="text-xs text-gray-500">
            파트너 검색부터 입찰, 발주, 품질 지원까지 하나의 흐름으로 관리합니다.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {/* 검증 파트너 */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold mb-3">
              검증된 파트너
            </h3>

            <p className="text-xs text-gray-500 leading-relaxed">
              등급, 실적, 인증을 기반으로
              신뢰할 수 있는 파트너를 연결합니다.
            </p>
          </div>

          {/* 입찰 발주 */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold mb-3">
              입찰 / 발주 분리
            </h3>

            <p className="text-xs text-gray-500 leading-relaxed">
              경쟁 입찰과 타겟금액 발주를 구분하여
              제조 조달 흐름을 명확히 합니다.
            </p>
          </div>

          {/* 보안 */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold mb-3">
              보안 중심 운영
            </h3>

            <p className="text-xs text-gray-500 leading-relaxed">
              도면과 대외비 데이터를 보호하고
              오프라인 입찰을 지원합니다.
            </p>
          </div>

          {/* 품질 */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold mb-3">
              품질 / 생산 지원
            </h3>

            <p className="text-xs text-gray-500 leading-relaxed">
              3차원 측정, 품질 검토,
              생산 진행률 관리까지 지원합니다.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}