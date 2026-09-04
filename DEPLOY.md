# Guía de configuración y publicación

Todo lo que necesitas para poner en línea la plataforma de **Escape Tours Mcbo**.
No hace falta instalar Node, ni compilar, ni pagar hosting.

---

## Paso 1 — Crear el proyecto en Firebase (10 min)

1. Entra a <https://console.firebase.google.com> con tu cuenta de Google.
2. **Agregar proyecto** → nombre: `escape-tours-mcbo` → siguiente.
3. Google Analytics: puedes **desactivarlo**, no hace falta.
4. Espera a que se cree y entra al proyecto.

### 1.1 Activar Firestore

1. Menú izquierdo → **Compilación → Firestore Database** → *Crear base de datos*.
2. Modo: elige **Iniciar en modo de producción** (las reglas correctas las
   pegamos en el paso 3; el modo de prueba deja todo abierto al público).
3. Ubicación: **`nam5 (us-central)`** o **`southamerica-east1`**.
   ⚠️ La ubicación **no se puede cambiar** después.

### 1.2 Activar Authentication

1. Menú izquierdo → **Compilación → Authentication** → *Comenzar*.
2. Pestaña **Sign-in method** → habilita **Correo electrónico/contraseña**
   (solo la primera opción; el "vínculo por correo" déjalo apagado).
3. Pestaña **Users** → **Agregar usuario** → escribe tu correo y una contraseña
   segura. Este será el login del panel.
4. Copia el **UID** que aparece en la tabla (una cadena tipo `A1b2C3d4...`).
   Lo necesitas en el paso 4.

### 1.3 Registrar la app web y copiar las credenciales

1. En **⚙ Configuración del proyecto** → sección *Tus apps* → icono **`</>`** (Web).
2. Apodo: `Escape Tours Web`. **No** marques Firebase Hosting.
3. Firebase te muestra un bloque `firebaseConfig`. Copia esos valores.

---

## Paso 2 — Conectar el código

Abre `config/firebase.js` y reemplaza los valores de ejemplo por los tuyos:

```js
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSy...',
  authDomain: 'escape-tours-mcbo.firebaseapp.com',
  projectId: 'escape-tours-mcbo',
  storageBucket: 'escape-tours-mcbo.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abc123',
};
```

> **¿Es peligroso subir esto a GitHub?** No. La configuración web de Firebase es
> pública por diseño y viaja en el HTML de cualquier sitio que use Firebase. No
> es una contraseña: solo dice *a qué proyecto conectarse*. Lo que protege los
> datos son las reglas de seguridad del paso 3.

Luego abre `config/brand.js` y ajusta tu número de WhatsApp, Instagram y correo.

---

## Paso 3 — Publicar las reglas de seguridad ⚠️ IMPORTANTE

Sin este paso **cualquiera podría borrar tus viajes**.

1. Consola de Firebase → **Firestore Database** → pestaña **Reglas**.
2. Borra todo lo que haya y **pega el contenido completo de `firestore.rules`**.
3. **Publicar**.

Estas reglas garantizan que:

| Quién | Puede |
|---|---|
| Visitante sin sesión | Ver viajes y datos de pago · Crear **una reserva pendiente** |
| Visitante sin sesión | ❌ Ver reservas de otros · ❌ Confirmar pagos · ❌ Tocar cupos · ❌ Editar viajes |
| Admin (sesión + doc en `/admins`) | Todo |

**No hacen falta índices compuestos:** todas las consultas usan un solo filtro y
ordenan en el navegador, así que Firestore no te pedirá crear índices.

---

## Paso 4 — Darte permisos de administrador

Ser admin = tener sesión iniciada **y** un documento en la colección `admins`
cuyo ID sea tu UID. Ese documento se crea **a mano**, para que nadie pueda
auto-promoverse desde la web.

