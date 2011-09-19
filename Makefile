SRC_DIR = src
DIST_DIR = dist

COMPILER = `which uglifyjs`

all:
	@@ if test ! -z ${COMPILER}; then \
		mkdir -p dist; \
		echo "Minifying moot.js"; \
		${COMPILER} src/moot.js >  dist/moot.min.js; \
	else \
		echo "You must have uglifyjs installed in order to minify moot."; \
		echo " see https://github.com/mishoo/UglifyJS"; \
	fi
