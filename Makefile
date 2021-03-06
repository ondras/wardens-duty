FILES = def cell entity being level debug pc rules gauge chest trap pool shopkeeper bestiary minimap game
JS = $(foreach file,$(FILES),src/js/$(file).js)

all: app.js app.css

app.js: $(JS)
	rm -f $@
	babel $^ -o $@

app.css: $(wildcard src/css/*)
	rm -f $@
	lessc src/css/app.less $@

watch: all
	while inotifywait -r src ; do make $^ ; done

.PHONY: all watch
