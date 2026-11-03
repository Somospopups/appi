# APPI v893 · Verificación preventiva de precios

## Alerta al ingresar

- La Lista de precios muestra una advertencia preventiva en cada ingreso.
- El diseño bordó/rojo es visible sin presentarse como un fallo grave.
- El mensaje recuerda verificar el precio vigente antes de confirmar una venta o enviar un presupuesto.
- Informa que comprobar a tiempo evita diferencias e inconvenientes con clientes.

## Acciones

- **ACTUALIZAR Y VERIFICAR PRECIOS** cierra la alerta y ejecuta directamente la actualización de precios ya existente.
- **Continuar a la lista** y el botón de cierre permiten seguir sin actualizar.
- La tecla Escape también cierra la advertencia.

## Integración y accesibilidad

- Reutiliza el sistema global de popups de APPI: animación 4, rebote suave y sonido de gota.
- Incluye foco inicial en la acción principal, nombres accesibles, modo oscuro y adaptación a pantallas móviles.
- Se conservan sin cambios las funciones, la lista, los precios, los beneficios CyberMonday y la financiación de v892.

## Pruebas focalizadas

- Aparición en cada ingreso.
- Cierre sin actualización.
- Ejecución directa del actualizador desde el botón principal.
- Integración con el sistema global de efectos.

## Versión

- Versión: `893.0.0`
- Caché: `appi-v893-alerta-precios`
