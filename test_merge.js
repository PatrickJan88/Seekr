const mergeSparseRows = (dataRows) => {
  // Check if it's sparse
  let totalValues = 0;
  let maxValuesInRow = 0;
  dataRows.forEach(row => {
    const vals = row.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    totalValues += vals.length;
    if (vals.length > maxValuesInRow) maxValuesInRow = vals.length;
  });

  // If it's very sparse (like 1 value per row) and total values is small (like 1 ticket's worth)
  if (dataRows.length > 1 && maxValuesInRow <= 2 && totalValues <= 10) {
    console.log("Merging sparse rows!");
    const mergedRow = [];
    dataRows.forEach(row => {
      row.forEach((val, c) => {
        if (val !== null && val !== undefined && String(val).trim() !== '') {
          if (!mergedRow[c]) mergedRow[c] = val;
        }
      });
    });
    return [mergedRow];
  }
  return dataRows;
};

console.log(mergeSparseRows([
  ["Google", "", "", "", "", ""],
  ["", "SWE", "", "", "", ""],
  ["", "", "Applied", "", "", ""]
]));

console.log(mergeSparseRows([
  ["Google"],
  ["SWE"],
  ["Applied"]
]));
