"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  orderId: number;
};

export default function ParticipationButton({ orderId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);

    const { error } = await supabase.from("participation_requests").insert([
      {
        order_id: orderId,
        partner_name: "테스트 파트너사",
        partner_grade: "B 등급",
        message: "참여 신청합니다.",
        status: "대기",
      },
    ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("참여 신청이 완료되었습니다.");
  };

  return (
    <button
      onClick={handleApply}
      disabled={loading}
      className="w-full bg-black text-white rounded-2xl py-3 text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
    >
      {loading ? "신청 중..." : "참여 신청하기"}
    </button>
  );
}