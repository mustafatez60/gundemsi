import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

type ArticleBlockInput = {
  type: "TEXT" | "IMAGE";
  content: string;
  isAiGenerated?: boolean;
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        category: true,
        blocks: {
          orderBy: { order: "asc" },
        },
        sources: true,
        tags: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Haber bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      article,
    });
  } catch (error) {
    console.error("GET /api/admin/haberler/[id] error:", error);

    return NextResponse.json(
      { error: "Haber alınırken bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const {
      title,
      authorName,
      description,
      categorySlug,
      coverImage,
      videoUrl,
      isAiGenerated: bodyIsAiGenerated,
      comment,
      blocks,
      sources,
      tags,
      status,
    } = body as {
      title?: string;
      authorName?: string;
      description?: string;
      categorySlug?: string;
      coverImage?: string;
      videoUrl?: string;
      isAiGenerated?: boolean;
      comment?: string;
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

    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: "Haber bulunamadı." },
        { status: 404 }
      );
    }

    const nextStatus = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

    const legacyContent = validBlocks
      .filter((block) => block.type === "TEXT")
      .map((block) => block.content.trim())
      .join("\n\n");

    const sourceData = Array.isArray(sources)
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
      : [];

const tagNames = Array.isArray(tags)
  ? Array.from(
      new Map(
        tags
          .filter(
            (tag): tag is string =>
              typeof tag === "string" && tag.trim().length > 0
          )
          .map((tag) => {
            const name = tag.trim().replace(/^#+/, "");
            return [createSlug(name), name] as const;
          })
          .filter(([, name]) => Boolean(name))
      ).values()
    )
  : [];

    const updatedArticle = await prisma.$transaction(async (tx) => {
      // Eski blokları temizle.
      await tx.articleBlock.deleteMany({
        where: { articleId: id },
      });

      await tx.article.update({
        where: { id },
        data: {
          title: title.trim(),
          authorName: typeof authorName === "string" ? authorName.trim() || null : null,
          description: description.trim(),
          content: legacyContent,
          coverImage: coverImage.trim(),
          videoUrl: typeof videoUrl === "string" ? videoUrl.trim() || null : null,
          isAiGenerated: Boolean(bodyIsAiGenerated),
          comment: typeof comment === "string" ? comment.trim() || null : null,
          status: nextStatus,
          publishedAt:
            nextStatus === "PUBLISHED"
              ? existingArticle.publishedAt ?? new Date()
              : null,
          category: {
            connect: { id: category.id },
          },
          blocks: {
            create: validBlocks.map((block, index) => ({
              type: block.type,
              content: block.content.trim(),
              isAiGenerated:
                block.type === "IMAGE" && Boolean(block.isAiGenerated),
              order: index,
            })),
          },
          sources: {
            deleteMany: {},
            create: sourceData,
          },
          tags: {
            set: [],
          },
        },
      });

      const tagRecords: Array<{ id: string }> = [];

      for (const name of tagNames) {
        const slug = createSlug(name);

        const existingTag = await tx.tag.findFirst({
          where: {
            OR: [
              { name },
              { slug },
            ],
          },
        });

        if (existingTag) {
          tagRecords.push(existingTag);
        } else {
          const newTag = await tx.tag.create({
            data: {
              name,
              slug,
            },
          });

          tagRecords.push(newTag);
        }
      }

      await tx.article.update({
        where: { id },
        data: {
          tags: {
            set: tagRecords.map((tag) => ({ id: tag.id })),
          },
        },
      });

      const finalArticle = await tx.article.findUnique({
        where: { id },
        include: {
          category: true,
          blocks: {
            orderBy: { order: "asc" },
          },
          sources: true,
          tags: true,
        },
      });

      return finalArticle;
    });

    return NextResponse.json({
      success: true,
      article: updatedArticle,
    });
  } catch (error) {
    console.error("PUT /api/admin/haberler/[id] error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Haber güncellenirken bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}