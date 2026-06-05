interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export default function KpiCard({
  title,
  value,
  description,
}: KpiCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{title}</p>

      <div className="mt-2 text-2xl font-semibold text-gray-900">
        {value}
      </div>

      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}