1. Firestore Database → pestaña **Datos** → **Iniciar colección**.
2. ID de la colección: `admins` → Siguiente.
3. **ID del documento:** pega el **UID** que copiaste en el paso 1.2
   (⚠️ el UID, no tu correo).
4. Agrega los campos:

   | Campo | Tipo | Valor |
   |---|---|---|
   | `nombre` | string | Tu nombre |
   | `rol` | string | `owner` |
   | `email` | string | Tu correo |

5. Guardar.

Para agregar otro miembro del equipo: créalo en **Authentication → Users** y
repite este paso con su UID.

---

## Paso 5 — Probar en tu computadora

Los módulos ES no funcionan abriendo el archivo con doble clic (`file://`):
hace falta un servidor local. Elige la opción que tengas a mano:

```bash
# Python (viene instalado en Mac y Linux)
python3 -m http.server 8080

# Node
npx serve .

# VS Code
# Instala la extensión "Live Server" y haz clic derecho → Open with Live Server
```

Luego abre:

- Sitio público: <http://localhost:8080/>
- Panel admin:  <http://localhost:8080/admin.html>
- Datos de ejemplo: <http://localhost:8080/seed/> (inicia sesión en el panel primero)

**Autoriza el dominio local:** Firebase Authentication → pestaña *Settings* →
*Dominios autorizados* → agrega `localhost` si no aparece.

---

## Paso 6 — Publicar en GitHub Pages

El sitio ya es estático: no hay build. Publicar = hacer push.

1. Sube los cambios a la rama principal:

   ```bash
   git add .
   git commit -m "Configurar Firebase de Escape Tours"
   git push origin main
   ```

2. En GitHub: repositorio → **Settings** → **Pages**.
3. *Source:* **Deploy from a branch** · *Branch:* `main` · *Folder:* `/ (root)`.
4. **Save**. En 1–2 minutos tu sitio queda en:

   ```
   https://<usuario>.github.io/escapetours/
   ```

5. **Último paso obligatorio:** Firebase → Authentication → *Settings* →
   *Dominios autorizados* → **Agregar dominio** → `<usuario>.github.io`.
   Sin esto, el login del panel falla en producción.

A partir de aquí, cada `git push` actualiza el sitio automáticamente.

### Dominio propio (opcional)

Settings → Pages → *Custom domain* → `escapetoursmcbo.com`, y en tu proveedor
de DNS apunta un `CNAME` a `<usuario>.github.io`. Recuerda agregar también ese
dominio a los *Dominios autorizados* de Firebase.

---

## Paso 7 — Recomendado: activar App Check

Evita que un bot cree reservas basura desde fuera de tu sitio. Es gratis.

1. Firebase → **Compilación → App Check** → *Comenzar*.
2. Registra la app web con el proveedor **reCAPTCHA v3** (te da una clave).
3. Actívalo primero en **modo de monitoreo** unos días; cuando confirmes que el
   tráfico legítimo pasa, cámbialo a **obligatorio** para Firestore.

---

## Costos

Todo esto cabe sin problema en el **plan gratuito Spark** de Firebase:
50.000 lecturas y 20.000 escrituras diarias. Una agencia con cientos de
reservas al mes usa una fracción mínima de eso. GitHub Pages es gratis para
repositorios públicos.

---

## Solución de problemas

| Síntoma | Causa y solución |
|---|---|
| `Missing or insufficient permissions` en el panel | Falta tu documento en `/admins` (paso 4), o el ID del documento no es tu UID. |
| El login dice `auth/unauthorized-domain` | Agrega el dominio en Authentication → Settings → Dominios autorizados (pasos 5 y 6). |
| Pantalla en blanco y errores CORS en la consola | Abriste el archivo con `file://`. Usa un servidor local (paso 5). |
| Advertencia `config/firebase.js todavía tiene valores de ejemplo` | Falta el paso 2. |
| El sitio no cambia después del push | GitHub Pages tarda 1–2 min. Prueba recargar con `Ctrl+Shift+R`. |
