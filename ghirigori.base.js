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
 * @fileOverview Base application parameters and functions.
 * @author <a href="mailto:barnets@gmail.com">Giacomo Berardi</a>
 * @version 0.1
 */

// Namespace definition
try {
	if (GhiriGori) alert("Error: 'GhiriGori' name already defined");
} catch (err) {}
/**
 * @namespace GhiriGori
 */
var GhiriGori = {};


//////////////////// adjustable parameters ////////////////////////////////////

/** Page body is shifted down by this value during editing. */
GhiriGori.bodyOffset = 40;

/** Number of elements in the undo/redo register. */
GhiriGori.maxMemory = 30;

/** Animations framerate. */
GhiriGori.framerate = 24;

/** Base font size for the interface, in pixels. */
GhiriGori.fontSize = 14;
/** Base font color for the interface. */
GhiriGori.fontColor = "DimGrey";

/** Server script to save projects. */
GhiriGori.serverUrl = "ghirigori.php";

/**
 * Load a project.
 * @param {String} name Project name.
 * @param {Function} callback It'called when project is loaded, with argument the project string.
 */
GhiriGori.load_proj = function(name, callback)
{
    GhiriGori.Server.post({load: name}, callback, 60000);
}

/**
 * Save a project.
 * @param {String} name Project name.
 * @param {String} str Project string.
 * @param {Function} callback It'called when project is saved, with argument the new projects list.
 */
GhiriGori.save_proj = function(name, str, callback)
{
    GhiriGori.Server.post({save: name + "=" + str, list: true}, callback, 60000);
}

/**
 * Load projects list.
 * @param {Function} callback It's called with argument the projects list.
 */
GhiriGori.get_proj_list = function(callback)
{
    GhiriGori.Server.post({list: true}, callback, 60000);
}

GhiriGori.help = "Add or remove shapes from the Instruments panel. For each shape you can add new forms in time, modify each form and change its time from the Timeline panel. Form time can be changed with input field and moving time sign on timeline. During the pause, or while moving time cursor, you can add new forms by clicking on the current shape. Use Initial Delay field to shift global start time. If a form different from the first is selected, its animation will start only at form time. With Copy you can set form size or position equal to another. <br/> Keyboard commands: <ul> <li>Meta + Left Click : Move a window.</li> <li>Meta + Alt + a : Add a form to selected shape.</li> <li>Meta + r : Remove selected form.</li> <li>Meta + p : Play/pause.</li> <li>Meta + s : Stop.</li> <li>Meta + n : Next form.</li> <li>Meta + b : Previous form.</li> <li>Ctrl + Meta + Left Arrow : Go back in time.</li> <li>Ctrl + Meta + Right Arrow : Go forward in time.</li> <li>Ctrl + Left Arrow : Move left select form.</li> <li>Ctrl + Right Arrow : Move right select form.</li> <li>Ctrl + Up Arrow : Move up select form.</li> <li>Ctrl + Down Arrow : Move down select form.</li> <li>Ctrl + Page Up : Move up selected shape in visualization order.</li> <li>Ctrl + Page Down : Move down selected shape in visualization order.</li> <li>Up Arrow and Down Arrow while focus on color field : Change color brightness.</li> <li>Ctrl + Left Arrow and Right Arrow while focus on color field : Change color.</li><li>Up Arrow and Down Arrow while focus on a numeric field : Increment and decrement value.</li>  </ul>";

///////////////////////////////////7///////////////////////////////////////////


/** Canvas initialization. */
GhiriGori.main_canvas = function()
{
    if (GhiriGori.mainCanvas) return GhiriGori.mainCanvas;
    var mainCanvas = document.createElement("canvas");
    mainCanvas.style.position = "fixed";
    mainCanvas.style.top = "0";
    mainCanvas.style.left = "0";

    // Measure browser scrollbar width
    document.body.style.overflow = "hidden";
    var scrollbarWidth = document.body.clientWidth;
    document.body.style.overflow = "scroll";
    scrollbarWidth -= document.body.clientWidth;
    if (!scrollbarWidth) scrollbarWidth = document.body.offsetWidth - document.body.clientWidth;
    document.body.style.overflow = "";

    // sottrai se il documento non è maggiore del vieport (sostituisci funzione con variabile)
    //TODO rendi compatibile con explorer (window.innerWidth e innerHeight)
    // Fit canvas size to the document
    window.onresize = function()
    {
        mainCanvas.width = (document.width - window.innerWidth > 0) ? window.innerWidth : window.innerWidth - scrollbarWidth; 
        mainCanvas.height = (document.height - window.innerHeight > 0) ? window.innerHeight : window.innerHeight - scrollbarWidth;
        //alert(document.height + " "+ window.innerHeight + "       " + document.width+ " "+ window.innerWidth);
    }
    window.onresize();

    document.body.appendChild(mainCanvas);

    GhiriGori.mainCanvas = mainCanvas;
    return mainCanvas;
}


