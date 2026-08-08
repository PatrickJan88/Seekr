import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace("import { initAuth, googleSignIn } from './lib/firebase';", "import { initAuth, googleSignIn, anonymousSignIn } from './lib/firebase';")

# Add handleAnonymousLogin
handle_anonymous = """
  const handleAnonymousLogin = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    try {
      const result = await anonymousSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        toast.success('Welcome to Seekr!');
      }
    } catch (err: any) {
      console.error('Anonymous login failed:', err);
      if (err.message?.includes('Database is closing') || err.message?.includes('hidden')) {
        toast.error('Authentication failed because third-party storage is blocked in this preview iframe. Please click "Open in new tab" (the arrow icon at the top right) to log in and use the app.');
      } else {
        toast.error('Anonymous login failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {"""

content = content.replace("  if (loading) {", handle_anonymous)

# Add button
guest_btn = """              <button onClick={handleAnonymousLogin} disabled={isLoggingIn} className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm">
                Continue as Guest
              </button>
            </div>"""

content = content.replace("            </div>", guest_btn)

with open('src/App.tsx', 'w') as f:
    f.write(content)
