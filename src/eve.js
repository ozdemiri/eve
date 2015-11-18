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
 */
(function() {
    //declare eve method
    var eve = {
        isIE: false || !!document.documentMode,
        colors: ['#83AA30', '#1499D3', '#4D6684', '#3D3D3D', '#B9340B', '#CEA45C', '#C5BE8B', '#498379', '#3F261C', '#E74700', '#F1E68F', '#FF976F', '#FF6464', '#554939', '#706C4D']
    };

    //loads localization settings
    eve.setLocale = function(locale) {
        //set eve localizaiton
        d3.json('locales/' + locale + '.json', function() {
            //set eve locale
            eve.consts = arguments[1];
        })
    };

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

    //generates a random integer
    eve.randInt = function(min, max) {
        if(min == null) min = 0;
        if(max == null) max = 1;
        if(min >= max) {
            throw Error('Max argument should be greater than min argument!')
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
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
        var type = eve.getType(obj),
            result;

        if(type === 'array') {
            result = [];
            obj.forEach(function(a) {
                result.push(eve.clone(a));
            });
        } else if(type === 'object'){
            result = {};
            for(var key in obj) {
                result[key] = obj[key];
            }
        } else {
            result = obj;
        }

        return result;
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
        function extended() {};
        extended.prototype = base.prototype;

        if(eve.getType(sub) === 'function' && eve.getType(base) === 'function') {
            for(var key in base)
                eval('sub.' + key + ' = base.' + key);

            return sub;
        } else if(eve.getType(sub) === 'object' && eve.getType(base) === 'object') {
            for(var key in base) {
                var baseType = eve.getType(base[key]);
                if(baseType === 'object') {
                    if(sub[key])
                        eve.extend(sub[key], base[key]);
                    else
                        sub[key] = base[key];
                } else {
                    if(sub[key] == null)
                        sub[key] = base[key];
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

    //gets html element's offset
    eve.offset = function(el) {
        var offset = { width: 0, height: 0, left: 0, top: 0 };

        if(el == null) return offset;
        if(eve.getType(el) !== 'htmlElement') return offset;

        if(el.getBoundingClientRect) {
            var bcr = el.getBoundingClientRect();
            offset.width = bcr.width;
            offset.height = bcr.height;
            offset.left = bcr.left;
            offset.top = bcr.top;
        } else {
            offset.width = el['offsetWidth'] == null ? 0 : parseFloat(el['offsetWidth']);
            offset.height = el['offsetHeight'] == null ? 0 : parseFloat(el['offsetHeight']);
            offset.left = el['offsetLeft'] == null ? 0 : parseFloat(el['offsetLeft']);
            offset.top = el['offsetTop'] == null ? 0 : parseFloat(el['offsetTop']);
        }

        return offset;
    };

    //appends given element into the element
    eve.appendHTML = function(reference, html) {
        if(reference == null) return;
        if(html == null) return;
        if(eve.getType(html) !== 'string') return;

        var refType = eve.getType(reference),
            ref = reference,
            dummy = null;

        if(refType !== 'string' && refType !== 'htmlElement') return;
        if(refType === 'string') {
            ref = document.getElementById(reference);
            if(ref == null) return;
        }

        dummy = document.createElement('div');
        dummy.innerHTML = html;

        for(var i=0; i<dummy.childNodes.length; i++)
            ref.appendChild(dummy.childNodes[i]);

        try {
            document.removeChild(dummy);
        } catch(e) {

        }
    };

    //set default locale
    eve.setLocale('en');

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
        return this.setHours(this.getHours() + hours);;
    };

    //adds max function to the array object if there is not one.
    if (!Array.prototype.max) {
        Array.prototype.max = function () {
            return Math.max.apply(null, this);
        };
    }

    //adds min function to the array object if there is not one.
    if (!Array.prototype.min) {
        Array.prototype.min = function () {
            return Math.min.apply(null, this);
        };
    }

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
