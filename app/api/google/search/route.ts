import { NextResponse, type NextRequest } from "next/server";
import { GoogleApiError, googleEnabled, searchText } from "@/lib/google/places";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!googleEnabled()) return NextResponse.json({ enabled: false, results: [] });
  if (q.length < 3) return NextResponse.json({ enabled: true, results: [] });
  try {
    const places = await searchText(q);
    return NextResponse.json({
      enabled: true,
      results: places.map((p) => ({
        placeId: p.id,
        nome: p.displayName?.text ?? "",
        endereco: p.formattedAddress ?? "",
        categoria: p.primaryTypeDisplayName?.text ?? null,
        rating: p.rating ?? null,
        total: p.userRatingCount ?? null,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { enabled: true, results: [], error: e instanceof GoogleApiError ? e.motivo : "A busca no Google falhou. Tente de novo em instantes." },
      { status: 502 },
    );
  }
}
