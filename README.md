# Acervo

Curador personal de contenido. Guarda lo que te gusta de Instagram, TikTok, X y YouTube desde el menú Compartir del móvil, y genera con IA un perfil de tus gustos: grupos de intereses, ideas de contenido y proyectos que cruzan varios de ellos.

PWA instalable en Android. Toda la interfaz está en español.

## Qué hace

- **Compartir hacia Acervo.** Una vez instalada, la app aparece como "Acervo" en el menú Compartir. Guarda el enlace, el título, el texto, la fecha y la app de origen, y muestra "Guardado".
- **Inicio.** Lo último guardado y tarjetas "esta semana destaca X".
- **Biblioteca.** Cuadrícula con búsqueda (ignora tildes) y filtros por app, tema y fecha.
- **Perfil.** Grupos de gustos con tamaño según su peso. Al tocar uno ves sus elementos y sus conexiones con otros grupos.
- **Ideas.** Recomendaciones que cruzan varios grupos, cada una con su motivo y los botones "me interesa" y "descartar".
- **Datos de ejemplo.** El botón "Cargar datos de ejemplo" llena la app para verla sin esperar.

## Cómo funciona

| Pieza | Detalle |
| --- | --- |
| Datos | Se guardan en el dispositivo (IndexedDB). No hay base de datos en el servidor. |
| Análisis por elemento | `/api/analyze` con `claude-haiku-5-5`: temas, estilo y por qué puede atraer. Funciona aunque falte el texto. |
| Perfil e ideas | `/api/profile` con `claude-sonnet-5-5`: una llamada que recibe los elementos ya analizados y devuelve grupos con peso y conexiones, destacados e ideas. |
| Clave de la API | Solo en el servidor (`ANTHROPIC_API_KEY`). Nunca llega al navegador. |
| Acceso | Las rutas de IA exigen un código (`ACCESS_CODE`) y una cookie de sesión. Sin él nadie puede gastar tu saldo. |

Qué sale del dispositivo: al analizar o generar el perfil se envían a Anthropic, a través de tu servidor, el enlace, el título y el texto de los elementos. Guardar un elemento no envía nada.

## Puesta en marcha

Requisitos: Node.js 20 o superior y una clave de la API de Anthropic.

```bash
npm install
cp .env.example .env.local
```

Edita `.env.local` y rellena las dos variables:

```
ANTHROPIC_API_KEY=tu-clave
ACCESS_CODE=un-codigo-largo-que-elijas
```

`.env.local` está en `.gitignore`: nunca se sube al repositorio.

```bash
npm run dev      # desarrollo en http://localhost:3000
npm run build    # compilación de producción
npm run start    # sirve la compilación
npm run lint
```

En desarrollo, si no defines `ACCESS_CODE`, las rutas de IA funcionan sin código. En producción, sin `ACCESS_CODE` rechazan toda petición.

## Despliegue en Vercel

Para instalar la app y usar el menú Compartir hace falta HTTPS, y Vercel lo da gratis.

1. Entra en [vercel.com](https://vercel.com) con tu cuenta de GitHub y elige **Add New → Project**.
2. Importa el repositorio `acervo-app`. Vercel detecta Next.js solo; no cambies la configuración de compilación.
3. Antes de pulsar **Deploy**, abre **Environment Variables** y añade:
   - `ANTHROPIC_API_KEY`: tu clave.
   - `ACCESS_CODE`: el código que usarás para entrar. Elige uno distinto al de desarrollo.
4. Pulsa **Deploy**. Cada `git push` a `main` desplegará una versión nueva.

Si cambias una variable después, hay que volver a desplegar para que se aplique. Cambiar `ACCESS_CODE` cierra la sesión en todos los dispositivos.

Recomendado: en la consola de Anthropic fija un límite de gasto mensual bajo.

## Instalar en Android y compartir

1. Abre la dirección de la app en Chrome desde el móvil.
2. Menú de Chrome → **Instalar app** (o **Añadir a la pantalla de inicio**).
3. En Instagram, TikTok, X o YouTube, pulsa **Compartir** y elige **Acervo**.
4. La primera vez que generes el perfil se pedirá el código de acceso. Solo hace falta una vez por dispositivo.

Si "Acervo" no aparece en el menú Compartir justo después de instalar, cierra y vuelve a abrir la app de origen. En algunos móviles el sistema tarda en registrar el destino.

## Estructura

```
src/app/                 Páginas (Inicio, biblioteca, perfil, ideas, compartir) y manifest
src/app/api/             analyze, profile y login
src/components/          Interfaz
src/lib/                 Datos locales (IndexedDB), análisis, tipos y datos de ejemplo
src/lib/server/          Cliente de Claude y control de acceso (solo servidor)
public/sw.js             Service worker mínimo para instalar y abrir sin conexión
scripts/make-icons.mjs   Genera los iconos de la PWA
```

## Límites conocidos

- Los datos viven en cada dispositivo: no se sincronizan entre el móvil y el ordenador. Borrar los datos del sitio en el navegador los elimina.
- Instagram y TikTok no entregan miniatura al compartir, así que sus tarjetas se muestran sin imagen. YouTube sí la lleva.
- El acceso es una contraseña compartida, pensada para uso personal. No distingue usuarios.
