from flask import Flask, render_template, request, redirect, url_for
import random

app = Flask(__name__)

# ==================== DATOS ====================
departamentos = {
    "Ahuachapán": {"capital": "Ahuachapán"},
    "Santa Ana": {"capital": "Santa Ana"},
    "Sonsonate": {"capital": "Sonsonate"},
    "Chalatenango": {"capital": "Chalatenango"},
    "La Libertad": {"capital": "Santa Tecla"},
    "San Salvador": {"capital": "San Salvador"},
    "Cuscatlán": {"capital": "Cojutepeque"},
    "Cabañas": {"capital": "Sensuntepeque"},
    "La Paz": {"capital": "Zacatecoluca"},
    "San Vicente": {"capital": "San Vicente"},
    "Usulután": {"capital": "Usulután"},
    "San Miguel": {"capital": "San Miguel"},
    "Morazán": {"capital": "San Francisco Gotera"},
    "La Unión": {"capital": "La Unión"}
}

# ==================== JUGADOR ====================
class Jugador:
    def __init__(self):
        self.nombre = "Jugador"
        self.dinero = 500
        self.soldados = 1000
        self.territorios = []

jugador = Jugador()

# Inicializar mapa
mapa = {dep: "Neutral" for dep in departamentos}
inicio = random.choice(list(departamentos.keys()))
mapa[inicio] = "Jugador"
jugador.territorios.append(inicio)

# ==================== RUTAS ====================
@app.route("/")
def index():
    return render_template("index.html", mapa=mapa, jugador=jugador)

@app.route("/entrenar", methods=["POST"])
def entrenar():
    if jugador.dinero >= 100:
        jugador.dinero -= 100
        jugador.soldados += 100
    return redirect(url_for("index"))

@app.route("/pasar")
def pasar():
    ingreso = len(jugador.territorios) * 150
    jugador.dinero += ingreso
    return redirect(url_for("index"))


import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)