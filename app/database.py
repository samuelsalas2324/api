"""Almacenamiento en memoria: un diccionario {id: videojuego}.
Los datos se pierden al detener el servidor (suficiente para la demostración)."""

videojuegos: dict[int, dict] = {
    1: {"id": 1, "nombre": "The Legend of Zelda: Breath of the Wild", "genero": "Aventura",
        "plataforma": "Nintendo Switch", "precio": 59.99, "disponible": True},
    2: {"id": 2, "nombre": "God of War", "genero": "Acción",
        "plataforma": "PlayStation 5", "precio": 39.99, "disponible": True},
    3: {"id": 3, "nombre": "Halo Infinite", "genero": "Disparos",
        "plataforma": "Xbox Series X", "precio": 29.99, "disponible": False},
}


def siguiente_id() -> int:
    """Devuelve un id libre (el mayor existente + 1)."""
    return max(videojuegos, default=0) + 1
