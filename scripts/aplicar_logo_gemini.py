"""
Reemplaza la mascota (antes generada a mano con formas planas) por las dos imagenes
de Gemini que dejo el usuario en Descargas:
  - Gemini_Generated_Image_4l1zxu4l1zxu4l1z.jpg -> pensada con fondo transparente, pero
    Gemini la exporto como JPG (no soporta canal alfa) asi que el "transparente" quedo
    dibujado como un patron de ajedrez blanco/gris literal en los pixeles. Hay que
    quitarlo y convertirlo en transparencia real.
  - Gemini_Generated_Image_lwgcx0lwgcx0lwgc.jpg -> version con fondo blanco solido, para
    los lugares que necesitan un fondo opaco (apple-touch-icon, favicon).

Genera: mascota-capibara.png (transparente, para uso dentro de la app), todos los
icons/icon-*.png con fondo color marca, los maskable, apple-touch-icon y favicon.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESCARGAS = os.path.join(os.path.expanduser("~"), "Downloads")
RUTA_TRANSPARENTE = os.path.join(DESCARGAS, "Gemini_Generated_Image_4l1zxu4l1zxu4l1z.jpg")
RUTA_FONDO_BLANCO = os.path.join(DESCARGAS, "Gemini_Generated_Image_lwgcx0lwgcx0lwgc.jpg")

PUBLIC = os.path.join(BASE, "public")
ICONS = os.path.join(PUBLIC, "icons")
os.makedirs(ICONS, exist_ok=True)

COLOR_FONDO_ICONO = (139, 163, 108)  # sage verde, el mismo que ya usaba la app


def quitar_ajedrez(ruta_jpg: str) -> Image.Image:
    """Detecta el patron de ajedrez blanco/gris (el "transparente" de Gemini exportado
    como JPG) y lo convierte en transparencia real, sin tocar nada del dibujo en si
    (solo se borra lo que esta CONECTADO al borde del lienzo, asi un brillo blanco
    suelto en un ojo, adentro del dibujo, nunca se toca)."""
    img = Image.open(ruta_jpg).convert("RGB")
    arr = np.array(img)

    r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
    es_neutro = (np.abs(r - g) <= 8) & (np.abs(g - b) <= 8) & (np.abs(r - b) <= 8)
    es_claro = (r >= 190) & (g >= 190) & (b >= 190)
    candidato_fondo = es_neutro & es_claro

    etiquetas, cantidad = ndimage.label(candidato_fondo)
    etiquetas_en_borde = set(etiquetas[0, :]) | set(etiquetas[-1, :]) | set(etiquetas[:, 0]) | set(etiquetas[:, -1])
    etiquetas_en_borde.discard(0)

    es_fondo = np.isin(etiquetas, list(etiquetas_en_borde))

    rgba = np.dstack([arr, np.full(arr.shape[:2], 255, dtype=np.uint8)])
    rgba[es_fondo, 3] = 0

    return Image.fromarray(rgba, mode="RGBA")


def recortar_al_contenido(img: Image.Image, margen_pct: float = 0.06) -> Image.Image:
    """Recorta al bounding box del dibujo (alpha > 0) y agrega un margen parejo, para
    que la mascota quede bien encuadrada sin aire de mas ni de menos."""
    alpha = np.array(img.split()[-1])
    filas = np.any(alpha > 10, axis=1)
    columnas = np.any(alpha > 10, axis=0)
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
    """Fuerza a un lienzo cuadrado (centrado, transparente alrededor) — algunos recortes
    quedan levemente rectangulares por el redondeo de los bounding box."""
    lado = max(img.width, img.height)
    lienzo = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    lienzo.paste(img, ((lado - img.width) // 2, (lado - img.height) // 2), img)
    return lienzo


def guardar(img: Image.Image, ruta: str, tam: int):
    img.resize((tam, tam), Image.LANCZOS).save(ruta)


print("Quitando el patron de ajedrez de la version transparente...")
mascota_transparente = cuadrar_lienzo(recortar_al_contenido(quitar_ajedrez(RUTA_TRANSPARENTE)))
mascota_transparente.resize((512, 512), Image.LANCZOS).save(os.path.join(PUBLIC, "mascota-capibara.png"))
print("OK: mascota-capibara.png")

# --- Iconos "any": la mascota transparente sobre un fondo redondeado color marca ---
S = 1024
icono_any = Image.new("RGBA", (S, S), (0, 0, 0, 0))
from PIL import ImageDraw
draw = ImageDraw.Draw(icono_any)
draw.rounded_rectangle([0, 0, S, S], radius=int(S * 0.22), fill=COLOR_FONDO_ICONO)
capybara_para_icono = mascota_transparente.resize((int(S * 0.97), int(S * 0.97)), Image.LANCZOS)
offset = ((S - capybara_para_icono.width) // 2, (S - capybara_para_icono.height) // 2)
icono_any.paste(capybara_para_icono, offset, capybara_para_icono)

for tam in (72, 96, 128, 144, 152, 192, 384, 512):
    guardar(icono_any, os.path.join(ICONS, f"icon-{tam}.png"), tam)
print("OK: icons/icon-*.png")

# --- Iconos "maskable": full-bleed, con mas margen de seguridad para el recorte de Android ---
icono_maskable = Image.new("RGBA", (S, S), COLOR_FONDO_ICONO + (255,))
capybara_chica = mascota_transparente.resize((int(S * 0.82), int(S * 0.82)), Image.LANCZOS)
offset_m = ((S - capybara_chica.width) // 2, (S - capybara_chica.height) // 2)
icono_maskable.paste(capybara_chica, offset_m, capybara_chica)
for tam in (192, 512):
    guardar(icono_maskable, os.path.join(ICONS, f"icon-maskable-{tam}.png"), tam)
print("OK: icons/icon-maskable-*.png")

# --- apple-touch-icon y favicon: usamos la version con FONDO BLANCO real de Gemini ---
fondo_blanco = Image.open(RUTA_FONDO_BLANCO).convert("RGB")
# Mismo recorte al contenido, pero detectando "contenido" contra fondo blanco puro en vez
# de por canal alfa (esta versión no tiene transparencia).
arr_fb = np.array(fondo_blanco)
no_blanco = ~((arr_fb[:, :, 0] >= 245) & (arr_fb[:, :, 1] >= 245) & (arr_fb[:, :, 2] >= 245))
filas = np.any(no_blanco, axis=1)
columnas = np.any(no_blanco, axis=0)
y0, y1 = np.where(filas)[0][[0, -1]]
x0, x1 = np.where(columnas)[0][[0, -1]]
lado_fb = max(x1 - x0, y1 - y0)
margen_fb = int(lado_fb * 0.08)
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
mitad_fb = lado_fb // 2 + margen_fb
recorte_blanco = fondo_blanco.crop((
    max(0, cx - mitad_fb), max(0, cy - mitad_fb),
    min(fondo_blanco.width, cx + mitad_fb), min(fondo_blanco.height, cy + mitad_fb),
))
# Lienzo cuadrado blanco parejo, por si el recorte no salio perfectamente cuadrado.
lado_final = max(recorte_blanco.width, recorte_blanco.height)
lienzo_blanco = Image.new("RGB", (lado_final, lado_final), (255, 255, 255))
lienzo_blanco.paste(recorte_blanco, ((lado_final - recorte_blanco.width) // 2, (lado_final - recorte_blanco.height) // 2))

guardar(lienzo_blanco, os.path.join(PUBLIC, "apple-touch-icon.png"), 180)
print("OK: apple-touch-icon.png")

guardar(lienzo_blanco, os.path.join(PUBLIC, "favicon-32.png"), 32)
favicon_sizes = [16, 32, 48]
favicon_imgs = [lienzo_blanco.resize((s, s), Image.LANCZOS) for s in favicon_sizes]
favicon_imgs[0].save(
    os.path.join(PUBLIC, "favicon.ico"),
    format="ICO",
    sizes=[(s, s) for s in favicon_sizes],
    append_images=favicon_imgs[1:],
)
print("OK: favicon.ico + favicon-32.png")

print("\nListo — logo de Gemini aplicado en toda la app.")
