import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

new_handle = """  const handleDataImport = async (file: File) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      let grid: any[][] = [];
      
      if (ext === 'csv') {
        grid = await new Promise<any[][]>((resolve, reject) => {
          Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data as any[][]),
            error: reject
          });
        });
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        grid = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
      } else {
        throw new Error('Unsupported file format');
      }

      if (!grid || grid.length === 0) {
        throw new Error("File is empty");
      }

      // Remove completely empty rows
      grid = grid.filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''));

      const isHeader = (str: any) => {
        const s = String(str || '').toLowerCase().trim();
        return ['company', 'employer', 'organization', 'position', 'title', 'role', 'job title', 'status', 'stage', 'state', 'applied date', 'date', 'contact', 'notes'].some(h => s.includes(h));
      };

      const row1 = grid[0] || [];
      let row1HeaderCount = row1.filter(isHeader).length;

      const col1 = grid.map(row => row[0]);
      let col1HeaderCount = col1.filter(isHeader).length;

      let processedGrid = grid;

      // Detect transposed (vertical) layout
      if (col1HeaderCount > row1HeaderCount && col1HeaderCount >= 2) {
        const maxCols = Math.max(...grid.map(row => row.length));
        const newGrid: any[][] = [];
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

      if (imports.length > 0) {
        await addApplicationsBatch(imports as any[]);
        await loadData();
        toast.success(`Imported ${imports.length} records successfully`);
        setShowImportModal(false);
      } else {
        toast.info("No valid data found in file.");
      }
    } catch (err: any) {
      console.error('Import error', err);
      setSyncError(err.message || 'Failed to import data');
      toast.error('Failed to import data');
    } finally {
      setIsSyncing(false);
    }
  };"""

content = re.sub(r"  const handleDataImport = async \(file: File\) => \{.*?^\s*};\n", new_handle, content, flags=re.MULTILINE | re.DOTALL)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
