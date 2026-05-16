export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* 좌측 */}
          <div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              제조 비즈니스의
              <br />
              새로운 연결
            </h1>

            <p className="text-base text-gray-600 leading-relaxed max-w-lg">
              고객사와 파트너사를 안전하게 연결하고,
              제조 프로젝트를 효율적으로 관리할 수 있습니다.
            </p>
          </div>

          {/* 로그인 카드 */}
          <div className="bg-white border border-gray-200 rounded-[2rem] p-10 shadow-sm">
            <h2 className="text-3xl font-extrabold mb-8">
              로그인
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="사업자번호"
                className="w-full bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-black transition"
              />

              <input
                type="password"
                placeholder="비밀번호"
                className="w-full bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-black transition"
              />

              <button className="w-full bg-black text-white rounded-2xl py-4 text-sm font-semibold hover:opacity-90 transition">
                로그인
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
              <a href="#">비밀번호 찾기</a>

              <a
                href="/signup"
                className="hover:text-black transition"
              >
                회원가입
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}