const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsPage.tsx', 'utf8');

code = code.replace(
  `        {/* Breadcrumb / Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white rounded-full transition-colors flex items-center gap-2 text-[#777c86] hover:text-[#121722] border border-transparent hover:border-[#efefef] cursor-pointer"
            >
              <ArrowLeft size={20} />
              <span className="font-medium text-xs">Back to Dashboard</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#efefef] shadow-2xs overflow-hidden flex-1 flex flex-col">
          <div className="p-6 border-b border-[#efefef] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#121722] flex items-center gap-3">
                <Bell className="text-[#0068f9]" />
                Notification Center
              </h1>
              <p className="text-[#777c86] text-xs mt-1">
                You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-[#0068f9] hover:bg-[#e8f1ff] border border-transparent shadow-none px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <CheckCheck size={14} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>`,
  `        <div className="bg-white rounded-2xl border border-[#efefef] shadow-2xs overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-[#efefef] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[#777c86] text-xs">
                You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-[#0068f9] hover:bg-[#e8f1ff] border border-transparent shadow-none px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <CheckCheck size={14} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>`
);

fs.writeFileSync('src/components/NotificationsPage.tsx', code);
