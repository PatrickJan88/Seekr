const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

// Ensure useState is imported
if (!code.includes('useState')) {
  code = code.replace(
    `import React from 'react';`,
    `import React, { useState } from 'react';`
  );
}

// Add state variables and handleDeleteAccount inside SettingsPage
const stateToAdd = `
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      if (auth.currentUser) {
        await auth.currentUser.delete();
        logout();
      }
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        alert("This operation is sensitive and requires recent authentication. Please log in again before retrying.");
        logout();
      } else {
        alert("Failed to delete account. Please try again.");
      }
    }
  };
`;

code = code.replace(
  `export function SettingsPage({ onBack, onClearData, isSyncing }: SettingsPageProps) {`,
  `export function SettingsPage({ onBack, onClearData, isSyncing }: SettingsPageProps) {\n${stateToAdd}`
);

// Replace Logout button to open modal
code = code.replace(
  `onClick={() => { onBack(); logout(); }}`,
  `onClick={() => setShowLogoutConfirm(true)}`
);

// Replace version
code = code.replace(`Version 2.0.0`, `Version 3.0.0`);

// Replace Delete Data section to use Vercel layout, and add Delete Account
const deleteDataOriginal = `
          <div className="p-6">
            <h3 className="text-sm font-semibold text-[#121722] mb-1">Delete Data</h3>
            <p className="text-xs text-[#777c86] mb-4">
              Permanently remove your job applications. This action is not reversible, so please continue with caution.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-50/50 border border-red-100 rounded-2xl">
              <span className="text-xs text-red-600 font-medium">Proceed with caution.</span>
              <button
                onClick={() => { onBack(); onClearData(); }}
                disabled={isSyncing}
                className="inline-flex items-center justify-center rounded-full text-xs font-medium transition-all bg-red-600 hover:bg-red-700 text-white shadow-2xs h-8 px-4 cursor-pointer self-start sm:self-center"
              >
                Clear All Data
              </button>
            </div>
          </div>
`;

const vercelSections = `
          <div className="p-6 flex flex-col gap-8">
            {/* Delete Data */}
            <div className="border border-red-200 rounded-lg overflow-hidden shadow-2xs">
              <div className="p-5 bg-white">
                <h4 className="text-[15px] font-bold text-[#121722] mb-1">Delete Data</h4>
                <p className="text-[13px] text-[#777c86]">
                  Permanently remove your job applications. This action is not reversible, so please continue with caution.
                </p>
              </div>
              <div className="px-5 py-3.5 bg-red-50 flex items-center justify-end border-t border-red-100">
                <button
                  onClick={() => { onBack(); onClearData(); }}
                  disabled={isSyncing}
                  className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium px-4 py-2 rounded-[6px] transition-colors text-[13px] shadow-sm cursor-pointer"
                >
                  Clear All Data
                </button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="border border-red-200 rounded-lg overflow-hidden shadow-2xs">
              <div className="p-5 bg-white">
                <h4 className="text-[15px] font-bold text-[#121722] mb-1">Delete Account</h4>
                <p className="text-[13px] text-[#777c86]">
                  Permanently remove your Personal Account and all of its contents from the Seekr platform. This action is not reversible, so please continue with caution.
                </p>
              </div>
              <div className="px-5 py-3.5 bg-red-50 flex items-center justify-end border-t border-red-100">
                <button
                  onClick={() => setShowDeleteAccountConfirm(true)}
                  className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium px-4 py-2 rounded-[6px] transition-colors text-[13px] shadow-sm cursor-pointer"
                >
                  Delete Personal Account
                </button>
              </div>
            </div>
          </div>
`;

// It might have slightly different spacing, so we use regex for the whole block
code = code.replace(/<div className="p-6">\s*<h3 className="text-sm font-semibold text-\[#121722\] mb-1">Delete Data<\/h3>[\s\S]*?<\/div>\s*<\/div>/, vercelSections);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
