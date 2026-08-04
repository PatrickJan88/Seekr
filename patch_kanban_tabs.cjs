const fs = require('fs');
let code = fs.readFileSync('src/components/Kanban.tsx', 'utf-8');

const targetImport = `import React from 'react';`;
const newImport = `import React, { useState } from 'react';`;

code = code.replace(targetImport, newImport);

const targetComp = `export function Kanban({ applications, onEdit, onStatusChange }: KanbanProps) {
  const grouped = applications.reduce((acc, app) => {`;

const newComp = `export function Kanban({ applications, onEdit, onStatusChange }: KanbanProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const grouped = applications.reduce((acc, app) => {`;

code = code.replace(targetComp, newComp);

const targetReturn = `return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] snap-x">
      {STATUSES.map(status => (`;

const newReturn = `const ACTIVE_STATUSES: JobStatus[] = ['Applied', 'Screening', 'Technical', 'Final', 'Offer'];
  const INACTIVE_STATUSES: JobStatus[] = ['Rejected', 'Ghosted'];
  
  const displayStatuses = activeTab === 'active' ? ACTIVE_STATUSES : INACTIVE_STATUSES;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex gap-2 mb-2">
        <button 
          onClick={() => setActiveTab('active')}
          className={\`px-4 py-2 rounded-lg font-bold text-sm transition-colors \${activeTab === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}\`}
        >
          Active Pipeline
        </button>
        <button 
          onClick={() => setActiveTab('inactive')}
          className={\`px-4 py-2 rounded-lg font-bold text-sm transition-colors \${activeTab === 'inactive' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}\`}
        >
          Closed (Rejected / Ghosted)
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-270px)] snap-x">
        {displayStatuses.map(status => (`;

code = code.replace(targetReturn, newReturn);
fs.writeFileSync('src/components/Kanban.tsx', code);
console.log("Patched Kanban.tsx");
