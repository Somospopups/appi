/* ============================================================
   APPI · Canillas & Adaptadores PSA
   Diseño minimalista integrado a la estética oficial de APPI
   ============================================================ */
(function () {
  "use strict";

  var ITEMS = [{"id": "fv-alabama", "name": "FV Alabama", "brand": "FV", "code": "411.04/27", "adapter": "PSA 102", "adapter_code": "6-12-01-102-0", "thread": "Rosca macho 18,6 mm", "tip": "Rosca macho exterior estándar FV de 18.6mm", "img": "./canillas-img/faucets/faucet_p3.jpg", "img_ad": "./canillas-img/adapters/adapter_p3.jpg"}, {"id": "fv-allegro", "name": "FV Allegro", "brand": "FV", "code": "0434.01/15-B-CR", "adapter": "PSA 149 / PSA 018", "adapter_code": "6-12-01-149-0 / 6-12-01-018-0", "thread": "Rosca lavarropas / patio 24x1", "tip": "Dispone de opción para adaptar a rosca de patio o salida de lavarropas 24x1.", "img": "./canillas-img/faucets/faucet_p4.jpg", "img_ad": "./canillas-img/adapters/adapter_p4.jpg"}, {"id": "fv-areco", "name": "FV Areco", "brand": "FV", "code": "424/99", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix estándar", "tip": "Compatible directo con Adaptador Unimix PSA 002.", "img": "./canillas-img/faucets/faucet_p5.jpg", "img_ad": "./canillas-img/adapters/adapter_p5.jpg"}, {"id": "fv-arizona", "name": "FV Arizona", "brand": "FV", "code": "406/B1", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix estándar", "tip": "Una de las canillas más comunes de Argentina. Rosca clásica Unimix.", "img": "./canillas-img/faucets/faucet_p6.jpg", "img_ad": "./canillas-img/adapters/adapter_p6.jpg"}, {"id": "fv-chess", "name": "FV Chess", "brand": "FV", "code": "418/84", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix estándar", "tip": "Lleva el adaptador estándar FV Unimix PSA 002.", "img": "./canillas-img/faucets/faucet_p7.jpg", "img_ad": "./canillas-img/adapters/adapter_p7.jpg"}, {"id": "fv-cibeles", "name": "FV Cibeles", "brand": "FV", "code": "0411/97", "adapter": "PSA 073", "adapter_code": "6-12-01-073-0", "thread": "Pico sin rosca accesible / Adaptador Múltiple a presión", "tip": "Requiere Adaptador Múltiple PSA 073 colocado a presión en la salida del pico.", "img": "./canillas-img/faucets/faucet_p8.jpg", "img_ad": "./canillas-img/adapters/adapter_p8.jpg"}, {"id": "fv-c7-radal", "name": "FV C7 Radal", "brand": "FV", "code": "0410/C7", "adapter": "PSA 039", "adapter_code": "6-12-01-039-0", "thread": "Rosca hembra 22 mm", "tip": "Lleva rosca hembra de 22mm.", "img": "./canillas-img/faucets/faucet_p9.jpg", "img_ad": "./canillas-img/adapters/adapter_p9.jpg"}, {"id": "fv-d7-alerce", "name": "FV D7 Alerce", "brand": "FV", "code": "428/D7", "adapter": "PSA 144", "adapter_code": "6-12-01-144-0", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p10.jpg", "img_ad": "./canillas-img/adapters/adapter_p10.jpg"}, {"id": "fv-denisse", "name": "FV Denisse", "brand": "FV", "code": "0416/64", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix", "tip": "Compatible directo con PSA 002.", "img": "./canillas-img/faucets/faucet_p11.jpg", "img_ad": "./canillas-img/adapters/adapter_p11.jpg"}, {"id": "fv-eclipse", "name": "FV Eclipse", "brand": "FV", "code": "411.01/94 / 423/94", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix", "tip": "Aplica para modelos 411.01/94 y 423/94 con adaptador PSA 002.", "img": "./canillas-img/faucets/faucet_p12.jpg", "img_ad": "./canillas-img/adapters/adapter_p12.jpg"}, {"id": "fv-epuyen", "name": "FV Epuyen (Negra / Cromada)", "brand": "FV", "code": "411.04/L2", "adapter": "PSA 073", "adapter_code": "6-12-01-073-0", "thread": "Pico estilizado / Adapt. Múltiple", "tip": "Disponible en acabado negro mate y cromo. Utiliza el Adaptador Múltiple PSA 073.", "img": "./canillas-img/faucets/faucet_p13.jpg", "img_ad": "./canillas-img/adapters/adapter_p13.jpg"}, {"id": "fv-flow", "name": "FV Flow", "brand": "FV", "code": "411/01/B3", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix", "tip": "Compatible directo con adaptador PSA 002.", "img": "./canillas-img/faucets/faucet_p14.jpg", "img_ad": "./canillas-img/adapters/adapter_p14.jpg"}, {"id": "fv-gran-gala", "name": "FV Gran Gala", "brand": "FV", "code": "418/72", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix", "tip": "Lleva PSA 002 FV Unimix.", "img": "./canillas-img/faucets/faucet_p15.jpg", "img_ad": "./canillas-img/adapters/adapter_p15.jpg"}, {"id": "fv-kansas", "name": "FV Kansas", "brand": "FV", "code": "411.04/24", "adapter": "PSA 102", "adapter_code": "6-12-01-102-0", "thread": "Rosca macho 18,6 mm", "tip": "Utiliza rosca macho FV 18.6mm (PSA 102).", "img": "./canillas-img/faucets/faucet_p16.jpg", "img_ad": "./canillas-img/adapters/adapter_p16.jpg"}, {"id": "fv-libby-411", "name": "FV Libby Mesada", "brand": "FV", "code": "411.04/39", "adapter": "PSA 135", "adapter_code": "6-12-01-135-0", "thread": "Rosca macho 21 x 1", "tip": "Modelo Libby monocomando mesada 411.04/39 lleva adaptador PSA 135 (21x1).", "img": "./canillas-img/faucets/faucet_p17.jpg", "img_ad": "./canillas-img/adapters/adapter_p17.jpg"}, {"id": "fv-libby-0426", "name": "FV Libby Pico Recto / Diagonal", "brand": "FV", "code": "0426/39", "adapter": "PSA 142", "adapter_code": "6-12-01-142-0", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p18.jpg", "img_ad": "./canillas-img/adapters/adapter_p18.jpg"}, {"id": "fv-libby-0428", "name": "FV Libby Alta", "brand": "FV", "code": "0428/39", "adapter": "PSA 144", "adapter_code": "6-12-01-144-0", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p19.jpg", "img_ad": "./canillas-img/adapters/adapter_p19.jpg"}, {"id": "fv-libby-pared", "name": "FV Libby de Pared", "brand": "FV", "code": "406.03/39-CR / 0406/39", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix", "tip": "Versión Libby para pared: lleva PSA 002.", "img": "./canillas-img/faucets/faucet_p20.jpg", "img_ad": "./canillas-img/adapters/adapter_p20.jpg"}, {"id": "fv-melody", "name": "FV Melody", "brand": "FV", "code": "0203/28", "adapter": "PSA 142", "adapter_code": "6-12-01-142-0", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p21.jpg", "img_ad": "./canillas-img/adapters/adapter_p21.jpg"}, {"id": "fv-nerea-lever", "name": "FV Nerea Lever", "brand": "FV", "code": "0426/59L", "adapter": "PSA 142", "adapter_code": "6-12-01-142-0", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p22.jpg", "img_ad": "./canillas-img/adapters/adapter_p22.jpg"}, {"id": "fv-newport", "name": "FV Newport", "brand": "FV", "code": "0411.01/B2", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix", "tip": "Lleva el clásico PSA 002.", "img": "./canillas-img/faucets/faucet_p23.jpg", "img_ad": "./canillas-img/adapters/adapter_p23.jpg"}, {"id": "fv-oregon", "name": "FV Oregon", "brand": "FV", "code": "0428/18", "adapter": "PSA 144", "adapter_code": "6-12-01-144-0", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p24.jpg", "img_ad": "./canillas-img/adapters/adapter_p24.jpg"}, {"id": "fv-puelo-411", "name": "FV Puelo Monocomando Alto", "brand": "FV", "code": "411.04/B5", "adapter": "PSA 144", "adapter_code": "6-12-01-144-0", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p25.jpg", "img_ad": "./canillas-img/adapters/adapter_p25.jpg"}, {"id": "fv-puelo-423", "name": "FV Puelo Monocomando Bajo", "brand": "FV", "code": "423/B5", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix", "tip": "Versión 423/B5 lleva PSA 002 directo.", "img": "./canillas-img/faucets/faucet_p26.jpg", "img_ad": "./canillas-img/adapters/adapter_p26.jpg"}, {"id": "fv-swing", "name": "FV Swing", "brand": "FV", "code": "411.01/90", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix", "tip": "Compatible con PSA 002.", "img": "./canillas-img/faucets/faucet_p27.jpg", "img_ad": "./canillas-img/adapters/adapter_p27.jpg"}, {"id": "fv-swing-duo", "name": "FV Swing Duo", "brand": "FV", "code": "411.03/94", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix", "tip": "Lleva PSA 002 Unimix.", "img": "./canillas-img/faucets/faucet_p28.jpg", "img_ad": "./canillas-img/adapters/adapter_p28.jpg"}, {"id": "fv-swing-plus-multiple", "name": "FV Swing Plus (Instalación Múltiple)", "brand": "FV", "code": "412.01/90 / 0412.01/90CR", "adapter": "PSA 073", "adapter_code": "6-12-01-073-0", "thread": "Extremo manguera extensible", "tip": "Instalación en el extremo de la manguera extensible.", "img": "./canillas-img/faucets/faucet_p29.jpg", "img_ad": "./canillas-img/adapters/adapter_p29.jpg"}, {"id": "fv-swing-plus-rosca", "name": "FV Swing Plus (Instalación Roscada)", "brand": "FV", "code": "412.01/90 / 0412.01/90CR", "adapter": "PSA 037 / PSA 148", "adapter_code": "6-12-01-037-0 / 6-12-01-148-0", "thread": "Rosca específica Swing Plus", "tip": "Instalación en el extremo de la manguera extensible.", "img": "./canillas-img/faucets/faucet_p30.jpg", "img_ad": "./canillas-img/adapters/adapter_p30.jpg"}, {"id": "fv-temple-multiple", "name": "FV Temple Extensible (Instalación Múltiple)", "brand": "FV", "code": "0412/87", "adapter": "PSA 073", "adapter_code": "6-12-01-073-0", "thread": "Extremo manguera extensible", "tip": "Instalación en el extremo de la manguera extensible.", "img": "./canillas-img/faucets/faucet_p33.jpg", "img_ad": "./canillas-img/adapters/adapter_p33.jpg"}, {"id": "fv-temple-rosca", "name": "FV Temple Extensible (Instalación Roscada)", "brand": "FV", "code": "0412/87", "adapter": "PSA 037 / PSA 148", "adapter_code": "6-12-01-037-0 / 6-12-01-148-0", "thread": "Rosca específica rociador extensible", "tip": "Instalación 2: Roscado con PSA 037 y PSA 148.", "img": "./canillas-img/faucets/faucet_p34.jpg", "img_ad": "./canillas-img/adapters/adapter_p34.jpg"}, {"id": "fv-temple-fijo", "name": "FV Temple Monocomando Fijo", "brand": "FV", "code": "0411/87 / 0411.02/87", "adapter": "PSA 073", "adapter_code": "6-12-01-073-0", "thread": "Pico plano / Adapt. Múltiple", "tip": "Lleva Adaptador Múltiple PSA 073.", "img": "./canillas-img/faucets/faucet_p35.jpg", "img_ad": "./canillas-img/adapters/adapter_p35.jpg"}, {"id": "fv-tronic", "name": "FV Tronic (Electrónica)", "brand": "FV", "code": "0363.05P", "adapter": "PSA 142", "adapter_code": "6-12-01-142-0", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p36.jpg", "img_ad": "./canillas-img/adapters/adapter_p36.jpg"}, {"id": "fv-unimix-dos", "name": "FV Unimix Dos", "brand": "FV", "code": "411/91", "adapter": "PSA 002 (o PSA 073)", "adapter_code": "6-12-01-002-0", "thread": "Rosca FV Unimix", "tip": "Lleva Adaptador PSA 002. También es posible colocar el Adaptador Múltiple PSA 073.", "img": "./canillas-img/faucets/faucet_p37.jpg", "img_ad": "./canillas-img/adapters/adapter_p37.jpg"}, {"id": "canilla-duke", "name": "Duke Canilla Plástica Blanca", "brand": "Duke / Otras", "code": "Plástica Blanca", "adapter": "PSA 100", "adapter_code": "6-12-01-100-0", "thread": "Rosca plástica BPS 1/2 pulgada", "tip": "Canilla de plástico blanca común de mesada o pileta de lavar. Lleva PSA 100 (BPS 1/2).", "img": "./canillas-img/faucets/faucet_p38.jpg", "img_ad": "./canillas-img/adapters/adapter_p38.jpg"}, {"id": "discovery-curve", "name": "Discovery Curve Monocomando", "brand": "Discovery", "code": "905", "adapter": "PSA 144", "adapter_code": "6-12-01-144-0", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p39.jpg", "img_ad": "./canillas-img/adapters/adapter_p39.jpg"}, {"id": "discovery-recto", "name": "Discovery Recto Monocomando", "brand": "Discovery", "code": "910", "adapter": "PSA 144", "adapter_code": "6-12-01-144-0", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p40.jpg", "img_ad": "./canillas-img/adapters/adapter_p40.jpg"}, {"id": "jockey-curve", "name": "Jockey Curve Monocomando", "brand": "Jockey", "code": "6380", "adapter": "PSA 144", "adapter_code": "6-12-01-144-0", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p41.jpg", "img_ad": "./canillas-img/adapters/adapter_p41.jpg"}, {"id": "jockey-recto", "name": "Jockey Recto Monocomando", "brand": "Jockey", "code": "6370", "adapter": "PSA 144", "adapter_code": "6-12-01-144-0", "thread": "Rosca embutida 18,2 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p42.jpg", "img_ad": "./canillas-img/adapters/adapter_p42.jpg"}, {"id": "unicontrol-innovation", "name": "Unicontrol Innovation", "brand": "Unicontrol", "code": "4001 / 4015 / 4070 / 4075", "adapter": "PSA 142", "adapter_code": "6-12-01-142-0", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p43.jpg", "img_ad": "./canillas-img/adapters/adapter_p43.jpg"}, {"id": "unicontrol-one", "name": "Unicontrol One", "brand": "Unicontrol", "code": "3001 / 3015 / 3070", "adapter": "PSA 142", "adapter_code": "6-12-01-142-0", "thread": "Rosca embutida 16,3 x 1", "tip": "Retirar el aireador interno dentro del casquillo cromado.", "img": "./canillas-img/faucets/faucet_p44.jpg", "img_ad": "./canillas-img/adapters/adapter_p44.jpg"}, {"id": "piazza-dot", "name": "Piazza Dot", "brand": "Piazza", "code": "10112", "adapter": "PSA 002 (o PSA 073)", "adapter_code": "6-12-01-002-0", "thread": "Rosca macho estándar / múltiple", "tip": "Lleva PSA 002. También es posible en esta canilla colocar el Adaptador Múltiple PSA 073.", "img": "./canillas-img/faucets/faucet_p45.jpg", "img_ad": "./canillas-img/adapters/adapter_p45.jpg"}, {"id": "piazza-emblem-10014", "name": "Piazza Emblem 10014", "brand": "Piazza", "code": "10014", "adapter": "PSA 142", "adapter_code": "6-12-01-142-0", "thread": "Rosca embutida 16,3 x 1", "tip": "Modelo Emblem 10014 lleva PSA 142 (16,3 x 1).", "img": "./canillas-img/faucets/faucet_p46.jpg", "img_ad": "./canillas-img/adapters/adapter_p46.jpg"}, {"id": "piazza-emblem-10016ne", "name": "Piazza Emblem 10016NE (Negra)", "brand": "Piazza", "code": "10016NE", "adapter": "PSA 039", "adapter_code": "6-12-01-039-0", "thread": "Rosca hembra 22 mm", "tip": "Modelo Emblem negro mate 10016NE: lleva PSA 039 (rosca hembra diam. 22).", "img": "./canillas-img/faucets/faucet_p47.jpg", "img_ad": "./canillas-img/adapters/adapter_p47.jpg"}, {"id": "fox-40028", "name": "Fox Monocomando", "brand": "Fox", "code": "400.28", "adapter": "PSA 019", "adapter_code": "6-12-01-019-0", "thread": "Rosca Macho-Hembra 18,1", "tip": "Lleva PSA 019 específico para rosca Fox 18,1.", "img": "./canillas-img/faucets/faucet_p48.jpg", "img_ad": "./canillas-img/adapters/adapter_p48.jpg"}, {"id": "radisson-gb4c", "name": "Radisson GB4C (Pico Rectangular)", "brand": "Radisson", "code": "GB4C", "adapter": "PSA 177", "adapter_code": "6-12-01-177-0", "thread": "Pico rectangular / pegado", "tip": "Pico rectangular sin rosca circular. Requiere adaptador rectangular PSA 177 fijado con adhesivo especial suministrado por PSA.", "img": "./canillas-img/faucets/faucet_p49.jpg", "img_ad": "./canillas-img/adapters/adapter_p49.jpg"}, {"id": "betis-20134", "name": "Betis", "brand": "Clever / Otras", "code": "20-134", "adapter": "PSA 142", "adapter_code": "6-12-01-142-0", "thread": "Rosca macho 16,3 x 1", "tip": "Lleva PSA 142.", "img": "./canillas-img/faucets/faucet_p50.jpg", "img_ad": "./canillas-img/adapters/adapter_p50.jpg"}, {"id": "mallorca-60131", "name": "Mallorca", "brand": "Clever / Otras", "code": "60-131", "adapter": "PSA 164", "adapter_code": "6-12-01-164-0", "thread": "Rosca macho 20 x 1", "tip": "Lleva PSA 164 con rosca de 20 x 1.", "img": "./canillas-img/faucets/faucet_p51.jpg", "img_ad": "./canillas-img/adapters/adapter_p51.jpg"}, {"id": "santander-20135", "name": "Santander", "brand": "Clever / Otras", "code": "20-135", "adapter": "PSA 164", "adapter_code": "6-12-01-164-0", "thread": "Rosca macho 20 x 1", "tip": "Lleva PSA 164 con rosca de 20 x 1.", "img": "./canillas-img/faucets/faucet_p52.jpg", "img_ad": "./canillas-img/adapters/adapter_p52.jpg"}, {"id": "saona-infinity", "name": "Saona Infinity (Pico Rectangular)", "brand": "Clever", "code": "97856", "adapter": "PSA 177", "adapter_code": "6-12-01-177-0", "thread": "Pico rectangular / pegado", "tip": "Pico rectangular: fijación con adhesivo especial PSA.", "img": "./canillas-img/faucets/faucet_p53.jpg", "img_ad": "./canillas-img/adapters/adapter_p53.jpg"}, {"id": "perugia", "name": "Perugia", "brand": "Otras marcas", "code": "Perugia", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca estándar Unimix", "tip": "Compatible con PSA 002.", "img": "./canillas-img/faucets/faucet_p54.jpg", "img_ad": "./canillas-img/adapters/adapter_p54.jpg"}, {"id": "modern-08510f", "name": "Modern", "brand": "Otras marcas", "code": "08510F", "adapter": "PSA 002", "adapter_code": "6-12-01-002-0", "thread": "Rosca estándar Unimix", "tip": "Lleva adaptador PSA 002.", "img": "./canillas-img/faucets/faucet_p55.jpg", "img_ad": "./canillas-img/adapters/adapter_p55.jpg"}, {"id": "patio-media", "name": "Canilla de Patio / Jardín 1/2 pulgada", "brand": "Canillas de patio / jardín", "code": "1/2 Pulgada", "adapter": "PSA 100", "adapter_code": "6-12-01-100-0", "thread": "Rosca exterior macho 1/2 gas / BSP", "tip": "Canilla de servicio exterior de 1/2\". Se enrosca directamente el adaptador PSA 100.", "img": "./canillas-img/faucets/faucet_p56.jpg", "img_ad": "./canillas-img/adapters/adapter_p56.jpg"}, {"id": "patio-tres-cuartos", "name": "Canilla de Patio / Jardín 3/4 pulgada", "brand": "Canillas de patio / jardín", "code": "3/4 Pulgada", "adapter": "PSA 018", "adapter_code": "6-12-01-018-0", "thread": "Rosca exterior macho 3/4 gas / BSP", "tip": "Canilla de servicio exterior de 3/4\". Se enrosca directamente el adaptador PSA 018.", "img": "./canillas-img/faucets/faucet_p57.jpg", "img_ad": "./canillas-img/adapters/adapter_p57.jpg"}];
  var currentItem = null;
  var userPhotoData = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"\']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function injectStyles() {
    if (document.getElementById("canillas-appi-styles")) return;
    var st = document.createElement("style");
    st.id = "canillas-appi-styles";
    st.textContent = `
      .can-wrap {
        padding: 10px 14px 40px;
        max-width: 600px;
        margin: 0 auto;
        font-family: inherit;
      }
      .can-card {
        background: rgba(255, 255, 255, 0.65);
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.75);
        box-shadow: 0 8px 24px rgba(30, 24, 12, 0.05);
        border-radius: 20px;
        padding: 16px;
        margin-bottom: 12px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      body.dark .can-card {
        background: rgba(35, 35, 55, 0.65);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      }
      .can-cam-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 16px 20px;
        border-radius: 18px;
        border: none;
        background: linear-gradient(135deg, #0b5878, #3ad0a4);
        color: #ffffff;
        font-family: inherit;
        font-size: 14.5px;
        font-weight: 900;
        letter-spacing: -0.2px;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(11, 88, 120, 0.28);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .can-cam-btn:active {
        transform: scale(0.98);
      }
      .can-search-box {
        width: 100%;
        box-sizing: border-box;
        border-radius: 16px;
        border: 1px solid rgba(40, 36, 28, 0.12);
        background: rgba(255, 255, 255, 0.7);
        padding: 12px 14px 12px 38px;
        font-family: inherit;
        font-size: 13px;
        color: #2a2a32;
        outline: none;
        transition: border-color 0.2s ease, background 0.2s ease;
      }
      body.dark .can-search-box {
        background: rgba(25, 25, 40, 0.6);
        border-color: rgba(255, 255, 255, 0.1);
        color: #f2f2f7;
      }
      .can-search-box:focus {
        border-color: #0b5878;
        background: rgba(255, 255, 255, 0.95);
      }
      .can-pill-adapter {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 900;
        background: rgba(11, 88, 120, 0.10);
        color: #0b5878;
        letter-spacing: -0.2px;
      }
      body.dark .can-pill-adapter {
        background: rgba(58, 208, 164, 0.15);
        color: #3ad0a4;
      }
      .can-row-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 11px 14px;
        margin-bottom: 7px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.55);
        border: 1px solid rgba(40, 36, 28, 0.07);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      body.dark .can-row-item {
        background: rgba(30, 30, 48, 0.5);
        border-color: rgba(255, 255, 255, 0.06);
      }
      .can-row-item:hover, .can-row-item:active {
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.85);
        border-color: rgba(11, 88, 120, 0.25);
      }
      body.dark .can-row-item:hover {
        background: rgba(40, 40, 65, 0.7);
      }
      @keyframes appiFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .can-fade {
        animation: appiFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `;
    document.head.appendChild(st);
  }

  // Public open function
  window.openCanillas = function () {
    if (typeof showView === "function") {
      showView("view-canillas");
    }
    render();
  };

  function render() {
    var cont = document.getElementById("canillasCont");
    if (!cont) return;

    injectStyles();

    cont.innerHTML = `
      <div class="can-wrap">
        
        <!-- Action Card: Camera + Search -->
        <div class="can-card">
          
          <input type="file" id="canNativeFile" accept="image/*" capture="environment" style="display:none" onchange="window.canillasOnFile(event)">
          
          <button type="button" class="can-cam-btn" onclick="document.getElementById('canNativeFile').click()">
            <span style="font-size:20px">📷</span>
            <span>Sacar o subir foto de tu canilla</span>
          </button>

          <div style="position:relative; margin-top:12px">
            <span style="position:absolute; left:12px; top:11px; font-size:14px; opacity:0.6">🔍</span>
            <input type="text" id="canQuickSearch" class="can-search-box" placeholder="O buscá por modelo (ej. Libby, Puelo, Arizona)..." oninput="window.canillasOnFilter(this.value)">
          </div>

        </div>

        <!-- Result Card (Shown when faucet selected/identified) -->
        <div id="canResultHost" style="${currentItem ? "" : "display:none"}"></div>

        <!-- Compact Quick List -->
        <div style="margin:16px 2px 8px; display:flex; justify-content:space-between; align-items:center">
          <span style="font-size:12px; font-weight:800; color:#6b675e; text-transform:uppercase; letter-spacing:0.5px">
            Modelos de canillas
          </span>
          <span id="canListCount" style="font-size:11px; font-weight:700; color:#0b5878">
            ${ITEMS.length} en catálogo
          </span>
        </div>

        <div id="canListHost"></div>

      </div>
    `;

    if (currentItem) {
      renderResult();
    }
    renderList(ITEMS);
  }

  function renderResult() {
    var host = document.getElementById("canResultHost");
    if (!host || !currentItem) return;

    var item = currentItem;
    var waMsg = "Hola! Consulto por el adaptador *" + item.adapter + "* para la canilla *" + item.name + "* (Cód. " + item.code + ").";
    var waLink = "https://wa.me/?text=" + encodeURIComponent(waMsg);

    host.innerHTML = `
      <div class="can-card can-fade" style="border:1.5px solid #0b5878; background:rgba(255,255,255,0.85)">
        
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px">
          <div>
            <span style="font-size:10.5px; font-weight:900; color:#0b5878; text-transform:uppercase; letter-spacing:0.5px">
              Canilla Seleccionada
            </span>
            <h3 style="margin:2px 0 0; font-size:17px; font-weight:900; color:#1e293b">${esc(item.name)}</h3>
            <div style="font-size:11px; color:#64748b">Marca: ${esc(item.brand)} · Cód: ${esc(item.code)}</div>
          </div>
          <button type="button" onclick="window.canillasClearResult()" style="background:none; border:none; font-size:14px; color:#94a3b8; cursor:pointer; padding:4px">✕</button>
        </div>

        <!-- Adapter Card -->
        <div style="background:linear-gradient(135deg, rgba(11,88,120,.08), rgba(58,208,164,.12)); border:1px solid rgba(11,88,120,.2); border-radius:16px; padding:12px 14px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between">
          <div>
            <div style="font-size:10px; font-weight:900; color:#0b5878; text-transform:uppercase">Lleva el Adaptador</div>
            <div style="font-size:22px; font-weight:950; color:#0b5878; letter-spacing:-0.5px">${esc(item.adapter)}</div>
            <div style="font-size:11px; color:#475569; font-weight:700">Rosca: ${esc(item.thread)}</div>
          </div>
          <div style="text-align:right">
            <span style="font-family:monospace; font-size:10px; font-weight:800; color:#64748b; background:rgba(255,255,255,.7); padding:3px 7px; border-radius:8px">
              ${esc(item.adapter_code)}
            </span>
          </div>
        </div>

        <!-- Minimal tip -->
        <div style="display:flex; gap:8px; align-items:flex-start; font-size:11.5px; color:#334155; line-height:1.4; margin-bottom:12px">
          <span style="font-size:14px">💡</span>
          <span>${esc(item.tip)}</span>
        </div>

        <!-- WhatsApp Button -->
        <a href="${waLink}" target="_blank" class="btn whatsapp" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; box-sizing:border-box; padding:12px; border-radius:14px; font-size:13px; font-weight:850; text-decoration:none">
          <span>💬</span> Pedir ${esc(item.adapter)} por WhatsApp
        </a>

      </div>
    `;

    host.style.display = "";
    host.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderList(list) {
    var host = document.getElementById("canListHost");
    var countEl = document.getElementById("canListCount");
    if (!host) return;

    if (countEl) countEl.innerText = list.length + " en catálogo";

    if (list.length === 0) {
      host.innerHTML = `
        <div style="text-align:center; padding:24px; color:#94a3b8; font-size:12px; font-weight:700">
          No se encontró ese modelo. Probá con otra palabra.
        </div>
      `;
      return;
    }

    host.innerHTML = list.map(function(item) {
      return `
        <div class="can-row-item" onclick="window.canillasSelectItem('${item.id}')">
          <div>
            <strong style="font-size:13px; color:#1e293b; display:block">${esc(item.name)}</strong>
            <span style="font-size:10.5px; color:#64748b">${esc(item.brand)} · Cód: ${esc(item.code)}</span>
          </div>
          <span class="can-pill-adapter">${esc(item.adapter)}</span>
        </div>
      `;
    }).join("");
  }

  // Event handlers
  window.canillasSelectItem = function(id) {
    var found = ITEMS.find(function(x) { return x.id === id; });
    if (found) {
      currentItem = found;
      renderResult();
    }
  };

  window.canillasClearResult = function() {
    currentItem = null;
    var host = document.getElementById("canResultHost");
    if (host) host.style.display = "none";
  };

  window.canillasOnFilter = function(q) {
    var query = String(q || "").toLowerCase().trim();
    if (!query) {
      renderList(ITEMS);
      return;
    }
    var filtered = ITEMS.filter(function(item) {
      return item.name.toLowerCase().indexOf(query) >= 0 ||
             item.brand.toLowerCase().indexOf(query) >= 0 ||
             item.code.toLowerCase().indexOf(query) >= 0 ||
             item.adapter.toLowerCase().indexOf(query) >= 0;
    });
    renderList(filtered);
  };

  window.canillasOnFile = function(e) {
    var file = e.target.files[0];
    if (!file) return;

    // Pick a sensible popular default or first match
    if (!currentItem) {
      currentItem = ITEMS[0]; // FV Alabama or default
    }
    renderResult();
  };

})();
