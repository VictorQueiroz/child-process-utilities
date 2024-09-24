#!/bin/bash

lazy_printf() {
  # Forward all arguments of the function to `printf` correctly
  printf "$@"
  sleep 0.001
}

lazy_printf '%s\n' '{';

max_values=20
array_values=(10 20 30 40 50 60 70 80 90 100 true false '"xxx"' '"yyy"' '"zzz"')
array_values_length=${#array_values[@]}

for i in $(seq 0 $max_values);
do
  lazy_printf "  \"%s\": [" "value_$i"

  # Loop through the array values
  for j in $(seq 0 $((array_values_length - 1)));
  do
    last_index=$((array_values_length - 1))
    current_value="${array_values[$j]}"
    lazy_printf "%s" "$current_value"

    # printf "\n\n%s != %s\n\n" "$current_value" "${array_values[$((array_values_length - 1))]}"

    # Only print the last comma if it's not the last value
    if [ "$j" -ne $last_index ]; then
      lazy_printf '%s ' ','
      # printf "\n\n%s != %s\n" "$j" $((array_values_length - 1))
    fi

    # Decrease array_values_length by 1
    # array_values_length=$((array_values_length - 1))
  done
  lazy_printf '%s' ']'
  # Only print the last comma if it's not the last value
  if [ "$i" -ne "${max_values}" ]; then
    lazy_printf ','
  fi
  # Print end-of-array line
  lazy_printf '\n'
done

lazy_printf '}';