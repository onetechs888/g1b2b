import { supabase } from "@/lib/supabase";
import RequestStatusButtons from "@/components/RequestStatusButtons";

export default async function RequestsPage() {
  const { data: requests } = await supabase
    .from("participation_requests")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <section className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold mb-3">
            참여 신청 관리
          </h1>

          <p className="text-sm text-gray-500">
            발주 참여 신청 현황을 확인합니다.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-[#fafafa] text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">
                    업체명
                  </th>

                  <th className="px-5 py-4 text-left font-semibold">
                    등급
                  </th>

                  <th className="px-5 py-4 text-left font-semibold">
                    메세지
                  </th>

                  <th className="px-5 py-4 text-left font-semibold">
                    상태 관리
                  </th>

                  <th className="px-5 py-4 text-left font-semibold">
                    신청일
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {requests?.length ? (
                  requests.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#fafafa]"
                    >
                      <td className="px-5 py-4 font-semibold">
                        {item.partner_name}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {item.partner_grade}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {item.message}
                      </td>

                      <td className="px-5 py-4 space-y-3">
                        <span className="inline-block px-3 py-1 rounded-full bg-black text-white text-xs">
                          {item.status}
                        </span>

                        <RequestStatusButtons
                          requestId={item.id}
                        />
                      </td>

                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {new Date(
                          item.created_at
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-gray-400 text-sm"
                    >
                      참여 신청 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}