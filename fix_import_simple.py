import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

replacement = """
      const isHeader = (str: any) => {
        const s = String(str || '').toLowerCase().trim();
        return ['company', 'employer', 'organization', 'position', 'title', 'role', 'job title', 'status', 'stage', 'state', 'applied date', 'date', 'contact', 'notes'].some(h => s.includes(h));
      };

      // Find the header row index
      let headerRowIndex = 0;
      let maxHeaders = 0;
      
      for (let i = 0; i < Math.min(10, grid.length); i++) {
        const count = grid[i].filter(isHeader).length;
        if (count > maxHeaders) {
          maxHeaders = count;
          headerRowIndex = i;
        }
      }

      // If we couldn't find a clear header row, default to first row
      if (maxHeaders === 0) {
        headerRowIndex = 0;
      }

      let headers = (grid[headerRowIndex] || []).map(h => String(h || '').trim().toLowerCase());
      
      // If headers are completely missing or empty, generate fallback headers
      if (headers.filter(h => h).length === 0) {
        headers = ['company', 'position', 'status', 'applied date', 'notes', 'contact'];
      }
      
      let dataRows = grid.slice(headerRowIndex + 1);

      const imports = dataRows.map(row => {
        const normalized: any = {};
        headers.forEach((h, i) => {
          if (h) normalized[h] = row[i];
        });
        
        const company = normalized['company'] || normalized['company name'] || normalized['employer'] || normalized['organization'] || row[0] || 'Unknown';
        const position = normalized['position'] || normalized['job title'] || normalized['role'] || normalized['title'] || row[1] || 'Unknown';
        
        let st = String(normalized['status'] || normalized['stage'] || normalized['state'] || 'Applied').trim();
        st = st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
        if (!['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'].includes(st)) {
          st = 'Applied';
        }
        
        let appliedDate = normalized['applied date'] || normalized['applied_date'] || normalized['date applied'] || normalized['date'];
        
        if (typeof appliedDate === 'number') {
           const date = new Date(Math.round((appliedDate - 25569) * 86400 * 1000));
           appliedDate = date.toISOString();
        } else if (!appliedDate) {
           appliedDate = new Date().toISOString();
        } else {
           appliedDate = String(appliedDate);
        }
        
        return {
          company: String(company),
          position: String(position),
          status: st,
          appliedDate: appliedDate,
          userId: auth.currentUser!.uid
        };
      }).filter(item => item.company !== 'Unknown' || item.position !== 'Unknown');
"""

# Strip out everything between `const isHeader = ...` and `const imports = dataRows.map(row => {`
# and replace with the simple logic.
content = re.sub(r"      const isHeader = \(str: any\) => \{.*?(?=const imports = dataRows\.map\(row => \{)", replacement, content, flags=re.MULTILINE | re.DOTALL)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
