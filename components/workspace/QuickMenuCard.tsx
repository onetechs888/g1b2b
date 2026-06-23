import Link from "next/link";
import {
  ClipboardList,
  FileText,
  Folder,
  History,
  MoreHorizontal,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";

const quickMenus = [
  {
    title: "생산관리",
    href: "/workspace/partner/production",
    icon: Wrench,
    className: "text-emerald-600",
  },
  {
    title: "품질관리",
    href: "/workspace/partner/quality",
    icon: ShieldCheck,
    className: "text-blue-600",
  },
  {
    title: "출하관리",
    href: "/workspace/partner/shipment",
    icon: Truck,
    className: "text-violet-600",
  },
  {
    title: "문서관리",
    href: "/workspace/partner/documents",
    icon: Folder,
    className: "text-slate-600",
  },
  {
    title: "정산관리",
    href: "/workspace/partner/settlement",
    icon: ReceiptText,
    className: "text-purple-600",
  },
  {
    title: "입찰관리",
    href: "/workspace/partner/bids",
    icon: ClipboardList,
    className: "text-orange-500",
  },
  {
    title: "발주관리",
    href: "/workspace/partner/orders",
    icon: FileText,
    className: "text-red-500",
  },
  {
    title: "이력관리",
    href: "/workspace/partner/logs",
    icon: History,
    className: "text-cyan-600",
  },
];

export default function QuickMenuCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-7 py-5">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          바로가기
        </h2>

        <p className="mt-1 text-sm font-semibold text-slate-500">
          주요 운영 메뉴로 빠르게 이동합니다.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 p-6">
        {quickMenus.map((menu) => {
          const Icon = menu.icon;

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className="
                flex h-28 flex-col items-center justify-center gap-3
                rounded-2xl
                border border-slate-200
                bg-white
                text-sm font-black
                text-slate-800
                shadow-sm
                transition-all
                hover:-translate-y-0.5
                hover:border-blue-200
                hover:bg-blue-50/50
                hover:shadow-md
              "
            >
              <Icon size={34} className={menu.className} />
              {menu.title}
            </Link>
          );
        })}

        <div
          className="
            flex h-28 flex-col items-center justify-center gap-3
            rounded-2xl
            border border-dashed border-slate-200
            bg-slate-50
            text-sm font-black
            text-slate-500
          "
        >
          <MoreHorizontal size={34} />
          더보기
        </div>
      </div>
    </div>
  );
}