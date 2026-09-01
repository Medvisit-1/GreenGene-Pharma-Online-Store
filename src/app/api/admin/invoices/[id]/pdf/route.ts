import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthed } from "@/lib/auth";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";

// Clean, server-rendered invoice PDF — identical to the one emailed to customers.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await renderInvoicePdf(inv);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${inv.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
