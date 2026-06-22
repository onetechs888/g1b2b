interface EventItem {
  time: string;
  category: string;
  event: string;
  target: string;
  owner: string;
}

interface RecentEventsCardProps {
  events: EventItem[];
}

export default function RecentEventsCard({
  events,
}: RecentEventsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-xl font-bold text-slate-900">
          최근 주요 운영 이벤트
        </h2>

        <button className="text-sm font-semibold text-blue-600">
          전체보기 ›
        </button>
      </div>

      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500">
              <th className="px-3 py-3 text-left">시간</th>
              <th className="px-3 py-3 text-left">구분</th>
              <th className="px-3 py-3 text-left">이벤트</th>
              <th className="px-3 py-3 text-left">프로젝트 / 품목</th>
              <th className="px-3 py-3 text-left">처리자</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event, index) => (
              <tr
                key={index}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="px-3 py-4 text-sm font-medium">
                  {event.time}
                </td>

                <td className="px-3 py-4 text-sm">
                  {event.category}
                </td>

                <td className="px-3 py-4 text-sm font-medium text-slate-800">
                  {event.event}
                </td>

                <td className="px-3 py-4 text-sm text-slate-600">
                  {event.target}
                </td>

                <td className="px-3 py-4 text-sm">
                  {event.owner}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-4 text-right text-sm text-slate-500">
          전체 {events.length}건 이벤트
        </div>
      </div>
    </div>
  );
}