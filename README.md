# 🌴 Escape Tours Mcbo — Plataforma de reservas

Calendario de viajes y sistema de reservas para **Escape Tours Mcbo**
(Maracaibo, Venezuela). Sitio estático + Firebase, publicado en GitHub Pages.

**👉 Para configurarlo y publicarlo: [DEPLOY.md](DEPLOY.md)**

---

## Qué hace

| Vista | Para quién | Qué permite |
|---|---|---|
| `index.html` | Público | Ver los viajes del mes, entrar al detalle y reservar cupo |
| `admin.html` | Agencia | Crear/editar viajes, ver reservas, confirmar pagos, controlar cupos |

## Cómo funciona una reserva

```
   [cliente reserva en la web]
              │
              ▼
        ┌───────────┐   no descuenta cupo todavía
        │ PENDIENTE │   (si el viaje está lleno → lista de espera)
        └─────┬─────┘
              │
   admin verifica el pago ──────▶ CONFIRMADA  · descuenta cupo · registra el pago
              │
   no pagó / desistió ──────────▶ CANCELADA   · devuelve el cupo si lo tenía
```

- Una reserva pendiente **no bloquea cupo**: el cupo se descuenta solo cuando la
  agencia verifica el pago. Así nadie "aparta" plazas que nunca va a pagar.
- Si el viaje ya está lleno, se sigue permitiendo reservar: esas solicitudes
  entran como **lista de espera** y aparecen aparte en el panel.
- El límite de cupos es una **regla dura**: la confirmación corre dentro de una
  transacción de Firestore que rechaza cualquier intento de pasarse del máximo,
  incluso si dos personas del equipo confirman a la vez.

## Stack

- **HTML + CSS + JavaScript** con módulos ES nativos. Sin build, sin bundler,
  sin Node en producción.
- **Firebase Firestore** para los datos y **Firebase Authentication** (correo y
  contraseña) para el panel.
- **GitHub Pages** como hosting. Publicar = `git push`.
- Las fotos de los destinos son **URLs externas** (Unsplash, Drive, Instagram…):
  no se sube ningún archivo, no se usa Firebase Storage.

## Estructura

```
config/brand.js      ← nombre, colores, WhatsApp, textos  (editar aquí para rebrandear)
config/firebase.js   ← credenciales del proyecto Firebase
firestore.rules      ← reglas de seguridad (pegar en la consola de Firebase)
src/firebase.js      ← inicialización del SDK
src/modelo/          ← lógica de negocio: viajes, reservas, pagos, transacciones
src/utils/           ← fechas (America/Caracas), formato, helpers de DOM
src/publico/         ← calendario, detalle y formulario de reserva
src/admin/           ← login y pantallas del panel
styles/              ← tokens de diseño y hojas de estilo
seed/                ← viajes de ejemplo para probar
```

## Datos en Firestore

| Colección | Contenido |
|---|---|
| `trips` | Viajes: destino, fechas, precio, `fotoUrl`, `cupoMaximo`, `cuposConfirmados` |
| `bookings` | Reservas: datos del cliente, cantidad de personas, estado |
| `bookings/{id}/pagos` | Pagos verificados: método, fecha, monto, personas confirmadas, notas |
| `admins/{uid}` | Quién es administrador (se crea a mano en la consola) |
| `config/app` | Métodos de pago e instrucciones que ve el cliente |

## Adaptarlo a otra agencia

1. Clona el repositorio.
2. Edita `config/brand.js` (nombre, colores, contacto, textos).
3. Crea un proyecto de Firebase nuevo y actualiza `config/firebase.js`.
4. Publica en GitHub Pages siguiendo [DEPLOY.md](DEPLOY.md).

Cada agencia usa su propio proyecto y su propio despliegue: no hay multi-tenancy
ni datos compartidos entre agencias.
