#!/usr/bin/env bash
# Regenera la copia para el comité (Docs/) desde el Brain, que es la fuente de verdad.
#   brain/operations/sync-docs.sh          copia
#   brain/operations/sync-docs.sh --check  sólo compara; sale con 1 si la copia está desactualizada
# Docs/09 (resumen de HALLAZGOS.md) y Docs/15, 17, 18, 19 se mantienen a mano: no están en este mapa.
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"
check=false
[[ "${1:-}" == "--check" ]] && check=true

pairs=(
  "brain/product/01-definicion-negocio.md|Docs/01-definicion-negocio.md"
  "brain/product/02-objetivo-principal.md|Docs/02-objetivo-principal.md"
  "brain/product/03-descripcion-producto.md|Docs/03-descripcion-producto.md"
  "brain/product/04-atributos-de-valor.md|Docs/04-atributos-de-valor.md"
  "brain/product/05-objetivos-medibles.md|Docs/05-objetivos-medibles.md"
  "brain/product/06-atributos-funcionales.md|Docs/06-atributos-funcionales.md"
  "brain/contracts/logica-contratos.md|Docs/07-logica-contratos.md"
  "brain/product/08-flujo.md|Docs/08-flujo.md"
  "brain/product/10-as-is-to-be-e-impacto.md|Docs/10-as-is-to-be-e-impacto.md"
  "brain/product/11-reglas-de-negocio-y-restricciones.md|Docs/11-reglas-de-negocio-y-restricciones.md"
  "brain/product/12-sistemas-y-tecnologia-existente.md|Docs/12-sistemas-y-tecnologia-existente.md"
  "brain/product/13-alcance-presupuesto-y-plazos.md|Docs/13-alcance-presupuesto-y-plazos.md"
  "brain/product/14-okr.md|Docs/14-okr.md"
  "brain/contracts/disruption-assessment.md|Docs/16-contrato-disruption-assessment.md"
)
for f in brain/backlog/EP-01-*.md brain/backlog/HU-0*.md; do
  pairs+=("$f|Docs/epica/$(basename "$f")")
done

# Los links relativos del backlog apuntan desde brain/backlog/; en Docs/epica/ se reescriben.
transform_epica() {
  perl -pe '
    s{\.\./product/(\d\d-[\w-]+\.md)}{../$1}g;
    s{\.\./contracts/disruption-assessment\.md}{../16-contrato-disruption-assessment.md}g;
    s{\.\./contracts/logica-contratos\.md}{../07-logica-contratos.md}g;
    s{(?<![./])\.\./(?!\.\./|\d\d-)([\w-]+/)}{../../brain/$1}g;
    s{^> Copia limpia para el comité: .*$}{> Copia generada desde `brain/backlog/` con `brain/operations/sync-docs.sh`. **No se edita acá.**};
    $_ = "" if /^> \*\*Este archivo y los `HU-0XX-\*\.md` mandan\*\*/;
  ' "$1"
}

stale=0
for pair in "${pairs[@]}"; do
  src="${pair%%|*}"
  dst="${pair##*|}"
  if [[ "$dst" == Docs/epica/* ]]; then
    content="$(transform_epica "$src")"
  else
    content="$(cat "$src")"
  fi
  if $check; then
    if [[ ! -f "$dst" ]] || [[ "$content" != "$(cat "$dst")" ]]; then
      echo "desactualizado: $dst (fuente: $src)"
      stale=1
    fi
  else
    mkdir -p "$(dirname "$dst")"
    printf '%s\n' "$content" > "$dst"
  fi
done

if $check; then
  [[ $stale -eq 0 ]] && echo "Docs/ al día con el Brain"
  exit $stale
fi
echo "Docs/ regenerado desde el Brain (${#pairs[@]} archivos)"
