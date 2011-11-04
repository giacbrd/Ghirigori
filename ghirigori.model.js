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
 * @fileOverview Model structures.
 * @author <a href="mailto:barnets@gmail.com">Giacomo Berardi</a>
 * @version 0.1
 */


/**
 * Contains forms of a particular shape.
 * @constructor
 * @param {Function} type A specific shape type, contained in {@link GhiriGori.shapes}
 * @param {Object} form Initial form of a shape.
 */
GhiriGori.Shape = function(type, form)
{
    this.Type = type;
    // DON NOT ADD OTHER EXTRA ATTRIBUTES, THEY WILL APPEAR IN THE FORIN CYCLES
    // HERE THE DEFAULT VALUES OF THE APPLICATION
    /**
     * Builds a new form knowing the shape type.
     * @constructor
     * @param {Object} form Initialization parameters.
     */
    var Shape_attrs = function(form)
    {
        this.x = form.x || type.init.x || 0;
        this.y = form.y || type.init.y || 0;
        this.width = form.width || type.init.width || 0;
        this.height = form.height || type.init.height || 0;
        this.rColor = form.rColor || type.init.rColor || 0;
        this.gColor = form.gColor || type.init.gColor || 0;
        this.bColor = form.bColor || type.init.bColor || 0;
        this.opacity = form.opacity || type.init.opacity || 0;
        this.lineWidth = form.lineWidth || type.init.lineWidth || 0;
        for (var attr in type.prototype.extraAttrs) this[attr] = form[attr] || type.prototype.extraAttrs[attr].base;
    }
    this.forms = [new Shape_attrs(form)];
//    for (method in type) {
//        if (type.hasOwnProperty(method) && typeof type[method] == "function") this[method] = type[method];
//    }
//    type = type.toString();
//    // Type name is obtained from the function name.
//    this.typeName = type.substring(type.indexOf(" ") + 1, type.indexOf("("));
}

GhiriGori.Shape.prototype.push_form = function(form)
{
    var newForm = new this.forms[0].constructor(form);
    for (var attr in newForm) {
        if (!form.hasOwnProperty(attr)) {
            this.forms.push(newForm);
            return;
        }
    }
    this.forms.push(form);
}

GhiriGori.Shape.prototype.ins_form = function(index, form)
{
    var newForm = new this.forms[0].constructor(form);
    for (var attr in newForm) {
        if (!form.hasOwnProperty(attr)) {
            this.forms.splice(index, 0, newForm);
            return;
        }
    }
    this.forms.splice(index, 0, form);
}

GhiriGori.Shape.prototype.del_form = function(index)
{
    delete this.forms[index];
    this.forms.splice(index, 1);
}

/** Image used as resize handle on shapes. */
GhiriGori.resizeImg = new Image();
GhiriGori.resizeImg.src = "images/resize.png";
GhiriGori.resizeImg.onload = function()
{
    this.halfWidth = this.width / 2;
    this.halfHeight = this.height / 2;
}
/** Image used as rotate handle on shapes. */
GhiriGori.rotateImg = new Image();
GhiriGori.rotateImg.src = "images/rotate.png";
GhiriGori.rotateImg.onload = GhiriGori.resizeImg.onload;


// TODO: another parameter can be for the functions for not linear increment
/**
 * Controls shape mutations, from a form to another, directed by time.
 * @constructor
 * @param {Object} target {@link GhiriGori.Shape}
 * @param {Number[]} times Consecutive times for each shape form.
 * @param {Number} framerate Number of animation frames per second.
 */
