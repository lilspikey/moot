module("World");
test("create world", function() {
    var world = GameJS.world($('<div>'));
    ok(world !== undefined, "object returned for world");
});
test("world has expected methods", function() {
    var world = GameJS.world($('<div>'));
    ok(world.layer !== undefined, "layer method present");
    ok(world.defineAnimation !== undefined, "defineAnimation method present");
    ok(world.listAnimations !== undefined, "listAnimations method present");
    ok(world.collision !== undefined, "collision method present");
    ok(world.animate !== undefined, "animate method present");
    ok(world.update !== undefined, "update method present");
    ok(world.checkCollisions !== undefined, "checkCollisions method present");
    ok(world.sprite !== undefined, "sprite method present");
});
test("world create layer", function(){
    var world_elem = $('<div>');
    var world = GameJS.world(world_elem);
    var layer = world.layer('main-layer');
    ok(layer !== undefined, "layer returned");
    same(world.layer('main-layer'), layer, "layer not re-created");
});

module("Layer")
test("layer has expected methods", function(){
    var world_elem = $('<div>');
    var world = GameJS.world(world_elem);
    var layer = world.layer('main-layer');
    ok(layer.add !== undefined, "add method present");
    ok(layer.elem !== undefined, "add method present");
});
test("layer backed by div", function(){
    var world_elem = $('<div>');
    var world = GameJS.world(world_elem);
    var layer = world.layer('main-layer');
    var layer_elem = layer.elem();
    equals(layer_elem.attr('id'), 'main-layer', "correct layer id");
    ok(layer_elem.hasClass('layer'), "correct layer class");
    ok(layer_elem.get(0).nodeName.toLowerCase(), "div", "layer is div");
});
test("layer div in world", function(){
    var world_elem = $('<div>');
    var world = GameJS.world(world_elem);
    var layer = world.layer('main-layer');
    equals(world_elem.find('#main-layer').size(), 1,
           "world element contains layer div");
});


