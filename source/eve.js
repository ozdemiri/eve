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
 * Helper class. DOM manipulations, object extensions, inheritance, memoization etc.
 */
(function (window, undefined) {
    'use strict';

    //declare eve object
    var eve = function (selector) {
        /// <summary>
        /// Gets DOM element as eve element.
        /// </summary>
        /// <param name="selector" type="string">Represents the selector.</param>
        /// <returns type="eveElement"></returns>
        if (selector === null) return null;
        if (eve.getType(selector) === 'string') {
            //get selector phrase
            var selectorPhrase = selector.substring(0, 1);

            //check whether the selector phrase is id
            if (selectorPhrase === '#') {
                //get all elements matches with the query
                var elements = document.getElementById(selector.substring(1));

                //return eveElement from matched elements
                if (elements === null) return null; else return new eveElement(elements);
            }

            //check whether the browser supports querySelector
            if (document.querySelectorAll) {
                //get all elements matches with the query
                var elements = document.querySelectorAll(selector);

                //return eveElement from matched elements
                if (elements.length === 0) return null; else return new eveElement(elements);
            } else {
                switch (selectorPhrase) {
                    case '.':
                        {
                            //get all elements matches with the query
                            var elements = document.getElementsByClassName(selector.substring(1));

                            //return eveElement from matched elements
                            if (elements.length === 0) return null; else return new eveElement(elements);
                        }
                        break;
                    case ':':
                        {
                            //get all elements matches with the query
                            var elements = document.getElementsByTagName(selector.substring(1));

                            //return eveElement from matched elements
                            if (elements.length === 0) return null; else return new eveElement(elements);
                        }
                        break;
                    default:
                        {
                            //get all elements matches with the query
                            var elements = document.getElementById(selector);

                            //return eveElement from matched elements
                            if (elements === null) return null; else return new eveElement(elements);
                        }
                        break;
                }
            }
        } else {
            //check whether the current selector is an eveElement
            if (selector['_eveElement'] !== undefined)
                return selector;
            else
                return new eveElement(selector);
        }
    };

    //Gets browser information.
    eve.browser = {
        isIE: false || !!document.documentMode,
        timeZone: new Date().getTimezoneOffset() * -1 / 60,
        supportsLocalStorage: 'localStorage' in window && window['localStorage'] !== null,
        supportsSessionStorage: 'sessionStorage' in window && window['sessionStorage'] !== null
    };

    //Gets element type
    eve.getType = function (obj) {
        /// <summary>
        /// Gets element type.
        /// </summary>
        /// <param name="obj"></param>
        /// <returns type="string">
        /// Possible values are; array, string, number, bool, nullOrEmpty, function, dateTime, object, htmlElement, nodeList, eveElement
        /// </returns>
        if (obj === null || obj === undefined) returnType = 'nullOrEmpty';
        var returnType = 'nullOrEmpty';
        var objType = typeof obj;

        if (objType === 'string') {
            returnType = 'string';
        } else if (objType === 'number') {
            returnType = 'number';
        } else if (objType === 'boolean') {
            returnType = 'bool';
        } else if (objType === 'function') {
            returnType = 'function';
        } else {
            try {
                if (obj.getMonth())
                    returnType = 'dateTime';
            } catch (e) {
                if (Object.prototype.toString.call(obj) === '[object Array]') {
                    returnType = 'array';
                } else if (Object.prototype.toString.call(obj) === '[object Function]') {
                    returnType = 'function';
                } else if (Object.prototype.toString.call(obj) === '[object NodeList]') {
                    returnType = 'nodeList';
                } else if (Object.prototype.toString.call(obj) === '[object Object]') {
                    if (eve.isHTMLElement(obj)) {
                        returnType = 'htmlElement';
                    } else {
                        if (obj['_eveElement'] !== null)
                            returnType = 'eveElement';
                        else
                            returnType = 'object';
                    }
                } else {
                    if (eve.isHTMLElement(obj))
                        returnType = 'htmlElement';
                    else
                        returnType = 'nullOrEmpty';
                }
            }
        }
        return returnType;
    };

    //check whether the object is element
    eve.isHTMLElement = function (obj) {
        /// <summary>
        /// Checks whether the given object is an html element.
        /// </summary>
        /// <param name="obj"></param>
        /// <returns type="bool"></returns>
        return (typeof HTMLElement === "object" ? obj instanceof HTMLElement : obj && typeof obj === "object" && obj !== null && obj.nodeType === 1 && typeof obj.nodeName === "string");
    };

    //get browser available viewport
    eve.viewport = function () {
        /// <summary>
        /// Gets browser viewport.
        /// </summary>
        /// <returns type="object">
        /// Return object has "width" and "height" members.
        /// </returns>
        var viewportwidth, viewportheight;

        //Check the available dimension values
        if (typeof window.innerWidth !== 'undefined') {
            viewportwidth = window.innerWidth;
            viewportheight = window.innerHeight;
        } else if (typeof document.documentElement !== 'undefined' && typeof document.documentElement.clientWidth !== 'undefined' && document.documentElement.clientWidth !== 0) {
            viewportwidth = document.documentElement.clientWidth;
            viewportheight = document.documentElement.clientHeight;
        } else {
            viewportwidth = document.getElementsByTagName('body')[0].clientWidth;
            viewportheight = document.getElementsByTagName('body')[0].clientHeight;
        }

        //Return width and height as object.
        return { width: viewportwidth, height: viewportheight };
    };

    //clones object
    eve.clone = function (obj) {
        /// <summary>
        /// Clones given object.
        /// </summary>
        /// <param name="obj"></param>
        /// <returns type="object">Clonned object.</returns>

        //Check whether the given object is an array
        if (eve.getType(obj) === 'array') {
            //Clone array object
            var _arr = [];
            obj.each(function (item, index) {
                _arr.push(eve.clone(item));
            });
            return _arr;
        } else {
            //Clone static object
            var _obj = {};
            for (var key in obj) _obj[key] = obj[key];
            return _obj;
        }
    };

    //Memoize the given function
    eve.memoize = function (fn) {
        /// <summary>
        /// Memoizes the given function.
        /// </summary>
        /// <param name="fn"></param>
        /// <returns type="function"></returns>
        return function () {
            //Declare variables.
            var params = Array.prototype.slice.call(arguments), sign = '', i = params.length;

            //Set current param as null to use in loop.
            cParam = null;

            //Loop function parameters.
            while (i--) {
                //Set current param.
                cParam = params[i];

                //Define hash sign.
                sign += (cParam === Object(cParam)) ? JSON.stringify(cParam) : cParam;

                //Set memoizator.
                fn.memoize || (fn.memoize = {});
            }

            //Return the value.
            return (sign in fn.memoize) ? fn.memoize[sign] : fn.memoize[sign] = fn.apply(this, params);
        };
    };

    //Create random number
    eve.randomNumber = function (min, max) {
        /// <summary>
        /// Returns a random number between the given min and max.
        /// </summary>
        /// <param name="min"></param>
        /// <param name="max"></param>
        /// <returns type="number"></returns>
        if (min == null) min = 0;
        if (max == null) max = 1;
        if (min > max) { throw Error('Max value can not be greater than the min value!'); return 0; }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    //Create random color
    eve.randomColor = function () {
        /// <summary>
        /// Creates a random color.
        /// </summary>
        /// <returns type="string">Hex code of the randomly created color.</returns>
        var _chars = '0123456789ABCDEF'.split('');
        var _color = '#';
        for (var i = 0; i < 6; i++)
            _color += _chars[Math.floor(Math.random() * 16)];
        return _color;
    };

    //Returns days in month
    eve.daysInMonth = function (month, year) {
        /// <summary>
        /// Returns total days count for the given month and year.
        /// </summary>
        /// <param name="month"></param>
        /// <param name="year"></param>
        /// <returns type="number"></returns>
        var today = new Date();
        if (month == null) month = today.getMonth();
        if (year == null) year = today.getFullYear();
        return 32 - new Date(year, month, 32).getDate();
    };

    //Extends given object
    eve.extend = function (sub, base) {
        /// <summary>
        /// Extends given sub object with the given base object.
        /// </summary>
        /// <param name="sub"></param>
        /// <param name="base"></param>
        /// <returns type="object">Returns sub-class.</returns>
        function inheritance() { };
        inheritance.prototype = base.prototype;
        sub.prototype = new inheritance();
        sub.inherits = base;
        for (var propertyName in base) eval('sub.' + propertyName + ' = base.' + propertyName);
        return sub;
    };

    //Merges given objects
    eve.merge = function (base, source) {
        /// <summary>
        /// Merges given source object(s) with the base object.
        /// </summary>
        /// <param name="base"></param>
        /// <param name="source"></param>
        /// <returns type="object">Merged object.</returns>

        //handle errors
        if (arguments.length < 2) return false;
        if (eve.getType(base) !== 'object') return false;

        //iterate all keys in source object
        for (var p in source) {
            //check whether the source has the current prop
            if (source.hasOwnProperty(p)) {
                //check whether the source prop is an object
                if (eve.getType(source[p]) === 'object') {
                    //merge source prop with the base prop
                    base[p] = eve.merge(base[p], source[p]);
                    continue;
                }

                //set base prop as source prop
                base[p] = source[p];
            }
        }

        //iterate rest of the arguments
        for (var i = 2, alen = arguments.length; i < alen; i++)
            eve.merge(base, arguments[i]);

        //return merged object
        return base;
    };

    //Gets querystring value.
    eve.queryString = function (name) {
        /// <summary>
        /// Gets given querystring value.
        /// </summary>
        /// <param name="name"></param>
        /// <returns type="string">Querystring value.</returns>
        if (arguments.length === 0) return '';
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.search);
        if (results === null) return ""; else return decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    //Creates a DOM element.
    eve.createElement = function (tag, props) {
        /// <summary>
        /// Creates an element with the given tag and properties.
        /// </summary>
        /// <param name="tag"></param>
        /// <param name="props"></param>
        if (arguments.length === 0) return null;
        if (tag === null) return null;
        var _el = document.createElement(tag.toUpperCase());
        for (var key in props) {
            try {
                _el[key] = props[key];
            } catch (e) {
                _el.setAttribute(key, props[key]);
            }
        }
        return _el;
    };

    //Converts given base64 string into the binary array.
    eve.toBinaryArray = function (base64) {
        /// <summary>
        /// Converts given base64 string into the binary array.
        /// </summary>
        /// <param name="string">base64 string.</param>
        /// <returns type="array"></returns>

        //Declare variables
        var len = base64.length,
            buffer = new Uint8Array(len / 4 * 3 | 0),
            i = 0,
            outptr = 0,
            last = [0, 0],
            state = 0,
            save = 0,
            rank, code, undef, base64_ranks = new Uint8Array([62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, 0, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51]);

        //Iterate base64 string to set buffer
        while (len--) {
            code = base64.charCodeAt(i++);
            rank = base64_ranks[code - 43];
            if (rank !== 255 && rank !== undef) {
                last[1] = last[0];
                last[0] = code;
                save = (save << 6) | rank;
                state++;
                if (state === 4) {
                    buffer[outptr++] = save >>> 16;
                    if (last[1] !== 61) {
                        buffer[outptr++] = save >>> 8;
                    }
                    if (last[0] !== 61) {
                        buffer[outptr++] = save;
                    }
                    state = 0;
                }
            }
        }

        //Return
        return buffer;
    };

    //Converts given dataString to blob.
    eve.toBlob = function (datastring, type) {
        /// <summary>
        /// Converts given datastring into the blob.
        /// </summary>
        /// <param name="string"></param>
        /// <returns type="Blob"></returns>

        //check whether the type is null
        if (type == null) type = 'png';

        //Declare variables
        var header_end = datastring.indexOf(',') + 1,
            header = datastring.substring(0, header_end),
            data = datastring;

        //Check whether the given string is base64
        if (header.indexOf('base64') === -1) return null;

        //Convert the given string to a binary array
        data = eve.toBinaryArray(datastring.substring(header_end));

        //switch blob type
        switch (type) {
            case 'png':
                return new Blob([data], {
                    type: 'image/png'
                });
            case 'jpg':
                return new Blob([data], {
                    type: 'image/jpg'
                });
            case 'gif':
                return new Blob([data], {
                    type: 'image/gif'
                });
            case 'pdf':
                return new Blob([data], {
                    type: 'application/pdf'
                });
            default:
                return new Blob([data], {
                    type: 'image/png'
                });
        }
    };

    //Converts given value into hex.
    eve.toHex = function (value) {
        /// <summary>
        /// Converts given value into the hex value.
        /// </summary>
        /// <param name="value"></param>
        /// <returns type="string"></returns>
        var hex = value.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    //Converts rgb to hex.
    eve.rgbToHex = function () {
        /// <summary>
        /// Converts given RGB value into the hex value.
        /// </summary>
        /// <returns type="string"></returns>
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

    //Converts given hex value to rgb.
    eve.hexToRgb = function (hex) {
        /// <summary>
        /// Converts given hex value into the RGB object.
        /// </summary>
        /// <param name="hex"></param>
        /// <returns type="object">
        /// Return object has "r", "g" and "b" members.
        /// </returns>
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    //Gets gradient color.
    eve.gradient = function (startColor, endColor, percent) {
        /// <summary>
        /// Gets a gradient color for the given start and end colors with the given percent.
        /// </summary>
        /// <param name="startColor"></param>
        /// <param name="endColor"></param>
        /// <param name="percent"></param>
        /// <returns type="string">Hex color.</returns>

        //Declare needed variables
        var newColor = {};
        var color1 = eve.hexToRgb(startColor);
        var color2 = eve.hexToRgb(endColor);

        //Create channel function to inner uses.
        function channel(a, b) { return (a + Math.round((b - a) * (percent / 100))); }

        //Create color piece function to inner uses.
        function colorPiece(num) {
            num = Math.min(num, 255);   // not more than 255
            num = Math.max(num, 0);     // not less than 0
            var str = num.toString(16);
            if (str.length < 2) {
                str = "0" + str;
            }
            return (str);
        }

        //Create new color
        newColor.r = channel(color1.r, color2.r);
        newColor.g = channel(color1.g, color2.g);
        newColor.b = channel(color1.b, color2.b);
        newColor.cssColor = "#" + colorPiece(newColor.r) + colorPiece(newColor.g) + colorPiece(newColor.b);

        //Return color
        return "#" + colorPiece(newColor.r) + colorPiece(newColor.g) + colorPiece(newColor.b);
    };

    //generate uuid
    eve.createGUID = function () {
        //internal generate random chars
        function generateRandomChars() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }

        //return guid
        return generateRandomChars() + generateRandomChars() + '-' + generateRandomChars() + '-' + generateRandomChars() + '-' + generateRandomChars() + '-' + generateRandomChars() + generateRandomChars() + generateRandomChars();
    };

    //gets data type
    eve.getDataType = function (data, fieldName) {
        /// <summary>
        /// Gets type of the given field of the given data.
        /// </summary>
        /// <param name="data"></param>
        /// <param name="field"></param>

        //check whether the arguments is not empty
        if (arguments.length < 2) { throw new Error('Data and fieldName can not be found in arguments!'); return null; };

        //check type of the data
        if (eve.getType(data) !== 'array') { throw new Error('Data type mistmatch! Data should be an array...'); return null };

        //check whether the data has given fieldName
        if (data[0][fieldName] === undefined || data[0][fieldName] === null) { throw new Error('Given fieldName can not be found in data...'); return null };

        //declare return type
        var returnType = '';

        //iterate all data
        data.each(function (row, index) {
            //check whether the given data is not empty
            if (row[fieldName] !== undefined && row[fieldName] !== null)
                returnType = eve.getType(row[fieldName]);
        });

        //return type
        return returnType;
    };

    //constructor for the eve element
    function eveElement(element) {
        //null check for options
        if (element === null || element === '') return null;

        //set this element
        var _eveElements = [];

        //Iterate all elements
        if (eve.getType(element) === 'nodeList' || eve.getType(element) === 'array') {
            for (var i = 0; i <= element.length - 1; i++)
                _eveElements.push(element[i]);
        } else if (eve.getType(element) === 'eveElement') {
            _eveElements.push(element._eveElement);
        } else {
            _eveElements.push(element);
        }

        //public members
        this.reference = _eveElements.length === 1 ? _eveElements[0] : _eveElements;
    };

    //set eve element prototype methods
    eveElement.prototype = {
        //get element offset
        offset: function () {
            /// <summary>
            /// Gets element offset.
            /// </summary>
            /// <returns type="object">
            /// An object with "width", "height", "left", and "top" members.
            /// </returns>
            if (eve.getType(this.reference) === 'htmlElement') {
                if (this.reference.getBoundingClientRect) {
                    var _b = this.reference.getBoundingClientRect();
                    return { width: _b.width, height: _b.height, left: _b.left, top: _b.top };
                } else {
                    return {
                        width: this.reference['offsetWidth'] == null ? 0 : parseFloat(this.reference['offsetWidth']),
                        height: this.reference['offsetHeight'] == null ? 0 : parseFloat(this.reference['offsetHeight']),
                        left: this.reference['offsetLeft'] == null ? 0 : parseFloat(this.reference['offsetLeft']),
                        top: this.reference['offsetTop'] == null ? 0 : parseFloat(this.reference['offsetTop'])
                    };
                }
            }
        },
        attr: function (name, value) {
            /// <summary>
            /// Gets or sets element(s) attribute.
            /// </summary>
            /// <param name="name"></param>
            /// <param name="value"></param>
            /// <returns type="object">Returns this element if method used as setter.</returns>
            if (arguments.length === 0) return this;
            if (arguments.length === 1) {
                if (eve.getType(this.reference) === 'htmlElement') {
                    if (this.reference[name] !== null) {
                        return this.reference[name];
                    } else {
                        if (this.reference['attributes'] !== null) {
                            for (var _attr in this.reference['attributes']) {
                                if (parseInt(_attr) !== isNaN) {
                                    if (this.reference['attributes'][_attr].name === name)
                                        return this.reference['attributes'][_attr].value;
                                }
                            }
                        }
                    }
                }
            } else {
                if (eve.getType(this.reference) === 'htmlElement') {
                    this.reference[name] = value;
                } else {
                    this.reference.each(function (el, index) {
                        el[name] = value;
                    });
                }
                return this;
            }
        },
        removeAttr: function (name) {
            /// <summary>
            /// Removes given attribute from the element.
            /// </summary>
            /// <param name="name"></param>
            /// <returns type="object">Returns this element.</returns>
            if (arguments.length === 0) return this;
            if (eve.getType(this.reference) === 'htmlElement') {
                if (this.reference[name])
                    delete this.reference[name];
            } else {
                this.reference.each(function (el, index) {
                    if (el[name])
                        delete el[name];
                });
            }
            return this;
        },
        style: function (name, value) {
            /// <summary>
            /// Gets or sets element(s) css style.
            /// </summary>
            /// <param name="name"></param>
            /// <param name="value"></param>
            /// <returns type="object">Returns this element if method used as setter.</returns>
            if (arguments.length === 0) return this;
            if (arguments.length === 1) {
                if (eve.getType(this.reference) === 'htmlElement') {
                    //browser supports computed style?
                    if (window.getComputedStyle) {
                        return window.getComputedStyle(this.reference)[name];
                    } else {
                        //reference element's style has that name?
                        if (this.reference.style[name] != null) {
                            return this.reference.style[name];
                        }
                    }

                    //can't found the style
                    return '';
                }
            } else {
                if (eve.getType(this.reference) === 'htmlElement') {
                    if (this.reference.style[name] !== null)
                        this.reference.style[name] = value;
                } else {
                    this.reference.each(function (el, index) {
                        if (el.style[name] != null)
                            el.style[name] = value;
                    });
                }
                return this;
            }
        },
        margin: function () {
            /// <summary>
            /// Gets element's margin.
            /// </summary>
            /// <returns type="object">Returns an object that contains "left, top, bottom, right" members.</returns>
            return { left: this.style('marginLeft'), top: this.style('marginTop'), bottom: this.style('marginBottom'), right: this.style('marginRight') };
        },
        padding: function () {
            /// <summary>
            /// Gets element's padding.
            /// </summary>
            /// <returns type="object">Returns an object that contains "left, top, bottom, right" members.</returns>
            return { left: this.style('paddingLeft'), top: this.style('paddingTop'), bottom: this.style('paddingBottom'), right: this.style('paddingRight') };
        },
        parent: function () {
            /// <summary>
            /// Gets element's parent element.
            /// </summary>
            /// <returns type="eveElement"></returns>
            if (eve.getType(this.reference) === 'htmlElement') return new eveElement(this.reference.parentNode);
            return this;
        },
        children: function () {
            /// <summary>
            /// Gets child nodes of the current element.
            /// </summary>
            /// <returns type="Array"></returns>
            if (eve.getType(this.reference) === 'htmlElement') {
                var _children = [];
                if (this.reference['childNodes'] && this.reference['childNodes'].length > 0) {
                    for (var i = 0; i <= this.reference.childNodes.length - 1; i++)
                        _children.push(new eveElement(this.reference.childNodes[i]));
                }
                return _children;
            }
            return this;
        },
        value: function (value) {
            /// <summary>
            /// Gets or sets value of the current element.
            /// </summary>
            /// <param name="value" type="Object" optional="true">Represents the new value.</param>
            /// <returns type="Object"></returns>
            if (value == null) {
                if (eve.getType(this.reference) === 'htmlElement') {
                    if (this.reference['value'] !== null)
                        return this.reference['value'];
                    else
                        return '';
                }
            } else {
                if (eve.getType(this.reference) === 'htmlElement') {
                    this.reference['value'] = value;
                } else {
                    this.reference.each(function (el, index) {
                        if (el['value'] !== null)
                            el['value'] = value;
                    });
                }
                return this;
            }
        },
        html: function (html) {
            /// <summary>
            /// Gets or sets html content of the current element.
            /// </summary>
            /// <param name="html" type="string" optional="true">Represents the html content.</param>
            /// <returns type="Object"></returns>
            if (html === null) {
                if (eve.getType(this.reference) === 'htmlElement') {
                    if (this.reference['innerHTML'] !== null)
                        return this.reference['innerHTML'];
                    else
                        return '';
                }
            } else {
                if (eve.getType(this.reference) === 'htmlElement') {
                    this.reference['innerHTML'] = html;
                } else {
                    this.reference.each(function (el, index) {
                        if (el['innerHTML'] !== null)
                            el['innerHTML'] = html;
                    });
                }
                return this;
            }
        },
        append: function (element) {
            /// <summary>
            /// Appends given element into the current element.
            /// </summary>
            /// <param name="element" type="Object">Represents the element that will be append into the current element. You can set this member as; html string, html element or eElement.</param>
            if (element !== null && eve.getType(this.reference) === 'htmlElement') {
                var elementType = eve.getType(element);
                switch (elementType) {
                    case 'string':
                        {
                            //Create div element
                            var _el = document.createElement('DIV'); _el.innerHTML = element;

                            //iterate all childs in the childNodes
                            for (var i = 0; i <= _el.childNodes.length - 1; i++)
                                this.reference.appendChild(_el.childNodes[i]);

                            //remove div element
                            try { document.removeChild(_el); } catch (e) { }
                        }
                        break;
                    case 'htmlElement':
                        {
                            //add element into the reference
                            this.reference.appendChild(element);
                        }
                        break;
                    case 'eveElement':
                        {
                            //check element's reference is a html element
                            if (eve.getType(element.reference) === 'htmlElement') {
                                this.reference.appendChild(element.reference);
                            } else {
                                //iterate all child element s in the reference
                                element.reference.each(function (el, index) {
                                    this.reference.appendChild(el);
                                });
                            }
                        }
                        break;
                }
            }
            return this;
        },
        bind: function (events, eventMethod) {
            /// <summary>
            /// Adds an event listener to this element.
            /// </summary>
            /// <param name="events" type="String">Represents the events name. Use space to bind multiple events.</param>
            /// <param name="eventMethod" type="Function">Represents the event function.</param>
            var base = this;
            var eventArray = events.split(' ');
            eventArray.each(function (ev, index) {
                if (eve.getType(base.reference) === 'htmlElement') {
                    if (base.reference.addEventListener) {
                        console.log(1);
                        base.reference.addEventListener(ev, eventMethod, false);
                    } else {
                        base.reference.attachEvent("on" + ev, function () {
                            return (eventMethod.call(base.reference, window.event));
                        });
                    }
                } else {
                    base.reference.each(function (el) {
                        if (el.addEventListener) {
                            el.addEventListener(ev, eventMethod, false);
                        } else {
                            el.attachEvent("on" + ev, function () {
                                return (eventMethod.call(el, window.event));
                            });
                        }
                    });
                }
            });
            return this;
        },
        unbind: function (events, eventMethod) {
            /// <summary>
            /// Adds an event listener to this element.
            /// </summary>
            /// <param name="events" type="String">Represents the events name. Use space to unbind multiple events.</param>
            /// <param name="eventMethod" type="Function">Represents the event function.</param>
            var base = this;
            var eventArray = events.split(' ');
            eventArray.each(function (ev) {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.removeEventListener(ev, eventMethod, false);
                } else {
                    base.reference.each(function (el) {
                        el.removeEventListener(ev, eventMethod, false);
                    });
                }
            });
            return this;
        },
        addClass: function (className) {
            /// <summary>
            /// Adds given class into the current element's classses.
            /// </summary>
            /// <param name="className" type="String">Represents the class name that will be added.</param>
            if (className !== null) {
                if (eve.getType(this.reference) === 'htmlElement') {
                    if (this.reference['classList'] !== null) {
                        this.reference.classList.add(className);
                    } else {
                        this.reference.className += ' ' + className;
                    }
                } else {
                    this.reference.each(function (el, index) {
                        if (el['classList'] !== null) {
                            el.classList.add(className);
                        } else {
                            el.className += ' ' + className;
                        }
                    });
                }
            }
            return this;
        },
        removeClass: function (className) {
            /// <summary>
            /// Removes given class from the current element's classes.
            /// </summary>
            /// <param name="className" type="String">Represents the class name that will be removed.</param>
            if (className != null) {
                if (eve.getType(this.reference) === 'htmlElement') {
                    if (this.reference['classList'] !== null) {
                        this.reference.classList.remove(className);
                    } else {
                        this.reference.className = this.reference.className.replace(className, '').trim();
                    }
                } else {
                    this.reference.each(function (el, index) {
                        if (el['classList'] !== null) {
                            el.classList.remove(className);
                        } else {
                            el.className = el.className.replace(className, '').trim();
                        }
                    });
                }
            }
            return this;
        },
        hasClass: function (className) {
            /// <summary>
            /// Checks whether the current element has the given class.
            /// </summary>
            /// <param name="className" type="String">Represents the class name which will be looked up.</param>
            /// <returns type="Bool"></returns>
            if (className === null) return false;
            if (eve.getType(this.reference) === 'htmlElement') {
                return this.reference.className.indexOf(className) > -1;
            } else {
                var stateHandler = [];
                this.reference.each(function (el) {
                    stateHandler.push(el.className.indexOf(className) > -1);
                });
                return !stateHandler.contains(false);
            }
        },
        hover: function (overCallback, outCallback) {
            /// <summary>
            /// Attachs hover event to the elements.
            /// </summary>
            /// <param name="overCallback" type="Function">Represents the mouseover callback.</param>
            /// <param name="outCallback" type="Function">Represents the mouseout callback.</param>
            var base = this;
            if (overCallback !== null && outCallback !== null) {
                if (eve.getType(overCallback) === 'function' && eve.getType(outCallback) === 'function') {
                    if (eve.getType(this.reference) === 'htmlElement') {
                        base.reference.onmouseover = function (e) { overCallback.call(base.reference, e); }
                        base.reference.onmouseout = function (e) { outCallback.call(base.reference, e); }
                    } else {
                        base.reference.each(function (el, index) {
                            el.onmouseover = function (e) { overCallback.call(el, e); }
                            el.onmouseout = function (e) { outCallback.call(el, e); }
                        });
                    }
                }
            }
        },
        click: function (callback) {
            /// <summary>
            /// Attachs click event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.onclick = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.onclick = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        enter: function (callback) {
            /// <summary>
            /// Attachs onfocus event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.onfocus = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.onfocus = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        exit: function (callback) {
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.onblur = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.onblur = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        keyPress: function (callback) {
            /// <summary>
            /// Attachs keypress event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.onkeypress = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.onkeypress = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        keyDown: function (callback) {
            /// <summary>
            /// Attachs keyDown event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.onkeydown = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.onkeydown = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        keyUp: function (callback) {
            /// <summary>
            /// Attachs keyUp event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.onkeyup = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.onkeyup = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        mouseDown: function (callback) {
            /// <summary>
            /// Attachs mouseDown event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.onmousedown = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.onmousedown = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        mouseUp: function (callback) {
            /// <summary>
            /// Attachs mouseUp event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.onmouseup = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.onmouseup = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        mouseOver: function (callback) {
            /// <summary>
            /// Attachs mouseOver event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.onmouseover = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.onmouseover = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        mouseOut: function (callback) {
            /// <summary>
            /// Attachs mouseOut event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.onmouseout = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.onmouseout = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        mouseMove: function (callback) {
            /// <summary>
            /// Attachs mouseMove event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.onmousemove = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.onmousemove = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        dragStart: function (callback) {
            /// <summary>
            /// Attachs dragStart event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.ondragstart = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.ondragstart = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        dragEnd: function (callback) {
            /// <summary>
            /// Attachs dragEnd event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.ondragend = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.ondragend = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        drag: function (callback) {
            /// <summary>
            /// Attachs drag event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.ondrag = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.ondrag = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        drop: function (callback) {
            /// <summary>
            /// Attachs drop event to the current element.
            /// </summary>
            /// <param name="callback" type="Function">Represents the callback that will be fired.</param>
            var base = this;
            if (eve.getType(callback) === 'function') {
                if (eve.getType(base.reference) === 'htmlElement') {
                    base.reference.ondrop = function (e) { callback.call(base.reference, e); }
                } else {
                    base.reference.each(function (el) {
                        el.ondrop = function (e) { callback.call(el, e); }
                    });
                }
            }
        },
        pie: function (options) {
            //check whether the options is null
            if (arguments.length === 0) {
                throw new Error('Chart options are missing!');
                return null;
            }

            //check whether the data is null
            if (options['data'] === undefined || options['data'] === null) {
                throw new Error('Chart data is missing!');
                return null;
            }

            //check whether the chart data type is proper
            if (eve.getType(options.data) !== 'array') {
                throw new Error('Chart data type mistmatch! Please pass an array as chart data!');
                return null;
            }

            //check whether the series is null
            if (options['series'] === undefined || options['series'] === null) {
                throw new Error('There is not any serie in this chart!');
                return null;
            }

            //check whether the chart data type is proper
            if (eve.getType(options.series) !== 'array') {
                throw new Error('Chart series type mistmatch! Please pass an array as chart series!');
                return null;
            }

            //set options
            options['container'] = this;
            
            //return pie chart
            return eve.charts.pie(options);
        },
        donut: function (options) {
            //check whether the options is null
            if (arguments.length === 0) {
                throw new Error('Chart options are missing!');
                return null;
            }

            //check whether the data is null
            if (options['data'] === undefined || options['data'] === null) {
                throw new Error('Chart data is missing!');
                return null;
            }

            //check whether the chart data type is proper
            if (eve.getType(options.data) !== 'array') {
                throw new Error('Chart data type mistmatch! Please pass an array as chart data!');
                return null;
            }

            //check whether the series is null
            if (options['series'] === undefined || options['series'] === null) {
                throw new Error('There is not any serie in this chart!');
                return null;
            }

            //check whether the chart data type is proper
            if (eve.getType(options.series) !== 'array') {
                throw new Error('Chart series type mistmatch! Please pass an array as chart series!');
                return null;
            }

            //set options
            options['container'] = this;
            options['type'] = 'pie';
            options.series[0]['type'] = 'donut';

            //return donut chart
            return eve.charts.pie(options);
        },
        gauge: function (options) {
            //check whether the options is null
            if (arguments.length === 0) {
                throw new Error('Chart options are missing!');
                return null;
            }

            //check whether the series is null
            if (options['series'] === undefined || options['series'] === null) {
                throw new Error('There is not any serie in this chart!');
                return null;
            }

            //check whether the chart data type is proper
            if (eve.getType(options.series) !== 'array') {
                throw new Error('Chart series type mistmatch! Please pass an array as chart series!');
                return null;
            }

            //check whether the data is null
            if (options.series[0]['value'] === undefined || options.series[0]['value'] === null) {
                throw new Error('Gauge value is missing!');
                return null;
            }

            //check whether the chart data type is proper
            if (eve.getType(options.series[0]['value']) !== 'number') {
                throw new Error('Gauge value type mistmatch! Please pass a number as gauge value!');
                return null;
            }

            //set options
            options['container'] = this;
            options['type'] = 'gauge';
            options.series[0]['type'] = 'gauge';

            //return gauge chart
            return eve.charts.gauge(options);
        },
        line: function (options) {
            //check whether the options is null
            if (arguments.length === 0) {
                throw new Error('Chart options are missing!');
                return null;
            }

            //check whether the series is null
            if (options['series'] === undefined || options['series'] === null) {
                throw new Error('There is not any serie in this chart!');
                return null;
            }

            //check whether the chart data type is proper
            if (eve.getType(options.series) !== 'array') {
                throw new Error('Chart series type mistmatch! Please pass an array as chart series!');
                return null;
            }

            //set options
            options['container'] = this;
            options['type'] = 'line';

            //return line chart
            return eve.charts.line(options);
        },
        area: function (options) {
            //check whether the options is null
            if (arguments.length === 0) {
                throw new Error('Chart options are missing!');
                return null;
            }

            //check whether the series is null
            if (options['series'] === undefined || options['series'] === null) {
                throw new Error('There is not any serie in this chart!');
                return null;
            }

            //check whether the chart data type is proper
            if (eve.getType(options.series) !== 'array') {
                throw new Error('Chart series type mistmatch! Please pass an array as chart series!');
                return null;
            }

            //set options
            options['container'] = this;
            options['type'] = 'area';

            //return area chart
            return eve.charts.area(options);
        }
    };

    /*
    Extensions to improve capabilities.
    */
    if (!Array.prototype.indexOf) {
        //Adds indexof function to the array object if there is not one.
        Array.prototype.indexOf = function (searchElement, fromIndex) {
            /// <summary>Returns the first index at which a given element can be found in the array, or -1 if it is not present.</summary>
            /// <param name="searchElement" type="Object">Element to locate in array.</param>
            /// <param name="fromIndex" type="Number">The index to start the search at.</param>
            /// <returns type="Number" />
            var k, o, n, len;

            //Null check for this array
            if (this == null) return -1;

            //Create object from this array and check the length.
            o = Object(this); len = o.length >>> 0; if (len === 0) return -1;

            //Assign n for iterator
            n = +fromIndex || 0; if (Math.abs(n) === Infinity) n = 0;

            //Check iterator n if greater than the length of this array
            if (n >= len) return -1; k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            //Iterate elements.
            while (k < len) {
                //Compare the values.
                if (k in o && o[k] === searchElement) return k;
                k++;
            }

            //Return -1 if not found.
            return -1;
        };
    };

    if (!Array.prototype.contains) {
        //Adds contains function to the array object if there is not one.
        Array.prototype.contains = function (searchElement) {
            /// <summary>Checks whether the current array has the given element.</summary>
            /// <param name="searchElement" type="Object">Element to locate in array.</param>
            /// <returns type="Bool" />
            return this.indexOf(searchElement) > -1;
        };
    };

    if (!Array.prototype.each) {
        //Adds each function to the array object if there is not one.
        Array.prototype.each = function (callBack, arg) {
            /// <summary>Executes a provided function once per array element.</summary>
            /// <param name="callBack" type="Function">Function to execute for each element, taking three arguments: currentValue, index, array</param>
            /// <param name="arg" type="Object">Value to use as this when executing callback.</param>
            var t, k, o, len;

            //Null check for this array.
            if (this == null) return;

            //Type check for the callback parameter.
            if (typeof callBack !== 'function') return;

            //Create object from this array and check the length.
            o = Object(this); len = o.length >>> 0;

            //Set t as the arg if total argument count of this function greater than 1.
            if (arguments.length > 1) t = arg; k = 0;

            //Iterate elements.
            while (k < len) {
                //Declare a value variable to store current value.
                var cValue;

                //Check if k in object.
                if (k in o) {
                    //Set current value.
                    cValue = o[k];

                    //Raise callback.
                    callBack.call(t, cValue, k);
                }

                //Increase k
                k++;
            }
        };
    };

    if (!Array.prototype.map) {
        //Adds map function to the array object if there is not one.
        Array.prototype.map = function (callback, thisArg) {
            var T, A, k;

            if (this == null) {
                throw new TypeError(' this is null or not defined');
            }

            var O = Object(this);
            var len = O.length >>> 0;

            if (typeof callback !== 'function') {
                throw new TypeError(callback + ' is not a function');
            }

            if (arguments.length > 1) {
                T = thisArg;
            }

            A = new Array(len);
            k = 0;

            while (k < len) {
                var kValue, mappedValue;
                if (k in O) {
                    kValue = O[k];
                    mappedValue = callback.call(T, kValue, k, O);
                    A[k] = mappedValue;
                }
                k++;
            }

            return A;
        };
    }

    if (!Array.prototype.max) {
        //Adds max function to the array object if there is not one.
        Array.prototype.max = function () {
            return Math.max.apply(null, this);
        };
    }

    if (!Array.prototype.min) {
        //Adds min function to the array object if there is not one.
        Array.prototype.min = function () {
            return Math.min.apply(null, this);
        };
    }

    if (!String.prototype.trim) {
        //Adds trim function to the string object if there is not one.
        String.prototype.trim = function () {
            /// <summary>Trims spaces on the both side of the string.</summary>
            /// <returns type="String" />
            return this.replace(/^\s+|\s+$/g, '');
        };
    };

    //Adds replaceall function to the string object.
    String.prototype.replaceAll = function (term, replacement) {
        /// <summary>Replaces each replacement strings with the set of matched term.</summary>
        /// <param name="term" type="String">Term to be searched in the current string.</param>
        /// <param name="replacement" type="String">String that will be replaced with the founded terms.</param>
        /// <returns type="String" />
        return this.replace(new RegExp(term, 'g'), replacement);
    };

    //Adds stripHTML function to the string object.
    String.prototype.stripHTML = function () {
        /// <summary>Strips HTML tags from the string.</summary>
        /// <returns type="String" />
        return this.replace(/(<([^>]+)>)/ig, '');
    };

    //Adds start with function to the string object.
    String.prototype.startsWith = function (val) {
        /// <summary>
        /// Checks whether the string starts with the given string.
        /// </summary>
        /// <param name="val" type="String">Represents the string to be compared.</param>
        /// <returns type="Bool"></returns>
        var _len = val.toString().length;
        var _str = this.substring(0, _len);
        return _str == val;
    };

    //Adds ends with function to the string object.
    String.prototype.endsWith = function (val) {
        /// <summary>
        /// Checks whether the string ends with the given string.
        /// </summary>
        /// <param name="val" type="String">Represents the string to be compared.</param>
        /// <returns type="Bool"></returns>
        var _start = this.length - val.length;
        var _str = this.substring(_start);
        return _str == val;
    };

    //Adds diff function to the date object.
    Date.prototype.diff = function (date) {
        /// <summary>Gets day difference between the current date and the given date.</summary>
        /// <param name="date" type="DateTime">Date value which will be compared with the current date.</param>
        /// <returns type="Number" />
        return (this.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    };

    //Adds addHours function to the date object.
    Date.prototype.addHours = function (hours) {
        /// <summary>Adds given hours to the current date.</summary>
        /// <param name="hours" type="Integer">The amount of hours to be added.</param>
        /// <returns type="Date" />
        return this.setHours(this.getHours() + hours);;
    };

    //Adds group function to the number object.
    Number.prototype.group = function (decimalSeperator, thousandsSeperator, decimalCount) {
        //Set default values
        if (decimalSeperator === null) decimalSeperator = '.';
        if (thousandsSeperator === null) thousandsSeperator = ',';
        if (decimalCount === null) decimalCount = 2;

        //Handle type errors
        if (eve.getType(decimalCount) !== 'number') decimalCount = 2;
        if (eve.getType(decimalSeperator) !== 'string') decimalSeperator = '.';
        if (eve.getType(thousandsSeperator) !== 'string') thousandsSeperator = ',';

        //Declare variables
        var _val = decimalCount < 0 ? this : this.toFixed(decimalCount),
            _valS = _val.toString(),
            _v = _valS.split('.'),
            _v1 = _v[0],
            _v2 = _v.length > 1 ? decimalSeperator + _v[1] : '',
            _rgx = /(\d+)(\d{3})/;

        //Iterate reg test.
        while (_rgx.test(_v1)) {
            //Set x1
            _v1 = _v1.replace(_rgx, '$1' + thousandsSeperator + '$2');
        }

        //Return grouped value
        return _v1 + _v2;
    };

    //bind eve into window
    window.eve = eve;
})(window);