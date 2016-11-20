/*!
 * eve.base.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for eve charts.
 */
(function(e) {
    /**
     * Easing Types:
     * linear, quad, cubic, sin, exp, circle, elastic, back, bounce
     * 
     * Title Positions:
     * topLeft, topCenter, topRight, bottomLeft, bottomCenter, bottomRight
     */
    
    //define base class for visualizations
    function visualizationBase(options) {
        //declare needed variables
        var members = options ? e.extend(options, e.base.defaults) : e.base.defaults,
            that = this,
            element = members.container,
            offset = null;

        //set type of the base
        this.type = 'xy';

        //set type of the visaulization
        this.visualizationType = 'area';

        //set this members
        for(var key in members) {
            switch(key) {
                case 'tooltip':
                    {
                        that[key] = e.extend(members[key], e.base.tooltipDefaults);
                    }
                    break;
                case 'legend':
                    {
                        that[key] = e.extend(members[key], e.base.legendDefaults);
                    }
                    break;
                case 'xAxis':
                case 'yAxis':
                    {
                        that[key] = e.extend(members[key], e.base.axisDefaults);
                    }
                    break;
                case 'series':
                    {
                        var memberType = e.getType(members[key]);

                        if(memberType === 'array') {
                            that[key] = [];
                            members[key].forEach(function(m) {
                                that[key].push(e.extend(m, e.base.serieDefaults));
                            });
                        } else if(memberType === 'object') {
                            that[key] = [e.extend(members[key], e.base.serieDefaults)];
                        } else {
                            that[key] = [e.base.serieDefaults];
                        }
                    }
                    break;
                default:
                    {
                        that[key] = members[key];
                    }
                    break;
            }
        }

        //handle container error
        if(!that.container) {
            throw Error('Chart container could not found!');
        }

        //check if element is string
        if(e.getType(element) === 'string')
            element = document.getElementById(element);

        //clear element content
        element.innerHTML = '';

        //get element offset
        offset = e.offset(element);

        //set width
        if(that.width === 'auto')
            that.width = offset.width - that.margin.left - that.margin.right;
        else
            that.width = that.width - that.margin.left - that.margin.right;

        //set height
        if(that.height === 'auto')
            that.height = offset.height - that.margin.top - that.margin.bottom;
        else
            that.height = that.height - that.margin.top - that.margin.bottom;
        
        //set chart container location
        that.left = offset.left;
        that.top = offset.top;
        that.dataProps = e.getDataProperties(that.data);
        that.xFieldDataType = options.frozenXAxis ? options.frozenXAxis : (that.xField !== '' ? that.dataProps.columns[that.xField].type : 'string');
        that.serieNames = [];
        that.serieNameStability = {};
        that.normalizedData = null;
        that.reversedAxis = options.reversedAxis ? options.reversedAxis : false;
        
        //set aspect ratio
        that.aspectRatio = that.width / that.height;

        //create canvas
        that.svg = d3.select(element)
            .style('background-color', that.backColor)
            .style('border-color', that.border.color)
            .style('border-size', that.border.size)
            .style('border-style', that.border.style)
            .append('svg')
            .attr('id', that.container + '_svg')
            .attr('viewBox', '0 0 ' + that.width + ' ' + that.height)
            .attr('preserveAspectRatio', 'xMidYMid')
            .attr('width', that.width)
            .attr('height', that.height)
            .attr('fill', that.backColor)
            .attr('stroke', 'none');
        
        //set chart plot 
        that.plot = {
            width: that.width,
            height: that.height,
            left: that.margin.left,
            top: that.margin.top,
            right: that.margin.right,
            bottom: that.margin.bottom
        }; 

        //declare title objects
        var titleObject = null,
            titleOffset = null,
            titleDiv = null,
            legend = null,
            tooltip = null;

        //formats numbers
        that.formatNumber = function (value, format) {
            return isNaN(value) ? 0 : value.toFixed(2);
        };

        //formats date
        that.formatDate = function (value, format) {
            return value;
        };

        //declare chart domains
        that.domains = {
            x: [],
            y: []
        };

        //updates title
        that.updateTitle = function() {
            //check whether the title is empty
          	var content = arguments.length > 0 ? arguments[0] : that.title.content;

            //check whether the title object is not null
            if(titleObject === null) {
                //check whether the title content is not empty
                if(content !== '') {
                    //create chart title object
                    titleObject = that.svg
                        .append('foreignObject')
                        .attr('width', that.width);

                    //create chart title div
                    titleDiv = titleObject.append('xhtml:div')
                        .append('div')
                        .style('font-size', that.title.fontSize)
                        .style('color', that.title.fontColor)
                        .style('font-family', that.title.fontFamily + ', Arial, Helvetica, Ubuntu')
                        .style('padding-left', that.margin.left)
                        .style('padding-right', that.margin.right)
                        .style('font-style', that.title.fontStyle == 'bold' ? 'normal' : that.title.fontStyle)
                        .style('font-weight', that.title.fontStyle == 'bold' ? 'bold' : 'normal')
                        .style('text-align', function() {
                            //set alignment by position
                            switch(that.title.position) {
                                case 'topLeft':
                                case 'bottomLeft':
                                    return 'left';
                                case 'topRight':
                                case 'bottomRight':
                                    return 'right';
                                case 'topCenter':
                                case 'bottomCenter':
                                    return 'center';
                                default:
                                    return 'center';
                            }
                        })
                        .html(content);

                    //get title object's offset
                    titleOffset = titleDiv.node().getBoundingClientRect();

                    //update title object y position
                    titleObject
                        .transition(100)
                        .attr('y', function() {
                            //set alignment by position
                            switch(that.title.position) {
                                case 'bottomLeft':
                                case 'bottomRight':
                                case 'bottomCenter':
                                    return that.height - titleOffset.height;
                                default:
                                    return 0;
                            }
                        });
                }
            } else {
                //check whether the title is not empty
                if(content !== '') {
                    //update title
                    titleDiv.html(content);

                    //get title object's offset
                    titleOffset = titleDiv.node().getBoundingClientRect();

                    //reduce plot area height
                    that.plot.height -= titleOffset.height;

                    //update title object y position
                    titleObject
                        .transition(100)
                        .attr('y', function() {
                            //set alignment by position
                            switch(that.title.position) {
                                case 'bottomLeft':
                                case 'bottomRight':
                                case 'bottomCenter':
                                    return that.height - titleOffset.height;
                                default:
                                    return 0;
                            }
                        });
                }
            }

            //check if chart has title
            if (titleObject !== null && content !== '') {
                //check title position increase plot margin
                if (that.title.position.indexOf('top') > -1)
                    that.plot.top += titleOffset.height;
                else
                    that.plot.bottom += titleOffset.height;
            }
        };

        //gets serie index by name
        that.getSerieIndexByName = function (name) {
            var index = -1;
            that.series.forEach(function (serie, serieIndex) {
                if (serie.yField && serie.yField === name)
                    index = serieIndex;
                else if (serie.measureField && serie.measureField === name)
                    index = serieIndex;
                else if (serie.valueField && serie.valueField === name)
                    index = serieIndex;
            });
            return index;
        };

        //updates chart domain
        that.updateXYDomain = function () {
            //check whether the chart is an xy chart
            if (that.type === 'xy') {
                //declare needed variables
                var currentSerieColor = '';

                //set data serie names
                that.serieNames = [];

                //declare chart domains
                that.domains = {
                    x: [],
                    y: []
                };

                //iterate all chart series to set their contents
                that.series.forEach(function (serie, index) {
                    //create serie names
                    if (serie.yField && serie.yField !== '')
                        that.serieNames.push(serie.yField);
                    else if (serie.valueField && serie.valueField !== '')
                        that.serieNames.push(serie.valueField);
                    else if (serie.measureField && serie.measureField !== '')
                        that.serieNames.push(serie.measureField);

                    //set serie name stability
                    that.serieNameStability[that.serieNames[index]] = 0;

                    //set current serie color
                    currentSerieColor = index >= e.colors.length ? e.randColor() : e.colors[index];

                    //set serie color
                    if (serie.color === '')
                        serie.color = currentSerieColor;

                    //set slice stroke color
                    if (serie.sliceStrokeColor === '')
                        serie.sliceStrokeColor = currentSerieColor;
                });

                //iterate data to set totals
                that.data.forEach(function (d) {
                    //set total value for current data
                    d.total = 0;

                    //iterate all serie names to set total value
                    that.serieNames.forEach(function (name) {
                        //check if data has current serie
                        if (d[name] === undefined) {
                            //nullify current serie
                            d[name] = 0;
                        } else {
                            //update serie name stability
                            that.serieNameStability[name] += 1;
                        }

                        //increase total value
                        d.total += +d[name];
                    });
                });
                
                //check x axis data type to set x domain
                switch (that.xFieldDataType) {
                    case 'string':
                        {
                            //set x values as x domain
                            that.domains.x = e.getUniqueValues(that.data, that.xField);
                        }
                        break;
                    default:
                        {
                            //push min value for x domain
                            that.domains.x.push(that.xAxis.startsFromZero ? 0 : d3.min(that.data, function (d) { return d[that.xField]; }));

                            //push max value for x domain
                            that.domains.x.push(d3.max(that.data, function (d) { return d[that.xField]; }));
                        }
                        break;
                }

                //check whether the base has frozenYAxis
                if (options.frozenYAxis && options.frozenYAxis === 'string') {
                    //set y domain as string
                    that.domains.y = e.getUniqueValues(that.data, that.series[0].yField);
                } else {
                    //get minimum value y axis domain
                    var serieValues = [];
                    var minYValue = d3.min(that.data, function (currentData) {
                        serieValues = [];
                        that.serieNames.forEach(function (name) {
                            serieValues.push(+currentData[name]);
                        });
                        var currentMin = d3.min(serieValues);

                        if (that.yAxis.stacked)
                            return currentMin < 0 ? d3.sum(serieValues) : currentMin;
                        else
                            return currentMin;
                    });
                    
                    //get maximum value y axis domain
                    var maxYValue = d3.max(that.data, function (currentData) {
                        //check whether the chart y axis is stacked
                        if (that.yAxis.stacked) {
                            return currentData.total;
                        } else {
                            serieValues = [];
                            that.serieNames.forEach(function (name) {
                                serieValues.push(+currentData[name]);
                            });
                            return d3.max(serieValues);
                        }
                    });
                    
                    //push min value for y domain
                    that.domains.y.push(that.yAxis.startsFromZero ? 0 : minYValue);

                    //push max value for y domain
                    that.domains.y.push(that.frozenMaxY ? maxYValue : maxYValue * 1.1);
                }
            }
        };

        //updates standard domain
        that.updateStandardDomain = function () {
            //check whether the chart is standard
            if (that.type === 'standard') {
                //declare chart domains
                that.domains = {
                    x: [],
                    y: []
                };

                //set y domain min value
                that.domains.y.push(d3.min(that.data, function (d) {
                    if (that.series[0].yField)
                        return +d[that.series[0].yField];
                    else if (that.series[0].sizeField)
                        return +d[that.series[0].sizeField];
                    else if (that.series[0].measureField)
                        return +d[that.series[0].measureField];
                    else if (that.series[0].valueField)
                        return +d[that.series[0].valueField];
                }));

                //set y domain max value
                that.domains.y.push(d3.max(that.data, function (d) {
                    if (that.series[0].yField)
                        return +d[that.series[0].yField];
                    else if (that.series[0].sizeField)
                        return +d[that.series[0].sizeField];
                    else if (that.series[0].measureField)
                        return +d[that.series[0].measureField];
                    else if (that.series[0].valueField)
                        return +d[that.series[0].valueField];
                }));
            }
        };

        //updates chart domain
        that.updateMapDomain = function () {
            //declare needed variables
            var minValue = 0,
                maxValue = 0,
                minYValue = 0,
                maxYValue = 0;
          
            //check whether the chart is an xy chart
            switch(that.visualizationType) {
                case 'standardMap':
                case 'tileMap':
                    {
                        //declare chart domains
                        that.domains = {
                            y: []
                        };
                        
                        if (that.yAxis.startsFromZero)
                            //set minimum value if startsFromZero enabled
                            minYValue = 0;
                        else if (that.yAxis.min)
                            //set minimum value if y axis min is set
                            minYValue = that.yAxis.min;
                        else
                            //get minimum value y axis domain
                            minYValue = d3.min(that.data, function (a) { return parseFloat(a[that.series[0].valueField]); });
                        if (that.yAxis.max)
                            //set maximum value if y axis max is set
                            maxYValue = that.yAxis.max;
                        else
                            //get maximum value y axis domain
                            maxYValue = d3.max(that.data, function (a) { return parseFloat(a[that.series[0].valueField]); });

                        //push min value for y domain
                        that.domains.y.push(minYValue);

                        //push max value for y domain
                        that.domains.y.push(maxYValue);
                    }
                    break;
                case 'ddCartogram':
                    {
                        //declare chart domains
                        that.domains = {
                            y: [],
                            color: []
                        };

                        if (that.yAxis.startsFromZero)
                            //set minimum value if startsFromZero enabled
                            minValue = 0;
                        else if (that.yAxis.min)
                            //set minimum value if y axis min is set
                            minValue = that.yAxis.min;
                        else
                            //get minimum value y axis domain
                            minValue = d3.min(that.data, function (a) { return parseFloat(a[that.series[0].valueField]); });

                        if (that.yAxis.max)
                            //set maximum value if y axis max is set
                            maxValue = that.yAxis.max;
                        else
                            //get maximum value y axis domain
                            maxValue = d3.max(that.data, function (a) { return parseFloat(a[that.series[0].valueField]); });

                        //push min value for y domain
                        that.domains.y.push(minValue);

                        //push max value for y domain
                        that.domains.y.push(maxValue);

                        //get minimum value y axis domain
                        minValue = d3.min(that.data, function (a) { return parseFloat(a[that.series[0].colorField]); });
                        //get maximum value y axis domain
                        maxValue = d3.max(that.data, function (a) { return parseFloat(a[that.series[0].colorField]); });

                        //push min value for y domain
                        that.domains.color.push(minValue);

                        //push max value for y domain
                        that.domains.color.push(maxValue);
                    }
                    break;
                case 'routeMap':
                    {
                        //declare chart domains
                        that.domains = {
                            lat: [],
                            long: []
                        };

                        //check whether zoom is set
                        if (that.currTransform === null) {
                            //get minimum latitude
                            minValue = d3.min(that.data, function (a) { return parseFloat(a[that.series[0].latField]); });
                            //get maximum latitude
                            maxValue = d3.max(that.data, function (a) { return parseFloat(a[that.series[0].latField]); });

                            //push min value for latitude
                            that.domains.lat.push(minValue);

                            //push max value for latitude
                            that.domains.lat.push(maxValue);

                            //get minimum longitude
                            minValue = d3.min(that.data, function (a) { return parseFloat(a[that.series[0].longField]); });
                            //get maximum longitude
                            maxValue = d3.max(that.data, function (a) { return parseFloat(a[that.series[0].longField]); });

                            //push min value for longitude
                            that.domains.long.push(minValue);

                            //push max value for longitude
                            that.domains.long.push(maxValue);
                        }
                    }
                    break;
                case 'locationMap':
                    {
                        //declare chart domains
                        that.domains = {
                            y: [],
                            lat: [],
                            long: []
                        };

                        if (that.yAxis.startsFromZero)
                            //set minimum value if startsFromZero enabled
                            minValue = 0;
                        else if (that.yAxis.min)
                            //set minimum value if y axis min is set
                            minValue = that.yAxis.min;
                        else {
                            //check whether data has more than 1 row
                            if (that.data.length > 1)
                                //get minimum value y axis domain
                                minValue = d3.min(that.data, function (a) { return parseFloat(a[that.series[0].valueField]) ? parseFloat(a[that.series[0].valueField]) : 1 << 500; });
                            else
                                //get minimum value y axis domain
                                minValue = that.data[0][that.series[0].valueField];
                        }

                        if (that.yAxis.max)
                            //set maximum value if y axis max is set
                            maxValue = that.yAxis.max;
                        else {
                            //check whether data has more than 1 row
                            if (that.data.length > 1)
                                //get maximum value y axis domain
                                maxValue = d3.max(that.data, function (a) { return parseFloat(a[that.series[0].valueField]) ? parseFloat(a[that.series[0].valueField]) : 0; });
                            else
                                //get maximum value y axis domain
                                maxValue = that.data[0][that.series[0].valueField];
                        }

                        //push min value for y domain
                        that.domains.y.push(minValue);

                        //push max value for y domain
                        that.domains.y.push(maxValue);

                        //check whether zoom is set
                        if (that.currTransform === null) {
                            //get minimum latitude
                            minValue = d3.min(that.data, function (a) { return parseFloat(a[that.series[0].latField]); });
                            //get maximum latitude
                            maxValue = d3.max(that.data, function (a) { return parseFloat(a[that.series[0].latField]); });

                            //push min value for latitude
                            that.domains.lat.push(minValue);

                            //push max value for latitude
                            that.domains.lat.push(maxValue);

                            //get minimum longitude
                            minValue = d3.min(that.data, function (a) { return parseFloat(a[that.series[0].longField]); });
                            //get maximum longitude
                            maxValue = d3.max(that.data, function (a) { return parseFloat(a[that.series[0].longField]); });

                            //push min value for longitude
                            that.domains.long.push(minValue);

                            //push max value for longitude
                            that.domains.long.push(maxValue);
                        }
                    }
                    break;
                default:
                    {
                        //declare chart domains
                        that.domains = {
                            y: [],
                            lat: [],
                            long: []
                        };

                        if (that.yAxis.startsFromZero)
                            //set minimum value if startsFromZero enabled
                            minValue = 0;
                        else if (that.yAxis.min)
                            //set minimum value if y axis min is set
                            minValue = that.yAxis.min;
                        else {
                            //check whether data has more than 1 row
                            if (that.data.length > 1)
                                //get minimum value y axis domain
                                minValue = d3.min(that.data, function (a) { return parseFloat(a[that.series[0].valueField]) ? parseFloat(a[that.series[0].valueField]) : 1 << 500; });
                            else
                                //get minimum value y axis domain
                                minValue = that.data[0][that.series[0].valueField];
                        }

                        if (that.yAxis.max)
                            //set maximum value if y axis max is set
                            maxValue = that.yAxis.max;
                        else {
                            //check whether data has more than 1 row
                            if (that.data.length > 1)
                                //get maximum value y axis domain
                                maxValue = d3.max(that.data, function (a) { return parseFloat(a[that.series[0].valueField]) ? parseFloat(a[that.series[0].valueField]) : 0; });
                            else
                                //get maximum value y axis domain
                                maxValue = that.data[0][that.series[0].valueField];
                        }

                        //push min value for y domain
                        that.domains.y.push(minValue);

                        //push max value for y domain
                        that.domains.y.push(maxValue);

                        //check whether zoom is set
                        if (that.currTransform === null) {
                            //get minimum latitude
                            minValue = d3.min(that.data, function (a) { return parseFloat(a[that.series[0].latField]); });
                            //get maximum latitude
                            maxValue = d3.max(that.data, function (a) { return parseFloat(a[that.series[0].latField]); });

                            //push min value for latitude
                            that.domains.lat.push(minValue);

                            //push max value for latitude
                            that.domains.lat.push(maxValue);

                            //get minimum longitude
                            minValue = d3.min(that.data, function (a) { return parseFloat(a[that.series[0].longField]); });
                            //get maximum longitude
                            maxValue = d3.max(that.data, function (a) { return parseFloat(a[that.series[0].longField]); });

                            //push min value for longitude
                            that.domains.long.push(minValue);

                            //push max value for longitude
                            that.domains.long.push(maxValue);
                        }
                    }
            }
        };

        //updates tree domain
        that.updateTreeDomain = function () {
            //declare chart domains
            that.domains = {
                x: [],
                y: []
            };

            //get size and source field
            var sizeField = that.series[0].sizeField,
                sourceField = that.series[0].sourceField;

            //create pack
            var pack = d3.pack()
                .padding(2)
                .size([that.plot.width, that.plot.height]);

            //create hierarchical data
            var hierarchical = d3.hierarchy(that.data)
                .each(function (d) { if (/^other[0-9]+$/.test(d.data[sourceField])) d.data[sourceField] = null; })
                .sum(function (d) { return +d[sizeField]; })
                .sort(function (a, b) { return b.value - a.value; });

            //create nodes from hierarchical data
            var nodes = pack(hierarchical).descendants();

            //push min value
            that.domains.y.push(d3.min(nodes, function (d) { return d.value; }));
            that.domains.y.push(d3.max(nodes, function (d) { return d.value; }));
        };

        //shows tooltip
        that.showTooltip = function () {
            tooltip.show(Array.prototype.slice.call(arguments));
        };

        //hides tooltip
        that.hideTooltip = function () {
            tooltip.hide();
        };

        //updates legend
        that.updateLegend = function () {
            //update legend with the new data
            legend.update(that);
        };

        //gets content info from data and serie
        that.getContent = function (currentData, currentSerie, format) {
            //declare needed variables
            if (!format) return '';
            var content = format,
                data = currentData.data || currentData,
                tags = content.match(/{(.*?)}/g).map(function (val) { return val; }),
                serieName = currentSerie.title || currentSerie.yField || currentSerie.measureField || currentSerie.valueField || currentSerie.sizeField,
                alphaValue = data[currentSerie.alphaField],
                closeValue = data[currentSerie.closeField],
                columnValue = data[currentSerie.columnField],
                colorValue = data[currentSerie.colorField],
                dateValue = data[currentSerie.dateField],
                endValue = data[currentSerie.endField],
                groupValue = data[currentSerie.groupField],
                highValue = data[currentSerie.highField],
                labelValue = data[currentSerie.labelField],
                latValue = data[currentSerie.latField],
                longValue = data[currentSerie.longField],
                lowValue = data[currentSerie.lowField],
                markerValue = data[currentSerie.markerField],
                measureValue = data.measure || data[currentSerie.measureField],
                openValue = data[currentSerie.openField],
                rangeValue = data[currentSerie.rangeField],
                rowValue = data[currentSerie.rowField],
                sizeValue = data.sizeValue || data[currentSerie.sizeField],
                sourceValue = data[currentSerie.sourceField],
                startValue = data[currentSerie.startField],
                standardValue = data.value || data[currentSerie.valueField],
                xValue = data.xValue || data[currentSerie.xField],
                yValue = data.yValue || data[currentSerie.yField];
                
            //iterate tags
            tags.forEach(function (tag) {
                //split tag format
                var tagCleared = tag.replace('{', '').replace('}', ''),
                    tagFormatted = tagCleared.split(':'),
                    currentValue = '';

                //replace tag with the value

                switch (tagCleared) {
                    case 'value':
                        {
                            //set current value
                            currentValue = standardValue;
                        }
                        break;
                    case 'start':
                        {
                            //set current value
                            currentValue = startValue;
                        }
                        break;
                    case 'source':
                        {
                            //set current value
                            currentValue = sourceValue;
                        }
                        break;
                    case 'size':
                        {
                            //set current value
                            currentValue = sizeValue;
                        }
                        break;
                    case 'row':
                        {
                            //set current value
                            currentValue = rowValue;
                        }
                        break;
                    case 'range':
                        {
                            //set current value
                            currentValue = rangeValue;
                        }
                        break;
                    case 'measure':
                        {
                            //set current value
                            currentValue = measureValue;
                        }
                        break;
                    case 'open':
                        {
                            //set current value
                            currentValue = openValue;
                        }
                        break;
                    case 'marker':
                        {
                            //set current value
                            currentValue = markerValue;
                        }
                        break;
                    case 'low':
                        {
                            //set current value
                            currentValue = lowValue;
                        }
                        break;
                    case 'long':
                        {
                            //set current value
                            currentValue = longValue;
                        }
                        break;
                    case 'lat':
                        {
                            //set current value
                            currentValue = latValue;
                        }
                        break;
                    case 'label':
                        {
                            //set current value
                            currentValue = labelValue;
                        }
                        break;
                    case 'high':
                        {
                            //set current value
                            currentValue = highValue;
                        }
                        break;
                    case 'serie':
                        {
                            //set current value
                            currentValue = serieName;
                        }
                        break;
                    case 'group':
                        {
                            //set current value
                            currentValue = groupValue || serieName;
                        }
                        break;
                    case 'end':
                        {
                            //set current value
                            currentValue = endValue;
                        }
                        break;
                    case 'date':
                        {
                            //set current value
                            currentValue = dateValue;
                        }
                        break;
                    case 'color':
                        {
                            //set current value
                            currentValue = colorValue;
                        }
                        break;
                    case 'column':
                    case 'col':
                        {
                            //set current value
                            currentValue = columnValue;
                        }
                        break;
                    case 'alpha':
                        {
                            //set current value
                            currentValue = alphaValue;
                        }
                        break;
                    case 'close':
                        {
                            //set current value
                            currentValue = closeValue;
                        }
                        break;
                    case 'x':
                        {
                            //set current value
                            currentValue = xValue;
                        }
                        break;
                    case 'y':
                        {
                            //replace content
                            currentValue = yValue;
                        }
                        break;
                }

                //replace content
                content = content.replaceAll(tag, currentValue);
            });
            
            return content;
        };

        //update title
        that.updateTitle();

        //update xy domain
        if (that.type === 'xy')
            that.updateXYDomain();
        else if (that.type === 'map')
            that.updateMapDomain();
        else if (that.type === 'standard')
            that.updateStandardDomain();
        else if (that.type === 'tree')
            that.updateTreeDomain();
        
        //create legend if available
        legend = eve.base.createLegend(that);
        tooltip = eve.base.createTooltip(that);
    }

    //attach initialization method into the eve charts
    e.base.init = function(options, type) {
        return new visualizationBase(options, type);
    };
})(eve);