import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getEmpresa } from "@/lib/data/empresas";
import { googleEnabled, syncEmpresa } from "@/lib/google/places";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!googleEnabled()) return NextResponse.json({ ok: false, error: "Configure GOOGLE_PLACES_API_KEY para atualizar." }, { status: 503 });
  const empresa = getEmpresa(id);
  if (!empresa?.placeId) return NextResponse.json({ ok: false, error: "Essa empresa ainda não está vinculada ao Google." }, { status: 400 });
  try {
    await syncEmpresa(id, empresa.placeId);
    revalidatePath("/clientes");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "O Google não respondeu. Tente de novo." }, { status: 502 });
  }
}
