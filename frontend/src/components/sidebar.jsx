import { NavLink } from "react-router-dom";
import {
  BookOpenText,
  Folder,
  Leaf,
  LogOut,
} from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";

const Sidebar = () => {
  const { logout } = useAuthStore();

  const navigationItems = [
    {
      label: "Publications",
      path: "/publications",
      icon: BookOpenText,
    },
    {
      label: "Categories",
      path: "/categories",
      icon: Folder,
    },
  ];

  const getNavLinkClasses = ({ isActive }) => {
    const baseClasses =
      "relative flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-all duration-200";

    const activeClasses =
      "bg-[#f2f7e7] text-[#536d24] shadow-sm";

    const inactiveClasses =
      "text-[#31527a] hover:bg-slate-50 hover:text-[#0a3763]";

    return `${baseClasses} ${
      isActive ? activeClasses : inactiveClasses
    }`;
  };

  return (
    <aside className="relative w-full md:fixed md:left-0 md:top-0 md:h-screen md:w-[220px] border-r border-slate-200/80 bg-[#f8fafc] p-2">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,45,80,0.06)]">
        {/* Brand */}
        <div className="flex h-[72px] items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
            <Leaf className="size-5 fill-[#b7cf62] text-[#b7cf62]" />
          </div>

          <NavLink
            to="/publications"
            className="whitespace-nowrap font-serif text-xl font-bold tracking-tight text-[#0a3763]"
          >
            ClearView Blog
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5">
          <div className="space-y-2">
            {navigationItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={getNavLinkClasses}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute -left-3 top-1/2 h-9 w-1 -translate-y-1/2 rounded-r-full bg-[#b7cf62]" />
                    )}

                    <Icon className="size-[18px] shrink-0" />

                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}

            <NavLink
              to="/"
              className={getNavLinkClasses}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -left-3 top-1/2 h-9 w-1 -translate-y-1/2 rounded-r-full bg-[#b7cf62]" />
                  )}

                  <Leaf className="size-[18px] shrink-0" />

                  <span>See your blog</span>
                </>
              )}
            </NavLink>
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 px-4 text-sm font-medium text-[#31527a] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="size-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;