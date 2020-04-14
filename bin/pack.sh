DIST_PATH="dist/"
JS_SCRIPT=$DIST_PATH"index.bundle.js"
CSS_STYLE=$DIST_PATH"styles.bundle.css"

rm dist/*
cat static/app/css/*.css > $CSS_STYLE
node static/packages/bundlepacker/bundle.js static/app/source/index.js > $JS_SCRIPT
cp static/app/build/index.html $DIST_PATH
cp static/app/build/favicon.ico $DIST_PATH

echo "/*Compiled `date +%Y-%m-%d:%H:%M:%S`*/" >> $JS_SCRIPT
echo "/*Compiled `date +%Y-%m-%d:%H:%M:%S`*/" >> $CSS_STYLE

