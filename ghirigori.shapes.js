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
 * @fileOverview Shapes with their different parameters and methods.
 * @author <a href="mailto:barnets@gmail.com">Giacomo Berardi</a>
 * @version 0.1
 */


/** Each type function in it adds attributes and behaviors to the forms of a shape, and it directly accesses to {@link GhiriGori.mutation} attributes */
GhiriGori.shapes = {};


GhiriGori.shapes.Line = function(){};

GhiriGori.shapes.Line.init =
{
    width: 200,
    height: 0,
    lineWidth: 2
}

/**
 * Draw current form mutation on surface with canvas primitives.
 * @param {Object} surface Canvas context
 */
GhiriGori.shapes.Line.prototype.draw = function(surface)
{
    var form = this.currMut;
    surface.strokeStyle = "rgba(" + form.rColor + "," + form.gColor + "," + form.bColor + "," + form.opacity + ")";
    surface.lineWidth = form.lineWidth;
    surface.beginPath();
    surface.moveTo(form.x, form.y);
    surface.lineTo(form.x + form.width, form.y + form.height);
    //surface.closePath();
    surface.stroke();
}

/**
 * Draw selection signs, like handles to manipulate form.
 * @param {Object} surface Canvas context
 */
GhiriGori.shapes.Line.prototype.draw_select = function(surface)
{
    var form = this.currMut;
    surface.drawImage(GhiriGori.resizeImg, form.width + form.x - GhiriGori.resizeImg.halfWidth, form.height + form.y - GhiriGori.resizeImg.halfHeight);
    surface.drawImage(GhiriGori.rotateImg, form.x - GhiriGori.rotateImg.halfWidth, form.y - GhiriGori.rotateImg.halfHeight);
}

/**
 * Verifies intersection of a point with current form mutation bounding box.
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean} True if (x,y) point intersects.
 */
GhiriGori.shapes.Line.prototype.inters_boundingbox = function(x, y)
{
    var form = this.currMut;
    var x0 = form.x, y0 = form.y, x1 = form.x + form.width, y1 = form.y + form.height;
    if (form.width < 0) {
        x0 = x1;
        x1 = form.x;
    }
    if (form.height < 0) {
        y0 = y1;
        y1 = form.y;
    }
    var l = form.lineWidth / 2 + 10;
    return (x >= x0 - l && x <= x1 + l && y >= y0 - l && y <= y1 + l);
}

/**
 * Verifies intersection of a point with current form mutation.
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean} True if (x,y) point intersects.
 */
GhiriGori.shapes.Line.prototype.intersect = function(x, y)
{
    var width = this.currMut.width;
    var height = this.currMut.height;
    var x1 = this.currMut.x;
    var y1 = this.currMut.y;
    var x2 = x1 + width;
    var y2 = y1 + height;
    var cenX = x1 + width / 2;
    var cenY = y1 + height / 2;
    var c = (y1 * -width) + (x1 * (height));
    var halfLen = Math.sqrt(width * width + height * height) / 2;
    return ((Math.abs(-height * x + width * y + c) / Math.sqrt(-height * -height + width * width)) < (10 + this.currMut.lineWidth / 2) && Math.sqrt((x - cenX) * (x - cenX) + (y - cenY) * (y - cenY)) < halfLen + 10);
}

/**
 * Verifies intersection of a point with handles, setting the appropiate handle selected.
 * @param {Number} x
 * @param {Number} y
 * @return {Boolean} True if (x,y) point intersects.
 */
GhiriGori.shapes.Line.prototype.inters_handle = function(x, y)
{
    var form = this.currMut;
    if (x >= (form.x + form.width - GhiriGori.resizeImg.halfWidth) && x <= (form.x + form.width + GhiriGori.resizeImg.halfWidth) && y >= (form.y + form.height - GhiriGori.resizeImg.halfHeight) && y <= (form.y + form.height + GhiriGori.resizeImg.halfHeight)) {
        this.handle = 0;
        return true;
    }
    if (x >= (form.x - GhiriGori.rotateImg.halfWidth) && x <= (form.x + GhiriGori.rotateImg.halfWidth) && y >= (form.y - GhiriGori.rotateImg.halfHeight) && y <= (form.y + GhiriGori.rotateImg.halfHeight)) return (this.handle = 1);
}

