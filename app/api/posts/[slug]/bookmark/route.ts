import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const post = await prisma.post.findUnique({
      where: { slug },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: post.id,
        },
      },
    });

    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: post.id,
          },
        },
      });
      return NextResponse.json({ bookmarked: false });
    } else {
      await prisma.bookmark.create({
        data: {
          userId: session.user.id,
          postId: post.id,
        },
      });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json({ error: "Failed to toggle bookmark" }, { status: 500 });
  }
}

