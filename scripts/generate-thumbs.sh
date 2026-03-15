#!/bin/bash
# Generate thumbnails (400px wide) for masonry gallery
# and register new images in obras.json
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OBRAS_DIR="$ROOT_DIR/public/obras"
THUMBS_DIR="$ROOT_DIR/public/obras/thumbs"
OBRAS_JSON="$ROOT_DIR/obras.json"

mkdir -p "$THUMBS_DIR"

new_count=0

for img in "$OBRAS_DIR"/*.jpg "$OBRAS_DIR"/*.JPG "$OBRAS_DIR"/*.jpeg "$OBRAS_DIR"/*.png; do
  [ -f "$img" ] || continue
  filename=$(basename "$img")

  # Skip variant images (e.g. name_01.jpg, name_02.jpg) — used as extra modal images
  basename_no_ext="${filename%.*}"
  if echo "$basename_no_ext" | grep -qE '_[0-9]{2}$'; then
    continue
  fi

  # Generate thumbnail if missing or outdated
  if [ ! -f "$THUMBS_DIR/$filename" ] || [ "$img" -nt "$THUMBS_DIR/$filename" ]; then
    echo "Generating thumb: $filename"
    sips --resampleWidth 400 "$img" --out "$THUMBS_DIR/$filename" 2>/dev/null
  fi

  # Add to obras.json if not already registered
  if ! grep -q "\"imagen\": \"$filename\"" "$OBRAS_JSON"; then
    slug="${filename%.*}"
    slug=$(echo "$slug" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

    # Ensure unique id
    base_slug="$slug"
    counter=1
    while grep -q "\"id\": \"$slug\"" "$OBRAS_JSON"; do
      slug="${base_slug}-${counter}"
      counter=$((counter + 1))
    done

    # Insert before the closing ] of the obras array
    # Build the new entry
    entry=$(cat <<ENTRY
    {
      "id": "$slug",
      "titulo": { "es": "No definido", "en": "No definido" },
      "año": null,
      "tecnica": { "es": "No definido", "en": "No definido" },
      "descripcion": { "es": "No definido", "en": "No definido" },
      "dimensiones": "No definido",
      "imagen": "$filename",
      "en_venta": false,
      "precio": null,
      "categoria": "No definido",
      "destacada": false,
      "propietario": null
    }
ENTRY
)

    # Use node to safely insert into JSON
    node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('$OBRAS_JSON', 'utf-8'));
      data.obras.push(JSON.parse(\`$entry\`));
      fs.writeFileSync('$OBRAS_JSON', JSON.stringify(data, null, 2) + '\n');
    "

    echo "  Added to obras.json: $slug ($filename)"
    new_count=$((new_count + 1))
  fi
done

if [ "$new_count" -gt 0 ]; then
  echo "Added $new_count new entries to obras.json"
else
  echo "No new images to register."
fi
echo "Done."
