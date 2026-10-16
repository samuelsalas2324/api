"use strict";
// Interfaz de GameCatalog. Usa los mismos endpoints que Postman (misma origen: sin CORS):
//   GET /videojuegos · POST /videojuegos · PUT /videojuegos/{id} · DELETE /videojuegos/{id}
const API = "/videojuegos";
const $ = (id) => document.getElementById(id);

let juegos = [];          // última lista recibida de la API
let editandoId = null;    // null = crear, número = editar
let eliminarId = null;

/* ---------- Capa de acceso a la API ---------- */
async function api(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con la API. ¿Está el servidor encendido?");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(mensajeError(res.status, data));
  return data;
}

// Convierte el error de FastAPI (string en 404/409, lista en 422) en texto legible
function mensajeError(status, data) {
  const d = data && data.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d.map((e) => `${(e.loc || []).slice(1).join(".")}: ${e.msg}`).join(" · ");
  }
  return `Error ${status}`;
}

/* ---------- Utilidades ---------- */
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const money = (n) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(n);

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  node.append(...children);   // textos como nodos de texto: sin riesgo de inyección HTML
  return node;
}

const ICONOS = [
  ["accion", "⚔️"], ["aventura", "🧭"], ["dispar", "🎯"], ["shooter", "🎯"], ["metroid", "🦋"], ["rpg", "🐉"],
  ["rol", "🐉"], ["deport", "⚽"], ["carrera", "🏎️"], ["conduc", "🏎️"], ["estrateg", "♟️"], ["terror", "👻"],
  ["puzzle", "🧩"], ["rompecabeza", "🧩"], ["plataforma", "🍄"], ["lucha", "🥊"], ["simul", "🏗️"], ["musical", "🎵"],
];
function icono(genero) {
  const g = norm(genero);
  return (ICONOS.find(([k]) => g.includes(k)) || [0, "🎮"])[1];
}
// Color de portada estable a partir del nombre (misma portada siempre)
function matiz(texto) {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/* ---------- Notificaciones ---------- */
function toast(texto, tipo = "ok") {
  const t = el("div", { class: `toast ${tipo === "error" ? "error" : ""}`, role: "status" }, (tipo === "error" ? "⚠️ " : "✅ ") + texto);
  $("toasts").append(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 260); }, 4200);
}

/* ---------- Render ---------- */
function mostrarCargando() {
  $("state").hidden = true;
  $("grid").replaceChildren(...Array.from({ length: 6 }, () => el("div", { class: "skeleton" })));
}

function mostrarEstado(emoji, titulo, texto, accion) {
  const s = $("state");
  s.replaceChildren(el("div", { class: "big" }, emoji), el("h3", {}, titulo), el("p", {}, texto));
  if (accion) s.append(accion);
  s.hidden = false;
  $("grid").replaceChildren();
}

function opciones(select, valores, vacio) {
  const actual = select.value;
  select.replaceChildren(el("option", { value: "" }, vacio), ...valores.map((v) => el("option", { value: v }, v)));
  if (valores.includes(actual)) select.value = actual;
}

function unicos(campo) {
  return [...new Set(juegos.map((j) => j[campo]))].sort((a, b) => a.localeCompare(b, "es"));
}

function actualizarFiltros() {
  opciones($("fGenero"), unicos("genero"), "Todos los géneros");
  opciones($("fPlataforma"), unicos("plataforma"), "Todas las plataformas");
  $("dlGeneros").replaceChildren(...unicos("genero").map((v) => el("option", { value: v })));
  $("dlPlataformas").replaceChildren(...unicos("plataforma").map((v) => el("option", { value: v })));
}

function actualizarStats() {
  const disp = juegos.filter((j) => j.disponible).length;
  const prom = juegos.length ? juegos.reduce((s, j) => s + j.precio, 0) / juegos.length : 0;
  const stat = (v, l) => el("div", { class: "stat" }, el("b", {}, String(v)), el("span", {}, l));
  $("stats").replaceChildren(
    stat(juegos.length, "videojuegos"), stat(disp, "disponibles"), stat(money(prom), "precio promedio"));
}

function filtrados() {
  const q = norm($("q").value.trim());
  const g = $("fGenero").value, p = $("fPlataforma").value, d = $("fDisp").value;
  return juegos.filter((j) =>
    (!q || norm(j.nombre).includes(q)) && (!g || j.genero === g) && (!p || j.plataforma === p) &&
    (d === "" || j.disponible === (d === "1")));
}

function tarjeta(j, i) {
  const h = matiz(j.nombre);
  const cover = el("div", { class: "cover", style: `background:linear-gradient(135deg,hsl(${h} 70% 45%),hsl(${(h + 60) % 360} 75% 35%))` },
    el("span", { class: "idtag" }, `#${j.id}`),
    el("span", { class: `badge ${j.disponible ? "ok" : "no"}` }, j.disponible ? "Disponible" : "Agotado"),
    el("span", { class: "emoji", "aria-hidden": "true" }, icono(j.genero)));
  const card = el("article", { class: "card", style: `animation-delay:${Math.min(i, 12) * 40}ms` }, cover,
    el("div", { class: "card-body" }, el("h3", {}, j.nombre),
      el("div", { class: "chips" }, el("span", { class: "chip" }, j.genero), el("span", { class: "chip" }, j.plataforma))),
    el("div", { class: "card-foot" }, el("span", { class: "price" }, money(j.precio)),
      el("div", { class: "card-actions" },
        el("button", { class: "btn btn-ghost small", type: "button", onclick: () => abrirForm(j) }, "Editar"),
        el("button", { class: "btn btn-ghost small", type: "button", onclick: () => pedirEliminar(j) }, "Eliminar"))));
  return card;
}

