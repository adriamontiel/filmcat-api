// lib/parseXML.js
// Parser lleuger per als XMLs de Gencat sense dependències externes

/**
 * Extreu tots els valors d'una etiqueta XML d'un string
 * Exemple: getTag('<nom>Verdi</nom>', 'nom') => 'Verdi'
 */
function getTag(str, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = str.match(re);
  return m ? m[1].trim() : '';
}

/**
 * Extreu tots els blocs d'una etiqueta XML
 * Exemple: getBlocks(xml, 'pelicula') => ['<pelicula>...</pelicula>', ...]
 */
function getBlocks(str, tag) {
  const re = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, 'gi');
  return str.match(re) || [];
}

/**
 * Parseja el XML de pel·lícules (provacin.xml)
 * Retorna array de pel·lícules amb sessions agrupades per cinema
 */
function parseFilms(xml) {
  const films = [];
  const filmBlocks = getBlocks(xml, 'pelicula');

  for (const block of filmBlocks) {
    const id       = getTag(block, 'id_pelicula');
    const title    = getTag(block, 'titol_cat') || getTag(block, 'titol_original');
    const titleEs  = getTag(block, 'titol_cast');
    const titleOri = getTag(block, 'titol_original');
    const version  = getTag(block, 'versio');   // VD, VO, VOSC, VOSE
    const genre    = getTag(block, 'genere');
    const duration = getTag(block, 'durada');
    const synopsis = getTag(block, 'sinopsi_cat') || getTag(block, 'sinopsi_cast');
    const poster   = getTag(block, 'imatge');    // URL del pòster si existeix
    const trailer  = getTag(block, 'trailer');
    const director = getTag(block, 'director');
    const year     = getTag(block, 'any');

    // Sessions dins d'aquesta pel·lícula
    const sessionBlocks = getBlocks(block, 'sessio');
    const sessions = [];

    for (const s of sessionBlocks) {
      const cinemaId   = getTag(s, 'id_cinema');
      const cinemaName = getTag(s, 'nom_cinema');
      const address    = getTag(s, 'adreca');
      const city       = getTag(s, 'municipi');
      const province   = getTag(s, 'provincia');
      const lat        = getTag(s, 'latitud');
      const lng        = getTag(s, 'longitud');
      const date       = getTag(s, 'data');
      const time       = getTag(s, 'hora');
      const sessionId  = getTag(s, 'id_sessio');

      if (cinemaName && date) {
        // Agrupa per cinema
        let cinema = sessions.find(c => c.cinemaId === cinemaId);
        if (!cinema) {
          cinema = {
            cinemaId,
            cinema: cinemaName,
            address,
            city,
            province,
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null,
            times: []
          };
          sessions.push(cinema);
        }
        cinema.times.push({ date, time, sessionId, lang: version });
      }
    }

    if (title && id) {
      films.push({
        id,
        title,
        titleEs,
        titleOriginal: titleOri,
        version,
        genre,
        duration,
        synopsis,
        poster,
        trailer,
        director,
        year,
        sessions
      });
    }
  }

  return films;
}

/**
 * Parseja el XML de cinemes (cinemes.xml)
 */
function parseCinemas(xml) {
  const cinemas = [];
  const blocks = getBlocks(xml, 'cinema');

  for (const block of blocks) {
    cinemas.push({
      id:       getTag(block, 'id_cinema'),
      name:     getTag(block, 'nom'),
      address:  getTag(block, 'adreca'),
      city:     getTag(block, 'municipi'),
      province: getTag(block, 'provincia'),
      zip:      getTag(block, 'cp'),
      phone:    getTag(block, 'telefon'),
      web:      getTag(block, 'web'),
      lat:      parseFloat(getTag(block, 'latitud'))  || null,
      lng:      parseFloat(getTag(block, 'longitud')) || null,
    });
  }

  return cinemas;
}

/**
 * Parseja el XML de sessions (film_sessions.xml)
 * Format alternatiu: sessions sense estructura de pel·lícula
 */
function parseSessions(xml) {
  const sessions = [];
  const blocks = getBlocks(xml, 'sessio');

  for (const block of blocks) {
    sessions.push({
      sessionId:  getTag(block, 'id_sessio'),
      filmId:     getTag(block, 'id_pelicula'),
      filmTitle:  getTag(block, 'titol_cat') || getTag(block, 'titol_original'),
      version:    getTag(block, 'versio'),
      cinemaId:   getTag(block, 'id_cinema'),
      cinemaName: getTag(block, 'nom_cinema'),
      city:       getTag(block, 'municipi'),
      province:   getTag(block, 'provincia'),
      lat:        parseFloat(getTag(block, 'latitud'))  || null,
      lng:        parseFloat(getTag(block, 'longitud')) || null,
      date:       getTag(block, 'data'),
      time:       getTag(block, 'hora'),
    });
  }

  return sessions;
}

module.exports = { parseFilms, parseCinemas, parseSessions, getTag, getBlocks };
