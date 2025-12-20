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
    const tag = await prisma.tag.findUnique({
      where: { slug },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const existingFollow = await prisma.followTag.findUnique({
      where: {
        followerId_tagId: {
          followerId: session.user.id,
          tagId: tag.id,
        },
      },
    });

    if (existingFollow) {
      await prisma.followTag.delete({
        where: {
          followerId_tagId: {
            followerId: session.user.id,
            tagId: tag.id,
          },
        },
      });
      return NextResponse.json({ following: false });
    } else {
      await prisma.followTag.create({
        data: {
          followerId: session.user.id,
          tagId: tag.id,
        },
      });
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("Error toggling tag follow:", error);
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 });
  }
}

