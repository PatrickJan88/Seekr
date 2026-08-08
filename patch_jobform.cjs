const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

content = content.replace("import { createCalendarEvent } from '../lib/calendar';\n", "");
content = content.replace("import { auth, googleSignIn } from '../lib/firebase';", "import { auth } from '../lib/firebase';\nimport { addNotification } from '../lib/notifications';");

content = content.replace(
  "const [syncCalendar, setSyncCalendar] = useState(false);",
  "// syncCalendar removed"
);

const oldSaveLogic = `      if (syncCalendar && formData.nextInterviewDate) {
        const eventId = await createCalendarEvent(formData as JobApplication);
        if (eventId) {
          formData.calendarEventId = eventId;
        }
      }`;

const newSaveLogic = `      if (formData.reminder && formData.reminder !== 'none' && formData.nextInterviewDate) {
        if (auth.currentUser) {
          const reminderMsg = \`Reminder set for \${formData.company} interview \${formData.reminder} before.\`;
          await addNotification(auth.currentUser.uid, 'reminder', \`Interview: \${formData.company}\`, reminderMsg);
          toast.success(reminderMsg);
        }
      }`;

content = content.replace(oldSaveLogic, newSaveLogic);

const oldCalendarCheckbox = `{auth.currentUser?.providerData.some(p => p.providerId === 'google.com') && (
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={syncCalendar} onChange={async (e) => {
                  const checked = e.target.checked;
                  if (checked) {
                    if (!sessionStorage.getItem('google_access_token') || saveError?.includes('Calendar permission')) {
                       try {
                         await googleSignIn();
                         setSyncCalendar(true);
                         setSaveError(null);
                       } catch (err: any) {
                         if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
                           console.log("Calendar permission popup closed.");
                         } else {
                           console.error("Failed to get calendar permission:", err);
                           toast.error("Failed to get calendar permission.");
                         }
                         setSyncCalendar(false);
                       }
                    } else {
                       setSyncCalendar(true);
                    }
                  } else {
                    setSyncCalendar(false);
                  }
                }} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
                Add to Google Calendar
              </label>
            </div>
            )}`;

const newReminderDropdown = `<div className="flex flex-col justify-end">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Reminder</label>
              <select name="reminder" value={formData.reminder || 'none'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm">
                <option value="none">None</option>
                <option value="15 mins">15 mins before</option>
                <option value="1 hour">1 hour before</option>
                <option value="2 hours">2 hours before</option>
                <option value="1 day">1 day before</option>
                <option value="2 days">2 days before</option>
                <option value="custom">Custom</option>
              </select>
            </div>`;

content = content.replace(oldCalendarCheckbox, newReminderDropdown);

fs.writeFileSync('src/components/JobForm.tsx', content);
