import React, { useState } from 'react';
import { auth, logout } from '../lib/firebase';
import { Kbd } from './ui/kbd';
import { 
  Search, 
  LayoutDashboard, 
  FolderKanban, 
  Settings, 
  ChevronDown,
  ChevronRight,
  Activity,
  Globe,
  Sparkles,
  Plus,
  Download,
  Upload,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export type NavItemData = {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: number | string;
  shortcut?: string;
  children?: NavItemData[];
  onClick?: () => void;
};

export type NavGroupData = {
  heading?: string;
  items: NavItemData[];
};

const NavItem: React.FC<{ 
  item: NavItemData; 
  activeId: string; 
  onSelect: (id: string) => void;
  level?: number;
}> = ({ 
  item, 
  activeId, 
  onSelect,
  level = 0
}) => {
  const isActive = activeId === item.id;
  const hasChildren = !!item.children;
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (item.onClick) {
      item.onClick();
      return;
    }
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      onSelect(item.id);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div 
        className={`group flex items-center justify-between px-2.5 py-[7px] rounded-lg cursor-pointer transition-all duration-200 select-none
          ${isActive 
            ? 'bg-[#f4f4f5] text-[#121722] font-semibold' 
            : 'text-[#525866] font-normal hover:bg-[#faf9f7] hover:text-[#121722]'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5">
          <item.icon 
            className={`w-4 h-4 transition-colors
              ${isActive ? 'text-[#121722]' : 'text-[#525866] group-hover:text-[#121722]'}
            `} 
            strokeWidth={isActive ? 2 : 1.5} 
          />
          <span className="text-[13px] tracking-wide truncate">
            {item.title}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {item.shortcut && (
            <Kbd size="xs" className="text-[#777c86] font-mono text-[10px] bg-white border border-[#efefef] shadow-2xs">
              {item.shortcut}
            </Kbd>
          )}
          {item.badge && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-[#e4e4e7] text-[#121722]">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight 
              className={`w-3.5 h-3.5 text-[#a5a5a5] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {hasChildren && (
        <div 
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div 
              className="absolute top-0 bottom-0 border-l border-[#efefef]"
              style={{ left: `${level * 12 + 17.5}px` }}
            />
            {item.children!.map(child => (
              <NavItem 
                key={child.id} 
                item={child} 
                activeId={activeId} 
                onSelect={onSelect} 
                level={level + 1} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SidebarNav({
  trackingSystem = 'industry',
  setTrackingSystem, 
  className = '',
  activeId,
  onSelect,
  isDemo,
  onImport,
  onExport,
  onNew,
  applicationCount
}: { 
  className?: string;
  activeId: string;
  onSelect: (id: string) => void;
  isDemo: boolean;
  onImport: () => void;
  onExport: () => void;
  onNew: () => void;
  applicationCount?: number;
  trackingSystem?: 'industry' | 'academic';
  setTrackingSystem?: (sys: 'industry' | 'academic') => void;
}) {
  
  const topGroups: NavGroupData[] = [
    {
      items: [
        { id: 'sankey', title: 'Overview', icon: LayoutDashboard },
        { id: 'global-market', title: 'Job Market', icon: Globe },
        { id: 'kanban', title: 'My Applications', icon: FolderKanban, badge: applicationCount ? applicationCount : undefined },
        { id: 'analytics', title: 'Analytics', icon: Activity },
        { id: 'cv-match', title: 'AI Evaluator', icon: Sparkles },
      ]
    },
    {
      heading: 'WORKSPACE',
      items: [
        { id: 'new-app', title: 'New Application', icon: Plus, onClick: onNew, shortcut: 'N' },
        { id: 'import', title: 'Import Applications', icon: Upload, onClick: onImport },
        { id: 'export', title: 'Export Applications', icon: Download, onClick: onExport },
      ]
    }
  ];

  const bottomItems: NavItemData[] = [
    { id: 'settings', title: 'Settings', icon: Settings },
    
  ];

  return (
    <div className={`flex flex-col w-[260px] h-full bg-white border-r border-[#efefef] p-4 font-sans ${className}`}>
      <div className="flex items-center gap-2 px-2.5 mb-6 mt-2">
        <img src="/assets/seekr%20logo%201.webp" alt="Seekr Logo" className="w-auto h-6 object-contain" />
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <span className="px-2.5 mb-1 text-[11px] font-bold tracking-wider text-[#a5a5a5] uppercase">
            I AM
          </span>
          <div className="relative group">
            <div className="flex items-center justify-between px-2.5 py-[7px] text-[#525866] font-normal hover:bg-[#faf9f7] hover:text-[#121722] rounded-lg cursor-pointer transition-colors border border-transparent">
              <span className="text-[13px] tracking-wide truncate">
                {trackingSystem === 'academic' ? 'Academic Seekr' : 'Industry Seekr'}
              </span>
              <ChevronDown size={14} className="text-[#a5a5a5]" />
            </div>
            <div className="hidden group-hover:block absolute top-full mt-1 left-2 right-2 bg-white border border-[#efefef] rounded-xl shadow-lg z-50 overflow-hidden p-1">
              <div onClick={() => { setTrackingSystem?.('industry'); }} className="flex items-center px-3 py-2 text-[13px] text-[#121722] hover:bg-[#faf9f7] cursor-pointer rounded-lg font-medium">
                Industry Seekr
                {trackingSystem === 'industry' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0068f9]" />}
              </div>
              <div onClick={() => { setTrackingSystem?.('academic'); }} className="flex items-center px-3 py-2 text-[13px] text-[#121722] hover:bg-[#faf9f7] cursor-pointer rounded-lg font-medium">
                Academic Seekr
                {trackingSystem === 'academic' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0068f9]" />}
              </div>
            </div>
          </div>
        </div>
        {topGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            {group.heading && (
              <span className="px-2.5 mb-1 text-[11px] font-bold tracking-wider text-[#a5a5a5] uppercase">
                {group.heading}
              </span>
            )}
            {group.items.map(item => (
              <NavItem 
                key={item.id} 
                item={item} 
                activeId={activeId} 
                onSelect={onSelect} 
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-[#efefef] flex flex-col gap-1">

        {bottomItems.map(item => (
          <NavItem 
            key={item.id} 
            item={item} 
            activeId={activeId} 
            onSelect={onSelect} 
          />
        ))}

        <div className="flex items-center gap-3 px-2.5 py-[7px] mt-2 rounded-lg cursor-pointer transition-colors hover:bg-[#faf9f7]">
          {(() => {
            const isAnon = auth.currentUser?.isAnonymous;
            const email = auth.currentUser?.email;
            let initial = 'U';
            let name = 'User';
            if (isAnon) { initial = 'G'; name = 'Guest'; }
            else if (email) { initial = email.charAt(0).toUpperCase(); name = email.split('@')[0]; }
            return (
              <>
                <div className="w-6 h-6 rounded-full bg-[#e8f1ff] text-[#0068f9] flex items-center justify-center font-bold text-[11px] shrink-0">
                  {initial}
                </div>
                <span className="text-[13px] font-medium text-[#121722] truncate capitalize">
                  {name}
                </span>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
