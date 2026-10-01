import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const article = await prisma.article.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Haber bulunamadı." },
        { status: 404 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        articleId: article.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("GET /api/haber/[slug]/comments error:", error);

    return NextResponse.json(
      { error: "Yorumlar alınırken bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "İsim veya kullanıcı adı gerekli." },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Yorum boş bırakılamaz." },
        { status: 400 }
      );
    }

    if (name.length > 40) {
      return NextResponse.json(
        { error: "İsim en fazla 40 karakter olabilir." },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: "Yorum en fazla 1000 karakter olabilir." },
        { status: 400 }
      );
    }

    const article = await prisma.article.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Haber bulunamadı." },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        name,
        content,
        articleId: article.id,
      },
      select: {
        id: true,
        name: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/haber/[slug]/comments error:", error);

    return NextResponse.json(
      { error: "Yorum gönderilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}