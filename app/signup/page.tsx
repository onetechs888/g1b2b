export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <section className="max-w-7xl mx-auto px-8 py-20">
        {/* 상단 */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-extrabold mb-5">
            회원가입
          </h1>

          <p className="text-sm text-gray-600">
            가입 유형을 선택하면 해당 정보 입력 화면으로 이동합니다.
          </p>
        </div>

        {/* 가입 유형 선택 */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* 고객사 */}
          <a
            href="/signup/customer"
            className="group bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm hover:border-black transition"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold">
                고객사 가입
              </h2>

              <span className="text-xl text-gray-400 group-hover:text-black transition">
                →
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              제조 프로젝트 등록, 입찰 요청,
              발주 관리를 이용하는 기업입니다.
            </p>
          </a>

          {/* 파트너사 */}
          <a
            href="/signup/partner"
            className="group bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm hover:border-black transition"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold">
                파트너사 가입
              </h2>

              <span className="text-xl text-gray-400 group-hover:text-black transition">
                →
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              제조 입찰 참여, 수주 관리,
              품질 및 생산 업무를 진행하는 기업입니다.
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}