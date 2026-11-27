// Summer Training: las 6 planificaciones (masc/fem × 3/4/5 días) y la periodización de 12 semanas.
// Datos tomados de la maqueta aprobada por Lucia y el profe (con los 5 métodos ya movidos al día correcto).
// buildPlan() arma el plan de 12 semanas en el mismo formato que usa la app para los alumnos.

export const P={
 M3:{t:'Full Body',days:[
  ['Fuerza base',[['Sentadilla con barra',3,'6–8','120–180 s'],['Press banca',3,'6–8','120–180 s'],['Remo con pecho apoyado',3,'8–10','90–120 s'],['Peso muerto rumano',2,'8–10','120 s'],['Elevaciones laterales',2,'12–15','60–90 s'],['Crunch en polea',2,'12–15','60 s']]],
  ['Desarrollo muscular',[['Prensa',3,'10–12','120 s'],['Press inclinado con mancuernas',3,'8–12','90–120 s'],['Jalón al pecho',3,'10–12','90–120 s'],['Curl femoral',3,'10–12','60–90 s'],['Press hombros en máquina',2,'10–12','90 s'],['Curl bíceps',2,'10–15','60 s'],['Tríceps en polea',2,'10–15','60 s']]],
  ['Hipertrofia general',[['Sentadilla hack',3,'8–12','120 s'],['Press pecho en máquina',2,'10–12','90 s'],['Remo sentado',3,'10–12','90 s'],['Extensión de cuádriceps',2,'12–15','60–90 s'],['Peso muerto rumano con mancuernas',2,'10–12','90–120 s'],['Elevaciones laterales',2,'12–20','60 s'],['Gemelos',3,'12–15','60 s']]]],
  m:{6:[[2,'ss','curl bíceps','tríceps en polea'],[3,'ss','elevaciones laterales','gemelos']],7:[[3,'dropset','extensión de cuádriceps'],[2,'rest-pause','curl femoral']],10:[[2,'ss','curl bíceps','tríceps en polea'],[3,'ss','elevaciones laterales','gemelos']],11:[[3,'dropset','extensión de cuádriceps'],[3,'dropset','elevaciones laterales']]}},
 M4:{t:'Torso / Pierna',days:[
  ['Torso A',[['Press banca',3,'6–8','120–180 s'],['Remo con barra o máquina',3,'8–10','90–120 s'],['Press inclinado con mancuernas',2,'8–12','90 s'],['Jalón al pecho',3,'8–12','90–120 s'],['Elevaciones laterales',2,'12–15','60 s'],['Tríceps en polea',2,'10–12','60 s'],['Curl bíceps',2,'10–12','60 s']]],
  ['Pierna A',[['Sentadilla',3,'6–8','120–180 s'],['Prensa',2,'10–12','120 s'],['Peso muerto rumano',3,'8–10','120 s'],['Curl femoral',3,'10–12','60–90 s'],['Gemelos',3,'12–15','60 s'],['Abdominales',2,'12–15','60 s']]],
  ['Torso B',[['Press inclinado',3,'8–10','120 s'],['Dominadas asistidas o jalón',3,'8–12','90–120 s'],['Press hombros',2,'8–12','90 s'],['Remo sentado',3,'10–12','90 s'],['Aperturas en polea',2,'12–15','60 s'],['Elevaciones laterales',2,'15–20','60 s'],['Curl bíceps',2,'12–15','60 s'],['Tríceps cuerda',2,'12–15','60 s']]],
  ['Pierna B',[['Sentadilla hack',3,'8–12','120 s'],['Peso muerto rumano con mancuernas',2,'8–10','120 s'],['Extensión de cuádriceps',2,'12–15','60–90 s'],['Curl femoral sentado',3,'10–12','60–90 s'],['Hip thrust',2,'10–12','90 s'],['Gemelos',3,'12–15','60 s'],['Elevación de piernas',2,'12–15','60 s']]]],
  m:{6:[[1,'ss','curl bíceps','tríceps en polea'],[3,'ss','elevaciones laterales','aperturas en polea']],7:[[4,'dropset','extensión de cuádriceps'],[4,'rest-pause','curl femoral sentado']],10:[[1,'ss','curl bíceps','tríceps en polea'],[3,'ss','elevaciones laterales','aperturas en polea']],11:[[4,'dropset','extensión de cuádriceps'],[4,'dropset','gemelos']]}},
 M5:{t:'Push / Pull / Legs + Torso / Pierna',days:[
  ['Push',[['Press banca',3,'6–8','120–180 s'],['Press inclinado con mancuernas',2,'8–12','90 s'],['Press hombros',2,'8–10','90 s'],['Elevaciones laterales',3,'12–20','60 s'],['Aperturas en polea',2,'12–15','60 s'],['Tríceps en polea',2,'10–12','60 s']]],
  ['Pull',[['Jalón al pecho',3,'8–12','90 s'],['Remo con pecho apoyado',3,'8–10','90–120 s'],['Remo unilateral',2,'10–12','90 s'],['Pájaros en polea',2,'12–15','60 s'],['Curl con barra',3,'8–12','60–90 s'],['Curl martillo',2,'10–12','60 s']]],
  ['Piernas',[['Sentadilla',3,'6–10','120–180 s'],['Prensa',2,'10–12','120 s'],['Peso muerto rumano',3,'8–10','120 s'],['Curl femoral',3,'10–12','60–90 s'],['Extensión de cuádriceps',2,'12–15','60–90 s'],['Gemelos',3,'12–15','60 s']]],
  ['Torso complementario',[['Press inclinado en máquina',2,'10–12','90 s'],['Remo sentado',3,'10–12','90 s'],['Aperturas en polea',2,'12–15','60 s'],['Jalón neutro',2,'10–12','90 s'],['Elevaciones laterales',2,'15–20','60 s'],['Curl bíceps',2,'12–15','60 s'],['Tríceps cuerda',2,'12–15','60 s']]],
  ['Pierna / cadena posterior',[['Hip thrust',3,'8–12','90–120 s'],['Sentadilla hack',2,'10–12','120 s'],['Curl femoral sentado',3,'10–12','60–90 s'],['Extensión de cuádriceps',2,'12–15','60–90 s'],['Gemelos',3,'12–15','60 s'],['Abdominales',2,'12–15','60 s']]]],
  m:{6:[[1,'ss','elevaciones laterales','tríceps en polea'],[2,'ss','curl con barra','curl martillo']],7:[[1,'dropset','elevaciones laterales'],[2,'rest-pause','curl martillo']],10:[[4,'ss','curl bíceps','tríceps cuerda'],[5,'ss','gemelos','abdominales']],11:[[1,'dropset','aperturas en polea'],[2,'dropset','curl con barra'],[3,'rest-pause','curl femoral']]}},
 F3:{t:'Full Body con énfasis inferior',days:[
  ['Glúteos y cuádriceps',[['Hip thrust',3,'8–10','120 s'],['Sentadilla',3,'8–10','120–180 s'],['Prensa',2,'10–12','120 s'],['Extensión de cuádriceps',2,'12–15','60–90 s'],['Abductores',2,'15–20','60 s'],['Elevaciones laterales',2,'12–15','60 s']]],
  ['Tren superior y posterior',[['Jalón al pecho',3,'8–12','90 s'],['Press pecho con mancuernas',3,'8–12','90 s'],['Remo sentado',3,'10–12','90 s'],['Press hombros en máquina',2,'10–12','90 s'],['Curl femoral',3,'10–12','60–90 s'],['Patada glúteo en polea',2,'12–15','60 s'],['Curl bíceps',2,'12–15','60 s'],['Tríceps en polea',2,'12–15','60 s']]],
  ['Glúteos y cadena posterior',[['Peso muerto rumano',3,'8–10','120 s'],['Búlgara',2,'10–12','90–120 s'],['Curl femoral sentado',2,'10–12','60–90 s'],['Hip thrust',2,'10–12','90 s'],['Abductores',2,'15–20','60 s'],['Gemelos',3,'12–15','60 s'],['Plancha',2,'30–45 seg','60 s']]]],
  m:{6:[[2,'ss','curl bíceps','tríceps en polea'],[3,'ss','abductores','gemelos']],7:[[1,'dropset','abductores'],[2,'rest-pause','patada glúteo en polea']],10:[[2,'ss','curl bíceps','tríceps en polea'],[3,'ss','abductores','gemelos']],11:[[1,'dropset','extensión de cuádriceps'],[3,'rest-pause','abductores']]}},
 F4:{t:'Inferior / Superior',days:[
  ['Inferior A',[['Hip thrust',3,'8–10','120 s'],['Sentadilla',3,'8–10','120–180 s'],['Prensa',2,'10–12','120 s'],['Extensión de cuádriceps',2,'12–15','60–90 s'],['Abductores',2,'15–20','60 s'],['Gemelos',2,'12–15','60 s']]],
  ['Superior A',[['Jalón al pecho',3,'8–12','90 s'],['Press banca con mancuernas',3,'8–12','90 s'],['Remo sentado',3,'10–12','90 s'],['Elevaciones laterales',3,'12–15','60 s'],['Curl bíceps',2,'10–12','60 s'],['Tríceps en polea',2,'10–12','60 s'],['Crunch en polea',2,'12–15','60 s']]],
  ['Inferior B',[['Peso muerto rumano',3,'8–10','120 s'],['Búlgara',3,'10–12','90–120 s'],['Curl femoral sentado',3,'10–12','60–90 s'],['Patada glúteo en polea',2,'12–15','60 s'],['Abductores',2,'15–20','60 s'],['Gemelos',3,'12–15','60 s']]],
  ['Superior B',[['Remo con pecho apoyado',3,'8–12','90 s'],['Press inclinado',3,'10–12','90 s'],['Jalón neutro',2,'10–12','90 s'],['Press hombros',2,'10–12','90 s'],['Elevaciones laterales',2,'15–20','60 s'],['Curl martillo',2,'12–15','60 s'],['Tríceps cuerda',2,'12–15','60 s'],['Crunch en polea',2,'12–15','60 s']]]],
  m:{6:[[2,'ss','curl bíceps','tríceps en polea'],[4,'ss','elevaciones laterales','abdominales']],7:[[1,'dropset','abductores'],[3,'rest-pause','curl femoral sentado']],10:[[2,'ss','curl bíceps','tríceps en polea'],[4,'ss','elevaciones laterales','abdominales']],11:[[1,'dropset','extensión de cuádriceps'],[3,'dropset','patada glúteo en polea']]}},
 F5:{t:'Especialización inferior',days:[
  ['Glúteos',[['Hip thrust',3,'8–10','120 s'],['Peso muerto rumano',2,'8–10','120 s'],['Patada glúteo en polea',2,'12–15','60 s'],['Abductores',2,'15–20','60 s'],['Extensión lumbar enfocada en glúteos',2,'12–15','90 s']]],
  ['Superior A',[['Jalón al pecho',3,'8–12','90 s'],['Press pecho con mancuernas',3,'8–12','90 s'],['Remo sentado',3,'10–12','90 s'],['Elevaciones laterales',3,'12–15','60 s'],['Curl bíceps',2,'10–12','60 s'],['Tríceps en polea',2,'10–12','60 s']]],
  ['Piernas',[['Sentadilla',3,'8–10','120–180 s'],['Prensa',2,'10–12','120 s'],['Búlgara',2,'10–12','90 s'],['Extensión de cuádriceps',2,'12–15','60–90 s'],['Curl femoral',3,'10–12','60–90 s'],['Gemelos',3,'12–15','60 s']]],
  ['Superior B',[['Remo con pecho apoyado',3,'8–12','90 s'],['Press inclinado',3,'10–12','90 s'],['Jalón neutro',2,'10–12','90 s'],['Press hombros',2,'10–12','90 s'],['Elevaciones laterales',2,'15–20','60 s'],['Curl martillo',2,'12–15','60 s'],['Tríceps cuerda',2,'12–15','60 s']]],
  ['Glúteos y posterior',[['Hip thrust',2,'10–12','90–120 s'],['Curl femoral sentado',3,'10–12','60–90 s'],['Patada glúteo en polea',2,'12–15','60 s'],['Abductores',2,'15–20','60 s'],['Gemelos',2,'12–15','60 s'],['Plancha',2,'30–45 seg','60 s']]]],
  m:{6:[[2,'ss','curl bíceps','tríceps en polea'],[4,'ss','elevaciones laterales','curl martillo']],7:[[1,'dropset','abductores'],[5,'rest-pause','patada glúteo en polea']],10:[[2,'ss','curl bíceps','tríceps en polea'],[4,'ss','elevaciones laterales','curl martillo']],11:[[1,'dropset','patada glúteo en polea'],[3,'dropset','extensión de cuádriceps'],[5,'rest-pause','abductores']]}}
};

