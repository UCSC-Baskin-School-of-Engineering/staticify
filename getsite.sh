#!/usr/bin/env bash

# Staticify

# Usage message
if [ -z "$1" ]; then
  echo "Usage: bash getsite.sh <domain_name> [--hide-html]"
  echo "Example: bash getsite.sh www.example.com"
  exit 1
fi

# Abort script if there's an error
set -e

# Check if cheerio is installed
npm list cheerio > /dev/null

# Create directory for website
mkdir $1

# Create static copy of website
wget -o $1/.download.log -e robots=off -N -S -x -r -p -l inf -E --convert-links --domains="`echo $1`" $1 || echo ""

if [ "$2" = "--hide-html" ]; then
  # In all .html files, make sure links don't end in .html
  for file in $(find $1 -name '*.html'); do
    node replace_extensions.js $file && echo "Parsed $file" &
  done
  wait
fi

# Done!
echo ""
echo "Successfully staticified: $1"
