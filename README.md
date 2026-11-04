# 12 Semanas · app de rutinas

App para un entrenador personal y sus alumnos. Negro y amarillo, instalable en el celular.

- **Profe:** alumnos, planificación de 12 semanas, plantillas, avisos, pagos y vencimientos, progreso, medidas, respuestas a comentarios, **mentalidad** (videos de YouTube y textos para todos), **alimentación** (plan de comidas de cada alumno) y **premios** (desafíos que se ganan solos, ej. 3 semanas seguidas entrenando 5 días → asesoría 1:1).
- **Alumno (solo lectura de la rutina):** marca series, anota el peso, escribe al profe, marca el esfuerzo (RPE), carga medidas y fotos, ve su progreso y récords (medalla al completar la última serie con peso récord), recibe recordatorios, ve su plan de alimentación, el contenido de mentalidad y cuánto le falta para cada premio.

Todo corre en **Netlify**: la página, las funciones (`/api/*`), los datos (Netlify Blobs), el login (email + contraseña o código) y las notificaciones (web push con una función programada cada 10 minutos). No hace falta ninguna otra cuenta ni configurar variables: las claves internas se generan solas la primera vez.

## Publicar en Netlify

1. Entrá a [app.netlify.com](https://app.netlify.com) → **Add new project** → **Import an existing project** → **GitHub** → elegí `appgymdami`.
2. No cambies nada de la configuración (ya viene en `netlify.toml`) y tocá **Deploy**.
3. Cuando termine, abrí la dirección que te da Netlify y creá la **cuenta del profe** (la primera cuenta que se crea es la del profe).
4. Desde el panel, **Nuevo alumno** → la app te da un código para mandarle por WhatsApp. El alumno entra con su email y ese código.

En iPhone, los avisos solo llegan si la app está agregada a la pantalla de inicio (Compartir → Agregar a inicio). En Android funcionan también desde Chrome.

## Estructura

```
public/                 la app (index.html), service worker, manifiesto, íconos y fotos de ejercicios
netlify/functions/api.mjs        API: login, datos, cambios, fotos, suscripciones push
netlify/functions/reminders.mjs  función programada: recordatorios de entrenamiento
netlify/lib/            almacenamiento, sesión, permisos y envío de notificaciones
test/                   servidor local y prueba de punta a punta
```

Cada cambio en la app se manda al servidor como una lista de cambios chiquitos (no el documento entero), así el profe y el alumno pueden usarla a la vez sin pisarse. El servidor controla que el alumno solo pueda tocar sus registros (series, pesos, comentarios, esfuerzo, medidas, recordatorio) y nunca la planificación.

## Probar en la compu

```
npm install
node test/server.mjs          # abre en http://localhost:8888
NODE_PATH=$(npm root -g) node test/e2e.mjs   # prueba completa con Playwright
```
