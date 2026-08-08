const processGrid = (grid) => {
  if (!grid || grid.length === 0) return [];
  
  grid = grid.filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''));

  const isHeader = (str) => {
    const s = String(str || '').toLowerCase().trim();
    return ['company', 'employer', 'organization', 'position', 'title', 'role', 'job title', 'status', 'stage', 'state', 'applied date', 'date', 'contact', 'notes'].some(h => s.includes(h));
  };

  const row1 = grid[0] || [];
  let row1HeaderCount = row1.filter(isHeader).length;

  const col1 = grid.map(row => row[0]);
  let col1HeaderCount = col1.filter(isHeader).length;

  let processedGrid = grid;

  if (col1HeaderCount > row1HeaderCount && col1HeaderCount >= 2) {
    console.log('Transposed detected!');
    const maxCols = Math.max(...grid.map(row => row.length));
    const newGrid = [];
    for (let c = 0; c < maxCols; c++) {
      const newRow = [];
      for (let r = 0; r < grid.length; r++) {
        newRow.push(grid[r][c]);
      }
      newGrid.push(newRow);
    }
    processedGrid = newGrid;
  }

  const headers = (processedGrid[0] || []).map(h => String(h || '').trim().toLowerCase());
  const dataRows = processedGrid.slice(1);

  return dataRows.map((row, idx) => {
    const normalized = {};
    headers.forEach((h, i) => {
      if (h) normalized[h] = row[i];
    });
    
    const company = normalized['company'] || normalized['employer'] || row[0] || 'Unknown';
    const position = normalized['position'] || normalized['title'] || row[1] || 'Unknown';
    const status = normalized['status'] || 'Applied';
    
    return { company, position, status };
  });
};

console.log('Horizontal:', processGrid([
  ["Company", "Position", "Status", "Applied Date", "Notes", "Contact"],
  ["Test 12", "SWE", "Applied", "2024-01-01", "abc", "def"]
]));

