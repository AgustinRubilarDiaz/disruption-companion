---
name: dc-validate-change
description: Disruption Companion — análisis de impacto antes de un cambio que toca contratos, reglas o más de un componente.
---

# Skill: Validate Change

## Anuncio de fase
Dentro de P2: `▶ [P2 · 3/7 · validate-change · razonamiento]` · fuera: `▶ [validate-change · razonamiento]`

## Cuándo ejecutar
**Antes** de modificar algo con impacto en otro componente, en un contrato o en una regla.

## Pasos

### 1. Clasificar el cambio
| Tipo | Riesgo |
|---|---|
| Interno a un componente, sin cambiar su API | 🟢 Bajo |
| Cambia `contracts/disruption-api.md` (API propia) | 🔴 Contrato |
| Se aparta de `contracts/tools-api.md` (contrato dado por el enunciado) | 🔴 **Prohibido** salvo decisión explícita |
| Cambia cómo se evalúa una regla de política o una RN | 🔴 Regla de negocio |
| Agrega o cambia una llamada a una tool de **escritura** | 🔴 Alto impacto (RN-03/RN-04) |
| Agrega IA en runtime o cambia su contexto | 🟡 Costo, latencia, PII |
| Cambia qué ve el pasajero | 🟡 RN-04 / RN-06 |

### 2. Preguntas de control
- [ ] ¿Quién consume esto? → `system_topology.json` → `dependsOn`
- [ ] ¿Está en `contracts/`? Si sí, **actualizar el contrato primero**
- [ ] ¿Toca una RN? ¿Cambia la regla o sólo la implementación?
- [ ] ¿Toca un comportamiento todavía abierto en `HALLAZGOS.md`?
- [ ] ¿Puede enviar al pasajero algo sin `policy_ref` o con datos no validados?
- [ ] ¿Puede ejecutar una escritura de alto impacto sin idempotency key o sin control humano?
- [ ] ¿Expone PII en logs, evidencia o prompts?
- [ ] ¿Requiere ADR? → `architecture-decision`
- [ ] ¿Qué `.feature` cubre el comportamiento actual? ¿Sigue pasando?

### 3. Presentar el análisis y esperar
```
Cambio:           [descripción]
Clasificación:    [🟢/🟡/🔴]
Consumidores:     [quién se ve afectado]
Contratos:        [cuáles actualizar y en qué orden]
Reglas:           [RN-0X]
Features:         [.feature que deben seguir pasando]
¿Retrocompatible? [sí/no + plan]
¿Requiere ADR?    [sí/no]
```

## Regla
Con 🔴 en cualquier fila, **no generar código** sin confirmación explícita del usuario.
