import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

replacement = """      // Merge sparse rows by columns to handle 1 value per cell spread across rows
      const colValues = headers.map(() => [] as any[]);
      let maxValsInRow = 0;

      dataRows.forEach(row => {
        let valsInRow = 0;
        row.forEach((val, colIdx) => {
          if (val !== null && val !== undefined && String(val).trim() !== '') {
            valsInRow++;
            if (colIdx < headers.length) {
              colValues[colIdx].push(val);
            }
          }
        });
        if (valsInRow > maxValsInRow) maxValsInRow = valsInRow;
      });

      if (maxValsInRow <= 2 && dataRows.length > 1) {
        let numTickets = Math.max(...colValues.map(vals => vals.length));
        if (numTickets > 0) {
          const tickets: any[][] = [];
          for (let i = 0; i < numTickets; i++) {
            const newRow: any[] = [];
            headers.forEach((h, colIdx) => {
              newRow[colIdx] = colValues[colIdx][i] !== undefined ? colValues[colIdx][i] : 
                            (colValues[colIdx].length === 1 ? colValues[colIdx][0] : undefined);
            });
            tickets.push(newRow);
          }
          dataRows = tickets;
        }
      }"""

content = re.sub(r"      // If data is very sparse and there are many rows, it might be a single ticket scattered around.*?      }", replacement, content, flags=re.MULTILINE | re.DOTALL)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