/**
 * Canvas painting manager.
 * @constructor
 * @param {Object} canvas Canvas DOM element.
 * @param {Function} paint_func Drawing function on canvas.
 * @param {Object} model {@link GhiriGori.model}
 */
GhiriGori.View = function(canvas, paint_func, model)
{
    this.canvas = canvas;
    this.surface = canvas.getContext("2d");
    this.paint = paint_func;
    this.model = model;
}

/**
 * Function to clear view.
 * @return {Function}
 */
GhiriGori.View.prototype.get_clear = function()
{
    var srf = this.surface, canvas = this.canvas;
    return (function() {srf.clearRect(0, 0, canvas.width, canvas.height);});
}

/** Instructions to paint model on the main surface. */
GhiriGori.main_paint = function()
{
// TODO: not repainting all (clear only where necessary)
    var srf = this.surface, cnt = this.model.content, slc = this.model.selected;
    srf.clearRect(0, 0, this.canvas.width, this.canvas.height);
    srf.save();
    // Stay fixed to the page
    srf.translate(-window.pageXOffset, -window.pageYOffset);
    for (var i = 0; i < cnt.length; i++) {
        if (cnt[i].show) cnt[i].draw(srf);
    }
    if (slc > -1) {
        cnt[slc].draw_path(srf);
        cnt[slc].draw_select(srf);
    }
    srf.restore();
}

/** HTTP server. */
GhiriGori.Server = {};

GhiriGori.Server.factories =
[
    function() {return new XMLHttpRequest();},
    function() {return new ActiveXObject("Msxml2.XMLHTTP");},
    function() {return new ActiveXObject("Microsoft.XMLHTTP");}
];

GhiriGori.Server.factory = null;

GhiriGori.Server.url = GhiriGori.serverUrl;

GhiriGori.Server.new_request = function()
{
    if (this.factory != null) return this.factory();
    for(var i = 0; i < this.factories.length; i++) {
        try {
            var factory = this.factories[i];
            var request = factory();
            if (request != null) {
                this.factory = factory;
                return request;
            }
        }
        catch(e) {
            continue;
        }
    }
    this.factory = function() {alert("XMLHttpRequest not supported");}
    this.factory();
}

/**
 * Send a POST request to server.
 * @param {Object} values "Name = Value" pairs for the POST message.
 * @param {Function} callback It's called with argument the server response.
 * @param {Number} timeout Max time to wait for server response.
 */
GhiriGori.Server.post = function(values, callback, timeout) 
{
    var request = this.new_request();
    var abort = function()
    {
        request.abort();
        alert("Error: Server timeout");
    }
    var timer = setTimeout(abort, timeout);
    request.onreadystatechange = function()
    {
        if (request.readyState == 4) {
            if (request.status == 200) {
                if (timer) clearTimeout(timer);
                callback(request.responseText);
            } else {
                alert("Error " + request.status + ": " + request.statusText);
            }
        }
    }
    request.open("POST", this.url);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send(this.encode_form_data(values));
}

/**
 * Converts values object in a correct string for HTTP POST request.
 * @param {Object} data "Name = Value" pairs for the POST message.
 * @return {String}
 */
GhiriGori.Server.encode_form_data = function(data)
{
    var pairs = [];
    var regexp = /%20/g;
    for(var name in data) {
        var value = data[name].toString();
        var pair = encodeURIComponent(name).replace(regexp,"+") + '=' + encodeURIComponent(value).replace(regexp,"+");
        pairs.push(pair);
    }
    return pairs.join('&');
}



// Utility functions.

/**
 * Concatenates different functions (the arguments) in one function.
 * @param {Function[]}
 * @return {Function} Function that calls each single argument function.
 */
GhiriGori.conc_func = function(/* Variable number of arguments */)
{
    var functions = new Array();
    for (var i = arguments.length-1; i >= 0; i--) {
        if (typeof arguments[i] == "function") functions.push(arguments[i]);
    }
    return (function()
    {
        for (var i = functions.length-1; i >= 0; i--) functions[i]();
    });
}

/** Returns a new copy of an object */
GhiriGori.clone = function(obj)
{
    var cloned = (obj instanceof Array) ? [] : {};
    for (attr in obj) {
         if (obj[attr] instanceof Image) {
             cloned[attr] = obj[attr];
         } else if (obj[attr].cloneNode) {
             cloned[attr] = obj[attr].cloneNode(true);
         } else if (typeof obj[attr] == "object") {
             cloned[attr] = arguments.callee(obj[attr]);
         } else cloned[attr] = obj[attr];
    }
    return cloned;
}

/** Returns horizontal position of a html DOM element */
GhiriGori.find_x = function(elem)
{
    var currLeft = 0;
    if (elem.offsetParent) {
        while (true) {
            currLeft += elem.offsetLeft;
            if (!elem.offsetParent) break;
            elem = elem.offsetParent;
        }
    } else if (elem.x) currLeft += elem.x
    else if (elem.clientLeft) currTop += elem.clientLeft;
    return currLeft;
}

