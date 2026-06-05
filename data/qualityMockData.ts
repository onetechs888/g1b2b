export const qualitySummary = {
  requested: 5,
  waiting: 3,
  inspecting: 2,
  approved: 15,
  ncr: 2,
};

export const inspections = [
  {
    id: "QC-001",
    qc_request_id: "QC-001",
    project_id: "PO-01",
    bom_item_id: "BOM-001",
    project_name: "Chamber",
    item_name: "Main Chamber",
    inspection_status: "검사대기",
    status: "대기",
  },
  {
    id: "QC-002",
    qc_request_id: "QC-002",
    project_id: "PO-02",
    bom_item_id: "BOM-011",
    project_name: "Valve Module",
    item_name: "Valve Body",
    inspection_status: "검사중",
    status: "진행중",
  },
  {
    id: "QC-003",
    qc_request_id: "QC-003",
    project_id: "PO-03",
    bom_item_id: "BOM-021",
    project_name: "Frame Assembly",
    item_name: "Base Frame",
    inspection_status: "승인완료",
    status: "완료",
  },
];