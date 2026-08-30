const fs = require('fs');
let code = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf-8');

const targetHeader = `                  {/* Top Header Controls */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                    <button
                      onClick={handleExportPdf}`;
                      
const newHeader = `                  {/* Top Header Controls */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                    <button
                      onClick={handleToggleSave}
                      className={\`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-xl transition-all cursor-pointer \${
                        savedRecords.some(r => r.companyName === currentTeardown.companyName)
                          ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200'
                          : 'text-[#525866] hover:text-[#121722] bg-[#faf9f7] hover:bg-[#f4f4f5] border-[#efefef]'
                      }\`}
                      title="Save Company"
                    >
                      <Star size={14} className={savedRecords.some(r => r.companyName === currentTeardown.companyName) ? "fill-amber-500" : ""} />
                      <span className="hidden sm:inline">{savedRecords.some(r => r.companyName === currentTeardown.companyName) ? 'Saved' : 'Save'}</span>
                    </button>
                    <button
                      onClick={handleExportPdf}`;

code = code.replace(targetHeader, newHeader);

fs.writeFileSync('src/components/CompanyIntelligenceStudio.tsx', code);
