#!/bin/sh

echo '{';

for i in 1 2 3 4 5
do
  echo -n " \"value_$i\": [";
  for j in 10 20 30 40 50
  do
    echo -n "$j"
    # Only print the last comma if it's not the last value
    if [ $j -ne 50 ]; then
      echo -n ', '
    fi
  done
  echo -n ']'
  # Only print the last comma if it's not the last value
  if [ $i -ne 5 ]; then
    echo ','
  fi
done

echo
echo '}';