"""
Regenera la mascota (capibara) y todos los iconos derivados (PWA, apple-touch,
favicon). Segundo rediseno: el primero (cabeza rectangular + hocico chato)
seguia leyendose como oso/hamster generico. Esta version apunta a rasgos que
identifican a la capibara sin ambiguedad:
  - Cabeza mas ovalada/domo (no un rectangulo con esquinas redondeadas).
  - Ojos chicos y "entrecerrados" (la expresion tranquila tipica de capibara).
  - Orejas casi invisibles, del mismo tono que la cabeza (no un circulo oscuro
    tipo oso).
  - Hocico enorme, plano, casi todo el ancho de la cabeza.
  - La mandarina en la cabeza: es EL simbolo visual mas reconocible de
    capibara en la cultura de internet, y saca cualquier ambiguedad con
    "es un oso/hamster".
"""
from PIL import Image, ImageDraw

COLOR_FONDO = (139, 163, 108)  # sage verde, igual al usado en el resto de la app
COLOR_PELO = (163, 128, 92)  # marron capibara
COLOR_PELO_SOMBRA = (145, 111, 79)  # apenas mas oscuro, para las orejas (sutil, no un "oso")
COLOR_HOCICO = (219, 194, 158)  # zona del hocico, mas clara
COLOR_OJO = (40, 30, 24)
COLOR_MANDARINA = (237, 141, 44)
COLOR_MANDARINA_SOMBRA = (214, 120, 32)
COLOR_HOJA = (108, 143, 82)

S = 1024


