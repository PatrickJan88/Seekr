const processMessyGrid = (headers, dataRows) => {
  let allValues = [];
  dataRows.forEach(row => {
    row.forEach(val => {
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        allValues.push(val);
      }
    });
  });

  if (dataRows.length > 1 && allValues.length <= headers.length + 2 && allValues.length > 0) {
    console.log("Flattening messy single-ticket data!");
    const mergedRow = [];
    allValues.forEach((val, i) => {
      mergedRow[i] = val;
    });
    return [mergedRow];
  }
  return dataRows;
};

console.log(processMessyGrid(
  ["company", "position", "status", "date", "notes", "contact"],
  [ ["Google"], ["SWE"], ["Applied"], ["2024-01-01"], ["abc"], ["def"] ]
));

console.log(processMessyGrid(
  ["company", "position", "status", "date", "notes", "contact"],
  [ ["Google", "", "", "", "", ""], ["", "SWE", "", "", "", ""] ]
));
