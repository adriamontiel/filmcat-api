/**
 * registry.js — Font de veritat de tots els cinemes del sistema.
 * Mirall de data/cinemes-registry.json en format de mòdul JS
 * (compatible amb Node.js i Vercel Edge Runtime).
 *
 * Per afegir o modificar un cinema: actualitza AMBDÓS fitxers.
 */

export const REGISTRY = [
  // ─── OCINE (filazero) ────────────────────────────────────────────────────
  { filmcat_name: 'Ocine Arenys',                                            system: 'filazero', domain: 'ocinearenys.es',        web: 'https://ocinearenys.es' },
  { filmcat_name: 'Ocine Blanes',                                            system: 'filazero', domain: 'ocineblanes.es',        web: 'https://ocineblanes.es' },
  { filmcat_name: 'Ocine El Vendrell \u2013 Les Mates',                      system: 'filazero', domain: 'ocinevendrell.es',      web: 'https://ocinevendrell.es' },
  { filmcat_name: 'Ocine Girona',                                            system: 'filazero', domain: 'ocinegirona.es',        web: 'https://ocinegirona.es' },
  { filmcat_name: 'Ocine Granollers - El Nord',                              system: 'filazero', domain: 'ocinegranollers.es',    web: 'https://ocinegranollers.es' },
  { filmcat_name: 'Ocine M\u00e0gic Badalona',                              system: 'filazero', domain: 'ocinemagic.es',         web: 'https://ocinemagic.es' },
  { filmcat_name: "Ocine Platja d'Aro \u2013 Parc d'Aro",                   system: 'filazero', domain: 'ocineplatjadaro.es',    web: 'https://ocineplatjadaro.es' },
  { filmcat_name: 'Ocine Premium Lleida',                                    system: 'filazero', domain: 'ocinepremiumlleida.es', web: 'https://ocinepremiumlleida.es' },
  { filmcat_name: 'Ocine Roquetes',                                          system: 'filazero', domain: 'ocineroquetes.es',      web: 'https://ocineroquetes.es' },
  { filmcat_name: 'Ocine Tarragona - Les Gavarres',                          system: 'filazero', domain: 'ocinegavarres.es',      web: 'https://ocinegavarres.es' },
  { filmcat_name: 'Ocine Vila-seca \u2013 Port Halley',                      system: 'filazero', domain: 'ocinevilaseca.es',      web: 'https://ocinevilaseca.es' },

  // ─── ACEC (filazero) ─────────────────────────────────────────────────────
  { filmcat_name: 'ACEC Cines Bages Centre de Manresa',                      system: 'filazero', domain: 'cinesbagescentre.com',  web: 'https://www.cinesbagescentre.com' },
  { filmcat_name: 'ACEC Cines Imperial de Sabadell',                         system: 'filazero', domain: 'cinesimperial.com',     web: 'https://www.cinesimperial.com' },
  { filmcat_name: 'ACEC Cines Olot',                                         system: 'filazero', domain: 'cinesolot.cat',         web: 'https://www.cinesolot.cat' },
  { filmcat_name: 'ACEC Multicinemes Eix Maci\u00e0 de Sabadell',           system: 'filazero', domain: 'cinemeseixmacia.com',   web: 'https://www.cinemeseixmacia.com' },

  // ─── ACEC (sense font) ───────────────────────────────────────────────────
  { filmcat_name: "ACEC Cines Filmax Gran Via de l'Hospitalet de Llobregat", system: 'none', domain: null, web: 'https://cinesfilmax.com' },

  // ─── JCA (sense font) ────────────────────────────────────────────────────
  { filmcat_name: 'JCA Cinemes Lleida - Alpicat',                            system: 'none', domain: null, web: 'https://jcacinemes.com/lleida-alpicat/' },
  { filmcat_name: 'JCA Cinemes Tarragona - Valls',                           system: 'none', domain: null, web: 'https://jcacinemes.com/tarragona-valls/' },

  // ─── CINESA (sense font) ─────────────────────────────────────────────────
  { filmcat_name: 'Cinesa Barnasud de Gav\u00e0',                            system: 'none', domain: null, web: 'https://www.cinesa.es/cines/cines-cinesa-barnasud-gava/' },
  { filmcat_name: 'Cinesa Diagonal',                                         system: 'none', domain: null, web: 'https://www.cinesa.es/cines/cines-cinesa-diagonal-barcelona/' },
  { filmcat_name: 'Cinesa Diagonal Mar',                                     system: 'none', domain: null, web: 'https://www.cinesa.es/cines/cines-cinesa-diagonal-mar-barcelona/' },
  { filmcat_name: "Cinesa La Farga de l'Hospitalet de Llobregat",            system: 'none', domain: null, web: 'https://www.cinesa.es/cines/cines-cinesa-la-farga-lhospitalet/' },
  { filmcat_name: 'Cinesa Parc Vall\u00e8s de Terrassa',                     system: 'none', domain: null, web: 'https://www.cinesa.es/cines/cines-cinesa-parc-valles-terrassa/' },
  { filmcat_name: 'Cinesa SOM Multiespai',                                   system: 'none', domain: null, web: 'https://www.cinesa.es/cines/cines-cinesa-som-multiespai-barcelona/' },

  // ─── YELMO (sense font) ──────────────────────────────────────────────────
  { filmcat_name: 'Cine Yelmo Abrera',                                       system: 'none', domain: null, web: 'https://www.yelmocines.es/cines/cataluna/abrera' },
  { filmcat_name: 'Cine Yelmo Baricentro de Barber\u00e0 del Vall\u00e8s',  system: 'none', domain: null, web: 'https://www.yelmocines.es/cines/cataluna/baricentro' },
  { filmcat_name: 'Cine Yelmo Parc Central de Tarragona',                    system: 'none', domain: null, web: 'https://www.yelmocines.es/cines/cataluna/parc-central' },
  { filmcat_name: 'Cine Yelmo Premium Castelldefels',                        system: 'none', domain: null, web: 'https://www.yelmocines.es/cines/cataluna/castelldefels' },
  { filmcat_name: 'Cine Yelmo Westfield La Maquinista',                      system: 'none', domain: null, web: 'https://www.yelmocines.es/cines/cataluna/la-maquinista' },

  // ─── Altres cinemes notables ─────────────────────────────────────────────
  { filmcat_name: 'CineBaix de Sant Feliu de Llobregat',                     system: 'none', domain: null, web: 'https://cinebaix.cat' },
  { filmcat_name: 'Cinemes Girona',                                          system: 'none', domain: null, web: 'https://www.cinesgirona.cat' },
  { filmcat_name: 'Cinema Truffaut de Girona',                               system: 'none', domain: null, web: 'https://www.truffaut.cat' },
  { filmcat_name: 'Cinema Mald\u00e0',                                       system: 'none', domain: null, web: 'https://www.cinemesmalda.com' },
  { filmcat_name: 'Espai Texas',                                             system: 'none', domain: null, web: 'https://www.cinemetexas.cat' },
  { filmcat_name: 'Filmoteca de Catalunya',                                  system: 'none', domain: null, web: 'https://filmoteca.cat' },
  { filmcat_name: 'Kin\u00e9polis Matar\u00f3 Parc',                         system: 'none', domain: null, web: 'https://www.kinepolis.es/cines/kinepolis-mataro' },
  { filmcat_name: 'Renoir Floridablanca',                                    system: 'none', domain: null, web: 'https://www.cinerenoir.com/floridablanca' },
  { filmcat_name: 'Zumzeig Cinema',                                          system: 'none', domain: null, web: 'https://zumzeig.cat' },
]

// Índex per accés O(1)
export const REGISTRY_INDEX = new Map(REGISTRY.map(e => [e.filmcat_name, e]))
