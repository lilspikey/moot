module("World");
test("create world", function() {
    var world = Moot.world($('<div>'));
    ok(world !== undefined, "object returned for world");
});
test("world has expected methods", function() {
    var world = Moot.world($('<div>'));
    ok(world.layer !== undefined, "layer method present");
    ok(world.collision !== undefined, "collision method present");
    ok(world.animate !== undefined, "animate method present");
    ok(world.update !== undefined, "update method present");
    ok(world.checkCollisions !== undefined, "checkCollisions method present");
    ok(world.sprite !== undefined, "sprite method present");
});
test("world create layer from id", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var layer = world.create_layer('main-layer');
    ok(layer !== undefined, "layer returned");
    same(world.layer('main-layer'), layer, "layer was not created");
});
test("world create layer from element", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var layer = world.create_layer($('<div id="main-layer"></div>'));
    ok(layer !== undefined, "layer returned");
    same(world.layer('main-layer'), layer, "layer was not created");
});
test("world create sprite", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var sprite = world.create_sprite('main-sprite');
    ok(sprite !== undefined, "sprite returned");
    same(world.sprite('main-sprite'), sprite, "sprite not re-created");
});
test("world create sprite from element", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var sprite = world.create_sprite($('<div id="main-sprite"></div>'));
    ok(sprite !== undefined, "sprite returned");
    same(world.sprite('main-sprite'), sprite, "sprite not re-created");
});
test("world initialised layers from DOM", function() {
    var world_elem = $('<div><div id="dom-layer" class="layer"></div><div class="layer"></div></div>')
    var world = Moot.world(world_elem);
    var domLayer = world.layer('dom-layer');
    ok(domLayer !== undefined, "dom layer created with world");
});
test("world initialised layers and sprites from DOM", function() {
    var world_elem = $('<div><div id="dom-layer" class="layer"><div id="a-sprite" class="sprite"></div></div><div class="layer"></div></div>')
    var world = Moot.world(world_elem);
    var domLayer = world.layer('dom-layer');
    ok(domLayer !== undefined, "dom layer created with world");
    var aSprite = world.sprite('a-sprite');
    ok(aSprite !== undefined, "sprite created with world");
});

module("Layer")
test("layer has expected methods", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var layer = world.create_layer('main-layer');
    ok(layer.add !== undefined, "add method present");
    ok(layer.elem !== undefined, "add method present");
});
test("layer backed by div", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var layer = world.create_layer('main-layer');
    var layer_elem = layer.elem();
    equals(layer_elem.attr('id'), 'main-layer', "correct layer id");
    ok(layer_elem.hasClass('layer'), "correct layer class");
    ok(layer_elem.get(0).nodeName.toLowerCase(), "div", "layer is div");
});
test("layer div in world", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var layer = world.create_layer('main-layer');
    equals(world_elem.find('#main-layer').size(), 1,
           "world element contains layer div");
});
test("layer uses existing div", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var layer = world.create_layer($('<div id="main-layer" class="other-class"></div>'));
    var layer_elem = layer.elem();
    equals(layer_elem.attr('id'), 'main-layer', "correct layer id");
    ok(layer_elem.hasClass('layer'), "correct layer class");
    ok(layer_elem.hasClass('other-class'), "has existing class");
    ok(layer_elem.get(0).nodeName.toLowerCase(), "div", "layer is div");
});
test("layer existing div in world", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var layer = world.create_layer($('<div id="main-layer"></div>'));
    equals(world_elem.find('#main-layer').size(), 1,
           "world element contains layer div");
});
test("layer add sprite", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var layer = world.create_layer('main-layer');
    var sprite = world.create_sprite('main-sprite');
    
    equals(world_elem.find('#main-layer > #main-sprite').size(), 0,
           "no sprite initially");
    
    layer.add(sprite);
    
    equals(world_elem.find('#main-layer > #main-sprite').size(), 1,
          "sprite in layer after adding");

});

module("Sprite")
test("sprite backed by div", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var sprite = world.create_sprite('main-sprite');
    var sprite_elem = sprite.elem();
    equals(sprite_elem.attr('id'), 'main-sprite', "correct sprite id");
    ok(sprite_elem.hasClass('sprite'), "correct sprite class");
    ok(sprite_elem.get(0).nodeName.toLowerCase(), "div", "sprite is div");
});
test("animation backed by span inside sprite div", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var sprite = world.create_sprite('main-sprite');
    equals(sprite, sprite.animation('animation', { cssClass: 'animation-class', frames: 2 }));
    
    var animation_elem = sprite.animation('animation').elem();
    ok(animation_elem.hasClass('animation-class'), 'animation has right class');
    ok(animation_elem.get(0).nodeName.toLowerCase(), "span", "animation is div");
    
    var sprite_elem = sprite.elem();
    equals(sprite_elem.find('span.animation-class').get(0), animation_elem.get(0), 'sprite div contains animation span');
});
test("sprite types loaded from DOM", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var sprite = world.create_sprite($('<div id="main-sprite" class="my-type"></div>'));
    ok('my-type' in sprite.types(), "sprite has type from DOM");
});

module("Behavior")
test("behavior init run", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    world.behavior('my-type', {
        init: function() {
            this.initRan = true;
        }
    });
    var sprite = world.create_sprite($('<div id="main-sprite" class="my-type"></div>'));
    ok(sprite.initRan, "init behavior ran");
});

module("Animation")
test("frame updates class", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var sprite = world.create_sprite('main-sprite');
    equals(sprite, sprite.animation('animation', { cssClass: 'animation-class', frames: 2 }));
    
    var animation = sprite.animation('animation');
    animation.frame(0);
    equals(0, animation.frame());
    ok(animation.elem().hasClass('frame-0'), "has frame-0 class");
    
    animation.frame(1);
    equals(1, animation.frame());
    ok(animation.elem().hasClass('frame-1'), "has frame-1 class");
    ok(!animation.elem().hasClass('frame-0'), "no longer has frame-0 class");
});
test("animate, pause and play", function() {
    var world_elem = $('<div>');
    var world = Moot.world(world_elem);
    var sprite = world.create_sprite('main-sprite');
    equals(sprite, sprite.animation('animation', { cssClass: 'animation-class', frames: 2 }));
    
    var animation = sprite.animation('animation');
    animation.frame(0);
    equals(0, animation.frame());
    animation.animate();
    equals(1, animation.frame());
    animation.animate();
    equals(0, animation.frame());
    
    animation.pause();
    animation.animate();
    equals(0, animation.frame());
    
    animation.play();
    animation.animate();
    equals(1, animation.frame());
});
