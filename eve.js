/*!
 * eve charts
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * EVE Chart library classes.
 */
 (function() {
    //declare eve method
    var eve = {
        colors: ['#83AA30', '#1499D3', '#4D6684', '#3D3D3D', '#B9340B', '#CEA45C', '#C5BE8B', '#498379', '#3F261C', '#E74700', '#F1E68F', '#FF976F', '#FF6464', '#554939', '#706C4D']
    };

    //loads localization settings
    eve.setLocale = function(locale) {
        //set locale path
        var localePath = 'locales/' + locale + '.json';

        //check if directly localization name used
        if(locale.indexOf('.json') == -1)
            localePath = locale;

        //set eve localizaiton
        d3.json(localePath, function() {
            //set eve locale
            eve.consts = arguments[1];
        })
    };

    //sets eve charts colors
    eve.setColors = function(colors) {
        //set colors
        eve.colors = colors;
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
    //eve.setLocale('en');

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
(function(e) {
    //default chart properties
    var defaults = {
        animationDuration: 500,
        balloon: {
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
            opacity: .9,
            padding: 10,
            dateFormat: '',
            numberFormat: ''
        },
        backColor: '#ffffff',
        container: null,
        data: null,
        legend: {
            enabled: true,
            fontColor: '#333333',
            fontFamily: 'Tahoma',
            fontSize: 12,
            fontStyle: 'normal',
            icon: 'square',
            position: 'right'
        },
        series: [],
        title: {
            text: '',
            fontColor: '#333333',
            fontFamily: 'Tahoma',
            fontSize: 13,
            fontStyle: 'bold',
        },
        trends: [],
        width: 'auto',
        height: 'auto',
        xField: '',
        xAxis: {
            alpha: 1,
            color: '#cccccc',
            gridLineColor: '#cccccc',
            gridLineThickness: .5,
            gridLineAlpha: .5,
            labelAngle: 0,
            labelFontColor: '#999999',
            labelFontFamily: 'Tahoma',
            labelFontSize: 10,
            labelFontStyle: 'normal',
            labelFormat: '',
            startsFromZero: true,
            tickCount: 10,
            title: '',
            titleFontColor: '#666666',
            titleFontFamily: 'Tahoma',
            titleFontSize: 11,
            titleFontStyle: 'bold',
            thickness: 1
        },
        yAxis: {
            alpha: 1,
            color: '#cccccc',
            gridLineColor: '#cccccc',
            gridLineThickness: .5,
            gridLineAlpha: .5,
            labelAngle: 0,
            labelFontColor: '#999999',
            labelFontFamily: 'Tahoma',
            labelFontSize: 10,
            labelFontStyle: 'normal',
            labelFormat: '',
            startsFromZero: true,
            tickCount: 10,
            title: '',
            titleFontColor: '#666666',
            titleFontFamily: 'Tahoma',
            titleFontSize: 11,
            titleFontStyle: 'bold',
            thickness: 1,
            stacked: true
        },
        zoomable: false
    };

    //define chart base class
    function chart(options, type) {
        //declare members
        var members = options ? e.extend(options, defaults) : defaults,
            that = this,
            offset = null,
            parent = null,
            balloon = null,
            element = members.container;

        //set this members
        for(var key in members)
            that[key] = members[key];

        //handle container error
        if(that.container == null || that.container == '') {
            throw Error('Chart container could not found!');
        }

        //handle data error
        if(that.data == null) {
            throw new Error('Could not found chart data!');
        }

        //check if element is string
        if(e.getType(element) === 'string')
            element = document.getElementById(element);

        //clear element content
        element.innerHTML = '';
        
        //get element parent node
        parent = element.parentNode;
        offset = e.offset(parent);

        //set width
        if(that.width === 'auto')
            that.width = offset.width;

        //set height
        if(that.height === 'auto')
            that.height = offset.height;

        //set aspect ratio
        that.aspectRatio = that.width / that.height;

        //check whehter the balloon is enabled
        if(that.balloon.enabled) {
            //create balloon element
            eve.appendHTML(document.body, '<div id="' + that.container + '_balloon" style="position: absolute; display: none; z-index: 1000; box-shadow: 0 3px 6px rgba(0, 0, 0, .15)"></div>');

            //set balloon
            balloon = document.getElementById(that.container + '_balloon');
            balloon.style['backgroundColor'] = that.balloon.backColor;
            balloon.style['borderStyle'] = that.balloon.borderStyle;
            balloon.style['borderColor'] = that.balloon.borderColor;
            balloon.style['borderRadius'] = that.balloon.borderRadius + 'px';
            balloon.style['borderWidth'] = that.balloon.borderSize + 'px';
            balloon.style['color'] = that.balloon.fontColor;
            balloon.style['fontFamily'] = that.balloon.fontFamily;
            balloon.style['fontSize'] = that.balloon.fontSize + 'px';
            balloon.style['paddingLeft'] = that.balloon.padding + 'px';
            balloon.style['paddingTop'] = that.balloon.padding + 'px';
            balloon.style['paddingRight'] = that.balloon.padding + 'px';
            balloon.style['paddingBottom'] = that.balloon.padding + 'px';
            if (that.balloon.fontStyle == 'bold')
                balloon.style['fontWeight'] = 'bold';
            else
                balloon.style['fontStyle'] = that.balloon.fontStyle;
        }

        //create canvas
        that.svg = d3.select(element)
            .append('svg')
            .attr('id', that.container + '_svg')
            .attr('viewBox', '0 0 ' + that.width + ' ' + that.height)
            .attr('preserveAspectRatio', 'xMidYMid')
            .attr('width', that.width)
            .attr('height', that.height)
            .attr('fill', that.backColor)
            .append('g');

        //append rect
        if(chart.zoomable) {
            that.svg.append('rect')
                .attr('fill', that.backColor)
                .attr('width', that.width)
                .attr('height', that.height);
        }

        //shows balloon
        that.showBalloon = function(content, x, y) {
            if(content == null) return;
            if(e.getType(content) !== 'string')
                content = content.toString();

            //set x,y position
            if(x == null) x = parseInt(d3.event.pageX + 5);
            if(y == null) y = parseInt(d3.event.pageY + 5);

            if(that.balloon.enabled && balloon != null) {
                balloon.innerHTML = content;
                balloon.style['left'] = x + 'px';
                balloon.style['top'] = y + 'px';
                balloon.style['display'] = 'block';
            }
        };

        //hides balloon
        that.hideBalloon = function() {
            if(that.balloon.enabled && balloon != null)
                balloon.style['display'] = 'none';
        };

        //gets formatted content for sliced charts
        that.getSlicedFormat = function(dataIndex, serie, section) {
            var content = '',
                currentData = that.data[dataIndex],
                totalValue = d3.sum(that.data, function(d) { return d[serie.valueField]; }),
                currentValue = currentData[serie.valueField] == null ? 0 : currentData[serie.valueField],
                percentValue = (currentValue / totalValue * 100).toFixed(2),
                formatter = d3.format();

            //check section
            if(section == null)
                section = 'balloon';

            //switch section
            switch(section) {
                case 'label':
                    {
                        //check serie number format
                        if(serie.numberFormat !== '')
                            formatter = d3.format(serie.numberFormat);

                        //set content
                        content = serie.labelFormat;
                    }
                    break;
                case 'balloon':
                    {
                        //check serie number format
                        if(that.balloon.numberFormat !== '')
                            formatter = d3.format(that.balloon.numberFormat);

                        //set content
                        content = that.balloon.format;
                    }
                    break;
            }

            //replace title
            if(serie.titleField)
                content = content.replaceAll('{title}', currentData[serie.titleField]);

            //replace value
            if(serie.valueField)
                content = content.replaceAll('{value}', formatter(currentValue));

            //replace alpha
            if(serie.alphaField)
                content = content.replaceAll('{alpha}', currentData[serie.alphaField]);

            //replace color
            if(serie.colorField)
                content = content.replaceAll('{color}', currentData[serie.colorField]);

            //replace total value
            if(totalValue != null)
                content = content.replaceAll('{total}', formatter(totalValue));

            //replace percents
            if(percentValue != null)
                content = content.replaceAll('{percent}', percentValue + '%');

            return content;
        };

        //gets formatted content for sliced charts
        that.getXYFormat = function(data, serie, section) {
            var content = '',
                formatter = d3.format(),
                dateFormatter = d3.time.format('%m/%d/%Y'),
                xValue = data.xValue,
                yValue = data.yValue,
                sizeValue = data.sizeValue;

            //check section
            if(section == null)
                section = 'balloon';

            //switch section
            switch(section) {
                case 'label':
                    {
                        //check serie number format
                        if(serie.numberFormat !== '')
                            formatter = d3.format(serie.numberFormat);

                        //check serie date format
                        if(serie.dateFormat !== '')
                            dateFormatter = d3.format(serie.dateFormat);

                        //set content
                        content = serie.labelFormat;
                    }
                    break;
                case 'balloon':
                    {
                        //check serie number format
                        if(that.balloon.numberFormat !== '')
                            formatter = d3.format(that.balloon.numberFormat);

                        //check serie date format
                        if(that.balloon.dateFormat !== '')
                            dateFormatter = d3.time.format(that.balloon.dateFormat);

                        //set content
                        content = that.balloon.format;
                    }
                    break;
            }

            //replace x value
            if(xValue != null) {
                if(e.getType(xValue) === 'date') {
                    content = content.replaceAll('{x}', dateFormatter(xValue));
                    content = content.replaceAll('{title}', dateFormatter(xValue));
                } else if(e.getType(xValue) === 'number') {
                    content = content.replaceAll('{x}', formatter(xValue));
                    content = content.replaceAll('{title}', formatter(xValue));
                } else {
                    content = content.replaceAll('{x}', xValue);
                    content = content.replaceAll('{title}', xValue);
                }
            }

            //replace y value
            if (!isNaN(parseFloat(yValue))) {
                content = content.replaceAll('{y}', formatter(yValue));
                content = content.replaceAll('{value}', formatter(yValue));
            }

            //replace size value
            if (!isNaN(parseFloat(sizeValue)))
                content = content.replaceAll('{size}', formatter(sizeValue));

            //replace serie
            if(data.name)
                content = content.replaceAll('{serie}', data.name);

            return content;
        };
    }

    //define eve charts
    e.charts = {
        init: function(options, type) {
            return new chart(options, type);
        }
    };

})(eve);
(function(e) {
    //axis class
    function axis(chart) {
        //handle chart object error
        if(chart == null || e.getType(chart) !== 'object') {
            throw Error('Invalid chart data!');
        }

        //set axis members
        this.x = null;
        this.y = null;
        this.xAxis = null;
        this.yAxis = null;
        this.series = null;
        this.serieNames = [];
        this.xAxisDataType = 'numeric';

        //declare variables
        var that = this,
            xAxis, yAxis,
            xAxisGrid, yAxisGrid,
            legendWidth = 0,
            isReversed = chart.type === 'bar',
            legendHeight = chart.series.length * (chart.legend.fontSize + 5),
            axisLeft = 0,
            axisTop = 0,
            axisWidth = chart.width - chart.yAxis.labelFontSize * 2,
            axisHeight = chart.height - chart.xAxis.labelFontSize * 2,
            serieMin = 0, serieMax = 0,
            xDataType = e.getType(chart.data[0][chart.xField]),
            maxValues = [], minValues = [], yDomains = [];

        //set x Data Type as string if chart type is bar or column
        if(chart.type === 'bar' || chart.type === 'column')
            xDataType = 'string';
        
        //set x data type
        this.xAxisDataType = xDataType;

        //decrease axis left and width if y axis title enabled
        axisLeft += chart.yAxis.titleFontSize;
        axisWidth -= chart.yAxis.titleFontSize;

        //decrease axis top and height if y axis title enabled
        axisTop += chart.xAxis.titleFontSize;
        axisHeight -= chart.xAxis.titleFontSize * 2;

        //translate canvas
        chart.svg.attr('transform', 'translate(' + axisLeft + ',' + axisTop + ')');

        //iterate all series and set serie names
        chart.series.forEach(function(serie) { that.serieNames.push(serie.yField); });

        //map series with data
        that.series = that.serieNames.map(function(name, index) {
            //set data object
            var dataObject = {
                name: name,
                serieType: chart.series[index].type,
                values: chart.data.map(function(d) {
                    //get x value
                    var xValue = d[chart.xField],
                        serie = chart.series[index],
                        dataObject = {};

                    //set data object
                    dataObject.name = name;
                    dataObject.index = index;
                    dataObject.serieType = serie.type;
                    dataObject.xValue = xValue;

                    //set y value if set
                    if (serie.yField && e.getType(serie.yField) === 'string' && serie.yField !== '')
                        dataObject.yValue = parseFloat(d[name]);

                    //check whether the serie has size field
                    if (serie.sizeField && e.getType(serie.sizeField) === 'string' && serie.sizeField !== '')
                        dataObject.sizeValue = parseFloat(d[serie.sizeField]);

                    //return data object
                    return dataObject;
                })
            }

            //return data object
            return dataObject;
        });

        //create serie min
        var serieMin = d3.min(that.series, function (c) {
            return d3.min(c.values, function (v) {
                return parseFloat(v.yValue);
            });
        });

        //create serie max
        var serieMax = d3.max(that.series, function (c) {
            return d3.max(c.values, function (v) {
                return parseFloat(v.yValue);
            });
        });
        
        //check chart type to set serie max
        if (chart.type === 'area') {
            //set max serie value
            serieMax = d3.sum(that.series, function (c) {
                return d3.max(c.values, function (v) {
                    return parseFloat(v.yValue);
                });
            });
        } else if (chart.type === 'bar' || chart.type === 'column') {
            //check if axis is stacked
            if (chart.yAxis.stacked) {
                //set max serie value
                serieMax = d3.sum(that.series, function (c) {
                    return d3.max(c.values, function (v) {
                        return parseFloat(v.yValue);
                    });
                });
            }
        }
        
        //increase serie max by 10 percent
        serieMax *= 1.25;

        //set serie min
        serieMin = chart.yAxis.startsFromZero ? 0 : serieMin;

        //calculate max and min values
        that.series.forEach(function(serie, index) {
            //set max values
            maxValues.push(d3.max(serie.values, function(d) {
                return parseFloat(d.yValue);
            }));

            //set min values
            minValues.push(d3.min(serie.values, function(d) {
                return parseFloat(d.yValue);
            }));

            //check whether the data has sizeField
            if(chart.series[index].sizeField != null && chart.series[index].sizeField !== '') {
                //calculate min & max size values
                var sizeMin = d3.min(serie.values, function (d) { return parseFloat(d.sizeValue); });
                var sizeMax = d3.max(serie.values, function (d) { return parseFloat(d.sizeValue); });

                //set serie min and max values for size
                serie.minSize = sizeMin === undefined ? chart.series[index].minBulletSize : sizeMin;
                serie.maxSize = sizeMax === undefined ? chart.series[index].maxBulletSize : sizeMax;
            }

            //set y domains
            yDomains.push(0);
            yDomains.push(serieMax);
        });

        //get max text value
        var maxValue = d3.max(maxValues),
            minValue = minValues.min(),
            symbolSize = Math.pow(chart.legend.fontSize, 2);
        
        //check chart type to set serie max
        if (chart.type === 'area') {
            //set max value
            maxValue = d3.sum(maxValues);
        } else if (chart.type === 'bar' || chart.type === 'column') {
            //check if axis is stacked
            if (chart.yAxis.stacked) {
                //set max value
                maxValue = d3.sum(maxValues);
            }
        }

        //decllare max value length
        var maxValueLength = (maxValue.toString().length * chart.yAxis.labelFontSize / 2);

        //check if reversed to set max val length
        if(isReversed) {
            //set max val length
            maxValueLength = 0;

            //iterate all chart data
            chart.data.forEach(function(d) {
                if(d[chart.xField].toString().length > maxValueLength)
                    maxValueLength = d[chart.xField].toString().length * chart.xAxis.labelFontSize / 2 + chart.xAxis.titleFontSize;
            });
        }

        //decrease axis width
        axisWidth -= maxValueLength;

        //increase axis left position
        axisLeft += maxValueLength;

        //create an internal function to create x axis
        function createXAxis() {
            return d3.svg.axis().scale(that.x).orient('bottom').ticks(chart.xAxis.tickCount);
        };

        //create an internal function to create y axis
        function createYAxis() {
            return d3.svg.axis().scale(that.y).orient('left').ticks(chart.yAxis.tickCount);
        };

        //draws legends
        function drawLegend() {
            if(chart.legend.enabled) {
                //create legend texts
                chart.svg.selectAll('.eve-legend-text')
                    .data(chart.series)
                    .enter().append('g')
                    .append('text')
                    .attr('class', 'eve-legend-text')
                    .style('cursor', 'pointer')
                    .style('fill', chart.legend.fontColor)
                    .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                    .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                    .style("font-family", chart.legend.fontFamily)
                    .style("font-size", chart.legend.fontSize + 'px')
                    .text(function(d, i) { return chart.series[i].title ===  '' ? chart.series[i].yField : chart.series[i].title; })
                    .style("text-anchor", function(d) {
                        //calculate legend width
                        var textWidth = this.getBBox().width + chart.legend.fontSize;

                        //check textwidth > legendiwdth
                        if(textWidth > legendWidth)
                            legendWidth = textWidth;

                        return 'left';
                    })
                    .attr('transform', function (d, i) {
                        //calculate path pos
                        var x = chart.width - legendWidth,
                            y = (chart.height - legendHeight) / 2 + ((chart.legend.fontSize + 5) * i);

                        //return translation
                        return 'translate(' + x + ',' + y + ')';
                    })
                    .on('click', function(d, i) {
                        //set data selected event
                        if (d.selected) { d.selected = false; } else { d.selected = true; }

                        //switch serie type
                        switch(d.type) {
                            case 'line':
                                {
                                    //get serie paths
                                    var selectedSerie = chart.svg.selectAll('.eve-line-serie-' + i),
                                        selectedBullet = chart.svg.selectAll('.eve-line-point-' + i);

                                    //check whether the data is selected
                                    if(d.selected) {
                                        //decrease opacity of all series
                                        chart.svg.selectAll('.eve-series path').style('stroke-opacity', .1);

                                        //set selected serie stroke size
                                        selectedSerie.style('stroke-width', d.strokeSize + 2);

                                        //set selected serie opacity
                                        selectedSerie.style('stroke-opacity', 1);
                                        selectedBullet.style('stroke-opacity', 1);
                                    } else {
                                        chart.svg.selectAll('.eve-series path').style('stroke-opacity', 1);

                                        //set selected serie stroke size
                                        selectedSerie.style('stroke-opacity', d.lineAlpha);
                                        selectedSerie.style('stroke-width', d.strokeSize);
                                    }
                                }
                                break;
                            case 'scatter':
                                {
                                    //get serie paths
                                    var allSeries = chart.svg.selectAll('.eve-series path.eve-scatter-point'),
                                        selectedBullet = chart.svg.selectAll('.eve-scatter-point-' + i);

                                    //check whether the data is selected
                                    if(d.selected) {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', .1);
                                        allSeries.style('fill-opacity', .1);

                                        //set selected serie opacity
                                        selectedBullet.style('stroke-opacity', d.bulletStrokeAlpha);
                                        selectedBullet.style('fill-opacity', d.bulletAlpha);
                                    } else {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', d.bulletStrokeAlpha);
                                        allSeries.style('fill-opacity', d.bulletAlpha);
                                    }
                                }
                                break;
                            case 'bubble':
                                {
                                    //get serie paths
                                    var allSeries = chart.svg.selectAll('.eve-series path.eve-bubble-point'),
                                        selectedBullet = chart.svg.selectAll('.eve-bubble-point-' + i);

                                    //check whether the data is selected
                                    if(d.selected) {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', .1);
                                        allSeries.style('fill-opacity', .1);

                                        //set selected serie opacity
                                        selectedBullet.style('stroke-opacity', d.bulletStrokeAlpha);
                                        selectedBullet.style('fill-opacity', d.bulletAlpha);
                                    } else {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', d.bulletStrokeAlpha);
                                        allSeries.style('fill-opacity', d.bulletAlpha);
                                    }
                                }
                                break;
                            case 'area':
                                {
                                    //get all series
                                    var allSeries = chart.svg.selectAll('.eve-series path.eve-area-serie'),
                                        selectedSerie = chart.svg.selectAll('.eve-area-serie-' + i),
                                        selectedPoints = chart.svg.selectAll('.eve-area-point-' + i);

                                    //check whether the line is selected
                                    if (d.selected) {
                                        //set selected serie stroke size
                                        selectedSerie.style('stroke-width', d.strokeSize + 2);
                                        allSeries.style('stroke-opacity', .1);
                                        allSeries.style('fill-opacity', .1);

                                        //set selected serie opacity
                                        selectedSerie.style('stroke-width', d.strokeSize);
                                        selectedSerie.style('fill-opacity', d.alpha);
                                    } else {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', d.strokeSize);
                                        allSeries.style('fill-opacity', d.alpha);
                                    }
                                }
                                break;
                            case 'bar':
                                {
                                    //get all series
                                    var allSeries = chart.svg.selectAll('.eve-series rect'),
                                        selectedSerie = chart.svg.selectAll('.eve-bar-serie-' + i);

                                    //check whether the line is selected
                                    if (d.selected) {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', .1);
                                        allSeries.style('fill-opacity', .1);

                                        //set selected serie opacity
                                        selectedSerie.style('stroke-opacity', d.alpha);
                                        selectedSerie.style('fill-opacity', d.alpha);
                                    } else {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', d.alpha);
                                        allSeries.style('fill-opacity', d.alpha);
                                    }
                                }
                                break;
                        }

                        //check legendClick event handler to raise it
                        if(chart.legendClick)
                            chart.legendClick(d, i);
                    });

                //create legend icons
                var legendIcons =  chart.svg.selectAll('.eve-legend-icon')
                    .data(chart.series)
                    .enter().append('g')
                    .append('path')
                    .attr('d', d3.svg.symbol().type(chart.legend.icon).size(symbolSize))
                    .attr('class', 'eve-legend-icon')
                    .style('cursor', 'pointer')
                    .style('fill', function (d, i) {
                        //check whether the serie has colorField
                        if (d.color !== '')
                            return d.color;
                        else
                            return i <= e.colors.length ? e.colors[i] : e.randColor();
                    })
                    .attr('transform', function(d, i) {
                        //calculate x, y position
                        var bbox = this.getBBox(),
                            x = chart.width - legendWidth - 10,
                            y = ((chart.height - legendHeight) / 2) + ((bbox.height + 5) * i) - 5;

                        //return translation
                        return 'translate(' + x + ',' + y + ')';
                    })
                    .on('click', function(d, i) {
                        //set data selected event
                        if (d.selected) { d.selected = false; } else { d.selected = true; }

                        //switch serie type
                        switch(d.type) {
                            case 'line':
                                {
                                    //get serie paths
                                    var selectedSerie = chart.svg.selectAll('.eve-line-serie-' + i),
                                        selectedBullet = chart.svg.selectAll('.eve-line-point-' + i);

                                    //check whether the data is selected
                                    if(d.selected) {
                                        //decrease opacity of all series
                                        chart.svg.selectAll('.eve-series path').style('stroke-opacity', .1);

                                        //set selected serie stroke size
                                        selectedSerie.style('stroke-width', d.strokeSize + 2);

                                        //set selected serie opacity
                                        selectedSerie.style('stroke-opacity', 1);
                                        selectedBullet.style('stroke-opacity', 1);
                                    } else {
                                        chart.svg.selectAll('.eve-series path').style('stroke-opacity', 1);

                                        //set selected serie stroke size
                                        selectedSerie.style('stroke-opacity', d.lineAlpha);
                                        selectedSerie.style('stroke-width', d.strokeSize);
                                    }
                                }
                                break;
                            case 'scatter':
                                {
                                    //get serie paths
                                    var allSeries = chart.svg.selectAll('.eve-series path.eve-scatter-point'),
                                        selectedBullet = chart.svg.selectAll('.eve-scatter-point-' + i);

                                    //check whether the data is selected
                                    if(d.selected) {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', .1);
                                        allSeries.style('fill-opacity', .1);

                                        //set selected serie opacity
                                        selectedBullet.style('stroke-opacity', d.bulletStrokeAlpha);
                                        selectedBullet.style('fill-opacity', d.bulletAlpha);
                                    } else {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', d.bulletStrokeAlpha);
                                        allSeries.style('fill-opacity', d.bulletAlpha);
                                    }
                                }
                                break;
                            case 'bubble':
                                {
                                    //get serie paths
                                    var allSeries = chart.svg.selectAll('.eve-series path.eve-bubble-point'),
                                        selectedBullet = chart.svg.selectAll('.eve-bubble-point-' + i);

                                    //check whether the data is selected
                                    if(d.selected) {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', .1);
                                        allSeries.style('fill-opacity', .1);

                                        //set selected serie opacity
                                        selectedBullet.style('stroke-opacity', d.bulletStrokeAlpha);
                                        selectedBullet.style('fill-opacity', d.bulletAlpha);
                                    } else {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', d.bulletStrokeAlpha);
                                        allSeries.style('fill-opacity', d.bulletAlpha);
                                    }
                                }
                                break;
                            case 'area':
                                {
                                    //get all series
                                    var allSeries = chart.svg.selectAll('.eve-series path.eve-area-serie'),
                                        selectedSerie = chart.svg.selectAll('.eve-area-serie-' + i),
                                        selectedPoints = chart.svg.selectAll('.eve-area-point-' + i);

                                    //check whether the line is selected
                                    if (d.selected) {
                                        //set selected serie stroke size
                                        selectedSerie.style('stroke-width', d.strokeSize + 2);
                                        allSeries.style('stroke-opacity', .1);
                                        allSeries.style('fill-opacity', .1);

                                        //set selected serie opacity
                                        selectedSerie.style('stroke-width', d.strokeSize);
                                        selectedSerie.style('fill-opacity', d.alpha);
                                    } else {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', d.strokeSize);
                                        allSeries.style('fill-opacity', d.alpha);
                                    }
                                }
                                break;
                            case 'bar':
                                {
                                    //get all series
                                    var allSeries = chart.svg.selectAll('.eve-series rect'),
                                        selectedSerie = chart.svg.selectAll('.eve-bar-serie-' + i);

                                    //check whether the line is selected
                                    if (d.selected) {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', .1);
                                        allSeries.style('fill-opacity', .1);

                                        //set selected serie opacity
                                        selectedSerie.style('stroke-opacity', d.alpha);
                                        selectedSerie.style('fill-opacity', d.alpha);
                                    } else {
                                        //set selected serie stroke size
                                        allSeries.style('stroke-opacity', d.alpha);
                                        allSeries.style('fill-opacity', d.alpha);
                                    }
                                }
                                break;
                        }

                        //check legendClick event handler to raise it
                        if(chart.legendClick)
                            chart.legendClick(d, i);
                    });

                //decrease axis width
                axisWidth -= legendWidth + chart.legend.fontSize;
            }
        }

        //draws axis titles
        function drawTitles() {
            if(isReversed) {
                //check whether the base x axis has a title
                if (chart.xAxis.title !== '') {
                    //create base x axis title
                    chart.svg.append('g').append('text')
                        .text(chart.yAxis.title)
                        .style('fill', chart.yAxis.titleFontColor)
                        .style('font-family', chart.yAxis.titleFontFamily)
                        .style('font-size', chart.yAxis.titleFontSize + 'px')
                        .style('font-style', chart.yAxis.titleFontStyle === 'bold' ? 'normal' : chart.yAxis.titleFontStyle)
                        .style('font-weight', chart.yAxis.titleFontStyle === 'bold' ? 'bold' : 'normal')
                        .style('text-anchor', 'middle')
                        .attr('x', function (d) {
                            //get bbox
                            var bbox = this.getBBox();

                            //return x pos
                            return ((chart.width - legendWidth - bbox.width) / 2) + (Math.sqrt(symbolSize) / 2);
                        })
                        .attr('y', function (d) {
                            //get bbox
                            var bbox = this.getBBox();

                            //decrase axis height
                            axisHeight -= bbox.height;

                            //return y pos
                            return chart.height - bbox.height;
                        });
                }

                //check whether the base y axis has title
                if (chart.yAxis.title !== '') {
                    //create base y axis title
                    chart.svg.append('g').append('text')
                        .text(chart.xAxis.title)
                        .style('fill', chart.xAxis.titleFontColor)
                        .style('font-family', chart.xAxis.titleFontFamily)
                        .style('font-size', chart.xAxis.titleFontSize + 'px')
                        .style('font-style', chart.xAxis.titleFontStyle === 'bold' ? 'normal' : chart.xAxis.titleFontStyle)
                        .style('font-weight', chart.xAxis.titleFontStyle === 'bold' ? 'bold' : 'normal')
                        .style('text-anchor', 'middle')
                        .attr('transform', function (d) {
                            //get bbox
                            var bbox = this.getBBox();

                            //increase axis left
                            axisLeft += bbox.height;

                            //decare axis width
                            axisWidth -= bbox.height;

                            //return x pos
                            return 'translate(0,' + (chart.height / 2 - bbox.height / 2) + ')rotate(-90)';
                        });
                }
            } else {
                //check whether the base x axis has a title
                if (chart.xAxis.title !== '') {
                    //create base x axis title
                    chart.svg.append('g').append('text')
                        .text(chart.xAxis.title)
                        .style('fill', chart.xAxis.titleFontColor)
                        .style('font-family', chart.xAxis.titleFontFamily)
                        .style('font-size', chart.xAxis.titleFontSize + 'px')
                        .style('font-style', chart.xAxis.titleFontStyle === 'bold' ? 'normal' : chart.xAxis.titleFontStyle)
                        .style('font-weight', chart.xAxis.titleFontStyle === 'bold' ? 'bold' : 'normal')
                        .style('text-anchor', 'middle')
                        .attr('x', function (d) {
                            //get bbox
                            var bbox = this.getBBox();

                            //return x pos
                            return ((chart.width - legendWidth - bbox.width) / 2) + (Math.sqrt(symbolSize) / 2);
                        })
                        .attr('y', function (d) {
                            //get bbox
                            var bbox = this.getBBox();

                            //decrase axis height
                            axisHeight -= bbox.height;

                            //return y pos
                            return chart.height - bbox.height;
                        });
                }

                //check whether the base y axis has title
                if (chart.yAxis.title !== '') {
                    //create base y axis title
                    chart.svg.append('g').append('text')
                        .text(chart.yAxis.title)
                        .style('fill', chart.yAxis.titleFontColor)
                        .style('font-family', chart.yAxis.titleFontFamily)
                        .style('font-size', chart.yAxis.titleFontSize + 'px')
                        .style('font-style', chart.yAxis.titleFontStyle === 'bold' ? 'normal' : chart.yAxis.titleFontStyle)
                        .style('font-weight', chart.yAxis.titleFontStyle === 'bold' ? 'bold' : 'normal')
                        .style('text-anchor', 'middle')
                        .attr('transform', function (d) {
                            //get bbox
                            var bbox = this.getBBox();

                            //increase axis left
                            axisLeft += bbox.height;

                            //decare axis width
                            axisWidth -= bbox.height;

                            //return x pos
                            return 'translate(0,' + (chart.height / 2 - bbox.height / 2) + ')rotate(-90)';
                        });
                }
            }
        }

        //draws axes
        function drawAxes() {
            //set x scale
            if(xDataType === 'date')
                that.x = d3.time.scale().range([0, axisWidth]);
            else if(xDataType === 'string')
                that.x = d3.scale.ordinal().rangeRoundBands([0, axisWidth], .1);
            else
                that.x = d3.scale.linear().range([0, axisWidth]);

            //check whether the base is reversed
            if (isReversed) {
                //set that x
                that.x = d3.scale.linear().range([0, axisWidth]);

                //switch data type for xAxis to set x range
                if(xDataType === 'date')
                    that.y = d3.time.scale().range([axisHeight, 0]);
                else if(xDataType === 'string')
                    that.y = d3.scale.ordinal().rangeRoundBands([axisHeight, 0], .1);
                else
                    that.y = d3.scale.linear().range([axisHeight, 0]);
            } else {
                //set y scale
                that.y = d3.scale.linear().range([axisHeight, 0]);
            }

            //create x axis
            that.xAxis = createXAxis();

            //create y axis
            that.yAxis = createYAxis();

            //set domains by x data type
            switch(xDataType) {
                case 'date':
                    {
                        //get min and max date
                        var xMin = d3.min(chart.data, function(d) { return d[chart.xField]; }),
                            xMax = d3.max(chart.data, function(d) { return d[chart.xField]; });

                        //create x axis domain
                        if (isReversed)
                            that.y.domain([xMin, xMax]);
                        else
                            that.x.domain([xMin, xMax]);
                    }
                    break;
                case 'string':
                    {
                        //declare domain array
                        var domainArray = chart.data.map(function (d) {
                            return d[chart.xField].toString();
                        });
                        
                        //sort domain array
                        domainArray.sort();

                        //create x axis domain
                        if (isReversed)
                            that.y.domain(domainArray);
                        else
                            that.x.domain(domainArray);
                    }
                    break;
                default:
                    {
                        //get min and max values
                        var xMin = chart.xAxis.startsFromZero ? 0 : d3.min(chart.data, function(d) { return d[chart.xField]; }),
                            xMax = d3.max(chart.data, function(d) { return d[chart.xField]; });

                        //create x axis domain
                        if(isReversed)
                            that.y.domain([xMin, (chart.xAxis.startsFromZero ? (xMax + 1) : xMax)]);
                        else
                            that.x.domain([xMin, (chart.xAxis.startsFromZero ? (xMax + 1) : xMax)]);
                    }
                    break;
            }

            //create y axis domain
            if (isReversed)
                that.x.domain(yDomains);
            else
                that.y.domain(yDomains);

            //create x axis grid lines
            xAxisGrid = chart.svg.append('g')
                .attr('class', 'eve-x-grid')
                .attr('transform', function () { return 'translate(' + axisLeft + ', ' + axisHeight + ')'; })
                .call(createXAxis().tickSize(-axisHeight, 0, 0).tickFormat(''));
            
            //set x axis grid line style
            xAxisGrid.selectAll('line')
                .style('stroke-opacity', chart.xAxis.gridLineAlpha)
                .style('stroke-width', chart.xAxis.gridLineThickness + 'px')
                .style('stroke', chart.xAxis.gridLineColor);
            
            //create y axis grid lines
            yAxisGrid = chart.svg.append('g')
                .attr('class', 'eve-y-grid')
                .attr('transform', function () { return 'translate(' + axisLeft + ')'; })
                .call(createYAxis().tickSize(-axisWidth, 0, 0).tickFormat(''));
            
            //set y axis grid line style
            yAxisGrid.selectAll('line')
                .style('stroke-opacity', chart.yAxis.gridLineAlpha)
                .style('stroke-width', chart.yAxis.gridLineThickness + 'px')
                .style('stroke', chart.yAxis.gridLineColor);

            //create y axis
            yAxis = chart.svg.append('g')
                .style('fill', 'none')
                .style('stroke', chart.yAxis.color)
                .style('stroke-width', chart.yAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', 'translate(' + axisLeft + ')')
                .attr('class', 'eve-y-axis')
                .call(that.yAxis);

            //select all lines in yaxis
            yAxis.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', chart.yAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', chart.yAxis.alpha)
                .style('stroke', chart.yAxis.color);

            //select all texts in yaxis
            yAxis.selectAll('text')
                .style('fill', chart.yAxis.labelFontColor)
                .style('font-size', chart.yAxis.labelFontSize + 'px')
                .style('font-family', chart.yAxis.labelFontFamily)
                .style('font-style', chart.yAxis.labelFontStlye === 'bold' ? 'normal' : chart.yAxis.labelFontStlye)
                .style('font-weight', chart.yAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                .text(function(d) {
                    if(isReversed) {
                        if(xDataType === 'number')
                            return d3.format(chart.xAxis.labelFormat)(d);
                        else if(xDataType === 'date')
                            return d3.time.format(chart.xAxis.labelFormat)(d);
                        else
                            return d;
                    } else {
                        return d3.format(chart.yAxis.labelFormat)(d);
                    }
                })
                .attr('transform', function() {
                    //calculate single axis value area
                    var bbox = this.getBBox(),
                        xMid = 5,
                        yMid = bbox.height / 2;

                    //set default angle
                    if(chart.yAxis.labelAngle !== 0 && chart.yAxis.labelAngle !== 45 && chart.yAxis.labelAngle !== -45)
                        chart.yAxis.labelAngle = 0;

                    //translate axis text by angle
                    if(chart.yAxis.labelAngle < 0)
                        return 'translate(-' + xMid + ', -' + yMid + ')rotate(' + chart.yAxis.labelAngle + ')';
                    else if(chart.yAxis.labelAngle > 0)
                        return 'translate(-' + xMid + ', ' + yMid + ')rotate(' + chart.yAxis.labelAngle + ')';
                    else
                        return 'rotate(' + chart.yAxis.labelAngle + ')';
                })
                .style('stroke-width', '0px');

            //create x axis
            xAxis = chart.svg.append('g')
                .style('fill', 'none')
                .style('stroke', chart.xAxis.color)
                .style('stroke-width', chart.xAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', 'translate(' + axisLeft + ',' + axisHeight + ')')
                .attr('class', 'eve-x-axis')
                .call(that.xAxis);

            //select all lines in xaxis
            xAxis.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', chart.xAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', chart.xAxis.alpha)
                .style('stroke', chart.xAxis.color);

            //select all texts in xaxis
            xAxis.selectAll('text')
                .style('fill', chart.xAxis.labelFontColor)
                .style('font-size', chart.xAxis.labelFontSize + 'px')
                .style('font-family', chart.xAxis.labelFontFamily)
                .style('font-style', chart.xAxis.labelFontStlye === 'bold' ? 'normal' : chart.xAxis.labelFontStlye)
                .style('font-weight', chart.xAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                .text(function(d) {
                    if(isReversed) {
                        return d3.format(chart.yAxis.labelFormat)(d);
                    } else {
                        if(xDataType === 'number')
                            return d3.format(chart.xAxis.labelFormat)(d);
                        else if(xDataType === 'date')
                            return d3.time.format(chart.xAxis.labelFormat)(d);
                        else
                            return d;
                    }
                })
                .attr('transform', function(d) {
                    //calculate single axis value area
                    var bbox = this.getBBox(),
                        yMid = bbox.height / 2;

                    //set default angle
                    if(chart.xAxis.labelAngle !== 0 && chart.xAxis.labelAngle !== 45 && chart.xAxis.labelAngle !== -45)
                        chart.xAxis.labelAngle = 0;

                    //translate axis text by angle
                    if(chart.xAxis.labelAngle < 0)
                        return 'translate(-' + bbox.width + ', ' + yMid + ')rotate(' + chart.xAxis.labelAngle + ')';
                    else if(chart.xAxis.labelAngle > 0)
                        return 'translate(' + bbox.width + ', ' + yMid + ')rotate(' + chart.xAxis.labelAngle + ')';
                    else
                        return 'rotate(' + chart.xAxis.labelAngle + ')';
                })
                .style('stroke-width', '0px');
        }

        //draw axis environment
        drawLegend();
        drawTitles();
        drawAxes();

        //set offset
        this.offset = { left: axisLeft, top: axisTop, width: axisWidth, height: axisHeight };

        //creates x axis
        that.makeXAxis = function() {
            return createXAxis();
        };

        //creates y axis
        that.makeYAxis = function() {
            return createYAxis();
        };

        //update axis
        that.update = function(data) {
            //check data
            if(data == null) data = chart.data;

            //clear yDomains
            yDomains.length = [];
            minValues.length = [];
            maxValues.length = [];

            //map data to series
            that.series = that.serieNames.map(function(name, index) {
                return {
                    name: name,
                    serieType: chart.series[index].type,
                    values: chart.data.map(function(d) {
                        //get x value
                        var xValue = d[chart.xField],
                            serie = chart.series[index],
                            dataObject = {};

                        //set data object
                        dataObject.name = name;
                        dataObject.index = index;
                        dataObject.serieType = serie.type;
                        dataObject.xValue = xValue;

                        //set y value if set
                        if (serie.yField && e.getType(serie.yField) === 'string' && serie.yField !== '')
                            dataObject.yValue = +parseFloat(d[name]);

                        //check whether the serie has size field
                        if (serie.sizeField && e.getType(serie.sizeField) === 'string' && serie.sizeField !== '')
                            dataObject.sizeValue = +parseFloat(d[serie.sizeField]);

                        //return data object
                        return dataObject;
                    })
                };
            });

            //create serie min
            serieMin = d3.min(that.series, function (c) {
                return d3.min(c.values, function (v) {
                    return parseFloat(v.yValue);
                });
            });

            //create serie max
            serieMax = d3.max(that.series, function (c) {
                return d3.max(c.values, function (v) {
                    return parseFloat(v.yValue);
                });
            });

            //increase serie max by 10 percent
            serieMax *= 1.1;

            //set serie min
            serieMin = chart.yAxis.startsFromZero ? 0 : serieMin;

            //calculate max and min values
            that.series.forEach(function(serie, index) {
                //set max values
                maxValues.push(d3.max(serie.values, function(d) {
                    return parseFloat(d.yValue);
                }));

                //set min values
                minValues.push(d3.min(serie.values, function(d) {
                    return parseFloat(d.yValue);
                }));

                //check whether the data has sizeField
                if(chart.series[index].sizeField != null && chart.series[index].sizeField !== '') {
                    //calculate min & max size values
                    var sizeMin = d3.min(serie.values, function (d) { return parseFloat(d.sizeValue); });
                    var sizeMax = d3.max(serie.values, function (d) { return parseFloat(d.sizeValue); });

                    //set serie min and max values for size
                    serie.minSize = sizeMin === undefined ? chart.series[index].minBulletSize : sizeMin;
                    serie.maxSize = sizeMax === undefined ? chart.series[index].maxBulletSize : sizeMax;
                }

                //set y domains
                yDomains.push(serieMin);
                yDomains.push(serieMax);
            });

            //get max text value
            maxValue = maxValues.max();
            minValue = minValues.min();
            symbolSize = Math.pow(chart.legend.fontSize, 2);
            maxValueLength = (maxValue.toString().length * chart.yAxis.labelFontSize / 2);

            //check if reversed to set max val length
            if(isReversed) {
                //set max val length
                maxValueLength = 0;

                //iterate all chart data
                chart.data.forEach(function(d) {
                    if(d[chart.xField].toString().length > maxValueLength)
                        maxValueLength = d[chart.xField].toString().length * chart.xAxis.labelFontSize / 2 + chart.xAxis.titleFontSize;
                });
            }

            //set domains by x data type
            switch(xDataType) {
                case 'date':
                    {
                        //get min and max date
                        var xMin = d3.min(chart.data, function(d) { return d[chart.xField]; }),
                            xMax = d3.max(chart.data, function(d) { return d[chart.xField]; });

                        //create x axis domain
                        if (isReversed)
                            that.y.domain([xMin, xMax]);
                        else
                            that.x.domain([xMin, xMax]);
                    }
                    break;
                case 'string':
                    {
                        //create x axis domain
                        if(isReversed) {
                            that.y.domain(chart.data.map(function(d) {
                                return d[chart.xField].toString();
                            }));
                        } else {
                            that.x.domain(chart.data.map(function(d) {
                                return d[chart.xField].toString();
                            }));
                        }
                    }
                    break;
                default:
                    {
                        //get min and max values
                        var xMin = chart.xAxis.startsFromZero ? 0 : d3.min(chart.data, function(d) { return d[chart.xField]; }),
                            xMax = d3.max(chart.data, function(d) { return d[chart.xField]; });

                        //create x axis domain
                        if(isReversed)
                            that.y.domain([xMin, (chart.xAxis.startsFromZero ? (xMax + 1) : xMax)]);
                        else
                            that.x.domain([xMin, (chart.xAxis.startsFromZero ? (xMax + 1) : xMax)]);
                    }
                    break;
            }

            //create y axis domain
            if (isReversed)
                that.x.domain(yDomains);
            else
                that.y.domain(yDomains);

            //update x axis
            chart.svg.select('.eve-x-axis')
                .transition()
                .duration(chart.animationDuration)
                .call(that.xAxis);

            //update y axis
            chart.svg.select('.eve-y-axis')
                .transition()
                .duration(chart.animationDuration)
                .call(that.yAxis);

            //select all texts in xaxis
            xAxis.selectAll('text')
                .style('fill', chart.xAxis.labelFontColor)
                .style('font-size', chart.xAxis.labelFontSize + 'px')
                .style('font-family', chart.xAxis.labelFontFamily)
                .style('font-style', chart.xAxis.labelFontStlye === 'bold' ? 'normal' : chart.xAxis.labelFontStlye)
                .style('font-weight', chart.xAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                .text(function(d) {
                    if(xDataType === 'number')
                        return d3.format(chart.xAxis.labelFormat)(d);
                    else if(xDataType === 'date')
                        return d3.time.format(chart.xAxis.labelFormat)(d);
                    else
                        return d;
                })
                .attr('transform', function(d) {
                    //calculate single axis value area
                    var bbox = this.getBBox(),
                        yMid = bbox.height / 2;

                    //set default angle
                    if(chart.xAxis.labelAngle !== 0 && chart.xAxis.labelAngle !== 45 && chart.xAxis.labelAngle !== -45)
                        chart.xAxis.labelAngle = 0;

                    //translate axis text by angle
                    if(chart.xAxis.labelAngle < 0)
                        return 'translate(-' + bbox.width + ', ' + yMid + ')rotate(' + chart.xAxis.labelAngle + ')';
                    else if(chart.xAxis.labelAngle > 0)
                        return 'translate(' + bbox.width + ', ' + yMid + ')rotate(' + chart.xAxis.labelAngle + ')';
                    else
                        return 'rotate(' + chart.xAxis.labelAngle + ')';
                })
                .style('stroke-width', '0px');

            //select all texts in yaxis
            yAxis.selectAll('text')
                .style('fill', chart.yAxis.labelFontColor)
                .style('font-size', chart.yAxis.labelFontSize + 'px')
                .style('font-family', chart.yAxis.labelFontFamily)
                .style('font-style', chart.yAxis.labelFontStlye === 'bold' ? 'normal' : chart.yAxis.labelFontStlye)
                .style('font-weight', chart.yAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                .text(function(d) { return d3.format(chart.yAxis.labelFormat)(d); })
                .attr('transform', function() {
                    //calculate single axis value area
                    var bbox = this.getBBox(),
                        xMid = 5,
                        yMid = bbox.height / 2;

                    //set default angle
                    if(chart.yAxis.labelAngle !== 0 && chart.yAxis.labelAngle !== 45 && chart.yAxis.labelAngle !== -45)
                        chart.yAxis.labelAngle = 0;

                    //translate axis text by angle
                    if(chart.yAxis.labelAngle < 0)
                        return 'translate(-' + xMid + ', -' + yMid + ')rotate(' + chart.yAxis.labelAngle + ')';
                    else if(chart.yAxis.labelAngle > 0)
                        return 'translate(-' + xMid + ', ' + yMid + ')rotate(' + chart.yAxis.labelAngle + ')';
                    else
                        return 'rotate(' + chart.yAxis.labelAngle + ')';
                })
                .style('stroke-width', '0px');

            //return updated axis
            return this;
        };
    }

    //attach create axis method
    eve.charts.createAxis = function(chart) {
        return new axis(chart);
    };
})(eve);
(function(e) {
    //serie defaults
    var defaults = {
        alphaField: '',
        colorField: '',
        hoverOpacity: .9,
        labelPosition: 'inside',
        labelFontColor: '#ffffff',
        labelFontFamily: 'Tahoma',
        labelFontSize: 11,
        labelFontStyle: 'normal',
        labelFormat: '{percent}',
        neckHeight: 25,
        sliceBorderOpacity: .1,
        titleField: '',
        valueField: '',
        valueFormat: ''
    };

    //funnel chart class
    function funnel(options) {
        //create chart
        var that = this,
            chart = e.charts.init(options),
            isPyramid = options.type === 'pyramid',
            serie = e.extend(chart.series[0], defaults),
            symbolSize = Math.pow(chart.legend.fontSize, 2),
            margin = { left: 10 + Math.sqrt(symbolSize), top: 10 + Math.sqrt(symbolSize), right: 10 + Math.sqrt(symbolSize), bottom: 10 + Math.sqrt(symbolSize) },
            transX = margin.left,
            transY = margin.top,
            funnelWidth = chart.width - margin.left - margin.right,
            funnelHeight = (!isPyramid && serie.neckHeight > 0) ? (chart.height - serie.neckHeight - margin.top - margin.bottom) : chart.height - margin.top - margin.bottom,
            gradePercent = isPyramid ? 1 / 200 : 1 / 10,
            grade = 2 * funnelHeight / (funnelWidth - gradePercent * funnelWidth),
            totalArea = (funnelWidth + gradePercent * funnelWidth) * funnelHeight / 2,
            totalData = d3.sum(chart.data, function (d) { return d[serie.valueField]; }),
            legendWidth = 0,
            legendHeight = 0,
            alphaMin = 0,
            alphaMax = 0,
            slices, neck, legendTexts, legendIcons,
            funnel = d3.svg.line().x(function (d) { return d[0]; }).y(function (d) { return d[1]; });

        //check chart series
        if(chart.series.length === 0) {
            throw Error('Chart serie could not found!');
        }

        //set default balloon format
        if(chart.balloon.format === '')
            chart.balloon.format = '{title}: {value}';

        //set alpha size
        if(serie.alphaField !== '') {
            alphaMin = d3.min(chart.data, function(d) { return d[serie.alphaField]; })
            alphaMax = d3.max(chart.data, function(d) { return d[serie.alphaField]; })
        }

        //gets paths
        function getPaths() {
            var paths = [], pathPoints = [];

            //inner function to create path points
            function createPathPoints(ll, lr, lh, i) {
                if (i >= chart.data.length) return;
                v = chart.data[i][serie.valueField];
                a = v * totalArea / totalData;
                pw = lr - ll;
                nw = Math.sqrt((grade * pw * pw - 4 * a) / grade);
                nl = (pw - nw) / 2 + ll;
                nr = lr - (pw - nw) / 2;
                nh = (grade * (pw - nw) / 2 + lh);

                pathPoints = [[nr, nh]];
                pathPoints.push([lr, lh]);
                pathPoints.push([ll, lh]);
                pathPoints.push([nl, nh]);
                pathPoints.push([nr, nh]);

                paths.push(pathPoints);
                createPathPoints(nl, nr, nh, i + 1);
            }

            createPathPoints(0, funnelWidth, 0, 0);
            return paths;
        }

        //initializes funnel
        function init() {
            //append g for funnel slices
            chart.svg.append('g').attr('class', 'eve-funnel-slices');

            //create legends
            if (chart.legend.enabled) {
                //add g for legend texts and icons
                chart.svg.append('g').attr('class', 'eve-legend-icon');
                chart.svg.append('g').attr('class', 'eve-legend-text');

                //set legend height
                legendHeight = chart.data.length * (chart.legend.fontSize + 5);

                //create legend texts
                legendTexts = chart.svg.select('.eve-legend-text').selectAll('text.eve-legend-text')
                    .data(chart.data)
                    .enter().insert('text')
                    .attr('class', 'eve-legend-text')
                    .style('cursor', 'pointer')
                    .style('fill', chart.legend.fontColor)
                    .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                    .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                    .style("font-family", chart.legend.fontFamily)
                    .style("font-size", chart.legend.fontSize + 'px')
                    .text(function (d, i) { return d[serie.titleField] })
                    .style("text-anchor", function(d, i) {
                        //calculate legend width
                        var textWidth = this.getBBox().width + chart.legend.fontSize;

                        //check textwidth > legendiwdth
                        if(textWidth > legendWidth)
                            legendWidth = textWidth;

                        return 'left';
                    })
                    .on('click', function(d, i) {
                        //set data selected event
                        if (d.selected) { d.selected = false; } else { d.selected = true; }

                        //check if data is selected
                        if(d.selected) {
                            //get current slices
                            d3.select(slices[0][i])
                                .transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', function () {
                                    //return translation
                                    if(isPyramid)
                                        return 'translate(' + (funnelWidth + 10) + ',' + funnelHeight + ')rotate(180)';
                                    else
                                        return 'translate(10)';
                                });

                            //check index
                            if(i === chart.data.length - 1 && neck != null) {
                                neck.transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', function () {
                                        //return translation
                                        return 'translate(10)';
                                    });
                            }
                        } else {
                            //get current slices
                            d3.select(slices[0][i])
                                .transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', function () {
                                    //return translation
                                    if(isPyramid)
                                        return 'translate(' + funnelWidth + ',' + funnelHeight + ')rotate(180)';
                                    else
                                        return 'translate(0)';
                                });

                            //check index
                            if(i === chart.data.length - 1) {
                                //check index
                                if(i === chart.data.length - 1 && neck != null) {
                                    neck.transition()
                                        .duration(chart.animationDuration / 2)
                                        .attr('transform', function () {
                                            //return translation
                                            return 'translate(0)';
                                        });
                                }
                            }
                        }

                        //check legendClick event handler to raise it
                        if(chart.legendClick)
                            chart.legendClick(d, i);
                    });

                //create legend icons
                legendIcons = chart.svg.select('.eve-legend-icon').selectAll('path.eve-legend-icon')
                    .data(chart.data)
                    .enter().insert('path')
                    .attr('d', d3.svg.symbol().type(chart.legend.icon).size(symbolSize))
                    .attr('class', 'eve-legend-icon')
                    .style('cursor', 'pointer')
                    .style('fill', function (d, i) {
                        if (slices !== undefined)
                            return d3.select(slices[0][i]).style('fill');

                        //check whether the serie has colorField
                        if (serie.colorField !== '')
                            return d[serie.colorField];
                        else
                            return i <= e.colors.length ? e.colors[i] : e.randColor();
                    })
                    .on('click', function(d, i) {
                        //set data selected event
                        if (d.selected) { d.selected = false; } else { d.selected = true; }

                        //check if data is selected
                        if(d.selected) {
                            //get current slices
                            d3.select(slices[0][i])
                                .transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', function () {
                                    //return translation
                                    if(isPyramid)
                                        return 'translate(' + (funnelWidth + 10) + ',' + funnelHeight + ')rotate(180)';
                                    else
                                        return 'translate(10)';
                                });

                            //check index
                            if(i === chart.data.length - 1 && neck != null) {
                                neck.transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', function () {
                                        //return translation
                                        return 'translate(10)';
                                    });
                            }
                        } else {
                            //get current slices
                            d3.select(slices[0][i])
                                .transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', function () {
                                    //return translation
                                    if(isPyramid)
                                        return 'translate(' + funnelWidth + ',' + funnelHeight + ')rotate(180)';
                                    else
                                        return 'translate(0)';
                                });

                            //check index
                            if(i === chart.data.length - 1) {
                                //check index
                                if(i === chart.data.length - 1 && neck != null) {
                                    neck.transition()
                                        .duration(chart.animationDuration / 2)
                                        .attr('transform', function () {
                                            //return translation
                                            return 'translate(0)';
                                        });
                                }
                            }
                        }

                        //check legendClick event handler to raise it
                        if(chart.legendClick)
                            chart.legendClick(d, i);
                    });

                //update funnel width
                funnelWidth -= legendWidth;
                grade = 2 * funnelHeight / (funnelWidth - gradePercent * funnelWidth);
                totalArea = (funnelWidth + gradePercent * funnelWidth) * funnelHeight / 2;
            }

            //get trapezoid paths
            var paths = getPaths();

            //transform the canvas to set margins
            chart.svg.attr('transform', 'translate(' + transX + ', ' + transY + ')');

            //create slice data
            slices = chart.svg.select('.eve-funnel-slices')
                .selectAll('path.eve-funnel-slice')
                .data(chart.data)
                .enter().insert('path')
                .attr('class', function(d, i) { return 'eve-funnel-slice eve-funnel-slice-' + i; })
                .attr('d', function(d, i) { return funnel(paths[i]); })
                .style('stroke', '#ffffff')
                .style("stroke-width", 0)
                .style('fill', function (d, i) {
                    //check whether the serie has colorField
                    if (serie.colorField !== '')
                        return d.data[serie.colorField];
                    else
                        return i <= e.colors.length ? e.colors[i] : e.randColor();
                })
                .style('fill-opacity', function (d, i) {
                    //check whether the serie has alphaField
                    if (serie.alphaField !== '') {
                        //calculate alpha
                        var range = alphaMax - alphaMin,
                            alpha = d.data[serie.alphaField] / range * .8 - (alphaMin / range * .8) + .2;

                        //return new alpha
                        return alpha;;
                    }
                    else
                        return 1;
                })
                .on('click', function(d, i) {
                    //set data selected event
                    if (d.selected) { d.selected = false; } else { d.selected = true; }

                    //check if data is selected
                    if(d.selected) {
                        //get current slices
                        d3.select(this)
                            .transition()
                            .duration(chart.animationDuration / 2)
                            .attr('transform', function () {
                                //return translation
                                if(isPyramid)
                                    return 'translate(' + (funnelWidth + 10) + ',' + funnelHeight + ')rotate(180)';
                                else
                                    return 'translate(10)';
                            });

                        //check index
                        if(i === chart.data.length - 1 && neck != null) {
                            neck.transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', function () {
                                    //return translation
                                    return 'translate(10)';
                                });
                        }
                    } else {
                        //get current slices
                        d3.select(this)
                            .transition()
                            .duration(chart.animationDuration / 2)
                            .attr('transform', function () {
                                //return translation
                                if(isPyramid)
                                    return 'translate(' + funnelWidth + ',' + funnelHeight + ')rotate(180)';
                                else
                                    return 'translate(0)';
                            });

                        //check index
                        if(i === chart.data.length - 1) {
                            //check index
                            if(i === chart.data.length - 1 && neck != null) {
                                neck.transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', function () {
                                        //return translation
                                        return 'translate(0)';
                                    });
                            }
                        }
                    }
                })
                .on('mousemove', function (d, i) {
                    //get data color
                    var balloonContent = chart.getSlicedFormat(i, serie);

                    //Show balloon
                    chart.showBalloon(balloonContent);

                    //Set hover for the current slice
                    d3.select(this).style('opacity', serie.hoverOpacity);

                    //check whether the neck is not null
                    if (neck !== undefined && i === chart.data.length - 1)
                        neck.style('opacity', serie.hoverOpacity);
                })
                .on('mouseout', function (d, i) {
                    //Hide balloon
                    chart.hideBalloon();

                    //Remove opacity of the curent slice
                    d3.select(this).style('opacity', 1);

                    //check whether the neck is not null
                    if (neck !== undefined && i === chart.data.length - 1)
                        neck.style('opacity', 1);
                });

            //check whether the chart has neck
            if (!isPyramid && serie.neckHeight > 0) {
                //get last funnel point
                var lastVal = chart.data[chart.data.length - 1][serie.valueField],
                    lfp = slices[0][chart.data.length - 1].getBBox(),
                    neckY = lfp.height + lfp.y,
                    neckH = serie.neckHeight,
                    lfpArea = lastVal * totalArea / totalData,
                    neckW = Math.sqrt((grade * lfp.width * lfp.width - 4 * lfpArea) / grade),
                    neckX = lfp.x + lfp.width / 2 - neckW / 2;

                //insert neck
                neck = chart.svg.insert('rect')
                    .style('fill', function () {
                        //get last data
                        var d = chart.data[chart.data.length - 1],
                            i = chart.data.length - 1;

                        //check whether the serie has colorField
                        if (serie.colorField !== '')
                            return d[serie.colorField];
                        else
                            return i <= e.colors.length ? e.colors[i] : e.randColor();
                    })
                    .style('fill-opacity', function () {
                        //get last data
                        var d = chart.data[chart.data.length - 1],
                            i = chart.data.length - 1;

                        //check whether the serie has alphaField
                        if (serie.alphaField !== '') {
                            //calculate alpha
                            var range = alphaMax - alphaMin,
                                alpha = d[serie.alphaField] / range * .8 - (alphaMin / range * .8) + .2;

                            //return new alpha
                            return alpha;;
                        }
                        else
                            return 1;
                    })
                    .style("stroke-width", 0)
                    .attr('width', neckW)
                    .attr('height', neckH)
                    .attr('y', neckY)
                    .attr('x', neckX)
                    .on('mousemove', function () {
                        //get data color
                        var balloonContent = chart.getSlicedFormat((chart.data.length - 1), serie);

                        //Show balloon
                        chart.showBalloon(balloonContent);

                        //Set hover for the current slice
                        d3.select(this).style('opacity', serie.hoverOpacity);

                        //check whether the neck is not null
                        d3.select(slices[0][chart.data.length - 1]).style('opacity', serie.hoverOpacity);
                    })
                    .on('mouseout', function () {
                        //Hide balloon
                        chart.hideBalloon();

                        //Remove opacity of the curent slice
                        d3.select(this).style('opacity', 1);

                        //check whether the neck is not null
                        d3.select(slices[0][chart.data.length - 1]).style('opacity', 1);
                    });
            }

            //check whether the serie is pyramid and reverse the funnel
            if (isPyramid)
                slices.attr('transform', 'translate(' + (funnelWidth) + ',' + (funnelHeight) + ')rotate(180)');

            //re-position legend texts and icons
            if(chart.legend.enabled) {
                //reposition texts
                legendTexts
                    .attr('x', chart.width - legendWidth - margin.left)
                    .attr('y', function(d, i) {
                        //calculate y position
                        var iconHeight = Math.sqrt(symbolSize) / 2,
                            y = ((chart.height - legendHeight) / 2) + ((chart.legend.fontSize + iconHeight) * i) - Math.sqrt(symbolSize);

                        //return y pos
                        return y;
                    });

                //reposition icons
                legendIcons
                    .attr('transform', function(d, i) {
                        //calculate x, y position
                        var bbox = this.getBBox(),
                            iconHeight = Math.sqrt(symbolSize) / 2,
                            x = chart.width - legendWidth - margin.left - Math.sqrt(symbolSize),
                            y = ((chart.height - legendHeight) / 2) + ((chart.legend.fontSize + iconHeight) * i) - (chart.legend.fontSize + iconHeight);

                        //return translation
                        return 'translate(' + x + ',' + y + ')';
                    });
            }

            //check whether the labels are enables
            if (serie.labelFormat !== '') {
                //add g for funnel labels
                var labelTexts = chart.svg.append('g').attr('class', 'eve-funnel-labels');

                //set labels
                chart.svg.select('.eve-funnel-labels')
                    .selectAll('text')
                    .data(chart.data)
                    .enter().append('text')
                    .style('fill', serie.labelFontColor)
                    .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                    .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                    .style("font-family", serie.labelFontFamily)
                    .style("font-size", serie.labelFontSize + 'px')
                    .style('text-anchor', 'left')
                    .text(function (d, i) { return chart.getSlicedFormat(i, serie, 'label'); })
                    .attr('transform', function (d, i) {
                        //get positions
                        var fSlice = slices[0][i].getBBox(),
                            bbox = this.getBBox(),
                            xPos = funnelWidth / 2 - bbox.width / 2,
                            yPos = fSlice.y + fSlice.height / 2 + bbox.height / 2;

                        //check whether the chart is pyramid
                        if (isPyramid)
                            yPos = (funnelHeight - fSlice.y) - fSlice.height / 2 + bbox.height / 2;

                        //return translation
                        return 'translate(' + xPos + ',' + yPos + ')';
                    });
            }
        }

        //init funnel
        init();

        //return chart object
        return chart;
    }

    //attach funnel method into eve
    e.funnelChart = function(options) {
        //set chart type
        options.type = 'funnel';

        return new funnel(options);
    }

    //attach donut method into eve
    e.pyramidChart = function(options) {
        //set chart type
        options.type = 'pyramid';

        return new funnel(options);
    }

})(eve);
(function(e) {
    //define default options
    var defaults = {
        behavior: 'linear', //linear, spLine, stepLine
        bullet: 'none',
        bulletAlpha: .5,
        bulletColor: '',
        bulletSize: 8,
        bulletStrokeSize: 1,
        bulletStrokeAlpha: 1,
        color: '',
        dateFormat: '',
        drawingStyle: 'solid', //solid, dashed, dotted
        labelFontColor: '#333333',
        labelFontFamily: 'Tahoma',
        labelFontSize: 10,
        labelFontStyle: 'normal',
        labelFormat: '',
        lineAlpha: 1,
        numberFormat: '',
        strokeSize: 1.5,
        title: '',
        type: 'line',
        yField: ''
    };

    //line chart class
    function line(options) {
        //check whether the options has series
        if(options.series == null && e.getType(options.series) !== 'array') {
            throw new Error('Invalid chart series!');
        }

        //iterate all series in options to extend them
        for(var i=0; i<options.series.length; i++) {
            //extend current serie with defaults
            e.extend(options.series[i], defaults);
        }

        //create chart
        var that = this,
            chart = e.charts.init(options),
            axis = e.charts.createAxis(chart),
            lineSeries, bulletSeries, lineF, bulletF;

        //handles zoom
        var zoom = d3.behavior.zoom().x(axis.x).y(axis.y).on("zoom", zoomHandler);
        function zoomHandler() {
            //re-draw axes
            chart.svg.select('.eve-x-axis').call(axis.xAxis);
            chart.svg.select('.eve-y-axis').call(axis.yAxis);

            //re-create x axis grid
			chart.svg.select(".eve-x-grid")
				.call(
                    axis.makeXAxis()
	                .tickSize(-axis.offset.height, 0, 0)
                );

            //re-create y axis grid
			chart.svg.select(".eve-y-grid")
				.call(
                    axis.makeYAxis()
				    .tickSize(-axis.offset.width, 0, 0)
                );

            //re-draw lineSeries
            chart.svg.selectAll('.eve-line-serie')
                .attr('d', function(d) {
                    return lineF(d.values);
                });

            //re-draw lineBullets
            chart.svg.selectAll('.eve-line-point')
                .attr('d', function(d) {
                    return bulletF(d);
                });
        }

        //attach zoomer
        if(chart.zoomable)
            chart.svg.call(zoom);

        //initializes line chart
        function init() {
            //create line function
            lineF = d3.svg.line()
                .x(function(d) { 
                    if(axis.xAxisDataType === 'string')
                        return axis.x(d.xValue) + axis.x.rangeBand() / 2;
                    else
                        return axis.x(d.xValue); 
                })
                .y(function(d) { return axis.y(d.yValue); });

            //create bullet function
            bulletF = d3.svg.symbol().type(function(d) {
                return chart.series[d.index].bullet === 'none' ? 'circle' : chart.series[d.index].bullet;
            }).size(function(d) {
                return Math.pow(chart.series[d.index].bulletSize, 2)
            });

            //set default balloon format
            if(chart.balloon.format === '')
                chart.balloon.format = '{x}: {y}';

            //create line series
            lineSeries = chart.svg.selectAll('.eve-series')
                .data(axis.series)
                .enter().append('g')
                .attr('class', 'eve-series');

            //append serie paths
            lineSeries.append('path')
                .attr('class', function (d, i) { return 'eve-line-serie eve-line-serie-' + i; })
                .attr('d', function (d, i) {
                    //set line style
                    if (chart.series[i].behavior === 'stepLine')
                        lineF.interpolate('step');
                    else if (chart.series[i].behavior === 'spLine')
                        lineF.interpolate('cardinal');

                    //return line function
                    return lineF(d.values);
                })
                .attr('transform', 'translate(' + axis.offset.left + ')')
                .style('fill', 'none')
                .style('stroke-width', function (d, i) { return chart.series[i].strokeSize + 'px'; })
                .style('stroke-opacity', function (d, i) { return chart.series[i].lineAlpha; })
                .style('stroke-dasharray', function (d, i) {
                    //check whether the serie line drawing style
                    if (chart.series[i].drawingStyle === 'dotted')
                        return '2, 2';
                    else if (chart.series[i].drawingStyle === 'dashed')
                        return '5, 2';
                    else
                        return '0';
                })
                .style('stroke', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= e.colors.length ? e.colors[i] : e.randColor();
                    else
                        return chart.series[i].color;
                });

            //set serie labels
            lineSeries.selectAll('.eve-line-label')
                .data(function(d) { return d.values; })
                .enter().append('text')
                .attr('class', function(d, i) { return 'eve-line-label eve-line-label-' + i; })
                .style('cursor', 'pointer')
                .style('fill', function(d, i) { return chart.series[d.index].labelFontColor; })
                .style('font-weight', function(d, i) { return chart.series[d.index].labelFontStyle == 'bold' ? 'bold' : 'normal'; })
                .style('font-style', function(d, i) { return chart.series[d.index].labelFontStyle == 'bold' ? 'normal' : chart.series[d.index].labelFontStyle; })
                .style("font-family", function(d, i) { return chart.series[d.index].labelFontFamily; })
                .style("font-size", function(d, i) { return chart.series[d.index].labelFontSize + 'px'; })
                .style('text-anchor', 'middle')
                .text(function(d, i) {
                    //check whether the label format is enabled
                    if(chart.series[d.index].labelFormat != '')
                        return chart.getXYFormat(d, chart.series[d.index], 'label');
                })
                .attr('transform', function(d) {
                    //return translated label positions
                    return 'translate(' + (axis.x(d.xValue) + axis.offset.left) + ',' + (axis.y(d.yValue) - chart.series[d.index].bulletSize) + ')';
                });

            //append serie points
            lineBullets = lineSeries.selectAll('.eve-line-point')
                .data(function (d) { return d.values; })
                .enter().append('path')
                .attr('class', function (d, i) { return 'eve-line-point eve-line-point-' + d.index; })
                .attr('d', function (d) { return bulletF(d); })
                .style('cursor', 'pointer')
                .style('fill', function (d) {
                    //check whether the serie has color
                    if (chart.series[d.index].color === '')
                        return d.index <= e.colors.length ? e.colors[d.index] : e.randColor();
                    else
                        return chart.series[d.index].color;
                })
                .style('stroke', function (d) {
                    //check whether the serie has color
                    if (chart.series[d.index].color === '')
                        return d.index <= e.colors.length ? e.colors[d.index] : e.randColor();
                    else
                        return chart.series[d.index].color;
                })
                .style('stroke-dasharray', 0)
                .style('stroke-width', function (d) { return chart.series[d.index].bulletStrokeSize + 'px'; })
                .style('stroke-opacity', 0)
                .style('fill-opacity', 0)
                .attr('transform', function (d) {
                    if(axis.xAxisDataType === 'string')
                        return 'translate(' + (axis.x(d.xValue) + axis.offset.left + (axis.x.rangeBand() / 2)) + ',' + axis.y(d.yValue) + ')';
                    else
                        return 'translate(' + (axis.x(d.xValue) + axis.offset.left) + ',' + axis.y(d.yValue) + ')';
                })
                .on('mousemove', function (d, i) {
                    var balloonContent = chart.getXYFormat(d, chart.series[d.index]);
                    
                    //show balloon
                    chart.showBalloon(balloonContent);

                    //increase bullet stroke size
                    d3.select(this)
                        .style('stroke-opacity', function (d) { return chart.series[d.index].bulletStrokeAlpha; })
                        .style('fill-opacity', function (d) { return chart.series[d.index].bulletAlpha; });
                })
                .on('mouseout', function(d, i) {
                    //hide balloon
                    chart.hideBalloon();

                    //increase bullet stroke size
                    d3.select(this)
                        .style('stroke-opacity', 0)
                        .style('fill-opacity', 0);
                });
        }

        //init line chart
        init();

        //return chart object
        return chart;
    };

    //attach line method into eve
    e.lineChart = function(options) {
        //set chart type
        options.type = 'line';

        return new line(options);
    };
})(eve);
(function(e) {
    //serie defaults
    var defaults = {
        alphaField: '',
        colorField: '',
        hoverOpacity: .9,
        labelPosition: 'inside',
        labelFontColor: '#ffffff',
        labelFontFamily: 'Tahoma',
        labelFontSize: 11,
        labelFontStyle: 'normal',
        labelFormat: '{percent}',
        sliceBorderOpacity: .1,
        titleField: '',
        valueField: '',
        valueFormat: ''
    };

    //pie chart class
    function pie(options) {
        //create chart
        var that = this,
            chart = e.charts.init(options),
            isDonut = options.type === 'donut',
            serie = e.extend(chart.series[0], defaults),
            transX = chart.width / 2,
            transY = chart.height / 2,
            pieWidth = chart.width,
            pieHeight = chart.height,
            pieData = d3.layout.pie().sort(null).value(function (d) { return d[serie.valueField]; }),
            key = function (d) { return d.data[serie.titleField]; },
            legendWidth = 0,
            legendHeight = 0,
            alphaMin = 0,
            alphaMax = 0,
            symbolSize = Math.pow(chart.legend.fontSize, 2),
            radius = Math.min(pieWidth, pieHeight) / 2,
            outerRadius = serie.labelFormat !== '' ? (serie.labelPosition === 'outside' ? radius * .8 : radius * .9) : radius * .9,
            innerRadius = isDonut ? radius / 2 : 0,
            slices, legendTexts, legendIcons;

        //check chart series
        if(chart.series.length === 0) {
            throw Error('Chart serie could not found!');
        }

        //set default balloon format
        if(chart.balloon.format === '')
            chart.balloon.format = '{title}: {value}';

        //set alpha size
        if(serie.alphaField !== '') {
            alphaMin = d3.min(chart.data, function(d) { return d[serie.alphaField]; })
            alphaMax = d3.max(chart.data, function(d) { return d[serie.alphaField]; })
        }

        //initializes pie chart
        function init() {
            //create legends
            if (chart.legend.enabled) {
                //add g for legend texts and icons
                chart.svg.append('g').attr('class', 'eve-legend-icon');
                chart.svg.append('g').attr('class', 'eve-legend-text');

                //set legend height
                legendHeight = chart.data.length * (chart.legend.fontSize + 5);

                //create legend texts
                legendTexts = chart.svg.select('.eve-legend-text').selectAll('text.eve-legend-text')
                    .data(pieData(chart.data), key)
                    .enter().insert('text')
                    .attr('class', 'eve-legend-text')
                    .style('cursor', 'pointer')
                    .style('fill', chart.legend.fontColor)
                    .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                    .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                    .style("font-family", chart.legend.fontFamily)
                    .style("font-size", chart.legend.fontSize + 'px')
                    .text(function (d, i) { return d.data[serie.titleField] })
                    .style("text-anchor", function(d, i) {
                        //calculate legend width
                        var textWidth = this.getBBox().width + chart.legend.fontSize;

                        //check textwidth > legendiwdth
                        if(textWidth > legendWidth)
                            legendWidth = textWidth;

                        return 'left';
                    })
                    .on('click', function(d, i) {
                        if(slices != null) {
                            //set data selected event
                            if (d.data.selected) { d.data.selected = false; } else { d.data.selected = true; }

                            //scale the current pie element
                            if (d.data.selected) {
                                //create selection
                                d3.select(slices[0][i])
                                    .style("stroke-opacity", 1)
                                    .transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', function () {
                                        //get new angle
                                        var newAngle = (d.startAngle + d.endAngle) / 2,
                                            newX = Math.sin(newAngle) * 5,
                                            newY = -Math.cos(newAngle) * 5;

                                        //return translation
                                        return 'translate(' + newX + ',' + newY + ')';
                                    });

                            } else {
                                d3.select(slices[0][i])
                                    .style("stroke-opacity", 0.1)
                                    .transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', 'translate(0,0)');
                            }
                        }

                        //check legendClick event handler to raise it
                        if(chart.legendClick)
                            chart.legendClick(d, i);
                    });

                //create legend icons
                legendIcons = chart.svg.select('.eve-legend-icon').selectAll('path.eve-legend-icon')
                    .data(pieData(chart.data), key)
                    .enter().insert('path')
                    .attr('d', d3.svg.symbol().type(chart.legend.icon).size(symbolSize))
                    .attr('class', 'eve-legend-icon')
                    .style('cursor', 'pointer')
                    .style('fill', function (d, i) {
                        if (slices !== undefined)
                            return d3.select(slices[0][i]).style('fill');

                        //check whether the serie has colorField
                        if (serie.colorField !== '')
                            return d.data[serie.colorField];
                        else
                            return i <= e.colors.length ? e.colors[i] : e.randColor();
                    })
                    .on('click', function(d, i) {
                        if(slices != null) {
                            //set data selected event
                            if (d.data.selected) { d.data.selected = false; } else { d.data.selected = true; }

                            //scale the current pie element
                            if (d.data.selected) {
                                //create selection
                                d3.select(slices[0][i])
                                    .style("stroke-opacity", 1)
                                    .transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', function () {
                                        //get new angle
                                        var newAngle = (d.startAngle + d.endAngle) / 2,
                                            newX = Math.sin(newAngle) * 5,
                                            newY = -Math.cos(newAngle) * 5;

                                        //return translation
                                        return 'translate(' + newX + ',' + newY + ')';
                                    });

                            } else {
                                d3.select(slices[0][i])
                                    .style("stroke-opacity", 0.1)
                                    .transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', 'translate(0,0)');
                            }
                        }

                        //check legendClick event handler to raise it
                        if(chart.legendClick)
                            chart.legendClick(d, i);
                    });

                //re-calculate x translation
                if(chart.legend.position === 'left')
                    transX = transX + legendWidth / 2;
                else
                    transX = transX - legendWidth / 2;

                //re-calculate pie width
                pieWidth -= legendWidth * 2;
                radius = Math.min(pieWidth, pieHeight) / 2;
                outerRadius = serie.labelFormat !== '' ? (serie.labelPosition === 'outside' ? radius * .8 : radius * .9) : radius * .9;
                innerRadius = isDonut ? radius / 2 : 0;
            }

            //append a new g into the svg
            chart.svg.append('g').attr('class', 'eve-pie-slices');

            //calculate pie area
            var arc = d3.svg.arc().outerRadius(outerRadius).innerRadius(innerRadius);

            //centralize svg canvas
            chart.svg.attr('transform', 'translate(' + transX + ',' + transY + ')');

            //create slices and attach data
            slices = chart.svg
                .select('.eve-pie-slices').selectAll('path.eve-pie-slice')
                .data(pieData(chart.data), key);

            //create slice paths
            slices.enter().insert('path')
                .style('fill', function (d, i) {
                    //check whether the serie has colorField
                    if (serie.colorField !== '')
                        return d.data[serie.colorField];
                    else
                        return i <= e.colors.length ? e.colors[i] : e.randColor();
                })
                .style('fill-opacity', function (d, i) {
                    //check whether the serie has alphaField
                    if (serie.alphaField !== '') {
                        //calculate alpha
                        var range = alphaMax - alphaMin,
                            alpha = d.data[serie.alphaField] / range * .8 - (alphaMin / range * .8) + .2;

                        //return new alpha
                        return alpha;;
                    }
                    else
                        return 1;
                })
                .style("stroke", serie.sliceBorderColor)
                .style("stroke-width", 1)
                .style("stroke-opacity", serie.sliceBorderOpacity)
                .attr('class', 'eve-pie-slice')
                .on('click', function (d, i) {
                    //set data selected event
                    if (d.data.selected) { d.data.selected = false; } else { d.data.selected = true; }

                    //scale the current pie element
                    if (d.data.selected) {
                        //create selection
                        d3.select(this)
                            .style("stroke-opacity", 1)
                            .transition()
                            .duration(chart.animationDuration / 2)
                            .attr('transform', function () {
                                //get new angle
                                var newAngle = (d.startAngle + d.endAngle) / 2,
                                    newX = Math.sin(newAngle) * 5,
                                    newY = -Math.cos(newAngle) * 5;

                                //return translation
                                return 'translate(' + newX + ',' + newY + ')';
                            });
                    } else {
                        d3.select(this)
                            .style("stroke-opacity", 0.1)
                            .transition()
                            .duration(chart.animationDuration / 2)
                            .attr('transform', 'translate(0,0)');
                    }

                    //check whether the serieClick event is not null
                    if (chart.serieClick)
                        chart.serieClick(d.data);
                })
                .on('mousemove', function (d, i) {
                    //get bubble content
                    var balloonContent = chart.getSlicedFormat(i, serie);

                    //show balloon
                    chart.showBalloon(balloonContent);

                    //set hover for the current slice
                    this.style['opacity'] = serie.hoverOpacity;
                })
                .on('mouseout', function (d) {
                    //hide balloon
                    chart.hideBalloon();

                    //set hover for the current slice
                    this.style['opacity'] = 1;
                });

            //set slice animation
            slices.transition().duration(chart.animationDuration)
               .attrTween('d', function (d) {
                   //set current data
                   this._current = this._current || d;

                   //set interpolation
                   var interpolated = d3.interpolate(this._current, d);

                   //set current as interpolated
                   this._current = interpolated(0);

                   //return interpolated arc
                   return function (t) {
                       return arc(interpolated(t));
                   };
               });

            //exit from slices
            slices.exit().remove();

            //re-position legend texts and icons
            if(chart.legend.enabled) {
                //reposition texts
                legendTexts
                    .attr('x', radius + Math.sqrt(symbolSize))
                    .attr('y', function(d, i) {
                        return ((legendHeight / chart.data.length) * i) - (legendHeight / 2) + chart.legend.fontSize;
                    });

                //reposition icons
                legendIcons
                    .attr('transform', function(d, i) {
                        //calculate x, y position
                        var bbox = this.getBBox(),
                            x = radius,
                            iconHeight = Math.sqrt(symbolSize) / 2,
                            y = ((legendHeight / chart.data.length) * i) - (legendHeight / 2) + chart.legend.fontSize - iconHeight;

                        //return translation
                        return 'translate(' + x + ',' + y + ')';
                    });
            }

            //check whether the labels are enabled
            if(serie.labelFormat !== '') {
                //add label g
                chart.svg.append('g').attr('class', 'eve-pie-labels');

                //check label position
                if(serie.labelPosition === 'inside') {
                    //create labels
                    chart.svg.select('.eve-pie-labels')
                        .selectAll('text')
                        .data(pieData(chart.data), key)
                        .enter().append('text')
                        .style('fill', serie.labelFontColor)
                        .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                        .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                        .style("font-family", serie.labelFontFamily)
                        .style("font-size", serie.labelFontSize + 'px')
                        .style('text-anchor', 'middle')
                        .text(function(d, i) { return chart.getSlicedFormat(i, serie, 'label'); })
                        .transition().duration(chart.animationDuration)
                        .attr('transform', function(d) { return 'translate(' + arc.centroid(d) + ')'; });
                } else {
                    //add g for label lines
                    chart.svg.append('g').attr('class', 'eve-pie-labels-lines');

                    //create label lines
                    chart.svg.select('.eve-pie-labels-lines')
                        .selectAll('line')
                        .data(pieData(chart.data), key)
                        .enter().append('line')
                        .style('stroke', function (d, i) {
                            if (serie.colorField !== '')
                                return d.data[serie.colorField];
                            else
                                return i <= e.colors.length ? e.colors[i] : e.randColor();
                        })
                        .style('stroke-width', 1)
                        .style('stroke-opacity', 0.2)
                        .transition().duration(chart.animationDuration)
                        .attr("x1", function (d) { return arc.centroid(d)[0]; })
                        .attr("y1", function (d) { return arc.centroid(d)[1]; })
                        .attr("x2", function (d) {
                            //get centroid
                            var centroid = arc.centroid(d);

                            //calculate middle point
                            var midAngle = Math.atan2(centroid[1], centroid[0]);

                            //calculate x position of the line
                            var x = Math.cos(midAngle) * (radius * 0.9);

                            //return x
                            return x;
                        })
                        .attr("y2", function (d) {
                            //get centroid
                            var centroid = arc.centroid(d);

                            //calculate middle point
                            var midAngle = Math.atan2(centroid[1], centroid[0]);

                            //calculate y position of the line
                            var y = Math.sin(midAngle) * (radius * 0.9);

                            //return y
                            return y;
                        });

                    //create labels
                    chart.svg.select('.eve-pie-labels')
                        .selectAll('text')
                        .data(pieData(chart.data), key)
                        .enter().append('text')
                        .style('fill', serie.labelFontColor)
                        .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                        .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                        .style("font-family", serie.labelFontFamily)
                        .style("font-size", serie.labelFontSize + 'px')
                        .text(function(d, i) { return chart.getSlicedFormat(i, serie, 'label'); })
                        .transition().duration(chart.animationDuration)
                        .attr('x', function (d) {
                            //Get centroid of the inner arc
                            var centroid = arc.centroid(d);

                            //Get middle angle
                            var midAngle = Math.atan2(centroid[1], centroid[0]);

                            //Calculate x position
                            var x = Math.cos(midAngle) * (radius * 0.9);

                            //Return x position
                            return x + (5 * ((x > 0) ? 1 : -1));
                        })
                        .attr('y', function (d) {
                            //Get centroid of the inner arc
                            var centroid = arc.centroid(d);

                            //Get middle angle
                            var midAngle = Math.atan2(centroid[1], centroid[0]);

                            //Return y position
                            return Math.sin(midAngle) * (radius * 0.9);
                        })
                        .style("text-anchor", function (d) {
                            //Get centroid of the inner arc
                            var centroid = arc.centroid(d);

                            //Get middle angle
                            var midAngle = Math.atan2(centroid[1], centroid[0]);

                            //Calculate x position
                            var x = Math.cos(midAngle) * (radius * 0.9);

                            //Return text anchor
                            return (x > 0) ? "start" : "end";
                        });

                }
            }
        }

        //init pie chart
        init();

        //return chart object
        return chart;
    };

    //attach pie method into eve
    e.pieChart = function(options) {
        //set chart type
        options.type = 'pie';

        return new pie(options, false);
    }

    //attach donut method into eve
    e.donutChart = function(options) {
        //set chart type
        options.type = 'donut';

        return new pie(options, true);
    }
})(eve);
(function(e) {
    //define default options
    var defaults = {
        bullet: 'none',
        bulletAlpha: .5,
        bulletColor: '',
        bulletSize: 8,
        bulletStrokeSize: 1,
        bulletStrokeAlpha: 1,
        color: '',
        dateFormat: '',
        labelFontColor: '#333333',
        labelFontFamily: 'Tahoma',
        labelFontSize: 10,
        labelFontStyle: 'normal',
        labelFormat: '',
        numberFormat: '',
        title: '',
        type: 'scatter',
        yField: ''
    };

    //scatter chart class
    function scatter(options) {
        //check whether the options has series
        if(options.series == null && e.getType(options.series) !== 'array') {
            throw new Error('Invalid chart series!');
        }

        //iterate all series in options to extend them
        for(var i=0; i<options.series.length; i++) {
            //extend current serie with defaults
            e.extend(options.series[i], defaults);
        }

        //create chart
        var that = this,
            chart = e.charts.init(options),
            axis = e.charts.createAxis(chart),
            scatterSeries, bulletF;

        //handles zoom
        var zoom = d3.behavior.zoom().x(axis.x).y(axis.y).on("zoom", zoomHandler);
        function zoomHandler() {
            //re-draw axes
            chart.svg.select('.eve-x-axis').call(axis.xAxis);
            chart.svg.select('.eve-y-axis').call(axis.yAxis);

            //re-create x axis grid
			chart.svg.select(".eve-x-grid")
				.call(
                    axis.makeXAxis()
	                .tickSize(-axis.offset.height, 0, 0)
                );

            //re-create y axis grid
			chart.svg.select(".eve-y-grid")
				.call(
                    axis.makeYAxis()
				    .tickSize(-axis.offset.width, 0, 0)
                );
        }

        //attach zoomer
        if(chart.zoomable)
            chart.svg.call(zoom);

        //initializes scatter chart
        function init() {
            //create bullet function
            bulletF = d3.svg.symbol().type(function(d) {
                return chart.series[d.index].bullet === 'none' ? 'circle' : chart.series[d.index].bullet;
            }).size(function(d) {
                return Math.pow(chart.series[d.index].bulletSize, 2)
            });

            //set default balloon format
            if(chart.balloon.format === '')
                chart.balloon.format = '{x}: {y}';

            //create scatter series
            scatterSeries = chart.svg.selectAll('.eve-series')
                .data(axis.series)
                .enter().append('g')
                .attr('class', 'eve-series');

            //set serie labels
            scatterSeries.selectAll('.eve-scatter-label')
                .data(function(d) { return d.values; })
                .enter().append('text')
                .attr('class', function(d, i) { return 'eve-scatter-label eve-scatter-label-' + i; })
                .style('cursor', 'pointer')
                .style('fill', function(d, i) { return chart.series[d.index].labelFontColor; })
                .style('font-weight', function(d, i) { return chart.series[d.index].labelFontStyle == 'bold' ? 'bold' : 'normal'; })
                .style('font-style', function(d, i) { return chart.series[d.index].labelFontStyle == 'bold' ? 'normal' : chart.series[d.index].labelFontStyle; })
                .style("font-family", function(d, i) { return chart.series[d.index].labelFontFamily; })
                .style("font-size", function(d, i) { return chart.series[d.index].labelFontSize + 'px'; })
                .style('text-anchor', 'middle')
                .text(function(d, i) {
                    //check whether the label format is enabled
                    if(chart.series[d.index].labelFormat != '')
                        return chart.getXYFormat(d, chart.series[d.index], 'label');
                })
                .attr('transform', function(d) {
                    //return translated label positions
                    return 'translate(' + (axis.x(d.xValue) + axis.offset.left) + ',' + (axis.y(d.yValue) - chart.series[d.index].bulletSize) + ')';
                });

            //append serie points
            scatterSeries.selectAll('.eve-scatter-point')
                .data(function (d) { return d.values; })
                .enter().append('path')
                .attr('class', function (d, i) { return 'eve-scatter-point eve-scatter-point-' + d.index; })
                .attr('d', function (d) { return bulletF(d); })
                .style('cursor', 'pointer')
                .style('fill', function (d) {
                    //check whether the serie has color
                    if (chart.series[d.index].color === '')
                        return d.index <= e.colors.length ? e.colors[d.index] : e.randColor();
                    else
                        return chart.series[d.index].color;
                })
                .style('stroke', function (d) {
                    //check whether the serie has color
                    if (chart.series[d.index].color === '')
                        return d.index <= e.colors.length ? e.colors[d.index] : e.randColor();
                    else
                        return chart.series[d.index].color;
                })
                .style('stroke-width', function (d) { return chart.series[d.index].bulletStrokeSize + 'px'; })
                .style('stroke-opacity', function (d) { return chart.series[d.index].bulletStrokeAlpha; })
                .style('stroke-dasharray', 0)
                .style('fill-opacity', function (d) { return chart.series[d.index].bulletAlpha; })
                .attr('transform', function (d) {
                    if (axis.xAxisDataType === 'string')
                        return 'translate(' + (axis.x(d.xValue) + axis.offset.left + (axis.x.rangeBand() / 2)) + ',' + axis.y(d.yValue) + ')';
                    else
                        return 'translate(' + (axis.x(d.xValue) + axis.offset.left) + ',' + axis.y(d.yValue) + ')';
                })
                .on('mousemove', function(d, i) {
                    var balloonContent = chart.getXYFormat(d, chart.series[d.index]);

                    //show balloon
                    chart.showBalloon(balloonContent);

                    //increase bullet stroke size
                    d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize + 1);
                })
                .on('mouseout', function(d, i) {
                    //hide balloon
                    chart.hideBalloon();

                    //increase bullet stroke size
                    d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize);
                });
        }

        //init scatter chart
        init();

        //return chart object
        return chart;
    };

    //attach scatter method into eve
    e.scatterChart = function(options) {
        //set chart type
        options.type = 'scatter';

        return new scatter(options);
    };
})(eve);
(function(e) {
    //define default options
    var defaults = {
        alpha: .7,
        bullet: 'none',
        bulletAlpha: .5,
        bulletColor: '',
        bulletSize: 8,
        bulletStrokeSize: 1,
        bulletStrokeAlpha: 1,
        color: '',
        dateFormat: '',
        labelFontColor: '#333333',
        labelFontFamily: 'Tahoma',
        labelFontSize: 10,
        labelFontStyle: 'normal',
        labelFormat: '',
        numberFormat: '',
        title: '',
        type: 'area',
        yField: ''
    };

    //area chart class
    function area(options) {
        //check whether the options has series
        if(options.series == null && e.getType(options.series) !== 'array') {
            throw new Error('Invalid chart series!');
        }

        //iterate all series in options to extend them
        for(var i=0; i<options.series.length; i++) {
            //extend current serie with defaults
            e.extend(options.series[i], defaults);
        }
        
        //create chart
        var that = this,
            chart = e.charts.init(options),
            axis = e.charts.createAxis(chart),
            areaSeries, bulletSeries, labelSeries,
            areaF, bulletF, stackF;
        
        //handles zoom
        var zoom = d3.behavior.zoom().x(axis.x).y(axis.y).on("zoom", zoomHandler);
        function zoomHandler() {
            //re-draw axes
            chart.svg.select('.eve-x-axis').call(axis.xAxis);
            chart.svg.select('.eve-y-axis').call(axis.yAxis);

            //re-create x axis grid
			chart.svg.select(".eve-x-grid")
				.call(
                    axis.makeXAxis()
	                .tickSize(-axis.offset.height, 0, 0)
                );

            //re-create y axis grid
			chart.svg.select(".eve-y-grid")
				.call(
                    axis.makeYAxis()
				    .tickSize(-axis.offset.width, 0, 0)
                );
        }

        //attach zoomer
        if(chart.zoomable)
            chart.svg.call(zoom);

        //initializes area chart
        function init() {
            //create stack function
            stackF = d3.layout.stack()
                .values(function (d) { return d.values; })
                .x(function (d) { return d.xValue; })
                .y(function (d) { return d.yValue; });

            //stack series
            stackF(axis.series);

            //create area function
            areaF = d3.svg.area()
                .x(function (d) {
                    if (axis.xAxisDataType === 'string')
                        return axis.x(d.xValue) + axis.x.rangeBand() / 2;
                    else
                        return axis.x(d.xValue);
                })
                .y0(function (d) {
                    return axis.y(d.y0);
                })
                .y1(function (d) {
                    return axis.y(d.y0 + d.y);
                });

            //create bullet function
            bulletF = d3.svg.symbol().type(function (d) {
                return chart.series[d.index].bullet === 'none' ? 'circle' : chart.series[d.index].bullet;
            }).size(function (d) {
                return Math.pow(chart.series[d.index].bulletSize, 2);
            });

            //set default balloon format
            if(chart.balloon.format === '')
                chart.balloon.format = '{x}: {y}';

            //create area series
            areaSeries = chart.svg.selectAll('.eve-series')
                .data(axis.series)
                .enter().append('g')
                .attr('class', 'eve-series');

            //append area paths
            areaSeries.append('path')
                .attr('class', function (d, i) { return 'eve-area-serie eve-area-serie-' + i; })
                .attr('d', function (d, i) {
                    //return area function
                    return areaF(d.values);
                })
                .attr('transform', 'translate(' + axis.offset.left + ')')
                .style('fill', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= e.colors.length ? e.colors[i] : e.randColor();
                    else
                        return chart.series[i].color;
                })
                .style('fill-opacity', function (d, i) { return chart.series[i].alpha; })
                .style('stroke-width', 1.5)
                .style('stroke-opacity', 1)
                .style('stroke', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= e.colors.length ? e.colors[i] : e.randColor();
                    else
                        return chart.series[i].color;
                });

            //append serie labels
            labelSeries = areaSeries.selectAll('.eve-area-labels')
                .data(axis.series)
                .enter().append('g')
                .attr('class', 'eve-area-labels');

            //set serie labels
            labelSeries.selectAll('.eve-area-label')
                .data(function(d) { return d.values; })
                .enter().append('text')
                .attr('class', function(d) { return 'eve-area-label eve-area-label-' + d.index; })
                .style('cursor', 'pointer')
                .style('fill', function(d) { return chart.series[d.index].labelFontColor; })
                .style('font-weight', function(d) { return chart.series[d.index].labelFontStyle == 'bold' ? 'bold' : 'normal'; })
                .style('font-style', function(d) { return chart.series[d.index].labelFontStyle == 'bold' ? 'normal' : chart.series[d.index].labelFontStyle; })
                .style("font-family", function(d) { return chart.series[d.index].labelFontFamily; })
                .style("font-size", function(d) { return chart.series[d.index].labelFontSize + 'px'; })
                .style('text-anchor', 'middle')
                .text(function(d, i) {
                    //check whether the label format is enabled
                    if(chart.series[d.index].labelFormat != '')
                        return chart.getXYFormat(d, chart.series[d.index], 'label');
                })
                .attr('transform', function(d) {
                    //return translated label positions
                    return 'translate(' + (axis.x(d.xValue) + axis.offset.left) + ',' + axis.y(d.y0 + d.y) + ')';
                });

            //append serie points
            bulletSeries = areaSeries.selectAll('.eve-area-points')
                .data(axis.series)
                .enter().append('g')
                .attr('class', 'eve-area-points');

            //set points
            bulletSeries.selectAll('.eve-area-point')
                .data(function (d) { return d.values; })
                .enter().append('path')
                .attr('class', function (d, i) { return 'eve-area-point eve-are-point-' + d.index; })
                .attr('d', bulletF)
                .style('cursor', 'pointer')
                .style('fill', '#ffffff')
                .style('stroke', function (d) {
                    //check whether the serie has color
                    if (chart.series[d.index].color === '')
                        return d.index <= e.colors.length ? e.colors[d.index] : e.randColor();
                    else
                        return chart.series[d.index].color;
                })
                .style('stroke-width', function (d) { return chart.series[d.index].bulletStrokeSize + 'px'; })
                .style('stroke-opacity', 0)
                .style('fill-opacity', 0)
                .attr('transform', function (d) {
                    if(axis.xAxisDataType === 'string')
                        return 'translate(' + (axis.x(d.xValue) + axis.offset.left + (axis.x.rangeBand() / 2)) + ',' + axis.y(d.y0 + d.y) + ')';
                    else
                        return 'translate(' + (axis.x(d.xValue) + axis.offset.left) + ',' + axis.y(d.y0 + d.y) + ')';
                })
                .on('mousemove', function (d, i) {
                    var balloonContent = chart.getXYFormat(d, chart.series[d.index]);

                    //show balloon
                    chart.showBalloon(balloonContent);

                    //increase bullet stroke size
                    d3.select(this)
                        .style('stroke-opacity', function (d) { return chart.series[d.index].bulletStrokeAlpha; })
                        .style('fill-opacity', function (d) { return chart.series[d.index].bulletAlpha; });
                })
                .on('mouseout', function(d, i) {
                    //hide balloon
                    chart.hideBalloon();

                    //increase bullet stroke size
                    d3.select(this)
                        .style('stroke-opacity', 0)
                        .style('fill-opacity', 0);
                })
        }

        //init area
        init();

        //return chart object
        return chart;
    }

    //attach area method into eve
    e.areaChart = function(options) {
        //set chart type
        options.type = 'area';

        return new area(options);
    };
})(eve);
(function(e) {
    //define default options
    var defaults = {
        alpha: 1,
        color: '',
        dateFormat: '',
        labelFontColor: '#333333',
        labelFontFamily: 'Tahoma',
        labelFontSize: 10,
        labelFontStyle: 'normal',
        labelFormat: '',
        numberFormat: '',
        strokeSize: 1,
        title: '',
        type: 'bar',
        yField: ''
    };

    //bar chart class
    function bar(options) {
        //check whether the options has series
        if(options.series == null && e.getType(options.series) !== 'array') {
            throw new Error('Invalid chart series!');
        }

        //iterate all series in options to extend them
        for(var i=0; i<options.series.length; i++) {
            //extend current serie with defaults
            e.extend(options.series[i], defaults);
        }

        //create chart
        var that = this,
            chart = e.charts.init(options),
            isReversed = chart.type === 'bar',
            axis = e.charts.createAxis(chart),
            barPadding = 25,
            groupAxis, stackedBars, stackedBarsRects, stackedBarsTexts,
            groupedBars, groupedBarsRects, groupedBarsTexts;

        //initializes bar chart
        function init() {
            //set default balloon format
            if(chart.balloon.format === '')
                chart.balloon.format = '{x}: {y}';
            
            //initialize bar chart via stack state
            if(chart.yAxis.stacked) {
                //create stacked bar chart
                createStackedBars();
            } else {
                //set range band
                var rangeBand = chart.type === 'bar' ? axis.y.rangeBand() : axis.x.rangeBand();

                //set group axis
                groupAxis = d3.scale.ordinal().domain(axis.serieNames).rangeRoundBands([0, rangeBand]);

                //create grouped bar chart
                createGroupedBars();
            }
        }

        //creates stacked bar chart
        function createStackedBars() {
            //manipulate chart data
            chart.data.forEach(function(d) {
                //set first y value
                var y0 = 0;

                //set series
                d.values = axis.serieNames.map(function(name) {
                    //set value object
                    var dataObj = {
                        name: 'name',
                        xValue: d[chart.xField],
                        yValue: +d[name],
                        y0: y0,
                        y1: y0 += +d[name]
                    };

                    //return data object
                    return dataObj;
                });

                //set serie total
                d.total = d.values[d.values.length - 1].y1;
            });

            //sort chart data
            chart.data.sort(function (a, b) { return b.total - a.total; });
            
            //check whether the axis is reversed
            /*if (isReversed)
                axis.x.domain([0, d3.max(chart.data, function (d) { return d.total; })]);
            else
                axis.y.domain([0, d3.max(chart.data, function (d) { return d.total; })]);*/

            //create stack bars on canvas
            stackedBars = chart.svg.selectAll('.eve-series')
                .data(chart.data)
                .enter().append('g')
                .attr('class', 'eve-series')
                .attr('transform', function (d) {
                    //check whether the chart is reversed
                    if (isReversed) {
                        return 'translate(' + axis.offset.left + ',' + (axis.y(d[chart.xField])) + ')';
                    } else {
                        return 'translate(' + (axis.x(d[chart.xField]) + axis.offset.left) + ',0)';
                    }
                });

            //create stacked bar rectangles
            stackedBarsRects = stackedBars.selectAll('rect')
                .data(function (d) { return d.values; })
                .enter().append('rect')
                .attr('class', function (d, i) { return 'eve-bar-serie eve-bar-serie-' + i; })
                .attr('width', function (d) { return isReversed ? (axis.x(d.y1) - axis.x(d.y0)) : axis.x.rangeBand(); })
                .attr('height', function (d) { return isReversed ? axis.y.rangeBand() : (axis.y(d.y0) - axis.y(d.y1)); })
                .style('fill', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= e.colors.length ? e.colors[i] : e.randColor();
                    else
                        return chart.series[i].color;
                })
                .style('stroke', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= e.colors.length ? e.colors[i] : e.randColor();
                    else
                        return chart.series[i].color;
                })
                .style('stroke-width', function (d, i) { return chart.series[i].strokeSize + 'px'; })
                .style('stroke-opacity', function (d, i) { return chart.series[i].alpha; })
                .style('fill-opacity', function (d, i) { return chart.series[i].alpha; })
                .on('mousemove', function(d, i) {
                    var balloonContent = chart.getXYFormat(d, chart.series[d.index]);

                    //show balloon
                    chart.showBalloon(balloonContent);

                    //increase bullet stroke size
                    d3.select(this)
                        .style('stroke-width', function (d) { return chart.series[i].strokeSize + 1; });
                })
                .on('mouseout', function(d, i) {
                    //hide balloon
                    chart.hideBalloon();

                    //increase bullet stroke size
                    d3.select(this)
                        .style('stroke-width', function (d) { return chart.series[i].strokeSize; });
                });

            //set serie labels
            stackedBarsTexts = stackedBars.selectAll('text')
                .data(function(d) { return d.values; })
                .enter().append('text')
                .attr('class', function(d, i) { return 'eve-bar-label eve-bar-label-' + i; })
                .style('cursor', 'pointer')
                .style('fill', function(d, i) { return chart.series[i].labelFontColor; })
                .style('font-weight', function(d, i) { return chart.series[i].labelFontStyle == 'bold' ? 'bold' : 'normal'; })
                .style('font-style', function(d, i) { return chart.series[i].labelFontStyle == 'bold' ? 'normal' : chart.series[i].labelFontStyle; })
                .style("font-family", function(d, i) { return chart.series[i].labelFontFamily; })
                .style("font-size", function(d, i) { return chart.series[i].labelFontSize + 'px'; })
                .text(function(d, i) {
                    //check whether the label format is enabled
                    if(chart.series[i].labelFormat != '')
                        return chart.getXYFormat(d, chart.series[i], 'label');
                });

            //check whether the chart is reversed
            if (isReversed) {
                stackedBarsRects.attr('x', function (d) { return axis.x(d.y0); });
                stackedBarsTexts
                    .attr('x', function (d, i) {
                        //return calculated x pos
                        return axis.x(d.y0) + (axis.x(d.y1) - axis.x(d.y0)) - this.getBBox().width - 2;
                    })
                    .attr('y', function (d, i) {
                        //return calculated y pos
                        return axis.y.rangeBand() - 2;
                    });
            } else {
                stackedBarsRects.attr('y', function (d) { return axis.y(d.y1); });
                stackedBarsTexts
                    .attr('x', function (d, i) {
                        //return calculated x pos
                        return (axis.x.rangeBand() / 2 - this.getBBox().width / 2);
                    })
                    .attr('y', function (d) {
                        //return calculated y pos
                        return axis.y(d.y1) + this.getBBox().height - 2;
                    });
            }
        }

        //creates grouped bar chart
        function createGroupedBars() {
            //set all values by series
            chart.data.forEach(function (d) {
                d.values = axis.serieNames.map(function (name) {
                    return {
                        name: name,
                        xValue: d[chart.xField],
                        yValue: +d[name]
                    };
                })
            });

            //get new y domain
            var newYDomain = [0, d3.max(chart.data, function (d) {
                return d3.max(d.values, function (v) {
                    return v.yValue * 1.1;
                });
            })];

            //check whether the chart is reversed
            if (isReversed) {
                //set new domain
                newYDomain = [d3.max(chart.data, function (d) {
                    return d3.max(d.values, function (v) {
                        return v.yValue * 1.1;
                    });
                }), 0];

                //update x axis
                axis.x.domain(newYDomain);
            } else {
                //update y axis
                axis.y.domain(newYDomain);
            }

            //get range band
            var rangeBand = groupAxis.rangeBand();

            //create bar groups on canvas
            groupedBars = chart.svg.selectAll('.eve-series')
                .data(chart.data)
                .enter().append('g')
                .attr('class', 'eve-series')
                .attr('transform', function (d) {
                    if (isReversed)
                        return 'translate(' + (axis.offset.left) + ',' + (axis.y(d[chart.xField])) + ')';
                    else
                        return 'translate(' + (axis.x(d[chart.xField]) + axis.offset.left) + ',0)';
                });

            //create bar group rectangles
            groupedBarsRects = groupedBars.selectAll('rect')
                .data(function (d) { return d.values; })
                .enter().append('rect')
                .attr('class', function (d, i) { return 'eve-bar-serie eve-bar-serie-' + i; })
                .attr('width', function (d) { return isReversed ? (axis.offset.width - axis.x(d.yValue)) : rangeBand; })
                .attr('x', function (d) { return isReversed ? 0 : groupAxis(d.name); })
                .attr('y', function (d) { return isReversed ? groupAxis(d.name) : axis.y(d.yValue); })
                .attr('height', function (d) { return isReversed ? rangeBand : (axis.offset.height - axis.y(d.yValue)); })
                .style('fill', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= e.colors.length ? e.colors[i] : e.randColor();
                    else
                        return chart.series[i].color;
                })
                .style('stroke', '#ffffff')
                .style('stroke-width', function (d, i) { return chart.series[i].strokeSize + 'px'; })
                .style('stroke-opacity', function (d, i) { return chart.series[i].alpha; })
                .style('fill-opacity', function (d, i) { return chart.series[i].alpha; })
                .on('mousemove', function(d, i) {
                    var balloonContent = chart.getXYFormat(d, chart.series[d.index]);

                    //show balloon
                    chart.showBalloon(balloonContent);

                    //increase bullet stroke size
                    d3.select(this)
                        .style('stroke-width', function (d) { return chart.series[i].strokeSize + 1; });
                })
                .on('mouseout', function(d, i) {
                    //hide balloon
                    chart.hideBalloon();

                    //increase bullet stroke size
                    d3.select(this)
                        .style('stroke-width', function (d) { return chart.series[i].strokeSize; });
                });

            //set serie labels
            groupedBarsTexts = groupedBars.selectAll('text')
                .data(function(d) { return d.values; })
                .enter().append('text')
                .attr('class', function(d, i) { return 'eve-bar-label eve-bar-label-' + i; })
                .style('cursor', 'pointer')
                .style('fill', function(d, i) { return chart.series[i].labelFontColor; })
                .style('font-weight', function(d, i) { return chart.series[i].labelFontStyle == 'bold' ? 'bold' : 'normal'; })
                .style('font-style', function(d, i) { return chart.series[i].labelFontStyle == 'bold' ? 'normal' : chart.series[i].labelFontStyle; })
                .style("font-family", function(d, i) { return chart.series[i].labelFontFamily; })
                .style("font-size", function(d, i) { return chart.series[i].labelFontSize + 'px'; })
                .text(function(d, i) {
                    //check whether the label format is enabled
                    if(chart.series[i].labelFormat != '')
                        return chart.getXYFormat(d, chart.series[i], 'label');
                })
                .attr('x', function(d, i) {
                    //return calculated x pos
                    return isReversed ? (axis.offset.width - axis.x(d.yValue)) : (i * rangeBand);
                })
                .attr('y', function(d, i) {
                    //return calculated y pos
                    return isReversed ? groupAxis(d.name) + rangeBand : axis.y(d.yValue) - 2;
                });
        }

        //init chart
        init();

        //return chart object
        return chart;
    }

    //attach bar method into eve
    e.barChart = function(options) {
        //set chart type
        options.type = 'bar';

        return new bar(options);
    };

    //attach bar method into eve
    e.columnChart = function(options) {
        //set chart type
        options.type = 'column';

        return new bar(options);
    };
})(eve);
(function(e) {
    //define default options
    var defaults = {
        bullet: 'none',
        bulletAlpha: .5,
        bulletColor: '',
        bulletSize: 8,
        bulletStrokeSize: 1,
        bulletStrokeAlpha: 1,
        color: '',
        dateFormat: '',
        labelFontColor: '#333333',
        labelFontFamily: 'Tahoma',
        labelFontSize: 10,
        labelFontStyle: 'normal',
        labelFormat: '',
        maxBulletSize: 50,
        minBulletSize: 5,
        numberFormat: '',
        title: '',
        type: 'bubble',
        yField: ''
    };

    //bubble chart class
    function bubble(options) {
        //check whether the options has series
        if(options.series == null && e.getType(options.series) !== 'array') {
            throw new Error('Invalid chart series!');
        }

        //iterate all series in options to extend them
        for(var i=0; i<options.series.length; i++) {
            //extend current serie with defaults
            e.extend(options.series[i], defaults);
        }

        //create chart
        var that = this,
            chart = e.charts.init(options),
            axis = e.charts.createAxis(chart),
            bubbleSeries, bulletF;

        //initializes bubble chart
        function init() {
            //create bullet function
            bulletF = d3.svg.symbol().type(function(d) {
                return chart.series[d.index].bullet === 'none' ? 'circle' : chart.series[d.index].bullet;
            }).size(function(d) {
                //get axis serie
                var chartSerie = chart.series[d.index];
                var axisSerie = axis.series[d.index];

                //check whether the chartSerie has sizeField
                if (chartSerie.sizeField !== '') {
                    //calculate bullet size
                    var axisSerieRange = axisSerie.maxSize - axisSerie.minSize,
                        chartSerieRange = chartSerie.maxBulletSize - chartSerie.minBulletSize,
                        bulletSize = d.sizeValue / axisSerieRange * chartSerieRange - (axisSerie.minSize / axisSerieRange * chartSerieRange) + chartSerie.minBulletSize;

                    //return calculated bullet size
                    return Math.pow(bulletSize, 2);
                } else {
                    //return default bullet size
                    return Math.pow(chartSerie.bulletSize, 2);
                }
            });

            //set default balloon format
            if(chart.balloon.format === '')
                chart.balloon.format = 'x: {x}: y: {y}, size: {size}';

            //create gradient
            var grads = chart.svg.append('defs').selectAll('radialGradient')
                .data(axis.series)
                .enter().append('radialGradient')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', '100%')
                .attr('id', function (d, i) { return 'eve-grad-' + i; })

            //append stops in grads
            grads.append('stop').attr('offset', '10%').attr('stop-color', '#ffffff');
            grads.append('stop').attr('offset', '100%').attr('stop-color', function (d, i) {
                //check whether the serie has color
                if (chart.series[i].color === '')
                    return i <= e.colors.length ? e.colors[i] : e.randColor();
                else
                    return chart.series[i].color;
            });

            //create bubble series
            bubbleSeries = chart.svg.selectAll('.eve-series')
                .data(axis.series)
                .enter().append('g')
                .attr('class', 'eve-series');

            //set serie labels
            bubbleSeries.selectAll('.eve-bubble-label')
                .data(function(d) { return d.values; })
                .enter().append('text')
                .attr('class', function (d, i) {
                    return 'eve-bubble-label eve-bubble-label-' + i;
                })
                .style('cursor', 'pointer')
                .style('fill', function(d, i) { return chart.series[d.index].labelFontColor; })
                .style('font-weight', function(d, i) { return chart.series[d.index].labelFontStyle == 'bold' ? 'bold' : 'normal'; })
                .style('font-style', function(d, i) { return chart.series[d.index].labelFontStyle == 'bold' ? 'normal' : chart.series[d.index].labelFontStyle; })
                .style("font-family", function(d, i) { return chart.series[d.index].labelFontFamily; })
                .style("font-size", function(d, i) { return chart.series[d.index].labelFontSize + 'px'; })
                .style('text-anchor', 'middle')
                .text(function(d, i) {
                    //check whether the label format is enabled
                    if(chart.series[d.index].labelFormat != '')
                        return chart.getXYFormat(d, chart.series[d.index], 'label');
                })
                .attr('transform', function(d) {
                    //get axis serie
                    var chartSerie = chart.series[d.index];
                    var axisSerie = axis.series[d.index];
                    var labelHeightPos = 0;
                    var bulletSize = 0;

                    //check whether the chartSerie has sizeField
                    if (chartSerie.sizeField !== '') {
                        //calculate bullet size
                        var axisSerieRange = axisSerie.maxSize - axisSerie.minSize,
                            chartSerieRange = chartSerie.maxBulletSize - chartSerie.minBulletSize;
                    
                        //set bullet size
                        bulletSize = d.sizeValue / axisSerieRange * chartSerieRange - (axisSerie.minSize / axisSerieRange * chartSerieRange) + chartSerie.minBulletSize;

                        //return calculated bullet size
                        labelHeightPos = bulletSize / 2;
                    } else {
                        //return default bullet size
                        labelHeightPos = chartSerie.bulletSize / 2;
                    }

                    //return translated label positions
                    return 'translate(' + (axis.x(d.xValue) + axis.offset.left) + ',' + (axis.y(d.yValue) - labelHeightPos - (chart.series[d.index].labelFontSize / 2) - bulletSize) + ')';
                });

            //append serie points
            bubbleSeries.selectAll('.eve-bubble-point')
                .data(function (d) { return d.values; })
                .enter().append('path')
                .attr('class', function (d, i) {
                    if (d.yValue === 0)
                        return 'eve-bubble-point-null eve-bubble-point-null-' + d.index;
                    else
                        return 'eve-bubble-point eve-bubble-point-' + d.index;
                })
                .attr('d', function (d) { return bulletF(d); })
                .style('cursor', 'pointer')
                .style('fill', function (d) {
                    return 'url(#eve-grad-' + d.index + ')';
                })
                .style('stroke', function (d) {
                    //check whether the serie has color
                    if (chart.series[d.index].color === '')
                        return d.index <= e.colors.length ? e.colors[d.index] : e.randColor();
                    else
                        return chart.series[d.index].color;
                })
                .style('stroke-width', function (d) { return chart.series[d.index].bulletStrokeSize + 'px'; })
                .style('stroke-opacity', function (d) {
                    if (d.yValue === 0) return 0;
                    return chart.series[d.index].bulletStrokeAlpha;
                })
                .style('stroke-dasharray', 0)
                .style('fill-opacity', function (d) {
                    if (d.yValue === 0) return 0;
                    return chart.series[d.index].bulletAlpha;
                })
                .attr('transform', function (d) {
                    //declare needed variables
                    var chartSerie = chart.series[d.index];
                    var axisSerie = axis.series[d.index];
                    var bulletSize = 0;
                
                    //check size field
                    if (chartSerie.sizeField !== '') {
                        //calculate bullet size
                        var axisSerieRange = axisSerie.maxSize - axisSerie.minSize,
                            chartSerieRange = chartSerie.maxBulletSize - chartSerie.minBulletSize;
                    
                        //set bullet size
                        bulletSize = d.sizeValue / axisSerieRange * chartSerieRange - (axisSerie.minSize / axisSerieRange * chartSerieRange) + chartSerie.minBulletSize;
                    }
                
                    //check x axis data type
                    if(axis.xAxisDataType === 'string')
                        return 'translate(' + (axis.x(d.xValue) + axis.offset.left + (axis.x.rangeBand() / 2)) + ',' + (axis.y(d.yValue) - bulletSize / 2) + ')';
                    else
                        return 'translate(' + (axis.x(d.xValue) + axis.offset.left) + ',' + (axis.y(d.yValue) - bulletSize / 2) + ')';
                })
                .on('mousemove', function (d, i) {
                    if (d.yValue === 0) return null;
                    var balloonContent = chart.getXYFormat(d, chart.series[d.index]);

                    //show balloon
                    chart.showBalloon(balloonContent);

                    //increase bullet stroke size
                    d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize + 1);
                })
                .on('mouseout', function(d, i) {
                    //hide balloon
                    chart.hideBalloon();

                    //increase bullet stroke size
                    d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize);
                });
        }

        //init bubble chart
        init();

        //return chart object
        return chart;
    };

    //attach bubble method into eve
    e.bubbleChart = function(options) {
        //set chart type
        options.type = 'bubble';

        return new bubble(options);
    };
})(eve);