/**
 * Executes operations to the form during handle movement.
 * @param {Object} moveEvent Event object of a mouse moving action
 * @param {Number} offsetX Horizontal distance of click point from the form bounding box origin.
 * @param {Number} offsetY Vertical distance of click point from the form bounding box origin.
 * @param {Number} offsetWidth Horizontal distance of click point from the opposite angle of the form bounding box respect to the origin.
 * @param {Number} offsetHeight Vertical distance of click point from the opposite angle of the form bounding box respect to the origin.
 */
GhiriGori.shapes.Line.prototype.use_handle = function(moveEvent, offsetX, offsetY, offsetWidth, offsetHeight)
{
    var form = this.currMut;
    if (this.handle == 0) {
        var newWidth = (moveEvent.clientX - form.x) + offsetWidth;
        var newHeight = (moveEvent.clientY - form.y) + offsetHeight;
        this.mod_form(this.currFormInd, {width: newWidth, height: newHeight});
    } else {
        var newWidth = ((form.x + form.width) - moveEvent.clientX) + offsetX;
        var newHeight = ((form.y + form.height) - moveEvent.clientY) + offsetY;
        var newX = form.x + (form.width - newWidth) / 2;
        var newY = form.y + (form.height - newHeight) / 2;
        this.mod_form(this.currFormInd, {x: newX, y: newY, width: newWidth, height: newHeight});
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7

GhiriGori.shapes.Rectangle = function(){};

GhiriGori.shapes.Rectangle.init =
{
    width: 200,
    height: 100,
    lineWidth: 2
}

GhiriGori.shapes.Rectangle.prototype.draw = function(surface)
{
    var form = this.currMut;
    surface.strokeStyle = "rgba(" + form.rColor + "," + form.gColor + "," + form.bColor + "," + form.opacity + ")";
    surface.lineWidth = form.lineWidth;
    surface.strokeRect(form.x, form.y, form.width, form.height);
}

GhiriGori.shapes.Rectangle.prototype.draw_select = function(surface)
{
    var form = this.currMut;
    surface.drawImage(GhiriGori.resizeImg, form.width + form.x - GhiriGori.resizeImg.halfWidth, form.height + form.y - GhiriGori.resizeImg.halfHeight);
}

GhiriGori.shapes.Rectangle.prototype.intersect = function(x, y)
{
    var form = this.currMut;
    var l = form.lineWidth / 2;
    return (x >= form.x - l && x <= form.x + form.width + l && y >= form.y - l && y <= form.y + form.height + l);
}

GhiriGori.shapes.Rectangle.prototype.inters_handle = function(x, y)
{
    var form = this.currMut;
    return (x >= (form.x + form.width - GhiriGori.resizeImg.halfWidth) && x <= (form.x + form.width + GhiriGori.resizeImg.halfWidth) && y >= (form.y + form.height - GhiriGori.resizeImg.halfHeight) && y <= (form.y + form.height + GhiriGori.resizeImg.halfHeight));
}

GhiriGori.shapes.Rectangle.prototype.use_handle = function(moveEvent, offsetX, offsetY, offsetWidth, offsetHeight)
{
    var deltaX = moveEvent.clientX - this.currMut.x;
    var deltaY = moveEvent.clientY - this.currMut.y;
    var newWidth = ((deltaX > 0) ? deltaX : 1) + offsetWidth;
    var newHeight = ((deltaY > 0) ? deltaY : 1) + offsetHeight;
    this.mod_form(this.currFormInd, {width: newWidth, height: newHeight});
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

GhiriGori.shapes.Ellipse = function(){};

GhiriGori.shapes.Ellipse.init =
{
    width: 200,
    height: 100,
    lineWidth: 2
}

GhiriGori.shapes.Ellipse.prototype.draw = function(surface)
{
    var form = this.currMut;
    var radX = ((form.width + form.x) - form.x) / 2;
    var radY = ((form.height + form.y) - form.y) / 2;
    var conX = form.x + radX;
    var conY = form.y + radY;
    var cp1X = conX + (0.5522847498307936 * radX);
    var cp1Y = conY - radY;
    var cp2X = conX + radX;
    var cp2Y = conY - (0.5522847498307936 * radY);
    var cp3X = conX - (0.5522847498307936 * radX);
    var cp3Y = conY + (0.5522847498307936 * radY);
    var cp4X = conX - radX;
    var cp4Y = conY + radY;
    surface.strokeStyle = "rgba(" + form.rColor + "," + form.gColor + "," + form.bColor + "," + form.opacity + ")";
    surface.lineWidth = form.lineWidth;
    surface.beginPath();
    surface.moveTo(conX, cp1Y);
    surface.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, cp2X, conY);
    surface.bezierCurveTo(cp2X, cp3Y, cp1X, cp4Y, conX, cp4Y);
    surface.bezierCurveTo(cp3X, cp4Y, cp4X, cp3Y, cp4X, conY);
    surface.bezierCurveTo(cp4X, cp2Y, cp3X, cp1Y, conX, cp1Y);
    surface.closePath();
    surface.stroke();
    //var cenX = form.width / 2 + form.x;
    //var cenY = form.height / 2 + form.y;
    //var x2 = form.width + form.x;
    //var y2 = form.height + form.y;
    //surface.strokeStyle = "rgba(" + form.rColor + "," + form.gColor + "," + form.bColor + "," + form.opacity + ")";
    //surface.lineWidth = form.lineWidth;
    //surface.beginPath();
    //surface.moveTo(cenX, form.y);
    //surface.quadraticCurveTo(x2, form.y, x2, cenY);
    //surface.quadraticCurveTo(x2, y2, cenX, y2);
    //surface.quadraticCurveTo(form.x, y2, form.x, cenY);
    //surface.quadraticCurveTo(form.x, form.y, cenX, form.y);
    //surface.closePath();
    //surface.stroke();
}

GhiriGori.shapes.Ellipse.prototype.draw_select = GhiriGori.shapes.Rectangle.prototype.draw_select;

GhiriGori.shapes.Ellipse.prototype.intersect = function(x, y)
{
    var form = this.currMut;
    var horizAx = form.width / 2 + form.lineWidth / 2;
    var vertAx = form.height / 2 + form.lineWidth / 2;
    var offsX = Math.abs((form.x - form.lineWidth / 2) + horizAx - x);
    var offsY = Math.abs((form.y - form.lineWidth / 2) + vertAx - y);
    return 1 >= ((offsX * offsX) / (horizAx * horizAx)) + ((offsY * offsY) / (vertAx * vertAx)); 
}

GhiriGori.shapes.Ellipse.prototype.inters_handle = GhiriGori.shapes.Rectangle.prototype.inters_handle;

GhiriGori.shapes.Ellipse.prototype.use_handle = function(moveEvent, offsetX, offsetY, offsetWidth, offsetHeight)
{
    var form = this.currMut;
    var deltaX = moveEvent.clientX - form.x;
    var deltaY = moveEvent.clientY - form.y;
    var newWidth = ((deltaX > 0) ? deltaX : 1) + offsetWidth;
    var newHeight = ((deltaY > 0) ? deltaY : 1) + offsetHeight;
    var newX = form.x + (form.width - newWidth) / 2;
    var newY = form.y + (form.height - newHeight) / 2;
    this.mod_form(this.currFormInd, {x: newX, y: newY, width: newWidth, height: newHeight});
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7

GhiriGori.shapes.Arrow = function(){};

GhiriGori.shapes.Arrow.init =
{
    width: 200,
    height: 0,
    lineWidth: 2
}

GhiriGori.shapes.Arrow.prototype.extraAttrs =
{
    headAngle:
    {
        name: "Head Angle",
        base: Math.PI / 4,
        range: [0.01, Math.PI / 2]
    },
    headWidth:
    {
        name: "Head Width",
        base: 20,
        range: [0.1, Infinity]
    }
}

GhiriGori.shapes.Arrow.prototype.draw = function(surface)
{
    var form = this.currMut;
    var length = Math.sqrt(form.width * form.width + form.height * form.height);
    var headLength = form.headWidth / (Math.tan(form.headAngle) * length);
    var baseX = (form.x + form.width) + (-headLength * form.width);
    var baseY = (form.y + form.height) + (-headLength * form.height);
    var baseLength = form.headWidth / (2 * length);
    var leftX = baseX + (baseLength * -form.height);
    var leftY = baseY + (baseLength * form.width);
    var rightX = baseX + (-baseLength * -form.height);
    var rightY = baseY + (-baseLength * form.width);
    surface.strokeStyle = "rgba(" + form.rColor + "," + form.gColor + "," + form.bColor + "," + form.opacity + ")";
    surface.fillStyle = surface.strokeStyle;
    surface.lineWidth = form.lineWidth;
    surface.beginPath();
    surface.moveTo(form.x, form.y);
    surface.lineTo(baseX, baseY);
    surface.stroke();
    surface.lineWidth = 1;
    surface.beginPath();
    surface.lineTo(leftX, leftY);
    surface.lineTo(rightX, rightY);
    surface.lineTo(form.x + form.width, form.y + form.height);
    surface.closePath();
    surface.stroke();
    surface.fill();
}

GhiriGori.shapes.Arrow.prototype.draw_select = function(surface)
{
    var form = this.currMut;
    surface.drawImage(GhiriGori.resizeImg, form.x - GhiriGori.rotateImg.halfWidth, form.y - GhiriGori.rotateImg.halfHeight);
    surface.drawImage(GhiriGori.rotateImg, form.width + form.x - GhiriGori.resizeImg.halfWidth, form.height + form.y - GhiriGori.resizeImg.halfHeight);
}


GhiriGori.shapes.Arrow.prototype.inters_boundingbox = function(x, y)
{
    var form = this.currMut;
    var x0 = form.x, y0 = form.y, x1 = form.x + form.width, y1 = form.y + form.height;
    if (form.width < 0) {
        x0 = x1;
        x1 = form.x;
    }
    if (form.height < 0) {
        y0 = y1;
        y1 = form.y;
    }
    var l = (form.headWidth > form.lineWidth) ? form.headWidth / 2 : form.lineWidth / 2;
    return (x >= x0 - l && x <= x1 + l && y >= y0 - l && y <= y1 + l);
}

GhiriGori.shapes.Arrow.prototype.intersect = function(x, y)
{
    var width = this.currMut.width;
    var height = this.currMut.height;
    var x1 = this.currMut.x;
    var y1 = this.currMut.y;
    var x2 = x1 + width;
    var y2 = y1 + height;
    var length = Math.sqrt(width * width + height * height);
    var headLength = this.currMut.headWidth / (Math.tan(this.currMut.headAngle) * length);
    var baseX = (x1 + width) + (-headLength * width);
    var baseY = (y1 + height) + (-headLength * height);
    var baseLength = this.currMut.headWidth / (2 * length);
    var leftX = baseX + (baseLength * -height);
    var leftY = baseY + (baseLength * width);
    var rightX = baseX + (-baseLength * -height);
    var rightY = baseY + (-baseLength * width);
    width = baseX - x1;
    height = baseY - y1;
    var cenX = x1 + width / 2;
    var cenY = y1 + height / 2;
    var c = (y1 * -width) + (x1 * height);
    return (((Math.abs(-height * x + width * y + c) / Math.sqrt(-height * -height + width * width)) < (5 + this.currMut.lineWidth / 2) && Math.sqrt((x - cenX) * (x - cenX) + (y - cenY) * (y - cenY)) < ((length - headLength * length) / 2)) || (GhiriGori.same_side(x, y, x2, y2, leftX, leftY, rightX, rightY) && GhiriGori.same_side(x, y, rightX, rightY, x2, y2, leftX, leftY) && GhiriGori.same_side(x, y, leftX, leftY, rightX, rightY, x2, y2)));
}

GhiriGori.shapes.Arrow.prototype.inters_handle = GhiriGori.shapes.Line.prototype.inters_handle;

GhiriGori.shapes.Arrow.prototype.use_handle = function(moveEvent, offsetX, offsetY, offsetWidth, offsetHeight)
{
    var form = this.currMut;
    if (this.handle == 1) {
        var newWidth = ((form.x + form.width) - moveEvent.clientX) + offsetX;
        var newHeight = ((form.y + form.height) - moveEvent.clientY) + offsetY;
        this.mod_form(this.currFormInd, {x: moveEvent.clientX - offsetX, y: moveEvent.clientY - offsetY, width: newWidth, height: newHeight});
    } else {
        var newWidth = (moveEvent.clientX - form.x) + offsetWidth;
        var newHeight = (moveEvent.clientY - form.y) + offsetHeight;
        var newX = form.x + (form.width - newWidth) / 2;
        var newY = form.y + (form.height - newHeight) / 2;
        this.mod_form(this.currFormInd, {x: newX, y: newY, width: newWidth, height: newHeight});
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7

GhiriGori.shapes.Text = function(){};

GhiriGori.shapes.Text.init =
{
    width: 92,
    height: 50,
    lineWidth: 4
}

GhiriGori.shapes.Text.prototype.extraAttrs =
{
//    height:
//    {
//        name: "Font size",
//        base: 20,
//    },
    content:
    {
        name: "Text",
        base: "Text"
    },
    fontFamily:
    {
        name: "Font Family",
        base: "serif",
        range: ["serif", "sans-serif", "cursive", "fantasy", "monospace"]
    }
}

GhiriGori.shapes.Text.prototype.draw = function(surface)
{
    var form = this.currMut;
    surface.fillStyle = "rgba(" + form.rColor + "," + form.gColor + "," + form.bColor + "," + form.opacity + ")";
    var weight = form.lineWidth * 100;
    // TODO: range control should be computed at values insertion time
    this.font = surface.font = ((weight > 900) ? 900 : ((weight < 100) ? 100 : weight)) + " " + form.height + "px " + form.fontFamily;
    surface.fillText(form.content, form.x, form.y + form.height);
}

GhiriGori.shapes.Text.prototype.draw_select = function(surface)
{
    var form = this.currMut;
    surface.font = this.font;
    form.width = surface.measureText(form.content).width;
    surface.drawImage(GhiriGori.resizeImg, form.width + form.x - GhiriGori.resizeImg.halfWidth, form.height + form.y - GhiriGori.resizeImg.halfHeight);
}

GhiriGori.shapes.Text.prototype.intersect = GhiriGori.shapes.Rectangle.prototype.intersect;

GhiriGori.shapes.Text.prototype.inters_handle = function(x, y)
{
    var form = this.currMut;
    return (x >= (form.x + form.width - GhiriGori.resizeImg.halfWidth) && x <= (form.x + form.width + GhiriGori.resizeImg.halfWidth) && y >= (form.y + form.height - GhiriGori.resizeImg.halfHeight) && y <= (form.y + form.height + GhiriGori.resizeImg.halfHeight));
}

GhiriGori.shapes.Text.prototype.use_handle = function(moveEvent, offsetX, offsetY, offsetWidth, offsetHeight)
{
    var newHeight = (moveEvent.clientY - this.currMut.y) + offsetHeight;
    this.mod_form(this.currFormInd, {height: (newHeight > 0) ? newHeight : 1, width: this.currMut.width});
}



for (shapeName in GhiriGori.shapes) {
    GhiriGori.shapes[shapeName].name = shapeName;
}
