import { useEffect, useMemo, useRef, useState } from "react";
import { Edit3, Search, Trash2 } from "lucide-react";

import Sidebar from "../components/sidebar";
import CategoryFormModal from "../components/CategoryFormModal";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import Pagination from "../components/Pagination";
import { useCategoriesStore } from "../store/useCategoriesStore";

const CategoriesPage = () => {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    categories,
    pagination,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
    error,
  } = useCategoriesStore();

  const currentFetchId = useRef(0);

  const filterQuery = useMemo(
    () => ({
      page,
      limit: 10,
      search: isFilterApplied ? search.trim() : undefined,
      sortOrder,
    }),
    [page, search, sortOrder, isFilterApplied],
  );

  useEffect(() => {
    const fetchData = async () => {
      currentFetchId.current += 1;
      const fetchId = currentFetchId.current;

      try {
        await fetchCategories(filterQuery);
      } catch {
        // Already handled by store
      } finally {
        if (fetchId !== currentFetchId.current) {
          return;
        }
      }
    };

    fetchData();
  }, [fetchCategories, filterQuery]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async (payload) => {
    setIsSaving(true);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
      } else {
        await createCategory(payload);
      }

      closeModal();
      await fetchCategories(filterQuery);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      const nextPage = categories.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await fetchCategories({ ...filterQuery, page: nextPage });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-900">
      <Sidebar />
      <main className="ml-0 md:ml-[220px] min-h-screen px-6 py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Manage Categories</h1>
            <p className="mt-2 text-sm text-slate-600">Organize your blog content with structured categories.</p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-2xl bg-[#0b4f88] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a3f70]"
          >
            + New Category
          </button>
        </div>

        <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.8fr_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    setPage(1);
                    setIsFilterApplied(true);
                  }
                }}
                placeholder="Search categories..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-[#fbfcfe] pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
              />
            </label>

            <label className="block">
              <span className="sr-only">Sort categories</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-[#fbfcfe] px-4 text-sm text-slate-900 outline-none transition focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
              >
                <option value="newest">Sort by: Newest</option>
                <option value="oldest">Sort by: Oldest</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created Date</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-sm text-slate-500">
                      Loading categories...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-sm text-slate-500">
                      {error || "No categories found. Add a new category to get started."}
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 align-middle text-sm font-semibold text-slate-900">{category.name}</td>
                      <td className="px-6 py-4 align-middle text-sm text-slate-600">{category.description || "—"}</td>
                      <td className="px-6 py-4 align-middle text-sm text-slate-700">{formatDate(category.createdAt)}</td>
                      <td className="px-6 py-4 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          className="mr-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(category)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </main>

      <CategoryFormModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSaveCategory}
        category={editingCategory}
        loading={isSaving}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete Category"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCategory}
        loading={isDeleting}
      />
    </div>
  );
};

export default CategoriesPage;