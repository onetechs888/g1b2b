import Link from "next/link";

const quickMenus = [
  {
    title: "생산관리",
    href: "/workspace/partner/production",
  },
  {
    title: "품질관리",
    href: "/workspace/partner/quality",
  },
  {
    title: "출하관리",
    href: "/workspace/partner/shipment",
  },
  {
    title: "문서관리",
    href: "/workspace/partner/documents",
  },
  {
    title: "정산관리",
    href: "/workspace/partner/settlement",
  },
  {
    title: "입찰관리",
    href: "/workspace/partner/bids",
  },
  {
    title: "발주관리",
    href: "/workspace/partner/orders",
  },
  {
    title: "이력관리",
    href: "/workspace/partner/logs",
  },
];

export default function QuickMenuCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-xl font-bold text-slate-900">
          바로가기
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          주요 운영 메뉴로 빠르게 이동합니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-5">
        {quickMenus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className="
              flex items-center justify-center
              rounded-xl
              border border-slate-200
              bg-white
              px-4 py-4
              text-sm font-semibold
              text-slate-700
              transition-all
              hover:border-blue-300
              hover:bg-blue-50
              hover:text-blue-700
            "
          >
            {menu.title}
          </Link>
        ))}
      </div>
    </div>
  );
}