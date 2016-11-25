/*!
 * eve.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Helper class.
 * 
 * Available Visualization Types:
 * abacus, area, bar, bubble, bullet, bump, calendarmap, chord, column, donut, funnel, line, map, ohlc, pie, 
 * pyramid, radar, scatter, waterfall  
 */
(function() {
    //declare needed variables
    var eve = {
        base: {},
        colors: ['#83AA30', '#1499D3', '#4D6684', '#3D3D3D', '#B9340B', '#CEA45C', '#C5BE8B', '#498379', '#3F261C', '#E74700', '#F1E68F', '#FF976F', '#FF6464', '#554939', '#706C4D', '#9C651E', '#506B0B', '#1A6B4D', '#0D8074', '#208291', '#0F92A6']
    };

    //set default options for chart axis
    eve.base.axisDefaults = {
        alpha: 1,
        color: '#999999',
        gridLineColor: '#aaaaaa',
        gridLineThickness: 0.5,
        gridLineAlpha: 0.5,
        labelAngle: 0,
        labelFontColor: '#999999',
        labelFontFamily: 'Tahoma',
        labelFontSize: 10,
        labelFontStyle: 'normal',
        labelFormat: '',
        logarithmic: false,
        startsFromZero: false,
        locked: false,
        min: null,
        max: null,
        tickCount: 'auto',
        title: '',
        titleFontColor: '#666666',
        titleFontFamily: 'Tahoma',
        titleFontSize: 11,
        titleFontStyle: 'bold',
        thickness: 1,
        enabled: true,
        stacked: true,
        position: 'left', //left, right, top, bottom
        stackType: 'normal' //normal, full
    };

    //set default options for chart tooltip
    eve.base.tooltipDefaults = {
        backColor: '#ffffff',
        borderColor: '#61c9f6',
        borderRadius: 3,
        borderSize: 1,
        borderStyle: 'solid',
        enabled: true,
        fontColor: '#333333',
        fontFamily: 'Tahoma',
        fontSize: 12,
        fontStyle: 'normal',
        format: '',
        opacity: 0.9,
        padding: 10,
    };

    //set default options for chart legend
    eve.base.legendDefaults = {
        enabled: true,
        type: 'default', //default, ranged, gradient, scaled
        secondaryType: '', //'', default, ranged, gradient 
        fontColor: '#333333',
        fontFamily: 'Tahoma',
        fontSize: 12,
        fontStyle: 'normal',
        icon: 'square',
        iconColor: '',
        position: 'right',
        circleCount: 3,
        legendColors:[],
        rangeList: [],
        gradientStopCount: 'auto',
        gradientColors: [],
        numberFormat: ''
    };

    //set default options for chart
    eve.base.defaults = {
        animation: {
            duration: 500,
            delay: 10,
            easing: 'linear'
        },
        tooltip: eve.base.tooltipDefaults,
        backColor: '#ffffff',
        border: {
            color: 'transparent',
            size: 0,
            style: 'solid'
        },
        margin: {
            left: 5,
            top: 5,
            right: 5,
            bottom: 5
        },
        container: null,
        data: null,
        currTransform: null,
        legend: eve.base.legendDefaults,
        series: [],
        title: {
            content: '',
            fontColor: '#333333',
            fontFamily: 'Tahoma',
            fontSize: 13,
            fontStyle: 'normal',
            position: 'topCenter'
        },
        width: 'auto',
        height: 'auto',
        trends: [],
        xField: '',
        xAxis: eve.base.axisDefaults,
        yAxis: eve.base.axisDefaults,
        zoomable: false,
        onLoaded: function() {},
        onLegendClick: function() {},
        onSliceClick: function() {},
        onBeforeZoom: function() {},
        onAfterZoom: function() {}
    };

    //set default options for a chart serie
    eve.base.serieDefaults = {
        alpha: 0.8,
        alphaField: '',
        behavior: 'linear', //linear, spLine, stepLine
        backColor: '#efefef',
        borderColor: '#cdcdcd',
        bullet: 'none',
        bulletAlpha: 0.9,
        bulletColor: '',
        bulletSize: 8,
        bulletStrokeAlpha: 1,
        bulletStrokeThickness: 1,
        closeField: '',
        colField: '',
        color: '',
        colorField: '',
        dateField: '',
        direction: 'linear', //linear, radial
        drawingStyle: 'solid', //solid, dashed, dotted
        endField: '',
        expression: 'none',
        fontFamily: 'Impact',
        groupField: '',
        grouped: false,
        handleColor: '#999999',
        highField: '',
        isSparkline: false,
        labelField: '',
        labelFontColor: '#333333',
        labelFontFamily: 'Tahoma',
        labelFontSize: 'auto',
        labelFontStyle: 'normal',
        labelFormat: '',
        labelPosition: 'auto', //auto, inside, outside
        latField: '',
        longField: '',
        lowField: '',
        lineAlpha: 1,
        lineMeasures: false,
        lineThickness: 1.5,
        linkDistance: 0,
        majorTicks: 5,
        mapLayers: ['boundaries', 'landuse', 'roads', 'water'],
        marker: 0,
        markerField: '',
        markerFormat: '{{title}}: {{marker}}',
        maxBulletSize: 30,
        maxFontSize: 50,
        maxRange: null,
        measureField: '',
        minBulletSize: 5,
        minFontSize: 12,
        minorTicks: 5,
        minRange: null,
        neckHeight: 25,
        negativeColor: '#E21020',
        openField: '',
        orderMode: 'name', //name, frequency, custom
        parentField: '',
        rangeField: '',
        rowField: '',
        segmentLineAlpha: 1,
        segmentLineColor: '#cccccc',
        segmentLineThickness: 1,
        showBullets: true,
        sliceHoverAlpha: 1,
        sliceStrokeAlpha: 0.1,
        sliceStrokeColor: '',
        sliceStrokeThickness: 0,
        sizeField: '',
        sourceField: '',
        spriteAngle: 'none',
        startField: '',
        tileType: 'squarify', //squarify, binary, dice, slice, slicedice, resquarify
        title: '',
        titleColor: '#666666',
        titleField: '',
        type: 'column',
        valueField: '',
        xField: '',
        yField: '',
        rangeColor: '#cccccc',
        markerColor: '#000000',
        markerWidth: 5,
        tileIcon: 'circle', //square, hexagonal, circle
        linkShapes: false,
        hideEmptyShapes: false
    };

    //set map directory
    eve.mapDirectory = '/libraries/eve/'; //default '../dist/' '/libraries/eve/'

    //expose day names
    eve.days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    //expose minday names
    eve.daysMin = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    //expose month names
    eve.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    //expose min moonth names
    eve.monthsMin = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    //gets object type
    eve.getType = function(obj) {
        var objType = typeof obj,
            returnType = 'null';

        if(obj === null) return 'null';
        if(obj === undefined) return 'undefined';

        switch(objType) {
            case 'string':
            case 'number':
            case 'boolean':
            case 'function':
                returnType = objType;
                break;
            default:
                {
                    //check whether the object has getMonth member
                    if(typeof obj.getMonth === 'undefined') {
                        if(Object.prototype.toString.call(obj) === '[object Array]')
                            returnType = 'array';
                        else if(Object.prototype.toString.call(obj) === '[object Function]')
                            returnType = 'function';
                        else if(Object.prototype.toString.call(obj) === '[object NodeList]')
                            returnType = 'nodeList';
                        else if(Object.prototype.toString.call(obj) === '[object Object]') {
                            returnType = 'object';
                        } else {
                            var isHTMLElement = (typeof HTMLElement === "object" ? obj instanceof HTMLElement : obj && typeof obj === "object" && obj !== null && obj.nodeType === 1 && typeof obj.nodeName === "string");
                            if(isHTMLElement)
                                returnType = 'htmlElement';
                            else
                                returnType = 'wtf';
                        }
                    } else {
                        returnType = 'date';
                    }
                }
                break;
        }

        return returnType;
    };

    //sets eve charts colors
    eve.setColors = function() {
        //check whether the colors is not empty
        if(arguments.length === 0) return;

        //get type of the argument
      	var colors = arguments[0],
            argType = eve.getType(colors);

        //check argument type
        if(argType === 'string') {
            //check whether the argument contains ; or ,
            if(colors.indexOf(';') > -1) {
                eve.colors = colors.split(';');
            } else if(colors.indexOf(',') > -1) {
                eve.colors = colors.split(',');
            }
        } else if(argType === 'array') {
            //set colors
            eve.colors = colors;
        }
    };

    //converts given value into hex.
    eve.toHex = function (value) {
        var hex = value.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    //converts rgb to hex.
    eve.rgbToHex = function () {
        if (arguments.length === 1) {
            if (arguments.toString().indexOf('#') > -1) {
                return arguments[0];
            } else {
                var _arg = arguments[0].toString().replace('rgb(', '').replace(')', '');
                var _rgb = _arg.split(',');
                return '#' + eve.toHex(parseInt(_rgb[0])) + eve.toHex(parseInt(_rgb[1])) + eve.toHex(parseInt(_rgb[2]));
            }
        } else if (arguments.length === 3) {
            return '#' + eve.toHex(parseInt(arguments[0])) + eve.toHex(parseInt(arguments[1])) + eve.toHex(parseInt(arguments[2]));
        } else {
            return '#0066CC';
        }
    };

    //converts given hex value to rgb.
    eve.hexToRgb = function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    //gets gradient color.
    eve.gradient = function (gradientColors, percent) {
        //Declare needed variables
        var colorScale = d3.scaleLinear().domain([0,100]).range(gradientColors);
        return colorScale(percent);
    };

    //generates a random integer
    eve.randInt = function() {
      	//declare variables
      	var min = 0, max = 1;
      
      	//check arguments length
        if(arguments.length === 2) {
        	min = arguments[0];
          max = arguments[1];
        }
      
        if(min >= max) {
            throw Error('Max argument should be greater than min argument!');
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    //generates random decimal
    eve.randDecimal = function (min, max, fixed) {
        return (Math.random() * (max - min) + min).toFixed(fixed) * 1;
    };

    //generates a random color
    eve.randColor = function() {
        var chars = '0123456789ABCDEF'.split(''),
            color = '#';

        for(var i=0; i<6; i++)
            color += chars[Math.floor(Math.random() * 16)];

        return color;
    };

    //clones given object
    eve.clone = function(obj) {
        //create a copy variable
        var copy;
        
        // Handle the 3 simple types, and null or undefined
        if (!obj || "object" !== typeof obj) return obj;
        
        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        
        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = eve.clone(obj[i]);
            }
            return copy;
        }
        
        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = eve.clone(obj[attr]);
            }
            return copy;
        }
        
        throw new Error("Unable to copy obj! Its type isn't supported.");
    };

    //checks whether the given number is a prime number
    eve.isPrime = function(num) {
        if(isNaN(num) || !isFinite(num) || num % 1 || num < 2) return false;
        if(num % 2 === 0) return (num == 2);

        var r = Math.sqrt(num);
        for(var i=3; i<=r; i+=2)
            if(num % i === 0)
                return false;

        return true;
    };

    //gets prime factors of the given number
    eve.getPrimeFactors = function(num) {
        if(isNaN(num) || !isFinite(num)) return [];

        var r = Math.sqrt(num),
            res = arguments[1] || [],
            x = 2;

        if(num % x) {
            x = 3;
            while((num % x) && ((x = x + 2) < r)) {}
        }

        x = (x <= r) ? x : num;
        res.push(x);

        return (x === num) ? res : eve.getPrimeFactors(num / x, res);
    };

    //extends given sub class with the given base class
    eve.extend = function(sub, base) {
        function extended() {}
        
        extended.prototype = base.prototype;

        if(eve.getType(sub) === 'function' && eve.getType(base) === 'function') {
            for(var key1 in base) {
                eval('sub.' + key1 + ' = base.' + key1);
            }
            return sub;
        } else if(eve.getType(sub) === 'object' && eve.getType(base) === 'object') {
            for(var key2 in base) {
                var baseType = eve.getType(base[key2]);
                if(baseType === 'object') {
                    if(sub[key2])
                        eve.extend(sub[key2], base[key2]);
                    else
                        sub[key2] = base[key2];
                } else {
                    if(sub[key2] === undefined)
                        sub[key2] = base[key2];
                }
            }
            return sub;
        }
    };

    //gets querystring value
    eve.queryString = function(name) {
        if (arguments.length === 0) return '';
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");

        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            res = regex.exec(window.location.search);

        if(res === null)
            return '';
        else
            return decodeURIComponent(res[1].replace(/\+/g, ' '));
    };

    //checks whether the all values in the array is identical
    eve.isIdentical = function(arr) {
        for(var i = 0; i < arr.length - 1; i++) {
            if(arr[i] !== arr[i+1])
                return false;
        }
        return true;
    };

    //gets html element's offset
    eve.offset = function(el) {
        var offset = { width: 0, height: 0, left: 0, top: 0 };

        if(!el) return offset;
        if(eve.getType(el) !== 'htmlElement') return offset;

        var compStyle = getComputedStyle(el, null),
            borderLeft = parseInt(compStyle.getPropertyValue('border-left-width')),
            borderRight = parseInt(compStyle.getPropertyValue('border-right-width')),
            borderTop = parseInt(compStyle.getPropertyValue('border-top-width')),
            borderBottom = parseInt(compStyle.getPropertyValue('border-bottom-width'));

        if(el.getBoundingClientRect) {
            var bcr = el.getBoundingClientRect();
            offset.width = bcr.width - borderLeft - borderRight;
            offset.height = bcr.height - borderTop - borderBottom;
            offset.left = bcr.left;
            offset.top = bcr.top;
        } else {
            offset.width = el.offsetWidth ? 0 : parseFloat(el.offsetWidth) - borderLeft - borderRight;
            offset.height = el.offsetHeight ? 0 : parseFloat(el.offsetHeight) - borderTop - borderBottom;
            offset.left = el.offsetLeft ? 0 : parseFloat(el.offsetLeft);
            offset.top = el.offsetTop ? 0 : parseFloat(el.offsetTop);
        }

        return offset;
    };

    //filters numeric array
    eve.filterNumeric = function (arr, property, value) {
        return arr.filter(function (a) {
            if (!a[property] || !value)
                return false;
            else
                return a[property] == value;
        });
    };

    //filters array
    eve.filter = function (arr, property, value) {
        return arr.filter(function (a) {
            if (!a[property] || !value)
                return false;
            else
                return a[property].toUpperCase() == value.toUpperCase();
        });
    };

    //gets color for ranged legends.
    eve.matchRange = function (value, legendItems, key) {
        for (i = 0; i < legendItems.length; i++) {
            var l = legendItems[i];
            if (value >= l.minValue && value <= l.maxValue) {
                return l[key];
            }
        }
    };

    //gets color for grouped legends.
    eve.matchGroup = function (value, legendItems, key) {
        for (i = 0; i < legendItems.length; i++) {
            var l = legendItems[i];
            if (value == l.value) {
                return l[key];
            }
        }
    };

    //gets unique values in array of objects
    eve.getUniqueValues = function(data, prop) {
        //get unique values from data using underscore
        return _.uniq(_.map(data, function(d) {
            return d[prop];
        }));
    };

    //helper function for detecting MS browsers
    eve.detectIE = function () {
        var ua = window.navigator.userAgent;

        var msie = ua.indexOf('MSIE ');
        if (msie > 0) {
            // IE 10 or older => return true
            return true;
        }

        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
            // IE 11 => return true
            return true;
        }

        var edge = ua.indexOf('Edge/');
        if (edge > 0) {
            // Edge (IE 12+) => return version number
            return true;
        }

        // other browser
        return false;
    }

    //adds replaceall function to the string object.
    String.prototype.replaceAll = function (term, replacement) {
        return this.replace(new RegExp(term, 'g'), replacement);
    };

    //adds diff function to the date object.
    Date.prototype.diff = function (date) {
        return (this.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    };

    //adds addHours function to the date object.
    Date.prototype.addHours = function (hours) {
        return this.setHours(this.getHours() + hours);
    };

    //extend string to handle d3 symbols
    String.prototype.toSymbol = function () {
        var symbolType = d3.symbolSquare;
        switch (this) {
            case 'circle':
                symbolType = d3.symbolCircle;
                break;
            case 'cross':
                symbolType = d3.symbolCross;
                break;
            case 'diamond':
                symbolType = d3.symbolDiamond;
                break;
            case 'star':
                symbolType = d3.symbolStar;
                break;
            case 'triangle':
                symbolType = d3.symbolTriangle;
                break;
            case 'wye':
                symbolType = d3.symbolWye;
                break;
        }
        return symbolType;
    };

    //extend string to handle d3 tile types
    String.prototype.toTileType = function () {
        var tileType = d3.treemapSquarify;
        //squarify, binary, dice, slice, slicedice, resquarify
        switch (this.toString().toLowerCase()) {
            case 'binary':
                tileType = d3.treemapBinary;
                break;
            case 'dice':
                tileType = d3.treemapDice;
                break;
            case 'slice':
                tileType = d3.treemapSlice;
                break;
            case 'slicedice':
                tileType = d3.treemapSliceDice;
                break;
            case 'resquarify':
                tileType = d3.treemapResquarify;
                break;
        }
        return tileType;
    }

    //extend string to handle d3 easing
    String.prototype.toEasing = function () {
        return d3["ease" + this.toString()[0].toUpperCase() + this.toString().slice(1)] || d3.easeLinearIn;
    };

    //amd loader, nodejs or browser check
    if(typeof amd !== 'undefined') {
        //define eve
        define(function() {
            return eve;
        });
    } else if(typeof module === 'object' && module.exports) {
        //export eve as node module
        module.exports = eve;
    } else {
        //bind eve into window
        window.eve = eve;
    }
}).call(this);