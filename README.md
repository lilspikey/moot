# Moot Javascript Game Engine

This is a simple DOM-based javascript game engine.  It's partly written as an exercise for myself.

The main features (so far):

* Managing the DOM to create sprites and animations
* Collision detection (using sweep and prune)

## Usage

As we are using the DOM for this game engine CSS is lent on heavily.  Therefore it's important to understand the structure being created by the engine - so that you can style it.

Creating a single "block" and adding it the game:

    var world = Moot.world('#game');
    var layer = world.layer('foreground');
    var block = world.sprite('block1').addType('block');
    block.x(5).y(10).width(32).height(32);
    block.animation('main', { cssClass: 'block-anim' })
    layer.add(block);

Which would then (assuming a div with id "game") would yield this markup:

    <div id="game">
        <div id="foreground" class="sprite">
            <div id="block1" class="sprite block" style="left: 5px; top: 10px; width: 32px; height: 32px">
                <span class="block-anim"></span>
            </div>
        </div>
    </div>

CSS is used to handle the styling of animations.  Javascript is merely used to defines extra details such as the number of frames in an animation.  Animation occurs by moot adding a class of "frame-N" to the span of the animation.

See /examples/ for more info.

### Colophon

Moot will one day become moot - abusing the DOM for creating a game is probably not the future.  In the meantime though it's the best way to get good performance on things like the iPhone.