export const W={
 1:{n:'Adaptación',k:'prog',rir:'3–4',i:['Aprendé los movimientos y elegí cargas cómodas.','Anotá peso y repeticiones: son tu punto de partida.','Nada de técnicas intensivas ni llegar al fallo.']},
 2:{n:'Más repeticiones',k:'prog',rir:'2–3',i:['Mismo peso que la semana 1: intentá sumar repeticiones dentro del rango.','Si todavía no llegaste al máximo del rango, no subas el peso.']},
 3:{n:'Sobrecarga',k:'prog',rir:'1–2',i:['Si hiciste el máximo de repeticiones en todas las series, subí un poco el peso.','Sin fallo en sentadillas, pesos muertos ni presses.']},
 4:{n:'Descarga',k:'dl',rir:'4–5',i:['Hacés menos series (casi la mitad) para recuperarte.','Peso cómodo. Cuidá la técnica.']},
 5:{n:'Reinicio',k:'prog',rir:'3',i:['Volvés a las series completas.','Usá los pesos de la semana 3 como referencia.']},
 6:{n:'Superseries',k:'int',rir:'2',i:['Seguí progresando en peso o repeticiones.','Aparecen las primeras superseries: dos ejercicios seguidos sin descanso.'],ev:'intermedia'},
 7:{n:'Intensificación',k:'int',rir:'1–2',i:['Dropset o rest-pause solo en los ejercicios marcados, en la última serie.','Nunca en sentadillas, pesos muertos ni presses pesados.']},
 8:{n:'Descarga',k:'dl',rir:'4–5',i:['Menos series para bajar la fatiga.','Sin técnicas intensivas, sin buscar récords.']},
 9:{n:'Especialización',k:'prog',rir:'2',i:['El plan pone el foco en tu grupo prioritario.']},
 10:{n:'Sobrecarga específica',k:'int',rir:'1–2',i:['Progresá en peso o repeticiones.','Superseries opcionales en los ejercicios marcados.']},
 11:{n:'Máxima exigencia',k:'int',rir:'1–2',i:['La semana más exigente, sin perder técnica.','En ejercicios aislados podés llegar a 0–1 RIR.','Dropset o rest-pause solo donde está marcado.']},
 12:{n:'Evaluación',k:'ev',rir:'3–4',i:['Menos series, sin técnicas intensivas.','Compará tus pesos con la semana 1 y cargá tus medidas.'],ev:'final'}
};

