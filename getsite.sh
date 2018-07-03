#!/usr/bin/env bash

if [ "$#" -ne 1 ]; then
  echo "Usage: bash getsite.sh <domain_name>"
  echo "Example: bash getsite.sh www.example.com"
  exit 1
fi

set -e

mkdir $1
wget -o $1/.download.log -e robots=off --debug -N -S --random-wait -x -r -p -l inf -E --convert-links --domains="`echo $1`" $1

for file in $(find $1 -name '*.html'); do
  node replace_extensions.js $file && echo "Parsed $file" &
done
wait
