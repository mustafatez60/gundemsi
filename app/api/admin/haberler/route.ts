import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "../../../../lib/prisma";
import {
  verifyAdminSession,
  ADMIN_COOKIE,
} from "../../../../lib/admin-auth";

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/ÄŸ/g, "g")
    .replace(/Ã¼/g, "u")
    .replace(/ÅŸ/g, "s")
    .replace(/Ä±/g, "i")
    .replace(/Ã¶/g, "o")
    .replace(/Ã§/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type ArticleBlockInput = {
  type: "TEXT" | "IMAGE";
  content: string;
};

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(
    cookieStore.get(ADMIN_COOKIE)?.value
  );

  return session;
}

export async function GET(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentsArticleId = searchParams.get("comments");

    if (commentsArticleId) {
      const comments = await prisma.comment.findMany({
        where: {
          articleId: commentsArticleId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          content: true,
          createdAt: true,
          articleId: true,
        },
      });

      return NextResponse.json({
        success: true,
        comments,
      });
    }

    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        blocks: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Haberler alınırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      categorySlug,
      coverImage,
      blocks,
      sources,
      tags,
      status,
    } = body as {
      title?: string;
      description?: string;
      categorySlug?: string;
      coverImage?: string;
      blocks?: ArticleBlockInput[];
      sources?: { name: string; url: string }[];
      tags?: string[];
      status?: "DRAFT" | "PUBLISHED";
    };

    if (
      !title?.trim() ||
      !description?.trim() ||
      !categorySlug ||
      !coverImage?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Başlık, açıklama, kategori ve haber kapağı zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: "Haber içerik blokları gerekli." },
        { status: 400 }
      );
    }

    const validBlocks = blocks.filter(
      (block) =>
        (block.type === "TEXT" || block.type === "IMAGE") &&
        typeof block.content === "string" &&
        block.content.trim()
    );

    if (validBlocks.length === 0) {
      return NextResponse.json(
        { error: "En az bir dolu içerik bloğu eklemelisin." },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategori bulunamadı." },
        { status: 400 }
      );
    }

    let slug = createSlug(title);

    const existingArticle = await prisma.article.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      slug = `${slug}-${Date.now()}`;
    }

    const legacyContent = validBlocks
      .filter((block) => block.type === "TEXT")
      .map((block) => block.content.trim())
      .join("\n\n");

    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        slug,
        description: description.trim(),
        content: legacyContent,
        comment: null,
        coverImage: coverImage.trim(),
        status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,

        category: {
          connect: {
            id: category.id,
          },
        },

        blocks: {
          create: validBlocks.map((block, index) => ({
            type: block.type,
            content: block.content.trim(),
            order: index,
          })),
        },

        sources: {
          create: Array.isArray(sources)
            ? sources
                .filter(
                  (source) =>
                    source &&
                    typeof source.name === "string" &&
                    typeof source.url === "string" &&
                    source.name.trim() &&
                    source.url.trim()
                )
                .map((source) => ({
                  name: source.name.trim(),
                  url: source.url.trim(),
                }))
            : [],
        },

        tags: {
          connectOrCreate: Array.isArray(tags)
            ? tags
                .filter(
                  (tag): tag is string =>
                    typeof tag === "string" && tag.trim().length > 0
                )
                .map((tag) => {
                  const name = tag.trim();
                  const tagSlug = createSlug(name);

                  return {
                    where: { slug: tagSlug },
                    create: {
                      name,
                      slug: tagSlug,
                    },
                  };
                })
            : [],
        },
      },

      include: {
        category: true,
        blocks: {
          orderBy: { order: "asc" },
        },
        sources: true,
        tags: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        article,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Haber oluşturulurken bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }
const body = await request.json();
const { id, commentId } = body;

if (commentId) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    return NextResponse.json(
      { error: "Yorum bulunamadı." },
      { status: 404 }
    );
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return NextResponse.json({
    success: true,
    message: "Yorum başarıyla silindi.",
  });
}

    if (!id) {
      return NextResponse.json(
        { error: "Haber ID gerekli." },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Haber bulunamadı." },
        { status: 404 }
      );
    }

    await prisma.article.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Haber başarıyla silindi.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Haber silinirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, isFeatured } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Haber ID gerekli." },
        { status: 400 }
      );
    }

    if (typeof isFeatured !== "boolean") {
      return NextResponse.json(
        { error: "isFeatured değeri gerekli." },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Haber bulunamadı." },
        { status: 404 }
      );
    }

    if (isFeatured) {
      const updatedArticle = await prisma.$transaction(async (tx) => {
        await tx.article.updateMany({
          where: {
            isFeatured: true,
            id: { not: id },
          },
          data: {
            isFeatured: false,
          },
        });

        return tx.article.update({
          where: { id },
          data: {
            isFeatured: true,
          },
        });
      });

      return NextResponse.json({
        success: true,
        article: updatedArticle,
        message: "Haber öne çıkarıldı.",
      });
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        isFeatured: false,
      },
    });

    return NextResponse.json({
      success: true,
      article: updatedArticle,
      message: "Haber öne çıkarma kaldırıldı.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Öne çıkan haber güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}