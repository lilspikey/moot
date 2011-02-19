var GameJS = (function($) {
    return {
        world: function(element) {
            var world_element = $(element);
            var layer_elements = {};
            var sprite_elements = {};
            var animations = {};
            
            return {
                layer: function(id) {
                    if ( !(id in layer_elements) ) {
                        layer_elements[id] = $('<div class="layer"></div>').attr({id: 'layer-'+id});
                        world_element.append(layer_elements[id]);
                    }
                    var l = layer_elements[id];
                    
                    return {
                        add: function(sprite) {
                            var s = sprite_elements[sprite.id()];
                            l.append(s);
                        }
                    };
                },
                
                defineAnimation: function(name, obj) {
                    animations[name] = obj;
                },
                
                sprite: function(id) {
                    if ( !(id in sprite_elements) ) {
                        sprite_elements[id]= $('<div class="sprite"></div>').attr({id: 'sprite-'+id});
                    }
                    var s = sprite_elements[id];
                    var _animations = {};
                    var _obj = {x:0, y:0, width:0, height:0};
                    
                    var obj = {
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
                                var a = $('<span></span>').addClass(animation);
                                s.append(a);
                                _animations[name] = { frame: 0, elem: a, animation: animation };
                            }
                            else {
                                _animations[name].elem.attr('class', animation);
                                _animations[name].animation = animation;
                            }
                            
                            return obj;
                        },
                        removeAnimation: function(name) {
                            if ( name in _animations ) {
                                _animations[name].remove();
                                delete _animations[name];
                            }
                            return obj;
                        },
                        nextFrame: function() {
                            for ( var name in _animations ) {
                                var a = _animations[name];
                                var frame = a.frame;
                                var next = (frame + 1) % animations[a.animation].frames;
                                a.elem.removeClass('frame-'+frame).addClass('frame-'+next);
                                a.frame = next;
                            }
                        }
                    };
                    return obj;
                }
            }
        }
    };
})(jQuery);