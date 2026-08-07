-- Semilla: 24 recursos de ejemplo del prototipo de diseño.
-- Correr después de schema.sql. Ninguno trae storage_path — el admin
-- debe subir el archivo real desde /admin/recursos para reemplazar
-- el placeholder de "archivo pendiente de carga".

insert into public.resources (titulo, descripcion, tipo, tema, nivel, autor, meta) values
('Present Perfect vs. Simple Past', 'Cuándo usar cada tiempo verbal, con ejemplos de la vida diaria.', 'guia', 'Gramática', 'Básico', 'Prof. Marta Díaz', '6 páginas'),
('50 verbos frasales para el día a día', 'Phrasal verbs esenciales agrupados por situación: casa, trabajo, calle.', 'vocab', 'Vocabulario', 'Intermedio', 'Prof. Marta Díaz', '4 páginas'),
('Pronunciación: los sonidos TH y R', 'Nota de voz con ejercicios de repetición para los sonidos más difíciles del español a inglés.', 'audio', 'Pronunciación', 'Básico', 'Prof. Iván Rojas', '8 min de audio'),
('Roleplay: entrevista de trabajo en inglés', 'Simulación completa de una entrevista, con frases clave para destacar tu experiencia.', 'video', 'Conversación', 'Avanzado', 'Prof. Iván Rojas', '12 min de video'),
('Vocabulario de viajes: aeropuerto y hotel', 'Palabras y frases listas para usar antes de tu próximo viaje.', 'vocab', 'Viajes', 'Básico', 'Prof. Marta Díaz', '3 páginas'),
('Cómo escribir emails formales en inglés', 'Estructura, saludos y cierres apropiados para contextos laborales.', 'guia', 'Business English', 'Intermedio', 'Prof. Camila Vega', '5 páginas'),
('Condicionales: tipo 1 y tipo 2', 'Explicación paso a paso con ejercicios resueltos.', 'cartilla', 'Gramática', 'Intermedio', 'Prof. Camila Vega', '7 páginas'),
('Ejercicios: artículos A, AN, THE', 'Práctica guiada con soluciones al final del documento.', 'ejercicio', 'Gramática', 'Básico', 'Prof. Marta Díaz', '20 ejercicios'),
('Small talk: cómo iniciar una conversación', 'Frases naturales para romper el hielo en inglés, sin sonar forzado.', 'video', 'Conversación', 'Básico', 'Prof. Iván Rojas', '9 min de video'),
('Vocabulario de negocios: reuniones', 'Términos clave para liderar y participar en reuniones en inglés.', 'vocab', 'Business English', 'Avanzado', 'Prof. Camila Vega', '4 páginas'),
('Nota de voz: entonación en preguntas', 'Cómo subir y bajar el tono para sonar más natural al preguntar.', 'audio', 'Pronunciación', 'Intermedio', 'Prof. Iván Rojas', '6 min de audio'),
('Modal verbs: can, could, should, must', 'Diferencias de uso con ejemplos contrastados.', 'guia', 'Gramática', 'Intermedio', 'Prof. Marta Díaz', '6 páginas'),
('Ejercicios: preposiciones de tiempo y lugar', 'IN, ON, AT y más, con casos de uso comunes.', 'ejercicio', 'Gramática', 'Básico', 'Prof. Camila Vega', '18 ejercicios'),
('Vocabulario de comida y restaurantes', 'Para pedir, describir sabores y entender un menú en inglés.', 'vocab', 'Viajes', 'Básico', 'Prof. Marta Díaz', '3 páginas'),
('Debate: pros y contras del trabajo remoto', 'Práctica de argumentación y vocabulario de opinión.', 'video', 'Conversación', 'Avanzado', 'Prof. Iván Rojas', '15 min de video'),
('Presentaciones efectivas en inglés', 'Estructura y frases de transición para presentar con seguridad.', 'guia', 'Business English', 'Intermedio', 'Prof. Camila Vega', '8 páginas'),
('Nota de voz: ritmo y conexión de palabras', 'Cómo enlazar palabras para sonar más fluido.', 'audio', 'Pronunciación', 'Avanzado', 'Prof. Iván Rojas', '7 min de audio'),
('Vocabulario esencial de la oficina', 'Palabras que usarás todos los días en un entorno laboral.', 'vocab', 'Business English', 'Básico', 'Prof. Marta Díaz', '3 páginas'),
('Ejercicios: Present Continuous', 'Práctica de formación y uso del tiempo presente continuo.', 'ejercicio', 'Gramática', 'Básico', 'Prof. Camila Vega', '16 ejercicios'),
('Cartilla: pasado simple, verbos irregulares', 'Lista de verbos irregulares más usados, con ejemplos.', 'cartilla', 'Gramática', 'Básico', 'Prof. Marta Díaz', '10 páginas'),
('Cómo dar y pedir direcciones', 'Frases útiles para moverte en una ciudad de habla inglesa.', 'video', 'Viajes', 'Intermedio', 'Prof. Iván Rojas', '7 min de video'),
('Negociación: cerrar un acuerdo en inglés', 'Frases clave para negociar términos y condiciones.', 'guia', 'Business English', 'Avanzado', 'Prof. Camila Vega', '6 páginas'),
('Vocabulario de emociones y sentimientos', 'Para expresarte con más matiz en conversaciones cotidianas.', 'vocab', 'Conversación', 'Intermedio', 'Prof. Marta Díaz', '4 páginas'),
('Ejercicios: comparativos y superlativos', 'Práctica de formas cortas y largas, con excepciones comunes.', 'ejercicio', 'Gramática', 'Intermedio', 'Prof. Camila Vega', '14 ejercicios');
