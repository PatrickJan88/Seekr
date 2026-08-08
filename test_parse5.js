const parseSparseData = (headers, dataRows) => {
  // Extract all non-empty values for each column index
  const colValues = headers.map(() => []);

  dataRows.forEach(row => {
    row.forEach((val, colIdx) => {
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        if (colIdx < headers.length) {
          colValues[colIdx].push(val);
        } else {
          // If there are values beyond headers, we might just append them to the last header or ignore?
          // Let's just push to the last col if we must, or ignore.
        }
      }
    });
  });

  let numTickets = Math.max(...colValues.map(vals => vals.length));
  if (numTickets === 0) return [];

  const tickets = [];
  for (let i = 0; i < numTickets; i++) {
    const row = [];
    headers.forEach((h, colIdx) => {
      // If a column has fewer values, we can either repeat the last value or just leave it undefined
      // Usually, leave undefined or take the i-th value.
      row[colIdx] = colValues[colIdx][i] !== undefined ? colValues[colIdx][i] : 
                    (colValues[colIdx].length === 1 ? colValues[colIdx][0] : undefined);
    });
    tickets.push(row);
  }

  return tickets;
};

console.log("Single ticket sparse:");
console.log(parseSparseData(
  ["company", "position", "status"],
  [
    ["Test 12", "", ""],
    ["", "SWE", ""],
    ["", "", "Applied"]
  ]
));

console.log("Multiple tickets sparse:");
console.log(parseSparseData(
  ["company", "position", "status"],
  [
    ["Test 12", "", ""],
    ["", "SWE", ""],
    ["", "", "Applied"],
    ["Test 13", "", ""],
    ["", "Manager", ""]
  ]
));
console.log("Normal dense:");
console.log(parseSparseData(
  ["company", "position", "status"],
  [
    ["Test 12", "SWE", "Applied"],
    ["Test 13", "Manager", "Rejected"]
  ]
));