function render() {
  actualizarStats();
  const lista = filtrados();
  if (!juegos.length) {
    return mostrarEstado("🕹️", "Aún no hay videojuegos", "Registra el primero para empezar.",
      el("button", { class: "btn btn-primary", type: "button", onclick: () => abrirForm() }, "+ Nuevo videojuego"));
  }
  if (!lista.length) return mostrarEstado("🔎", "Sin resultados", "Prueba con otros filtros o términos de búsqueda.");
  $("state").hidden = true;
  $("grid").replaceChildren(...lista.map(tarjeta));
}

/* ---------- Carga de datos (GET) ---------- */
async function cargar() {
  mostrarCargando();
  try {
    juegos = await api("GET", API);
    actualizarFiltros();
    render();
  } catch (e) {
    $("stats").replaceChildren();
    mostrarEstado("📡", "No se pudo cargar el catálogo", e.message,
      el("button", { class: "btn btn-primary", type: "button", onclick: cargar }, "Reintentar"));
  }
}

/* ---------- Formulario crear / editar (POST / PUT) ---------- */
function abrirForm(j) {
  editandoId = j ? j.id : null;
  $("formTitle").textContent = j ? `Editar videojuego #${j.id}` : "Nuevo videojuego";
  $("idRow").hidden = !!j;
  $("fId").value = "";
  $("fNombre").value = j ? j.nombre : "";
  $("fGen").value = j ? j.genero : "";
  $("fPlat").value = j ? j.plataforma : "";
  $("fPrecio").value = j ? j.precio : "";
  $("fDispon").checked = j ? j.disponible : true;
  $("formError").hidden = true;
  document.querySelectorAll("#form input").forEach((i) => i.classList.remove("invalid"));
  $("formDlg").showModal();
  $("fNombre").focus();
}

function validar() {
  const campos = ["fNombre", "fGen", "fPlat", "fPrecio"];
  let ok = true;
  for (const id of campos) {
    const inp = $(id);
    const vacio = inp.value.trim() === "";
    const negativo = id === "fPrecio" && Number(inp.value) < 0;
    inp.classList.toggle("invalid", vacio || negativo);
    if (vacio || negativo) ok = false;
  }
  return ok;
}

$("form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const err = $("formError");
  if (!validar()) {
    err.textContent = "Completa todos los campos; el precio no puede ser negativo.";
    err.hidden = false;
    return;
  }
  const datos = {
    nombre: $("fNombre").value.trim(), genero: $("fGen").value.trim(), plataforma: $("fPlat").value.trim(),
    precio: Number($("fPrecio").value), disponible: $("fDispon").checked,
  };
  const btn = $("saveBtn");
  btn.disabled = true; btn.textContent = "Guardando…"; err.hidden = true;
  try {
    if (editandoId === null) {
      if ($("fId").value) datos.id = Number($("fId").value);
      await api("POST", API, datos);
      toast(`«${datos.nombre}» registrado correctamente.`);
    } else {
      await api("PUT", `${API}/${editandoId}`, datos);
      toast(`«${datos.nombre}» actualizado correctamente.`);
    }
    $("formDlg").close();
    await cargar();
  } catch (e) {
    err.textContent = e.message; err.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = "Guardar";
  }
});

/* ---------- Eliminar con confirmación (DELETE) ---------- */
function pedirEliminar(j) {
  eliminarId = j.id;
  $("delText").textContent = `Se eliminará «${j.nombre}» (id ${j.id}). Esta acción no se puede deshacer.`;
  $("delDlg").showModal();
}

$("delOk").addEventListener("click", async () => {
  const btn = $("delOk");
  btn.disabled = true; btn.textContent = "Eliminando…";
  try {
    await api("DELETE", `${API}/${eliminarId}`);
    $("delDlg").close();
    toast("Videojuego eliminado.");
  } catch (e) {
    $("delDlg").close();
    toast(e.message, "error");
  } finally {
    btn.disabled = false; btn.textContent = "Sí, eliminar";
    await cargar();
  }
});

/* ---------- Eventos de interfaz ---------- */
$("newBtn").addEventListener("click", () => abrirForm());
$("cancelBtn").addEventListener("click", () => $("formDlg").close());
$("delCancel").addEventListener("click", () => $("delDlg").close());
["q", "fGenero", "fPlataforma", "fDisp"].forEach((id) => $(id).addEventListener("input", render));
$("clearBtn").addEventListener("click", () => {
  ["q", "fGenero", "fPlataforma", "fDisp"].forEach((id) => ($(id).value = ""));
  render();
});
// Cerrar un diálogo al hacer clic en el fondo
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

/* ---------- Tema claro / oscuro ---------- */
function aplicarTema(t) {
  document.documentElement.dataset.theme = t;
  $("themeBtn").textContent = t === "dark" ? "🌙" : "☀️";
}
let tema = "dark";
try { tema = localStorage.getItem("tema") || "dark"; } catch { /* almacenamiento no disponible */ }
aplicarTema(tema);
$("themeBtn").addEventListener("click", () => {
  tema = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  aplicarTema(tema);
  try { localStorage.setItem("tema", tema); } catch { /* ignorar */ }
});

cargar();