GhiriGori.Mutation = function(target, times, framerate)
{
    this.target = target;
    this.times = times;
    /** Current form index in target shape forms array. */
    this.currFormInd = 0;
    /** Current values of a mutation, referred to forms values. */
    this.currMut = {};
    this.show = true;
    /** Current selected node of a mutation. */
    this.selectNode = -1;
    for (var attr in this.target.forms[0]) this.currMut[attr] = this.target.forms[0][attr];
    this.timePerFrame = 1000 / framerate;
    this.counter = 0;
    /** Steps for values changing between every forms pairs. */
    this.deltas = [];
    if (this.target.forms.length = 1) {
        this.deltas.push(new Object());
    } else {
    // For each passage between forms calculate deltas of time and velocity vectors.
        for (var i = 0; i < this.target.forms.length-1; i++) {
            this.deltas.push(new Object());
            for (var attr in this.target.forms[i]) {
                // Only add (to deltas) attributes those change values between forms and those are numeric values.
                if ((this.target.forms[i][attr] != this.target.forms[i+1][attr]) && (typeof this.target.forms[i][attr] == "number")) {
                    this.deltas[i][attr] = (this.target.forms[i+1][attr] - this.target.forms[i][attr]) / ((times[i+1] - times[i]) / this.timePerFrame);
                    // TODO: an extra attribute with "Color" can be catch here, change
                    if (attr.substr(1) == "Color") this.deltas[i][attr] = Math.round(this.deltas[i][attr]);
                }
            }
        }
    }
    /** A specific shape object, a sort of subclassing. */
    this.type = new target.Type();
    //for (var attr in this.type) {
    //    if (this.type.hasOwnProperty(attr)) this[attr] = this.type[attr];
    //}
    // References to specific shape methods, so shapes can use mutation attributes in them.
    this.draw = this.type.draw;
    this.draw_select = this.type.draw_select;
    this.intersect = this.type.intersect;
    this.inters_boundingbox = this.type.inters_boundingbox;
    this.inters_handle = this.type.inters_handle;
    this.use_handle = this.type.use_handle;
}

//TODO: foundamental function: to be analysed
/**
 * Update current mutation to next change.
 * @return {Boolean} True if it isn't possible to go further with mutation.
 */
GhiriGori.Mutation.prototype.next_step = function()
{
    if (this.currFormInd >= this.target.forms.length-1) return true;
    //if ((this.deltas[this.currFormInd][attr] > 0 && this.target.forms[this.currFormInd+1][attr] <= this.deltas[this.currFormInd][attr] + this.currMut[attr]) || (this.deltas[this.currFormInd][attr] < 0 && this.target.forms[this.currFormInd+1][attr] >= this.deltas[this.currFormInd][attr] + this.currMut[attr]))
    // Count time until next form.
    this.counter += this.timePerFrame;
    if (this.times[this.currFormInd] + this.counter < this.times[this.currFormInd+1]) {
        // Current step hasn't reached next form advance mutation.
        for (var attr in this.deltas[this.currFormInd]) this.currMut[attr] += this.deltas[this.currFormInd][attr];
        return false;
    } else {
        this.counter = 0;
        // Mutate to the next form.
        return this.next_form();
    }
}

// TODO: raise an exception if out of index 
/**
 * Called when next form is reached by mutation.
 * @return {Boolean} True if it isn't possible to go further with mutation.
 */
GhiriGori.Mutation.prototype.next_form = function()
{
    this.currFormInd++;
    if (this.currFormInd >= this.target.forms.length-1) {
        if (this.currFormInd > this.target.forms.length-1) {
            this.currFormInd--;
            return true;
        } else {
            for (var attr in this.currMut) this.currMut[attr] = this.target.forms[this.currFormInd][attr];
            return true;
        }
    } else {
        for (var attr in this.currMut) this.currMut[attr] = this.target.forms[this.currFormInd][attr];
        return false;
    }
}

/** Go to the previous form to the current. */
GhiriGori.Mutation.prototype.prev_form = function()
{
    if (this.currFormInd > 0) {
        this.currFormInd--;
        for (var attr in this.currMut) this.currMut[attr] = this.target.forms[this.currFormInd][attr];
    }
}

/**
 * Go to a specific form.
 * @param {Number} index
 */
GhiriGori.Mutation.prototype.go_to_form = function(index)
{
    if (index >= 0 && index < this.target.forms.length) {
        this.currFormInd = index;
        for (var attr in this.currMut) this.currMut[attr] = this.target.forms[index][attr];
    }
}

/** Go to first form. */
GhiriGori.Mutation.prototype.init_form = function()
{
    this.currFormInd = 0;
    for (var attr in this.currMut) this.currMut[attr] = this.target.forms[0][attr];
}


