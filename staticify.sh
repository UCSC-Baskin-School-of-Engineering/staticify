#!/usr/bin/env bash

# Staticify

# Usage message
if [ -z "$1" ]; then
  echo "Usage: bash staticify.sh <domain_name>"
  echo "Example: bash staticify.sh www.example.com"
  exit 1
fi

# Abort script if there's an error
set -e

# Move to static_websites directory
mkdir -p static_websites
cd static_websites

# Check if cheerio is installed
npm list cheerio > /dev/null

# Create directory for website
mkdir $1

# Create static copy of website
wget -e robots=off -N -S -x -r -p --restrict-file-names=unix \
    -l inf -E --convert-links --domains="`echo $1`" $1 || echo ""

# Remove form pages
rm -rf $1/user
rm -f $1/search.html
rm -rf $1/search
rm -rf $1/system/files/secure-attachments

# In all .html files, clean the DOM of forms and bad links
while IFS= read -r -d '' file; do # this looping method allows spaces in filename
  node ../clean_page.js "$file" && echo "Parsed $file" &
done < <(find $1 -type f -name '*.html' -print0)
wait

node ../create_404.js "$1"

# Done!
echo ""
echo "Successfully staticified: $1"
