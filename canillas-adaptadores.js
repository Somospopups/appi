/* ============================================================
   APPI · Canillas & Adaptadores PSA
   - Botones cuadrados superiores estilo iPhone
   - Sin botón redundante de cambiar foto
   - Botón directo "Compartir por WhatsApp" que envía el cuadro completo
   - Deslizamiento swipe y tap para pasar carta
   ============================================================ */
(function () {
  "use strict";

  var DECK = [{"id": "fv-alabama", "name": "FV Alabama", "brand": "FV", "code": "411.04/27", "adapter_id": "PSA 102", "adapter_name": "Adapt. Rosca macho FV diam. 18,6", "thread": "Rosca macho 18,6 mm", "tip": "Rosca macho exterior estándar FV de 18.6mm", "page": 3, "page_img": "./adapters/page_3.jpg", "dhash": "1100110001110000100100011100100010010010011011101101100010110010", "spout": "Curvo alto", "category": "Cocina"}, {"id": "fv-allegro", "name": "FV Allegro", "brand": "FV", "code": "0434.01/15-B-CR", "adapter_id": "PSA 149 / PSA 018", "adapter_name": "Adapt. Lavarropas Diam 24 x 1 / Adapt. Rosca Canilla Tipo Patio", "thread": "Rosca lavarropas / patio 24x1", "tip": "Dispone de opción para adaptar a rosca de patio o salida de lavarropas 24x1.", "page": 4, "page_img": "./adapters/page_4.jpg", "dhash": "1100110001110000100100011100000011100100011000001110000011110001", "spout": "Lavadero / Lavarropas", "category": "Lavadero"}, {"id": "fv-areco", "name": "FV Areco", "brand": "FV", "code": "424/99", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix estándar", "tip": "Compatible directo con Adaptador Unimix PSA 002.", "page": 5, "page_img": "./adapters/page_5.jpg", "dhash": "1100110001110000100100011100000010001000100101001001000011010010", "spout": "Curvo tradicional", "category": "Cocina"}, {"id": "fv-arizona", "name": "FV Arizona", "brand": "FV", "code": "406/B1", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix estándar", "tip": "Una de las canillas más comunes de Argentina. Rosca clásica Unimix.", "page": 6, "page_img": "./adapters/page_6.jpg", "dhash": "1100110001110000100100011100000010001000111000001110010011111100", "spout": "Curvo clásico de pared/mesada", "category": "Cocina"}, {"id": "fv-chess", "name": "FV Chess", "brand": "FV", "code": "418/84", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix estándar", "tip": "Lleva el adaptador estándar FV Unimix PSA 002.", "page": 7, "page_img": "./adapters/page_7.jpg", "dhash": "1100110001110000100100011100000011000000001111100111001011110000", "spout": "Curvo alto estilizado", "category": "Cocina"}, {"id": "fv-cibeles", "name": "FV Cibeles", "brand": "FV", "code": "0411/97", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "thread": "Pico sin rosca accesible / Adaptador Múltiple a presión", "tip": "Requiere Adaptador Múltiple PSA 073 colocado a presión en la salida del pico.", "page": 8, "page_img": "./adapters/page_8.jpg", "dhash": "1100110001110000100100011100000011100000100000001000111010011100", "spout": "Curvo pico ancho", "category": "Cocina"}, {"id": "fv-c7-radal", "name": "FV C7 Radal", "brand": "FV", "code": "0410/C7", "adapter_id": "PSA 039", "adapter_name": "Adapt. Rosca Hembra Diametro 22", "thread": "Rosca hembra 22 mm", "tip": "Lleva rosca hembra de 22mm.", "page": 9, "page_img": "./adapters/page_9.jpg", "dhash": "1100110001110000100100011100100011011001001101000110010001001100", "spout": "Curvo tradicional", "category": "Cocina"}, {"id": "fv-d7-alerce", "name": "FV D7 Alerce", "brand": "FV", "code": "428/D7", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "ATENCIÓN: Retirar el aireador que se encuentra dentro del casquillo cromado para colocar el adaptador PSA 144.", "page": 10, "page_img": "./adapters/page_10.jpg", "dhash": "1100110001110000100100011100100011100000010100101101100011011010", "spout": "Curvo moderno", "category": "Cocina"}, {"id": "fv-denisse", "name": "FV Denisse", "brand": "FV", "code": "0416/64", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Compatible directo con PSA 002.", "page": 11, "page_img": "./adapters/page_11.jpg", "dhash": "1100110001110000100100011100000011001100000100001011000010100000", "spout": "Curvo bajo", "category": "Cocina"}, {"id": "fv-eclipse", "name": "FV Eclipse", "brand": "FV", "code": "411.01/94 / 423/94", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Aplica para modelos 411.01/94 y 423/94 con adaptador PSA 002.", "page": 12, "page_img": "./adapters/page_12.jpg", "dhash": "1100110001110000100100011100000011000000110110000011000011100100", "spout": "Curvo monocomando mesada/pared", "category": "Cocina"}, {"id": "fv-epuyen", "name": "FV Epuyen (Negra / Cromada)", "brand": "FV", "code": "411.04/L2", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "thread": "Pico estilizado / Adapt. Múltiple", "tip": "Disponible en acabado negro mate y cromo. Utiliza el Adaptador Múltiple PSA 073.", "page": 13, "page_img": "./adapters/page_13.jpg", "dhash": "1100110001110000100100101100100011000000110010001100000010000000", "spout": "Curvo alto estilizado contemporáneo", "category": "Cocina de diseño"}, {"id": "fv-flow", "name": "FV Flow", "brand": "FV", "code": "411/01/B3", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Compatible directo con adaptador PSA 002.", "page": 14, "page_img": "./adapters/page_14.jpg", "dhash": "1100110001110000100100011100000011000110001011000110100111010010", "spout": "Curvo suave", "category": "Cocina"}, {"id": "fv-gran-gala", "name": "FV Gran Gala", "brand": "FV", "code": "418/72", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Lleva PSA 002 FV Unimix.", "page": 15, "page_img": "./adapters/page_15.jpg", "dhash": "1100110001110000100100011100100111011100001101001110000010010000", "spout": "Curvo tradicional alto", "category": "Cocina"}, {"id": "fv-kansas", "name": "FV Kansas", "brand": "FV", "code": "411.04/24", "adapter_id": "PSA 102", "adapter_name": "Adapt. Rosca macho FV diam. 18,6", "thread": "Rosca macho 18,6 mm", "tip": "Utiliza rosca macho FV 18.6mm (PSA 102).", "page": 16, "page_img": "./adapters/page_16.jpg", "dhash": "1100110001110000100100101100000011000110000011000110100011010010", "spout": "Curvo cuello de cisne", "category": "Cocina"}, {"id": "fv-libby-411", "name": "FV Libby Mesada", "brand": "FV", "code": "411.04/39", "adapter_id": "PSA 135", "adapter_name": "Adapt. Rosca Macho Diam 21 x 1", "thread": "Rosca macho 21 x 1", "tip": "Modelo Libby monocomando mesada 411.04/39 lleva adaptador PSA 135 (21x1).", "page": 17, "page_img": "./adapters/page_17.jpg", "dhash": "1100110001110000100100011100000011000000110110011101100011010000", "spout": "Curvo alto monocomando", "category": "Cocina"}, {"id": "fv-libby-0426", "name": "FV Libby Pico Recto / Diagonal", "brand": "FV", "code": "0426/39", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "ATENCIÓN: Retirar el aireador que se encuentra dentro del casquillo cromado para colocar el adaptador PSA 142 (16,3 x 1).", "page": 18, "page_img": "./adapters/page_18.jpg", "dhash": "1100110001110000100100011100000010110010011010000100100001001010", "spout": "Recto / Diagonal monocomando", "category": "Cocina / Lavatorio"}, {"id": "fv-libby-0428", "name": "FV Libby Alta", "brand": "FV", "code": "0428/39", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "ATENCIÓN: Retirar el aireador que se encuentra dentro del casquillo cromado para colocar el adaptador PSA 144 (18,2 x 1).", "page": 19, "page_img": "./adapters/page_19.jpg", "dhash": "1100110001110000100100011100000011100100110100001101100011011010", "spout": "Curvo alto monocomando", "category": "Cocina"}, {"id": "fv-libby-pared", "name": "FV Libby de Pared", "brand": "FV", "code": "406.03/39-CR / 0406/39", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Versión Libby para pared: lleva PSA 002.", "page": 20, "page_img": "./adapters/page_20.jpg", "dhash": "1100110001110000100100011100000011000000110001100000110010110100", "spout": "Pared monocomando / 2 llaves", "category": "Cocina pared"}, {"id": "fv-melody", "name": "FV Melody", "brand": "FV", "code": "0203/28", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador dentro del casquillo cromado. Lleva PSA 142.", "page": 21, "page_img": "./adapters/page_21.jpg", "dhash": "1100110001110000100100011100000011001000001011001001000011001100", "spout": "Bajo angular", "category": "Cocina / Baño"}, {"id": "fv-nerea-lever", "name": "FV Nerea Lever", "brand": "FV", "code": "0426/59L", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 142.", "page": 22, "page_img": "./adapters/page_22.jpg", "dhash": "1100110001110000100100011100100011100100010100100101100001000000", "spout": "Inclinado moderno", "category": "Cocina"}, {"id": "fv-newport", "name": "FV Newport", "brand": "FV", "code": "0411.01/B2", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Lleva el clásico PSA 002.", "page": 23, "page_img": "./adapters/page_23.jpg", "dhash": "1100110001110000100100011100100111010100001011001101100011010100", "spout": "Curvo tradicional", "category": "Cocina"}, {"id": "fv-oregon", "name": "FV Oregon", "brand": "FV", "code": "0428/18", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador dentro del casquillo cromado. Lleva PSA 144 (18,2 x 1).", "page": 24, "page_img": "./adapters/page_24.jpg", "dhash": "1100110001110000100100011100100010100100010100101101100011011010", "spout": "Curvo estilizado", "category": "Cocina"}, {"id": "fv-puelo-411", "name": "FV Puelo Monocomando Alto", "brand": "FV", "code": "411.04/B5", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador dentro del casquillo cromado. Lleva adaptador PSA 144.", "page": 25, "page_img": "./adapters/page_25.jpg", "dhash": "1100110001110000100100011100000011100000110100001001001010010000", "spout": "Curvo cisne alto contemporáneo", "category": "Cocina"}, {"id": "fv-puelo-423", "name": "FV Puelo Monocomando Bajo", "brand": "FV", "code": "423/B5", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Versión 423/B5 lleva PSA 002 directo.", "page": 26, "page_img": "./adapters/page_26.jpg", "dhash": "1100110001110000100100101100000011001100000100001010000001101000", "spout": "Curvo bajo", "category": "Cocina"}, {"id": "fv-swing", "name": "FV Swing", "brand": "FV", "code": "411.01/90", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Compatible con PSA 002.", "page": 27, "page_img": "./adapters/page_27.jpg", "dhash": "1100110001110000100100111100000011000110000111000011100011010010", "spout": "Curvo estándar", "category": "Cocina"}, {"id": "fv-swing-duo", "name": "FV Swing Duo", "brand": "FV", "code": "411.03/94", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Lleva PSA 002 Unimix.", "page": 28, "page_img": "./adapters/page_28.jpg", "dhash": "1100110001110000100100011100100111000110001111001101000011010110", "spout": "Curvo doble palanca", "category": "Cocina"}, {"id": "fv-swing-plus-multiple", "name": "FV Swing Plus (Instalación Múltiple)", "brand": "FV", "code": "412.01/90 / 0412.01/90CR", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "thread": "Extremo manguera extensible", "tip": "Instalación 1: En el aireador al extremo de la manguera extensible usando Adaptador Múltiple PSA 073.", "page": 29, "page_img": "./adapters/page_29.jpg", "dhash": "1100110001110000100100011100100011101010011001101001100010011000", "spout": "Pico extensible / manguera", "category": "Cocina extensible"}, {"id": "fv-swing-plus-rosca", "name": "FV Swing Plus (Instalación Roscada)", "brand": "FV", "code": "412.01/90 / 0412.01/90CR", "adapter_id": "PSA 037 / PSA 148", "adapter_name": "Adapt. Rosca Macho / Hembra Swing Plus", "thread": "Rosca específica Swing Plus", "tip": "Instalación 2: Conexión mediante juego de adaptadores PSA 037 y PSA 148 para rosca interna/externa del rociador extensible.", "page": 30, "page_img": "./adapters/page_30.jpg", "dhash": "1100110001110000100100011100100011101010011001101001100010011000", "spout": "Pico extensible / manguera", "category": "Cocina extensible"}, {"id": "fv-temple-multiple", "name": "FV Temple Extensible (Instalación Múltiple)", "brand": "FV", "code": "0412/87", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "thread": "Extremo manguera extensible", "tip": "Instalación 1: Extremo de la manguera extensible con Adaptador Múltiple PSA 073.", "page": 33, "page_img": "./adapters/page_33.jpg", "dhash": "1100110001110000100100101100100011000110001111100110001011000000", "spout": "Pico extraíble monocomando", "category": "Cocina extensible"}, {"id": "fv-temple-rosca", "name": "FV Temple Extensible (Instalación Roscada)", "brand": "FV", "code": "0412/87", "adapter_id": "PSA 037 / PSA 148", "adapter_name": "Adapt. Rosca Macho / Hembra FV Swing Plus / Temple", "thread": "Rosca específica rociador extensible", "tip": "Instalación 2: Roscado con PSA 037 y PSA 148.", "page": 34, "page_img": "./adapters/page_34.jpg", "dhash": "1100110001110000100100011100000010011000011010001000101010011010", "spout": "Pico extraíble monocomando", "category": "Cocina extensible"}, {"id": "fv-temple-fijo", "name": "FV Temple Monocomando Fijo", "brand": "FV", "code": "0411/87 / 0411.02/87", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "thread": "Pico plano / Adapt. Múltiple", "tip": "Lleva Adaptador Múltiple PSA 073.", "page": 35, "page_img": "./adapters/page_35.jpg", "dhash": "1100110001110000100100011100100011000000110010001011000010000000", "spout": "Curvo monocomando diseño minimalista", "category": "Cocina de diseño"}, {"id": "fv-tronic", "name": "FV Tronic (Electrónica)", "brand": "FV", "code": "0363.05P", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador dentro del casquillo cromado. Lleva PSA 142.", "page": 36, "page_img": "./adapters/page_36.jpg", "dhash": "1100110001110000100100011100100011100100010100101101101011011010", "spout": "Sensor electrónico automático", "category": "Electrónica / Comercial"}, {"id": "fv-unimix-dos", "name": "FV Unimix Dos", "brand": "FV", "code": "411/91", "adapter_id": "PSA 002 (o PSA 073)", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Lleva Adaptador PSA 002. También es posible colocar el Adaptador Múltiple PSA 073.", "page": 37, "page_img": "./adapters/page_37.jpg", "dhash": "1100110001110000100100011100100011100000110000001101110011000000", "spout": "Curvo tradicional", "category": "Cocina"}, {"id": "canilla-duke", "name": "Duke Canilla Plástica Blanca", "brand": "Duke / Otras", "code": "Plástica Blanca", "adapter_id": "PSA 100", "adapter_name": "Adapt. Rosca Hembra BPS 1/2", "thread": "Rosca plástica BPS 1/2 pulgada", "tip": "Canilla de plástico blanca común de mesada o pileta de lavar. Lleva PSA 100 (BPS 1/2).", "page": 38, "page_img": "./adapters/page_38.jpg", "dhash": "1100110001101000001100010111000011000100111100100011000001101100", "spout": "Pared plástica blanca", "category": "Económica / Lavadero"}, {"id": "discovery-curve", "name": "Discovery Curve Monocomando", "brand": "Discovery", "code": "905", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 144.", "page": 39, "page_img": "./adapters/page_39.jpg", "dhash": "1100110001101000100000011110010011100100011000001101001010011010", "spout": "Curvo cuello alto", "category": "Cocina"}, {"id": "discovery-recto", "name": "Discovery Recto Monocomando", "brand": "Discovery", "code": "910", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 144.", "page": 40, "page_img": "./adapters/page_40.jpg", "dhash": "1100110001101000100000011110010010000100011100001001000010001010", "spout": "Recto inclinado", "category": "Cocina"}, {"id": "jockey-curve", "name": "Jockey Curve Monocomando", "brand": "Jockey", "code": "6380", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 144.", "page": 41, "page_img": "./adapters/page_41.jpg", "dhash": "1100110001101000100000011110010011100100110100001001000010010010", "spout": "Curvo elegante", "category": "Cocina"}, {"id": "jockey-recto", "name": "Jockey Recto Monocomando", "brand": "Jockey", "code": "6370", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 144.", "page": 42, "page_img": "./adapters/page_42.jpg", "dhash": "1100110001101000100000011110010010000100011100101101000010001010", "spout": "Recto inclinado", "category": "Cocina"}, {"id": "unicontrol-innovation", "name": "Unicontrol Innovation", "brand": "Unicontrol", "code": "4001 / 4015 / 4070 / 4075", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 142.", "page": 43, "page_img": "./adapters/page_43.jpg", "dhash": "1100110001101000100000011110000011100100010100001101001011010010", "spout": "Curvo monocomando", "category": "Cocina"}, {"id": "unicontrol-one", "name": "Unicontrol One", "brand": "Unicontrol", "code": "3001 / 3015 / 3070", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 142.", "page": 44, "page_img": "./adapters/page_44.jpg", "dhash": "1100110001101000100000011110000011000100110000001100000011011000", "spout": "Curvo monocomando", "category": "Cocina"}, {"id": "piazza-dot", "name": "Piazza Dot", "brand": "Piazza", "code": "10112", "adapter_id": "PSA 002 (o PSA 073)", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca macho estándar / múltiple", "tip": "Lleva PSA 002. También es posible en esta canilla colocar el Adaptador Múltiple PSA 073.", "page": 45, "page_img": "./adapters/page_45.jpg", "dhash": "1100110001101000100100011100000010001000100000101001100011010100", "spout": "Curvo estilizado Piazza", "category": "Cocina"}, {"id": "piazza-emblem-10014", "name": "Piazza Emblem 10014", "brand": "Piazza", "code": "10014", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "Modelo Emblem 10014 lleva PSA 142 (16,3 x 1).", "page": 46, "page_img": "./adapters/page_46.jpg", "dhash": "1100110001101000100100011010100011000000111010001010010010110100", "spout": "Curvo minimalista", "category": "Cocina"}, {"id": "piazza-emblem-10016ne", "name": "Piazza Emblem 10016NE (Negra)", "brand": "Piazza", "code": "10016NE", "adapter_id": "PSA 039", "adapter_name": "Adapt. Rosca Hembra Diametro 22", "thread": "Rosca hembra 22 mm", "tip": "Modelo Emblem negro mate 10016NE: lleva PSA 039 (rosca hembra diam. 22).", "page": 47, "page_img": "./adapters/page_47.jpg", "dhash": "1100110001101000100100011100100010110010011010000100110111010100", "spout": "Curvo alto acabado negro mate", "category": "Cocina de diseño"}, {"id": "fox-40028", "name": "Fox Monocomando", "brand": "Fox", "code": "400.28", "adapter_id": "PSA 019", "adapter_name": "Adapt. Rosca M-H 18,1", "thread": "Rosca Macho-Hembra 18,1", "tip": "Lleva PSA 019 específico para rosca Fox 18,1.", "page": 48, "page_img": "./adapters/page_48.jpg", "dhash": "1100110001101000100100011100000011001000000011001001010001100100", "spout": "Curvo tradicional", "category": "Cocina"}, {"id": "radisson-gb4c", "name": "Radisson GB4C (Pico Rectangular)", "brand": "Radisson", "code": "GB4C", "adapter_id": "PSA 177", "adapter_name": "Adapt. Rectangular p/pegar", "thread": "Pico rectangular / pegado", "tip": "Pico rectangular sin rosca circular. Requiere adaptador rectangular PSA 177 fijado con adhesivo especial suministrado por PSA.", "page": 49, "page_img": "./adapters/page_49.jpg", "dhash": "1110110001111000100100011100000010110000011010000100100101001101", "spout": "Cascada / Rectangular plano", "category": "Cascada / Diseño"}, {"id": "betis-20134", "name": "Betis", "brand": "Clever / Otras", "code": "20-134", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca macho 16,3 x 1", "tip": "Lleva PSA 142.", "page": 50, "page_img": "./adapters/page_50.jpg", "dhash": "1100110001111000100100011100000011110010001010010110110101101100", "spout": "Curvo monocomando", "category": "Cocina"}, {"id": "mallorca-60131", "name": "Mallorca", "brand": "Clever / Otras", "code": "60-131", "adapter_id": "PSA 164", "adapter_name": "Adapt. rosca macho 20 x 1", "thread": "Rosca macho 20 x 1", "tip": "Lleva PSA 164 con rosca de 20 x 1.", "page": 51, "page_img": "./adapters/page_51.jpg", "dhash": "1100110001111000100100011100000111001100000111001100010010001100", "spout": "Curvo alto", "category": "Cocina"}, {"id": "santander-20135", "name": "Santander", "brand": "Clever / Otras", "code": "20-135", "adapter_id": "PSA 164", "adapter_name": "Adapt. rosca macho 20 x 1", "thread": "Rosca macho 20 x 1", "tip": "Lleva PSA 164 con rosca de 20 x 1.", "page": 52, "page_img": "./adapters/page_52.jpg", "dhash": "1100110001111000100100011100100011000000111100001001100010000000", "spout": "Curvo monocomando", "category": "Cocina"}, {"id": "saona-infinity", "name": "Saona Infinity (Pico Rectangular)", "brand": "Clever", "code": "97856", "adapter_id": "PSA 177", "adapter_name": "Adapt. Rectangular p/pegar", "thread": "Pico rectangular / pegado", "tip": "Pico rectangular sin rosca cilíndrica. Lleva adaptador rectangular PSA 177 para pegar.", "page": 53, "page_img": "./adapters/page_53.jpg", "dhash": "1110110001101000100100101100010010110000011010001100110111001100", "spout": "Cascada / Rectangular plano", "category": "Cascada / Diseño"}, {"id": "perugia", "name": "Perugia", "brand": "Otras marcas", "code": "Perugia", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca estándar Unimix", "tip": "Compatible con PSA 002.", "page": 54, "page_img": "./adapters/page_54.jpg", "dhash": "1110110001101000100100011100100010001000011001101000100010010000", "spout": "Curvo", "category": "Cocina"}, {"id": "modern-08510f", "name": "Modern", "brand": "Otras marcas", "code": "08510F", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca estándar Unimix", "tip": "Lleva adaptador PSA 002.", "page": 55, "page_img": "./adapters/page_55.jpg", "dhash": "1110110001110000100100011100100011010000000100101011000001100100", "spout": "Curvo", "category": "Cocina"}, {"id": "patio-media", "name": "Canilla de Patio / Jardín 1/2 pulgada", "brand": "Canillas de patio / jardín", "code": "1/2 Pulgada", "adapter_id": "PSA 100", "adapter_name": "Adapt. Rosca Hembra BPS 1/2", "thread": "Rosca exterior macho 1/2 gas / BSP", "tip": "Canilla de servicio exterior de 1/2\". Se enrosca directamente el adaptador PSA 100.", "page": 56, "page_img": "./adapters/page_56.jpg", "dhash": "1110110001101000100100011100110011011000010100100001001001010010", "spout": "Canilla de bronce/niquelada de jardín o lavadero", "category": "Patio / Exterior"}, {"id": "patio-tres-cuartos", "name": "Canilla de Patio / Jardín 3/4 pulgada", "brand": "Canillas de patio / jardín", "code": "3/4 Pulgada", "adapter_id": "PSA 018", "adapter_name": "Adapt. Rosca Canilla Tipo Patio 3/4", "thread": "Rosca exterior macho 3/4 gas / BSP", "tip": "Canilla de servicio exterior de 3/4\". Se enrosca directamente el adaptador PSA 018.", "page": 57, "page_img": "./adapters/page_57.jpg", "dhash": "1110110001101000100100011100110011011000010100100001001001010010", "spout": "Canilla de bronce/niquelada de patio", "category": "Patio / Exterior"}];

  var currentPhotoSrc = null;
  var deckIndex = 0;
  var animando = false;

  function injectStyles() {
    if (document.getElementById("canillas-simple-styles")) return;
    var st = document.createElement("style");
    st.id = "canillas-simple-styles";
    st.textContent = `
      .can-simple-wrap {
        padding: 10px 12px 80px;
        max-width: 540px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      /* iOS Grid de Botones Cuadrados */
      .ios-action-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 14px;
      }
      .ios-square-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 18px 12px 16px;
        border-radius: 22px;
        border: 1px solid rgba(255, 255, 255, 0.85);
        background: rgba(255, 255, 255, 0.78);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        box-shadow: 0 8px 20px rgba(11, 88, 120, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03);
        cursor: pointer;
        transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s ease;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
      }
      body.dark .ios-square-btn {
        background: rgba(35, 35, 52, 0.78);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
      }
      .ios-square-btn:active {
        transform: scale(0.95);
        box-shadow: 0 2px 8px rgba(11, 88, 120, 0.04);
      }

      .ios-icon-circle {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease;
      }
      .ios-icon-circle.cam {
        background: linear-gradient(135deg, #0b5878, #3ad0a4);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(11, 88, 120, 0.25);
      }
      .ios-icon-circle.gal {
        background: linear-gradient(135deg, rgba(11, 88, 120, 0.12), rgba(58, 208, 164, 0.15));
        color: #0b5878;
        border: 1px solid rgba(11, 88, 120, 0.15);
      }
      body.dark .ios-icon-circle.gal {
        background: rgba(58, 208, 164, 0.15);
        color: #3ad0a4;
        border-color: rgba(58, 208, 164, 0.25);
      }

      .ios-btn-label {
        font-size: 13px;
        font-weight: 750;
        color: #1e293b;
        letter-spacing: -0.2px;
      }
      body.dark .ios-btn-label {
        color: #f2f2f7;
      }

      /* Tarjeta Principal Glassmorphic estilo iOS */
      .ios-main-card {
        background: rgba(255, 255, 255, 0.78);
        backdrop-filter: blur(24px) saturate(190%);
        -webkit-backdrop-filter: blur(24px) saturate(190%);
        border: 1px solid rgba(255, 255, 255, 0.85);
        border-radius: 24px;
        padding: 16px 12px;
        box-shadow: 0 10px 30px -5px rgba(11, 88, 120, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03);
        margin-bottom: 14px;
      }
      body.dark .ios-main-card {
        background: rgba(32, 32, 48, 0.78);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
      }

      /* Comparador Dividido */
      .ios-split-row {
        display: flex;
        gap: 10px;
        align-items: stretch;
      }
      .ios-col-user {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        background: rgba(248, 250, 252, 0.85);
        border-radius: 20px;
        padding: 10px 8px;
        border: 1px solid rgba(0, 0, 0, 0.06);
      }
      body.dark .ios-col-user {
        background: rgba(40, 40, 58, 0.75);
        border-color: rgba(255, 255, 255, 0.08);
      }
      .ios-col-deck {
        flex: 1.25;
        min-width: 0;
        display: flex;
        flex-direction: column;
        background: #ffffff;
        border-radius: 20px;
        padding: 10px 8px;
        border: 1.5px solid rgba(11, 88, 120, 0.25);
        box-shadow: 0 6px 18px rgba(11, 88, 120, 0.08);
        position: relative;
        overflow: hidden;
      }
      body.dark .ios-col-deck {
        background: #1c1c2b;
        border-color: rgba(58, 208, 164, 0.3);
      }

      .ios-tag-label {
        font-size: 10px;
        font-weight: 850;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #64748b;
        margin-bottom: 6px;
        text-align: center;
      }
      body.dark .ios-tag-label {
        color: #94a3b8;
      }

      .ios-user-box {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
        border-radius: 14px;
        overflow: hidden;
        height: 310px;
      }
      body.dark .ios-user-box {
        background: #181826;
      }
      .ios-user-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }

      /* Escenario de carta del PDF */
      .ios-deck-stage {
        position: relative;
        width: 100%;
        height: 310px;
        overflow: hidden;
        border-radius: 14px;
        background: #ffffff;
        user-select: none;
        -webkit-user-select: none;
        touch-action: pan-y;
      }
      body.dark .ios-deck-stage {
        background: #181826;
      }

      .ios-card {
        position: absolute;
        inset: 0;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        cursor: grab;
        will-change: transform;
        z-index: 5;
      }
      body.dark .ios-card {
        background: #181826;
      }

      .ios-card-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        pointer-events: none;
      }

      /* Animaciones de cambio */
      @keyframes iosSlideInRight {
        from { transform: translateX(50px) scale(0.97); opacity: 0.3; }
        to { transform: translateX(0) scale(1); opacity: 1; }
      }
      @keyframes iosSlideInLeft {
        from { transform: translateX(-50px) scale(0.97); opacity: 0.3; }
        to { transform: translateX(0) scale(1); opacity: 1; }
      }
      .ios-anim-right {
        animation: iosSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .ios-anim-left {
        animation: iosSlideInLeft 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .ios-card.arrastre {
        transition: none !important;
        cursor: grabbing;
      }
      .ios-card.volver {
        transition: transform 0.28s cubic-bezier(0.28, 1.45, 0.45, 1) !important;
      }

      /* Panel de Descripción Clickeable estilo Tarjeta iOS */
      .ios-desc-card {
        background: linear-gradient(135deg, rgba(11, 88, 120, 0.07), rgba(58, 208, 164, 0.08));
        border: 1.5px solid rgba(11, 88, 120, 0.18);
        border-radius: 20px;
        padding: 16px 16px 14px;
        margin-top: 14px;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        position: relative;
        overflow: hidden;
        transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), background 0.15s ease;
      }
      body.dark .ios-desc-card {
        background: linear-gradient(135deg, rgba(58, 208, 164, 0.1), rgba(11, 88, 120, 0.12));
        border-color: rgba(58, 208, 164, 0.25);
      }
      .ios-desc-card:active {
        transform: scale(0.98);
        background: linear-gradient(135deg, rgba(11, 88, 120, 0.12), rgba(58, 208, 164, 0.14));
      }

      .ios-desc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2px;
      }
      .ios-desc-eyebrow {
        font-size: 10px;
        font-weight: 850;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }
      body.dark .ios-desc-eyebrow {
        color: #94a3b8;
      }
      .ios-tap-advance-hint {
        font-size: 11px;
        font-weight: 750;
        color: #0b5878;
        display: flex;
        align-items: center;
        gap: 3px;
      }
      body.dark .ios-tap-advance-hint {
        color: #3ad0a4;
      }

      .ios-badge-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin: 2px 0 6px;
      }
      .ios-badge-main {
        font-size: 26px;
        font-weight: 950;
        color: #0b5878;
        letter-spacing: -0.5px;
      }
      body.dark .ios-badge-main {
        color: #3ad0a4;
      }
      .ios-badge-counter {
        font-size: 11.5px;
        font-weight: 800;
        color: #64748b;
        margin-left: auto;
      }

      .ios-model-name {
        font-size: 15px;
        font-weight: 850;
        color: #1e293b;
        letter-spacing: -0.2px;
        margin-bottom: 2px;
      }
      body.dark .ios-model-name {
        color: #f2f2f7;
      }
      .ios-thread-info {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 8px;
      }

      .ios-tip-bubble {
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(0, 0, 0, 0.05);
        border-radius: 12px;
        padding: 9px 12px;
        font-size: 12px;
        color: #0b5878;
        line-height: 1.4;
      }
      body.dark .ios-tip-bubble {
        background: rgba(30, 30, 45, 0.7);
        border-color: rgba(255, 255, 255, 0.06);
        color: #e2e8f0;
      }

      /* Botón Compartir WhatsApp */
      .ios-wa-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
        padding: 14px 16px;
        border-radius: 16px;
        border: none;
        background: linear-gradient(135deg, #25D366, #128C7E);
        color: #ffffff;
        font-family: inherit;
        font-size: 14px;
        font-weight: 850;
        cursor: pointer;
        margin-top: 12px;
        box-shadow: 0 6px 18px rgba(37, 211, 102, 0.28);
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }
      .ios-wa-btn:active {
        transform: scale(0.97);
        box-shadow: 0 2px 8px rgba(37, 211, 102, 0.15);
      }

      /* Buscador iOS estilo SearchBar */
      .ios-search-bar {
        width: 100%;
        box-sizing: border-box;
        padding: 11px 14px 11px 36px;
        border-radius: 14px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(241, 245, 249, 0.85);
        font-family: inherit;
        font-size: 13px;
        color: #1e293b;
        outline: none;
        margin-top: 10px;
        transition: border-color 0.15s ease, background 0.15s ease;
      }
      body.dark .ios-search-bar {
        background: rgba(45, 45, 65, 0.75);
        border-color: rgba(255, 255, 255, 0.1);
        color: #f2f2f7;
      }
      .ios-search-bar:focus {
        background: #ffffff;
        border-color: #0b5878;
      }
      body.dark .ios-search-bar:focus {
        background: #202030;
        border-color: #3ad0a4;
      }

      /* Modal Popups estilo iOS Sheet */
      .can-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        animation: canFadeIn 0.2s ease-out;
      }
      @keyframes canFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .can-modal-content {
        background: #ffffff;
        width: 100%;
        max-width: 600px;
        height: 94vh;
        max-height: 94vh;
        border-radius: 26px 26px 0 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 -10px 30px rgba(0,0,0,0.3);
        animation: canSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      body.dark .can-modal-content {
        background: #181826;
        color: #f2f2f7;
      }
      @keyframes canSlideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      .can-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid rgba(0,0,0,0.06);
      }
      body.dark .can-modal-header {
        border-color: rgba(255,255,255,0.08);
      }
      .can-modal-body {
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      .can-close-btn {
        background: rgba(0,0,0,0.06);
        border: none;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        font-size: 16px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1e293b;
      }
      body.dark .can-close-btn {
        background: rgba(255,255,255,0.12);
        color: #ffffff;
      }
    `;
    document.head.appendChild(st);
  }

  window.openCanillas = function () {
    if (typeof showView === "function") {
      showView("view-canillas");
    }
    render();
  };

  window.canillasTriggerCam = function () {
    var el = document.getElementById("canNativeCam");
    if (el) el.click();
  };

  window.canillasTriggerGal = function () {
    var el = document.getElementById("canNativeGal");
    if (el) el.click();
  };

  window.canillasOnFile = function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    if (window.URL && window.URL.createObjectURL) {
      currentPhotoSrc = window.URL.createObjectURL(file);
    } else {
      var reader = new FileReader();
      reader.onload = function (evt) {
        currentPhotoSrc = evt.target.result;
        render();
      };
      reader.readAsDataURL(file);
      return;
    }
    render();
  };

  /* Desplazamiento a la siguiente carta */
  window.canillasDeckNext = function () {
    if (animando) return;
    animando = true;
    deckIndex = (deckIndex + 1) % DECK.length;
    renderSingleCard("next");
    updateDescriptionPanel();
    setTimeout(function () { animando = false; }, 230);
  };

  /* Desplazamiento a la carta anterior */
  window.canillasDeckPrev = function () {
    if (animando) return;
    animando = true;
    deckIndex = (deckIndex - 1 + DECK.length) % DECK.length;
    renderSingleCard("prev");
    updateDescriptionPanel();
    setTimeout(function () { animando = false; }, 230);
  };

  /* Búsqueda rápida para saltar a una carta */
  window.canillasSearchDeck = function (val) {
    if (!val || val.trim().length < 2) return;
    var q = val.toLowerCase().trim();
    for (var i = 0; i < DECK.length; i++) {
      var f = DECK[i];
      if ((f.name && f.name.toLowerCase().includes(q)) ||
          (f.adapter_id && f.adapter_id.toLowerCase().includes(q)) ||
          (f.brand && f.brand.toLowerCase().includes(q))) {
        deckIndex = i;
        renderSingleCard("next");
        updateDescriptionPanel();
        break;
      }
    }
  };

  /* Renderiza UNA SOLA carta sólida y limpia: 0 superposiciones */
  function renderSingleCard(dir) {
    var stage = document.getElementById("canDeckStage");
    if (!stage || !DECK[deckIndex]) return;

    var cur = DECK[deckIndex];
    var animClass = dir === "next" ? "ios-anim-right" : (dir === "prev" ? "ios-anim-left" : "");

    stage.innerHTML = `
      <div class="ios-card ${animClass}" id="canTopCard">
        <img src="${cur.page_img}" class="ios-card-img" alt="${cur.name}">
      </div>
    `;

    var topCard = document.getElementById("canTopCard");
    if (topCard) {
      activarSwipeCard(topCard);
    }
  }

  /* Actualiza la descripción en el espacio inferior (clicleable para pasar carta) */
  function updateDescriptionPanel() {
    var host = document.getElementById("canDescPanelHost");
    if (!host || !DECK[deckIndex]) return;

    var cur = DECK[deckIndex];

    host.innerHTML = `
      <div class="ios-desc-card" onclick="window.canillasDeckNext()" title="Tocá para ver la siguiente carta">
        
        <div class="ios-desc-header">
          <span class="ios-desc-eyebrow">Adaptador requerido</span>
          <span class="ios-tap-advance-hint">Pasar carta ›</span>
        </div>
        
        <div class="ios-badge-row">
          <span class="ios-badge-main">${cur.adapter_id}</span>
          <span class="ios-badge-counter">${deckIndex + 1} de ${DECK.length}</span>
        </div>

        <div class="ios-model-name">${cur.name}</div>

        ${cur.thread ? `<div class="ios-thread-info">Rosca: ${cur.thread}</div>` : ""}

        <div class="ios-tip-bubble">
          💡 ${cur.tip || "Identificá la rosca del pico para enroscar el adaptador correspondiente."}
        </div>

      </div>
    `;
  }

  /* Compartir el cuadro completo por WhatsApp */
  window.canillasShareWhatsApp = async function () {
    var cur = DECK[deckIndex];
    if (!cur) return;

    var textMsg = "🚰 *Identificación de Adaptador PSA*\n\n" +
                  "*Modelo:* " + cur.name + "\n" +
                  "*Adaptador:* " + cur.adapter_id + "\n" +
                  (cur.thread ? "*Rosca:* " + cur.thread + "\n" : "") +
                  (cur.tip ? "\n💡 " + cur.tip : "");

    var targetEl = document.getElementById("canCompareCaptureArea");

    if (window.html2canvas && targetEl) {
      try {
        var canvas = await window.html2canvas(targetEl, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false
        });

        canvas.toBlob(async function (blob) {
          if (blob && navigator.share && navigator.canShare) {
            var file = new File([blob], "adaptador-psa.png", { type: "image/png" });
            if (navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  title: "Adaptador PSA - " + cur.adapter_id,
                  text: textMsg,
                  files: [file]
                });
                return;
              } catch (e) {}
            }
          }
          var waUrl = "https://wa.me/?text=" + encodeURIComponent(textMsg);
          window.open(waUrl, "_blank");
        }, "image/png");
        return;
      } catch (err) {
        console.warn("Capture error, fallback text:", err);
      }
    }

    var waUrl = "https://wa.me/?text=" + encodeURIComponent(textMsg);
    window.open(waUrl, "_blank");
  };

  /* Swipe táctil interactivo */
  function activarSwipeCard(el) {
    var x0 = 0, y0 = 0, dx = 0, dy = 0, arrastrando = false;

    el.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      arrastrando = true;
      x0 = e.clientX;
      y0 = e.clientY;
      dx = 0;
      dy = 0;
      el.__arrastro = false;
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    }, true);

    el.addEventListener("pointermove", function (e) {
      if (!arrastrando) return;
      dx = e.clientX - x0;
      dy = e.clientY - y0;

      if (!el.__arrastro && Math.abs(dx) > 6) {
        el.__arrastro = true;
        el.classList.add("arrastre");
      }

      if (el.__arrastro) {
        if (e.cancelable) e.preventDefault();
        el.style.transform = "translateX(" + dx + "px) rotate(" + (dx / 22) + "deg)";
      }
    }, { capture: true, passive: false });

    function soltar() {
      if (!arrastrando) return;
      arrastrando = false;
      el.classList.remove("arrastre");

      if (el.__arrastro && dx < -45) {
        window.canillasDeckNext();
      } else if (el.__arrastro && dx > 45) {
        window.canillasDeckPrev();
      } else if (el.__arrastro) {
        el.classList.add("volver");
        el.style.transform = "";
        setTimeout(function () {
          el.classList.remove("volver");
        }, 280);
      }
      el.__arrastro = false;
    }

    el.addEventListener("pointerup", soltar, true);
    el.addEventListener("pointercancel", soltar, true);

    // Al presionar directamente en el PDF, se agranda en pantalla completa
    el.addEventListener("click", function (e) {
      if (el.__arrastro || Math.abs(dx) > 10) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      var cur = DECK[deckIndex];
      if (cur) {
        window.canillasOpenImagePopup(cur.page_img, "Ficha oficial " + cur.name + " - " + cur.adapter_id);
      }
    }, true);
  }

  /* Popup para ver la imagen completa de la ficha */
  window.canillasOpenImagePopup = function (imgSrc, title) {
    window.canillasCloseModal();

    var modal = document.createElement("div");
    modal.className = "can-modal-overlay";
    modal.id = "canImgModal";
    modal.onclick = function (e) {
      if (e.target === modal) window.canillasCloseModal();
    };

    modal.innerHTML = `
      <div class="can-modal-content">
        <div class="can-modal-header">
          <span style="font-weight: 850; font-size: 15px;">${title || "Ficha del adaptador"}</span>
          <button type="button" class="can-close-btn" aria-label="Cerrar" data-cerrar="true" onclick="window.canillasCloseModal()">✕</button>
        </div>
        <div class="can-modal-body" style="background: #f1f5f9; padding: 12px; text-align: center;">
          <img src="${imgSrc}" style="width: 100%; height: auto; max-width: 520px; display: block; margin: 0 auto; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  };

  window.canillasCloseModal = function () {
    var m = document.getElementById("canImgModal");
    if (m && m.parentNode) m.parentNode.removeChild(m);
  };

  function render() {
    var cont = document.getElementById("canillasCont");
    if (!cont) return;

    injectStyles();

    cont.innerHTML = `
      <div class="can-simple-wrap">
        
        <!-- Botones Cuadrados Superiores estilo iPhone -->
        <div class="ios-action-grid">
          
          <button type="button" class="ios-square-btn" onclick="window.canillasTriggerCam()">
            <div class="ios-icon-circle cam">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <span class="ios-btn-label">Sacar foto</span>
          </button>

          <button type="button" class="ios-square-btn" onclick="window.canillasTriggerGal()">
            <div class="ios-icon-circle gal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <span class="ios-btn-label">Buscar imagen</span>
          </button>

        </div>

        <!-- Inputs invisibles para captura de cámara y galería -->
        <input type="file" id="canNativeCam" accept="image/*" capture="environment" style="display:none" onchange="window.canillasOnFile(event)">
        <input type="file" id="canNativeGal" accept="image/*" style="display:none" onchange="window.canillasOnFile(event)">

        <!-- Tarjeta Principal: Cuadro para Captura y Compartir -->
        <div class="ios-main-card" id="canCompareCaptureArea">
          
          <div class="ios-split-row">
            
            <!-- Columna Izquierda: Tu foto (sin botón redundante de cambiar) -->
            <div class="ios-col-user">
              <div class="ios-tag-label">Tu foto</div>
              
              <div class="ios-user-box">
                ${currentPhotoSrc ? `
                  <img src="${currentPhotoSrc}" class="ios-user-img">
                ` : `
                  <div style="padding: 16px 8px; text-align: center; color: #94a3b8; font-size: 11.5px; font-weight: 700; line-height: 1.4;">
                    Subí una foto para comparar
                  </div>
                `}
              </div>
            </div>

            <!-- Columna Derecha: Carta PDF limpia a tamaño completo -->
            <div class="ios-col-deck">
              <div class="ios-tag-label">Catálogo PSA (Deslizá)</div>
              
              <div class="ios-deck-stage" id="canDeckStage"></div>
            </div>

          </div>

          <!-- Panel de Descripción (Tocar para pasar carta) -->
          <div id="canDescPanelHost"></div>

        </div>

        <!-- Botón Compartir por WhatsApp -->
        <button type="button" class="ios-wa-btn" onclick="window.canillasShareWhatsApp()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.777.947 2.8.947 3.181 0 5.767-2.587 5.768-5.766.001-3.18-2.585-5.767-5.766-5.767zm7.48 5.766c-.001 4.137-3.364 7.5-7.502 7.5-1.309 0-2.388-.344-3.419-.955l-4.59 1.203 1.226-4.475c-.694-1.109-1.065-2.227-1.066-3.473.001-4.137 3.364-7.5 7.502-7.5 4.138.001 7.499 3.363 7.499 7.5z"/>
          </svg>
          <span>Compartir por WhatsApp</span>
        </button>

        <!-- Buscador instantáneo con estilo iOS Search -->
        <div style="position: relative; margin-top: 10px;">
          <span style="position: absolute; left: 12px; top: 22px; font-size: 13px; color: #94a3b8; pointer-events: none;">🔍</span>
          <input type="text" class="ios-search-bar" placeholder="Buscar en el catálogo (ej. Libby, Arizona, Epuyen)..." oninput="window.canillasSearchDeck(this.value)">
        </div>

      </div>
    `;

    renderSingleCard();
    updateDescriptionPanel();
  }

})();
