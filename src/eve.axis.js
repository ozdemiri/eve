/*!
 * eve.axis.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for chart axes.
 */
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
        if (chart.type !== 'bar' && chart.type !== 'column')
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

        //check whether the legend is not enabled
        if (!chart.legend.enabled)
            axisWidth -= chart.legend.fontSize * 2;

        //draws axis titles
        function drawTitles() {
            if(isReversed) {
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
                .style('font-style', chart.yAxis.labelFontStyle === 'bold' ? 'normal' : chart.yAxis.labelFontStyle)
                .style('font-weight', chart.yAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
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
                        return 'translate(-' + xMid + ', ' + (bbox.height * 2) + ')rotate(' + chart.yAxis.labelAngle + ')';
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
                .style('font-style', chart.xAxis.labelFontStyle === 'bold' ? 'normal' : chart.xAxis.labelFontStyle)
                .style('font-weight', chart.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
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
                .style('font-style', chart.xAxis.labelFontStyle === 'bold' ? 'normal' : chart.xAxis.labelFontStyle)
                .style('font-weight', chart.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
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
                .style('font-style', chart.yAxis.labelFontStyle === 'bold' ? 'normal' : chart.yAxis.labelFontStyle)
                .style('font-weight', chart.yAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
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
