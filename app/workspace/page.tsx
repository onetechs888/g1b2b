import Link from "next/link";

export default function WorkspacePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            G1 Workspace
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            역할별 Workspace로 이동합니다.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Link
            href="/workspace/customer"
            className="rounded-lg border border-gray-200 bg-white p-5 hover:bg-gray-50"
          >
            <div className="text-sm font-semibold text-gray-900">
              Customer
            </div>
            <div className="mt-2 text-xs text-gray-500">
              고객 업무관리
            </div>
          </Link>

          <Link
            href="/workspace/partner"
            className="rounded-lg border border-gray-200 bg-white p-5 hover:bg-gray-50"
          >
            <div className="text-sm font-semibold text-gray-900">
              Partner
            </div>
            <div className="mt-2 text-xs text-gray-500">
              파트너 생산관리
            </div>
          </Link>

          <Link
            href="/workspace/quality"
            className="rounded-lg border border-gray-200 bg-white p-5 hover:bg-gray-50"
          >
            <div className="text-sm font-semibold text-gray-900">
              Quality
            </div>
            <div className="mt-2 text-xs text-gray-500">
              품질관리
            </div>
          </Link>

          <Link
            href="/workspace/admin"
            className="rounded-lg border border-gray-200 bg-white p-5 hover:bg-gray-50"
          >
            <div className="text-sm font-semibold text-gray-900">
              Admin
            </div>
            <div className="mt-2 text-xs text-gray-500">
              관리자 Workspace
            </div>
          </Link>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">
            현재 구조
          </h2>

          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <p>customer → /workspace/customer</p>
            <p>partner → /workspace/partner</p>
            <p>quality_manager → /workspace/quality</p>
            <p>g1_admin → /workspace/admin</p>
          </div>
        </div>
      </div>
    </main>
  );
}