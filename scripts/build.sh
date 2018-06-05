#!/bin/sh

echo Making build directory structure...
rm -Rf dist

mkdir dist
mkdir dist/js
mkdir dist/css
mkdir dist/fonts
mkdir dist/img

echo Building...
cp -Rf js/* dist/js
cp -Rf css/* dist/css
cp -Rf fonts/* dist/fonts
cp -Rf img/* dist/img
cp manifest.json dist/
cp options.html dist/
cp popup.html dist/

echo Grabbing 3rd party assets...
cp node_modules/jquery/dist/jquery.min.js dist/js

echo --- Finished ---
