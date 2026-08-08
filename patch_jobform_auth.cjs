const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

if (!content.includes("import { auth }")) {
    content = content.replace("import { createCalendarEvent } from '../lib/calendar';", "import { createCalendarEvent } from '../lib/calendar';\nimport { auth, googleSignIn } from '../lib/firebase';");
}

const checkboxHtml = `<div className="flex items-center mt-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={syncCalendar} onChange={e => setSyncCalendar(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
                Add to Google Calendar
              </label>
            </div>`;

const newCheckboxHtml = `{auth.currentUser?.providerData.some(p => p.providerId === 'google.com') && (
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={syncCalendar} onChange={async (e) => {
                  const checked = e.target.checked;
                  if (checked && !sessionStorage.getItem('google_access_token')) {
                    try {
                      await googleSignIn();
                      setSyncCalendar(true);
                    } catch (err) {
                      console.error("Failed to get calendar permission:", err);
                      setSyncCalendar(false);
                    }
                  } else {
                    setSyncCalendar(checked);
                  }
                }} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
                Add to Google Calendar
              </label>
            </div>
            )}`;

content = content.replace(checkboxHtml, newCheckboxHtml);

fs.writeFileSync('src/components/JobForm.tsx', content);
