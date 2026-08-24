const fs = require('fs');
let code = fs.readFileSync('src/components/SidebarNav.tsx', 'utf8');

// First, find and replace the bottomItems
code = code.replace(
  `{ id: 'logout', title: 'Log out', icon: LogOut, onClick: logout },`,
  ``
);

// We want to add the user profile block at the bottom
// Find where bottomItems is mapped
const userProfileBlock = `
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
`;

code = code.replace(
  /        \{bottomItems\.map\(item => \([\s\S]*?<\/div>\s*<\/div>/,
  `${userProfileBlock}      </div>\n    </div>`
);

fs.writeFileSync('src/components/SidebarNav.tsx', code);