/**
 * Updates delta values before and after a form, to use when form values change.
 * @param {Number} index
 */
GhiriGori.Mutation.prototype.update_form_deltas = function(index)
{
    for (var attr in this.target.forms[index]) {
        this.update_attr_deltas(index, attr);
    }    
}

/**
 * Updates a delta value before and after a form, to use when form values change.
 * @param {Number} index
 * @param {String} attr
 */
GhiriGori.Mutation.prototype.update_attr_deltas = function(index, attr)
{
    if (index > 0) {
        delete this.deltas[index-1][attr];
        if ((this.target.forms[index-1][attr] != this.target.forms[index][attr]) && (typeof this.target.forms[index-1][attr] == "number")) {
            this.deltas[index-1][attr] = (this.target.forms[index][attr] - this.target.forms[index-1][attr]) / ((this.times[index] - this.times[index-1]) / this.timePerFrame);
            if (attr.substr(1) == "Color") this.deltas[index-1][attr] = Math.round(this.deltas[index-1][attr]);
        }
    }
    if (index < this.target.forms.length-1) {
        delete this.deltas[index][attr];
        if ((this.target.forms[index][attr] != this.target.forms[index+1][attr]) && (typeof this.target.forms[index][attr] == "number")) {
            this.deltas[index][attr] = (this.target.forms[index+1][attr] - this.target.forms[index][attr]) / ((this.times[index+1] - this.times[index]) / this.timePerFrame);
            if (attr.substr(1) == "Color") this.deltas[index][attr] = Math.round(this.deltas[index][attr]);
        }
    }
}

/**
 * Modifies some form values.
 * @param {Number} index
 * @param {Object} form Contains form values to change.
 * @param {Boolean} [updateDeltas=true] If true recomputes delta values before and after the form.
 */
GhiriGori.Mutation.prototype.mod_form = function(index, form, updateDeltas)
{
    updateDeltas = typeof(updateDeltas) != 'undefined' ? updateDeltas : true;
    for (var attr in form) {
        if (this.target.forms[index][attr] != form[attr]) {
            this.target.forms[index][attr] = form[attr];
            if (updateDeltas) this.update_attr_deltas(index, attr);
        }
    }
    if (index == this.currFormInd) {
        for (var attr in form) this.currMut[attr] = this.target.forms[index][attr];
    }
}

/**
 * Inserts a form in the position of another.
 * @param {Number} index
 * @param {Object} form Contains form values for new form.
 * @param {Number} time When form appears in the mutation.
 */
GhiriGori.Mutation.prototype.ins_form = function(index, form, time)
{
    var form = GhiriGori.clone(form);
    // Add missing attributes to the passed form.
    if (index == this.currFormInd) {
        for (var attr in this.target.forms[this.currFormInd]) {
            (form.hasOwnProperty(attr)) ? this.currMut[attr] = form[attr] : form[attr] = this.currMut[attr];
        }
    } else {
        var indexCopy = (index > 0) ? index-1 : 0;
        for (var attr in this.target.forms[indexCopy]) {
            if (!form.hasOwnProperty(attr)) form[attr] = this.target.forms[indexCopy][attr];
        }
    }
    this.target.ins_form(index, form);
    this.times.splice(index, 0, time);
    this.deltas.splice(index, 0, {});
    for (var attr in form) {
        this.update_attr_deltas(index, attr);
    }
}

/**
 * Deletes a form.
 * @param {Number} index
 */
GhiriGori.Mutation.prototype.del_form = function(index)
{
    if (this.target.forms.length <= 1) {
        this.deltas = [];
        this.currFormInd = -1;
        this.currMut = {};
        this.selectNode = -1;
    }
    this.target.del_form(index);
    this.times.splice(index, 1);
    // Deltas length is one less than forms length, that now is equal to deltas length because the form deletion.
    if (index < this.target.forms.length) {
        delete this.deltas[index];
        this.deltas.splice(index, 1);
        if (index > 0) {
            this.deltas[index-1] = {};
            for (var attr in this.target.forms[index-1]) {
                if ((this.target.forms[index-1][attr] != this.target.forms[index][attr]) && (typeof this.target.forms[index-1][attr] == "number")) {
                    this.deltas[index-1][attr] = (this.target.forms[index][attr] - this.target.forms[index-1][attr]) / ((this.times[index] - this.times[index-1]) / this.timePerFrame);
                    if (attr.substr(1) == "Color") this.deltas[index-1][attr] = Math.round(this.deltas[index-1][attr]);
                }
            }
        }
    } else {
        delete this.deltas[index-1];
        this.deltas.splice(index-1, 1);
    }
    if (index == this.currFormInd) {
        if (index > 0) this.currFormInd--;
        for (var attr in this.target.forms[this.currFormInd]) this.currMut[attr] = this.target.forms[this.currFormInd][attr];
    }
}

