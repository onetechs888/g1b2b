import {
  Bell,
  CircleDollarSign,
  ClipboardCheck,
  Factory,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Truck,
} from "lucide-react";

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

function getEventIcon(category: string) {
  if (category === "생산") return Factory;
  if (category === "품질") return ShieldCheck;
  if (category === "NCR") return ShieldAlert;
  if (category === "출하") return Truck;
  if (category === "정산") return CircleDollarSign;
  if (category === "문서") return FileText;
  if (category === "영업") return ClipboardCheck;
  return Bell;
}

function getEventColor(category: string) {
  if (category === "생산") return "text-emerald-600";
  if (category === "품질") return "text-blue-600";
  if (category === "NCR") return "text-red-600";
  if (category === "출하") return "text-violet-600";
  if (category === "정산") return "text-purple-600";
  if (category === "문서") return "text-slate-600";
  if (category === "영업") return "text-orange-600";
  return "text-slate-500";
}

export default function RecentEventsCard({ events }: RecentEventsCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          최근 주요 운영 이벤트
        </h2>

        <button className="text-xs font-black text-blue-600">전체보기 ›</button>
      </div>

      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-black text-slate-500">
              <th className="px-2 py-3 text-left">시간</th>
              <th className="px-2 py-3 text-left">구분</th>
              <th className="px-2 py-3 text-left">이벤트</th>
              <th className="px-2 py-3 text-left">프로젝트 / 품목</th>
              <th className="px-2 py-3 text-left">처리자</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event, index) => {
              const Icon = getEventIcon(event.category);

              return (
                <tr
                  key={`${event.time}-${event.category}-${event.event}-${index}`}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-2 py-3 text-xs font-black text-slate-800">
                    {event.time}
                  </td>

                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                      <Icon
                        size={15}
                        className={getEventColor(event.category)}
                      />
                      {event.category}
                    </div>
                  </td>

                  <td className="px-2 py-3 text-xs font-bold text-slate-800">
                    {event.event}
                  </td>

                  <td className="px-2 py-3 text-xs font-semibold text-slate-600">
                    {event.target}
                  </td>

                  <td className="px-2 py-3 text-xs font-bold text-slate-700">
                    {event.owner}
                  </td>
                </tr>
              );
            })}

            {events.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm font-bold text-slate-400"
                >
                  최근 운영 이벤트가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="pt-4 text-right text-xs font-bold text-slate-500">
          전체 {events.length}건 이벤트
        </div>
      </div>
    </div>
  );
}