export const GOALS = { recomp: 'Recomposición corporal', dev: 'Desarrollo muscular' };
export const LEVELS = { beg: 'Principiante', inter: 'Intermedio' };
export const GN = { gluteos: 'Glúteos', pecho: 'Pecho', espalda: 'Espalda', hombros: 'Hombros', brazos: 'Brazos', piernas: 'Piernas' };
const GROUPS = { gluteos: /hip thrust|patada|abductor|extension lumbar/, pecho: /press banca|press inclinado|press pecho|apertura/, espalda: /remo|jalon|dominada/, hombros: /press hombro|elevaciones laterales|pajaro/, brazos: /curl biceps|curl con barra|martillo|triceps/, piernas: /sentadilla|prensa|femoral|cuadriceps|gemelo/ };
const CARDIO = { 3: '2 sesiones de 20–30 min', 4: '2 sesiones de 20–30 min', 5: '2–3 sesiones de 20–30 min' };

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\bde\b|\bdel\b/g, ' ').replace(/\s+/g, ' ').trim();
function findEx(list, t) {
  const n = norm(t);
  let i = list.findIndex((e) => norm(e[0]) === n);
  if (i < 0 && n === 'abdominales') i = list.findIndex((e) => /crunch|abdominal/.test(norm(e[0])));
  if (i < 0) i = list.findIndex((e) => norm(e[0]).startsWith(n));
  return i;
}

