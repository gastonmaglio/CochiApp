"""
Corta las dos hojas de poses de la mascota (sprite sheets de Gemini, en Descargas) en
imagenes individuales transparentes, una por pose, listas para animar en la app.

Mismo problema que con el logo: Gemini las exporto como JPG asi que el "fondo
transparente" quedo dibujado como un patron de ajedrez literal — hay que detectarlo y
convertirlo en transparencia real (solo lo que esta CONECTADO al borde de cada celda).
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

DESCARGAS = os.path.join(os.path.expanduser("~"), "Downloads")
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(BASE, "public", "mascota")
os.makedirs(SALIDA, exist_ok=True)


def quitar_ajedrez(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGB"))
    r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
    es_neutro = (np.abs(r - g) <= 10) & (np.abs(g - b) <= 10) & (np.abs(r - b) <= 10)
    es_claro = (r >= 185) & (g >= 185) & (b >= 185)
    candidato_fondo = es_neutro & es_claro

    etiquetas, cantidad = ndimage.label(candidato_fondo)
    etiquetas_borde = set(etiquetas[0, :]) | set(etiquetas[-1, :]) | set(etiquetas[:, 0]) | set(etiquetas[:, -1])
    etiquetas_borde.discard(0)

    # Ademas del ajedrez pegado al borde, Gemini dibuja una sombra ovalada suelta bajo
    # los pies — no toca el borde del lienzo, pero es una mancha grande y uniforme.
    # Un brillo real (ej. el catchlight de un ojo) es chico; una sombra no. El umbral de
    # tamaño separa una cosa de la otra sin tocar el dibujo en si.
    area_minima_mancha = arr.shape[0] * arr.shape[1] * 0.004
    if cantidad > 0:
        tamanios = ndimage.sum(np.ones_like(etiquetas), etiquetas, index=np.arange(1, cantidad + 1))
        etiquetas_grandes = set(int(i) for i, t in enumerate(tamanios, start=1) if t >= area_minima_mancha)
    else:
        etiquetas_grandes = set()

    etiquetas_a_quitar = etiquetas_borde | etiquetas_grandes
    es_fondo = np.isin(etiquetas, list(etiquetas_a_quitar))

    rgba = np.dstack([arr, np.full(arr.shape[:2], 255, dtype=np.uint8)])
    rgba[es_fondo, 3] = 0
    return Image.fromarray(rgba, mode="RGBA")


def recortar_al_contenido(img: Image.Image, margen_pct: float = 0.05) -> Image.Image | None:
    alpha = np.array(img.split()[-1])
    filas = np.any(alpha > 10, axis=1)
    columnas = np.any(alpha > 10, axis=0)
    if not filas.any() or not columnas.any():
        return None
    y0, y1 = np.where(filas)[0][[0, -1]]
    x0, x1 = np.where(columnas)[0][[0, -1]]

    ancho, alto = x1 - x0, y1 - y0
    lado = max(ancho, alto)
    margen = int(lado * margen_pct)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    mitad = lado // 2 + margen

    izquierda, arriba = max(0, cx - mitad), max(0, cy - mitad)
    derecha, abajo = min(img.width, cx + mitad), min(img.height, cy + mitad)
    return img.crop((izquierda, arriba, derecha, abajo))


def cuadrar_lienzo(img: Image.Image) -> Image.Image:
    lado = max(img.width, img.height)
    lienzo = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    lienzo.paste(img, ((lado - img.width) // 2, (lado - img.height) // 2), img)
    return lienzo


def procesar_celda(hoja: Image.Image, caja: tuple[int, int, int, int], nombre: str, tam_salida: int = 420):
    celda_cruda = hoja.crop(caja)
    # Recorte interno chico antes de todo: la grilla no siempre cae exacto, y a veces
    # queda una tira finita de la celda vecina pegada al borde.
    m = int(min(celda_cruda.size) * 0.035)
    celda = celda_cruda.crop((m, m, celda_cruda.width - m, celda_cruda.height - m))
    sin_fondo = quitar_ajedrez(celda)
    recortada = recortar_al_contenido(sin_fondo)
    if recortada is None:
        print(f"  AVISO: {nombre} salió vacía, se salteó")
        return
    cuadrada = cuadrar_lienzo(recortada)
    ruta = os.path.join(SALIDA, f"{nombre}.png")
    cuadrada.resize((tam_salida, tam_salida), Image.LANCZOS).save(ruta, optimize=True, compress_level=9)
    print(f"  OK: {nombre}.png ({os.path.getsize(ruta) // 1024} KB)")


print("Procesando hoja 1 (2x2)...")
hoja1 = Image.open(os.path.join(DESCARGAS, "Gemini_Generated_Image_7mxhc77mxhc77mxh.jpg"))
lado1 = hoja1.width // 2
poses_hoja1 = {
    "sentada-hoja": (0, 0, lado1, lado1),
    "caminando": (lado1, 0, lado1 * 2, lado1),
    "saludando": (0, lado1, lado1, lado1 * 2),
    "sorprendida": (lado1, lado1, lado1 * 2, lado1 * 2),
}
for nombre, caja in poses_hoja1.items():
    procesar_celda(hoja1, caja, nombre)

print("Procesando hoja 2 (3x3)...")
hoja2 = Image.open(os.path.join(DESCARGAS, "Gemini_Generated_Image_fd9ahlfd9ahlfd9a.jpg"))
lado2 = hoja2.width / 3
poses_hoja2 = {
    "sentada-hoja-2": (0, 0),
    "meditando": (1, 0),
    "saludando-2": (2, 0),
    "sentada-saludando": (0, 1),
    "relajada-agua": (1, 1),
    "durmiendo": (2, 1),
    "flores": (0, 2),
    "comiendo": (1, 2),
    "verguenza": (2, 2),
}
for nombre, (col, fila) in poses_hoja2.items():
    caja = (int(col * lado2), int(fila * lado2), int((col + 1) * lado2), int((fila + 1) * lado2))
    procesar_celda(hoja2, caja, nombre)

print("\nListo — poses individuales en public/mascota/")
