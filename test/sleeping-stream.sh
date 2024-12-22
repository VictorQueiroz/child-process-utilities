#!/bin/bash

# default_items=(a b c d e f g h i j k l m n o p q r s t u v w x y z)
for item in "$@"; do
  items+=("$item")
done

# Accept the `DURATION` environment variable, but also defined a default value of half a second
DURATION=${DURATION:-0.5}

for item in "${items[@]}"
do
  is_last_item=$(( ${#items[@]} - 1 ))
  printf "%s" "$item"

  # Sleep again before the comma
  sleep "$DURATION"

  if [ "$item" != "${items[$is_last_item]}" ]; then
    printf ","
  fi

  # Sleep more after the comma
  sleep "$DURATION"
done