// Revisa la elección que manda la persona. Devuelve la elección limpia o null.
export function cleanConfig(c) {
  if (!c || typeof c !== 'object') return null;
  const sex = c.sex === 'M' ? 'M' : c.sex === 'F' ? 'F' : null;
  const days = [3, 4, 5].includes(+c.days) ? +c.days : null;
  const goal = GOALS[c.goal] ? c.goal : null;
  const level = LEVELS[c.level] ? c.level : null;
  const start = /^\d{4}-\d{2}-\d{2}$/.test(c.start || '') ? c.start : null;
  if (!sex || !days || !goal || !level || !start) return null;
  const prio = sex === 'F' ? 'gluteos' : GN[c.prio] && c.prio !== 'gluteos' ? c.prio : 'pecho';
  return { sex, days, goal, level, prio, start };
}

const METH = {
  dropset: 'Dropset en la última serie: terminá la serie, bajá el peso 20–30% y seguí hasta quedar cerca del fallo. Una sola bajada.',
  'rest-pause': 'Rest-pause en la última serie: llegá cerca del fallo, descansá 15–20 s y hacé unas repeticiones más. Una sola pausa.',
};

function buildDay(c, week, di) {
  const p = P[c.sex + c.days], [name, list] = p.days[di], wk = W[week], beg = c.level === 'beg';
  let prioUsed = false;
  const ex = list.map(([n, s, reps, rest]) => {
    let sets = s; const extra = [];
    if (beg) { sets = 2; if (s !== 3) extra.push('Podés hacer 1 o 2 series.'); }
    if (wk.k === 'dl') sets = Math.max(1, Math.round(sets * 0.55));
    if (week === 12) sets = Math.max(1, Math.round(sets * 0.65));
    if (week >= 9 && week <= 11 && c.goal === 'dev' && !beg && !prioUsed && GROUPS[c.prio].test(norm(n))) {
      sets += 1; prioUsed = true; extra.push(`+1 serie porque tu prioridad es ${GN[c.prio].toLowerCase()}.`);
    }
    return { n, sets, reps, rest, extra, meth: null };
  });
  (p.m[week] || []).forEach(([d, type, a, b]) => {
    if (d !== di + 1 || beg) return;
    const ia = findEx(list, a);
    if (ia < 0) return;
    if (type === 'ss') {
      const ib = findEx(list, b);
      if (ib < 0) return;
      ex[ia].meth = `Superserie con ${ex[ib].n}: hacé este y ${ex[ib].n.toLowerCase()} seguidos, sin descanso. Descansá al terminar los dos.`;
      ex[ib].meth = `Superserie con ${ex[ia].n}: va pegado al otro ejercicio, sin descanso entre los dos.`;
    } else ex[ia].meth = METH[type];
  });
  return {
    name,
    exercises: ex.map((e) => ({
      name: e.n, sets: e.sets, reps: e.reps, weight: '',
      notes: [e.meth, ...e.extra, `Descanso: ${e.rest}.`].filter(Boolean).join(' '),
    })),
  };
}

