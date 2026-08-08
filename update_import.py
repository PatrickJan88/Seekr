import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

new_handle = """  const handleDataImport = async (file: File) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      let rawData: any[] = [];
      
      if (ext === 'csv') {
        rawData = await new Promise<any[]>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: reject
          });
        });
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as any[];
      } else {
        throw new Error('Unsupported file format');
      }

      console.log('Parsed raw data:', rawData);

      const imports = rawData.map((row: any) => {
        const normalized: any = {};
        const values: any[] = [];
        for (const key in row) {
          if (key && typeof key === 'string') {
            normalized[key.trim().toLowerCase()] = row[key];
          }
          if (row[key] !== null && row[key] !== undefined && row[key] !== '') {
            values.push(row[key]);
          }
        }
        return { normalized, values };
      }).filter(item => item.values.length > 0).map(item => {
        const { normalized, values } = item;
        const company = normalized['company'] || normalized['company name'] || normalized['employer'] || normalized['organization'] || values[0] || 'Unknown';
        const position = normalized['position'] || normalized['job title'] || normalized['role'] || normalized['title'] || (values.length > 1 ? values[1] : 'Unknown') || 'Unknown';
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
      });

      console.log('Processed imports:', imports);

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
