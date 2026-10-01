"use client";

import { useState } from "react";

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  coverImage: string | null;
  isFeatured: boolean;
  category: {
    name: string;
  };
}

interface Comment {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  articleId: string;
}

interface AdminNewsClientProps {
  articles: Article[];
}

const filters = ["Tümü", "Yayında", "Taslak"];

export default function AdminNewsClient({
  articles: initialArticles,
}: AdminNewsClientProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [error, setError] = useState("");
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [deletingComment, setDeletingComment] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tümü");
  const [deleteArticle, setDeleteArticle] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingFeatured, setUpdatingFeatured] = useState<string | null>(
    null
  );

  async function toggleFeaturedArticle(article: Article) {
    try {
      setUpdatingFeatured(article.id);
      setError("");

      const nextFeaturedState = !article.isFeatured;

      const response = await fetch("/api/admin/haberler", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: article.id,
          isFeatured: nextFeaturedState,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Öne çıkan haber güncellenemedi."
        );
      }

      setArticles((current) =>
        current.map((item) =>
          item.id === article.id
            ? { ...item, isFeatured: nextFeaturedState }
            : nextFeaturedState
              ? { ...item, isFeatured: false }
              : item
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Öne çıkan haber güncellenemedi."
      );
    } finally {
      setUpdatingFeatured(null);
    }
  }

  async function toggleComments(articleId: string) {
    if (openComments === articleId) {
      setOpenComments(null);
      setComments([]);
      return;
    }

    try {
      setLoadingComments(true);
      setError("");

      const response = await fetch(
        `/api/admin/haberler?comments=${encodeURIComponent(articleId)}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Yorumlar alınamadı.");
      }

      setComments(data.comments ?? []);
      setOpenComments(articleId);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Yorumlar alınırken bir hata oluştu."
      );
    } finally {
      setLoadingComments(false);
    }
  }

  function requestDeleteComment(comment: Comment) {
    setCommentToDelete(comment);
  }

  async function confirmDeleteComment() {
    if (!commentToDelete) return;

    const commentId = commentToDelete.id;

    try {
      setDeletingComment(commentId);
      setError("");

      const response = await fetch("/api/admin/haberler", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Yorum silinemedi.");
      }

      setComments((current) =>
        current.filter((comment) => comment.id !== commentId)
      );
      setCommentToDelete(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Yorum silinirken bir hata oluştu."
      );
    } finally {
      setDeletingComment(null);
    }
  }

  async function deleteSelectedArticle() {
    if (!deleteArticle) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch("/api/admin/haberler", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteArticle.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Haber silinemedi.");
      }

      setArticles((current) =>
        current.filter((item) => item.id !== deleteArticle.id)
      );
      setDeleteArticle(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Haber silinirken bir hata oluştu."
      );
    } finally {
      setDeleting(false);
    }
  }

  const filteredArticles = articles.filter((article) => {
    const searchText = search.trim().toLocaleLowerCase("tr-TR");

    const matchesSearch =
      searchText === "" ||
      article.title.toLocaleLowerCase("tr-TR").includes(searchText) ||
      article.category.name.toLocaleLowerCase("tr-TR").includes(searchText);

    const matchesFilter =
      activeFilter === "Tümü" ||
      (activeFilter === "Yayında" && article.status === "PUBLISHED") ||
      (activeFilter === "Taslak" && article.status !== "PUBLISHED");

    return matchesSearch && matchesFilter;
  });

  return (
    <main className="min-h-screen bg-[#080b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              GÜNDEMSİ
            </p>
            <h1 className="mt-1 text-3xl font-black">Haberler</h1>
            <p className="mt-1 text-sm text-slate-400">
              Haberlerini, kapaklarını ve yayın durumlarını yönet.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin"
              className="rounded-xl border border-slate-800 bg-[#111722] px-5 py-3 text-sm font-semibold transition hover:bg-slate-800"
            >
              ← Geri
            </a>
            <a
              href="/admin/haberler/yeni"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              + Yeni Haber
            </a>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Haber ara..."
            className="w-full rounded-xl border border-slate-800 bg-[#111722] px-4 py-3 text-sm outline-none transition focus:border-violet-500"
          />

          <div className="flex shrink-0 flex-wrap gap-2">
            {filters.map((filter) => {
              const active = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                      : "border border-slate-800 bg-[#111722] text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-[#111722] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          {articles.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold text-slate-200">Henüz haber yok.</p>
              <p className="mt-2 text-sm text-slate-400">
                İlk haberini oluşturarak başlayabilirsin.
              </p>
              <a
                href="/admin/haberler/yeni"
                className="mt-5 inline-block rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                + İlk Haberi Oluştur
              </a>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold text-slate-200">
                Aradığın kriterlere uygun haber bulunamadı.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Arama metnini veya filtreyi değiştirmeyi deneyebilirsin.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredArticles.map((article) => (
                <div key={article.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center">
                    <a
                      href={`/haber/${article.slug}`}
                      className="block w-full shrink-0 md:w-40"
                    >
                      {article.coverImage ? (
                        <div className="aspect-video overflow-hidden rounded-xl bg-slate-800">
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            className="h-full w-full object-cover transition duration-300 hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-800 text-xs font-semibold text-slate-500">
                          Kapak yok
                        </div>
                      )}
                    </a>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">
                          {article.category.name}
                        </span>

                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            article.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          {article.status === "PUBLISHED"
                            ? "Yayında"
                            : "Taslak"}
                        </span>

                        {article.isFeatured && (
                          <span className="rounded-lg bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-300">
                            Öne çıkarıldı
                          </span>
                        )}
                      </div>

                      <a
                        href={`/haber/${article.slug}`}
                        className="mt-2 block text-lg font-black leading-tight transition hover:text-slate-300 sm:text-xl"
                      >
                        {article.title}
                      </a>

                      <p className="mt-2 text-xs text-slate-500">
                        {new Date(article.createdAt).toLocaleDateString(
                          "tr-TR"
                        )}
                        {" · "}
                        /haber/{article.slug}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 md:w-auto md:justify-end">
                      <button
                        type="button"
                        onClick={() => toggleComments(article.id)}
                        className="rounded-lg border border-slate-800 bg-[#111722] px-3 py-2 text-xs font-semibold transition hover:bg-slate-800"
                      >
                        Yorumlar
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFeaturedArticle(article)}
                        disabled={updatingFeatured === article.id}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          article.isFeatured
                            ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                            : "border-slate-800 bg-[#111722] hover:bg-slate-800"
                        }`}
                      >
                        {updatingFeatured === article.id
                          ? "Güncelleniyor..."
                          : article.isFeatured
                            ? "Öne Çıkarıldı"
                            : "Öne Çıkar"}
                      </button>

                      <a
                        href={`/admin/haberler/duzenle?id=${article.id}`}
                        className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold transition hover:bg-slate-800"
                      >
                        Düzenle
                      </a>

                      <button
                        type="button"
                        onClick={() => setDeleteArticle(article)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                      >
                        Sil
                      </button>
                    </div>
                  </div>

                  {openComments === article.id && (
                    <div className="mt-5 rounded-2xl border border-slate-800 bg-[#0d111a] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-black text-slate-100">Yorumlar</h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Bu habere gelen yorumlar
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleComments(article.id)}
                          className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                        >
                          Kapat
                        </button>
                      </div>

                      {loadingComments ? (
                        <p className="mt-5 text-sm text-slate-400">
                          Yorumlar yükleniyor...
                        </p>
                      ) : comments.length === 0 ? (
                        <div className="mt-5 rounded-xl border border-slate-800 p-5 text-center">
                          <p className="text-sm font-semibold text-slate-300">
                            Henüz yorum yok.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-5 space-y-3">
                          {comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="rounded-xl border border-slate-800 bg-[#111722] p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-black text-slate-100">
                                    {comment.name}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {new Date(comment.createdAt).toLocaleString("tr-TR")}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => requestDeleteComment(comment)}
                                  disabled={deletingComment === comment.id}
                                  className="rounded-lg border border-red-900/60 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {deletingComment === comment.id
                                    ? "Siliniyor..."
                                    : "Yorumu Sil"}
                                </button>
                              </div>

                              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">
                                {comment.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {commentToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#111722] shadow-2xl">
            <div className="border-b border-slate-800 px-6 py-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-400">
                GÜNDEMSİ • YORUM YÖNETİMİ
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-100">
                Yorumu Sil
              </h2>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-slate-300">
                Bu yorumu kalıcı olarak silmek istediğine emin misin?
                <span className="block mt-1 text-xs text-slate-500">
                  Bu işlem geri alınamaz.
                </span>
              </p>

              <div className="mt-4 rounded-xl border border-slate-800 bg-[#0d111a] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-100">
                    {commentToDelete.name}
                  </p>
                  <span className="text-xs text-slate-500">
                    {new Date(commentToDelete.createdAt).toLocaleDateString(
                      "tr-TR"
                    )}
                  </span>
                </div>

                <p className="mt-3 max-h-32 overflow-y-auto whitespace-pre-line text-sm leading-6 text-slate-300">
                  {commentToDelete.content}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deletingComment === commentToDelete.id}
                onClick={() => setCommentToDelete(null)}
                className="rounded-xl border border-slate-800 bg-[#111722] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={deletingComment === commentToDelete.id}
                onClick={confirmDeleteComment}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingComment === commentToDelete.id
                  ? "Siliniyor..."
                  : "Yorumu Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#111722] p-6 shadow-2xl">
            <h2 className="text-xl font-black">Haberi Sil</h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Bu haberi silmek istediğine emin misin?
            </p>

            <p className="mt-2 rounded-xl bg-[#0d111a] p-3 text-sm font-semibold text-slate-100">
              {deleteArticle.title}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteArticle(null)}
                className="rounded-xl border border-slate-800 bg-[#111722] px-5 py-3 text-sm font-semibold transition hover:bg-slate-800 disabled:opacity-50"
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={deleteSelectedArticle}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Siliniyor..." : "Haberi Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
