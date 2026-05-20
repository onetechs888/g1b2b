"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  requestId: number;
};

export default function RequestStatusButtons({ requestId }: Props) {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);

    const { error } = await supabase
      .from("participation_requests")
      .update({ status })
      .eq("id", requestId);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(`상태가 ${status}로 변경되었습니다.`);
    window.location.reload();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => updateStatus("승인")}
        disabled={loading}
        className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        승인
      </button>

      <button
        onClick={() => updateStatus("검토중")}
        disabled={loading}
        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold disabled:opacity-50"
      >
        검토중
      </button>

      <button
        onClick={() => updateStatus("거절")}
        disabled={loading}
        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500 disabled:opacity-50"
      >
        거절
      </button>
    </div>
  );
}