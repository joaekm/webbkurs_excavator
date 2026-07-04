#!/usr/bin/env bash
#
# update-content.sh — synkar kursinnehåll från Obsidian-valvet till content/.
#
# Kopierar modulfiler (NN Modulnamn.md), quizfiler (NN Modulnamn.quiz.md) och
# bilder från valvets Kurs-mapp. Spec-dokumenten (Kravspec, Innehållskontrakt,
# Agentpromptar, CLAUDE-instruktionen) och bildindexet kopieras INTE — bara det
# appen faktiskt renderar.
#
# Modul-/quizfiler känns igen på tvåsiffrigt ordningsnummer + mellanslag i
# början av filnamnet (t.ex. "03 Grundkörning.md"). Fixturen 99 Exempel lämnas
# orörd.
#
# Användning:
#   ./scripts/update-content.sh              # använder standardsökväg till valvet
#   ./scripts/update-content.sh /sökväg/till/Kurs
#   VAULT_KURS=/annan/Kurs ./scripts/update-content.sh
#
# Efter körning: starta om servern (innehållet cachas vid uppstart).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$REPO_ROOT/content"
DEST_IMAGES="$DEST/images"

DEFAULT_VAULT="/Users/joaekm/Vaults/Personligt/Bevattningsdamm/Kurs"
VAULT="${1:-${VAULT_KURS:-$DEFAULT_VAULT}}"

if [[ ! -d "$VAULT" ]]; then
  echo "FEL: hittar inte valvets Kurs-mapp: $VAULT" >&2
  echo "Ange sökväg som argument eller sätt VAULT_KURS." >&2
  exit 1
fi

mkdir -p "$DEST_IMAGES"

echo "Källa:  $VAULT"
echo "Mål:    $DEST"
echo

# --- Modul- och quizfiler (NN ...md) ---------------------------------------
modules=0
shopt -s nullglob
for f in "$VAULT"/[0-9][0-9]\ *.md; do
  base="$(basename "$f")"
  cp -f "$f" "$DEST/$base"
  echo "  modul/quiz  $base"
  modules=$((modules + 1))
done
shopt -u nullglob

if [[ $modules -eq 0 ]]; then
  echo "  (inga modul-/quizfiler hittades i valvet)"
fi

# --- Bilder ----------------------------------------------------------------
echo
images=0
if [[ -d "$VAULT/images" ]]; then
  shopt -s nullglob nocaseglob
  for img in "$VAULT/images"/*.{jpg,jpeg,png,gif,webp,svg,avif}; do
    base="$(basename "$img")"
    cp -f "$img" "$DEST_IMAGES/$base"
    images=$((images + 1))
  done
  shopt -u nullglob nocaseglob
  echo "  $images bild(er) kopierade till content/images/"
else
  echo "  (ingen images-mapp i valvet)"
fi

echo
echo "Klart: $modules modul-/quizfil(er), $images bild(er)."
echo "Fixturen 99 Exempel lämnades orörd — ta bort den manuellt när riktiga"
echo "moduler räcker."
echo "Starta om servern för att ladda om innehållet (npm run dev / npm start)."
