interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const colors = {
    진행중: "bg-blue-100 text-blue-700",
    완료: "bg-green-100 text-green-700",
    대기: "bg-gray-100 text-gray-700",
    주의: "bg-orange-100 text-orange-700",
    NCR: "bg-red-100 text-red-700",
  };

  const color =
    colors[status as keyof typeof colors] ||
    "bg-gray-100 text-gray-700";

  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}