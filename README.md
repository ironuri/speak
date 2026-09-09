# Speak — practica inglés hablando en el coche

Un compañero de conversación en inglés por voz, pensado para usarse manos
libres durante el trayecto diario en coche. Fase 1 (esta): una **web app
instalable (PWA)** que se abre en Safari y se añade a la pantalla de inicio
del iPhone — funciona hoy mismo, sin Mac, sin cuenta de Apple Developer y
sin pasar por ningún proceso de aprobación de Apple.

## Cómo funciona

```
iPhone (Safari / PWA)                 Tu servidor                Proveedores
┌─────────────────────┐   audio   ┌───────────────┐   texto   ┌─────────────┐
│ graba tu voz (mic)   │ ───────▶ │ /api/transcribe│ ───────▶ │ OpenAI Whisper│
│ reproduce la respuesta│         │ /api/chat       │ ───────▶ │ Claude (Anthropic)│
│ en el altavoz del coche│        │ /api/speak      │ ───────▶ │ OpenAI TTS    │
└─────────────────────┘  ◀─────── └───────────────┘  ◀─────── └─────────────┘
```

La web nunca guarda tus claves de API: viven solo en el servidor. La app
detecta cuándo dejas de hablar (por silencio) y encadena sola
escuchar → transcribir → responder (Claude) → hablar (voz) → volver a
escuchar, así que tras el primer toque en pantalla la conversación sigue
sin que tengas que tocar nada más.

**Importante — seguridad al volante:** configura todo y pulsa "empezar"
antes de arrancar o parado en un semáforo largo. No mires ni manipules el
teléfono mientras conduces.

## 1. Desplegar el servidor

El servidor (`/server`) es una API Node/Express muy pequeña. Necesitas:

- Una cuenta en [console.anthropic.com](https://console.anthropic.com) →
  `ANTHROPIC_API_KEY`
- Una cuenta en [platform.openai.com](https://platform.openai.com) →
  `OPENAI_API_KEY` (se usa solo para transcribir tu voz y generar la voz de
  la respuesta; Claude no hace ni transcripción ni síntesis de audio)

```bash
cd server
cp .env.example .env   # rellena las claves y genera APP_SHARED_SECRET
npm install
npm start
```

Para probarlo en tu iPhone real necesitas que el servidor sea accesible
por HTTPS desde internet (Safari exige HTTPS para usar el micrófono, salvo
en `localhost`). Opciones sencillas para desplegarlo:

- **Render / Railway / Fly.io** — nivel gratuito suficiente para uso
  personal, despliegue directo desde este repo (carpeta `server/`).
- **Un VPS propio** detrás de Caddy/Nginx con TLS automático.

En cualquier caso, define las variables de entorno del `.env.example` en
el panel del proveedor, sobre todo `APP_SHARED_SECRET` — sin ella,
cualquiera que encuentre la URL de tu servidor podría gastar tu crédito de
las APIs.

## 2. Instalar la app en el iPhone

1. Sirve la carpeta `/web` desde cualquier hosting estático con HTTPS
   (Vercel, Netlify, GitHub Pages, Cloudflare Pages — todos tienen plan
   gratuito) o, para probar rápido, desde el propio servidor Express
   añadiendo `app.use(express.static("../web"))`.
2. Abre esa URL en **Safari** en el iPhone (tiene que ser Safari, no Chrome,
   para poder instalarla).
3. Botón compartir → **"Añadir a pantalla de inicio"**.
4. Abre la app desde el icono, toca el ⚙️ y rellena la URL de tu servidor y
   la clave (`APP_SHARED_SECRET`) — quedan guardadas en el teléfono.
5. Toca "Toca para empezar", concede permiso de micrófono la primera vez,
   y habla.

Conecta el iPhone al BMW por Bluetooth (manos libres) como haces siempre;
el audio de la conversación sale por los altavoces del coche y el
micrófono del coche (o del propio iPhone) capta tu voz igual que en una
llamada.

## Ajustes de la conversación

Desde el mismo panel ⚙️: nivel (principiante/intermedio/avanzado), tema
opcional, y si quieres que te corrija errores de gramática/vocabulario
sobre la marcha o no.

## Coste aproximado

Con uso diario de ~2h: Whisper (transcripción) y TTS de OpenAI son los que
más pesan por volumen de audio; Claude Haiku (el modelo por defecto) es
barato para turnos de texto cortos. Estimado orientativo, revisa precios
actuales en cada proveedor antes de confiar en la cifra.

## Roadmap hacia CarPlay nativo (fase 2)

Esta PWA ya resuelve el caso de uso real (hablar inglés manos libres en el
coche). Si más adelante quieres que aparezca como un icono en la pantalla
de CarPlay del BMW, esto es lo que hace falta — y por qué no está en esta
fase 1:

1. **Xcode/macOS es obligatorio.** Apple no permite compilar ni firmar
   apps iOS/CarPlay desde Linux ni Windows, sin excepción. Como ahora
   mismo no tienes Mac, hay dos caminos:
   - Conseguir acceso a un Mac (propio, prestado, o alquilado por horas:
     MacStadium, AWS EC2 Mac).
   - Compilar en la nube sin poseer un Mac: **GitHub Actions con runner
     `macos-latest`** o servicios como Codemagic/Xcode Cloud pueden
     compilar el proyecto Swift y subirlo a TestFlight automáticamente
     desde este mismo repo. Sigue haciendo falta una cuenta de Apple
     Developer, pero no un Mac físico.
2. **Apple Developer Program** (99 $/año) — obligatorio para instalar en
   tu propio iPhone más allá de 7 días y para solicitar el entitlement de
   CarPlay.
3. **Solicitar el entitlement de CarPlay a Apple**
   (developer.apple.com/contact/carplay/) — proceso manual, Apple lo
   revisa caso por caso y puede tardar semanas. La categoría realista para
   un agente conversacional es **Communication**, usando `CallKit` para
   que la conversación aparezca como una llamada activa en la pantalla del
   coche (así funcionan ya varias apps de compañía de IA por voz).
4. Reescribir el cliente en Swift usando esa extensión CarPlay + CallKit,
   reutilizando el mismo backend (`/server`) que ya tienes funcionando.

Cuando quieras dar ese salto, el backend de esta fase 1 no cambia — solo
se sustituye el cliente web por una app Swift nativa que habla con los
mismos endpoints.
