import re

with open('src/components/JobForm.tsx', 'r') as f:
    content = f.read()

# Add dynamic checks for past interview date
if "const isPastInterview = " not in content:
    content = content.replace("  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {",
"""  const isPastInterview = React.useMemo(() => {
    if (!formData.nextInterviewDate) return false;
    return new Date(formData.nextInterviewDate).getTime() < Date.now();
  }, [formData.nextInterviewDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {""")

# Update Reminder select to be disabled if !formData.nextInterviewDate or isPastInterview
content = content.replace(
    'disabled={!formData.nextInterviewDate}',
    'disabled={!formData.nextInterviewDate || isPastInterview}'
)

# Update the next interview HTML to show a warning if isPastInterview
content = content.replace(
    '''            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Next Interview</label>
              <input type="datetime-local" name="nextInterviewDate" value={formData.nextInterviewDate?.slice(0, 16) || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>''',
    '''            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Next Interview</label>
              <input type="datetime-local" name="nextInterviewDate" value={formData.nextInterviewDate?.slice(0, 16) || ''} onChange={handleChange} className={`w-full px-3 py-2 border rounded-xl bg-slate-50 focus:ring-2 outline-none transition-all text-sm ${isPastInterview ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200'}`} />
              {isPastInterview && <p className="text-[10px] text-amber-600 mt-1">This time is in the past. Reminders cannot be set.</p>}
            </div>'''
)

# Also block submit if there's a reminder and it's a past interview
if "if (formData.reminder && formData.reminder !== 'none' && isPastInterview) {" not in content:
    content = content.replace("if (!formData.position?.trim()) {\n      setSaveError(\"Position is required.\");\n      return;\n    }",
"""if (!formData.position?.trim()) {
      setSaveError("Position is required.");
      return;
    }
    if (formData.reminder && formData.reminder !== 'none' && isPastInterview) {
      setSaveError("Cannot set a reminder for an interview time that has already passed.");
      return;
    }""")


with open('src/components/JobForm.tsx', 'w') as f:
    f.write(content)
