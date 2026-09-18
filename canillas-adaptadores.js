/* ============================================================
   APPI · Canillas & Adaptadores PSA (Guía Oficial V02-21)
   Identificador por foto / cámara + Catálogo de 53 modelos
   ============================================================ */
(function () {
  "use strict";

  var FAUCETS = [{"id": "fv-alabama", "page": 3, "name": "FV Alabama", "brand": "FV", "code": "411.04/27", "adapter_id": "PSA 102", "adapter_name": "Adapt. Rosca macho FV diam. 18,6", "adapter_code": "6-12-01-102-0", "thread_type": "Rosca macho 18,6 mm", "spout_shape": "Curvo alto", "control_type": "Monocomando", "observations": "Rosca macho exterior estándar FV de 18.6mm", "category": "Cocina", "keywords": ["alabama", "411.04/27", "curvo", "monocomando", "102", "18.6"], "image_page": "./canillas-img/pages/page_3.jpg", "image_faucet": "./canillas-img/faucets/faucet_p3.jpg", "image_adapter": "./canillas-img/adapters/adapter_p3.jpg"}, {"id": "fv-allegro", "page": 4, "name": "FV Allegro", "brand": "FV", "code": "0434.01/15-B-CR", "adapter_id": "PSA 149 / PSA 018", "adapter_name": "Adapt. Lavarropas Diam 24 x 1 / Adapt. Rosca Canilla Tipo Patio", "adapter_code": "6-12-01-149-0 / 6-12-01-018-0", "thread_type": "Rosca lavarropas / patio 24x1", "spout_shape": "Lavadero / Lavarropas", "control_type": "Grifo de pared", "observations": "Dispone de opción para adaptar a rosca de patio o salida de lavarropas 24x1.", "category": "Lavadero", "keywords": ["allegro", "lavarropas", "patio", "149", "018", "24x1"], "image_page": "./canillas-img/pages/page_4.jpg", "image_faucet": "./canillas-img/faucets/faucet_p4.jpg", "image_adapter": "./canillas-img/adapters/adapter_p4.jpg"}, {"id": "fv-areco", "page": 5, "name": "FV Areco", "brand": "FV", "code": "424/99", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix estándar", "spout_shape": "Curvo tradicional", "control_type": "Monocomando", "observations": "Compatible directo con Adaptador Unimix PSA 002.", "category": "Cocina", "keywords": ["areco", "424/99", "unimix", "002"], "image_page": "./canillas-img/pages/page_5.jpg", "image_faucet": "./canillas-img/faucets/faucet_p5.jpg", "image_adapter": "./canillas-img/adapters/adapter_p5.jpg"}, {"id": "fv-arizona", "page": 6, "name": "FV Arizona", "brand": "FV", "code": "406/B1", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix estándar", "spout_shape": "Curvo clásico de pared/mesada", "control_type": "Doble comando", "observations": "Una de las canillas más comunes de Argentina. Rosca clásica Unimix.", "category": "Cocina", "keywords": ["arizona", "406/b1", "unimix", "002", "doble comando"], "image_page": "./canillas-img/pages/page_6.jpg", "image_faucet": "./canillas-img/faucets/faucet_p6.jpg", "image_adapter": "./canillas-img/adapters/adapter_p6.jpg"}, {"id": "fv-chess", "page": 7, "name": "FV Chess", "brand": "FV", "code": "418/84", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix estándar", "spout_shape": "Curvo alto estilizado", "control_type": "Doble comando", "observations": "Lleva el adaptador estándar FV Unimix PSA 002.", "category": "Cocina", "keywords": ["chess", "418/84", "unimix", "002"], "image_page": "./canillas-img/pages/page_7.jpg", "image_faucet": "./canillas-img/faucets/faucet_p7.jpg", "image_adapter": "./canillas-img/adapters/adapter_p7.jpg"}, {"id": "fv-cibeles", "page": 8, "name": "FV Cibeles", "brand": "FV", "code": "0411/97", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "adapter_code": "6-12-01-073-0", "thread_type": "Pico sin rosca accesible / Adaptador Múltiple a presión", "spout_shape": "Curvo pico ancho", "control_type": "Monocomando", "observations": "Requiere Adaptador Múltiple PSA 073 colocado a presión en la salida del pico.", "category": "Cocina", "keywords": ["cibeles", "0411/97", "multiple", "073"], "image_page": "./canillas-img/pages/page_8.jpg", "image_faucet": "./canillas-img/faucets/faucet_p8.jpg", "image_adapter": "./canillas-img/adapters/adapter_p8.jpg"}, {"id": "fv-c7-radal", "page": 9, "name": "FV C7 Radal", "brand": "FV", "code": "0410/C7", "adapter_id": "PSA 039", "adapter_name": "Adapt. Rosca Hembra Diametro 22", "adapter_code": "6-12-01-039-0", "thread_type": "Rosca hembra 22 mm", "spout_shape": "Curvo tradicional", "control_type": "Monocomando", "observations": "Lleva rosca hembra de 22mm.", "category": "Cocina", "keywords": ["radal", "c7", "0410/c7", "hembra 22", "039"], "image_page": "./canillas-img/pages/page_9.jpg", "image_faucet": "./canillas-img/faucets/faucet_p9.jpg", "image_adapter": "./canillas-img/adapters/adapter_p9.jpg"}, {"id": "fv-d7-alerce", "page": 10, "name": "FV D7 Alerce", "brand": "FV", "code": "428/D7", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "adapter_code": "6-12-01-144-0", "thread_type": "Rosca embutida 18,2 x 1", "spout_shape": "Curvo moderno", "control_type": "Monocomando", "observations": "ATENCIÓN: Retirar el aireador que se encuentra dentro del casquillo cromado para colocar el adaptador PSA 144.", "category": "Cocina", "keywords": ["alerce", "d7", "428/d7", "casquillo", "144", "18.2"], "image_page": "./canillas-img/pages/page_10.jpg", "image_faucet": "./canillas-img/faucets/faucet_p10.jpg", "image_adapter": "./canillas-img/adapters/adapter_p10.jpg"}, {"id": "fv-denisse", "page": 11, "name": "FV Denisse", "brand": "FV", "code": "0416/64", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix", "spout_shape": "Curvo bajo", "control_type": "Doble comando", "observations": "Compatible directo con PSA 002.", "category": "Cocina", "keywords": ["denisse", "0416/64", "unimix", "002"], "image_page": "./canillas-img/pages/page_11.jpg", "image_faucet": "./canillas-img/faucets/faucet_p11.jpg", "image_adapter": "./canillas-img/adapters/adapter_p11.jpg"}, {"id": "fv-eclipse", "page": 12, "name": "FV Eclipse", "brand": "FV", "code": "411.01/94 / 423/94", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix", "spout_shape": "Curvo monocomando mesada/pared", "control_type": "Monocomando", "observations": "Aplica para modelos 411.01/94 y 423/94 con adaptador PSA 002.", "category": "Cocina", "keywords": ["eclipse", "411.01/94", "423/94", "unimix", "002"], "image_page": "./canillas-img/pages/page_12.jpg", "image_faucet": "./canillas-img/faucets/faucet_p12.jpg", "image_adapter": "./canillas-img/adapters/adapter_p12.jpg"}, {"id": "fv-epuyen", "page": 13, "name": "FV Epuyen (Negra / Cromada)", "brand": "FV", "code": "411.04/L2", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "adapter_code": "6-12-01-073-0", "thread_type": "Pico estilizado / Adapt. Múltiple", "spout_shape": "Curvo alto estilizado contemporáneo", "control_type": "Monocomando", "observations": "Disponible en acabado negro mate y cromo. Utiliza el Adaptador Múltiple PSA 073.", "category": "Cocina de diseño", "keywords": ["epuyen", "negra", "cromada", "411.04/l2", "multiple", "073"], "image_page": "./canillas-img/pages/page_13.jpg", "image_faucet": "./canillas-img/faucets/faucet_p13.jpg", "image_adapter": "./canillas-img/adapters/adapter_p13.jpg"}, {"id": "fv-flow", "page": 14, "name": "FV Flow", "brand": "FV", "code": "411/01/B3", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix", "spout_shape": "Curvo suave", "control_type": "Monocomando", "observations": "Compatible directo con adaptador PSA 002.", "category": "Cocina", "keywords": ["flow", "411/01/b3", "unimix", "002"], "image_page": "./canillas-img/pages/page_14.jpg", "image_faucet": "./canillas-img/faucets/faucet_p14.jpg", "image_adapter": "./canillas-img/adapters/adapter_p14.jpg"}, {"id": "fv-gran-gala", "page": 15, "name": "FV Gran Gala", "brand": "FV", "code": "418/72", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix", "spout_shape": "Curvo tradicional alto", "control_type": "Doble comando", "observations": "Lleva PSA 002 FV Unimix.", "category": "Cocina", "keywords": ["gran gala", "418/72", "unimix", "002"], "image_page": "./canillas-img/pages/page_15.jpg", "image_faucet": "./canillas-img/faucets/faucet_p15.jpg", "image_adapter": "./canillas-img/adapters/adapter_p15.jpg"}, {"id": "fv-kansas", "page": 16, "name": "FV Kansas", "brand": "FV", "code": "411.04/24", "adapter_id": "PSA 102", "adapter_name": "Adapt. Rosca macho FV diam. 18,6", "adapter_code": "6-12-01-102-0", "thread_type": "Rosca macho 18,6 mm", "spout_shape": "Curvo cuello de cisne", "control_type": "Monocomando", "observations": "Utiliza rosca macho FV 18.6mm (PSA 102).", "category": "Cocina", "keywords": ["kansas", "411.04/24", "102", "18.6"], "image_page": "./canillas-img/pages/page_16.jpg", "image_faucet": "./canillas-img/faucets/faucet_p16.jpg", "image_adapter": "./canillas-img/adapters/adapter_p16.jpg"}, {"id": "fv-libby-411", "page": 17, "name": "FV Libby Mesada", "brand": "FV", "code": "411.04/39", "adapter_id": "PSA 135", "adapter_name": "Adapt. Rosca Macho Diam 21 x 1", "adapter_code": "6-12-01-135-0", "thread_type": "Rosca macho 21 x 1", "spout_shape": "Curvo alto monocomando", "control_type": "Monocomando", "observations": "Modelo Libby monocomando mesada 411.04/39 lleva adaptador PSA 135 (21x1).", "category": "Cocina", "keywords": ["libby", "411.04/39", "135", "21x1"], "image_page": "./canillas-img/pages/page_17.jpg", "image_faucet": "./canillas-img/faucets/faucet_p17.jpg", "image_adapter": "./canillas-img/adapters/adapter_p17.jpg"}, {"id": "fv-libby-0426", "page": 18, "name": "FV Libby Pico Recto / Diagonal", "brand": "FV", "code": "0426/39", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "adapter_code": "6-12-01-142-0", "thread_type": "Rosca embutida 16,3 x 1", "spout_shape": "Recto / Diagonal monocomando", "control_type": "Monocomando", "observations": "ATENCIÓN: Retirar el aireador que se encuentra dentro del casquillo cromado para colocar el adaptador PSA 142 (16,3 x 1).", "category": "Cocina / Lavatorio", "keywords": ["libby", "0426/39", "casquillo", "142", "16.3"], "image_page": "./canillas-img/pages/page_18.jpg", "image_faucet": "./canillas-img/faucets/faucet_p18.jpg", "image_adapter": "./canillas-img/adapters/adapter_p18.jpg"}, {"id": "fv-libby-0428", "page": 19, "name": "FV Libby Alta", "brand": "FV", "code": "0428/39", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "adapter_code": "6-12-01-144-0", "thread_type": "Rosca embutida 18,2 x 1", "spout_shape": "Curvo alto monocomando", "control_type": "Monocomando", "observations": "ATENCIÓN: Retirar el aireador que se encuentra dentro del casquillo cromado para colocar el adaptador PSA 144 (18,2 x 1).", "category": "Cocina", "keywords": ["libby", "0428/39", "casquillo", "144", "18.2"], "image_page": "./canillas-img/pages/page_19.jpg", "image_faucet": "./canillas-img/faucets/faucet_p19.jpg", "image_adapter": "./canillas-img/adapters/adapter_p19.jpg"}, {"id": "fv-libby-pared", "page": 20, "name": "FV Libby de Pared", "brand": "FV", "code": "406.03/39-CR / 0406/39", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix", "spout_shape": "Pared monocomando / 2 llaves", "control_type": "Pared (monocomando o 2 llaves)", "observations": "Versión Libby para pared: lleva PSA 002.", "category": "Cocina pared", "keywords": ["libby", "pared", "406.03/39", "0406/39", "unimix", "002"], "image_page": "./canillas-img/pages/page_20.jpg", "image_faucet": "./canillas-img/faucets/faucet_p20.jpg", "image_adapter": "./canillas-img/adapters/adapter_p20.jpg"}, {"id": "fv-melody", "page": 21, "name": "FV Melody", "brand": "FV", "code": "0203/28", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "adapter_code": "6-12-01-142-0", "thread_type": "Rosca embutida 16,3 x 1", "spout_shape": "Bajo angular", "control_type": "Monocomando", "observations": "Retirar el aireador dentro del casquillo cromado. Lleva PSA 142.", "category": "Cocina / Baño", "keywords": ["melody", "0203/28", "casquillo", "142", "16.3"], "image_page": "./canillas-img/pages/page_21.jpg", "image_faucet": "./canillas-img/faucets/faucet_p21.jpg", "image_adapter": "./canillas-img/adapters/adapter_p21.jpg"}, {"id": "fv-nerea-lever", "page": 22, "name": "FV Nerea Lever", "brand": "FV", "code": "0426/59L", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "adapter_code": "6-12-01-142-0", "thread_type": "Rosca embutida 16,3 x 1", "spout_shape": "Inclinado moderno", "control_type": "Monocomando Lever", "observations": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 142.", "category": "Cocina", "keywords": ["nerea", "lever", "0426/59l", "casquillo", "142", "16.3"], "image_page": "./canillas-img/pages/page_22.jpg", "image_faucet": "./canillas-img/faucets/faucet_p22.jpg", "image_adapter": "./canillas-img/adapters/adapter_p22.jpg"}, {"id": "fv-newport", "page": 23, "name": "FV Newport", "brand": "FV", "code": "0411.01/B2", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix", "spout_shape": "Curvo tradicional", "control_type": "Monocomando", "observations": "Lleva el clásico PSA 002.", "category": "Cocina", "keywords": ["newport", "0411.01/b2", "unimix", "002"], "image_page": "./canillas-img/pages/page_23.jpg", "image_faucet": "./canillas-img/faucets/faucet_p23.jpg", "image_adapter": "./canillas-img/adapters/adapter_p23.jpg"}, {"id": "fv-oregon", "page": 24, "name": "FV Oregon", "brand": "FV", "code": "0428/18", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "adapter_code": "6-12-01-144-0", "thread_type": "Rosca embutida 18,2 x 1", "spout_shape": "Curvo estilizado", "control_type": "Monocomando", "observations": "Retirar el aireador dentro del casquillo cromado. Lleva PSA 144 (18,2 x 1).", "category": "Cocina", "keywords": ["oregon", "0428/18", "casquillo", "144", "18.2"], "image_page": "./canillas-img/pages/page_24.jpg", "image_faucet": "./canillas-img/faucets/faucet_p24.jpg", "image_adapter": "./canillas-img/adapters/adapter_p24.jpg"}, {"id": "fv-puelo-411", "page": 25, "name": "FV Puelo Monocomando Alto", "brand": "FV", "code": "411.04/B5", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "adapter_code": "6-12-01-144-0", "thread_type": "Rosca embutida 18,2 x 1", "spout_shape": "Curvo cisne alto contemporáneo", "control_type": "Monocomando", "observations": "Retirar el aireador dentro del casquillo cromado. Lleva adaptador PSA 144.", "category": "Cocina", "keywords": ["puelo", "411.04/b5", "casquillo", "144", "18.2", "cisne"], "image_page": "./canillas-img/pages/page_25.jpg", "image_faucet": "./canillas-img/faucets/faucet_p25.jpg", "image_adapter": "./canillas-img/adapters/adapter_p25.jpg"}, {"id": "fv-puelo-423", "page": 26, "name": "FV Puelo Monocomando Bajo", "brand": "FV", "code": "423/B5", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix", "spout_shape": "Curvo bajo", "control_type": "Monocomando", "observations": "Versión 423/B5 lleva PSA 002 directo.", "category": "Cocina", "keywords": ["puelo", "423/b5", "unimix", "002"], "image_page": "./canillas-img/pages/page_26.jpg", "image_faucet": "./canillas-img/faucets/faucet_p26.jpg", "image_adapter": "./canillas-img/adapters/adapter_p26.jpg"}, {"id": "fv-swing", "page": 27, "name": "FV Swing", "brand": "FV", "code": "411.01/90", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix", "spout_shape": "Curvo estándar", "control_type": "Monocomando", "observations": "Compatible con PSA 002.", "category": "Cocina", "keywords": ["swing", "411.01/90", "unimix", "002"], "image_page": "./canillas-img/pages/page_27.jpg", "image_faucet": "./canillas-img/faucets/faucet_p27.jpg", "image_adapter": "./canillas-img/adapters/adapter_p27.jpg"}, {"id": "fv-swing-duo", "page": 28, "name": "FV Swing Duo", "brand": "FV", "code": "411.03/94", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix", "spout_shape": "Curvo doble palanca", "control_type": "Doble comando", "observations": "Lleva PSA 002 Unimix.", "category": "Cocina", "keywords": ["swing duo", "411.03/94", "unimix", "002"], "image_page": "./canillas-img/pages/page_28.jpg", "image_faucet": "./canillas-img/faucets/faucet_p28.jpg", "image_adapter": "./canillas-img/adapters/adapter_p28.jpg"}, {"id": "fv-swing-plus-multiple", "page": 29, "name": "FV Swing Plus (Instalación Múltiple)", "brand": "FV", "code": "412.01/90 / 0412.01/90CR", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "adapter_code": "6-12-01-073-0", "thread_type": "Extremo manguera extensible", "spout_shape": "Pico extensible / manguera", "control_type": "Monocomando extensible", "observations": "Instalación 1: En el aireador al extremo de la manguera extensible usando Adaptador Múltiple PSA 073.", "category": "Cocina extensible", "keywords": ["swing plus", "extensible", "manguera", "412.01/90", "073"], "image_page": "./canillas-img/pages/page_29.jpg", "image_faucet": "./canillas-img/faucets/faucet_p29.jpg", "image_adapter": "./canillas-img/adapters/adapter_p29.jpg"}, {"id": "fv-swing-plus-rosca", "page": 30, "name": "FV Swing Plus (Instalación Roscada)", "brand": "FV", "code": "412.01/90 / 0412.01/90CR", "adapter_id": "PSA 037 / PSA 148", "adapter_name": "Adapt. Rosca Macho / Hembra Swing Plus", "adapter_code": "6-12-01-037-0 / 6-12-01-148-0", "thread_type": "Rosca específica Swing Plus", "spout_shape": "Pico extensible / manguera", "control_type": "Monocomando extensible", "observations": "Instalación 2: Conexión mediante juego de adaptadores PSA 037 y PSA 148 para rosca interna/externa del rociador extensible.", "category": "Cocina extensible", "keywords": ["swing plus", "extensible", "037", "148"], "image_page": "./canillas-img/pages/page_30.jpg", "image_faucet": "./canillas-img/faucets/faucet_p30.jpg", "image_adapter": "./canillas-img/adapters/adapter_p30.jpg"}, {"id": "fv-temple-multiple", "page": 33, "name": "FV Temple Extensible (Instalación Múltiple)", "brand": "FV", "code": "0412/87", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "adapter_code": "6-12-01-073-0", "thread_type": "Extremo manguera extensible", "spout_shape": "Pico extraíble monocomando", "control_type": "Monocomando extensible", "observations": "Instalación 1: Extremo de la manguera extensible con Adaptador Múltiple PSA 073.", "category": "Cocina extensible", "keywords": ["temple", "extensible", "0412/87", "073"], "image_page": "./canillas-img/pages/page_33.jpg", "image_faucet": "./canillas-img/faucets/faucet_p33.jpg", "image_adapter": "./canillas-img/adapters/adapter_p33.jpg"}, {"id": "fv-temple-rosca", "page": 34, "name": "FV Temple Extensible (Instalación Roscada)", "brand": "FV", "code": "0412/87", "adapter_id": "PSA 037 / PSA 148", "adapter_name": "Adapt. Rosca Macho / Hembra FV Swing Plus / Temple", "adapter_code": "6-12-01-037-0 / 6-12-01-148-0", "thread_type": "Rosca específica rociador extensible", "spout_shape": "Pico extraíble monocomando", "control_type": "Monocomando extensible", "observations": "Instalación 2: Roscado con PSA 037 y PSA 148.", "category": "Cocina extensible", "keywords": ["temple", "extensible", "037", "148"], "image_page": "./canillas-img/pages/page_34.jpg", "image_faucet": "./canillas-img/faucets/faucet_p34.jpg", "image_adapter": "./canillas-img/adapters/adapter_p34.jpg"}, {"id": "fv-temple-fijo", "page": 35, "name": "FV Temple Monocomando Fijo", "brand": "FV", "code": "0411/87 / 0411.02/87", "adapter_id": "PSA 073", "adapter_name": "Adapt. Múltiple", "adapter_code": "6-12-01-073-0", "thread_type": "Pico plano / Adapt. Múltiple", "spout_shape": "Curvo monocomando diseño minimalista", "control_type": "Monocomando", "observations": "Lleva Adaptador Múltiple PSA 073.", "category": "Cocina de diseño", "keywords": ["temple", "0411/87", "0411.02/87", "073"], "image_page": "./canillas-img/pages/page_35.jpg", "image_faucet": "./canillas-img/faucets/faucet_p35.jpg", "image_adapter": "./canillas-img/adapters/adapter_p35.jpg"}, {"id": "fv-tronic", "page": 36, "name": "FV Tronic (Electrónica)", "brand": "FV", "code": "0363.05P", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "adapter_code": "6-12-01-142-0", "thread_type": "Rosca embutida 16,3 x 1", "spout_shape": "Sensor electrónico automático", "control_type": "Electrónico / Sensor", "observations": "Retirar el aireador dentro del casquillo cromado. Lleva PSA 142.", "category": "Electrónica / Comercial", "keywords": ["tronic", "sensor", "0363.05p", "142", "16.3"], "image_page": "./canillas-img/pages/page_36.jpg", "image_faucet": "./canillas-img/faucets/faucet_p36.jpg", "image_adapter": "./canillas-img/adapters/adapter_p36.jpg"}, {"id": "fv-unimix-dos", "page": 37, "name": "FV Unimix Dos", "brand": "FV", "code": "411/91", "adapter_id": "PSA 002 (o PSA 073)", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca FV Unimix", "spout_shape": "Curvo tradicional", "control_type": "Monocomando", "observations": "Lleva Adaptador PSA 002. También es posible colocar el Adaptador Múltiple PSA 073.", "category": "Cocina", "keywords": ["unimix dos", "411/91", "002", "073"], "image_page": "./canillas-img/pages/page_37.jpg", "image_faucet": "./canillas-img/faucets/faucet_p37.jpg", "image_adapter": "./canillas-img/adapters/adapter_p37.jpg"}, {"id": "canilla-duke", "page": 38, "name": "Duke Canilla Plástica Blanca", "brand": "Duke / Otras", "code": "Plástica Blanca", "adapter_id": "PSA 100", "adapter_name": "Adapt. Rosca Hembra BPS 1/2", "adapter_code": "6-12-01-100-0", "thread_type": "Rosca plástica BPS 1/2 pulgada", "spout_shape": "Pared plástica blanca", "control_type": "Canilla simple giratoria", "observations": "Canilla de plástico blanca común de mesada o pileta de lavar. Lleva PSA 100 (BPS 1/2).", "category": "Económica / Lavadero", "keywords": ["duke", "plastica", "blanca", "100", "bps 1/2", "pileta"], "image_page": "./canillas-img/pages/page_38.jpg", "image_faucet": "./canillas-img/faucets/faucet_p38.jpg", "image_adapter": "./canillas-img/adapters/adapter_p38.jpg"}, {"id": "discovery-curve", "page": 39, "name": "Discovery Curve Monocomando", "brand": "Discovery", "code": "905", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "adapter_code": "6-12-01-144-0", "thread_type": "Rosca embutida 18,2 x 1", "spout_shape": "Curvo cuello alto", "control_type": "Monocomando", "observations": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 144.", "category": "Cocina", "keywords": ["discovery", "curve", "905", "144", "18.2"], "image_page": "./canillas-img/pages/page_39.jpg", "image_faucet": "./canillas-img/faucets/faucet_p39.jpg", "image_adapter": "./canillas-img/adapters/adapter_p39.jpg"}, {"id": "discovery-recto", "page": 40, "name": "Discovery Recto Monocomando", "brand": "Discovery", "code": "910", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "adapter_code": "6-12-01-144-0", "thread_type": "Rosca embutida 18,2 x 1", "spout_shape": "Recto inclinado", "control_type": "Monocomando", "observations": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 144.", "category": "Cocina", "keywords": ["discovery", "recto", "910", "144", "18.2"], "image_page": "./canillas-img/pages/page_40.jpg", "image_faucet": "./canillas-img/faucets/faucet_p40.jpg", "image_adapter": "./canillas-img/adapters/adapter_p40.jpg"}, {"id": "jockey-curve", "page": 41, "name": "Jockey Curve Monocomando", "brand": "Jockey", "code": "6380", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "adapter_code": "6-12-01-144-0", "thread_type": "Rosca embutida 18,2 x 1", "spout_shape": "Curvo elegante", "control_type": "Monocomando", "observations": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 144.", "category": "Cocina", "keywords": ["jockey", "curve", "6380", "144", "18.2"], "image_page": "./canillas-img/pages/page_41.jpg", "image_faucet": "./canillas-img/faucets/faucet_p41.jpg", "image_adapter": "./canillas-img/adapters/adapter_p41.jpg"}, {"id": "jockey-recto", "page": 42, "name": "Jockey Recto Monocomando", "brand": "Jockey", "code": "6370", "adapter_id": "PSA 144", "adapter_name": "Adapt. Rosca Macho 18,2 x 1", "adapter_code": "6-12-01-144-0", "thread_type": "Rosca embutida 18,2 x 1", "spout_shape": "Recto inclinado", "control_type": "Monocomando", "observations": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 144.", "category": "Cocina", "keywords": ["jockey", "recto", "6370", "144", "18.2"], "image_page": "./canillas-img/pages/page_42.jpg", "image_faucet": "./canillas-img/faucets/faucet_p42.jpg", "image_adapter": "./canillas-img/adapters/adapter_p42.jpg"}, {"id": "unicontrol-innovation", "page": 43, "name": "Unicontrol Innovation", "brand": "Unicontrol", "code": "4001 / 4015 / 4070 / 4075", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "adapter_code": "6-12-01-142-0", "thread_type": "Rosca embutida 16,3 x 1", "spout_shape": "Curvo monocomando", "control_type": "Monocomando", "observations": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 142.", "category": "Cocina", "keywords": ["unicontrol", "innovation", "4001", "4015", "4070", "4075", "142", "16.3"], "image_page": "./canillas-img/pages/page_43.jpg", "image_faucet": "./canillas-img/faucets/faucet_p43.jpg", "image_adapter": "./canillas-img/adapters/adapter_p43.jpg"}, {"id": "unicontrol-one", "page": 44, "name": "Unicontrol One", "brand": "Unicontrol", "code": "3001 / 3015 / 3070", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "adapter_code": "6-12-01-142-0", "thread_type": "Rosca embutida 16,3 x 1", "spout_shape": "Curvo monocomando", "control_type": "Monocomando", "observations": "Retirar el aireador que se encuentra dentro del casquillo cromado. Lleva PSA 142.", "category": "Cocina", "keywords": ["unicontrol", "one", "3001", "3015", "3070", "142", "16.3"], "image_page": "./canillas-img/pages/page_44.jpg", "image_faucet": "./canillas-img/faucets/faucet_p44.jpg", "image_adapter": "./canillas-img/adapters/adapter_p44.jpg"}, {"id": "piazza-dot", "page": 45, "name": "Piazza Dot", "brand": "Piazza", "code": "10112", "adapter_id": "PSA 002 (o PSA 073)", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca macho estándar / múltiple", "spout_shape": "Curvo estilizado Piazza", "control_type": "Monocomando", "observations": "Lleva PSA 002. También es posible en esta canilla colocar el Adaptador Múltiple PSA 073.", "category": "Cocina", "keywords": ["piazza", "dot", "10112", "002", "073"], "image_page": "./canillas-img/pages/page_45.jpg", "image_faucet": "./canillas-img/faucets/faucet_p45.jpg", "image_adapter": "./canillas-img/adapters/adapter_p45.jpg"}, {"id": "piazza-emblem-10014", "page": 46, "name": "Piazza Emblem 10014", "brand": "Piazza", "code": "10014", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "adapter_code": "6-12-01-142-0", "thread_type": "Rosca embutida 16,3 x 1", "spout_shape": "Curvo minimalista", "control_type": "Monocomando", "observations": "Modelo Emblem 10014 lleva PSA 142 (16,3 x 1).", "category": "Cocina", "keywords": ["piazza", "emblem", "10014", "142", "16.3"], "image_page": "./canillas-img/pages/page_46.jpg", "image_faucet": "./canillas-img/faucets/faucet_p46.jpg", "image_adapter": "./canillas-img/adapters/adapter_p46.jpg"}, {"id": "piazza-emblem-10016ne", "page": 47, "name": "Piazza Emblem 10016NE (Negra)", "brand": "Piazza", "code": "10016NE", "adapter_id": "PSA 039", "adapter_name": "Adapt. Rosca Hembra Diametro 22", "adapter_code": "6-12-01-039-0", "thread_type": "Rosca hembra 22 mm", "spout_shape": "Curvo alto acabado negro mate", "control_type": "Monocomando", "observations": "Modelo Emblem negro mate 10016NE: lleva PSA 039 (rosca hembra diam. 22).", "category": "Cocina de diseño", "keywords": ["piazza", "emblem", "10016ne", "negra", "039", "hembra 22"], "image_page": "./canillas-img/pages/page_47.jpg", "image_faucet": "./canillas-img/faucets/faucet_p47.jpg", "image_adapter": "./canillas-img/adapters/adapter_p47.jpg"}, {"id": "fox-40028", "page": 48, "name": "Fox Monocomando", "brand": "Fox", "code": "400.28", "adapter_id": "PSA 019", "adapter_name": "Adapt. Rosca M-H 18,1", "adapter_code": "6-12-01-019-0", "thread_type": "Rosca Macho-Hembra 18,1", "spout_shape": "Curvo tradicional", "control_type": "Monocomando", "observations": "Lleva PSA 019 específico para rosca Fox 18,1.", "category": "Cocina", "keywords": ["fox", "400.28", "019", "18.1"], "image_page": "./canillas-img/pages/page_48.jpg", "image_faucet": "./canillas-img/faucets/faucet_p48.jpg", "image_adapter": "./canillas-img/adapters/adapter_p48.jpg"}, {"id": "radisson-gb4c", "page": 49, "name": "Radisson GB4C (Pico Rectangular)", "brand": "Radisson", "code": "GB4C", "adapter_id": "PSA 177", "adapter_name": "Adapt. Rectangular p/pegar", "adapter_code": "6-12-01-177-0", "thread_type": "Pico rectangular / pegado", "spout_shape": "Cascada / Rectangular plano", "control_type": "Monocomando", "observations": "Pico rectangular sin rosca circular. Requiere adaptador rectangular PSA 177 fijado con adhesivo especial suministrado por PSA.", "category": "Cascada / Diseño", "keywords": ["radisson", "gb4c", "rectangular", "pegar", "177", "cascada"], "image_page": "./canillas-img/pages/page_49.jpg", "image_faucet": "./canillas-img/faucets/faucet_p49.jpg", "image_adapter": "./canillas-img/adapters/adapter_p49.jpg"}, {"id": "betis-20134", "page": 50, "name": "Betis", "brand": "Clever / Otras", "code": "20-134", "adapter_id": "PSA 142", "adapter_name": "Adapt. Rosca Macho 16,3 x 1", "adapter_code": "6-12-01-142-0", "thread_type": "Rosca macho 16,3 x 1", "spout_shape": "Curvo monocomando", "control_type": "Monocomando", "observations": "Lleva PSA 142.", "category": "Cocina", "keywords": ["betis", "20-134", "142", "16.3"], "image_page": "./canillas-img/pages/page_50.jpg", "image_faucet": "./canillas-img/faucets/faucet_p50.jpg", "image_adapter": "./canillas-img/adapters/adapter_p50.jpg"}, {"id": "mallorca-60131", "page": 51, "name": "Mallorca", "brand": "Clever / Otras", "code": "60-131", "adapter_id": "PSA 164", "adapter_name": "Adapt. rosca macho 20 x 1", "adapter_code": "6-12-01-164-0", "thread_type": "Rosca macho 20 x 1", "spout_shape": "Curvo alto", "control_type": "Monocomando", "observations": "Lleva PSA 164 con rosca de 20 x 1.", "category": "Cocina", "keywords": ["mallorca", "60-131", "164", "20x1"], "image_page": "./canillas-img/pages/page_51.jpg", "image_faucet": "./canillas-img/faucets/faucet_p51.jpg", "image_adapter": "./canillas-img/adapters/adapter_p51.jpg"}, {"id": "santander-20135", "page": 52, "name": "Santander", "brand": "Clever / Otras", "code": "20-135", "adapter_id": "PSA 164", "adapter_name": "Adapt. rosca macho 20 x 1", "adapter_code": "6-12-01-164-0", "thread_type": "Rosca macho 20 x 1", "spout_shape": "Curvo monocomando", "control_type": "Monocomando", "observations": "Lleva PSA 164 con rosca de 20 x 1.", "category": "Cocina", "keywords": ["santander", "20-135", "164", "20x1"], "image_page": "./canillas-img/pages/page_52.jpg", "image_faucet": "./canillas-img/faucets/faucet_p52.jpg", "image_adapter": "./canillas-img/adapters/adapter_p52.jpg"}, {"id": "saona-infinity", "page": 53, "name": "Saona Infinity (Pico Rectangular)", "brand": "Clever", "code": "97856", "adapter_id": "PSA 177", "adapter_name": "Adapt. Rectangular p/pegar", "adapter_code": "6-12-01-177-0", "thread_type": "Pico rectangular / pegado", "spout_shape": "Cascada / Rectangular plano", "control_type": "Monocomando", "observations": "Pico rectangular sin rosca cilíndrica. Lleva adaptador rectangular PSA 177 para pegar.", "category": "Cascada / Diseño", "keywords": ["saona", "infinity", "97856", "rectangular", "pegar", "177"], "image_page": "./canillas-img/pages/page_53.jpg", "image_faucet": "./canillas-img/faucets/faucet_p53.jpg", "image_adapter": "./canillas-img/adapters/adapter_p53.jpg"}, {"id": "perugia", "page": 54, "name": "Perugia", "brand": "Otras marcas", "code": "Perugia", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca estándar Unimix", "spout_shape": "Curvo", "control_type": "Monocomando", "observations": "Compatible con PSA 002.", "category": "Cocina", "keywords": ["perugia", "unimix", "002"], "image_page": "./canillas-img/pages/page_54.jpg", "image_faucet": "./canillas-img/faucets/faucet_p54.jpg", "image_adapter": "./canillas-img/adapters/adapter_p54.jpg"}, {"id": "modern-08510f", "page": 55, "name": "Modern", "brand": "Otras marcas", "code": "08510F", "adapter_id": "PSA 002", "adapter_name": "Adapt. Rosca FV Unimix", "adapter_code": "6-12-01-002-0", "thread_type": "Rosca estándar Unimix", "spout_shape": "Curvo", "control_type": "Monocomando", "observations": "Lleva adaptador PSA 002.", "category": "Cocina", "keywords": ["modern", "08510f", "unimix", "002"], "image_page": "./canillas-img/pages/page_55.jpg", "image_faucet": "./canillas-img/faucets/faucet_p55.jpg", "image_adapter": "./canillas-img/adapters/adapter_p55.jpg"}, {"id": "patio-media", "page": 56, "name": "Canilla de Patio / Jardín 1/2 pulgada", "brand": "Canillas de patio / jardín", "code": "1/2 Pulgada", "adapter_id": "PSA 100", "adapter_name": "Adapt. Rosca Hembra BPS 1/2", "adapter_code": "6-12-01-100-0", "thread_type": "Rosca exterior macho 1/2 gas / BSP", "spout_shape": "Canilla de bronce/niquelada de jardín o lavadero", "control_type": "Volante / Manija esférica", "observations": "Canilla de servicio exterior de 1/2\". Se enrosca directamente el adaptador PSA 100.", "category": "Patio / Exterior", "keywords": ["patio", "jardin", "1/2", "media pulgada", "100", "bronce"], "image_page": "./canillas-img/pages/page_56.jpg", "image_faucet": "./canillas-img/faucets/faucet_p56.jpg", "image_adapter": "./canillas-img/adapters/adapter_p56.jpg"}, {"id": "patio-tres-cuartos", "page": 57, "name": "Canilla de Patio / Jardín 3/4 pulgada", "brand": "Canillas de patio / jardín", "code": "3/4 Pulgada", "adapter_id": "PSA 018", "adapter_name": "Adapt. Rosca Canilla Tipo Patio 3/4", "adapter_code": "6-12-01-018-0", "thread_type": "Rosca exterior macho 3/4 gas / BSP", "spout_shape": "Canilla de bronce/niquelada de patio", "control_type": "Volante / Manija esférica", "observations": "Canilla de servicio exterior de 3/4\". Se enrosca directamente el adaptador PSA 018.", "category": "Patio / Exterior", "keywords": ["patio", "jardin", "3/4", "tres cuartos", "018", "bronce"], "image_page": "./canillas-img/pages/page_57.jpg", "image_faucet": "./canillas-img/faucets/faucet_p57.jpg", "image_adapter": "./canillas-img/adapters/adapter_p57.jpg"}];
  var ADAPTERS = [{"id": "PSA 002", "name": "Adaptador Rosca FV Unimix", "code": "6-12-01-002-0", "thread": "Rosca FV Unimix estándar", "description": "El adaptador más utilizado para griferías estándar de la marca FV y modelos similares monocomando o doble comando sin aireador embutido.", "sample_faucets": ["FV Areco", "FV Arizona", "FV Chess", "FV Denisse", "FV Eclipse", "FV Flow", "FV Gran Gala", "FV Newport", "FV Puelo (bajo)", "FV Swing", "FV Swing Duo", "FV Unimix Dos", "Piazza Dot", "Perugia", "Modern"], "icon": "🔄"}, {"id": "PSA 018", "name": "Adaptador Rosca Canilla Tipo Patio 3/4\"", "code": "6-12-01-018-0", "thread": "Rosca macho de 3/4\" gas / BSP", "description": "Para canillas de servicio exterior, jardín, patio o lavadero con rosca estándar de 3/4 de pulgada.", "sample_faucets": ["Canilla de patio 3/4\"", "FV Allegro"], "icon": "🚿"}, {"id": "PSA 019", "name": "Adaptador Rosca Macho-Hembra 18,1", "code": "6-12-01-019-0", "thread": "Rosca 18,1 mm específica", "description": "Diseñado especialmente para la grifería Fox 400.28 con rosca especial de 18,1 mm.", "sample_faucets": ["Fox 400.28"], "icon": "🔩"}, {"id": "PSA 037", "name": "Adaptador Rosca Macho (FV Swing Plus / Temple)", "code": "6-12-01-037-0", "thread": "Rosca macho para cabezal de manguera extensible", "description": "Se utiliza en combinación con el adaptador PSA 148 para canillas FV con rociador extensible (Swing Plus y Temple).", "sample_faucets": ["FV Swing Plus extensible", "FV Temple extensible"], "icon": "🚰"}, {"id": "PSA 039", "name": "Adaptador Rosca Hembra Diámetro 22", "code": "6-12-01-039-0", "thread": "Rosca hembra M22 interior", "description": "Para canillas que presentan rosca macho exterior de 22 mm en la punta del pico.", "sample_faucets": ["FV C7 Radal", "Piazza Emblem 10016NE"], "icon": "⭕"}, {"id": "PSA 073", "name": "Adaptador Múltiple a Presión", "code": "6-12-01-073-0", "thread": "Sin rosca / Ajuste mediante abrazadera y goma de silicona", "description": "Adaptador universal para picos lisos, curvos, cuadrados o con aireadores no desmontables sin rosca tradicional.", "sample_faucets": ["FV Epuyen (Negra/Cromada)", "FV Cibeles", "FV Swing Plus", "FV Temple Fijo y Extensible", "FV Unimix Dos", "Piazza Dot"], "icon": "🗜️"}, {"id": "PSA 100", "name": "Adaptador Rosca Hembra BPS 1/2\"", "code": "6-12-01-100-0", "thread": "Rosca gas 1/2\" pulgada BSP", "description": "Para canillas de plástico blanco (tipo Duke), canillas de pileta de lavar o canillas de patio de 1/2 pulgada.", "sample_faucets": ["Duke plástica blanca", "Canilla de patio 1/2\""], "icon": "🚰"}, {"id": "PSA 102", "name": "Adaptador Rosca Macho FV Diámetro 18,6", "code": "6-12-01-102-0", "thread": "Rosca macho 18,6 mm", "description": "Para modelos específicos de FV como Alabama y Kansas que poseen rosca interna de 18,6 mm.", "sample_faucets": ["FV Alabama", "FV Kansas"], "icon": "🔧"}, {"id": "PSA 135", "name": "Adaptador Rosca Macho Diámetro 21 x 1", "code": "6-12-01-135-0", "thread": "Rosca macho métrica 21 x 1", "description": "Para el modelo clásico FV Libby mesada monocomando 411.04/39.", "sample_faucets": ["FV Libby 411.04/39"], "icon": "⚙️"}, {"id": "PSA 142", "name": "Adaptador Rosca Macho 16,3 x 1 (Casquillo)", "code": "6-12-01-142-0", "thread": "Rosca macho métrica 16,3 x 1 (oculta/embutida)", "description": "Uno de los adaptadores más requeridos en griferías modernas. Se desenrosca el casquillo cromado del pico, se retira el aireador de plástico interior y se enrosca el PSA 142.", "sample_faucets": ["FV Libby 0426/39", "FV Melody", "FV Nerea Lever", "FV Tronic", "Unicontrol Innovation", "Unicontrol One", "Piazza Emblem 10014", "Betis"], "icon": "⭐"}, {"id": "PSA 144", "name": "Adaptador Rosca Macho 18,2 x 1 (Casquillo)", "code": "6-12-01-144-0", "thread": "Rosca macho métrica 18,2 x 1 (oculta/embutida)", "description": "El otro adaptador estrella para griferías de diseño. Se desenrosca el casquillo cromado del pico, se saca el aireador interno y se enrosca este adaptador.", "sample_faucets": ["FV D7 Alerce", "FV Libby 0428/39", "FV Oregon", "FV Puelo (alto)", "Discovery Curve", "Discovery Recto", "Jockey Curve", "Jockey Recto"], "icon": "⭐"}, {"id": "PSA 148", "name": "Adaptador Rosca Hembra (FV Swing Plus / Temple)", "code": "6-12-01-148-0", "thread": "Rosca hembra complementaria", "description": "Se utiliza junto con el PSA 037 en canillas FV con manguera extensible.", "sample_faucets": ["FV Swing Plus", "FV Temple Extensible"], "icon": "🔗"}, {"id": "PSA 149", "name": "Adaptador Lavarropas Diámetro 24 x 1", "code": "6-12-01-149-0", "thread": "Rosca macho métrica 24 x 1", "description": "Para salidas especiales tipo conexión de lavarropas o lavavajillas como la FV Allegro.", "sample_faucets": ["FV Allegro"], "icon": "🌀"}, {"id": "PSA 164", "name": "Adaptador Rosca Macho 20 x 1", "code": "6-12-01-164-0", "thread": "Rosca macho métrica 20 x 1", "description": "Para griferías importadas o modelos específicos como Clever Mallorca y Clever Santander.", "sample_faucets": ["Mallorca 60-131", "Santander 20-135"], "icon": "🔩"}, {"id": "PSA 177", "name": "Adaptador Rectangular para Pegar", "code": "6-12-01-177-0", "thread": "Pico rectangular / Adhesivo bicomponente", "description": "Especialmente diseñado para griferías modernas tipo cascada o picos rectangulares planos donde no existe rosca circular.", "sample_faucets": ["Radisson GB4C", "Saona Infinity"], "icon": "📐"}];

  var state = {
    activeSubTab: "foto",
    brandFilter: "Todas",
    searchQuery: "",
    selectedSample: null,
    userPhotoSrc: null,
    currentResult: null,
    currentResultPage: 3
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"\']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Inject Styles
  function injectStyles() {
    if ($("canillas-styles")) return;
    var style = document.createElement("style");
    style.id = "canillas-styles";
    style.textContent = `
      .canillas-wrap {
        padding: 12px 14px 40px;
        max-width: 900px;
        margin: 0 auto;
        font-family: inherit;
      }
      .can-tabs {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 8px;
        margin-bottom: 14px;
        scrollbar-width: none;
      }
      .can-tabs::-webkit-scrollbar { display: none; }
      .can-tab-btn {
        border: 1px solid rgba(10, 77, 161, 0.15);
        background: rgba(255, 255, 255, 0.7);
        border-radius: 14px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 800;
        color: #475569;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
      }
      .can-tab-btn.active {
        background: #0284c7;
        color: #ffffff;
        border-color: #0284c7;
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
      }
      body.dark .can-tab-btn {
        background: #1e293b;
        color: #94a3b8;
        border-color: rgba(255, 255, 255, 0.08);
      }
      body.dark .can-tab-btn.active {
        background: #0284c7;
        color: #ffffff;
      }
      .can-card {
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(226, 232, 240, 0.9);
        border-radius: 20px;
        padding: 16px;
        margin-bottom: 14px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      }
      body.dark .can-card {
        background: #1e293b;
        border-color: rgba(255, 255, 255, 0.08);
      }
      .can-hero {
        background: linear-gradient(135deg, #0369a1, #0284c7, #38bdf8);
        border-radius: 22px;
        padding: 18px 20px;
        color: #ffffff;
        margin-bottom: 14px;
        box-shadow: 0 8px 24px rgba(2, 132, 199, 0.28);
      }
      .can-hero h2 {
        margin: 0 0 6px;
        font-size: 18px;
        font-weight: 900;
        letter-spacing: -0.3px;
      }
      .can-hero p {
        margin: 0;
        font-size: 12px;
        opacity: 0.92;
        line-height: 1.45;
      }
      .can-dropzone {
        border: 2px dashed #93c5fd;
        border-radius: 18px;
        background: rgba(239, 246, 255, 0.6);
        padding: 24px 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .can-dropzone:hover {
        border-color: #0284c7;
        background: rgba(239, 246, 255, 0.95);
      }
      body.dark .can-dropzone {
        border-color: #334155;
        background: rgba(15, 23, 42, 0.5);
      }
      .can-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 10px 0 14px;
      }
      .can-chip {
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        border-radius: 12px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 750;
        color: #334155;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .can-chip:hover, .can-chip:active {
        border-color: #0284c7;
        background: #e0f2fe;
        color: #0369a1;
      }
      body.dark .can-chip {
        background: #0f172a;
        color: #cbd5e1;
        border-color: #334155;
      }
      .can-actions-row {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .can-btn-cam {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 13px;
        border-radius: 16px;
        background: #0284c7;
        color: #ffffff;
        border: none;
        font-size: 13px;
        font-weight: 850;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
      }
      .can-btn-gal {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 13px;
        border-radius: 16px;
        background: #f1f5f9;
        color: #334155;
        border: 1px solid #cbd5e1;
        font-size: 13px;
        font-weight: 850;
        cursor: pointer;
      }
      body.dark .can-btn-gal {
        background: #334155;
        color: #f1f5f9;
        border-color: #475569;
      }
      .can-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 12px;
      }
      .can-item-card {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #e2e8f0;
        border-radius: 18px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
      body.dark .can-item-card {
        background: #1e293b;
        border-color: rgba(255, 255, 255, 0.08);
      }
      .can-item-img {
        height: 160px;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        position: relative;
        cursor: pointer;
      }
      body.dark .can-item-img {
        background: #0f172a;
      }
      .can-item-img img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .can-tag {
        position: absolute;
        top: 8px;
        left: 8px;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 2px 7px;
        font-size: 10px;
        font-weight: 900;
        color: #334155;
      }
      body.dark .can-tag {
        background: #1e293b;
        color: #f1f5f9;
        border-color: #334155;
      }
      .can-badge-psa {
        background: rgba(2, 132, 199, 0.1);
        border: 1px solid rgba(2, 132, 199, 0.25);
        border-radius: 12px;
        padding: 8px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 8px 0;
      }
      .can-modal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 14px;
      }
      .can-modal-content {
        background: #ffffff;
        border-radius: 20px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      body.dark .can-modal-content {
        background: #1e293b;
      }
    `;
    document.head.appendChild(style);
  }

  // Build the entire view inside #canillasCont
  function renderView() {
    var cont = $("canillasCont");
    if (!cont) return;

    injectStyles();

    cont.innerHTML = `
      <div class="canillas-wrap">
        
        <!-- Navigation Pills -->
        <div class="can-tabs">
          <button type="button" class="can-tab-btn ${state.activeSubTab === "foto" ? "active" : ""}" onclick="window.canillasSetSubTab('foto')">
            📸 Identificar Canilla
          </button>
          <button type="button" class="can-tab-btn ${state.activeSubTab === "catalogo" ? "active" : ""}" onclick="window.canillasSetSubTab('catalogo')">
            🔍 Catálogo Griferías (${FAUCETS.length})
          </button>
          <button type="button" class="can-tab-btn ${state.activeSubTab === "adaptadores" ? "active" : ""}" onclick="window.canillasSetSubTab('adaptadores')">
            🔩 15 Adaptadores PSA
          </button>
          <button type="button" class="can-tab-btn ${state.activeSubTab === "guia" ? "active" : ""}" onclick="window.canillasSetSubTab('guia')">
            📏 Medir Rosca
          </button>
        </div>

        <div id="canillasSubContent"></div>

      </div>

      <!-- Modal PDF -->
      <div id="canillasModalPdf" class="can-modal" style="display:none">
        <div class="can-modal-content">
          <div style="padding:12px 16px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center">
            <div>
              <strong id="canModalTitle" style="font-size:14px; color:#0f172a">Hoja Oficial PSA</strong>
              <div style="font-size:11px; color:#64748b">Manual de selección de adaptadores</div>
            </div>
            <button type="button" onclick="window.canillasCloseModal()" style="border:none; background:#f1f5f9; border-radius:50%; width:32px; height:32px; font-weight:900; cursor:pointer">✕</button>
          </div>
          <div style="flex:1; overflow:auto; padding:12px; background:#0f172a; display:flex; align-items:center; justify-content:center">
            <img id="canModalImg" src="" style="max-width:100%; max-height:75vh; object-fit:contain; border-radius:8px">
          </div>
        </div>
      </div>
    `;

    renderSubContent();
  }

  function renderSubContent() {
    var host = $("canillasSubContent");
    if (!host) return;

    if (state.activeSubTab === "foto") {
      renderFotoTab(host);
    } else if (state.activeSubTab === "catalogo") {
      renderCatalogoTab(host);
    } else if (state.activeSubTab === "adaptadores") {
      renderAdaptadoresTab(host);
    } else if (state.activeSubTab === "guia") {
      renderGuiaTab(host);
    }
  }

  // TAB 1: IDENTIFICADOR
  function renderFotoTab(host) {
    host.innerHTML = `
      <div class="can-hero">
        <h2>¿Qué adaptador lleva tu canilla?</h2>
        <p>Sacale una foto al pico o elegí un modelo de prueba. Identificá al instante el adaptador oficial PSA, medidas y modo de colocación.</p>
      </div>

      <div class="can-card">
        <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px">
          ⚡ Probar al instante con modelos reales (1 clic):
        </div>
        <div class="can-chips">
          <button type="button" class="can-chip" onclick="window.canillasTestSample('fv-libby-0426')">FV Libby (Pico Recto)</button>
          <button type="button" class="can-chip" onclick="window.canillasTestSample('fv-puelo-411')">FV Puelo (Curvo Alto)</button>
          <button type="button" class="can-chip" onclick="window.canillasTestSample('fv-arizona')">FV Arizona (2 Llaves)</button>
          <button type="button" class="can-chip" onclick="window.canillasTestSample('fv-epuyen')">FV Epuyen Negra</button>
          <button type="button" class="can-chip" onclick="window.canillasTestSample('fv-swing-plus-multiple')">FV Swing Plus (Extensible)</button>
          <button type="button" class="can-chip" onclick="window.canillasTestSample('piazza-dot')">Piazza Dot</button>
          <button type="button" class="can-chip" onclick="window.canillasTestSample('radisson-gb4c')">Radisson (Cascada)</button>
          <button type="button" class="can-chip" onclick="window.canillasTestSample('patio-tres-cuartos')">Canilla Patio 3/4"</button>
        </div>

        <!-- Hidden Inputs -->
        <input type="file" id="canFileCam" accept="image/*" capture="environment" style="display:none" onchange="window.canillasOnFile(event)">
        <input type="file" id="canFileGal" accept="image/*" style="display:none" onchange="window.canillasOnFile(event)">

        <!-- Dropzone / Preview -->
        <div class="can-dropzone" onclick="$('canFileGal').click()">
          <div id="canDropPlaceholder" style="${state.userPhotoSrc ? "display:none" : ""}">
            <div style="font-size:42px; margin-bottom:8px">📸</div>
            <div style="font-size:14px; font-weight:850; color:#1e293b">Tomar o subir foto de la canilla</div>
            <div style="font-size:11px; color:#64748b; margin-top:4px">Mostrá bien la forma del pico y la rosca o aireador</div>
          </div>
          <div id="canDropPreview" style="${state.userPhotoSrc ? "" : "display:none"}">
            <img id="canPreviewImg" src="${state.userPhotoSrc || ""}" style="max-height:200px; border-radius:12px; object-fit:contain; border:1px solid #cbd5e1">
            <div style="font-size:11px; font-weight:750; color:#0284c7; margin-top:6px">Foto cargada para análisis</div>
          </div>
        </div>

        <div class="can-actions-row">
          <button type="button" class="can-btn-cam" onclick="$('canFileCam').click()">
            <span>📷</span> Sacar Foto
          </button>
          <button type="button" class="can-btn-gal" onclick="$('canFileGal').click()">
            <span>📁</span> Galería
          </button>
        </div>

        <!-- Optional precision wizard -->
        <div style="margin-top:14px; padding-top:14px; border-top:1px solid #e2e8f0">
          <details>
            <summary style="font-size:12px; font-weight:800; color:#0284c7; cursor:pointer">
              🎯 Ajuste visual de precisión (opcional)
            </summary>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px">
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b">FORMA DEL PICO</label>
                <select id="canOptSpout" onchange="window.canillasRunScoring()" style="width:100%; font-size:11px; padding:6px; border-radius:8px; border:1px solid #cbd5e1">
                  <option value="">Automático</option>
                  <option value="curvo">Curvo / Cisne</option>
                  <option value="recto">Recto / Inclinado</option>
                  <option value="extensible">Extensible / Manguera</option>
                  <option value="cascada">Rectangular / Cascada</option>
                  <option value="patio">Canilla de patio</option>
                </select>
              </div>
              <div>
                <label style="font-size:10px; font-weight:800; color:#64748b">TIPO DE AIREADOR</label>
                <select id="canOptThread" onchange="window.canillasRunScoring()" style="width:100%; font-size:11px; padding:6px; border-radius:8px; border:1px solid #cbd5e1">
                  <option value="">Automático</option>
                  <option value="casquillo">Tiene casquillo cromado</option>
                  <option value="visible_macho">Rosca visible Unimix</option>
                  <option value="visible_hembra">Rosca adentro del pico</option>
                  <option value="manguera">Extremo de manguera</option>
                  <option value="rectangular">Pico plano rectangular</option>
                </select>
              </div>
            </div>
          </details>
        </div>

      </div>

      <!-- Result Card -->
      <div id="canResultArea" style="${state.currentResult ? "" : "display:none"}"></div>
    `;

    if (state.currentResult) {
      renderResultCard();
    }
  }

  // RENDER IDENTIFIED RESULT
  function renderResultCard() {
    var resArea = $("canResultArea");
    if (!resArea || !state.currentResult) return;

    var res = state.currentResult;
    var faucet = res.item;
    var adapter = res.adapter;
    var conf = res.score;
    state.currentResultPage = faucet.page;

    var waMsg = "Hola! Identifiqué mi canilla *" + faucet.name + "* (Cód. " + faucet.code + ") en el catálogo PSA y necesito el adaptador *" + faucet.adapter_id + "* (Cód. PSA " + faucet.adapter_code + "). ¿Tienen disponibilidad?";
    var waUrl = "https://wa.me/?text=" + encodeURIComponent(waMsg);

    resArea.innerHTML = `
      <div class="can-card" style="border: 2px solid #0284c7; background: #ffffff; box-shadow: 0 8px 30px rgba(2, 132, 199, 0.15)">
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:10px">
          <div>
            <span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:8px; font-size:10px; font-weight:900; text-transform:uppercase">
              ¡Canilla Identificada!
            </span>
            <h3 style="margin:6px 0 0; font-size:18px; font-weight:900; color:#0f172a">${esc(faucet.name)}</h3>
            <div style="font-size:11px; color:#64748b; font-family:monospace">Cód: ${esc(faucet.code)} · Marca: ${esc(faucet.brand)}</div>
          </div>
          <div style="text-align:right">
            <span style="font-size:10px; font-weight:800; color:#64748b; text-transform:uppercase">Confianza</span>
            <div style="font-size:20px; font-weight:950; color:#0284c7">${conf}%</div>
          </div>
        </div>

        <!-- Comparative photos -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px">
          <div style="text-align:center">
            <div style="height:120px; border-radius:14px; background:#0f172a; display:flex; align-items:center; justify-content:center; overflow:hidden">
              <img src="${state.userPhotoSrc || faucet.image_faucet}" style="max-height:100%; max-width:100%; object-fit:contain">
            </div>
            <span style="font-size:10px; font-weight:800; color:#64748b; margin-top:4px; display:block">TU FOTO</span>
          </div>
          <div style="text-align:center">
            <div style="height:120px; border-radius:14px; background:#f8fafc; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; overflow:hidden">
              <img src="${faucet.image_faucet}" style="max-height:100%; max-width:100%; object-fit:contain">
            </div>
            <span style="font-size:10px; font-weight:800; color:#0284c7; margin-top:4px; display:block">GUÍA PSA (Pág. ${faucet.page})</span>
          </div>
        </div>

        <!-- ADAPTER REQUIRED BOX -->
        <div style="background:linear-gradient(135deg, #f0fdf4, #ecfdf5); border:1px solid #a7f3d0; border-radius:18px; padding:14px; margin-bottom:14px">
          <div style="font-size:11px; font-weight:900; color:#065f46; text-transform:uppercase; letter-spacing:0.5px">
            Adaptador Oficial PSA Requerido:
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin:6px 0 10px">
            <div>
              <div style="font-size:26px; font-weight:950; color:#065f46; letter-spacing:-0.5px">${esc(faucet.adapter_id)}</div>
              <div style="font-size:12px; font-weight:750; color:#047857">${esc(faucet.adapter_name)}</div>
            </div>
            <span style="font-family:monospace; font-size:11px; font-weight:850; background:#ffffff; padding:4px 8px; border-radius:8px; border:1px solid #a7f3d0; color:#065f46">
              ${esc(faucet.adapter_code)}
            </span>
          </div>

          <div style="display:flex; gap:10px; align-items:center">
            <div style="width:70px; height:70px; border-radius:12px; background:#ffffff; border:1px solid #a7f3d0; display:flex; align-items:center; justify-content:center; overflow:hidden; flex:none">
              <img src="${faucet.image_adapter}" style="max-width:90%; max-height:90%; object-fit:contain">
            </div>
            <div style="font-size:11.5px; color:#064e3b; line-height:1.4">
              <div><strong>Paso de rosca:</strong> ${esc(faucet.thread_type)}</div>
              <div style="margin-top:3px"><strong>Instrucciones:</strong> ${esc(faucet.observations || "Enroscar directamente en el pico.")}</div>
            </div>
          </div>
        </div>

        <!-- ACTIONS -->
        <div style="display:flex; flex-direction:column; gap:8px">
          <a href="${waUrl}" target="_blank" class="btn whatsapp" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:13px; font-size:13px; font-weight:850; border-radius:14px; text-decoration:none">
            <span>💬</span> Pedir / Consultar Adaptador por WhatsApp
          </a>

          <button type="button" onclick="window.canillasOpenModal(${faucet.page})" style="width:100%; padding:10px; border-radius:14px; background:#f8fafc; border:1px solid #cbd5e1; font-size:12px; font-weight:800; color:#334155; cursor:pointer">
            📄 Ver Hoja Oficial del PDF PSA (HD)
          </button>
        </div>

      </div>
    `;

    resArea.style.display = "";
    resArea.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // TAB 2: CATÁLOGO COMPLETO
  function renderCatalogoTab(host) {
    var brands = ["Todas", "FV", "Piazza", "Unicontrol", "Discovery", "Patio", "Otras"];
    
    var filtered = FAUCETS.filter(function (f) {
      var matchBrand = state.brandFilter === "Todas" || f.brand.toLowerCase().indexOf(state.brandFilter.toLowerCase()) >= 0;
      var q = state.searchQuery.toLowerCase().trim();
      var matchSearch = !q || (
        f.name.toLowerCase().indexOf(q) >= 0 ||
        f.code.toLowerCase().indexOf(q) >= 0 ||
        f.adapter_id.toLowerCase().indexOf(q) ||
        f.thread_type.toLowerCase().indexOf(q)
      );
      return matchBrand && matchSearch;
    });

    host.innerHTML = `
      <div class="can-card">
        <div style="display:flex; flex-direction:column; gap:10px">
          <input type="text" id="canSearch" value="${esc(state.searchQuery)}" placeholder="Buscar por canilla, código (ej. Libby, 411.04, PSA 144)..." oninput="window.canillasOnSearch(this.value)" style="width:100%; font-size:13px; padding:10px 14px; border-radius:14px; border:1px solid #cbd5e1; outline:none">
          
          <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:4px">
            ${brands.map(function(b) {
              var active = state.brandFilter === b ? "background:#0284c7; color:#fff; border-color:#0284c7" : "background:#f1f5f9; color:#475569";
              return '<button type="button" onclick="window.canillasSetBrand(\'' + b + '\')" style="border:1px solid #cbd5e1; border-radius:10px; padding:5px 10px; font-size:11px; font-weight:800; cursor:pointer; white-space:nowrap; ' + active + '">' + b + '</button>';
            }).join("")}
          </div>
        </div>
      </div>

      <div style="font-size:12px; font-weight:800; color:#64748b; margin-bottom:10px">
        Mostrando ${filtered.length} modelos encontrados:
      </div>

      <div class="can-grid">
        ${filtered.map(function(f) {
          return `
            <div class="can-item-card">
              <div>
                <div class="can-item-img" onclick="window.canillasTestSample('${f.id}')">
                  <img src="${f.image_faucet}" alt="${esc(f.name)}" loading="lazy">
                  <span class="can-tag">${esc(f.brand)}</span>
                  <span style="position:absolute; top:8px; right:8px; background:#0284c7; color:#fff; font-size:9px; font-weight:900; padding:2px 6px; border-radius:6px">Pág. ${f.page}</span>
                </div>
                <div style="padding:12px">
                  <strong style="font-size:13px; color:#0f172a; display:block">${esc(f.name)}</strong>
                  <div style="font-family:monospace; font-size:10px; color:#64748b">Cód: ${esc(f.code)}</div>
                  
                  <div class="can-badge-psa">
                    <div>
                      <div style="font-size:9px; font-weight:900; color:#0284c7; text-transform:uppercase">Lleva Adaptador</div>
                      <div style="font-size:13px; font-weight:950; color:#0f172a">${esc(f.adapter_id)}</div>
                    </div>
                    <span style="font-family:monospace; font-size:10px; color:#64748b">${esc(f.adapter_code)}</span>
                  </div>

                  <div style="font-size:11px; color:#475569">
                    <strong>Rosca:</strong> ${esc(f.thread_type)}
                  </div>
                </div>
              </div>

              <div style="padding:8px 12px 12px; display:flex; gap:6px">
                <button type="button" onclick="window.canillasTestSample('${f.id}')" style="flex:1; border:none; background:#0284c7; color:#fff; border-radius:10px; padding:7px; font-size:11px; font-weight:850; cursor:pointer">
                  Ver Ficha
                </button>
                <button type="button" onclick="window.canillasOpenModal(${f.page})" style="border:1px solid #cbd5e1; background:#f8fafc; border-radius:10px; padding:7px 10px; font-size:11px; font-weight:800; cursor:pointer">
                  PDF
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  // TAB 3: 15 ADAPTADORES PSA
  function renderAdaptadoresTab(host) {
    host.innerHTML = `
      <div class="can-hero">
        <h2>Familia de 15 Adaptadores Oficiales PSA</h2>
        <p>Listado completo con medidas en milímetros, paso de rosca y modelos de griferías compatibles en Argentina.</p>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px">
        ${ADAPTERS.map(function(a) {
          var wa = "https://wa.me/?text=" + encodeURIComponent("Hola! Consulto por el adaptador PSA " + a.id + " (" + a.code + ")");
          return `
            <div class="can-card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                  <span style="background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:8px; font-size:12px; font-weight:950">${esc(a.id)}</span>
                  <span style="font-family:monospace; font-size:11px; color:#64748b">${esc(a.code)}</span>
                </div>
                <strong style="font-size:14px; color:#0f172a; display:block">${esc(a.name)}</strong>
                <div style="font-size:11.5px; color:#0284c7; font-weight:800; margin:4px 0 8px">📏 Rosca: ${esc(a.thread)}</div>
                <p style="font-size:11px; color:#475569; margin:0 0 10px; line-height:1.4">${esc(a.description)}</p>
                <div style="font-size:10.5px; color:#64748b">
                  <strong>Canillas compatibles:</strong>
                  <div>${esc(a.sample_faucets.join(", "))}</div>
                </div>
              </div>
              <div style="margin-top:12px; padding-top:10px; border-top:1px solid #f1f5f9">
                <a href="${wa}" target="_blank" class="btn whatsapp" style="display:flex; align-items:center; justify-content:center; gap:6px; font-size:11.5px; padding:8px; border-radius:10px; text-decoration:none">
                  <span>💬</span> Pedir por WhatsApp
                </a>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  // TAB 4: GUÍA DE MEDICIÓN
  function renderGuiaTab(host) {
    host.innerHTML = `
      <div class="can-card">
        <h2 style="font-size:18px; font-weight:950; color:#0f172a; margin:0 0 10px">¿Cómo medir el pico de tu canilla con regla?</h2>
        <p style="font-size:12px; color:#475569; line-height:1.5">
          Para no confundirte nunca entre <strong>PSA 142 (16,3 mm)</strong> y <strong>PSA 144 (18,2 mm)</strong>:
        </p>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin:16px 0">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:14px">
            <div style="font-size:24px; font-weight:950; color:#0284c7; margin-bottom:4px">1</div>
            <strong style="font-size:13px; color:#0f172a; display:block">Desenroscá el casquillo</strong>
            <p style="font-size:11px; color:#64748b; margin:4px 0 0">
              En las canillas modernas (FV Libby, Puelo, etc.), la punta cromada exterior se desenrosca con la mano.
            </p>
          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:14px">
            <div style="font-size:24px; font-weight:950; color:#0284c7; margin-bottom:4px">2</div>
            <strong style="font-size:13px; color:#0f172a; display:block">Retirá el aireador interno</strong>
            <p style="font-size:11px; color:#64748b; margin:4px 0 0">
              Adentro del casquillo cromado hay un plastiquito filtrante con gomita. Extraelo hacia afuera.
            </p>
          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:14px">
            <div style="font-size:24px; font-weight:950; color:#0284c7; margin-bottom:4px">3</div>
            <strong style="font-size:13px; color:#0f172a; display:block">Medí el ancho de la rosca</strong>
            <p style="font-size:11px; color:#64748b; margin:4px 0 0">
              • Aprox <strong>16 mm</strong> 👉 lleva <strong>PSA 142</strong><br>
              • Aprox <strong>18 mm</strong> 👉 lleva <strong>PSA 144</strong><br>
              • Aprox <strong>21 mm</strong> 👉 lleva <strong>PSA 135</strong>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  // SCORING ENGINE
  function scoreFaucets(params) {
    var sampleId = params.sampleId;
    var spout = params.spout || "";
    var thread = params.thread || "";

    var scored = FAUCETS.map(function(item) {
      var score = 50;
      if (sampleId && item.id === sampleId) {
        return { item: item, score: 98, adapter: findAdapter(item.adapter_id) };
      }
      var obs = (item.observations || "").toLowerCase();
      var sh = (item.spout_shape || "").toLowerCase();

      if (spout === "curvo" && (sh.indexOf("curv") >= 0 || sh.indexOf("cisne") >= 0)) score += 20;
      if (spout === "recto" && (sh.indexOf("rect") >= 0 || sh.indexOf("inclin") >= 0)) score += 25;
      if (spout === "extensible" && sh.indexOf("extens") >= 0) score += 35;
      if (spout === "cascada" && sh.indexOf("rectangular") >= 0) score += 35;
      if (spout === "patio" && sh.indexOf("patio") >= 0) score += 35;

      if (thread === "casquillo" && (obs.indexOf("casquillo") >= 0 || item.adapter_id.indexOf("142") >= 0 || item.adapter_id.indexOf("144") >= 0)) score += 30;
      if (thread === "visible_macho" && item.adapter_id.indexOf("002") >= 0) score += 25;
      if (thread === "visible_hembra" && (item.adapter_id.indexOf("039") >= 0 || item.adapter_id.indexOf("100") >= 0)) score += 30;

      score = Math.min(Math.max(score, 40), 96);
      return { item: item, score: score, adapter: findAdapter(item.adapter_id) };
    });

    scored.sort(function(a, b) { return b.score - a.score; });
    return scored[0];
  }

  function findAdapter(idStr) {
    var m = idStr.match(/PSA\s*(\d{3})/);
    if (m) {
      var key = "PSA " + m[1];
      for (var i = 0; i < ADAPTERS.length; i++) {
        if (ADAPTERS[i].id === key) return ADAPTERS[i];
      }
    }
    return null;
  }

  // Public Actions
  window.openCanillas = function () {
    if (typeof showView === "function") {
      showView("view-canillas");
    }
    renderView();
  };

  window.canillasSetSubTab = function (sub) {
    state.activeSubTab = sub;
    renderView();
  };

  window.canillasTestSample = function (sampleId) {
    state.selectedSample = sampleId;
    state.activeSubTab = "foto";
    
    var f = FAUCETS.find(function(x) { return x.id === sampleId; });
    if (f) {
      state.userPhotoSrc = f.image_faucet;
    }
    state.currentResult = scoreFaucets({ sampleId: sampleId });
    renderView();
  };

  window.canillasOnFile = function (e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(evt) {
      state.userPhotoSrc = evt.target.result;
      state.selectedSample = null;
      window.canillasRunScoring();
    };
    reader.readAsDataURL(file);
  };

  window.canillasRunScoring = function () {
    var sp = $("canOptSpout") ? $("canOptSpout").value : "";
    var th = $("canOptThread") ? $("canOptThread").value : "";
    state.currentResult = scoreFaucets({
      sampleId: state.selectedSample,
      spout: sp,
      thread: th
    });
    renderView();
  };

  window.canillasSetBrand = function (b) {
    state.brandFilter = b;
    renderSubContent();
  };

  window.canillasOnSearch = function (q) {
    state.searchQuery = q;
    renderSubContent();
  };

  window.canillasOpenModal = function (pageNum) {
    var m = $("canillasModalPdf");
    var img = $("canModalImg");
    var title = $("canModalTitle");
    if (m && img) {
      img.src = "./canillas-img/pages/page_" + pageNum + ".jpg";
      if (title) title.innerText = "Página Oficial " + pageNum + " de la Guía PSA";
      m.style.display = "flex";
    }
  };

  window.canillasCloseModal = function () {
    var m = $("canillasModalPdf");
    if (m) m.style.display = "none";
  };

})();
