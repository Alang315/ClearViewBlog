import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Leaf,
  LogOut,
  Search,
} from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";

const Navbar = ({
  showFilters = true,
  categories = [],
  defaultSearch = "",
  defaultCategory = "",
  onSearch,
  onCategoryChange,
}) => {
  const navigate = useNavigate();
  const { logout, authUser } = useAuthStore();

  const [category, setCategory] = useState(defaultCategory);
  const [search, setSearch] = useState(defaultSearch);

  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);

  useEffect(() => {
    setSearch(defaultSearch);
  }, [defaultSearch]);

  const handleSearch = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (category) {
      params.set("category", category);
    }

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (typeof onSearch === "function") {
      return onSearch({ category, search: search.trim() });
    }

    const query = params.toString();

    navigate(query ? `/?${query}` : "/");
  };

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-slate-200/70 bg-[#f6f9fc]/90 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-6 rounded-xl border border-slate-200/80 bg-white px-5 shadow-[0_4px_20px_rgba(15,45,80,0.08)] sm:px-7">
        {/* Brand */}
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
            <Leaf className="size-6 fill-[#b6cf63] text-[#b6cf63] transition-transform group-hover:-rotate-6" />
          </div>

          <span className="hidden font-serif text-2xl font-bold tracking-tight text-[#0a3763] sm:inline">
            ClearView Blog
          </span>
        </Link>

        {/* Filters and search */}
        <form
          onSubmit={handleSearch}
          className="flex min-w-0 flex-1 items-center justify-end gap-3"
        >
          {showFilters && (
            <div className="relative hidden sm:block">
              <select
                value={category}
                onChange={(event) => {
                  const value = event.target.value;
                  setCategory(value);
                  if (typeof onCategoryChange === "function") {
                    onCategoryChange(value);
                  }
                }}
                className="h-11 min-w-[150px] appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-semibold text-[#0a3763] outline-none transition hover:border-slate-300 focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
                aria-label="Filter by category"
              >
                <option value="">Category</option>
                {categories.length > 0 ? (
                  categories.map((categoryItem) => (
                    <option key={categoryItem.id} value={categoryItem.id}>
                      {categoryItem.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="technology">Technology</option>
                    <option value="design">Design</option>
                    <option value="business">Business</option>
                    <option value="lifestyle">Lifestyle</option>
                  </>
                )}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#0a3763]" />
            </div>
          )}

          {showFilters && (
            <div className="relative min-w-0 max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-500" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search posts..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-[#fbfcfe] pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0b4f88] focus:bg-white focus:ring-4 focus:ring-[#0b4f88]/10"
              />
            </div>
          )}

          <button
            type="submit"
            className="sr-only"
          >
            Search
          </button>

          {/* Account actions */}
          {authUser && (
            <div className="flex shrink-0 items-center gap-2 border-l border-slate-200 pl-3">
              {authUser.role === "admin" && (
                <button
                  type="button"
                  onClick={() => navigate("/publications")}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#0b5592] px-4 text-sm font-semibold text-white transition hover:bg-[#073665]"
                >
                  Go to your dashboard
                </button>
              )}

              <button
                type="button"
                onClick={logout}
                title="Log out"
                className="flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="size-5" />
              </button>
            </div>
          )}
        </form>
      </div>
    </header>
  );
};

export default Navbar;