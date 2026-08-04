const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const targetStr = `              </label>
              <button
                onClick={async () => {
                  if (!auth.currentUser || isSyncing) return;`;

const endStr = `              >
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {isSyncing ? 'Syncing...' : 'Sync from Google Drive'}
              </button>`;

const replaceStr = `              </label>
              <label className={\`flex items-center gap-2 cursor-pointer border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold text-sm text-slate-600 transition-colors \${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}\`}>
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {isSyncing ? 'Syncing...' : 'Sync PDF Data'}
                <input type="file" accept=".pdf" className="hidden" onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !auth.currentUser || isSyncing) return;
                  
                  setIsSyncing(true);
                  setSyncError(null);
                  
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    try {
                      const base64Data = (event.target?.result as string).split(',')[1];
                      const res = await fetch('/api/extract-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pdfBase64: base64Data })
                      });
                      if (!res.ok) {
                        const txt = await res.text();
                        throw new Error(txt);
                      }
                      const data = await res.json();
                      
                      const appsToImport = data.applications.map((app: any) => ({
                         ...app,
                         appliedDate: new Date().toISOString(),
                         userId: auth.currentUser!.uid,
                      }));
                      if (appsToImport.length > 0) {
                        await addApplicationsBatch(appsToImport);
                        await loadData();
                        alert(\`Successfully synced \${appsToImport.length} records from PDF!\`);
                      } else {
                        alert('No job applications found in PDF.');
                      }
                    } catch(err: any) {
                      console.error(err);
                      setSyncError(err.message || 'Failed to sync PDF');
                      alert('Failed to sync PDF');
                    } finally {
                      setIsSyncing(false);
                    }
                  };
                  reader.readAsDataURL(file);
                }} disabled={isSyncing} />
              </label>
              <button
                onClick={async () => {
                  const link = window.prompt("Paste your Google Drive document link:");
                  if (!link || !auth.currentUser || isSyncing) return;
                  
                  const fileIdMatch = link.match(/[-\\w]{25,}/);
                  if (!fileIdMatch) {
                    alert('Invalid Google Drive link');
                    return;
                  }
                  const fileId = fileIdMatch[0];
                
                  setIsSyncing(true);
                  setSyncError(null);
                  
                  try {
                    const accessToken = await getAccessToken();
                    if (!accessToken) {
                      throw new Error('Not authenticated with Google OAuth. Please log in again.');
                    }
                    
                    const res = await fetch('/api/extract-drive', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ fileId, accessToken })
                    });
                    if (!res.ok) {
                       const txt = await res.text();
                       throw new Error(txt);
                    }
                    const data = await res.json();
                    
                    const appsToImport = data.applications.map((app: any) => ({
                       ...app,
                       appliedDate: new Date().toISOString(),
                       userId: auth.currentUser!.uid,
                    }));
                    if (appsToImport.length > 0) {
                      await addApplicationsBatch(appsToImport);
                      await loadData();
                      alert(\`Successfully synced \${appsToImport.length} records from Drive!\`);
                    } else {
                      alert('No job applications found in Drive document.');
                    }
                  } catch(err: any) {
                    console.error(err);
                    setSyncError(err.message || 'Failed to sync from Drive');
                    alert('Failed to sync from Drive');
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                disabled={isSyncing}
                className={\`flex items-center gap-2 border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold text-sm text-slate-600 transition-colors \${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}\`}
              >
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {isSyncing ? 'Syncing...' : 'Sync from Google Drive'}
              </button>`;

const startIndex = code.indexOf(targetStr);
const endIndex = code.indexOf(endStr) + endStr.length;
if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replaceStr + code.substring(endIndex);
  fs.writeFileSync('src/components/Dashboard.tsx', code);
  console.log("Success");
} else {
  console.log("Failed to find target string", startIndex, endIndex);
}
