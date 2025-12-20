import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      orderBy: [
        { likes: { _count: "desc" } },
        { publishedAt: "desc" },
      ],
      take: 10,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching trending posts:", error);
    return NextResponse.json({ error: "Failed to fetch trending posts" }, { status: 500 });
  }
}