// Plan de 12 semanas. `keep` (plan anterior) permite conservar los registros si se cambia nivel u objetivo.
export function buildPlan(c, uid, keep) {
  const beg = c.level === 'beg';
  return Array.from({ length: 12 }, (_, i) => {
    const week = i + 1, wk = W[week];
    const rir = beg && wk.k !== 'dl' ? '3–4' : wk.rir;
    const tips = [...wk.i];
    if (week === 9) tips.push(c.goal === 'dev' && !beg ? `Tu prioridad es ${GN[c.prio].toLowerCase()}: sumás 1 serie en un ejercicio de ese grupo.` : 'Mantenés el volumen de siempre (no se suman series).');
    if (beg && wk.k === 'int') tips.push('Como sos principiante, hacés la versión tradicional: sin superseries, dropsets ni rest-pause.');
    if (wk.ev) tips.push(`Evaluación ${wk.ev}: cargá tu peso y medidas en “Medidas”.`);
    const days = P[c.sex + c.days].days.map((_, di) => {
      const d = buildDay(c, week, di);
      const old = keep?.[i]?.days?.[di]?.exercises || [];
      d.exercises.forEach((e, k) => { e.id = old[k] && old[k].name === e.name ? old[k].id : uid(); });
      return d;
    });
    const w = { week, phase: wk.n, kind: wk.k, rir, tips, days };
    if (week === 4) w.from = 1;
    if (week === 5) w.from = 3;
    if (week === 8) w.from = 5;
    return w;
  });
}

export function planLabel(c) {
  return `${c.sex === 'F' ? 'Femenino' : 'Masculino'} · ${c.days} días · ${GOALS[c.goal]} · ${LEVELS[c.level]}`;
}
export function cardioText(c) {
  return `Cardio: ${CARDIO[c.days]} por semana de caminata rápida, bici o elíptico, a ritmo moderado. ` +
    (c.goal === 'recomp' ? 'Para recomposición, lo importante es la constancia.' : 'Hacelo lejos de las sesiones de piernas para no afectar la recuperación.');
}