/**
 * Draw mutation path and nodes on the surface.
 * @param {Object} surface Canvas context.
 */
GhiriGori.Mutation.prototype.draw_path = function(surface)
{
    var forms = this.target.forms, node = this.selectNode;
    surface.strokeStyle = "DimGray";
    surface.lineWidth = 1;
    surface.beginPath();
    surface.moveTo((forms[0].width / 2) + forms[0].x, (forms[0].height / 2) + forms[0].y);
    for (var i = 1; i < forms.length; i++) {
        surface.lineTo((forms[i].width / 2) + forms[i].x, (forms[i].height / 2) + forms[i].y);
    }
    surface.stroke();
    surface.fillStyle = "DodgerBlue";
    for (var i = 0; i < forms.length; i++) {
        surface.beginPath();
        surface.arc((forms[i].width / 2) + forms[i].x, (forms[i].height / 2) + forms[i].y, 5, 0, 6.283185307179586, true);
        surface.closePath();
        surface.fill();
        //if(i != node) surface.fillRect((forms[i].width / 2) + forms[i].x - 3, (forms[i].height / 2) + forms[i].y - 3, 6, 6);
    }
//    if (node > -1) {
//        surface.fillStyle = "#6211ff";
//        surface.fillRect((forms[node].width / 2) + forms[node].x - 3, (forms[node].height / 2) + forms[node].y - 3, 6, 6);
//    }
}

/**
 * Draw mutation path and nodes on the surface.
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean} True if a node is intersected.
 */
GhiriGori.Mutation.prototype.inters_node = function(x, y)
{
    var forms = this.target.forms;
    for (var i = 0; i < forms.length; i++) {
        if (x >= (forms[i].width / 2) + forms[i].x - 6 && y >= (forms[i].height / 2) + forms[i].y - 6 && x <= (forms[i].width / 2) + forms[i].x + 6 && y <= (forms[i].height / 2) + forms[i].y + 6) {
            this.selectNode = i;
            return true;
        }
    }
    return false;
}


/**
 * Contains all the data structures.
 * @constructor
 * @param {Function} part Type of the content, for example {@link GhiriGori.mutation}
 * @param {Number} framerate Number of animation frames per second.
 * @param {Number} timelineWidth Width in points of the timeline.
 */
GhiriGori.Model = function(part, framerate, timelineWidth)
{
    /** Each element type is the same of part. */
    this.content = [];
    this.part = part;
    this.selected = -1;
    this.framerate = framerate;
    this.timeline = new GhiriGori.Timeline(this, timelineWidth, framerate);
}

/**
 * Adds a shape to the model content.
 * @param {Function} type A shape type from {@link GhiriGori.shapes}
 * @param {Object} form Initial form of a shape.
 */
GhiriGori.Model.prototype.push_part = function(type, form)
{
    this.content.push(new this.part(new GhiriGori.Shape(type, form), [this.timeline.startTime], this.framerate));
    this.timeline.update(this.content.length-1);
}

GhiriGori.Model.prototype.del_part = function(index)
{
    delete this.content[index];
    this.content.splice(index, 1);
    this.timeline.update();
    if (this.selected == index) this.selected = -1;
}

GhiriGori.Model.prototype.ins_form = function(index, formIndex, form, time)
{
    if (index >= 0 && index < this.content.length) {
        this.content[index].ins_form(formIndex, form, time);
        this.timeline.update(index);
    }
}

GhiriGori.Model.prototype.del_form = function(index, formIndex)
{
    if (index >= 0 && index < this.content.length) {
        this.content[index].del_form(formIndex);
        this.timeline.update();
    }
}

