import prisma from "../../../lib/prisma";
import AdminNewsClient from "./AdminNewsClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;

  const pageParam = Number(params.page ?? "1");
  const page =
    Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const search = (params.search ?? "").trim();
  const status = params.status ?? "Tümü";

  const where = {
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              category: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
    ...(status === "Yayında"
      ? {
          status: "PUBLISHED",
        }
      : status === "Taslak"
        ? {
            status: {
              not: "PUBLISHED",
            },
          }
        : {}),
  };

  const [articles, totalArticles] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
        coverImage: true,
        isFeatured: true,
        isBreaking: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    }),

    prisma.article.count({
      where,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalArticles / PAGE_SIZE));

  const safePage = Math.min(page, totalPages);

  const serializedArticles = articles.map((article) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    status: article.status,
    createdAt: article.createdAt.toISOString(),
    coverImage: article.coverImage,
    isFeatured: article.isFeatured,
    isBreaking: article.isBreaking,
    category: {
      name: article.category.name,
    },
  }));

  return (
    <AdminNewsClient
      articles={serializedArticles}
      currentPage={safePage}
      totalPages={totalPages}
      totalArticles={totalArticles}
      search={search}
      activeFilter={status}
    />
  );
}