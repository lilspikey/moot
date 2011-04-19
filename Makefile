SRC_DIR = src
DIST_DIR = dist

COMPILER = `which uglifyjs`

all:
	@@ if test ! -z ${COMPILER}; then \
		mkdir -p dist; \
		echo "Minifying moot.js"; \
		${COMPILER} src/moot.js >  dist/moot.min.js; \
	else \
		echo "You must have unglifyjs installed in order to minify moot."; \
	fi
