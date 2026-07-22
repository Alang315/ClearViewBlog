import { useEffect, useMemo, useRef, useState } from "react";
import { Edit3, Heart, Search, Trash2 } from "lucide-react";

import Sidebar from "../components/sidebar";
import PublicationFormModal from "../components/PublicationFormModal";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import Pagination from "../components/Pagination";
import { useCategoriesStore } from "../store/useCategoriesStore";
import { usePublicationsStore } from "../store/usePublicationsStore";

const PublicationsPage = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { categories, fetchCategories } = useCategoriesStore();
  const {
    publications,
    pagination,
    fetchPublications,
    createPublication,
    updatePublication,
    deletePublication,
    isLoading: isPublicationsLoading,
    error: publicationsError,
  } = usePublicationsStore();

  const currentFetchId = useRef(0);

  const filterQuery = useMemo(
    () => ({
      page,
      limit: 10,
      search: isFilterApplied ? search.trim() : undefined,
      category: isFilterApplied && categoryFilter ? categoryFilter : undefined,
      sortBy: "date",
      sortOrder,
    }),
    [page, search, categoryFilter, isFilterApplied, sortOrder],
  );

  useEffect(() => {
    fetchCategories({ limit: 100 });
  }, [fetchCategories]);

  useEffect(() => {
    const fetchData = async () => {
      currentFetchId.current += 1;
      const fetchId = currentFetchId.current;

      try {
        await fetchPublications(filterQuery);
      } catch {
        // error state handled in store
      } finally {
        if (fetchId !== currentFetchId.current) {
          return;
        }
      }
    };

    fetchData();
  }, [fetchPublications, filterQuery]);

  const handleApplyFilters = () => {
    setPage(1);
    setIsFilterApplied(true);
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setSortOrder("desc");
    setPage(1);
    setIsFilterApplied(false);
  };

  const openCreateModal = () => {
    setEditingPublication(null);
    setModalOpen(true);
  };

  const openEditModal = (publication) => {
    setEditingPublication(publication);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPublication(null);
  };

  const handleSavePublication = async (payload) => {
    setIsSaving(true);

    try {
      if (editingPublication) {
        await updatePublication(editingPublication.id, payload);
      } else {
        await createPublication(payload);
      }

      closeModal();
      await fetchPublications(filterQuery);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePublication = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      await deletePublication(deleteTarget.id);
      setDeleteTarget(null);
      const nextPage = publications.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await fetchPublications({ ...filterQuery, page: nextPage });
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
            <h1 className="text-3xl font-semibold">Manage Publications</h1>
            <p className="mt-2 text-sm text-slate-600">Create, edit, organize and manage your blog posts.</p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-2xl bg-[#0b4f88] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a3f70]"
          >
            + New Publication
          </button>
        </div>

        <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr_1fr_auto]">
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
                placeholder="Search publications..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-[#fbfcfe] pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
              />
            </label>

            <label className="block">
              <span className="sr-only">Filter by category</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-[#fbfcfe] px-4 text-sm text-slate-900 outline-none transition focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
              >
                <option value="">All Categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="sr-only">Sort by date</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-[#fbfcfe] px-4 text-sm text-slate-900 outline-none transition focus:border-[#0b4f88] focus:ring-4 focus:ring-[#0b4f88]/10"
              >
                <option value="desc">Date: Newest</option>
                <option value="asc">Date: Oldest</option>
              </select>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="h-12 rounded-2xl bg-[#b7cf62] px-5 text-sm font-semibold text-white transition hover:bg-[#9fbd4f]"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cover</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Author</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Likes</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isPublicationsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-500">
                      Loading publications...
                    </td>
                  </tr>
                ) : publications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-500">
                      {publicationsError || "No publications found. Create your first publication to get started."}
                    </td>
                  </tr>
                ) : (
                  publications.map((publication) => (
                    <tr key={publication.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <img
                          src={publication.featuredImageUrl}
                          alt={publication.title}
                          className="h-16 w-24 rounded-2xl object-cover"
                        />
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm font-semibold text-slate-900">{publication.title}</div>
                        <div className="mt-1 max-w-[320px] text-sm text-slate-500">{publication.excerpt}</div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-wrap gap-2">
                          {publication.categories.map((category) => (
                            <span
                              key={category.id}
                              className="rounded-full bg-[#e9f4de] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#536d24]"
                            >
                              {category.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-slate-700">{publication.author}</td>
                      <td className="px-6 py-4 align-middle text-sm text-slate-700">{formatDate(publication.updatedAt)}</td>
                      <td className="px-6 py-4 align-middle text-sm text-slate-700 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        {publication.likesCount}
                      </td>
                      <td className="px-6 py-4 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(publication)}
                          className="mr-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                          aria-label={`Edit ${publication.title}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(publication)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                          aria-label={`Delete ${publication.title}`}
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

      <PublicationFormModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSavePublication}
        publication={editingPublication}
        categories={categories}
        loading={isSaving}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Publication"
        message={`Are you sure you want to delete the publication "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete Publication"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeletePublication}
        loading={isDeleting}
      />
    </div>
  );
};

export default PublicationsPage;