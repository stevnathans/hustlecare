import { HomeIcon, FolderIcon, CogIcon, QuestionMarkCircleIcon, UserIcon } from "@heroicons/react/24/outline";

interface DesktopSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DesktopSidebar({ activeTab, setActiveTab }: DesktopSidebarProps) {
  const navigationItems = [
    { id: "dashboard", name: "Dashboard", icon: HomeIcon },
    { id: "profile", name: "Profile", icon: UserIcon },
    { id: "my-lists", name: "My Lists", icon: FolderIcon },
    { id: "settings", name: "Settings", icon: CogIcon },
    { id: "help", name: "Help", icon: QuestionMarkCircleIcon },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col fixed h-full">
      <div className="flex flex-col h-0 flex-1 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              Hustlecare
            </h1>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    group flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive
                      ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-r-2 border-indigo-600 dark:border-indigo-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }
                  `}
                >
                  <Icon 
                    className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                      isActive 
                        ? "text-indigo-600 dark:text-indigo-400" 
                        : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                    }`} 
                  />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User section at bottom */}
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center w-full">
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                HC
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Dashboard
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Welcome back
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}