/** Returns vertical position of a html DOM element */
GhiriGori.find_y = function(elem)
{
    var currTop = 0;
    if (elem.offsetParent) {
        while (true) {
            currTop += elem.offsetTop;
            if (!elem.offsetParent) break;
            elem = elem.offsetParent;
        } 
    } else if (elem.y) currTop += elem.y
    else if (elem.clientTop) currTop += elem.clientTop;
    return currTop;
}

// Color conversion functions

GhiriGori.hex_to_rgb = function(hexColor)
{
    hexColor = (hexColor.charAt(0) == "#") ? hexColor.substring(1,7) : hexColor;
    return {r: parseInt(hexColor.substring(0, 2), 16), g: parseInt(hexColor.substring(2, 4), 16), b: parseInt(hexColor.substring(4, 6), 16)};
}

GhiriGori.rgb_to_hex = function(rgbColor)
{
    function to_hex(n)
    {
        if (n == null) return "00";
        n = parseInt(n);
        if (n == 0 || isNaN(n)) return "00";
        n = Math.max(0, n);
        n = Math.min(n, 255);
        n = Math.round(n);
        return "0123456789ABCDEF".charAt((n - n % 16) / 16) + "0123456789ABCDEF".charAt(n % 16);
    }
    return "#" + to_hex(rgbColor.r) + to_hex(rgbColor.g) + to_hex(rgbColor.b);
}

GhiriGori.hsv_to_rgb = function(hsvColor)
{
    var r, g, a, b, c, s = hsvColor.s / 100, v = hsvColor.v / 100, h = hsvColor.h / 360;
    if (s > 0) {
        if (h >= 1) h = 0;
        h = 6 * h; 
        f = h - Math.floor(h);
        a = Math.round(255 * v * (1 - s));
        b = Math.round(255 * v * (1 - (s * f)));
        c = Math.round(255 * v * (1 - (s * (1 - f))));
        v = Math.round(255 * v); 
        switch(Math.floor(h)) {
            case 0: r = v; g = c; b = a; break;
            case 1: r = b; g = v; b = a; break;
            case 2: r = a; g = v; b = c; break;
            case 3: r = a; g = b; b = v; break;
            case 4: r = c; g = a; b = v; break;
            case 5: r = v; g = a; b = b; break;
        }
        return({r: r ? r : 0, g: g ? g : 0, b: b ? b : 0});
    }
    else return({r: (v = Math.round(v * 255)), g: v, b: v});
}

GhiriGori.rgb_to_hsv = function(rgbColor)
{
    var max = Math.max(rgbColor.r, rgbColor.g, rgbColor.b), delta = max - Math.min(rgbColor.r, rgbColor.g, rgbColor.b), h, s, v;
    if (max != 0) {
        s = Math.round(delta / max * 100);
        if(rgbColor.r == max) h = (rgbColor.g - rgbColor.b) / delta; else if (rgbColor.g == max) h = 2 + (rgbColor.b - rgbColor.r) / delta; else if (rgbColor.b == max) h = 4 + (rgbColor.r - rgbColor.g) / delta;
        h = Math.min(Math.round(h * 60), 360);
        if (h < 0) h += 360;
    }
    return({h: h ? h : 0, s: s ? s : 0, v: Math.round((max / 255) * 100)});
}

GhiriGori.hsv_to_hex = function(hsvColor)
{
    return GhiriGori.rgb_to_hex(GhiriGori.hsv_to_rgb(hsvColor));
}

GhiriGori.hex_to_hsv = function(hexColor)
{
    return GhiriGori.rgb_to_hsv(GhiriGori.hex_to_rgb(hexColor));
}

/**
 * Verifies the position of a point respect to a rect.
 * @param {Number} x Point x.
 * @param {Number} y Point y.
 * @param {Number} x1 X of first point of the segment.
 * @param {Number} y1 Y of first point of the segment.
 * @param {Number} x2 X of second point of the segment.
 * @param {Number} y2 y of second point of the segment.
 * @return {Number} 0 if the point is in the rect, a negative number if is under and a positive number if is over.
 */
GhiriGori.point_in_line = function(x, y, x1, y1, x2, y2)
{
    return ((y - y1) / (y2 - y1)) - ((x - x1) / (x2 - x1));
}

/**
 * Verifies if two points are in the same side respect to a rect.
 * @param {Number} p1X First point x.
 * @param {Number} p1Y First point y.
 * @param {Number} p2X Second point x.
 * @param {Number} p2Y Second point y.
 * @param {Number} x1 X of first point of the segment.
 * @param {Number} y1 Y of first point of the segment.
 * @param {Number} x2 X of second point of the segment.
 * @param {Number} y2 y of second point of the segment.
 * @return {Boolean} true if two points are in the same side or in the rect, false otherwise.
 */
GhiriGori.same_side = function(p1X, p1Y, p2X, p2Y, x1, y1, x2, y2)
{
    var tX = x2 - x1;
    var tY = y2 - y1;
    return ((tX * (p1Y - y1) - tY * (p1X - x1)) * (tX * (p2Y - y1) - tY * (p2X - x1)) >= 0) ? true : false;
}