GhiriGori.Model.prototype.go_to_form = function(index, formIndex)
{
    if (index >= 0 && index < this.content.length) {
        this.content[index].go_to_form(formIndex);
        //this.timeline.time_position(this.content[index].times[this.content[index].currFormInd]);
    }
}

GhiriGori.Model.prototype.next_form = function(index)
{
    if (index >= 0 && index < this.content.length) {
        this.content[index].next_form();
        this.timeline.time_position(this.content[index].times[this.content[index].currFormInd]);
    }
}

GhiriGori.Model.prototype.prev_form = function(index)
{
    if (index >= 0 && index < this.content.length) {
        this.content[index].prev_form();
        this.timeline.time_position(this.content[index].times[this.content[index].currFormInd]);
    }
}

/**
 * Permute the position of two shapes in the model content array.
 * @param {Number} index1 Index in model content.
 * @param {Number} index2 Index in model content.
 */
GhiriGori.Model.prototype.permute = function(index1, index2)
{
    if (index1 >= 0 && index1 < this.content.length && index2 >= 0 && index2 < this.content.length) {
        var temp = this.content[index2];
        this.content[index2] = this.content[index1];
        this.content[index1] = temp;
        this.timeline.update();
    }
}

/**
 * Change a form time.
 * @param {Number} index Index in model content.
 * @param {Number} formIndex Index of a shape form.
 * @param {Number} time New time for the form.
 * @return {Boolean} True if is possible to change time, false if time is higher or lower to next or previous form times.
 */
GhiriGori.Model.prototype.change_time = function(index, formIndex, time)
{
    var times = this.content[index].times;
    if (index >= 0 && index < this.content.length && formIndex >= 0 && formIndex < times.length && time >= 0 && ((formIndex != 0) ? time >= times[formIndex-1] : true) && ((formIndex != times.length-1) ? time <= times[formIndex+1] : true)) {
        times[formIndex] = time;
        this.content[index].update_form_deltas(formIndex);
        this.timeline.update(index);
        return true;
    } else return false;
}

/**
 * Set global start time
 * @param {Number} time
 * @return {Boolean} True if is possible to change time.
 */
GhiriGori.Model.prototype.shift_start_time = function(time)
{
    if (time < 0) return false;
    deltaTime = time - this.timeline.startTime;
    // Shift all form times.
    for (var i = this.content.length-1; i >= 0; i--) {
        var times = this.content[i].times;
        for (var j = times.length-1; j > 0; j--) {
            times[j] += deltaTime;
            times[j-1] += deltaTime;
            this.content[i].update_form_deltas(j);
        }
        this.content[i].update_form_deltas(0);
    }
    this.timeline.update();
    return true;
}

/**
 * Set mutations to a specific time.
 * @param {Number} time
 */
GhiriGori.Model.prototype.go_to_time = function(time)
{
    if (time < 0) time = 0;
    for (var i = this.content.length-1; i >= 0; i--) {
        // Binary search in times arrays.
        var mut = this.content[i];
        var times = mut.times;
        var end = times.length-1, start = 0;
        var index;
        while (start <= end) {
            index = Math.round((start + end) / 2);
            if (times[index] <= time && (times[index+1] || Infinity) > time) break;
            (times[index] < time) ? start = index+1 : end = index-1;
        }
        // Go to right form and mutation
        mut.go_to_form(index);
        var moves = (time - times[index]) / mut.timePerFrame;
        for (var attr in mut.deltas[index]) mut.currMut[attr] += mut.deltas[index][attr] * moves;
    }
}



/**
 * Manages the timeline, relations between time and position.
 * @constructor
 * @param {Object} model {@link GhiriGori.model}
 * @param {Number} width Width in points of the timeline.
 * @param {Number} framerate Number of animation frames per second.
 */
