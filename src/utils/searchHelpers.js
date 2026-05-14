export function searchCollectionRequests(items, searchTerm) {
  if (!searchTerm) return items;

  const keyword = searchTerm.toLowerCase().trim();

  return items.filter((item) => {
    const requestId = `cr-${String(item.id).padStart(3, "0")}`;

    return (
      requestId.toLowerCase().includes(keyword) ||
      String(item.id || "").toLowerCase().includes(keyword) ||
      String(item.request_title || "").toLowerCase().includes(keyword) ||
      String(item.barangay || "").toLowerCase().includes(keyword) ||
      String(item.collection_point || "").toLowerCase().includes(keyword) ||
      String(item.waste_type || "").toLowerCase().includes(keyword) ||
      String(item.status || "").toLowerCase().includes(keyword) ||
      String(item.schedule_group || "").toLowerCase().includes(keyword) ||
      String(item.allowed_waste_category || "").toLowerCase().includes(keyword) ||
      String(item.estimated_weight || "").toLowerCase().includes(keyword)
    );
  });
}

export function searchWasteRecords(items, searchTerm) {
  if (!searchTerm) return items;

  const keyword = searchTerm.toLowerCase().trim();

  return items.filter((item) => {
    const recordId = `rec-${String(item.id).padStart(3, "0")}`;

    return (
      recordId.toLowerCase().includes(keyword) ||
      String(item.id || "").toLowerCase().includes(keyword) ||
      String(item.route_name || "").toLowerCase().includes(keyword) ||
      String(item.collection_point || "").toLowerCase().includes(keyword) ||
      String(item.waste_type || "").toLowerCase().includes(keyword) ||
      String(item.actual_weight || "").toLowerCase().includes(keyword) ||
      String(item.collected_date || "").toLowerCase().includes(keyword) ||
      String(item.remarks || "").toLowerCase().includes(keyword)
    );
  });
}