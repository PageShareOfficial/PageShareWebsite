import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const progressSchema = z.object({
  percent: z.number().min(0).max(100),
});

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
    const body = await request.json();
    const { percent } = progressSchema.parse(body);

    const post = await prisma.post.findUnique({
      where: { slug },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.readingHistory.upsert({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: post.id,
        },
      },
      update: {
        lastScrollPercent: percent,
      },
      create: {
        userId: session.user.id,
        postId: post.id,
        lastScrollPercent: percent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating reading progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}

