DIRECTORY="dist/vendor";
if [ ! -d "$DIRECTORY" ]; then
  mkdir $DIRECTORY
fi
cp vendor/BitGoJS.js $DIRECTORY/BitGoJS.js
echo "BitGoJS.js copied"