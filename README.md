# FILMCAT API — Proxy per als XMLs de la Generalitat

Backend lleuger que llegeix els XMLs de dades obertes de cinema en català
de la Generalitat de Catalunya i els serveix com a JSON per a la web FILMCAT.

---

## Estructura del projecte

```
filmcat-api/
├── api/
│   ├── cartellera.js   → /api/cartellera  (pel·lícules + sessions)
│   ├── cinemes.js      → /api/cinemes     (llista de cinemes)
│   └── status.js       → /api/status      (health check)
├── lib/
│   └── parseXML.js     → parser dels XMLs de Gencat
├── package.json
├── vercel.json
└── README.md
```

---

## Deploy a Vercel — Pas a pas

### Pas 1: Crear compte a GitHub (si no en tens)
1. Vés a **github.com** → clic a "Sign up"
2. Crea un compte gratuït

### Pas 2: Crear el repositori
1. Un cop dins GitHub, clic al botó verd **"New"** (cantonada superior esquerra)
2. Nom del repositori: `filmcat-api`
3. Marca **"Private"** (opcional però recomanat)
4. Clic a **"Create repository"**

### Pas 3: Pujar els fitxers
1. Dins el repositori buit, clic a **"uploading an existing file"**
2. Puja tots els fitxers d'aquesta carpeta mantenint l'estructura de carpetes
3. Clic a **"Commit changes"**

### Pas 4: Crear compte a Vercel
1. Vés a **vercel.com**
2. Clic a **"Sign Up"** → tria **"Continue with GitHub"**
3. Autoritza Vercel a accedir al teu GitHub

### Pas 5: Deploy
1. Dins Vercel, clic a **"Add New Project"**
2. Selecciona el repositori `filmcat-api`
3. No cal canviar res → clic a **"Deploy"**
4. En 30 segons tens la URL! Serà algo com:
   `https://filmcat-api-abc123.vercel.app`

### Pas 6: Provar que funciona
Obre al navegador:
- `https://la-teva-url.vercel.app/api/status` → ha de dir `"status": "ok"`
- `https://la-teva-url.vercel.app/api/cartellera` → ha de retornar JSON amb pel·lícules
- `https://la-teva-url.vercel.app/api/cinemes` → ha de retornar JSON amb cinemes

---

## Endpoints disponibles

### `GET /api/cartellera`
Retorna totes les pel·lícules en català amb sessions.

```json
{
  "ok": true,
  "updatedAt": "2026-03-04T10:00:00Z",
  "total": 25,
  "films": [
    {
      "id": "12345",
      "title": "Balandrau, Vent Salvatge",
      "version": "VD",
      "genre": "Drama",
      "duration": "116",
      "synopsis": "...",
      "sessions": [
        {
          "cinema": "Cinemes Verdi",
          "city": "Barcelona",
          "lat": 41.4034,
          "lng": 2.1567,
          "times": [
            { "date": "20260304", "time": "19:00", "lang": "VD" }
          ]
        }
      ]
    }
  ]
}
```

### `GET /api/cinemes`
Retorna tots els cinemes que projecten en català.

### `GET /api/status`
Health check de les fonts de dades de Gencat.

---

## Cache
Els endpoints estan configurats amb cache d'1 hora (`s-maxage=3600`).
Vercel serveix els resultats des de la seva CDN global,
cosa que fa les respostes instantànies per als usuaris.

---

## Font de les dades
Dades obertes de la Generalitat de Catalunya:
https://www.gencat.cat/llengua/cinema/
Llicència: Llicència oberta de dades (Creative Commons)
