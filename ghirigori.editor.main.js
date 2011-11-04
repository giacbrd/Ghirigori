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
 * @fileOverview Editor controller.
 * @author <a href="mailto:barnets@gmail.com">Giacomo Berardi</a>
 * @version 0.1
 */

/** Starts application opening the editor interface. */
GhiriGori.open_editor = function()
{
    /** Canvas element where to draw shapes. */
    var mainCanvas = GhiriGori.main_canvas();

    /** Contains html elements of the interface. */
    var editor = new GhiriGori.Editor();

    var model = new GhiriGori.Model(GhiriGori.Mutation, GhiriGori.framerate, editor.timelineCanvas.width);
    
    var states =
    {
        /** Normal application use. */
        nothing: 0,
        /** Form insertion in a path during pause, can't insert another form until next start. */
        insInPause: 1,
        /** Form insertion with mouse click. */
        addForm: 2,
        /** Choosing form to copy position from. */
        copyPosition: 3,
        /** Choosing form to copy size from. */
        copySize: 4,
        /** A modification to register is made. */
        modify: 5
    };
    /** Current state relative to {@link states} */
    var currState;

    var mainView = new GhiriGori.View(mainCanvas, GhiriGori.main_paint, model);
    var timeView = new GhiriGori.View(editor.timelineCanvas, GhiriGori.timeline_paint, model);

    function paint()
    {
        mainView.paint();
        timeView.paint();
    }

    var anim = new GhiriGori.Animator(paint, mainView.get_clear(), model);

    editor.newButt.onclick = function()
    {
        model = new GhiriGori.Model(GhiriGori.Mutation, GhiriGori.framerate, editor.timelineCanvas.width);
        anim.model = timeView.model = mainView.model = model;
        clear_fields();
        paint();
        register.memorize();
    }

    function callback(list) {
        // Projects list is an array of names strings.
        list = JSON.parse(list);
        editor.selector.update(list);
    }
    //GhiriGori.get_proj_list(callback);

    editor.saveButt.onclick = function()
    {
        GhiriGori.save_proj(editor.selector.current(), GhiriGori.save_model(model), callback);
    }

    editor.deleteButt.onclick = function()
    {
        GhiriGori.save_proj(editor.selector.current(), "", callback);
        editor.selector.clean();
        editor.newButt.onclick();
    }

    editor.openButt.onclick = function()
    {
        function callback(str) {
            if (str) {
                model = GhiriGori.load_model(str, editor.timelineCanvas.width);
                anim.model = timeView.model = mainView.model = model;
                clear_fields();
                if (model.selected > -1) create_fields(model.selected);
                register.memorize();
                paint();
            }
        }
        GhiriGori.load_proj(editor.selector.current(), callback);
    }

    editor.quitButt.onclick = function()
    {
        document.body.removeChild(mainCanvas);
        editor.clear();
        delete mainView;
        delete timeView;
        delete anim;
        delete model;
        delete editor;
        delete this;
    }


    /** Stack of JSON representations of model. */
    var register = [];
    register.currIndex = -1;
    register.maxMemory = GhiriGori.maxMemory;
    register.memorize = function()
    {
        // Memorizing after some undo, delete all the next modifications.
        if (this.currIndex < this.length-1) this.splice(this.currIndex+1, this.length - (this.currIndex+1));
        this.push(GhiriGori.save_model(model));
        //console.log(this[this.length-1]);
        if (this.length > this.maxMemory) {
            delete this[0];
            this.shift();
        }
        this.currIndex = this.length-1;
    }
    register.restore = function(str)
    {
        model = GhiriGori.load_model(str, editor.timelineCanvas.width);
        anim.model = timeView.model = mainView.model = model;
        //console.log("_______",str);
    }
    register.undo = function()
    {
        if (this.currIndex > 0) {
            this.currIndex--;
            this.restore(this[this.currIndex]);
        }
    }
    register.redo = function()
    {
        if (this.currIndex < this.length-1) {
            this.currIndex++;
            this.restore(this[this.currIndex]);
        }
    }

    editor.undoButt.onclick = function()
    {
        if (!anim.running) {
            register.undo();
            clear_fields();
            if (model.selected > -1) create_fields(model.selected);
            paint();
        }
    }

    editor.redoButt.onclick = function()
    {
        if (!anim.running) {
            register.redo();
            clear_fields();
            if (model.selected > -1) create_fields(model.selected);
            paint();
        }
    }

    /**
     * Fills input fields in the interface with current mutation values.
     * @param {Number} index Index in {@link model.content} .
     */
    var fill_fields = function(index)
    {
        editor.lineWidthInput.style.backgroundColor = editor.opacityInput.style.backgroundColor = "#ffffff";
        var currMut = model.content[index].currMut;
        editor.lineWidthInput.value = currMut.lineWidth;
        editor.opacityInput.value = currMut.opacity;
        editor.colorInput.value = GhiriGori.rgb_to_hex({r: currMut.rColor, g: currMut.gColor, b: currMut.bColor});
        fill_time_fields(index);
        if (editor.extraFields.lastChild && editor.extraFields.lastChild.hasChildNodes()) {
            var childNodes = editor.extraFields.lastChild.childNodes;
            for (var i = childNodes.length-1; i >= 0; i--) {
                childNodes[i].value = currMut[childNodes[i].name];
            }
        }
    }

    /**
     * Fills times input fields in the interface with current mutation time values.
     * @param {Number} index Index in {@link model.content} .
     */
    var fill_time_fields = function(index)
    {
        editor.timeInput.style.backgroundColor = "#ffffff";
        editor.timeInput.value = parseInt(model.content[index].times[model.content[index].currFormInd]);
        editor.startTimeInput.value = parseInt(model.timeline.startTime);
    }

    /** Empties input fields and remove extra attributes fields. */
    var clear_fields = function()
    {
        editor.lineWidthInput.value = "";
        editor.opacityInput.value = "";
        editor.colorInput.value = "";
        editor.timeInput.value = "";
        editor.timeInput.style.backgroundColor = editor.startTimeInput.style.backgroundColor = editor.lineWidthInput.style.backgroundColor = editor.opacityInput.style.backgroundColor = "#ffffff";
        if (editor.extraFields.hasChildNodes()) {
            while (editor.extraFields.childNodes.length >= 1 ) editor.extraFields.removeChild(editor.extraFields.firstChild);
        }
    }

    /**
     * Creates a function to call when an input field, for an extra attribute, is modified.
     * @param {String} attr An extra attribute name of a shape.
     * @param {Object} field Html input element.
     * @return {Function} Function to call when field is used.
     */
    var use_field = function(attr, field)
    {
        var newForm = {};
        /** Object that describes characteristics about this extra attribute. */
        var attrObj = model.content[model.selected].type.extraAttrs[attr];
        var mut = model.content[model.selected];
        return (function()
        {
            if (model.selected > -1) {
                // Control if input value is in the range.
                if (attrObj.hasOwnProperty("range") && typeof attrObj.range[0] == typeof attrObj.range[1] == "number") field.value = (attrObj.range[0] > field.value) ? attrObj.range[0] : ((attrObj.range[1] < field.value) ? attrObj.range[1] : field.value);
                // Control the type
                /*if (field.options) {
                    newForm[attr] = field.options[field.selectedIndex].value;
                } else */if (typeof mut.currMut[attr] == "number") {
                    var numValue = parseFloat(field.value) || 0;
                    newForm[attr] = (isNaN(numValue)) ? attrObj.base : numValue;
                } else {
                    newForm[attr] = field.value;
                }
                mut.mod_form(mut.currFormInd, newForm);
                mainView.paint();
            }
        });
    } 

    /**
     * Creates html input fields in the interface for the extra attributes.
     * @param {Number} index Index in {@link GhiriGori.model.content} .
     */
    var create_fields = function(index)
    {
        // TODO: don't create each time
        var extraFields = editor.extraFields;
        var extraAttrs = model.content[index].type.extraAttrs;
        // Substitution of current input fields.
        if (extraFields.hasChildNodes()) {
            while (extraFields.childNodes.length >= 1 ) extraFields.removeChild(extraFields.firstChild);
        }
        extraFields.appendChild(document.createElement("div"));
        extraFields.appendChild(document.createElement("div"));
        extraFields.firstChild.style.cssFloat = "left";
        extraFields.firstChild.style.textAlign = "right";
        for (var attr in extraAttrs) {
            var newField; 
            // Create input fields according to the type.
            if (typeof extraAttrs[attr].base == "string") {
                // Select box with values in range.
                if (extraAttrs[attr].hasOwnProperty("range")) {
                    newField = document.createElement("select");
                    newField.title = extraAttrs[attr].name;
                    for (var i = extraAttrs[attr].range.length-1; i >= 0; i--) {
                        var opt = document.createElement("option");
                        opt.text = opt.value = extraAttrs[attr].range[i];
                        newField.add(opt, null);
                    }
                    newField.onchange = use_field(attr, newField);
                    extraFields.lastChild.appendChild(newField);
                } else {
                    newField = document.createElement("textarea");
                    newField.title = extraAttrs[attr].name;
                    extraFields.lastChild.appendChild(newField);
                    //TODO: when clicking on the default text it disappears immediatly
                }
            } else {
                newField = document.createElement("input");
                newField.alt = newField.title = extraAttrs[attr].name;
                newField.type = "text";
                newField.size = "4";
                extraFields.firstChild.appendChild(document.createElement("span"));
                extraFields.firstChild.lastChild.innerHTML = extraAttrs[attr].name + ":";
                extraFields.firstChild.lastChild.style.paddingRight = "7px";
                extraFields.firstChild.appendChild(document.createElement("br"));
                extraFields.lastChild.appendChild(newField);
                extraFields.lastChild.appendChild(editor.increaser(newField, (extraAttrs[attr].base % 1 > 0) ? 0.1 : 1));
            }
            newField.style.border = "1px solid DimGray";
            newField.style.color = GhiriGori.fontColor;            
            newField.style.fontSize = GhiriGori.fontSize + "px";
            newField.name = attr;
            newField.onkeyup = use_field(attr, newField);
            newField.onchange = function() {register.memorize();}
            extraFields.lastChild.appendChild(document.createElement("br"));
        }
        fill_fields(index);
    }

//TODO: input validation: change color

    editor.lineWidthInput.onchange = editor.opacityInput.onchange = editor.colorInput.onchange = editor.timeInput.onchange = editor.startTimeInput.onchange = function() {register.memorize()};

    editor.lineWidthInput.onkeyup = function()
    {
        if (model.selected > -1) {
            var value = parseFloat(editor.lineWidthInput.value) || 0;
            // Value must be positive.
            if (value >= 0) {
                editor.lineWidthInput.style.backgroundColor = "#ffffff";
            } else {
                editor.lineWidthInput.style.backgroundColor = "#ff0000";
                value = 0;
            }
            model.content[model.selected].mod_form(model.content[model.selected].currFormInd, {lineWidth: value});
            mainView.paint();
        }
    }

    editor.opacityInput.onkeyup = function()
    {
        if (model.selected > -1) {
            var value = parseFloat(editor.opacityInput.value) || 0;
            if (value >= 0 && value <= 1) {
                editor.opacityInput.style.backgroundColor = "#ffffff";
            } else {
                editor.opacityInput.style.backgroundColor = "#ff0000";
                value = (value > 1) ? 1 : 0;
            }
            model.content[model.selected].mod_form(model.content[model.selected].currFormInd, {opacity: value});
            mainView.paint();
        }
    }

    editor.colorInput.onkeyup = function()
    {
        if (model.selected > -1) {
            var color = GhiriGori.hex_to_rgb(editor.colorInput.value);
            model.content[model.selected].mod_form(model.content[model.selected].currFormInd, {rColor: color.r, gColor: color.g, bColor: color.b});
            mainView.paint();
        }
    }

    editor.timeInput.onkeyup = function()
    {
        if (model.selected > -1) {
            editor.timeInput.style.backgroundColor = (model.change_time(model.selected, model.content[model.selected].currFormInd, parseFloat(editor.timeInput.value) || 0)) ? "#ffffff" : "#ff0000";
            editor.startTimeInput.value = parseInt(model.timeline.startTime);
            timeView.paint();
        }
    }

    editor.startTimeInput.onkeyup = function()
    {
        editor.startTimeInput.style.backgroundColor = (model.shift_start_time(parseFloat(editor.startTimeInput.value) || 0)) ? "#ffffff" : "#ff0000";
        // In the case start time is also the current form time.
        if (model.selected > -1) editor.timeInput.value = model.content[model.selected].times[model.content[model.selected].currFormInd];
        timeView.paint();
    }

    editor.addRectButt.onclick = function()
    {
        currState = GhiriGori.shapes.Rectangle;
        mainCanvas.style.cursor = "crosshair";
    }

    editor.addLineButt.onclick = function()
    {
        currState = GhiriGori.shapes.Line;
        mainCanvas.style.cursor = "crosshair";
    }

    editor.addEllipButt.onclick = function()
    {
        currState = GhiriGori.shapes.Ellipse;
        mainCanvas.style.cursor = "crosshair";
    }

    editor.addArrButt.onclick = function()
    {
        currState = GhiriGori.shapes.Arrow;
        mainCanvas.style.cursor = "crosshair";
    }

    editor.addTextButt.onclick = function()
    {
        currState = GhiriGori.shapes.Text;
        mainCanvas.style.cursor = "crosshair";
    }

    editor.remButt.onclick = function()
    {
        if (model.selected > -1) {
            model.del_part(model.selected);
            paint();
            register.memorize();
        }
    }

    editor.raiseButt.onclick = function()
    {
        if (model.selected < model.content.length-1) {
            model.permute(model.selected, model.selected+1);
            model.selected++;
            paint();
            register.memorize();
        }
    }

    editor.lowerButt.onclick = function()
    {
        if (model.selected > 0) {
            model.permute(model.selected, model.selected-1);
            model.selected--;
            paint();
            register.memorize();
        }
    }

    editor.addFormButt.onclick = function()
    {
        if (model.selected > -1) {
            currState = states.addForm;
            mainCanvas.style.cursor = "crosshair";
        }
    }

    editor.remFormButt.onclick = function()
    {
        if (model.selected > -1) {
            if (model.content[model.selected].target.forms.length > 1) {
                model.del_form(model.selected, model.content[model.selected].currFormInd);
                fill_fields(model.selected);
            // If shape has only one form.
            } else {
                model.del_part(model.selected);
            }
            paint();
            register.memorize();
        }
    }

    editor.copyPosButt.onclick = function()
    {
        if (model.selected > -1) {
            currState = states.copyPosition;
            mainCanvas.style.cursor = "crosshair";
        }
    }

    editor.copySizeButt.onclick = function()
    {
        if (model.selected > -1) {
            currState = states.copySize;
            mainCanvas.style.cursor = "crosshair";
        }
    }

    editor.playButt.onclick = function()
    {
        if (model.content.length > 0) {
            // If last added form is the last of a mutation.
            if (model.selected > -1 && model.content[model.selected].currFormInd == model.content[model.selected].target.forms.length-1) anim.init();
            anim.start();
            currState = states.insInPause;
        }
    }
    editor.pauseButt.onclick = function()
    {
        model;
        anim.pause();
    }
    editor.stopButt.onclick = function()
    {
        model;
        anim.init();
    }
    editor.nextButt.onclick = function()
    {
        if(model.selected > -1) {
            model.next_form(model.selected);
            fill_fields(model.selected);
            paint();
        }
    }
    editor.prevButt.onclick = function()
    {
        if(model.selected > -1) {
            model.prev_form(model.selected);
            // We are no more in the last form of a mutation (end of an animation).
            anim.end = false;
            fill_fields(model.selected);
            paint();
        }
    }

    document.onkeydown = function(keyEvent)
    {
        if (keyEvent.ctrlKey) {
            // Move time cursor
            if (keyEvent.metaKey) {
                var delta;
                switch (keyEvent.which) {
                    case 37:
                        delta = -5;
                        break;
                    case 39:
                        delta = 5;
                        break;
                }
                model.selected = -1;
                anim.paused = true;
                currState = states.insInPause;
                anim.currTime += delta;
                model.timeline.time_position(anim.currTime);
                model.go_to_time(anim.currTime);
                paint();
                return;
            } else if (model.selected > -1) {
                var mut = model.content[model.selected];
                switch (keyEvent.which) {
                    case 33:
                        editor.raiseButt.onclick();
                        return;
                    case 34:
                        editor.lowerButt.onclick();
                        return;
                    case 37:
                        mut.mod_form(mut.currFormInd, {x: mut.currMut.x-1});
                        register.memorize();
                        break;
                    case 39:
                        mut.mod_form(mut.currFormInd, {x: mut.currMut.x+1});
                        register.memorize();
                        break;
                    case 40:
                        mut.mod_form(mut.currFormInd, {y: mut.currMut.y+1});
                        register.memorize();
                        break;
                    case 38:
                        mut.mod_form(mut.currFormInd, {y: mut.currMut.y-1});
                        register.memorize();
                        break;
                }
                mainView.paint();
                return;
            }
        }
        if (keyEvent.metaKey) {
            key = String.fromCharCode(keyEvent.which);
            switch (key) {
                case 'A':
                    editor.addFormButt.onclick();
                    return;
                case 'R':
                    editor.remFormButt.onclick();
                    return;
                case 'O':
                    editor.copyPosButt.onclick();
                    return;
                case 'I':
                    editor.copySizeButt.onclick();
                    return;
                case 'P':
                    (anim.running) ? editor.pauseButt.onclick() : editor.playButt.onclick();
                    return;
                case 'S':
                    editor.stopButt.onclick();
                    return;
                case 'N':
                    editor.nextButt.onclick();
                    return;
                case 'B':
                    editor.prevButt.onclick();
                    return;
            }
        }
    }


    /**
     * Resizes a canvas width from a click event.
     * @param {Object} canvas Canvas to resize.
     * @return {Function} Function called by a mouse click, that sets the canvas width resizing during mouse movement.
     */
    var resize_canvas_width = function(canvas)
    {
        return (function(clickEvent)
        {
            clickEvent = clickEvent || window.event;
            var x = GhiriGori.find_x(canvas);
            // Offset from the canvas right border.
            var offsetX = clickEvent.clientX - (x + parseFloat(canvas.width));
            // TODO: chain with current mousemove
            document.onmousemove = function(moveEvent)
            {
                moveEvent = moveEvent || window.event;
                var width = moveEvent.clientX - x - offsetX;
                canvas.width = model.timeline.width = (width > 1) ? width : 1;;
                model.timeline.update();
                timeView.paint();
            }
        });
    }

    /**
     * Resizes a canvas height from a click event.
     * @param {Object} canvas Canvas to resize.
     * @return {Function} Function called by a mouse click, that sets the canvas height resizing during mouse movement.
     */
    var resize_canvas_height = function(canvas)
    {
        return (function(clickEvent)
        {
            clickEvent = clickEvent || window.event;
            var y = GhiriGori.find_y(canvas);
            // Offset from the canvas bottom border.
            var offsetY = clickEvent.clientY - (y + parseFloat(canvas.height));
            // TODO: chain with current mousemove
            document.onmousemove = function(moveEvent)
            {
                moveEvent = moveEvent || window.event;
                var height = moveEvent.clientY - y - offsetY;
                canvas.height = (height > 1) ? height : 1;
                timeView.paint();
            }
        });
    }

    editor.timelWidthIncr.onmousedown = resize_canvas_width(editor.timelineCanvas);
    editor.timelHeightIncr.onmousedown = resize_canvas_height(editor.timelineCanvas);

    editor.timelWidthIncr.onmouseup = editor.timelHeightIncr.onmouseup = function()
    {
        document.onmousemove = null;
    }

    window.onscroll = function()
    {
        if (!anim.running) mainView.paint();
    }

    window.onresize = GhiriGori.conc_func(window.onresize, window.onscroll);


    mainCanvas.onmousedown = function(clickEvent)
    {
        if (!anim.running) {
            clickEvent = clickEvent || window.event;
            var x = clickEvent.clientX + window.pageXOffset;
            var y = clickEvent.clientY + window.pageYOffset;
            var content = model.content;
            // User is adding a form to the shape
            if (model.selected > -1 && currState == states.addForm) {
                mainCanvas.style.cursor = "default";
                var mut = content[model.selected];
                var time, newForm = {};
                // Set time according to insertion: between two forms or after the last.
                if (mut.currFormInd < mut.target.forms.length-1) {
                    time = (mut.times[mut.currFormInd+1] - mut.times[mut.currFormInd] > 0) ? mut.times[mut.currFormInd] + ((mut.times[mut.currFormInd+1] - mut.times[mut.currFormInd]) / 2) : 0;
                    for (attr in mut.currMut) {
                        // NOT CORRECT IF THE ANIMATION IS NOT LINEAR
                        newForm[attr] = (mut.target.forms[mut.currFormInd+1][attr] - mut.target.forms[mut.currFormInd][attr]) / 2 + mut.target.forms[mut.currFormInd][attr];
                    }
                } else {
                    time = mut.times[mut.currFormInd] + 1000;
                }
                newForm.x = x - mut.currMut.width / 2; 
                newForm.y = y - mut.currMut.height / 2;
                model.ins_form(model.selected, mut.currFormInd+1, newForm, time);
                model.go_to_form(model.selected, mut.currFormInd+1);
                mut.selectNode = mut.currFormInd;
                fill_fields(model.selected);
                paint();
                var offsetX = clickEvent.clientX - mut.currMut.x;
                var offsetY = clickEvent.clientY - mut.currMut.y;
                // After adding move the form with mouse button pressed.
                mainCanvas.onmousemove = function(moveEvent)
                {
                    currState = states.modify;
                    moveEvent = moveEvent || window.event;
                    mut.mod_form(mut.currFormInd, {x: moveEvent.clientX - offsetX, y: moveEvent.clientY - offsetY}, false);
                    mainView.paint();
                }
                currState = states.modify;
                return;
            }
            // User is adding a shape
            if (typeof currState == "function") {
                mainCanvas.style.cursor = "default";
                model.push_part(currState, {x: x - currState.init.width / 2, y: y - currState.init.height / 2, rColor: 0, gColor: 0, bColor: 0, opacity: 1});
                model.selected = content.length-1;
                var mut = content[model.selected];
                create_fields(model.selected);
                paint();
                var offsetX = clickEvent.clientX - mut.currMut.x;
                var offsetY = clickEvent.clientY - mut.currMut.y;
                mainCanvas.onmousemove = function(moveEvent)
                {
                    currState = states.modify;
                    moveEvent = moveEvent || window.event;
                    mut.mod_form(mut.currFormInd, {x: moveEvent.clientX - offsetX, y: moveEvent.clientY - offsetY}, false);
                    mainView.paint();
                }
                currState = states.modify;
                return;
            }
            // If a shape is selected.
            if (model.selected > -1 && model.selected < content.length) {
                var mut = content[model.selected];
                // Click is on a node in the path of a shape
                if (mut.inters_node(x, y)) {
                    if (currState == states.copyPosition) {
                        mainCanvas.style.cursor = "default";
                        mut.mod_form(mut.currFormInd, {x: mut.target.forms[mut.selectNode].x + (mut.target.forms[mut.selectNode].width - mut.target.forms[mut.currFormInd].width) / 2, y: mut.target.forms[mut.selectNode].y + (mut.target.forms[mut.selectNode].height - mut.target.forms[mut.currFormInd].height) / 2});
                        mut.selectNode = mut.currFormInd;
                        mainView.paint();
                        register.memorize();
                        return;
                    }
                    if (currState == states.copySize) {
                        mainCanvas.style.cursor = "default";
                        mut.mod_form(mut.currFormInd, {x: mut.target.forms[mut.currFormInd].x + (mut.target.forms[mut.currFormInd].width - mut.target.forms[mut.selectNode].width) / 2, y: mut.target.forms[mut.currFormInd].y + (mut.target.forms[mut.currFormInd].height - mut.target.forms[mut.selectNode].height) / 2, width: mut.target.forms[mut.selectNode].width, height: mut.target.forms[mut.selectNode].height});
                        mut.selectNode = mut.currFormInd;
                        mainView.paint();
                        register.memorize();
                        return;
                    }
                    if (mut.selectNode != mut.currFormInd) currState = states.modify;
                    model.go_to_form(model.selected, mut.selectNode);
                    if (mut.selectNode < mut.times.length-1) anim.end = false;
                    fill_fields(model.selected);
                    paint();
                    var offsetX = clickEvent.clientX - mut.target.forms[mut.selectNode].x;
                    var offsetY = clickEvent.clientY - mut.target.forms[mut.selectNode].y;
                    mainCanvas.onmousemove = function(moveEvent)
                    {
                        currState = states.modify;
                        moveEvent = moveEvent || window.event;
                        mut.mod_form(mut.currFormInd, {x: moveEvent.clientX - offsetX, y: moveEvent.clientY - offsetY}, false);
                        mainView.paint();
                    }
                    return;
                }
                // Click is on handles, modify shape.
                if (mut.inters_handle(x, y)) {
                    mainView.paint();
                    var offsetX = clickEvent.clientX - mut.currMut.x;
                    var offsetY = clickEvent.clientY - mut.currMut.y;
                    var offsetWidth = (mut.currMut.width + mut.currMut.x) - clickEvent.clientX;
                    var offsetHeight = (mut.currMut.height + mut.currMut.y) - clickEvent.clientY;
                    mainCanvas.onmousemove = function(moveEvent)
                    {
                        currState = states.modify;
                        moveEvent = moveEvent || window.event;
                        mut.use_handle(moveEvent, offsetX, offsetY, offsetWidth, offsetHeight);
                        mainView.paint();
                    }
                    return;
                }
            }
            // Control shapes bounding box intersection with mouse pointer, insert them in an array
            var toSelect = -1, cnt = [], indexes = [];
            for (var i = content.length-1; i >= 0; i--) {
                if (!content[i].inters_boundingbox) {
                    if (content[i].intersect(x, y)) {
                        if (cnt.length == 0) {
                            toSelect = i;
                            break;
                        } else {
                            cnt.push(content[i]);
                            indexes.push(i);
                            break;
                        }
                    }
                } else if (content[i].inters_boundingbox(x, y)) {
                    cnt.push(content[i]);
                    indexes.push(i);
                }
            }
            // Intersection computed only on shapes in the new array
            var i = 0;
            var last = cnt.length-1;
            while (i < last) {
                if (cnt[i].intersect(x, y)) {
                    toSelect = indexes[i];
                    break;
                }
                i += 1;
            }
            if (i == last && (!cnt[i].inters_boundingbox || cnt[i].intersect(x, y))) {
                toSelect = indexes[i];
            }
            // Select a shape.
            if (toSelect > -1) {
                var mut = content[toSelect];
                if (model.selected > -1) {
                    if (currState == states.copyPosition) {
                        mainCanvas.style.cursor = "default";
                        content[model.selected].mod_form(content[model.selected].currFormInd, {x: mut.target.forms[mut.currFormInd].x + (mut.target.forms[mut.currFormInd].width - content[model.selected].target.forms[content[model.selected].currFormInd].width) / 2, y: mut.target.forms[mut.currFormInd].y + (mut.target.forms[mut.currFormInd].height - content[model.selected].target.forms[content[model.selected].currFormInd].height) / 2});
                        mainView.paint();
                        register.memorize();
                        return;
                    }
                    if (currState == states.copySize) {
                        mainCanvas.style.cursor = "default";
                        content[model.selected].mod_form(content[model.selected].currFormInd, {width: Math.abs(mut.target.forms[mut.currFormInd].width), height: Math.abs(mut.target.forms[mut.currFormInd].height)});
                        mainView.paint();
                        register.memorize();
                        return;
                    }
                }
                if (model.selected != toSelect) {
                    model.selected = toSelect;
                    create_fields(model.selected);
                    register.memorize();
                } else {
                    fill_fields(model.selected);
                }
                // Add form during pause
                if (anim.paused && currState == states.insInPause && mut.times[0] < anim.currTime) {
                    model.ins_form(model.selected, mut.currFormInd+1, mut.currMut, anim.currTime);
                    model.go_to_form(model.selected, mut.currFormInd+1);
                    mut.selectNode = mut.currFormInd;
                    fill_fields(model.selected);
                    register.memorize();
                }
                paint();
                var offsetX = clickEvent.clientX - mut.currMut.x;
                var offsetY = clickEvent.clientY - mut.currMut.y;
                // Move shape
                mainCanvas.onmousemove = function(moveEvent)
                {
                    currState = states.modify;
                    moveEvent = moveEvent || window.event;
                    mut.mod_form(mut.currFormInd, {x: moveEvent.clientX - offsetX, y: moveEvent.clientY - offsetY}, false);
                    mainView.paint();
                }
                return;
            }
            clear_fields();
            model.selected = -1;
            paint();
        }
    }

    mainCanvas.onmouseup = function()
    {
        mainCanvas.style.cursor = "default";
        if (model.selected > -1) {
            model.content[model.selected].selectNode = -1;
        }
        if (currState == states.modify) {
            // Recompute deltas after a mouse moving action.
            model.content[model.selected].update_form_deltas(model.content[model.selected].currFormInd);
            register.memorize();
        }
        currState = states.nothing;
        mainCanvas.onmousemove = null;
    }


    editor.timelineCanvas.onmousedown = function(clickEvent)
    {
        if (!anim.running) {
            currState = states.nothing;
            clickEvent = clickEvent || window.event;
            var x = clickEvent.clientX + window.pageXOffset - GhiriGori.find_x(editor.timelineCanvas);
            var y = clickEvent.clientY /*+ window.pageYOffset*/ - GhiriGori.find_y(editor.timelineCanvas);
            var timePoints = model.timeline.timePoints;
            var position = model.timeline.position;
            var lineHeight = (editor.timelineCanvas.height - 13) / timePoints.length;
            // Click on time cursor.
            if (x > position - 2 && x < position + 6) {
                paint();
                var offsetX = GhiriGori.find_x(editor.timelineCanvas) + (x - position);
                editor.timelineCanvas.onmousemove = function(moveEvent)
                {
                    moveEvent = moveEvent || window.event;
                    var time = (moveEvent.clientX + window.pageXOffset - offsetX) / model.timeline.pointsPerMs + model.timeline.startTime;
                    model.selected = -1;
                    anim.paused = true;
                    currState = states.insInPause;
                    anim.currTime = time;
                    model.timeline.time_position(time);
                    model.go_to_time(time);
                    paint();
                }
                return;
            }
            for (var i = timePoints.length-1; i >=0; i--) {
                // Select a shape
                if (y > i * lineHeight + 1 && y < i * lineHeight + lineHeight + 1) {
                    if (model.selected != i) {
                        model.selected = i;
                        create_fields(model.selected);
                        register.memorize();
                    } else {
                        fill_fields(model.selected);
                    }
                    paint();
                    for (var j = timePoints[i].length-1; j >= 0; j--) {
                        // Select a shape time position
                        if (x > timePoints[i][j] - 3 && x < timePoints[i][j] + 3) {
                            if (j != model.content[model.selected].currFormInd) currState = states.modify;
                            model.go_to_form(model.selected, j);
                            if (j < timePoints[i].length-1) anim.end = false;
                            fill_fields(model.selected);
                            paint();
                            var offsetX = GhiriGori.find_x(editor.timelineCanvas) + (x - timePoints[i][j]);
                            editor.timelineCanvas.onmousemove = function(moveEvent)
                            {
                                moveEvent = moveEvent || window.event;
                                if (model.change_time(model.selected, j, (moveEvent.clientX + window.pageXOffset - offsetX) / model.timeline.pointsPerMs + model.timeline.startTime)) {
                                    fill_time_fields(model.selected);
                                    timeView.paint();
                                    currState = states.modify;
                                }
                            }
                            return;
                        }
                    }
                    return;
                }
            }
        }
    }

    editor.timelineCanvas.onmouseout = editor.timelineCanvas.onmouseup = function()
    {
        editor.timelineCanvas.onmousemove = null;
        if (currState == states.modify) {
            register.memorize();
            currState = states.nothing;
        }
    }


    paint();
    register.memorize();
}


