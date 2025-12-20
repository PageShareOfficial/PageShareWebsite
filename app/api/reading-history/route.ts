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

    const history = await prisma.readingHistory.findMany({
      where: { userId: session.user.id },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching reading history:", error);
    return NextResponse.json({ error: "Failed to fetch reading history" }, { status: 500 });
  }
}

