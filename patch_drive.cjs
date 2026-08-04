const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const targetDrive = `</label>
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
                      setSyncError('Google Drive access token missing. Please sign out and sign in again.');
                      return;
                    }
                    
                    const response = await fetch(\`https://www.googleapis.com/drive/v3/files/\${fileId}/export?mimeType=text/plain\`, {
                      headers: {
                        Authorization: \`Bearer \${accessToken}\`,
                      },
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to fetch from Google Drive');
                    }
                    
                    const text = await response.text();
                    
                    const prompt = \`Extract job applications from this document.
Return ONLY a valid JSON array of objects, with no markdown formatting or extra text.
Each object MUST have these EXACT keys: "company" (string), "position" (string), "status" (string: "Applied"|"Screening"|"Technical"|"Final"|"Offer"|"Rejected"|"Ghosted"), "appliedDate" (YYYY-MM-DD string).

Document content:
\${text.substring(0, 5000)}\`;
                    
                    const result = await fetch('/api/gemini', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ prompt })
                    });
                    
                    if (!result.ok) throw new Error('AI processing failed');
                    
                    const data = await result.json();
                    const apps = JSON.parse(data.text);
                    
                    const appsToImport = apps.map((app: any) => ({
                       company: app.company,
                       position: app.position,
                       status: app.status || 'Applied',
                       appliedDate: app.appliedDate || new Date().toISOString().split('T')[0],
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
              </button>
              <button`;

const newDrive = `</label>
              <button`;
              
code = code.replace(targetDrive, newDrive);
fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Patched drive button");
