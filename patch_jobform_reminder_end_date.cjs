const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

const oldReminderInput = `{formData.reminder === 'custom' && (
                <div className="mt-2">
                  <input type="date" name="customReminderDate" value={formData.customReminderDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
                </div>
              )}`;

const newReminderInput = `{formData.reminder === 'custom' && (
                <div className="mt-2 flex items-center gap-2">
                  <input type="date" name="customReminderDate" value={formData.customReminderDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" placeholder="Start Date" />
                  <span className="text-slate-400 text-sm">to</span>
                  <input type="date" name="customReminderEndDate" value={formData.customReminderEndDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" placeholder="End Date" />
                </div>
              )}`;

content = content.replace(oldReminderInput, newReminderInput);

const oldReminderMsg = `          if (isCustom && formData.customReminderDate) {
            reminderMsg = \`Reminder set for \${formData.company} interview on \${new Date(formData.customReminderDate).toLocaleDateString()}.\`;
          } else if (isCustom) {
            reminderMsg = \`Reminder set for \${formData.company} interview.\`;
          }`;

const newReminderMsg = `          if (isCustom && formData.customReminderDate && formData.customReminderEndDate) {
            reminderMsg = \`Reminder set for \${formData.company} interview from \${new Date(formData.customReminderDate).toLocaleDateString()} to \${new Date(formData.customReminderEndDate).toLocaleDateString()}.\`;
          } else if (isCustom && formData.customReminderDate) {
            reminderMsg = \`Reminder set for \${formData.company} interview on \${new Date(formData.customReminderDate).toLocaleDateString()}.\`;
          } else if (isCustom) {
            reminderMsg = \`Reminder set for \${formData.company} interview.\`;
          }`;

content = content.replace(oldReminderMsg, newReminderMsg);

fs.writeFileSync('src/components/JobForm.tsx', content);
