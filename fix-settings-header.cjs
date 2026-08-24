const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

code = code.replace(
  `        {/* Breadcrumb / Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white rounded-full transition-colors flex items-center gap-2 text-[#777c86] hover:text-[#121722] border border-transparent hover:border-[#efefef] cursor-pointer"
            >
              <ArrowLeft size={20} />
              <span className="font-medium text-xs">Back to Dashboard</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#efefef] overflow-hidden shadow-2xs divide-y divide-[#efefef]">
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#121722] flex items-center gap-3">
                <Settings className="text-[#0068f9]" />
                Settings
              </h1>
              <p className="text-[#777c86] text-xs mt-1">
                Manage your account, preferences, and support.
              </p>
            </div>
          </div>
          
          <div className="p-6">`,
  `        <div className="bg-white rounded-2xl border border-[#efefef] overflow-hidden shadow-2xs divide-y divide-[#efefef]">
          <div className="p-6">`
);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
