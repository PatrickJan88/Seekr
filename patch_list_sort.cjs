const fs = require('fs');

let content = fs.readFileSync('src/components/ListView.tsx', 'utf8');

// Ensure useMemo is imported
if (!content.includes('useMemo')) {
  content = content.replace('useState,', 'useState, useMemo,');
}

// Add ArrowUpDown icon import if needed
if (!content.includes('ArrowUpDown')) {
  content = content.replace('import { MoreVertical, ChevronDown, Eye, Calendar } from "lucide-react";', 'import { MoreVertical, ChevronDown, Eye, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";');
}

const listComponentStart = `export function ListView({ applications, onEdit, onStatusChange, onDelete }: ListViewProps) {`;

const listComponentReplacement = `export function ListView({ applications, onEdit, onStatusChange, onDelete }: ListViewProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const sortedApplications = useMemo(() => {
    let sortableItems = [...applications];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'status') {
           const statusOrder = ['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];
           aValue = statusOrder.indexOf(a.status);
           bValue = statusOrder.indexOf(b.status);
        } else if (sortConfig.key === 'position' || sortConfig.key === 'company') {
           aValue = (aValue || '').toString().toLowerCase();
           bValue = (bValue || '').toString().toLowerCase();
        } else if (sortConfig.key === 'appliedDate') {
           aValue = aValue ? new Date(aValue).getTime() : 0;
           bValue = bValue ? new Date(bValue).getTime() : 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [applications, sortConfig]);

  const requestSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName: string) => {
    if (!sortConfig || sortConfig.key !== columnName) {
      return <ArrowUpDown size={12} className="ml-1 inline-block opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp size={12} className="ml-1 inline-block text-blue-500" /> : 
      <ArrowDown size={12} className="ml-1 inline-block text-blue-500" />;
  };
`;

content = content.replace(listComponentStart, listComponentReplacement);

// Replace mapping to use sortedApplications
content = content.replace('applications.map((app) => (', 'sortedApplications.map((app) => (');

// Replace table headers to include sort logic
const headerRow = `            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Position</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Company</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Applied Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Next Interview</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
            </tr>`;

const newHeaderRow = `            <tr>
              <th 
                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer group hover:bg-slate-100/50 transition-colors"
                onClick={() => requestSort('position')}
              >
                <div className="flex items-center">Position {getSortIcon('position')}</div>
              </th>
              <th 
                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer group hover:bg-slate-100/50 transition-colors"
                onClick={() => requestSort('company')}
              >
                <div className="flex items-center">Company {getSortIcon('company')}</div>
              </th>
              <th 
                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer group hover:bg-slate-100/50 transition-colors"
                onClick={() => requestSort('appliedDate')}
              >
                <div className="flex items-center">Applied Date {getSortIcon('appliedDate')}</div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Next Interview</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
              <th 
                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer group hover:bg-slate-100/50 transition-colors"
                onClick={() => requestSort('status')}
              >
                <div className="flex items-center">Status {getSortIcon('status')}</div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
            </tr>`;

content = content.replace(headerRow, newHeaderRow);

fs.writeFileSync('src/components/ListView.tsx', content);
