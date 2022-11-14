DIST_PATH=${1:-'dist'}
JS_SCRIPT=$DIST_PATH/index.bundle.js
CSS_STYLE=$DIST_PATH/styles.bundle.css

mkdir -p $DIST_PATH
rm -rf $DIST_PATH/*

cp static/app/build/index.html $DIST_PATH
cp static/app/build/favicon.ico $DIST_PATH

node static/packages/bundlepacker/bundler.js -i static/app/source/index.js -o $JS_SCRIPT -r report.json
echo "/*Compiled `date +%Y-%m-%d:%H:%M:%S`*/" >> $JS_SCRIPT
cat static/app/css/*.css > $CSS_STYLE
echo "/*Compiled `date +%Y-%m-%d:%H:%M:%S`*/" >> $CSS_STYLE

ls -l $DIST_PATH
