"""Prueba automática del flujo completo (sin Postman): python test_api.py"""
from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)

r = c.get("/videojuegos");            assert r.status_code == 200 and len(r.json()) == 3
r = c.get("/videojuegos/1");          assert r.status_code == 200 and r.json()["id"] == 1
r = c.get("/videojuegos/999");        assert r.status_code == 404

nuevo = {"nombre": "Hollow Knight", "genero": "Metroidvania", "plataforma": "PC",
         "precio": 14.99, "disponible": True}
r = c.post("/videojuegos", json=nuevo)
assert r.status_code == 201, r.text
id_nuevo = r.json()["id"]; assert id_nuevo == 4

assert c.post("/videojuegos", json={**nuevo, "id": 1}).status_code == 409   # id duplicado
assert c.post("/videojuegos", json={**nuevo, "precio": -5}).status_code == 422  # validación

r = c.put(f"/videojuegos/{id_nuevo}", json={**nuevo, "precio": 9.99, "disponible": False})
assert r.status_code == 200 and r.json()["precio"] == 9.99 and r.json()["disponible"] is False
assert c.put("/videojuegos/999", json=nuevo).status_code == 404

r = c.delete(f"/videojuegos/{id_nuevo}"); assert r.status_code == 204 and r.content == b""
assert c.get(f"/videojuegos/{id_nuevo}").status_code == 404
assert c.delete(f"/videojuegos/{id_nuevo}").status_code == 404

print("OK: todas las pruebas pasaron")
