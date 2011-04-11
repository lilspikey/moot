var Moot = (function($) {
    return {
        world: function(element) {
            var world_element = $(element);
            var layers = {};
            var sprites = {};
            var collision_handlers = {};
            
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
            
            var obj = {
                layer: function(id) {
                    if ( id in layers ) {
                        return layers[id];
                    }
                    
                    var l = $('<div class="layer"></div>').attr({id: id});
                    world_element.append(l);
                    
                    var obj ={
                        add: function(sprite) {
                            l.append(sprite.elem());
                        },
                        elem: function() {
                            return l;
                        }
                    };
                    layers[id] = obj;
                    return obj;
                },
                
                /*defineAnimation: function(name, options) {
                    options = $.extend({ frames: 1 }, options);
                    if (!options.animate) {
                        options.animate = function(sprite, animation) {
                            var frames = options.frames;
                            if ( frames > 1 ) {
                                var frame = animation.frame;
                                var next = (frame + 1) % frames;
                                animation.elem.removeClass('frame-'+frame).addClass('frame-'+next);
                                animation.frame = next;
                            }
                        }
                    }
                    animations[name] = options;
                    return obj;
                },*/
                
                /*listAnimations: function(fps) {
                    if ( fps === undefined ) {
                        fps = 10;
                    }
                    // for debugging list all animations defined
                    var list = $('<dl class="debug-animations"></dl>');
                    for ( var name in animations ) {
                        var dd = $('<dd></dd>');
                        var sprite = obj.sprite('debug-'+name);
                        sprite.animation(name);
                        dd.append(sprite.elem());
                        list.append($('<dt></dt>').text(name)).append(dd);
                        
                        (function(sprite) {
                            setInterval(function() { sprite.animate(); }, (1000/fps));
                        })(sprite);
                    }
                    world_element.after(list)
                },*/
                
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
                    if ( id in sprites ) {
                        return sprites[id];
                    }
                    
                    if ( proto == undefined ) {
                        proto = {};
                    }
                    
                    var s = $('<div class="sprite"></div>').attr({id: id});
                    var _animations = {};
                    var _animation_groups = {};
                    var _obj = {x:0, y:0, width:0, height:0, types: {}};
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
                            
                            var a = $('<span></span>');
                            s.append(a);
                            a.addClass(options.cssClass);
                            
                            var _group = null;
                            if ( options.group ) {
                                if ( !_animation_groups[options.group] ) {
                                    _animation_groups[options.group] = [];
                                }
                                _group = _animation_groups[options.group];
                            }
                            
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
                                    if ( _group ) {
                                        for ( var i = 0; i < _group.length; i++ ) {
                                            if ( _group[i] != this ) {
                                                _group[i].hide();
                                            }
                                        }
                                    }
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
                            
                            _animations[name] = animation;
                            if ( _group ) {
                                _group.push(animation);
                            }
                            
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
                            return obj;
                        },
                        removeType: function(type) {
                            delete _obj.types[type];
                            s.removeClass(type);
                            return obj;
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