import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional(),
  contentMdx: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]),
  scheduledFor: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "AUTHOR" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = postSchema.parse(body);

    // Check slug uniqueness
    const existing = await prisma.post.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        contentMdx: data.contentMdx,
        categoryId: data.categoryId || null,
        status: data.status,
        authorId: session.user.id,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      },
    });

    // Add tags
    for (const tagName of data.tags) {
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
          postId: post.id,
          tagId: tag.id,
        },
      });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
