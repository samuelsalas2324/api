# GameCatalog API

API REST con FastAPI para gestionar un catálogo de videojuegos (almacenamiento en memoria).

## 1. Estructura

```
GameCatalog/
├── app/
│   ├── __init__.py
│   ├── main.py        # endpoints (GET, POST, PUT, DELETE)
│   ├── schemas.py     # modelos Pydantic (validación)
│   └── database.py    # datos en memoria + datos de ejemplo
├── test_api.py        # prueba automática del flujo completo
├── requirements.txt
└── README.md
```

## 2. Instalación y ejecución (Windows, PowerShell)

```powershell
cd C:\Users\PC\Desktop\ING.SOF2\GameCatalog
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- Si PowerShell bloquea la activación: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, o usa `.\venv\Scripts\activate.bat` en CMD.
- Si `python` no se reconoce, instala Python 3.10+ desde python.org marcando **Add python.exe to PATH** (o con `winget install Python.Python.3.12`).

Comprobar que funciona:
- `http://127.0.0.1:8000/` → `{"mensaje":"GameCatalog API funcionando","docs":"/docs"}`
- `http://127.0.0.1:8000/docs` → documentación Swagger automática (puedes probar los endpoints desde ahí).
- Prueba automática (con el entorno activo): `python test_api.py` → `OK: todas las pruebas pasaron`.

Datos iniciales: ids 1 (Zelda), 2 (God of War), 3 (Halo Infinite). Al reiniciar el servidor los datos vuelven a este estado.

## 2.1 Interfaz web

Con el servidor encendido, abre **http://127.0.0.1:8000/ui/** (la API y la interfaz se ejecutan con el mismo comando; no hay nada más que arrancar).

- Catálogo en tarjetas, buscador por nombre y filtros por género, plataforma y disponibilidad.
- Formulario para registrar (POST) y editar (PUT); botón eliminar con confirmación (DELETE).
- Modo oscuro (por defecto) y claro, avisos de éxito/error, estados de carga y adaptable a celular.
- Usa los mismos endpoints y JSON que Postman; los endpoints no cambiaron (solo se añadió el montaje de `/ui` en `main.py`).
- Para abrirla desde el celular en la misma red Wi-Fi: `uvicorn app.main:app --host 0.0.0.0` y entra a `http://IP-DE-TU-PC:8000/ui/`.
- Las portadas son ilustraciones generadas (color según el nombre e icono según el género), porque la API no guarda imágenes.

Estructura añadida: `app/static/index.html`, `styles.css`, `app.js`.

## 3. Las cuatro consultas en Postman

Base: `http://127.0.0.1:8000`. En POST y PUT: pestaña **Body → raw → JSON** (Postman añade `Content-Type: application/json`; si no, agrégalo a mano).

> Atajo: en Postman usa **Import** y selecciona `GameCatalog.postman_collection.json`; trae las 6 peticiones listas (ejecútalas en orden: la 4 crea el id 4, que usan la 5 y la 6).

### 3.1 GET — consultar
| Prueba | URL | Esperado |
|---|---|---|
| Todos | `GET http://127.0.0.1:8000/videojuegos` | **200 OK**, lista JSON con 3 videojuegos |
| Uno | `GET http://127.0.0.1:8000/videojuegos/1` | **200 OK**, `{"nombre":"The Legend of Zelda: Breath of the Wild", ... "id":1}` |
| No existe | `GET http://127.0.0.1:8000/videojuegos/999` | **404 Not Found**, `{"detail":"No existe un videojuego con id 999"}` |

### 3.2 POST — registrar
`POST http://127.0.0.1:8000/videojuegos` · Header: `Content-Type: application/json`
```json
{
  "nombre": "Hollow Knight",
  "genero": "Metroidvania",
  "plataforma": "PC",
  "precio": 14.99,
  "disponible": true
}
```
Esperado: **201 Created** y
```json
{"nombre":"Hollow Knight","genero":"Metroidvania","plataforma":"PC","precio":14.99,"disponible":true,"id":4}
```
Casos de error: enviar `"id": 1` → **409 Conflict** (id duplicado); `"precio": -5` o falta un campo → **422 Unprocessable Entity** (validación de Pydantic).

### 3.3 PUT — actualizar
`PUT http://127.0.0.1:8000/videojuegos/4` · Header: `Content-Type: application/json`
```json
{
  "nombre": "Hollow Knight",
  "genero": "Metroidvania",
  "plataforma": "Nintendo Switch",
  "precio": 9.99,
  "disponible": false
}
```
Esperado: **200 OK** con el videojuego actualizado (`"id":4`, precio 9.99, disponible false). Con un id inexistente (ej. 999): **404**.
El PUT reemplaza todos los campos, por lo que hay que enviarlos todos.

### 3.4 DELETE — eliminar
`DELETE http://127.0.0.1:8000/videojuegos/4` · Sin body.
Esperado: **204 No Content** (respuesta vacía). Repetir la petición, o hacer `GET /videojuegos/4`, devuelve **404**.

### 3.5 Flujo completo de demostración
1. `GET /videojuegos` → 200, 3 elementos.
2. `POST /videojuegos` (Hollow Knight) → 201, id 4.
3. `GET /videojuegos/4` → 200, datos creados.
4. `PUT /videojuegos/4` (precio 9.99, plataforma Switch) → 200.
5. `GET /videojuegos/4` → 200, datos actualizados.
6. `DELETE /videojuegos/4` → 204.
7. `GET /videojuegos/4` → 404.

## 4. Conceptos breves

- **API REST**: forma de comunicar programas por HTTP. Cada recurso (videojuegos) tiene una URL y se manipula con métodos HTTP estándar; los datos suelen viajar en JSON y cada respuesta lleva un código de estado.
- **FastAPI**: framework de Python para crear APIs. Convierte funciones en endpoints, valida datos con Pydantic y genera documentación automática (`/docs`). **Uvicorn** es el servidor que lo ejecuta.
- **GET**: leer datos (no modifica nada). **POST**: crear un recurso nuevo. **PUT**: reemplazar/actualizar un recurso existente. **DELETE**: eliminarlo.
- **Códigos**: 200 OK, 201 Created, 204 No Content, 404 Not Found, 409 Conflict (id duplicado), 422 (datos inválidos).

## 5. Guion para presentar al profesor (~5 min)

1. **Introducción (30 s)**: "GameCatalog API es una API REST hecha con FastAPI para gestionar un catálogo de videojuegos, con datos en memoria."
2. **Estructura (1 min)**: `schemas.py` define y valida los datos con Pydantic; `database.py` guarda un diccionario con 3 juegos de ejemplo; `main.py` contiene los endpoints.
3. **Servidor y /docs (30 s)**: ejecutar `uvicorn app.main:app --reload` y mostrar `http://127.0.0.1:8000/docs`.
4. **Demostración en Postman (2.5 min)**: seguir el flujo 3.5 señalando método, URL, body y código de respuesta de cada paso (GET 200, POST 201, PUT 200, DELETE 204).
5. **Errores (30 s)**: mostrar un GET a un id inexistente (404) y un POST con precio negativo (422) para evidenciar la validación y el manejo de errores.
6. **Cierre (15 s)**: "Con esto se cubren las cuatro operaciones CRUD; el siguiente paso sería cambiar el diccionario por una base de datos."
