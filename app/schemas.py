"""Modelos Pydantic: definen y validan la forma de los datos de la API."""
from typing import Optional

from pydantic import BaseModel, Field


class VideojuegoBase(BaseModel):
    """Campos comunes de un videojuego (sin el id)."""
    nombre: str = Field(..., min_length=1, max_length=100, examples=["Hollow Knight"])
    genero: str = Field(..., min_length=1, max_length=50, examples=["Metroidvania"])
    plataforma: str = Field(..., min_length=1, max_length=50, examples=["PC"])
    precio: float = Field(..., ge=0, examples=[14.99])  # no se permiten precios negativos
    disponible: bool = True


class VideojuegoCrear(VideojuegoBase):
    """Cuerpo del POST. El id es opcional: si no se envía, la API lo genera."""
    id: Optional[int] = Field(None, gt=0, examples=[10])


class VideojuegoActualizar(VideojuegoBase):
    """Cuerpo del PUT. El id viaja en la URL, por eso no se repite aquí."""


class Videojuego(VideojuegoBase):
    """Videojuego tal como lo devuelve la API (siempre con id)."""
    id: int
