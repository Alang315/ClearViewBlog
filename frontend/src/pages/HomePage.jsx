import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Heart, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";
import Pagination from "../components/Pagination";
import { useAuthStore } from "../store/useAuthStore";
import { useCategoriesStore } from "../store/useCategoriesStore";
import { usePublicationsStore } from "../store/usePublicationsStore";
import { axiosInstance } from "../lib/axios.js";

const formatDate = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const buildQuery = (params) => {
  const query = new URLSearchParams();

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.category) {
    query.set("category", params.category);
  }

  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }

  return query.toString();
};

export const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authUser, checkAuth } = useAuthStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const { fetchPublications, likePublication, unlikePublication } = usePublicationsStore();

  const [publications, setPublications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [loadingLikeIds, setLoadingLikeIds] = useState([]);
  const requestIdRef = useRef(0);

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const search = query.get("search") ?? "";
  const category = query.get("category") ?? "";
  const page = Number(query.get("page")) || 1;

  useEffect(() => {
    fetchCategories({ limit: 100 }).catch(() => null);
  }, [fetchCategories]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setListLoading(true);
    setListError(null);

    fetchPublications({
      page,
      limit: 10,
      search,
      category,
      sortBy: "date",
      sortOrder: "desc",
    })
      .then((data) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setPublications(data.publications);
        setPagination(data.pagination ?? { page, totalPages: 1 });
      })
      .catch((error) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setListError(error?.response?.data?.message || "Unable to load publications.");
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setListLoading(false);
        }
      });
  }, [page, search, category, fetchPublications]);

  useEffect(() => {
    setSectionLoading(true);

    axiosInstance
      .get("/publications", {
        params: {
          page: 1,
          limit: 8,
          sortBy: "date",
          sortOrder: "desc",
        },
      })
      .then((response) => {
        const posts = response.data.publications || [];
        setFeaturedPosts(posts.slice(0, 3));
        setLatestPosts(posts.slice(3, 7));
      })
      .catch((error) => {
        console.error("Unable to load preview posts:", error);
      })
      .finally(() => setSectionLoading(false));
  }, []);

  const updatePostCollections = (postId, data) => {
    const updateList = (items) =>
      items.map((item) => (item.id === postId ? { ...item, ...data } : item));

    setPublications((current) => updateList(current));
    setFeaturedPosts((current) => updateList(current));
    setLatestPosts((current) => updateList(current));
  };

  const handleSearch = ({ search: nextSearch, category: nextCategory }) => {
    const queryString = buildQuery({ search: nextSearch, category: nextCategory });
    navigate(queryString ? `/?${queryString}` : "/");
  };

  const handleCategoryChange = (nextCategory) => {
    const queryString = buildQuery({ search, category: nextCategory });
    navigate(queryString ? `/?${queryString}` : "/");
  };

  const handlePageChange = (nextPage) => {
    const queryString = buildQuery({ search, category, page: nextPage });
    navigate(queryString ? `/?${queryString}` : "/");
  };

  const handleOpenPublication = (publicationId) => {
    if (!authUser) {
      toast.error("You must log in to read the complete publication.");
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }

    navigate(`/posts/${publicationId}`);
  };

  const handleToggleLike = async (publication) => {
    if (!authUser) {
      toast.error("You must log in as a user to react to publications.");
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }

    if (authUser.role === "admin") {
      toast.error("Administrator accounts cannot react to publications.");
      return;
    }

    if (loadingLikeIds.includes(publication.id)) {
      return;
    }

    setLoadingLikeIds((current) => [...current, publication.id]);

    try {
      const response = publication.likedByCurrentUser
        ? await unlikePublication(publication.id)
        : await likePublication(publication.id);

      updatePostCollections(publication.id, {
        likedByCurrentUser: response.likedByCurrentUser,
        likesCount: response.likesCount,
      });
    } catch (error) {
      if (error?.response?.status === 401) {
        await checkAuth();
        toast.error("You must log in as a user to react to publications.");
        navigate("/login", { state: { from: location.pathname + location.search } });
        return;
      }

      toast.error(error?.response?.data?.message || "Unable to update reaction.");
    } finally {
      setLoadingLikeIds((current) => current.filter((id) => id !== publication.id));
    }
  };

  return (
    <>
      <Navbar
        showFilters
        categories={categories}
        defaultSearch={search}
        defaultCategory={category}
        onSearch={handleSearch}
        onCategoryChange={handleCategoryChange}
      />

      <main className="pt-[110px] pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5d8c3a]">
                      Featured
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold text-slate-900">
                      ClearView highlights the latest stories and inspiration.
                    </h1>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenPublication(featuredPosts[0]?.id)}
                    disabled={!featuredPosts[0]}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#0b5592] px-5 text-sm font-semibold text-white transition hover:bg-[#073665] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Explore featured
                  </button>
                </div>

                {sectionLoading ? (
                  <div className="flex min-h-[240px] items-center justify-center text-slate-500">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                ) : featuredPosts.length === 0 ? (
                  <p className="text-sm text-slate-500">No featured publications available.</p>
                ) : (
                  <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
                    <article className="rounded-[28px] overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                      <img
                        src={featuredPosts[0].featuredImageUrl}
                        alt={featuredPosts[0].title}
                        className="h-80 w-full object-cover"
                      />
                      <div className="space-y-4 p-6">
                        <div className="flex flex-wrap gap-2">
                          {featuredPosts[0].categories.map((item) => (
                            <span
                              key={item.id}
                              className="rounded-full bg-[#e9f4de] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#536d24]"
                            >
                              {item.name}
                            </span>
                          ))}
                        </div>
                        <h2 className="text-3xl font-semibold text-slate-900">
                          {featuredPosts[0].title}
                        </h2>
                        <p className="text-sm leading-7 text-slate-600">
                          {featuredPosts[0].excerpt}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span>{featuredPosts[0].author}</span>
                          <span>•</span>
                          <span>{formatDate(featuredPosts[0].createdAt)}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span>{featuredPosts[0].likesCount}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenPublication(featuredPosts[0].id)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-[#0b5592] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#073665]"
                        >
                          Read More
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </article>

                    <div className="grid gap-5">
                      {featuredPosts.slice(1).map((publication) => (
                        <article
                          key={publication.id}
                          className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <img
                            src={publication.featuredImageUrl}
                            alt={publication.title}
                            className="mb-4 h-40 w-full rounded-3xl object-cover"
                          />
                          <div className="flex flex-wrap gap-2 pb-3">
                            {publication.categories.map((item) => (
                              <span
                                key={item.id}
                                className="rounded-full bg-[#e9f4de] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#536d24]"
                              >
                                {item.name}
                              </span>
                            ))}
                          </div>
                          <h3 className="text-xl font-semibold text-slate-900">
                            {publication.title}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {publication.excerpt}
                          </p>
                          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                            <span>{formatDate(publication.createdAt)}</span>
                            <button
                              type="button"
                              onClick={() => handleOpenPublication(publication.id)}
                              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#0b5592] px-4 text-sm font-semibold text-white transition hover:bg-[#073665]"
                            >
                              Read More
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5d8c3a]">
                      Latest Posts
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">Trending stories</h2>
                  </div>
                </div>

                {sectionLoading ? (
                  <div className="flex min-h-[180px] items-center justify-center text-slate-500">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                ) : latestPosts.length === 0 ? (
                  <p className="text-sm text-slate-500">No latest posts available.</p>
                ) : (
                  <div className="space-y-4">
                    {latestPosts.map((publication) => (
                      <article key={publication.id} className="rounded-3xl border border-slate-200 bg-[#f8fafc] p-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={publication.featuredImageUrl}
                            alt={publication.title}
                            className="h-20 w-20 rounded-3xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex flex-wrap gap-2">
                              {publication.categories.map((item) => (
                                <span
                                  key={item.id}
                                  className="rounded-full bg-[#e9f4de] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#536d24]"
                                >
                                  {item.name}
                                </span>
                              ))}
                            </div>
                            <h3 className="text-base font-semibold text-slate-900">
                              {publication.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {publication.excerpt}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                          <span>{formatDate(publication.createdAt)}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenPublication(publication.id)}
                            className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#0b5592] px-4 text-sm font-semibold text-white transition hover:bg-[#073665]"
                          >
                            Read More
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </section>

          <section className="mt-10 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5d8c3a]">Explore</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">All publications</h2>
              </div>
              <p className="text-sm text-slate-500">
                Browse the newest posts across all categories.
              </p>
            </div>

            {listLoading ? (
              <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
                <Loader2 className="mx-auto mb-4 size-6 animate-spin" />
                Loading articles...
              </div>
            ) : listError ? (
              <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-red-600 shadow-sm">
                {listError}
              </div>
            ) : publications.length === 0 ? (
              <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
                No publications found for the selected filters.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {publications.map((publication) => (
                  <article key={publication.id} className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <img
                      src={publication.featuredImageUrl}
                      alt={publication.title}
                      className="h-64 w-full object-cover"
                    />
                    <div className="p-6">
                      <div className="mb-4 flex flex-wrap gap-2">
                        {publication.categories.map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full bg-[#e9f4de] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#536d24]"
                          >
                            {item.name}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-2xl font-semibold text-slate-900">
                        {publication.title}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-slate-600">
                        {publication.excerpt}
                      </p>
                      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span>{publication.author}</span>
                          <span>•</span>
                          <span>{formatDate(publication.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(publication)}
                            disabled={loadingLikeIds.includes(publication.id)}
                            className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${publication.likedByCurrentUser ? "bg-red-500 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                          >
                            <Heart className={`h-4 w-4 ${publication.likedByCurrentUser ? "text-white" : "text-red-500"}`} />
                            {publication.likesCount}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPublication(publication.id)}
                            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0b5592] px-4 text-sm font-semibold text-white transition hover:bg-[#073665]"
                          >
                            Read More
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
          </section>
        </div>
      </main>
    </>
  );
};

export default HomePage;
