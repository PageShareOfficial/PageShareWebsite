import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Save version history
    await prisma.$executeRaw`
      INSERT INTO PostVersion (id, postId, contentMdx, createdAt)
      VALUES (${crypto.randomUUID()}, ${id}, ${post.contentMdx}, ${new Date()})
    `.catch(() => {
      // Table might not exist yet, that's okay
    });

    // Update tags
    if (body.tags) {
      await prisma.postTag.deleteMany({
        where: { postId: id },
      });

      for (const tagName of body.tags) {
        let tag = await prisma.tag.findUnique({
          where: { name: tagName },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              slug: tagName.toLowerCase().replace(/\s+/g, "-"),
            },
          });
        }

        await prisma.postTag.create({
          data: {
            postId: id,
            tagId: tag.id,
          },
        });
      }
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        contentMdx: body.contentMdx,
        categoryId: body.categoryId || null,
        status: body.status,
        publishedAt: body.status === "PUBLISHED" && !post.publishedAt ? new Date() : post.publishedAt,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

