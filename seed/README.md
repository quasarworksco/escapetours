# Datos de ejemplo

Sirven para ver la plataforma funcionando antes de cargar los viajes reales.

## Cómo cargarlos

1. Abre `admin.html` e **inicia sesión** con tu cuenta de administrador.
2. En la misma pestaña, abre `seed/index.html`.
3. Pulsa **Cargar datos de ejemplo**.

Se crean 4 viajes (Los Roques, Choroní y Chuao, Mérida y Morrocoy) con fechas
calculadas a partir de hoy, así que siempre quedan a futuro. Si marcas la
casilla, también se crean 6 reservas, 3 de ellas ya confirmadas con su pago,
para que veas el descuento de cupos en acción.

Volver a pulsar el botón **no duplica** los viajes: se omiten los que ya existen
con el mismo destino y fecha de salida.

## Fotos

Las URLs apuntan a Unsplash y son solo marcadores de posición. Cámbialas desde
el panel (Editar → *URL de la foto*) por las fotos reales de la agencia. Si una
URL no carga, la tarjeta muestra un fondo de color en lugar de romperse.

## Borrar los datos de ejemplo

Desde el panel: **Viajes → Eliminar** en cada uno. Las reservas asociadas se
borran manualmente desde la consola de Firebase (colección `bookings`).

## Antes de publicar

Cuando termines de probar, borra la carpeta `seed/` del repositorio: no aporta
nada en producción y evita confusiones.