GhiriGori.Timeline = function(model, width, framerate)
{
    this.model = model;
    this.width = width;
    this.framerate = framerate;
    /** Global initial animation time. */
    this.startTime = 0;
    /** Global final animation time. */
    this.finalTime = 0;
    /** Position in points on the timeline. */
    this.position = 0;
    /** Number of points to define a millisecond in the timeline. */
    this.pointsPerMs = 0;
    /** Step to move time position. */
    this.delta = 0;
    /** Each element is an array of positions (on the timeline) of form times of a mutation. */
    this.timePoints = [];
    // Generate the timeline.
    this.update();
}

// TODO: too much computations!
/**
 * Recomputes right positions in timeline, when timeline size changes or a form time changes global time.
 * @param {Number} index Index of a modified mutation in model content.
 */
GhiriGori.Timeline.prototype.update = function(index)
{
    var content = this.model.content;
    var currTime = (this.position || 1) / this.pointsPerMs;
    //var oldStartTime = this.startTime, oldFinalTime = this.finalTime;
    // Set start and final time from first and last forms time from all mutations
    if (content.length) {
        this.startTime = content[0].times[0];
        this.finalTime = content[0].times[content[0].times.length-1];
    }
    for (var i = content.length-1; i > 0; i--) {
        var times = content[i].times;
        if (times[times.length-1] > this.finalTime) this.finalTime = times[times.length-1];
        if (times[0] < this.startTime) this.startTime = times[0];
    }
    // Generate time positions for each form.
    //if (oldStartTime != this.startTime || oldFinalTime != this.finalTime) {
        this.timePoints = new Array(content.length);
        var totalTime = this.finalTime - this.startTime;
        this.pointsPerMs = this.width / totalTime;
        this.delta = (totalTime > 0) ? this.width / (((totalTime) / 1000) * this.framerate) : 0;
        for (var i = content.length-1; i >= 0; i--) {
            var times = content[i].times;
            this.timePoints[i] = [];
            this.timePoints[i].push((times[0] - this.startTime) * this.pointsPerMs);
            var last = times.length-1;
            for (var e = 0; e < last; e++) {
                this.timePoints[i].push(((times[e+1] - times[e]) * this.pointsPerMs) + this.timePoints[i][e]);
            }
        }
        this.time_position(currTime);
    //} else if (index >= 0 && index < content.length) {
    //    var times = content[index].times;
    //    var last = times.length-1;
    //    // Update also in the case a new content part has been inserted.
    //    (this.timePoints.length == content.length-1) ? this.timePoints.splice(index, 0, []) : this.timePoints[index] = [];
    //    this.timePoints[index].push((times[0] - this.startTime) * this.pointsPerMs);
    //    for (var e = 0; e < last; e++) {
    //        this.timePoints[index].push(((times[e+1] - times[e]) * this.pointsPerMs) + this.timePoints[index][e]);
    //    }
    //}
}

/** Increments current time position. */
GhiriGori.Timeline.prototype.next_position = function()
{
    this.position += this.delta;
}

/**
 * Set current position by time.
 * @param {Number} time
 */
GhiriGori.Timeline.prototype.time_position = function(time)
{
    this.position = (time <= this.finalTime) ? ((time - this.startTime > 0) ? ((time - this.startTime) * this.pointsPerMs) : 0) : this.width;
}

/**
 * Manages timer and operations to execute in time.
 * @constructor
 * @param {Function} paint_func Drawing function.
 * @param {Function} clear_func Clear drawings.
 * @param {Object} model {@link GhiriGori.model}
 */
GhiriGori.Animator = function(paint_func, clear_func, model)
{
    this.model = model;
    this.paint = paint_func;
    this.clear = clear_func;
    this.timePerFrame = 1000 / model.framerate;
    /** Current animation time. */
    this.currTime = 0;
    /** True during animation. */
    this.running = false;
    /** True when animation is in the final time. */
    this.end = false;
    /** True when animation is in pause. */
    this.paused = false;
}

/**
 * Builds function to call in each animation frame.
 * @return {Function} 
 */
