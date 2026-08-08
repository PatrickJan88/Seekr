const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

const oldSaveLogic = `      if (formData.reminder && formData.reminder !== 'none' && formData.nextInterviewDate) {
        if (auth.currentUser) {
          const reminderMsg = \`Reminder set for \${formData.company} interview \${formData.reminder} before.\`;
          await addNotification(auth.currentUser.uid, 'reminder', \`Interview: \${formData.company}\`, reminderMsg);
          toast.success(reminderMsg);
        }
      }`;

const newSaveLogic = `      if (formData.reminder && formData.reminder !== 'none' && formData.nextInterviewDate) {
        if (auth.currentUser) {
          const isCustom = formData.reminder === 'custom';
          let reminderMsg = \`Reminder set for \${formData.company} interview \${formData.reminder} before.\`;
          if (isCustom && formData.customReminderDate) {
            reminderMsg = \`Reminder set for \${formData.company} interview on \${new Date(formData.customReminderDate).toLocaleString()}.\`;
          } else if (isCustom) {
            reminderMsg = \`Reminder set for \${formData.company} interview.\`;
          }
          await addNotification(auth.currentUser.uid, 'reminder', \`Interview: \${formData.company}\`, reminderMsg);
          toast.success(reminderMsg);
        }
      }`;

content = content.replace(oldSaveLogic, newSaveLogic);

const oldReminderSelect = `<div className="flex flex-col justify-end">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Reminder</label>
              <select name="reminder" value={formData.nextInterviewDate ? (formData.reminder || 'none') : 'none'} onChange={handleChange} disabled={!formData.nextInterviewDate} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="none">None</option>
                <option value="15 mins">15 mins before</option>
                <option value="1 hour">1 hour before</option>
                <option value="2 hours">2 hours before</option>
                <option value="1 day">1 day before</option>
                <option value="2 days">2 days before</option>
                <option value="custom">Custom</option>
              </select>
            </div>`;

const newReminderSelect = `<div className="flex flex-col justify-end relative">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Reminder</label>
              <select name="reminder" value={formData.nextInterviewDate ? (formData.reminder || 'none') : 'none'} onChange={handleChange} disabled={!formData.nextInterviewDate} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="none">None</option>
                <option value="15 mins">15 mins before</option>
                <option value="1 hour">1 hour before</option>
                <option value="2 hours">2 hours before</option>
                <option value="1 day">1 day before</option>
                <option value="2 days">2 days before</option>
                <option value="custom">Custom</option>
              </select>
              {formData.reminder === 'custom' && (
                <div className="absolute top-full left-0 right-0 mt-1 z-10">
                  <input type="datetime-local" name="customReminderDate" value={formData.customReminderDate?.slice(0, 16) || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
                </div>
              )}
            </div>`;

content = content.replace(oldReminderSelect, newReminderSelect);

fs.writeFileSync('src/components/JobForm.tsx', content);
