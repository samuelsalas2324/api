"""GameCatalog API - CRUD de videojuegos con FastAPI."""
from pathlib import Path

from fastapi import FastAPI, HTTPException, Response, status
from fastapi.staticfiles import StaticFiles

from app.database import siguiente_id, videojuegos
from app.schemas import Videojuego, VideojuegoActualizar, VideojuegoCrear

app = FastAPI(
    title="GameCatalog API",
    description="API para gestionar un catálogo de videojuegos (GET, POST, PUT, DELETE).",
    version="1.0.0",
)


def obtener_o_404(id: int) -> dict:
    """Busca un videojuego; si no existe responde 404."""
    if id not in videojuegos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe un videojuego con id {id}",
        )
    return videojuegos[id]


@app.get("/")
def raiz():
    """Comprobación rápida de que la API está activa."""
    return {"mensaje": "GameCatalog API funcionando", "docs": "/docs"}


# ---------- GET ----------
@app.get("/videojuegos", response_model=list[Videojuego])
def listar_videojuegos():
    """Devuelve todos los videojuegos (200)."""
    return list(videojuegos.values())


@app.get("/videojuegos/{id}", response_model=Videojuego)
def obtener_videojuego(id: int):
    """Devuelve un videojuego por id (200) o 404 si no existe."""
    return obtener_o_404(id)


# ---------- POST ----------
@app.post("/videojuegos", response_model=Videojuego, status_code=status.HTTP_201_CREATED)
def crear_videojuego(datos: VideojuegoCrear):
    """Registra un videojuego nuevo (201). Si el id ya existe responde 409."""
    nuevo_id = datos.id if datos.id is not None else siguiente_id()
    if nuevo_id in videojuegos:  # evita IDs duplicados
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un videojuego con id {nuevo_id}",
        )
    videojuego = {**datos.model_dump(exclude={"id"}), "id": nuevo_id}
    videojuegos[nuevo_id] = videojuego
    return videojuego


# ---------- PUT ----------
@app.put("/videojuegos/{id}", response_model=Videojuego)
def actualizar_videojuego(id: int, datos: VideojuegoActualizar):
    """Reemplaza los datos de un videojuego existente (200) o 404 si no existe."""
    obtener_o_404(id)
    videojuegos[id] = {**datos.model_dump(), "id": id}
    return videojuegos[id]


# ---------- DELETE ----------
@app.delete("/videojuegos/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_videojuego(id: int):
    """Elimina un videojuego (204 sin contenido) o 404 si no existe."""
    obtener_o_404(id)
    del videojuegos[id]
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Interfaz web ----------
# Archivos estáticos (HTML/CSS/JS) servidos en /ui. Se montan al final para no
# interferir con los endpoints de la API; la interfaz consume esos mismos endpoints.
app.mount("/ui", StaticFiles(directory=Path(__file__).parent / "static", html=True), name="ui")
