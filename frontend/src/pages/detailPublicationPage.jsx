import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/useAuthStore";
import { usePublicationsStore } from "../store/usePublicationsStore";

const formatDate = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const DetailPublicationPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { authUser, isCheckingAuth, checkAuth } = useAuthStore();
  const { fetchPublication, likePublication, unlikePublication } = usePublicationsStore();

  const [publication, setPublication] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authUser && !isCheckingAuth) {
      toast.error("You must log in to read the complete publication.");
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }

    if (!authUser) {
      return;
    }

    const loadDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchPublication(id);
        setPublication(response.publication);
        setRelatedPosts(response.relatedPosts || []);
      } catch (err) {
        if (err?.response?.status === 401) {
          await checkAuth();
          toast.error("You must log in to read the complete publication.");
          navigate("/login", { state: { from: location.pathname + location.search } });
          return;
        }

        if (err?.response?.status === 404) {
          setError("Publication not found.");
        } else {
          setError(err?.response?.data?.message || "Unable to load publication.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDetail();
  }, [authUser, checkAuth, fetchPublication, id, isCheckingAuth, location.pathname, location.search, navigate]);

  const handleBack = () => {
    navigate("/");
  };

  const handleToggleLike = async () => {
    if (!authUser) {
      toast.error("You must log in as a user to react to publications.");
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }

    if (authUser.role === "admin") {
      toast.error("Administrator accounts cannot react to publications.");
      return;
    }

    if (!publication || isLikeLoading) {
      return;
    }

    setIsLikeLoading(true);

    try {
      const response = publication.likedByCurrentUser
        ? await unlikePublication(publication.id)
        : await likePublication(publication.id);

      setPublication((current) =>
        current
          ? {
              ...current,
              likedByCurrentUser: response.likedByCurrentUser,
              likesCount: response.likesCount,
            }
          : current,
      );
    } catch (err) {
      if (err?.response?.status === 401) {
        await checkAuth();
        toast.error("You must log in as a user to react to publications.");
        navigate("/login", { state: { from: location.pathname + location.search } });
        return;
      }

      toast.error(err?.response?.data?.message || "Unable to update reaction.");
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleRelatedClick = (postId) => {
    navigate(`/posts/${postId}`);
  };

  return (
    <>
      <Navbar showFilters={false} />

      <main className="pt-[110px] pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Posts
          </button>

          {isLoading ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
              <Loader2 className="mx-auto mb-4 size-6 animate-spin" />
              Loading publication...
            </div>
          ) : error ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-red-600 shadow-sm">
              {error}
            </div>
          ) : publication ? (
            <div className="space-y-10">
              <div className="grid gap-10 xl:grid-cols-[1.8fr_0.95fr]">
                <article className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
                  <img
                    src={publication.featuredImageUrl}
                    alt={publication.title}
                    className="h-[420px] w-full object-cover"
                  />

                  <div className="space-y-6 p-8 sm:p-12">
                    <div className="flex flex-wrap gap-3">
                      {publication.categories.map((categoryItem) => (
                        <span
                          key={categoryItem.id}
                          className="rounded-full bg-[#e9f4de] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#536d24]"
                        >
                          {categoryItem.name}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h1 className="text-4xl font-semibold text-slate-900">
                        {publication.title}
                      </h1>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span>{publication.author}</span>
                        <span>•</span>
                        <span>{formatDate(publication.createdAt)}</span>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={handleToggleLike}
                          disabled={isLikeLoading}
                          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${publication.likedByCurrentUser ? "bg-red-500 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                        >
                          <Heart className={`h-4 w-4 ${publication.likedByCurrentUser ? "text-white" : "text-red-500"}`} />
                          {publication.likesCount}
                        </button>
                      </div>
                    </div>

                    <div className="prose max-w-none whitespace-pre-line text-slate-700">
                      {publication.content}
                    </div>
                  </div>
                </article>

                <aside className="space-y-6">
                  <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5d8c3a]">
                      Related Posts
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900">You may also like</h2>
                  </div>

                  {relatedPosts.length === 0 ? (
                    <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                      No related posts available.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[720px] overflow-y-auto pr-2">
                      {relatedPosts.map((related) => (
                        <article key={related.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                          <img
                            src={related.featuredImageUrl}
                            alt={related.title}
                            className="mb-5 h-44 w-full rounded-3xl object-cover"
                          />
                          <div className="flex flex-wrap gap-2 pb-4">
                            {related.categories.map((categoryItem) => (
                              <span
                                key={categoryItem.id}
                                className="rounded-full bg-[#e9f4de] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#536d24]"
                              >
                                {categoryItem.name}
                              </span>
                            ))}
                          </div>
                          <h3 className="text-2xl font-semibold text-slate-900">
                            {related.title}
                          </h3>
                          <p className="mt-4 text-sm leading-7 text-slate-600">
                            {related.excerpt}
                          </p>
                          <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                            <span>{formatDate(related.createdAt)}</span>
                            <button
                              type="button"
                              onClick={() => handleRelatedClick(related.id)}
                              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#0b5592] px-4 text-sm font-semibold text-white transition hover:bg-[#073665]"
                            >
                              Read More
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </aside>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
};

export default DetailPublicationPage;
