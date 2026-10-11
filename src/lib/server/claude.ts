import Anthropic from "@anthropic-ai/sdk";

export const MODEL_ITEM = "claude-haiku-5-5";
export const MODEL_PROFILE = "claude-sonnet-5-5";

/** Error con un mensaje apto para mostrar al usuario y el código HTTP que corresponde. */
export class ApiError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ApiError("Falta ANTHROPIC_API_KEY en el servidor. Añádela a .env.local y reinicia.");
  }
  return (client ??= new Anthropic());
}

type JsonCall = {
  model: string;
  system: string;
  user: string;
  schema: Record<string, unknown>;
  effort: "low" | "medium" | "high";
  maxTokens: number;
};

/** Llama a Claude y devuelve el JSON que cumple el esquema. */
export async function callJson<T>({ model, system, user, schema, effort, maxTokens }: JsonCall): Promise<T> {
  let response: Anthropic.Message;
  try {
    response = await getClient().messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { effort, format: { type: "json_schema", schema } },
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Anthropic.AuthenticationError) {
      throw new ApiError("La clave de Anthropic no es válida. Revisa ANTHROPIC_API_KEY.", 500);
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new ApiError("Se alcanzó el límite de uso de la API. Inténtalo en unos minutos.", 429);
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Error de la API de Anthropic:", error.status, error.message);
      throw new ApiError("La API de Anthropic devolvió un error.", 502);
    }
    throw error;
  }

  if (response.stop_reason === "refusal") {
    throw new ApiError("El modelo no pudo procesar este contenido.", 422);
  }
  if (response.stop_reason === "max_tokens") {
    throw new ApiError("La respuesta del modelo quedó incompleta.", 502);
  }
  const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text;
  if (!text) throw new ApiError("El modelo no devolvió contenido.", 502);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("La respuesta del modelo no tenía el formato esperado.", 502);
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
  console.error(error);
  return Response.json({ error: "Error inesperado en el servidor." }, { status: 500 });
}

export const clip = (value: unknown, max: number): string =>
  typeof value === "string" ? value.slice(0, max) : "";
