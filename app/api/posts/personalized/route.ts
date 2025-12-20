import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json([]);
    }

    // Get followed authors and tags
    const [followedAuthors, followedTags] = await Promise.all([
      prisma.followAuthor.findMany({
        where: { followerId: session.user.id },
        select: { authorId: true },
      }),
      prisma.followTag.findMany({
        where: { followerId: session.user.id },
        select: { tagId: true },
      }),
    ]);

    const authorIds = followedAuthors.map((f) => f.authorId);
    const tagIds = followedTags.map((f) => f.tagId);

    if (authorIds.length === 0 && tagIds.length === 0) {
      return NextResponse.json([]);
    }

    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { authorId: { in: authorIds } },
          { tags: { some: { tagId: { in: tagIds } } } },
        ],
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching personalized posts:", error);
    return NextResponse.json({ error: "Failed to fetch personalized posts" }, { status: 500 });
  }
}

