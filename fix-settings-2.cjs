const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

const modals = `
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
             <h3 className="text-lg font-bold text-[#121722] mb-2">Log Out</h3>
             <p className="text-[13px] text-[#777c86] mb-6">Are you sure you want to log out of your account?</p>
             <div className="flex justify-end gap-3">
               <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 rounded-full font-medium text-[13px] text-[#777c86] hover:bg-[#faf9f7] transition-colors cursor-pointer">Cancel</button>
               <button onClick={() => { setShowLogoutConfirm(false); logout(); }} className="px-4 py-2 rounded-full font-medium text-[13px] bg-[#121722] text-white hover:bg-black transition-colors cursor-pointer">Log Out</button>
             </div>
          </div>
        </div>
      )}

      {showDeleteAccountConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
             <h3 className="text-lg font-bold text-[#121722] mb-2">Delete Account</h3>
             <p className="text-[13px] text-[#777c86] mb-6">This action cannot be undone. This will permanently delete your account and remove your data from our servers.</p>
             <div className="flex justify-end gap-3">
               <button onClick={() => setShowDeleteAccountConfirm(false)} className="px-4 py-2 rounded-[6px] font-medium text-[13px] text-[#777c86] hover:bg-[#faf9f7] transition-colors cursor-pointer border border-transparent hover:border-[#efefef]">Cancel</button>
               <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-[6px] font-medium text-[13px] bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors cursor-pointer shadow-sm">Delete Account</button>
             </div>
          </div>
        </div>
      )}
`;

code = code.replace(/    <\/div>\s*<\/div>\s*\);\s*}/, `${modals}    </div>\n    </div>\n  );\n}`);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
