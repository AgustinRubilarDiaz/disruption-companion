# Modelo por fase (opcional — optimiza costos)

> Los nombres de modelo envejecen: revisar esta tabla con su fecha. Si el modelo no está disponible,
> seguir con el de la sesión principal y avisar. Nunca sustituir en silencio.

**Última revisión:** 2026-10-29

| Perfil | Fases | Cursor | Claude Code |
|---|---|---|---|
| `razonamiento` | Plan, BDD, ADR, gates, versionado, brain-update | Modelo de la sesión principal | Modelo de la sesión principal |
| `ejecución` | P2 fase 4, P3 fase 3 (implementar lo aprobado) | `claude-sonnet-5-5-high` vía subagente | `sonnet` vía subagente `implementador` |

Verificar después de cada delegación con qué modelo corrió el subagente.