def dibujar_capibara(fondo=None, radio_fondo=None):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if fondo is not None:
        if radio_fondo is not None:
            draw.rounded_rectangle([0, 0, S, S], radius=radio_fondo, fill=fondo)
        else:
            draw.rectangle([0, 0, S, S], fill=fondo)

    cx, cy = S // 2, S // 2 + int(S * 0.06)

    # --- Cabeza: ovalo ancho tipo domo, no un rectangulo ---
    ancho_cabeza = int(S * 0.80)
    alto_cabeza = int(S * 0.62)
    hx0, hx1 = cx - ancho_cabeza // 2, cx + ancho_cabeza // 2
    hy0, hy1 = cy - alto_cabeza // 2, cy + alto_cabeza // 2
    # Domo arriba (semi-ovalo) + base achatada abajo: se logra con un rounded_rectangle
    # de radio grande arriba y chico abajo, dibujado en dos pasadas.
    draw.rounded_rectangle([hx0, hy0, hx1, hy1], radius=int(alto_cabeza * 0.46), fill=COLOR_PELO)
    # Achatamos la base (la mandibula de la capibara es mas recta que un ovalo perfecto).
    draw.rectangle([hx0 + int(ancho_cabeza * 0.06), hy0 + int(alto_cabeza * 0.55), hx1 - int(ancho_cabeza * 0.06), hy1], fill=COLOR_PELO)
    draw.rounded_rectangle(
        [hx0 + int(ancho_cabeza * 0.02), hy0 + int(alto_cabeza * 0.40), hx1 - int(ancho_cabeza * 0.02), hy1],
        radius=int(alto_cabeza * 0.18),
        fill=COLOR_PELO,
    )

    # --- Orejas: chiquitas, casi el mismo tono que la cabeza (nada de "oso") ---
    radio_oreja = int(S * 0.038)
    oreja_y = hy0 + int(alto_cabeza * 0.08)
    for signo in (-1, 1):
        ox = cx + signo * int(ancho_cabeza * 0.40)
        draw.ellipse(
            [ox - radio_oreja, oreja_y - radio_oreja, ox + radio_oreja, oreja_y + radio_oreja],
            fill=COLOR_PELO_SOMBRA,
        )

    # --- Hocico: banda enorme y chata, casi todo el ancho de la cabeza ---
    ancho_hocico = int(ancho_cabeza * 0.92)
    alto_hocico = int(alto_cabeza * 0.46)
    mx0, mx1 = cx - ancho_hocico // 2, cx + ancho_hocico // 2
    my1 = hy1 - int(alto_cabeza * 0.04)
    my0 = my1 - alto_hocico
    draw.rounded_rectangle([mx0, my0, mx1, my1], radius=int(alto_hocico * 0.32), fill=COLOR_HOCICO)

    # --- Ojos: chicos y "entrecerrados" (linea + curva apenas abierta, no dots redondos) ---
    ancho_ojo = int(S * 0.052)
    alto_ojo = int(S * 0.020)
    ojo_y = my0 - int(S * 0.012)
    for signo in (-1, 1):
        ex = cx + signo * int(ancho_cabeza * 0.20)
        draw.rounded_rectangle(
            [ex - ancho_ojo // 2, ojo_y - alto_ojo // 2, ex + ancho_ojo // 2, ojo_y + alto_ojo // 2],
            radius=alto_ojo // 2,
            fill=COLOR_OJO,
        )

    # --- Fosas nasales: dos puntitos sobre el hocico ---
    radio_nariz = int(S * 0.014)
    nariz_y = my0 + int(alto_hocico * 0.20)
    for signo in (-1, 1):
        nx = cx + signo * int(ancho_hocico * 0.09)
        draw.ellipse(
            [nx - radio_nariz, nariz_y - radio_nariz, nx + radio_nariz, nariz_y + radio_nariz],
            fill=COLOR_OJO,
        )

    # --- La mandarina: el sello inconfundible de "esto es una capibara" ---
    radio_mandarina = int(S * 0.085)
    mandarina_cx = cx
    mandarina_cy = hy0 + int(S * 0.01)
    draw.ellipse(
        [
            mandarina_cx - radio_mandarina, mandarina_cy - radio_mandarina,
            mandarina_cx + radio_mandarina, mandarina_cy + radio_mandarina,
        ],
        fill=COLOR_MANDARINA,
    )
    # sombra sutil abajo a la derecha para que no quede un circulo plano
    draw.ellipse(
        [
            mandarina_cx - radio_mandarina * 0.55, mandarina_cy,
            mandarina_cx + radio_mandarina, mandarina_cy + radio_mandarina,
        ],
        fill=COLOR_MANDARINA_SOMBRA,
    )
    draw.ellipse(
        [
            mandarina_cx - radio_mandarina, mandarina_cy - radio_mandarina,
            mandarina_cx + radio_mandarina * 0.55, mandarina_cy,
        ],
        fill=COLOR_MANDARINA,
    )
    # hojita arriba de la mandarina
    hoja_y = mandarina_cy - radio_mandarina
    draw.ellipse(
        [mandarina_cx - int(radio_mandarina * 0.35), hoja_y - int(radio_mandarina * 0.55),
         mandarina_cx + int(radio_mandarina * 0.35), hoja_y + int(radio_mandarina * 0.15)],
        fill=COLOR_HOJA,
    )

    return img


def guardar(img, ruta, tam):
    img.resize((tam, tam), Image.LANCZOS).save(ruta)


import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(BASE, "public")
ICONS = os.path.join(PUBLIC, "icons")
os.makedirs(ICONS, exist_ok=True)

mascota = dibujar_capibara(fondo=None)
guardar(mascota, os.path.join(PUBLIC, "mascota-capibara.png"), 512)

icono_any = dibujar_capibara(fondo=COLOR_FONDO, radio_fondo=int(S * 0.22))
for tam in (72, 96, 128, 144, 152, 192, 384, 512):
    guardar(icono_any, os.path.join(ICONS, f"icon-{tam}.png"), tam)

icono_maskable = Image.new("RGBA", (S, S), COLOR_FONDO)
capybara_chica = dibujar_capibara(fondo=None).resize((int(S * 0.72), int(S * 0.72)), Image.LANCZOS)
offset = ((S - capybara_chica.width) // 2, (S - capybara_chica.height) // 2 + int(S * 0.02))
icono_maskable.paste(capybara_chica, offset, capybara_chica)
for tam in (192, 512):
    guardar(icono_maskable, os.path.join(ICONS, f"icon-maskable-{tam}.png"), tam)

guardar(icono_any, os.path.join(PUBLIC, "apple-touch-icon.png"), 180)

guardar(icono_any, os.path.join(PUBLIC, "favicon-32.png"), 32)
favicon_sizes = [16, 32, 48]
favicon_imgs = [icono_any.resize((s, s), Image.LANCZOS) for s in favicon_sizes]
favicon_imgs[0].save(
    os.path.join(PUBLIC, "favicon.ico"),
    format="ICO",
    sizes=[(s, s) for s in favicon_sizes],
    append_images=favicon_imgs[1:],
)

print("Listo: mascota + iconos regenerados (rediseno con mandarina en la cabeza).")
