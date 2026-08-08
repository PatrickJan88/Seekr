const parseData = (grid) => {
  if (!grid || grid.length === 0) return [];
  
  // Clean grid
  grid = grid.filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''));
  if (grid.length === 0) return [];
  
  const headers = (grid[0] || []).map(h => String(h || '').trim().toLowerCase());
  const dataRows = grid.slice(1);
  
  const imports = dataRows.map(row => {
    const normalized = {};
    headers.forEach((h, i) => {
      if (h) normalized[h] = row[i];
    });
    
    return normalized;
  });
  
  return imports;
};

console.log(parseData([
  ["Company", "Position", "Status"],
  ["Test 12", "SWE", "Applied"]
]));
