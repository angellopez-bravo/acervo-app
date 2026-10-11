import type { Item, SourceApp } from "./types";

const DAY = 86_400_000;

// [app, hace N días, título, texto, temas, estilo, por qué atrae, id de YouTube opcional]
type Seed = [SourceApp, number, string, string, string[], string, string, string?];

const SEEDS: Seed[] = [
  ["youtube", 0, "Cómo se construye una cabaña de madera sin clavos", "Carpintería tradicional japonesa, de la selección del árbol al ensamblaje final.", ["carpintería", "artesanía", "arquitectura"], "documental pausado, plano fijo", "Muestra un oficio completo, con paciencia y sin prisa.", "dQw4w9WgXcQ"],
  ["instagram", 1, "Taller de cerámica en Oaxaca", "Barro negro bruñido a mano, sin torno ni esmalte.", ["cerámica", "artesanía", "México"], "fotografía cálida, luz natural", "Une material, técnica y lugar de una forma muy visual."],
  ["tiktok", 2, "Tres reglas para componer una foto de calle", "", ["fotografía", "composición", "ciudad"], "vídeo corto, didáctico", "Condensa una idea práctica que se puede probar el mismo día."],
  ["x", 3, "Hilo: por qué los mapas antiguos dibujaban monstruos", "Los márgenes del mapa como espacio de lo desconocido.", ["cartografía", "historia", "imaginario"], "texto largo, tono ensayístico", "Mezcla historia y símbolo con una pregunta central clara."],
  ["youtube", 5, "La tipografía de los carteles del metro de Madrid", "Un recorrido por el rotulado del metro desde 1919.", ["tipografía", "diseño", "ciudad"], "ensayo visual, narración en off", "Convierte un detalle cotidiano en objeto de estudio.", "9bZkp7q19f0"],
  ["instagram", 6, "Cuaderno de campo: líquenes del Pirineo", "Acuarela y notas a lápiz sobre papel crudo.", ["ilustración", "naturaleza", "cuaderno"], "acuarela, trazo suelto", "Observación lenta de lo pequeño, con mano propia."],
  ["tiktok", 9, "Pan de masa madre, hidratación del 80 %", "", ["cocina", "fermentación", "oficio"], "plano cenital, sin música", "Proceso repetible con resultado tangible."],
  ["x", 12, "Una casa de 40 m² que parece el doble", "Planos y fotos de una reforma con tabiques correderos.", ["arquitectura", "espacio pequeño", "diseño"], "imagen y plano, texto breve", "Resuelve un problema real con pocas decisiones claras."],
  ["youtube", 16, "Grabación de campo: lluvia en un bosque de hayas", "Cuarenta minutos de sonido ambiente, sin música.", ["sonido", "naturaleza", "ambiente"], "inmersivo, sin narración", "Invita a la atención sostenida.", "jNQXAC9IVRw"],
  ["instagram", 21, "Grabado en linóleo paso a paso", "Del dibujo a la estampación de una edición corta.", ["grabado", "ilustración", "artesanía"], "secuencia de fotos, tono sereno", "Hace visible la transformación del material."],
  ["x", 27, "Notas sobre el uso del silencio en el cine de Ozu", "", ["cine", "ritmo", "Japón"], "análisis breve, con fotogramas", "Una observación precisa sobre cómo se construye la calma."],
  ["tiktok", 34, "Cómo encuadernar un cuaderno con hilo de lino", "Costura copta en diez minutos.", ["encuadernación", "papel", "artesanía"], "vídeo corto, manos en primer plano", "Proyecto pequeño y alcanzable."],
  ["youtube", 48, "La historia de la imprenta de Plantin en Amberes", "Un taller del siglo XVI que sigue en pie.", ["imprenta", "historia", "tipografía"], "documental clásico", "Cruza oficio, historia y objeto conservado.", "kJQP7kiw5Fk"],
  ["instagram", 63, "Mapa a mano de un barrio de Lisboa", "Tinta sepia y rotulación a pincel.", ["cartografía", "ilustración", "ciudad"], "dibujo detallado, tono nostálgico", "Combina mapa, letra y lugar."],
];

export function buildSampleItems(now = Date.now()): Item[] {
  return SEEDS.map(([source, daysAgo, title, text, topics, style, appeal, yt], i) => ({
    id: `ejemplo-${i}`,
    url: yt ? `https://www.youtube.com/watch?v=${yt}` : `https://ejemplo.acervo.app/${source}/${i}`,
    title,
    text,
    source,
    savedAt: now - daysAgo * DAY - i * 60_000,
    thumbnail: yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : undefined,
    analysis: { topics, style, appeal },
  }));
}
