// lib/parseXML.js — estructura real dels XMLs de Gencat

function getTag(str, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = str.match(re);
  return m ? m[1].replace(/&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim() : '';
}

function getBlocks(str, tag) {
  const re = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, 'gi');
  return str.match(re) || [];
}

// Parseja provacin.xml — estructura: <FILM>
function parseFilms(xml) {
  const films = [];
  const blocks = getBlocks(xml, 'FILM');
  for (const block of blocks) {
    const id      = getTag(block, 'IDFILM');
    const title   = getTag(block, 'TITOL');
    if (!id || !title) continue;

    const version = getTag(block, 'VERSIO');
    let versionCode = 'VD';
    const v = version.toLowerCase().trim();
    // Reconeix tant sigles curtes (VO, VOSC, VD) com text descriptiu de Gencat
    if (v === 'vosc' || v === 'vose' || (v.includes('original') && (v.includes('subt') || v.includes('català')))) versionCode = 'VOSC';
    else if (v === 'vo' || v.includes('original')) versionCode = 'VO';

    films.push({
      id,
      title,
      titleOriginal: getTag(block, 'ORIGINAL'),
      director:      getTag(block, 'DIRECCIO'),
      synopsis:      getTag(block, 'SINOPSI'),
      version:       versionCode,
      versionRaw:    version,
      language:      getTag(block, 'IDIOMA_x0020_ORIGINAL'),
      rating:        getTag(block, 'QUALIFICACIO'),
      trailer:       getTag(block, 'TRAILER'),
      poster:        getTag(block, 'CARTELL'),
      year:          getTag(block, 'ANY') || String(new Date().getFullYear()),
      premiere:      getTag(block, 'ESTRENA'),
      sessions:      [],
      genre:         '',
      duration:      '',
    });
  }
  return films;
}

// Parseja film_sessions.xml — estructura: <SESSIONS>
function parseSessions(xml) {
  const sessions = [];
  const blocks = getBlocks(xml, 'SESSIONS');
  for (const block of blocks) {
    const filmId   = getTag(block, 'IDFILM');
    const cinemaId = getTag(block, 'CINEID');
    const cinema   = getTag(block, 'CINENOM');
    const city     = getTag(block, 'LOCALITAT');
    const comarca  = getTag(block, 'COMARCA');
    const version  = getTag(block, 'ver');
    const date     = getTag(block, 'ses_data');
    const order    = getTag(block, 'ORDRESESSIO');
    if (!filmId || !cinemaId) continue;
    sessions.push({ filmId, cinemaId, cinema, city, comarca, version, date, order });
  }
  return sessions;
}

// Parseja cinemes.xml — estructura: <CINEMA> o similar
function parseCinemas(xml) {
  const cinemas = [];
  // Prova diversos noms d'etiqueta
  const tags = ['CINEMA', 'Cinema', 'cinema'];
  let blocks = [];
  for (const t of tags) {
    blocks = getBlocks(xml, t);
    if (blocks.length) break;
  }
  for (const block of blocks) {
    const name = getTag(block, 'NOM') || getTag(block, 'NOMCINEMA');
    if (!name) continue;
    cinemas.push({
      id:       getTag(block, 'IDCINEMA'),
      name,
      address:  getTag(block, 'ADREÇA') || getTag(block, 'ADRECA') || getTag(block, 'ADRESA'),
      city:     getTag(block, 'MUNICIPI') || getTag(block, 'POBLACIO') || getTag(block, 'LOCALITAT'),
      province: getTag(block, 'PROVINCIA'),
      lat:      parseFloat(getTag(block, 'LATITUD'))  || null,
      lng:      parseFloat(getTag(block, 'LONGITUD')) || null,
    });
  }
  return cinemas;
}

export { parseFilms, parseSessions, parseCinemas, getTag, getBlocks };
