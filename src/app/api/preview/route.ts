import { ApiError, errorResponse } from "@/lib/server/claude";
import { getPreview } from "@/lib/server/preview";

export const maxDuration = 30;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url).searchParams.get("url") ?? "";
    if (!url || url.length > 2000 || !/^https?:\/\//i.test(url)) {
      throw new ApiError("Falta una dirección válida.", 400);
    }
    return Response.json({ preview: await getPreview(url) });
  } catch (error) {
    return errorResponse(error);
  }
}