GhiriGori.Animator.prototype.runner = function()
{
    var mts1 = this.model.content.slice();
    // Only content in this array is executed in the animation.
    var mts2 = [];
    var paint = this.paint;
    var that = this;
    this.running = true;
    var timeline = this.model.timeline;
    if (!this.paused) timeline.time_position(0);
    this.paused = false;
    for (var i = 0; i < mts1.length; i++) mts1[i].show = false;
    paint();
//    var startTime = mutations.times[0];
//    for (i = 1; i < mutations.length; i++) {
//        if (mutations.times[i] < startTime) startTime = mutations.times[i];
//    }
    return (function()
    {
        // Put mutation in mts2 if it's its start time (its current form time) is passed
        for (var i = mts1.length-1; i >= 0; i--) {
            if (mts1[i].times[0] <= that.currTime) mts1[i].show = true;
            if (mts1[i].times[mts1[i].currFormInd] <= that.currTime) {
                mts2.push(mts1[i]);
                mts1.splice(i, 1);
            }
        }
        for (var i = mts2.length-1; i >= 0; i--) {
            // When mutation is ended it is no more updated.
            if(mts2[i].next_step()) {
                mts2[i].show = false;
                mts2.splice(i, 1);
            }
        }
        // During initial delay timeline and animations are fixed.
        if (timeline.startTime <= that.currTime) {
            timeline.next_position();
            paint();
        }
        that.currTime += that.timePerFrame;
        // Stop when there is no more content tu update.
        if (!mts1.length && !mts2.length) {
            timeline.next_position();
            that.running = false;
            that.end = true;
            that.currTime = 0;
            for (var i = 0; i < that.model.content.length; i++) that.model.content[i].show = true;
            //paint();
            clearInterval(that.id);
        }
    });
}

/** Start animation thread from current time. */
GhiriGori.Animator.prototype.start = function()
{
    if (!this.running) {
        if (this.end) this.init();
        this.model.selected = -1;
        this.id = setInterval(this.runner(), this.timePerFrame);
    }
}

/** Pause animation thread in current time. */
GhiriGori.Animator.prototype.pause = function()
{
    if (this.running && !this.end) {
        clearInterval(this.id);
        this.running = false;
        this.paused = true;
        var mts = this.model.content;
        for (var i = 0; i < mts.length; i++) mts[i].show = true;
        this.paint();
    }
}

/** Initialize animation thread from the beginning. */
GhiriGori.Animator.prototype.init = function()
{
    clearInterval(this.id);
    this.running = false;
    this.end = false;
    this.paused = false;
    this.model.selected = -1;
    this.currTime = 0;
    this.model.timeline.time_position(0);
    var mts = this.model.content;
    for (var i = 0; i < mts.length; i++) {
        mts[i].init_form();
        mts[i].show = true;
    }
    this.paint();
}



/**
 * Convert all model useful data to a string.
 * @param {Object} model {@link GhiriGori.model}
 * @return {String} JSON serialization of the model.
 */
GhiriGori.save_model = function(m)
{
    var copy = {};
    copy.timelineWidth = m.timeline.width;
    copy.framerate = m.framerate;
    copy.selected = m.selected;
    copy.content = new Array(m.content.length);
    for (var i = m.content.length-1; i >= 0; i--) {
        copy.content[i] = {};
        copy.content[i].type_name = m.content[i].target.Type.name;
        copy.content[i].currFormInd = m.content[i].currFormInd;
        copy.content[i].forms = m.content[i].target.forms;
        copy.content[i].times = m.content[i].times;
    }
    return JSON.stringify(copy);
}

/**
 * Convert serialized model to the object.
 * @param {String} str JSON serialization of the model.
 * @param {Number} currTimelWidth Current timeline canvas element width.
 * @return {Object} {@link GhiriGori.model}
 */
GhiriGori.load_model = function(str, currTimelWidth)
{
    var copy = JSON.parse(str);
    var m = new GhiriGori.Model(GhiriGori.Mutation, copy.framerate, currTimelWidth);
    m.selected = copy.selected;
    for (var i = 0; i < copy.content.length; i++) {
        m.push_part(GhiriGori.shapes[copy.content[i].type_name], copy.content[i].forms[0]);
        m.change_time(i, 0, copy.content[i].times[0]);
        for (var e = 1; e < copy.content[i].forms.length; e++) {
            m.ins_form(i, e, copy.content[i].forms[e], copy.content[i].times[e]);
        }
        m.go_to_form(i, copy.content[i].currFormInd);
    }
    return m;
}


