#!/usr/bin/env bash

# Staticify

# Usage message
if [ "$#" -ne 1 ]; then
  echo "Usage: bash getsite.sh <domain_name>"
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
wget -o $1/.download.log -e robots=off -N -S --random-wait -x -r -p -l inf -E --convert-links --domains="`echo $1`" $1 || echo ""

# In all .html files, make sure links don't end in .html
for file in $(find $1 -name '*.html'); do
  node replace_extensions.js $file && echo "Parsed $file" &
done
wait

# Done!
echo ""
echo "Successfully staticified: $1"
