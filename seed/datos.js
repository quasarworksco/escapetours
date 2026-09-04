/**
 * Viajes de ejemplo para probar la plataforma.
 * Las fechas se calculan a partir de hoy, así que siempre quedan a futuro.
 *
 * IMPORTANTE: las URLs de las fotos son de Unsplash y sirven solo como marcador de
 * posición. Reemplázalas por las fotos reales de la agencia desde el panel.
 */
import { hoyISO } from '../src/utils/fecha.js';

/** Suma días a la fecha de hoy y devuelve "YYYY-MM-DD". */
function enDias(dias) {
  const [a, m, d] = hoyISO().split('-').map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d + dias));
  return fecha.toISOString().slice(0, 10);
}

export const VIAJES_EJEMPLO = [
  {
    destino: 'Los Roques',
    descripcion:
      'Cuatro días en el archipiélago más hermoso del Caribe venezolano. Cayos de arena ' +
      'blanca, agua turquesa y atardeceres que no se olvidan. Salida en vuelo desde Maracaibo.',
    fechaInicio: enDias(21),
    fechaFin: enDias(24),
    precio: 590,
    cupoMaximo: 12,
    fotoUrl: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=1200&q=80',
    puntoEncuentro: 'Aeropuerto La Chinita, 5:30 am',
    incluye: [
      'Vuelo ida y vuelta Maracaibo – Los Roques',
      'Posada 3 noches con desayuno',
      'Traslado diario a los cayos',
      'Impuesto del Parque Nacional',
    ],
    itinerario: [
      'Día 1: Vuelo y traslado a la posada. Tarde libre en Gran Roque.',
      'Día 2: Cayo de Agua — full day con almuerzo.',
      'Día 3: Francisquí y Madrisquí. Snorkeling.',
      'Día 4: Mañana libre y regreso a Maracaibo.',
    ],
  },
  {
    destino: 'Choroní y Chuao',
    descripcion:
      'Fin de semana entre montaña y mar: la carretera de Choroní, la playa de Puerto ' +
      'Colombia y un paseo en peñero hasta Chuao, la tierra del mejor cacao del mundo.',
    fechaInicio: enDias(35),
    fechaFin: enDias(37),
    precio: 210,
    cupoMaximo: 25,
    fotoUrl: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=1200&q=80',
    puntoEncuentro: 'C.C. Lago Mall, 4:00 am',
    incluye: [
      'Transporte ida y vuelta en autobús',
      'Posada 2 noches',
      'Desayunos',
      'Paseo en peñero a Chuao',
    ],
    itinerario: [
      'Día 1: Salida de madrugada. Llegada y tarde de playa.',
      'Día 2: Peñero a Chuao y visita a la planta de cacao.',
      'Día 3: Mañana libre y regreso.',
    ],
  },
  {
    destino: 'Mérida',
    descripcion:
      'La ciudad de los Andes: teleférico Mukumbarí, Los Nevados, pueblos de montaña y ' +
      'el frío que tanto extrañamos los maracuchos.',
    fechaInicio: enDias(52),
    fechaFin: enDias(56),
    precio: 380,
    cupoMaximo: 20,
    fotoUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    puntoEncuentro: 'C.C. Lago Mall, 5:00 am',
    incluye: [
      'Transporte ida y vuelta',
      'Hotel 4 noches con desayuno',
      'Boleto del teleférico Mukumbarí',
      'Tour a Los Aleros y Jají',
    ],
    itinerario: [
      'Día 1: Viaje a Mérida. Noche libre en la plaza.',
      'Día 2: Teleférico Mukumbarí hasta Pico Espejo.',
      'Día 3: Los Aleros y Jají.',
      'Día 4: Laguna de Mucubají y Apartaderos.',
      'Día 5: Regreso a Maracaibo.',
    ],
  },
  {
    destino: 'Morrocoy',
    descripcion:
      'Un día completo entre Cayo Sombrero y Playuela. Ideal para escaparse sin pedir ' +
      'días libres: salimos de madrugada y regresamos en la noche.',
    fechaInicio: enDias(14),
    fechaFin: enDias(14),
    precio: 95,
    cupoMaximo: 30,
    fotoUrl: 'https://images.unsplash.com/photo-1520454974749-611b7248ffdb?w=1200&q=80',
    puntoEncuentro: 'C.C. Lago Mall, 3:30 am',
    incluye: [
      'Transporte ida y vuelta',
      'Peñero a los cayos',
      'Toldo y sillas',
      'Almuerzo',
    ],
    itinerario: ['Salida 3:30 am · Cayo Sombrero · Playuela · Regreso 10:00 pm'],
  },
];

/** Reservas de ejemplo, para ver el panel con datos reales. */
export const RESERVAS_EJEMPLO = [
  { destino: 'Morrocoy', nombre: 'María Fernanda Urdaneta', telefono: '584141234567', personas: 2, confirmar: true },
  { destino: 'Morrocoy', nombre: 'José Gregorio Paz', telefono: '584241112233', personas: 4, confirmar: true },
  { destino: 'Morrocoy', nombre: 'Andreína Bracho', telefono: '584165556677', personas: 1, confirmar: false },
  { destino: 'Los Roques', nombre: 'Carlos Villalobos', telefono: '584129998877', personas: 2, confirmar: true },
  { destino: 'Los Roques', nombre: 'Daniela Rincón', telefono: '584264443322', personas: 3, confirmar: false },
  { destino: 'Choroní y Chuao', nombre: 'Luis Ángel Fuenmayor', telefono: '584147778899', personas: 6, confirmar: false },
];
