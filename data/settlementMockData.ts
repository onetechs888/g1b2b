export const settlementSummary = {
  expected: 3,
  invoiceIssued: 2,
  unpaid: 1,
  completed: 8,
};

export const settlements = [
  {
    id: "SET-001",
    settlement_id: "SET-001",
    project_id: "PO-01",
    project_name: "Chamber",
    amount: "12,000,000원",
    invoice_status: "발행대기",
    expected_payment_date: "2026-06-30",
    payment_status: "입금예정",
    status: "대기",
  },
  {
    id: "SET-002",
    settlement_id: "SET-002",
    project_id: "PO-02",
    project_name: "Valve Module",
    amount: "8,000,000원",
    invoice_status: "발행완료",
    expected_payment_date: "2026-06-28",
    payment_status: "입금예정",
    status: "진행중",
  },
  {
    id: "SET-003",
    settlement_id: "SET-003",
    project_id: "PO-03",
    project_name: "Frame Assembly",
    amount: "6,000,000원",
    invoice_status: "발행완료",
    expected_payment_date: "2026-06-25",
    payment_status: "정산완료",
    status: "완료",
  },
];