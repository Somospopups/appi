# Instrucciones para agentes de APPI

## Pregunta al retomar el trabajo

Al comenzar cada nueva conversación o al retomar APPI después de una pausa, antes de seguir con cambios del repositorio, preguntar una sola vez:

> ¿Estás trabajando desde Arena.ai?

- Si la respuesta es **sí**, se aplica el procedimiento de `PUBLICAR_CAMBIOS.md`: al finalizar el conjunto de cambios, preparar un ZIP con `PUBLICAR.bat`, un Git bundle y un `LEEME.txt`. El BAT permite que el propietario publique con doble clic y autentique GitHub mediante Git Credential Manager.
- Si la respuesta es **no**, no imponer el procedimiento de Arena ni asumir que se debe generar el BAT; preguntar qué forma de entrega prefiere.
- Una vez respondida la pregunta en la conversación actual, no volver a interrumpir por ella mientras siga esa misma tarea. Repetirla cuando el trabajo se retome en otra conversación/sesión.

No pedir ni guardar contraseñas, tokens, cookies ni claves de GitHub en el chat, el repositorio, el bundle o el ZIP. No intentar hacer el push desde la sesión del agente en lugar del propietario: el `PUBLICAR.bat` debe abrir el flujo oficial de autenticación de Git Credential Manager.

## Publicación desde Arena.ai

Antes de preparar la entrega, leer `PUBLICAR_CAMBIOS.md`. La entrega debe contener todos los cambios pendientes acordados en una sola publicación, salvo que el propietario pida separarlos. No generar el ZIP mientras el propietario siga solicitando cambios. Mantener los cambios locales y no publicarlos directamente desde la sesión del agente.
