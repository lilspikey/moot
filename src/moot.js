var Moot = (function($) {
    var VERSION = '0.0.1';

    var _simple_animation = function(sprite, options) {
        var a = $('<span></span>');
        sprite.elem().append(a);
        a.addClass(options.cssClass);
    
        var _frame = 0,
            _frames = options.frames || 1,
            _playing = true;
    
        var animation = {
            elem: function() {
                return a;
            },
            animate: function() {
                if ( _playing ) {
                    this.frame(_frame+1);
                }
                return animation;
            },
            pause: function() {
                _playing = false;
                return animation;
            },
            play: function() {
                _playing = true;
                return animation;
            },
            hide: function() {
                a.hide();
                return animation;
            },
            show: function() {
                a.show();
                return animation;
            },
            frame: function(frame) {
                if ( frame === undefined ) {
                    return _frame;
                }
                frame = frame % _frames;
                a.removeClass('frame-' + _frame).addClass('frame-' + frame);
                _frame = frame;
                return animation;
            }
        };
        
        return animation;
    };
    
    var _group_animation = function(animations, options) {
        var group = $.extend(true, [], options);
        
        var animation = {
            group: group,
            elem: function() {
                return null;
            },
            animate: function() {
                return animation;
            },
            pause: function() {
                for ( var i = 0; i < group.length; i++ ) {
                    animations[group[i]].pause();
                }
                return animation;
            },
            play: function() {
                for ( var i = 0; i < group.length; i++ ) {
                    animations[group[i]].play();
                }
                return animation;
            },
            hide: function() {
                for ( var i = 0; i < group.length; i++ ) {
                    animations[group[i]].hide();
                }
                return animation;
            },
            show: function(name) {
                for ( var i = 0; i < group.length; i++ ) {
                    var namei = group[i];
                    if ( name === undefined || name == namei ) {
                        animations[namei].show();
                    }
                    else {
                        animations[namei].hide();
                    }
                }
                return animation;
            },
            frame: function(frame) {
                if ( frame === undefined ) {
                    return;
                }
                for ( var i = 0; i < group.length; i++ ) {
                    group[i].frame(frame);
                }
                return animation;
            }
        };
        
        return animation;
    };
    
    var create_core_stylesheet = function(element) {
        var selector = element.selector;
        var css = [
            '{ overflow: hidden; position: relative; }',
            '.layer { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }',
            '.layer .sprite { position: absolute; }',
            '.layer .sprite span { position: absolute; }'
        ];
        for ( var i = 0; i < css.length; i++ ) {
            css[i] = selector + ' ' + css[i];
        }
        var cssText = css.join('\n');
        return $('<style type="text/css">'+cssText+'</style>');
    };
    
    return {
        version: VERSION,

        run_loop: function(callback, framerate) {
            framerate = framerate || 10.0;
            
            // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
            var requestAnimFrame = (function(){
                return  window.requestAnimationFrame       || 
                        window.webkitRequestAnimationFrame || 
                        window.mozRequestAnimationFrame    || 
                        window.oRequestAnimationFrame      || 
                        window.msRequestAnimationFrame     || 
                        function(callback,  element){
                            window.setTimeout(callback, 1000 / 60);
                        };
                })();
            
            var millis_per_frame = 1000.0/framerate;
            
            // TODO perhaps more robust way of trying to match desired framereate
            var last_time = new Date().getTime();
            (function animloop(){
                var now = new Date().getTime();
                if ( (now - last_time) >= millis_per_frame ) {
                    callback();
                    last_time = now;
                }
                requestAnimFrame(animloop, document.body);
            })();
        },
        world: function(element, options) {
            var defaults = {
                add_style_sheet: true,
                layer_id_prefix: 'layer',
                layer_class_name: 'layer',
                sprite_id_prefix: 'sprite',
                sprite_class_name: 'sprite'
            };  
            var world_options = $.extend(defaults, options); 
            var world_element = $(element);
            var layers = {};
            var sprites = {};
            var collision_handlers = {};
            var behaviors = {};
            
            if ( world_options.add_style_sheet ) {
                var stylesheet = create_core_stylesheet(world_element);
                world_element.after(stylesheet);
            }
            
            var register_collision_handler = function(type1, type2, handler) {
                if ( collision_handlers[type1] === undefined ) {
                    collision_handlers[type1] = {};
                }
                collision_handlers[type1][type2] = handler;
            };
            
            var handle_collision = function(sprite1, sprite2) {
                var types1 = sprite1.types(),
                    types2 = sprite2.types();
                for ( var type1 in types1 ) {
                    for ( var type2 in types2 ) {
                        if ( collision_handlers[type1] !== undefined ) {
                            handler = collision_handlers[type1][type2];
                            if ( handler !== undefined ) {
                                handler(sprite1, sprite2);
                            }
                        }
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
            
            var sweep = function(intervals) {
                intervals.sort(function(a,b) { return a.x - b.x; });
                
                var intersections = {};
                var active = {};
                for ( var i = 0; i < intervals.length; i++ ) {
                    var interval = intervals[i];
                    if ( interval.begin ) {
                        for ( var active_id in active ) {
                            var a = active_id,
                                b = interval.id;
                            if ( b < a ) {
                                var t = b;
                                b = a;
                                a = t;
                            }
                            
                            intersections[a+'-'+b] = {a:a, b:b};
                        }
                        active[interval.id] = 1;
                    }
                    else {
                        delete active[interval.id];
                    }
                }
                return intersections;
            };
            
            var get_element_args = function(element, proto, id_gen) {
                if ( !proto ) {
                    if ( element.selector === undefined ) {
                        proto = element;
                        element = null;

                        if ( typeof proto === "string" ) {
                            proto = { id: proto };
                        }
                    }
                }
                else if ( typeof element == "string" ) {
                    proto = proto || {};
                    proto.id = element;
                    element = null;                    
                }
                return { proto: proto, element: element };
            };

            var id_generator = function(prefix) {
                var last = 0;
                return {
                    next: function() {
                        for ( ;; ) {
                            last++;
                            var next = prefix + last;
                            if ( $('#' + next).length == 0 ) {
                                return next;
                            }
                        }
                    }
               }
            }

            var layer_id = id_generator(world_options.layer_id_prefix);
            var sprite_id = id_generator(world_options.sprite_id_prefix);
            
            var find_id_from_element = function(element, proto, id_gen) {
                return (proto && proto.id) || (element && element.attr('id')) || id_gen.next();
            }

            var world_obj = {

                layer: function(id) {
                    return layers[id];
                },
                
                /**
                 * create a layer using the given element and/or prototype.
                 * both parameters are optional.
                 * if no element is given then one will be generated and assigned
                 * an id and class.
                 **/
                create_layer: function(element, proto) {
                    var args = get_element_args(element, proto);
                    element = args.element;
                    proto = args.proto;
                    
                    var id = find_id_from_element(element, proto, layer_id);
                    var l = (element || $('<div />')).attr({id: id}).addClass(world_options.layer_class_name);
                    if ( world_element.find('#'+id).size() == 0 ) {
                        world_element.append(l);
                    }
                    
                    var layer_obj ={
                        add: function(sprite) {
                            l.append(sprite.elem());
                        },
                        elem: function() {
                            return l;
                        },
                        update: function() {
                            
                        }
                    };
                    layers[id] = layer_obj;
                    
                    layer_obj = $.extend(layer_obj, proto);

                    // initialise from DOM
                    l.children('.' + world_options.sprite_class_name).each(function() {
                        world_obj.create_sprite($(this));
                    });

                    return layer_obj;
                },
                
                collision: function(types1, types2, handler) {
                    // register handler and it's inverse
                    types1 = types1.split(/\s+/);
                    types2 = types2.split(/\s+/);
                    for ( var i = 0; i < types1.length; i++ ) {
                        var type1 = types1[i];
                        for ( var j = 0; j < types2.length; j++ ) {
                            var type2 = types2[j];
                            register_collision_handler(type1, type2, handler);
                            if ( type1 != type2 ) {
                                register_collision_handler(type2, type1, function(a,b) { handler(b,a) });
                            }
                        }
                    }
                    return this;
                },

                /**
                 * define an additional update and/or init function that
                 * will be run for each sprite of the given type(s)
                 * if a function is passed it will be used as an update function,
                 * otherwise pass a object with an init and/or update function
                 **/
                behavior: function(types, behavior) {
                    if ( typeof behavior == 'function' ) {
                        behavior = { update: behavior };
                    }
                    types = types.split(/\s+/);
                    for ( var i = 0; i < types.length; i++ ) {
                        var type = types[i];
                        behaviors[type] = behavior;

                        // init behavior on existing sprites
                        for ( var id in sprites ) {
                            sprites[id].initBehavior(type);
                        }
                    }
                    return this;
                },
                
                run_loop: function(framerate) {
                    var world = this;
                    Moot.run_loop(function() {
                        world.animate();
                        world.update();
                        world.checkCollisions();
                    }, framerate);
                },
                
                animate: function() {
                    for ( var id in sprites ) {
                        sprites[id].animate();
                    }
                },
                
                width: function(w) {
                    if ( w === undefined ) {
                        return world_element.width();
                    }
                    world_element.width(w);
                    return this;
                },
                
                height: function(h) {
                    if ( h === undefined ) {
                        return world_element.height();
                    }
                    world_element.height(h);
                    return this;
                },
                
                update: function() {
                    for ( var id in layers ) {
                        layers[id].update();
                    }
                    for ( var id in sprites ) {
                        var sprite = sprites[id];
                        for ( var type in sprite.types() ) {
                            if ( behaviors[type] ) {
                                var update = behaviors[type].update;
                                update.call(sprite);
                            }
                        }
                        sprite.update();
                    }
                },
                
                checkCollisionsBruteForce: function() {
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
                
                checkCollisions: function() {
                    // Sweep and Prune 
                    // http://web.imrc.kist.re.kr/~jwkim/course/PBA2008/Sweep%20and%20Prune%20Algorithm.pdf
                    var xintervals = [];
                    var yintervals = [];
                    
                    for ( var id in sprites ) {
                        var sprite = sprites[id];
                        xintervals.push({ begin: true, id: id, x: sprite.x() });
                        xintervals.push({ begin: false, id: id, x: (sprite.x() + sprite.width()) });
                        yintervals.push({ begin: true, id: id, x: sprite.y() });
                        yintervals.push({ begin: false, id: id, x: (sprite.y() + sprite.height()) });
                    }
                    
                    var xintersections = sweep(xintervals);
                    var yintersections = sweep(yintervals);
                    
                    for ( var key in xintersections ) {
                        if ( key in yintersections ) {
                            var intersection = xintersections[key];
                            handle_collision(sprites[intersection.a], sprites[intersection.b]);
                        }
                    }
                },
                
                sprite: function(id, proto) {
                   return sprites[id];
                },

                create_sprite: function(element, proto) {
                    var args = get_element_args(element, proto);
                    element = args.element;
                    proto = args.proto;
                    var id = find_id_from_element(element, proto, sprite_id);
                    var s = (element || $('<div />')).addClass(world_options.sprite_class_name).attr({id: id});
                    var _animations = {};
                    var _animation_groups = {};
                    var _obj = { 
                        x: s.position().left,
                        y: s.position().top,
                        width: s.width(),
                        height: s.height(),
                        types: {}
                    };

                    var _hide_after_frames = -1;
                    
                    var obj = {
                        id: function() {
                            return id;
                        },
                        elem: function() {
                            return s;
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
                        destroy: function() {
                            obj.elem().remove();
                            delete sprites[id];
                        },
                        hide: function() {
                            obj.elem().hide();
                            return obj;
                        },
                        show: function(num_frames) {
                            obj.elem().show();
                            if ( num_frames === undefined) {
                                _hide_after_frames = -1;
                            }
                            else {
                                _hide_after_frames = num_frames;
                            }
                            return obj;
                        },
                        /**
                         * get/set an animation with the given name.
                         * options is an object with properties
                         *  cssClass - css class name for animation
                         *  frames - number of frames for animation
                         *  group - (optional) name of group of animations this belongs to (show hides other animation in group)
                         **/
                        animation: function(name, options) {
                            if ( options === undefined ) {
                                return _animations[name];
                            }
                            
                            var animation;
                            
                            if ( !$.isArray(options) ) {
                                animation = _simple_animation(this, options);
                            }
                            else {
                                animation = _group_animation(_animations, options)
                            }
                            
                            _animations[name] = animation;
                            
                            return obj;
                        },
                        removeAnimation: function(name) {
                            // TODO remove from group
                            if ( name in _animations ) {
                                _animations[name].remove();
                                delete _animations[name];
                            }
                            return obj;
                        },
                        animate: function() {
                            if ( _hide_after_frames >= 0 ) {
                                if ( _hide_after_frames === 0 ) {
                                    obj.hide();
                                }
                                _hide_after_frames--;
                            }
                            for ( var name in _animations ) {
                                _animations[name].animate();
                            }
                        },
                        update: function() {
                            
                        },
                        types: function() {
                            return _obj.types;
                        },
                        addType: function(type) {
                            _obj.types[type]=true;
                            s.addClass(type);
                            this.initBehavior(type);
                            return obj;
                        },
                        removeType: function(type) {
                            delete _obj.types[type];
                            s.removeClass(type);
                            return obj;
                        },
                        initBehavior: function(type) {
                            if ( type in _obj.types ) {
                                if ( behaviors[type] ) {
                                    var behavior = behaviors[type];
                                    if ( behavior ) {
                                        var init = behavior.init;
                                        if ( init ) {
                                            init.call(obj);
                                        }
                                    }
                                }
                            }
                        }
                    };
                    sprites[id] = obj;
                    obj = $.extend(obj, proto);

                    // now load any types (which may trigger actions)
                    var classes = s.attr('class').split(/\s+/);
                    for ( var i = 0; i < classes.length; i++ ) {
                        var type = classes[i];
                        if ( type != world_options.sprite_class_name ) {
                            obj.addType(type);
                        }
                    }

                    return obj;
                }
            }

            // initialise from DOM
            world_element.
                children('.' + world_options.layer_class_name).each(function() {
                    world_obj.create_layer($(this));
                });

            return world_obj;
        }
    };
})(jQuery);
