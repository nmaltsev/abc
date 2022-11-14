DIST_PATH=${1:-'dist'}
JS_SCRIPT=$DIST_PATH/index.bundle.js
CSS_STYLE=$DIST_PATH/styles.bundle.css

mkdir -p $DIST_PATH
rm -rf $DIST_PATH/*

cp src/app/assets/index.html $DIST_PATH
cp src/app/assets/favicon.ico $DIST_PATH

node src/packages/bundlepacker/bundler.js -i src/app/source/index.js -o $JS_SCRIPT -r report.json
echo "/*Compiled `date +%Y-%m-%d:%H:%M:%S`*/" >> $JS_SCRIPT
cat src/app/css/*.css > $CSS_STYLE
echo "/*Compiled `date +%Y-%m-%d:%H:%M:%S`*/" >> $CSS_STYLE

ls -l $DIST_PATH
