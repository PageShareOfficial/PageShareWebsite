import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const author = await prisma.user.findUnique({
      where: { id },
    });

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const existingFollow = await prisma.followAuthor.findUnique({
      where: {
        followerId_authorId: {
          followerId: session.user.id,
          authorId: id,
        },
      },
    });

    if (existingFollow) {
      await prisma.followAuthor.delete({
        where: {
          followerId_authorId: {
            followerId: session.user.id,
            authorId: id,
          },
        },
      });
      return NextResponse.json({ following: false });
    } else {
      await prisma.followAuthor.create({
        data: {
          followerId: session.user.id,
          authorId: id,
        },
      });
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("Error toggling follow:", error);
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 });
  }
}

