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
                    var frames = {};
                    
                    var obj = {
                        id: function() {
                            return id;
                        },
                        width: function(w) {
                            s.width(w);
                            return obj;
                        },
                        height: function(h) {
                            s.height(h);
                            return obj;
                        },
                        addAnimation: function(name) {
                            var a = $('<span></span>').addClass(name);
                            s.append(a);
                            frames[name] = 0;
                            return obj;
                        },
                        nextFrame: function() {
                            for ( var name in frames ) {
                                var frame = frames[name];
                                var next = (frame + 1) % animations[name].frames;
                                s.find('span.' + name).removeClass('frame-'+frame).addClass('frame-'+next);
                                frames[name] = next;
                            }
                        }
                    };
                    return obj;
                }
            }
        }
    };
})(jQuery);