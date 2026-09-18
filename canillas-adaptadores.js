/* ============================================================
   APPI · Canillas & Adaptadores PSA
   - Vista dividida limpia: Foto a la izquierda + PDF a tamaño máximo a la derecha
   - Sin flechitas ni títulos en la carta: la imagen ocupa todo el espacio
   - Sin botón redundante de ver ficha: se toca directamente la carta para ampliar
   - Animación de arrastre/vuelo idéntica al Home
   - Descripción completa en el panel inferior
   ============================================================ */
(function () {
  "use strict";

  var DECK = [{"id": "fv-alabama", "name": "FV Alabama", "brand": "FV", "code": "411.04/27", "adapter_id": "PSA 102", "adapter_name": "Adapt. Rosca macho FV diam. 18,6", "thread": "Rosca macho 18,6 mm", "tip": "Rosca macho exterior estándar FV de 18.6mm", "page": 3, "page_img": "./adapters/page_3.jpg", "dhash": "1100110001110000100100011100100010010010011011101101100010110010", "spout": "Curvo alto", "category": "Cocina"}, {"id": "fv-allegro", "name": "FV Allegro", "brand": "FV", "code": "0434.01/15-B-CR", "adapter_id": "PSA 149 / PSA 018", "adapter_name": "Adapt. Lavarropas Diam 24 x 1 / Adapt. Rosca Canilla Tipo Patio", "thread": "Rosca lavarropas / patio 24x1", "tip": "Dispone de opción para adaptar a rosca de patio o salida de lavarropas 24x1.", "page": 4, "page_img": "./adapters/page_4.jpg", "dhash": "1100110001110000100100011100000011100100011000001110000011110001", "spout": "Lavadero / Lavarropas", "category": "Lavadero"}, {"id": "fv-areco", "name": "FV Areco", "brand": "FV", "code": "424/99", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix estándar", "tip": "Compatible directo con Adaptador Unimix PSA 002.", "page": 5, "page_img": "./adapters/page_5.jpg", "dhash": "1100110001110000100100011100000010001000100101001001000011010010", "spout": "Curvo tradicional", "category": "Cocina"}, {"id": "fv-arizona", "name": "FV Arizona", "brand": "FV", "code": "406/B1", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix estándar", "tip": "Una de las canillas más comunes de Argentina. Rosca clásica Unimix.", "page": 6, "page_img": "./adapters/page_6.jpg", "dhash": "1100110001110000100100011100000010001000111000001110010011111100", "spout": "Curvo clásico de pared/mesada", "category": "Cocina"}, {"id": "fv-chess", "name": "FV Chess", "brand": "FV", "code": "418/84", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix estándar", "tip": "Lleva el adaptador estándar FV Unimix PSA 002.", "page": 7, "page_img": "./adapters/page_7.jpg", "dhash": "1100110001110000100100011100000011000000001111100111001011110000", "spout": "Curvo alto estilizado", "category": "Cocina"}, {"id": "fv-cibeles", "name": "FV Cibeles", "brand": "FV", "code": "0411/97", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "thread": "Pico sin rosca accesible / Adaptador Múltiple a presión", "tip": "Requiere Adaptador Múltiple PSA 073 colocado a presión en la salida del pico.", "page": 8, "page_img": "./adapters/page_8.jpg", "dhash": "1100110001110000100100011100000011100000100000001000111010011100", "spout": "Curvo pico ancho", "category": "Cocina"}, {"id": "fv-c7-radal", "name": "FV C7 Radal", "brand": "FV", "code": "0410/C7", "adapter_id": "PSA 039", "adapter_name": "Adapt. Rosca Hembra Diametro 22", "thread": "Rosca hembra 22 mm", "tip": "Lleva rosca hembra de 22mm.", "page": 9, "page_img": "./adapters/page_9.jpg", "dhash": "1100110001110000100100011100100011011001001101000110010001001100", "spout": "Curvo tradicional", "category": "Cocina"}, {"id": "fv-d7-alerce", "name": "FV D7 Alerce", "brand": "FV", "code": "428/D7", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "ATENCIÓN: Retirar el aireador que se encuentra dentro del casquillo cromado para colocar el adaptador PSA 144.", "page": 10, "page_img": "./adapters/page_10.jpg", "dhash": "1100110001110000100100011100100011100000010100101101100011011010", "spout": "Curvo moderno", "category": "Cocina"}, {"id": "fv-denisse", "name": "FV Denisse", "brand": "FV", "code": "0416/64", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Compatible directo con PSA 002.", "page": 11, "page_img": "./adapters/page_11.jpg", "dhash": "1100110001110000100100011100000011001100000100001011000010100000", "spout": "Curvo bajo", "category": "Cocina"}, {"id": "fv-eclipse", "name": "FV Eclipse", "brand": "FV", "code": "411.01/94 / 423/94", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Aplica para modelos 411.01/94 y 423/94 con adaptador PSA 002.", "page": 12, "page_img": "./adapters/page_12.jpg", "dhash": "1100110001110000100100011100000011000000110110000011000011100100", "spout": "Curvo monocomando mesada/pared", "category": "Cocina"}, {"id": "fv-epuyen", "name": "FV Epuyen (Negra / Cromada)", "brand": "FV", "code": "411.04/L2", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "thread": "Pico estilizado / Adapt. Múltiple", "tip": "Disponible en acabado negro mate y cromo. Utiliza el Adaptador Múltiple PSA 073.", "page": 13, "page_img": "./adapters/page_13.jpg", "dhash": "1100110001110000100100101100100011000000110010001100000010000000", "spout": "Curvo alto estilizado contemporáneo", "category": "Cocina de diseño"}, {"id": "fv-flow", "name": "FV Flow", "brand": "FV", "code": "411/01/B3", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Compatible directo con adaptador PSA 002.", "page": 14, "page_img": "./adapters/page_14.jpg", "dhash": "1100110001110000100100011100000011000110001011000110100111010010", "spout": "Curvo suave", "category": "Cocina"}, {"id": "fv-gran-gala", "name": "FV Gran Gala", "brand": "FV", "code": "418/72", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Lleva PSA 002 FV Unimix.", "page": 15, "page_img": "./adapters/page_15.jpg", "dhash": "1100110001110000100100011100100111011100001101001110000010010000", "spout": "Curvo tradicional alto", "category": "Cocina"}, {"id": "fv-kansas", "name": "FV Kansas", "brand": "FV", "code": "411.04/24", "adapter_id": "PSA 102", "adapter_name": "Adapt. Rosca macho FV diam. 18,6", "thread": "Rosca macho 18,6 mm", "tip": "Utiliza rosca macho FV 18.6mm (PSA 102).", "page": 16, "page_img": "./adapters/page_16.jpg", "dhash": "1100110001110000100100101100000011000110000011000110100011010010", "spout": "Curvo cuello de cisne", "category": "Cocina"}, {"id": "fv-libby-411", "name": "FV Libby Mesada", "brand": "FV", "code": "411.04/39", "adapter_id": "PSA 135", "adapter_name": "Adapt. Rosca Macho Diam 21 x 1", "thread": "Rosca macho 21 x 1", "tip": "Modelo Libby monocomando mesada 411.04/39 lleva adaptador PSA 135 (21x1).", "page": 17, "page_img": "./adapters/page_17.jpg", "dhash": "1100110001110000100100011100000011000000110110011101100011010000", "spout": "Curvo alto monocomando", "category": "Cocina"}, {"id": "fv-libby-0426", "name": "FV Libby Pico Recto / Diagonal", "brand": "FV", "code": "0426/39", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "ATENCIÓN: Retirar el aireador que se encuentra dentro del casquillo cromado para colocar el adaptador PSA 142 (16,3 x 1).", "page": 18, "page_img": "./adapters/page_18.jpg", "dhash": "1100110001110000100100011100000010110010011010000100100001001010", "spout": "Recto / Diagonal monocomando", "category": "Cocina / Lavatorio"}, {"id": "fv-libby-0428", "name": "FV Libby Alta", "brand": "FV", "code": "0428/39", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "ATENCIÓN: Retirar el aireador que se encuentra dentro del casquillo cromado para colocar el adaptador PSA 144 (18,2 x 1).", "page": 19, "page_img": "./adapters/page_19.jpg", "dhash": "1100110001110000100100011100000011100100110100001101100011011010", "spout": "Curvo alto monocomando", "category": "Cocina"}, {"id": "fv-libby-pared", "name": "FV Libby de Pared", "brand": "FV", "code": "406.03/39-CR / 0406/39", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Versión Libby para pared: lleva PSA 002.", "page": 20, "page_img": "./adapters/page_20.jpg", "dhash": "1100110001110000100100011100000011000000110001100000110010110100", "spout": "Pared monocomando / 2 llaves", "category": "Cocina pared"}, {"id": "fv-melody", "name": "FV Melody", "brand": "FV", "code": "0203/28", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador dentro del casquillo cromado. Lleva PSA 142.", "page": 21, "page_img": "./adapters/page_21.jpg", "dhash": "1100110001110000100100011100000011001000001011001001000011001100", "spout": "Bajo angular", "category": "Cocina / Baño"}, {"id": "fv-nerea-lever", "name": "FV Nerea Lever", "brand": "FV", "code": "0426/59L", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 142.", "page": 22, "page_img": "./adapters/page_22.jpg", "dhash": "1100110001110000100100011100100011100100010100100101100001000000", "spout": "Inclinado moderno", "category": "Cocina"}, {"id": "fv-newport", "name": "FV Newport", "brand": "FV", "code": "0411.01/B2", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Lleva el clásico PSA 002.", "page": 23, "page_img": "./adapters/page_23.jpg", "dhash": "1100110001110000100100011100100111010100001011001101100011010100", "spout": "Curvo tradicional", "category": "Cocina"}, {"id": "fv-oregon", "name": "FV Oregon", "brand": "FV", "code": "0428/18", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador dentro del casquillo cromado. Lleva PSA 144 (18,2 x 1).", "page": 24, "page_img": "./adapters/page_24.jpg", "dhash": "1100110001110000100100011100100010100100010100101101100011011010", "spout": "Curvo estilizado", "category": "Cocina"}, {"id": "fv-puelo-411", "name": "FV Puelo Monocomando Alto", "brand": "FV", "code": "411.04/B5", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador dentro del casquillo cromado. Lleva adaptador PSA 144.", "page": 25, "page_img": "./adapters/page_25.jpg", "dhash": "1100110001110000100100011100000011100000110100001001001010010000", "spout": "Curvo cisne alto contemporáneo", "category": "Cocina"}, {"id": "fv-puelo-423", "name": "FV Puelo Monocomando Bajo", "brand": "FV", "code": "423/B5", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Versión 423/B5 lleva PSA 002 directo.", "page": 26, "page_img": "./adapters/page_26.jpg", "dhash": "1100110001110000100100101100000011001100000100001010000001101000", "spout": "Curvo bajo", "category": "Cocina"}, {"id": "fv-swing", "name": "FV Swing", "brand": "FV", "code": "411.01/90", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Compatible con PSA 002.", "page": 27, "page_img": "./adapters/page_27.jpg", "dhash": "1100110001110000100100111100000011000110000111000011100011010010", "spout": "Curvo estándar", "category": "Cocina"}, {"id": "fv-swing-duo", "name": "FV Swing Duo", "brand": "FV", "code": "411.03/94", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Lleva PSA 002 Unimix.", "page": 28, "page_img": "./adapters/page_28.jpg", "dhash": "1100110001110000100100011100100111000110001111001101000011010110", "spout": "Curvo doble palanca", "category": "Cocina"}, {"id": "fv-swing-plus-multiple", "name": "FV Swing Plus (Instalación Múltiple)", "brand": "FV", "code": "412.01/90 / 0412.01/90CR", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "thread": "Extremo manguera extensible", "tip": "Instalación 1: En el aireador al extremo de la manguera extensible usando Adaptador Múltiple PSA 073.", "page": 29, "page_img": "./adapters/page_29.jpg", "dhash": "1100110001110000100100011100100011101010011001101001100010011000", "spout": "Pico extensible / manguera", "category": "Cocina extensible"}, {"id": "fv-swing-plus-rosca", "name": "FV Swing Plus (Instalación Roscada)", "brand": "FV", "code": "412.01/90 / 0412.01/90CR", "adapter_id": "PSA 037 / PSA 148", "adapter_name": "Adapt. Rosca Macho / Hembra Swing Plus", "thread": "Rosca específica Swing Plus", "tip": "Instalación 2: Conexión mediante juego de adaptadores PSA 037 y PSA 148 para rosca interna/externa del rociador extensible.", "page": 30, "page_img": "./adapters/page_30.jpg", "dhash": "1100110001110000100100011100100011101010011001101001100010011000", "spout": "Pico extensible / manguera", "category": "Cocina extensible"}, {"id": "fv-temple-multiple", "name": "FV Temple Extensible (Instalación Múltiple)", "brand": "FV", "code": "0412/87", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "thread": "Extremo manguera extensible", "tip": "Instalación 1: Extremo de la manguera extensible con Adaptador Múltiple PSA 073.", "page": 33, "page_img": "./adapters/page_33.jpg", "dhash": "1100110001110000100100101100100011000110001111100110001011000000", "spout": "Pico extraíble monocomando", "category": "Cocina extensible"}, {"id": "fv-temple-rosca", "name": "FV Temple Extensible (Instalación Roscada)", "brand": "FV", "code": "0412/87", "adapter_id": "PSA 037 / PSA 148", "adapter_name": "Adapt. Rosca Macho / Hembra FV Swing Plus / Temple", "thread": "Rosca específica rociador extensible", "tip": "Instalación 2: Roscado con PSA 037 y PSA 148.", "page": 34, "page_img": "./adapters/page_34.jpg", "dhash": "1100110001110000100100011100000010011000011010001000101010011010", "spout": "Pico extraíble monocomando", "category": "Cocina extensible"}, {"id": "fv-temple-fijo", "name": "FV Temple Monocomando Fijo", "brand": "FV", "code": "0411/87 / 0411.02/87", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "thread": "Pico plano / Adapt. Múltiple", "tip": "Lleva Adaptador Múltiple PSA 073.", "page": 35, "page_img": "./adapters/page_35.jpg", "dhash": "1100110001110000100100011100100011000000110010001011000010000000", "spout": "Curvo monocomando diseño minimalista", "category": "Cocina de diseño"}, {"id": "fv-tronic", "name": "FV Tronic (Electrónica)", "brand": "FV", "code": "0363.05P", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador dentro del casquillo cromado. Lleva PSA 142.", "page": 36, "page_img": "./adapters/page_36.jpg", "dhash": "1100110001110000100100011100100011100100010100101101101011011010", "spout": "Sensor electrónico automático", "category": "Electrónica / Comercial"}, {"id": "fv-unimix-dos", "name": "FV Unimix Dos", "brand": "FV", "code": "411/91", "adapter_id": "PSA 002 (o PSA 073)", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca FV Unimix", "tip": "Lleva Adaptador PSA 002. También es posible colocar el Adaptador Múltiple PSA 073.", "page": 37, "page_img": "./adapters/page_37.jpg", "dhash": "1100110001110000100100011100100011100000110000001101110011000000", "spout": "Curvo tradicional", "category": "Cocina"}, {"id": "canilla-duke", "name": "Duke Canilla Plástica Blanca", "brand": "Duke / Otras", "code": "Plástica Blanca", "adapter_id": "PSA 100", "adapter_name": "Adapt. Rosca Hembra BPS 1/2", "thread": "Rosca plástica BPS 1/2 pulgada", "tip": "Canilla de plástico blanca común de mesada o pileta de lavar. Lleva PSA 100 (BPS 1/2).", "page": 38, "page_img": "./adapters/page_38.jpg", "dhash": "1100110001101000001100010111000011000100111100100011000001101100", "spout": "Pared plástica blanca", "category": "Económica / Lavadero"}, {"id": "discovery-curve", "name": "Discovery Curve Monocomando", "brand": "Discovery", "code": "905", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 144.", "page": 39, "page_img": "./adapters/page_39.jpg", "dhash": "1100110001101000100000011110010011100100011000001101001010011010", "spout": "Curvo cuello alto", "category": "Cocina"}, {"id": "discovery-recto", "name": "Discovery Recto Monocomando", "brand": "Discovery", "code": "910", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 144.", "page": 40, "page_img": "./adapters/page_40.jpg", "dhash": "1100110001101000100000011110010010000100011100001001000010001010", "spout": "Recto inclinado", "category": "Cocina"}, {"id": "jockey-curve", "name": "Jockey Curve Monocomando", "brand": "Jockey", "code": "6380", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 144.", "page": 41, "page_img": "./adapters/page_41.jpg", "dhash": "1100110001101000100000011110010011100100110100001001000010010010", "spout": "Curvo elegante", "category": "Cocina"}, {"id": "jockey-recto", "name": "Jockey Recto Monocomando", "brand": "Jockey", "code": "6370", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 144.", "page": 42, "page_img": "./adapters/page_42.jpg", "dhash": "1100110001101000100000011110010010000100011100101101000010001010", "spout": "Recto inclinado", "category": "Cocina"}, {"id": "unicontrol-innovation", "name": "Unicontrol Innovation", "brand": "Unicontrol", "code": "4001 / 4015 / 4070 / 4075", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 142.", "page": 43, "page_img": "./adapters/page_43.jpg", "dhash": "1100110001101000100000011110000011100100010100001101001011010010", "spout": "Curvo monocomando", "category": "Cocina"}, {"id": "unicontrol-one", "name": "Unicontrol One", "brand": "Unicontrol", "code": "3001 / 3015 / 3070", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 142.", "page": 44, "page_img": "./adapters/page_44.jpg", "dhash": "1100110001101000100000011110000011000100110000001100000011011000", "spout": "Curvo monocomando", "category": "Cocina"}, {"id": "piazza-dot", "name": "Piazza Dot", "brand": "Piazza", "code": "10112", "adapter_id": "PSA 002 (o PSA 073)", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca macho estándar / múltiple", "tip": "Lleva PSA 002. También es posible en esta canilla colocar el Adaptador Múltiple PSA 073.", "page": 45, "page_img": "./adapters/page_45.jpg", "dhash": "1100110001101000100100011100000010001000100000101001100011010100", "spout": "Curvo estilizado Piazza", "category": "Cocina"}, {"id": "piazza-emblem-10014", "name": "Piazza Emblem 10014", "brand": "Piazza", "code": "10014", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca embutida 16,3 x 1", "tip": "Modelo Emblem 10014 lleva PSA 142 (16,3 x 1).", "page": 46, "page_img": "./adapters/page_46.jpg", "dhash": "1100110001101000100100011010100011000000111010001010010010110100", "spout": "Curvo minimalista", "category": "Cocina"}, {"id": "piazza-emblem-10016ne", "name": "Piazza Emblem 10016NE (Negra)", "brand": "Piazza", "code": "10016NE", "adapter_id": "PSA 039", "adapter_name": "Adapt. Rosca Hembra Diametro 22", "thread": "Rosca hembra 22 mm", "tip": "Modelo Emblem negro mate 10016NE: lleva PSA 039 (rosca hembra diam. 22).", "page": 47, "page_img": "./adapters/page_47.jpg", "dhash": "1100110001101000100100011100100010110010011010000100110111010100", "spout": "Curvo alto acabado negro mate", "category": "Cocina de diseño"}, {"id": "fox-40028", "name": "Fox Monocomando", "brand": "Fox", "code": "400.28", "adapter_id": "PSA 019", "adapter_name": "Adapt. Rosca M-H 18,1", "thread": "Rosca Macho-Hembra 18,1", "tip": "Lleva PSA 019 específico para rosca Fox 18,1.", "page": 48, "page_img": "./adapters/page_48.jpg", "dhash": "1100110001101000100100011100000011001000000011001001010001100100", "spout": "Curvo tradicional", "category": "Cocina"}, {"id": "radisson-gb4c", "name": "Radisson GB4C (Pico Rectangular)", "brand": "Radisson", "code": "GB4C", "adapter_id": "PSA 177", "adapter_name": "Adapt. Rectangular p/pegar", "thread": "Pico rectangular / pegado", "tip": "Pico rectangular sin rosca circular. Requiere adaptador rectangular PSA 177 fijado con adhesivo especial suministrado por PSA.", "page": 49, "page_img": "./adapters/page_49.jpg", "dhash": "1110110001111000100100011100000010110000011010000100100101001101", "spout": "Cascada / Rectangular plano", "category": "Cascada / Diseño"}, {"id": "betis-20134", "name": "Betis", "brand": "Clever / Otras", "code": "20-134", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "thread": "Rosca macho 16,3 x 1", "tip": "Lleva PSA 142.", "page": 50, "page_img": "./adapters/page_50.jpg", "dhash": "1100110001111000100100011100000011110010001010010110110101101100", "spout": "Curvo monocomando", "category": "Cocina"}, {"id": "mallorca-60131", "name": "Mallorca", "brand": "Clever / Otras", "code": "60-131", "adapter_id": "PSA 164", "adapter_name": "Adapt. rosca macho 20 x 1", "thread": "Rosca macho 20 x 1", "tip": "Lleva PSA 164 con rosca de 20 x 1.", "page": 51, "page_img": "./adapters/page_51.jpg", "dhash": "1100110001111000100100011100000111001100000111001100010010001100", "spout": "Curvo alto", "category": "Cocina"}, {"id": "santander-20135", "name": "Santander", "brand": "Clever / Otras", "code": "20-135", "adapter_id": "PSA 164", "adapter_name": "Adapt. rosca macho 20 x 1", "thread": "Rosca macho 20 x 1", "tip": "Lleva PSA 164 con rosca de 20 x 1.", "page": 52, "page_img": "./adapters/page_52.jpg", "dhash": "1100110001111000100100011100100011000000111100001001100010000000", "spout": "Curvo monocomando", "category": "Cocina"}, {"id": "saona-infinity", "name": "Saona Infinity (Pico Rectangular)", "brand": "Clever", "code": "97856", "adapter_id": "PSA 177", "adapter_name": "Adapt. Rectangular p/pegar", "thread": "Pico rectangular / pegado", "tip": "Pico rectangular sin rosca cilíndrica. Lleva adaptador rectangular PSA 177 para pegar.", "page": 53, "page_img": "./adapters/page_53.jpg", "dhash": "1110110001101000100100101100010010110000011010001100110111001100", "spout": "Cascada / Rectangular plano", "category": "Cascada / Diseño"}, {"id": "perugia", "name": "Perugia", "brand": "Otras marcas", "code": "Perugia", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca estándar Unimix", "tip": "Compatible con PSA 002.", "page": 54, "page_img": "./adapters/page_54.jpg", "dhash": "1110110001101000100100011100100010001000011001101000100010010000", "spout": "Curvo", "category": "Cocina"}, {"id": "modern-08510f", "name": "Modern", "brand": "Otras marcas", "code": "08510F", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "thread": "Rosca estándar Unimix", "tip": "Lleva adaptador PSA 002.", "page": 55, "page_img": "./adapters/page_55.jpg", "dhash": "1110110001110000100100011100100011010000000100101011000001100100", "spout": "Curvo", "category": "Cocina"}, {"id": "patio-media", "name": "Canilla de Patio / Jardín 1/2 pulgada", "brand": "Canillas de patio / jardín", "code": "1/2 Pulgada", "adapter_id": "PSA 100", "adapter_name": "Adapt. Rosca Hembra BPS 1/2", "thread": "Rosca exterior macho 1/2 gas / BSP", "tip": "Canilla de servicio exterior de 1/2\". Se enrosca directamente el adaptador PSA 100.", "page": 56, "page_img": "./adapters/page_56.jpg", "dhash": "1110110001101000100100011100110011011000010100100001001001010010", "spout": "Canilla de bronce/niquelada de jardín o lavadero", "category": "Patio / Exterior"}, {"id": "patio-tres-cuartos", "name": "Canilla de Patio / Jardín 3/4 pulgada", "brand": "Canillas de patio / jardín", "code": "3/4 Pulgada", "adapter_id": "PSA 018", "adapter_name": "Adapt. Rosca Canilla Tipo Patio 3/4", "thread": "Rosca exterior macho 3/4 gas / BSP", "tip": "Canilla de servicio exterior de 3/4\". Se enrosca directamente el adaptador PSA 018.", "page": 57, "page_img": "./adapters/page_57.jpg", "dhash": "1110110001101000100100011100110011011000010100100001001001010010", "spout": "Canilla de bronce/niquelada de patio", "category": "Patio / Exterior"}];

  var currentPhotoSrc = null;
  var deckIndex = 0;

  function injectStyles() {
    if (document.getElementById("canillas-simple-styles")) return;
    var st = document.createElement("style");
    st.id = "canillas-simple-styles";
    st.textContent = `
      .can-simple-wrap {
        padding: 12px 10px 80px;
        max-width: 600px;
        margin: 0 auto;
        font-family: inherit;
      }
      .can-simple-card {
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(18px) saturate(180%);
        -webkit-backdrop-filter: blur(18px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.85);
        border-radius: 20px;
        padding: 18px 14px;
        box-shadow: 0 6px 20px rgba(30, 24, 12, 0.05);
        margin-bottom: 14px;
      }
      body.dark .can-simple-card {
        background: rgba(35, 35, 55, 0.75);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
      }
      .can-btn-cam {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 13px 10px;
        border-radius: 14px;
        border: none;
        background: linear-gradient(135deg, #0b5878, #3ad0a4);
        color: #ffffff;
        font-family: inherit;
        font-size: 13.5px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(11, 88, 120, 0.25);
        transition: transform 0.12s ease;
      }
      .can-btn-cam:active {
        transform: scale(0.97);
      }
      .can-btn-gal {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 13px 10px;
        border-radius: 14px;
        border: 1px solid rgba(40, 36, 28, 0.15);
        background: rgba(255, 255, 255, 0.9);
        color: #2a2a32;
        font-family: inherit;
        font-size: 13.5px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.12s ease;
      }
      body.dark .can-btn-gal {
        background: rgba(45, 45, 65, 0.8);
        border-color: rgba(255, 255, 255, 0.12);
        color: #f2f2f7;
      }
      .can-btn-gal:active {
        transform: scale(0.97);
      }

      /* Split View */
      .can-split-row {
        display: flex;
        gap: 10px;
        align-items: stretch;
      }
      .can-col-user {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        background: rgba(255, 255, 255, 0.92);
        border-radius: 18px;
        padding: 10px 8px;
        border: 1.5px solid rgba(11, 88, 120, 0.2);
        box-shadow: 0 4px 14px rgba(0,0,0,0.04);
      }
      body.dark .can-col-user {
        background: rgba(40, 40, 60, 0.85);
        border-color: rgba(58, 208, 164, 0.25);
      }
      .can-col-deck {
        flex: 1.25;
        min-width: 0;
        display: flex;
        flex-direction: column;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 18px;
        padding: 10px 8px;
        border: 1.5px solid #0b5878;
        box-shadow: 0 6px 20px rgba(11, 88, 120, 0.12);
        position: relative;
        overflow: hidden;
      }
      body.dark .can-col-deck {
        background: rgba(40, 40, 60, 0.95);
        border-color: #3ad0a4;
      }

      .can-label-tag {
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #64748b;
        margin-bottom: 6px;
        text-align: center;
      }
      body.dark .can-label-tag {
        color: #94a3b8;
      }

      .can-user-img-box {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
        border-radius: 14px;
        overflow: hidden;
        height: 290px;
        border: 1px solid rgba(0,0,0,0.06);
      }
      body.dark .can-user-img-box {
        background: #1e1e2d;
      }
      .can-user-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }

      /* Mazo a tamaño máximo sin títulos ni flechitas */
      .can-deck-stage {
        position: relative;
        width: 100%;
        height: 290px;
        perspective: 800px;
        user-select: none;
        -webkit-user-select: none;
        touch-action: pan-y;
      }
      .can-card-stack {
        position: absolute;
        inset: 0;
        border-radius: 14px;
        background: #ffffff;
        box-shadow: 0 8px 24px rgba(10, 12, 40, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        cursor: grab;
        will-change: transform;
        transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s ease;
      }
      body.dark .can-card-stack {
        background: #181826;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      }
      .can-card-stack.detras1 {
        transform: translateY(8px) scale(0.95);
        opacity: 0.65;
        pointer-events: none;
        z-index: 1;
      }
      .can-card-stack.arrastre {
        transition: none !important;
        cursor: grabbing;
        z-index: 10;
      }
      .can-card-stack.volver {
        transition: transform 0.35s cubic-bezier(0.28, 1.45, 0.45, 1) !important;
        z-index: 10;
      }
      .can-card-stack.vuela-izq {
        transition: transform 0.42s cubic-bezier(0.3, 0.7, 0.4, 1), opacity 0.35s ease-out !important;
        transform: translateX(-140%) rotate(-22deg) !important;
        opacity: 0;
        pointer-events: none;
        z-index: 20;
      }
      .can-card-stack.vuela-der {
        transition: transform 0.42s cubic-bezier(0.3, 0.7, 0.4, 1), opacity 0.35s ease-out !important;
        transform: translateX(140%) rotate(22deg) !important;
        opacity: 0;
        pointer-events: none;
        z-index: 20;
      }

      .can-card-full-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        pointer-events: none;
      }

      /* Panel de descripción inferior */
      .can-desc-panel {
        background: rgba(11, 88, 120, 0.06);
        border: 1.5px solid rgba(11, 88, 120, 0.18);
        border-radius: 16px;
        padding: 14px 16px;
        margin-top: 14px;
        animation: canFadeUp 0.25s ease-out;
      }
      body.dark .can-desc-panel {
        background: rgba(58, 208, 164, 0.08);
        border-color: rgba(58, 208, 164, 0.22);
      }
      @keyframes canFadeUp {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .can-desc-badge {
        font-size: 24px;
        font-weight: 950;
        color: #0b5878;
        letter-spacing: -0.3px;
        margin: 2px 0 4px;
      }
      body.dark .can-desc-badge {
        color: #3ad0a4;
      }

      .can-search-input {
        width: 100%;
        box-sizing: border-box;
        padding: 11px 13px;
        border-radius: 12px;
        border: 1px solid rgba(40, 36, 28, 0.15);
        background: rgba(255, 255, 255, 0.95);
        font-family: inherit;
        font-size: 12.5px;
        color: #1e293b;
        outline: none;
        margin-top: 10px;
      }
      body.dark .can-search-input {
        background: rgba(45, 45, 65, 0.8);
        border-color: rgba(255, 255, 255, 0.15);
        color: #f2f2f7;
      }

      /* Modal Popups */
      .can-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.82);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
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
        border-radius: 24px 24px 0 0;
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
        padding: 12px 18px;
        border-bottom: 1px solid rgba(0,0,0,0.08);
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
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 17px;
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

  /* Pasar carta siguiente con animación de vuelo idéntica al Home */
  window.canillasDeckNext = function () {
    var stage = document.getElementById("canDeckStage");
    if (!stage) return;
    var top = stage.querySelector(".can-card-stack:not(.detras1)");
    if (top) {
      top.classList.add("vuela-izq");
      setTimeout(function () {
        if (top && top.parentNode) top.parentNode.removeChild(top);
      }, 400);
    }
    deckIndex = (deckIndex + 1) % DECK.length;
    renderDeckCards();
    updateDescriptionPanel();
  };

  /* Volver carta anterior con animación de vuelo idéntica al Home */
  window.canillasDeckPrev = function () {
    var stage = document.getElementById("canDeckStage");
    if (!stage) return;
    var top = stage.querySelector(".can-card-stack:not(.detras1)");
    if (top) {
      top.classList.add("vuela-der");
      setTimeout(function () {
        if (top && top.parentNode) top.parentNode.removeChild(top);
      }, 400);
    }
    deckIndex = (deckIndex - 1 + DECK.length) % DECK.length;
    renderDeckCards();
    updateDescriptionPanel();
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
        renderDeckCards();
        updateDescriptionPanel();
        break;
      }
    }
  };

  /* Renderiza las cartas del mazo ocupando el 100% del espacio, sin títulos ni flechitas */
  function renderDeckCards() {
    var stage = document.getElementById("canDeckStage");
    if (!stage) return;

    var cur = DECK[deckIndex];
    var next = DECK[(deckIndex + 1) % DECK.length];

    stage.innerHTML = `
      <!-- Carta de atrás (detras1) -->
      <div class="can-card-stack detras1">
        <img src="${next.page_img}" class="can-card-full-img" alt="${next.name}">
      </div>

      <!-- Carta del frente interactiva -->
      <div class="can-card-stack" id="canTopCard">
        <img src="${cur.page_img}" class="can-card-full-img" alt="${cur.name}">
      </div>
    `;

    var topCard = document.getElementById("canTopCard");
    if (topCard) {
      activarSwipeCard(topCard);
    }
  }

  /* Actualiza la descripción en el espacio inferior debajo de ambas columnas */
  function updateDescriptionPanel() {
    var host = document.getElementById("canDescPanelHost");
    if (!host || !DECK[deckIndex]) return;

    var cur = DECK[deckIndex];

    host.innerHTML = `
      <div class="can-desc-panel">
        <div style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
          ADAPTADOR REQUERIDO
        </div>
        
        <div class="can-desc-badge">${cur.adapter_id}</div>

        <div style="font-size: 14.5px; font-weight: 850; color: #1e293b; margin: 3px 0;">
          ${cur.name}
        </div>

        ${cur.thread ? `<div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Rosca: ${cur.thread}</div>` : ""}

        <div style="background: rgba(255,255,255,0.7); border-radius: 10px; padding: 10px 12px; font-size: 12px; color: #0b5878; line-height: 1.4;">
          💡 ${cur.tip || "Identificá la rosca del pico para enroscar el adaptador correspondiente."}
        </div>
      </div>
    `;
  }

  /* Física de swipe interactivo idéntica a home-tarjetas.js */
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
        el.style.transform = "translateX(" + dx + "px) rotate(" + (dx / 18) + "deg)";
      }
    }, { capture: true, passive: false });

    function soltar() {
      if (!arrastrando) return;
      arrastrando = false;
      el.classList.remove("arrastre");

      if (el.__arrastro && dx < -50) {
        window.canillasDeckNext();
      } else if (el.__arrastro && dx > 50) {
        window.canillasDeckPrev();
      } else if (el.__arrastro) {
        el.classList.add("volver");
        el.style.transform = "";
        setTimeout(function () {
          el.classList.remove("volver");
        }, 350);
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
          <img src="${imgSrc}" style="width: 100%; height: auto; max-width: 520px; display: block; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
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
        
        <!-- Tarjeta Superior: Botones para foto / imagen -->
        <div class="can-simple-card" style="text-align: center; padding: 14px;">
          
          <div style="display: flex; gap: 8px;">
            <button type="button" class="can-btn-cam" onclick="window.canillasTriggerCam()">
              <span>Sacar foto</span>
            </button>

            <button type="button" class="can-btn-gal" onclick="window.canillasTriggerGal()">
              <span>Buscar imagen</span>
            </button>
          </div>

          <!-- Inputs invisibles -->
          <input type="file" id="canNativeCam" accept="image/*" capture="environment" style="display:none" onchange="window.canillasOnFile(event)">
          <input type="file" id="canNativeGal" accept="image/*" style="display:none" onchange="window.canillasOnFile(event)">

        </div>

        <!-- Vista Comparador: Foto izquierda + Mazo estilo Home derecha -->
        <div class="can-simple-card" style="padding: 12px 10px;">
          
          <div class="can-split-row">
            
            <!-- Columna Izquierda: Tu foto -->
            <div class="can-col-user">
              <div class="can-label-tag">Tu foto</div>
              
              <div class="can-user-img-box">
                ${currentPhotoSrc ? `
                  <img src="${currentPhotoSrc}" class="can-user-img">
                ` : `
                  <div style="padding: 16px 8px; text-align: center; color: #94a3b8; font-size: 11px; font-weight: 750;">
                    Subí una foto para comparar
                  </div>
                `}
              </div>

              <div style="display: flex; gap: 4px; margin-top: 8px;">
                <button type="button" class="can-btn-cam" onclick="window.canillasTriggerCam()" style="padding: 7px; font-size: 11px; border-radius: 10px;">
                  Cambiar
                </button>
              </div>
            </div>

            <!-- Columna Derecha: Mazo a tamaño completo -->
            <div class="can-col-deck">
              <div class="can-label-tag">Catálogo PSA (Deslizá)</div>
              
              <div class="can-deck-stage" id="canDeckStage"></div>
            </div>

          </div>

          <!-- Panel de Descripción en el espacio inferior (sin botón repetido) -->
          <div id="canDescPanelHost"></div>

          <!-- Buscador para saltar directo a una carta del mazo -->
          <input type="text" class="can-search-input" placeholder="🔍 Buscá en el mazo (ej. Libby, Arizona, Epuyen, Swing)..." oninput="window.canillasSearchDeck(this.value)">

        </div>

      </div>
    `;

    renderDeckCards();
    updateDescriptionPanel();
  }

})();
