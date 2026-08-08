const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const oldLogic = `          if (app.reminder === 'custom') {
             if (app.customReminderDate) {
               const customStart = new Date(app.customReminderDate);
               const start = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate()).getTime();
               let end = interviewTime;
               if (app.customReminderEndDate) {
                 const customEnd = new Date(app.customReminderEndDate);
                 end = new Date(customEnd.getFullYear(), customEnd.getMonth(), customEnd.getDate(), 23, 59, 59, 999).getTime();
               } else {
                 end = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate(), 23, 59, 59, 999).getTime();
               }
               
               if (now.getTime() >= start && now.getTime() <= end) {
                 shouldTrigger = true;
               }
             }
          } else {
            if (now.getTime() >= reminderTime && now.getTime() <= interviewTime) {
              shouldTrigger = true;
            }
          }`;

const newLogic = `          if (app.reminder === 'custom') {
             if (app.customReminderDate) {
               // YYYY-MM-DD parsing in local time
               const [startYear, startMonth, startDay] = app.customReminderDate.split('-').map(Number);
               const start = new Date(startYear, startMonth - 1, startDay).getTime();
               let end = interviewTime;
               if (app.customReminderEndDate) {
                 const [endYear, endMonth, endDay] = app.customReminderEndDate.split('-').map(Number);
                 end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999).getTime();
               } else {
                 end = new Date(startYear, startMonth - 1, startDay, 23, 59, 59, 999).getTime();
               }
               
               if (now.getTime() >= start && now.getTime() <= end) {
                 shouldTrigger = true;
               }
             }
          } else {
            if (now.getTime() >= reminderTime && now.getTime() <= interviewTime) {
              shouldTrigger = true;
            } else if (now.getTime() > interviewTime) {
              // If it's already past the interview, just mark it as sent so we don't keep checking
              await updateApplication(app.id, { reminderSent: true });
              continue;
            }
          }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('src/components/Dashboard.tsx', content);
