# GameCatalog API

API REST desarrollada con **FastAPI** para gestionar un catálogo de videojuegos (almacenamiento en memoria).

| | |
|---|---|
| **Variable** | `{{base_url}}` |
| **Local** | `http://127.0.0.1:8000` |
| **Vercel** | `https://gamecatalog-api.vercel.app` |
| **Documentación Swagger** | `{{base_url}}/docs` |
| **Interfaz web** | `{{base_url}}/ui/` |

## 1. Modelo de datos

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | entero | Identificador único (lo genera la API; opcional en el POST) |
| `nombre` | texto | Nombre del videojuego (1–100 caracteres) |
| `genero` | texto | Género (1–50 caracteres) |
| `plataforma` | texto | Plataforma disponible (1–50 caracteres) |
| `precio` | decimal | Precio, mayor o igual a 0 |
| `disponible` | booleano | Disponibilidad (por defecto `true`) |

Datos iniciales: id 1 (The Legend of Zelda: Breath of the Wild), id 2 (God of War) e id 3 (Halo Infinite).
Al reiniciar el servidor los datos vuelven a este estado.

## 2. Endpoints

| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| GET | `/videojuegos` | Lista todos los videojuegos | 200 |
| GET | `/videojuegos/{id}` | Consulta uno por ID | 200, 404 |
| POST | `/videojuegos` | Registra un videojuego nuevo | 201, 409, 422 |
| PUT | `/videojuegos/{id}` | Actualiza un videojuego existente | 200, 404, 422 |
| DELETE | `/videojuegos/{id}` | Elimina un videojuego | 204, 404 |

En POST y PUT usa **Body → raw → JSON** con el header `Content-Type: application/json`.

## 3. Las cuatro consultas

### GET: consultar

- Todos: `GET {{base_url}}/videojuegos` → **200 OK**, lista JSON con 3 videojuegos.
- Uno: `GET {{base_url}}/videojuegos/1` → **200 OK**, datos de Zelda (`"id": 1`).
- No existe: `GET {{base_url}}/videojuegos/999` → **404 Not Found**:

```json
{"detail": "No existe un videojuego con id 999"}
```

### POST: registrar

`POST {{base_url}}/videojuegos`

```json
{
  "nombre": "Hollow Knight",
  "genero": "Metroidvania",
  "plataforma": "PC",
  "precio": 14.99,
  "disponible": true
}
```

Esperado: **201 Created**

```json
{"nombre": "Hollow Knight", "genero": "Metroidvania", "plataforma": "PC", "precio": 14.99, "disponible": true, "id": 4}
```

Errores: enviar `"id": 1` → **409 Conflict** (ID duplicado); `"precio": -5` o un campo faltante → **422 Unprocessable Entity**.

### PUT: actualizar

`PUT {{base_url}}/videojuegos/4`

```json
{
  "nombre": "Hollow Knight",
  "genero": "Metroidvania",
  "plataforma": "Nintendo Switch",
  "precio": 9.99,
  "disponible": false
}
```

Esperado: **200 OK** con el videojuego actualizado (`"id": 4`, precio 9.99, `disponible` false). Con un ID inexistente → **404**.
El PUT reemplaza todos los campos, por lo que hay que enviarlos todos.

### DELETE: eliminar

`DELETE {{base_url}}/videojuegos/4` (sin body)

Esperado: **204 No Content** (respuesta vacía). Repetirlo, o hacer `GET /videojuegos/4`, devuelve **404**.

## 4. Flujo completo de demostración

Ejecuta las peticiones en este orden (la colección ya las trae):

1. `GET /videojuegos` → 200, 3 elementos.
2. `POST /videojuegos` (Hollow Knight) → 201, id 4.
3. `GET /videojuegos/4` → 200, datos creados.
4. `PUT /videojuegos/4` (precio 9.99, plataforma Switch) → 200.
5. `GET /videojuegos/4` → 200, datos actualizados.
6. `DELETE /videojuegos/4` → 204.
7. `GET /videojuegos/4` → 404.

> Si repites el POST sin reiniciar el servidor, el ID será 5 y los pasos siguientes ya no coinciden. Reinicia el servidor para repetir la demostración.

## 5. Códigos HTTP usados

| Código | Significado | Cuándo ocurre |
|---|---|---|
| 200 | OK | GET y PUT correctos |
| 201 | Created | POST correcto |
| 204 | No Content | DELETE correcto |
| 404 | Not Found | El ID no existe |
| 409 | Conflict | ID duplicado en el POST |
| 422 | Unprocessable Entity | Datos inválidos |

## 6. Conceptos breves

- **API REST**: forma de comunicar programas por HTTP. Cada recurso (videojuegos) tiene una URL y se manipula con métodos estándar; los datos viajan en JSON y cada respuesta lleva un código de estado.
- **FastAPI**: framework de Python para crear APIs; valida datos con Pydantic y genera documentación automática en `/docs`. **Uvicorn** es el servidor que lo ejecuta.
- **GET** lee datos. **POST** crea un recurso. **PUT** reemplaza un recurso existente. **DELETE** lo elimina.

## 7. Ejecución local (Windows, PowerShell)

```powershell
cd C:\Users\PC\Desktop\ING.SOF2\GameCatalog
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Comprobar: `http://127.0.0.1:8000/` debe responder `{"mensaje":"GameCatalog API funcionando","docs":"/docs"}`.
