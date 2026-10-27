import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;

const $lista = document.querySelector("#lista-equipos");
const $plantilla = document.querySelector("#tpl-equipo");
const $resumen = document.querySelector("#resumen");
const $paginaActual = document.querySelector("#pagina-actual");
const $btnAnterior = document.querySelector("#btn-anterior");
const $btnSiguiente = document.querySelector("#btn-siguiente");

let paginaActual = 1;
let ultimaPagina = 1;

// YA IMPLEMENTADO — "2026-09-15" -> "15 set 2026"
export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

/**
 * TODO [F2] Listado y paginación.
 *
 * cargarPagina(pagina):
 *  - Marque la lista como ocupada (aria-busy="true") mientras carga y desmárquela al terminar.
 *  - Obtenga la página con listarEquipos(pagina, POR_PAGINA).
 *  - Vacíe la lista y, por cada equipo, clone #tpl-equipo y llene:
 *      .codigo, .nombre, .categoria (nombre de la categoría), .fecha (con formatearFecha)
 *      .estado  -> texto del estado y atributo data-estado="<estado>" (el CSS le da color)
 *      li       -> atributo data-id="<id>"
 *    Use SIEMPRE textContent con los datos de la API (nunca innerHTML).
 *  - Si no hay equipos, muestre un <li class="vacio"> con "No hay equipos registrados."
 *  - #resumen:      "Mostrando <from>–<to> de <total>"
 *  - #pagina-actual: "Página <current_page> de <last_page>"
 *  - Deshabilite #btn-anterior en la primera página y #btn-siguiente en la última.
 *  - Si falla, muestre el error con mostrarMensaje("error", ...).
 */
export const cargarPagina = async (pagina = 1) => {
  // TODO
  $lista.setAttribute("aria-busy", "true");

  try {
    const { data, meta } = await listarEquipos(pagina, POR_PAGINA);

    paginaActual = meta.current_page;
    ultimaPagina = meta.last_page;

    $lista.replaceChildren();

    if (data.length === 0) {
      const $vacio = document.createElement("li");
      $vacio.className = "vacio";
      $vacio.textContent = "No hay equipos registrados.";
      $lista.append($vacio);
    }

    for (const equipo of data) {
      const $tarjeta = $plantilla.content.cloneNode(true);
      const $estado = $tarjeta.querySelector(".estado");

      $tarjeta.querySelector("li").dataset.id = equipo.id;
      $tarjeta.querySelector(".codigo").textContent = equipo.codigo;
      $tarjeta.querySelector(".nombre").textContent = equipo.nombre;
      $tarjeta.querySelector(".categoria").textContent = equipo.categoria?.nombre ?? "";
      $tarjeta.querySelector(".fecha").textContent = formatearFecha(equipo.fecha_adquisicion);
      $estado.textContent = equipo.estado;
      $estado.dataset.estado = equipo.estado;

      $lista.append($tarjeta);
    }

    $resumen.textContent = `Mostrando ${meta.from ?? 0}–${meta.to ?? 0} de ${meta.total}`;
    $paginaActual.textContent = `Página ${meta.current_page} de ${meta.last_page}`;
    $btnAnterior.disabled = paginaActual <= 1;
    $btnSiguiente.disabled = paginaActual >= ultimaPagina;
  } catch (error) {
    mostrarMensaje("error", "No fue posible cargar los equipos.");
  } finally {
    $lista.setAttribute("aria-busy", "false");
  }
};

/**
 * TODO [F4] Eliminación con manejo de reglas de negocio.
 *
 * Use DELEGACIÓN DE EVENTOS: un solo listener en $lista que detecte clics en .btn-eliminar.
 *  - Pida confirmación con confirm().
 *  - Llame a eliminarEquipo(id).
 *  - 204: muestre "Equipo eliminado." y recargue la página actual
 *         (si era el último de la página y no es la primera, vaya a la anterior).
 *  - 409: muestre el mensaje que envía la API (error.datos.mensaje).
 *  - Otro error: muestre un mensaje general.
 */
const alHacerClicEnLista = async (evento) => {
  // TODO
  const $boton = evento.target.closest(".btn-eliminar");
  if (!$boton) return;

  const $tarjeta = $boton.closest("li");
  const codigo = $tarjeta.querySelector(".codigo").textContent;

  if (!confirm(`¿Eliminar el equipo ${codigo}?`)) return;

  try {
    await eliminarEquipo($tarjeta.dataset.id);
    mostrarMensaje("exito", "Equipo eliminado.");

    const eraElUltimo = $lista.querySelectorAll(".tarjeta").length === 1;
    await cargarPagina(eraElUltimo && paginaActual > 1 ? paginaActual - 1 : paginaActual);
  } catch (error) {
    if (error.status === 409) {
      mostrarMensaje("error", error.datos.mensaje);
    } else {
      mostrarMensaje("error", "No fue posible eliminar el equipo.");
    }
  }
};

// Parcialmente implementado: complete el TODO de los botones de paginación.
export const iniciarListado = () => {
  $lista.addEventListener("click", alHacerClicEnLista);

  // TODO [F2] Conecte #btn-anterior y #btn-siguiente con cargarPagina()
  $btnAnterior.addEventListener("click", () => cargarPagina(paginaActual - 1));
  $btnSiguiente.addEventListener("click", () => cargarPagina(paginaActual + 1));

  cargarPagina(1);
};