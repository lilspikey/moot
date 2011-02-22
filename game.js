var GameJS = (function($) {
    return {
        world: function(element) {
            var world_element = $(element);
            var layers = {};
            var animations = {};
            var sprites = {};
            var collision_handlers = {};
            
            var register_collision_handler = function(type1, type2, handler) {
                if ( collision_handlers[type1] === undefined ) {
                    collision_handlers[type1] = {};
                }
                collision_handlers[type1][type2] = handler;
            };
            
            var handle_collision = function(sprite1, sprite2) {
                var type1 = sprite1.type(),
                    type2 = sprite2.type();
                if ( collision_handlers[type1] !== undefined ) {
                    handler = collision_handlers[type1][type2];
                    if ( handler !== undefined ) {
                        handler(sprite1, sprite2);
                    }
                }
            };
            
            var colliding = function(sprite1, sprite2) {
                var x1 = sprite1.x(), y1 = sprite1.y(),
                    w1 = sprite1.width(), h1 = sprite1.height(),
                    x2 = sprite2.x(), y2 = sprite2.y(),
                    w2 = sprite2.width(), h2 = sprite2.height();
                
                return !(x2 > (x1+w1) ||
                         (x2+w2) < x1 ||
                         y2 > (y1+h1) ||
                         (y2+h2) < y1);
            };
            
            var obj = {
                layer: function(id) {
                    if ( id in layers ) {
                        return layers[id];
                    }
                    
                    var l = $('<div class="layer"></div>').attr({id: id});
                    world_element.append(l);
                    
                    var obj ={
                        add: function(sprite) {
                            l.append(sprite._elem);
                        }
                    };
                    layers[id] = obj;
                    return obj;
                },
                
                defineAnimation: function(name, params) {
                    animations[name] = params;
                    return obj;
                },
                
                listAnimations: function(fps) {
                    if ( fps === undefined ) {
                        fps = 10;
                    }
                    // for debugging list all animations defined
                    var list = $('<dl class="debug-animations"></dl>');
                    for ( var name in animations ) {
                        var dd = $('<dd></dd>');
                        var sprite = obj.sprite('debug-'+name);
                        sprite.animation(name);
                        dd.append(sprite._elem);
                        list.append($('<dt></dt>').text(name)).append(dd);
                        
                        (function(sprite) {
                            setInterval(function() { sprite.animate(); }, (1000/fps));
                        })(sprite);
                    }
                    world_element.after(list)
                },
                
                collision: function(type1, type2, handler) {
                    // TODO maybe allow space separated types? so
                    // can easily register same behaviour for
                    // multiple types at once
                    
                    // register handler and it's inverse
                    register_collision_handler(type1, type2, handler);
                    register_collision_handler(type2, type1, function(a,b) { handler(b,a) });
                },
                
                animate: function() {
                    for ( var id in sprites ) {
                        sprites[id].animate();
                    }
                },
                
                update: function() {
                    for ( var id in sprites ) {
                        sprites[id].update();
                    }
                },
                
                checkCollisions: function() {
                    // TODO use quadtree or something
                    // so we're not doing N*N checks
                    var sprite_arr = [];
                    for ( var id in sprites ) {
                        sprite_arr.push(sprites[id]);
                    }
                    
                    var len = sprite_arr.length;
                    for ( var i = 0; i < len; i++ ) {
                        var spritei = sprite_arr[i];
                        for ( var j = i+1; j < len; j++ ) {
                            var spritej = sprite_arr[j];
                            if ( colliding(spritei, spritej) ) {
                                handle_collision(spritei, spritej);
                            }
                        }
                    }
                },
                
                sprite: function(id, proto) {
                    if ( id in sprites ) {
                        return sprites[id];
                    }
                    
                    if ( proto == undefined ) {
                        proto = {};
                    }
                    
                    var s = $('<div class="sprite"></div>').attr({id: id});
                    var _animations = {};
                    var _obj = {x:0, y:0, width:0, height:0};
                    
                    var obj = {
                        _elem: s,
                        id: function() {
                            return id;
                        },
                        x: function(x) {
                            if (x !== undefined) {
                                s.css('left', x);
                                _obj.x = x;
                                return obj;
                            }
                            return _obj.x;
                        },
                        y: function(y) {
                            if (y !== undefined) {
                                s.css('top', y);
                                _obj.y = y;
                                return obj;
                            }
                            return _obj.y;
                        },
                        width: function(w) {
                            if (w !== undefined) {
                                s.width(w);
                                _obj.width = w;
                                return obj;
                            }
                            return _obj.width;
                        },
                        height: function(h) {
                            if (h !== undefined) {
                                s.height(h);
                                _obj.height = h;
                                return obj;
                            }
                            return _obj.height;
                        },
                        animation: function(name, animation) {
                            if ( animation === undefined ) {
                                animation = name;
                            }
                            if ( !(name in _animations) ) {
                                var a = $('<span></span>');
                                s.append(a);
                                _animations[name] = { elem: a };
                            }
                            var a = _animations[name];
                            a.elem.attr('class', animation);
                            a.animation = animation;
                            a.frame = 0;
                            
                            return obj;
                        },
                        removeAnimation: function(name) {
                            if ( name in _animations ) {
                                _animations[name].remove();
                                delete _animations[name];
                            }
                            return obj;
                        },
                        animate: function() {
                            for ( var name in _animations ) {
                                var a = _animations[name];
                                var frame = a.frame;
                                var next = (frame + 1) % animations[a.animation].frames;
                                a.elem.removeClass('frame-'+frame).addClass('frame-'+next);
                                a.frame = next;
                            }
                        },
                        update: function() {
                            
                        },
                        type: function() {
                            return '';
                        }
                    };
                    sprites[id] = obj;
                    return $.extend(obj, proto);
                }
            }
            return obj;
        }
    };
})(jQuery);