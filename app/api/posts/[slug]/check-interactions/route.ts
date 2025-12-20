import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ isLiked: false, isBookmarked: false });
    }

    const { slug } = await params;
    const post = await prisma.post.findUnique({
      where: { slug },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [like, bookmark] = await Promise.all([
      prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: post.id,
          },
        },
      }),
      prisma.bookmark.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: post.id,
          },
        },
      }),
    ]);

    return NextResponse.json({
      isLiked: !!like,
      isBookmarked: !!bookmark,
    });
  } catch (error) {
    console.error("Error checking interactions:", error);
    return NextResponse.json({ isLiked: false, isBookmarked: false });
  }
}

