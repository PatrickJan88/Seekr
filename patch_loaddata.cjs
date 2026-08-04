const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const targetLoadData = `const loadData = async () => {
    if (!auth.currentUser) return;
    try {
      console.log('Loading applications...');
      const data = await getApplications(auth.currentUser.uid);
      console.log(\`Loaded \${data.length} applications.\`);
      setApplications(data);
    } catch (err) {
      console.error('Failed to load apps', err);
    } finally {
      setLoading(false);
    }
  };`;

const newLoadData = `const loadData = async () => {
    if (!auth.currentUser) return;
    try {
      console.log('Loading applications...');
      const data = await getApplications(auth.currentUser.uid);
      console.log(\`Loaded \${data.length} applications.\`);
      
      const validStatuses = ['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];
      const normalizedData = data.map(app => {
        let st = app.status;
        if (st) {
          st = st.trim();
          st = st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
        }
        if (!validStatuses.includes(st)) {
          st = 'Applied';
        }
        return { ...app, status: st };
      });
      
      setApplications(normalizedData);
    } catch (err) {
      console.error('Failed to load apps', err);
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(targetLoadData, newLoadData);

const oldCsv = `const imports = results.data.filter((row: any) => row.Company || row.company).map((row: any) => ({
            company: row.Company || row.company || 'Unknown',
            position: row.Position || row.position || 'Unknown',
            status: row.Status || row.status || 'Applied',
            appliedDate: row.Applied_Date || row.appliedDate || new Date().toISOString(),
            userId: auth.currentUser!.uid
          }));`;
          
const newCsv = `const imports = results.data.filter((row: any) => row.Company || row.company).map((row: any) => {
            let st = (row.Status || row.status || 'Applied').trim();
            st = st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
            if (!['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'].includes(st)) {
              st = 'Applied';
            }
            return {
              company: row.Company || row.company || 'Unknown',
              position: row.Position || row.position || 'Unknown',
              status: st,
              appliedDate: row.Applied_Date || row.appliedDate || new Date().toISOString(),
              userId: auth.currentUser!.uid
            };
          });`;

code = code.replace(oldCsv, newCsv);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Patched loadData and CSV import");
