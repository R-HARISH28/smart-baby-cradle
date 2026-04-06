// import { Home, History, Settings, Baby, User } from 'lucide-react';

// interface NavigationProps {
//   currentPage: string;
//   onNavigate: (page: string) => void;
// }

// export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
//   const navItems = [
//     { id: 'dashboard', label: 'Dashboard', icon: Home },
//     { id: 'history', label: 'History', icon: History },
//     { id: 'profile', label: 'Profile', icon: User }, // Added the Profile tab here
//     { id: 'settings', label: 'Settings', icon: Settings },
//   ];

//   return (
//     <nav className="bg-white shadow-lg sticky top-0 z-40">
//       <div className="max-w-7xl mx-auto px-4">
//         <div className="flex items-center justify-between h-16">
//           <div className="flex items-center space-x-2">
//             <div className="p-2 bg-blue-500 rounded-lg">
//               <Baby className="w-6 h-6 text-white" />
//             </div>
//             <span className="text-xl font-bold text-gray-800">Baby Monitor</span>
//           </div>

//           <div className="flex space-x-1">
//             {navItems.map((item) => {
//               const Icon = item.icon;
//               const isActive = currentPage === item.id;
//               return (
//                 <button
//                   key={item.id}
//                   onClick={() => onNavigate(item.id)}
//                   className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
//                     isActive
//                       ? 'bg-blue-500 text-white'
//                       : 'text-gray-600 hover:bg-gray-100'
//                   }`}
//                 >
//                   <Icon className="w-5 h-5" />
//                   <span className="hidden md:inline font-medium">{item.label}</span>
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }


import { Home, History, Settings, Baby, User, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Firebase onAuthStateChanged in App.tsx will automatically 
      // handle redirecting to the login screen.
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">Baby Monitor</span>
          </div>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline font-medium">{item.label}</span>
                </button>
              );
            })}

            {/* Separator line */}
            <div className="w-px h-6 bg-gray-200 mx-2 hidden md:block"></div>

            {/* Log Out Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

