import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prefs = await prisma.subscriptionPreferences.findUnique({
      where: { userId: session.user.id },
    });

    if (!prefs) {
      // Create default preferences
      const newPrefs = await prisma.subscriptionPreferences.create({
        data: {
          userId: session.user.id,
          digestFrequency: "WEEKLY",
          contentTypes: "[]",
          deliveryChannel: "EMAIL",
        },
      });
      return NextResponse.json(newPrefs);
    }

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const prefs = await prisma.subscriptionPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        digestFrequency: body.digestFrequency,
        contentTypes: body.contentTypes,
        quietHoursStart: body.quietHoursStart,
        quietHoursEnd: body.quietHoursEnd,
        deliveryChannel: body.deliveryChannel,
      },
      create: {
        userId: session.user.id,
        digestFrequency: body.digestFrequency || "WEEKLY",
        contentTypes: body.contentTypes || "[]",
        quietHoursStart: body.quietHoursStart,
        quietHoursEnd: body.quietHoursEnd,
        deliveryChannel: body.deliveryChannel || "EMAIL",
      },
    });

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}

