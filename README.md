# Nalka Lands — sitio web

Sitio estático (sin build step): `index.html`, `catalogo.html`, `vender.html` + `assets/`.
`vercel.json` tiene `cleanUrls: true` para que `/catalogo` y `/vender` funcionen sin `.html`.

Actualmente el sitio está en producción en **nalka.vercel.app**, desplegado a mano con `vercel --prod`.
Esta carpeta es una copia lista para subir a GitHub y dejar el deploy automatizado (cada push a `main` publica solo).

## 1. Subir a GitHub

```bash
gh repo create nalka-lands-web --private --source=. --remote=origin --push
```

O manualmente:
```bash
git remote add origin https://github.com/<tu-usuario>/nalka-lands-web.git
git branch -M main
git push -u origin main
```

## 2. Conectar con Vercel

Para que los pushes a GitHub actualicen automáticamente **nalka.vercel.app** (el mismo proyecto que ya existe):

1. Ve a [vercel.com](https://vercel.com) → proyecto **nalka** → **Settings → Git**.
2. Conecta el repo de GitHub recién creado.
3. Cada push a `main` quedará desplegado automáticamente en nalka.vercel.app.

Si prefieres un proyecto nuevo en vez de conectar el existente, en su lugar usa **Add New → Project** en el dashboard de Vercel e importa el repo — Vercel detecta `vercel.json` solo, no hace falta configurar nada más.

## Notas

- Los videos "master" sin optimizar (los `.mp4` originales de 100-220MB) **no están en este repo** — están fuera del límite de archivo de GitHub (100MB) y no se necesitan para servir el sitio. Los videos optimizados que sí usa el sitio están en `assets/video/`.
- Números de contacto (`+56900000000`) y `contacto@nalkalands.cl` siguen siendo placeholders — falta reemplazarlos por los reales en `index.html`, `catalogo.html`, `vender.html`.
