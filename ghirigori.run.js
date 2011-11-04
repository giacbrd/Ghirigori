/**
 * Ghirigori - draw and animate objects over web pages.
 * Copyright (C) 2011 Giacomo Berardi
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @fileOverview Script to load and run animations over a page.
 * @author <a href="mailto:barnets@gmail.com">Giacomo Berardi</a>
 * @version 0.1
 */


/** Starts application running the argument animation. */
GhiriGori.run_animation = function(name)
{
    /** Canvas element where to draw shapes. */
    var mainCanvas = GhiriGori.main_canvas();
    mainCanvas.style.marginTop = (-GhiriGori.bodyOffset) + "px";

    // Timeline width is not necessary.
    var model = new GhiriGori.Model(GhiriGori.Mutation, GhiriGori.framerate, 0);

    var mainView = new GhiriGori.View(mainCanvas, GhiriGori.main_paint, model);

    // Clear a precedent animation
    mainView.get_clear()();

    function paint()
    {
        mainView.paint();
    }

    var anim = new GhiriGori.Animator(paint, mainView.get_clear(), model);

    function callback(str) {
        if (str) {
            model = GhiriGori.load_model(str, 0);
            anim.model = mainView.model = model;
            model.selected = -1;
            for (var i = model.content.length-1; i >= 0; i--) model.go_to_form(i, 0);
            anim.start();
        }
    }
    GhiriGori.load_proj(name, callback);
}

