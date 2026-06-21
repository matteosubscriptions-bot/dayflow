import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/apiAuth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = await requireUserId();
    const owned = await prisma.goal.findFirst({ where: { id: params.id, userId } });
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await req.json()) as Partial<{
      title: string;
      description: string;
      status: string;
      progress: number;
      alignment: number;
      kpi: string;
    }>;

    const goal = await prisma.goal.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ goal });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = await requireUserId();
    const owned = await prisma.goal.findFirst({ where: { id: params.id, userId } });
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.goal.update({ where: { id: params.id }, data: { status: "dropped" } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (isResponse(err)) return err;
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
