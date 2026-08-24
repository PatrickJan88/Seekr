const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

code = code.replace(
  /interface SettingsPageProps \{/,
  `interface SettingsPageProps {\n  trackingSystem?: 'industry' | 'academic';\n  setTrackingSystem?: (sys: 'industry' | 'academic') => void;`
);

code = code.replace(
  /export function SettingsPage\(\{ onBack, onClearData, isSyncing \}: SettingsPageProps\) \{/,
  `export function SettingsPage({ onBack, onClearData, isSyncing, trackingSystem = 'industry', setTrackingSystem }: SettingsPageProps) {`
);

const trackingSettingUI = `
          <div className="p-6">
            <h3 className="text-sm font-semibold text-[#121722] mb-1">Tracking System</h3>
            <p className="text-[13px] text-[#777c86] mb-4">
              Switch between Industry and Academic job markets. This changes the default database and job suggestions.
            </p>
            <div className="flex items-center gap-4">
              <select 
                value={trackingSystem} 
                onChange={(e) => setTrackingSystem?.(e.target.value as any)}
                className="w-full sm:w-64 px-3.5 py-2 border border-[#efefef] rounded-lg bg-white focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-[13px] text-[#121722] cursor-pointer"
              >
                <option value="industry">Industry Seekr</option>
                <option value="academic">Academic Seekr</option>
              </select>
            </div>
          </div>
`;

// Insert the tracking setting before SupportForm
code = code.replace(
  /<div className="p-6">\s*<SupportForm \/>\s*<\/div>/,
  `${trackingSettingUI}\n          <div className="p-6">\n            <SupportForm />\n          </div>`
);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