/** Instructions to paint timeline model on the timeline window. */
GhiriGori.timeline_paint = function()
{
    // TODO: clear and draw only a part
    var srf = this.surface, slc = this.model.selected, cnt = this.model.content, tps = this.model.timeline.timePoints, height = this.canvas.height - 13, width = this.canvas.width - 2;
    srf.clearRect(0, 0, this.canvas.width, this.canvas.height);
    srf.save();
    var lineHeight = height / tps.length;
    srf.font = "11px Arial";
    srf.strokeStyle = "DimGrey";
    // Selected shape time bar and position signs
    if (slc > -1) {
        srf.lineWidth = 1;
        srf.fillStyle = "#eeeeee";
        srf.fillRect(1, slc * lineHeight + 1, width, lineHeight);
        if (cnt[slc].currFormInd >= 0 && tps[slc].length > 1) {
            srf.lineWidth = 4;
            srf.beginPath();
            var y = slc * lineHeight + 1;
            srf.moveTo(tps[slc][cnt[slc].currFormInd], y);
            srf.lineTo(tps[slc][cnt[slc].currFormInd], y + lineHeight);
            srf.stroke();
        }
    }
    // General time signs each second
    srf.fillStyle = "#999999";
    srf.lineWidth = 0.5;
    var pps = this.model.timeline.pointsPerMs * 1000;
    var firstPos = (1000 - (this.model.timeline.startTime % 1000)) * this.model.timeline.pointsPerMs;
    var finalPos = (this.model.timeline.finalTime - this.model.timeline.startTime) * this.model.timeline.pointsPerMs;
    for (var x = firstPos, s = 1; x < finalPos; x += pps, s++) {
        srf.beginPath();
        srf.moveTo(x, 0);
        srf.lineTo(x, height);
        srf.fillText(s, x - 3, height + 13);
        srf.stroke();
    }
    srf.lineWidth = 1;
    // All shapes time bars
    for (var i = tps.length-1; i >= 0; i--) {
        var y = i * lineHeight + 1;
        srf.strokeRect(1, y, width, lineHeight);
        if (tps[i].length > 1) {
            srf.beginPath();
            srf.moveTo(0, y + lineHeight / 2);
            srf.lineTo(tps[i][0], y + lineHeight / 2);
            srf.stroke();
            srf.beginPath();
            srf.moveTo(tps[i][tps[i].length-1], y + lineHeight / 2);
            srf.lineTo(width, y + lineHeight / 2);
            srf.stroke();
            srf.lineWidth = 2;
            for (var j = tps[i].length-1; j >= 0; j--) {
                srf.beginPath();
                srf.moveTo(tps[i][j], y);
                srf.lineTo(tps[i][j], y + lineHeight);
                srf.stroke();
            }
            srf.lineWidth = 1;
        }
    }
    srf.fillStyle = "DodgerBlue";
    srf.fillRect(this.model.timeline.position, 1, 4, height);
    srf.restore();
}

