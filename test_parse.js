const detectOrientation = (grid) => {
  if (grid.length === 0) return [];
  
  // Clean grid
  const cleanGrid = grid.map(row => row.map(cell => String(cell || '').trim()));
  
  const isHeader = (str) => {
    const s = str.toLowerCase();
    return s.includes('company') || s.includes('employer') || s.includes('position') || s.includes('title') || s.includes('role') || s.includes('status');
  };

  // Check first row
  const row1 = cleanGrid[0];
  let row1HeaderCount = row1.filter(isHeader).length;
  
  // Check first column
  const col1 = cleanGrid.map(row => row[0]);
  let col1HeaderCount = col1.filter(isHeader).length;
  
  console.log('Row 1 header count:', row1HeaderCount, 'Col 1 header count:', col1HeaderCount);
}

detectOrientation([
  ["Company", "Position", "Status"],
  ["Google", "SWE", "Applied"]
]);

detectOrientation([
  ["Company", "Google"],
  ["Position", "SWE"],
  ["Status", "Applied"]
]);
