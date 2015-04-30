/*!
 * eve.charts.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for chart.
 */
(function (eveCharts) {

    //plot creator class
    function chartPlot(chart) {
        //set members of the plot
        this.container = null;
        this.width = 0;
        this.height = 0;
        this.legendRateWidth = 0;
        this.legendRateHeight = 0;
        this.balloon = null;

        //check chart container's type
        if (eve.getType(chart.container) === 'string')
            this.container = eve('#' + chart.container);
        else if (eve.getType(chart.container) === 'htmlElement')
            this.container = eve(chart.container);
        else
            this.container = chart.container;

        //clear container content
        this.container.html('');

        //declare internal variables
        var autoWidth = chart.width === null || chart.width.toString().toLowerCase() === 'auto',
            autoHeight = chart.height === null || chart.height.toString().toLowerCase() === 'auto',
            offset = this.container.offset();

        //set dimension members
        this.width = offset.width - chart.margin.left - chart.margin.right;
        this.height = offset.height - chart.margin.top - chart.margin.bottom;
        this.legendRateWidth = chart.legend.enabled ? chart.legend.maxWidth : 0;
        this.legendRateHeight = chart.legend.enabled ? chart.legend.maxHeight : 0;

        //set chart container width
        if (!autoWidth)
            this.container.style('width', (eve.getType(chart.width) === 'number' ? chart.width + 'px' : chart.width));

        //set chart container height
        if (!autoHeight)
            this.container.style('height', (eve.getType(chart.height) === 'number' ? chart.height + 'px' : chart.height));

        //set chart background color
        this.container.style('backgroundColor', chart.backColor);

        //check whether the chart has borders
        if (chart.borderSize > 0) {
            //set chart border style
            this.container.style('borderStyle', chart.borderStyle);
            this.container.style('borderWidth', chart.borderSize + 'px');
            this.container.style('borderColor', chart.borderColor);
            this.container.style('borderRadius', chart.borderRadius + 'px');
        }

        //formats number
        this.formatNumber = function (value) {
            //declare variables
            var result = '';

            //check whether the chart has autoFormatting
            if (chart.formatNumbers) {
                //check value prefix
                if (chart.valuePrefix.trim() != '') result = chart.valuePrefix + ' ';

                //format number by chart config
                result += parseFloat(value).group(chart.decimalSeperator, chart.thousandSeperator, chart.precision);

                //check value suffix
                if (chart.valueSuffix.trim() != '') result += ' ' + chart.valueSuffix;
            } else {
                result = value;
            }

            //return result
            return result;
        };
    };

    //axis creator class
    function axis(chart, plot) {
        //set members of axis
        this.x = null;
        this.y = null;
        this.xAxis = null;
        this.yAxis = null;
        this.canvas = null;
        this.data = chart.data;
        this.series = null;
        this.yAxisLeftMargin = 0;
        this.xAxisBottomMargin = 0;
        this.legendWidthMargin = 0;
        this.legendHeightMargin = 0;
        
        //get first serie
        var base = this,
            xAxisType = eve.getDataType(chart.data, chart.xField),
            xAxis, xAxisTitle, xAxisLabels, yAxis, yAxisTitle, yAxisLabels,
            serieNames = [],
            maxValues = [],
            yDomains = [],
            legendIcons, legendTexts;

        //set canvas
        base.canvas = d3.select(plot.container.reference).append('svg')
            .attr('width', plot.width + chart.margin.left + chart.margin.right)
            .attr('height', plot.height + chart.margin.top + chart.margin.top)
            .append('g')
            .attr('transform', 'translate(' + chart.margin.left + ',' + chart.margin.top + ')');

        //set legend
        function setLegend() {
            //check whether the chart legends are enabled
            if (!chart.legend.enabled) return false;

            //check whether the chart legend icons and texts are already rendered
            if (legendIcons != null) legendIcons.remove();
            if (legendTexts != null) legendTexts.remove();
            
            //select legend icons
            legendIcons = base.canvas.selectAll('.eve-legend-icon').data(chart.series).enter().append('g');

            //select legend texts
            legendTexts = base.canvas.selectAll('.eve-legend-text').data(chart.series).enter().append('g');

            //create legend icons
            legendIcons.append('rect')
                .style('cursor', 'pointer')
                .style('fill', function (d, i) { return d.color === '' ? eveCharts.colors[i] : d.color; })
                .attr('class', 'eve-legend-icon')
                .attr('width', chart.legend.iconWidth)
                .attr('height', chart.legend.iconHeight);

            //create legend texts
            legendTexts.append('text')
                .style('cursor', 'pointer')
                .attr('class', 'eve-legend-text')
                .style('fill', chart.legend.fontColor)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style("font-family", chart.legend.fontFamily)
                .style("font-size", chart.legend.fontSize + 'px')
                .attr('dy', chart.legend.fontSize + 'px')
                .style("text-anchor", 'left')
                .text(function (d) { return d.title === '' ? d.yField : d.title; });

            //switch legend position to set 
            switch (chart.legend.position) {
                case 'left':
                    {
                        //calculate items height
                        var itemsHeight = chart.series.length * (chart.legend.iconHeight + chart.legend.fontSize) + 5;
                        
                        //set legend icons positions
                        legendIcons
                            .attr('transform', function (d, i) {
                                //calculate x
                                var xPos = chart.margin.left;

                                //calculate y
                                var yPos = (plot.height / 2 - itemsHeight) + ((chart.legend.fontSize + chart.legend.iconHeight) * i);

                                //return translation
                                return 'translate(' + xPos + ',' + yPos + ')';
                            });


                        //set legend texts positions
                        legendTexts
                            .attr('transform', function (d, i) {
                                //calculate x
                                var xPos = chart.margin.left + chart.legend.iconWidth + 5;

                                //calculate y
                                var yPos = (plot.height / 2 - itemsHeight) + ((chart.legend.fontSize + chart.legend.iconHeight) * i);

                                //return translation
                                return 'translate(' + xPos + ',' + yPos + ')';
                            });
                    }
                    break;
                case 'right':
                    {
                        //calculate items height
                        var itemsHeight = chart.series.length * (chart.legend.iconHeight + chart.legend.fontSize) + 5;
                        
                        //set legend icons positions
                        legendIcons
                            .attr('transform', function (d, i) {
                                //calculate x
                                var xPos = plot.width - chart.legend.maxTextWidth - chart.margin.right;

                                //calculate y
                                var yPos = (plot.height / 2 - itemsHeight) + ((chart.legend.fontSize + chart.legend.iconHeight) * i);

                                //return translation
                                return 'translate(' + xPos + ',' + yPos + ')';
                            });


                        //set legend texts positions
                        legendTexts
                            .attr('transform', function (d, i) {
                                //calculate x
                                var xPos = plot.width - chart.legend.maxTextWidth - chart.margin.right + chart.legend.iconWidth + 5;

                                //calculate y
                                var yPos = (plot.height / 2 - itemsHeight) + ((chart.legend.fontSize + chart.legend.iconHeight) * i);

                                //return translation
                                return 'translate(' + xPos + ',' + yPos + ')';
                            });
                    }
                    break;
            }
        }

        //draw axis
        function drawAxes(obj) {
            //Set x margin
            if (chart.yAxis.title != '') xTitleGap = chart.yAxis.titleFontSize;
            if (chart.xAxis.title != '') yTitleGap = chart.xAxis.titleFontSize;

            //set data range
            base.data.forEach(function (d) { d[base.yField] = +parseFloat(d[base.yField]); });

            //iterate all series
            chart.series.each(function (serie, serieIndex) { serieNames.push(serie.yField); });

            //set series
            base.series = serieNames.map(function (name) {
                return {
                    name: name,
                    values: base.data.map(function (d) {
                        //create an object
                        var valObj = {};
                        valObj['xField'] = chart.xAxis.parseAsDate ? new Date(d[chart.xField]) : d[chart.xField];
                        valObj['yField'] = +parseFloat(d[name]);

                        //return value object
                        return valObj;
                    })
                };
            });

            //iterate all series
            base.series.each(function (serie) {
                //push current serie max to max values
                maxValues.push(d3.max(serie.values, function (d) { return parseFloat(d.yField); }));

                //create serie min
                var serieMin = d3.min(base.series, function (c) { return d3.min(c.values, function (v) { return parseFloat(v.yField); }); });
                var serieMax = d3.max(base.series, function (c) { return d3.max(c.values, function (v) { return parseFloat(v.yField); }); });

                //set y domains
                yDomains.push(serieMin);
                yDomains.push(serieMax);
            });

            //get max value
            var maxValue = maxValues.max();
            base.yAxisLeftMargin = (maxValue.toString().length * chart.yAxis.labelFontSize / 2 + chart.margin.left);
            base.xAxisBottomMargin = chart.xAxis.labelFontSize + chart.margin.bottom;

            //set title margins
            if (chart.yAxis.title != '') base.yAxisLeftMargin += chart.yAxis.titleFontSize * 2;
            if (chart.xAxis.title != '') base.xAxisBottomMargin += chart.xAxis.titleFontSize * 2;

            //check whether the legends are enabled
            if (chart.legend.enabled) {
                //switch legend position
                switch (chart.legend.position) {
                    case 'left':
                    case 'right':
                        {
                            //set width and height margins
                            base.legendWidthMargin = chart.legend.maxTextWidth + chart.legend.iconWidth + 5;
                            base.legendHeightMargin = 0;
                        }
                        break;
                    case 'bottom':
                    case 'top':
                        {
                            //set width and height margins
                            base.legendWidthMargin = 0;
                            base.legendHeightMargin = chart.legend.iconHeight + chart.legend.fontSize;
                        }
                        break;
                }
            }

            //switch xAxis type
            switch (xAxisType) {
                case 'string':
                    {
                        //check whether the x axis should parsed as dates
                        if (chart.xAxis.parseAsDate)
                            base.x = d3.time.scale().range([0, plot.width - base.yAxisLeftMargin - chart.margin.left - chart.margin.right - base.legendWidthMargin]);
                        else
                            base.x = d3.scale.ordinal().rangeRoundBands([0, plot.width - base.yAxisLeftMargin - chart.margin.left - chart.margin.right - base.legendWidthMargin]);
                    }
                    break;
                case 'number':
                    {
                        //check whether the x axis should parsed as dates
                        if (chart.xAxis.parseAsDate)
                            base.x = d3.time.scale().range([0, plot.width - base.yAxisLeftMargin - chart.margin.left - chart.margin.right - base.legendWidthMargin]);
                        else
                            base.x = d3.scale.linear().range([0, plot.width - base.yAxisLeftMargin - chart.margin.left - chart.margin.right - base.legendWidthMargin]);
                    }
                    break;
                case 'dateTime':
                    base.x = d3.time.scale().range([0, plot.width - base.yAxisLeftMargin - chart.margin.left - chart.margin.right - base.legendWidthMargin]);
                    break;
            }

            //set this y
            base.y = d3.scale.linear().range([plot.height - chart.margin.top - chart.margin.bottom - base.xAxisBottomMargin - base.legendHeightMargin, 0]);

            //set this xAxis
            xAxis = d3.svg.axis().scale(base.x).orient('bottom');

            //set this yAxis
            yAxis = d3.svg.axis().scale(base.y).orient('left');

            //create x axis domain
            base.x.domain(d3.extent(base.data, function (d) { return chart.xAxis.parseAsDate ? new Date(d[chart.xField]) : d[chart.xField]; })).nice();

            //create y axis domain
            base.y.domain(yDomains).nice();

            //add y axis title if available
            if (chart.yAxis.title != '') {
                //create y axis title
                yAxisTitle = base.canvas.append('g').append('text')
                    .style('fill', chart.yAxis.titleFontColor)
                    .style('font-size', chart.yAxis.titleFontSize + 'px')
                    .style('font-family', chart.yAxis.titleFontFamily)
                    .style('font-style', chart.yAxis.titleFontStlye === 'bold' ? 'normal' : chart.yAxis.titleFontStyle)
                    .style('font-weight', chart.yAxis.titleFontStlye === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'middle')
                    .text(chart.yAxis.title)
                    .attr('transform', function (d) {
                        //check whether the legends are enabled
                        if (chart.legend.enabled) {
                            //switch legend position
                            switch (chart.legend.position) {
                                case 'left':
                                    return 'translate(' + (chart.margin.left + base.legendWidthMargin) + ',' + (plot.height / 2) + ')rotate(-90)';
                                case 'right':
                                    return 'translate(' + (chart.margin.left) + ',' + (plot.height / 2) + ')rotate(-90)';
                                case 'top':
                                    return 'translate(' + (chart.margin.left) + ',' + (plot.height / 2) + ')rotate(-90)';
                                case 'bottom':
                                    return 'translate(' + (chart.margin.left) + ',' + (plot.height / 2) + ')rotate(-90)';
                            }
                        } else {
                            return 'translate(' + (chart.margin.left) + ',' + (plot.height / 2) + ')rotate(-90)';
                        }
                    });
            }

            //create y axis
            base.yAxis = base.canvas.append('g')
                .style('fill', 'none')
                .style('stroke', chart.yAxis.color)
                .style('stroke-width', chart.yAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', function (d) {
                    //check whether the legends are enabled
                    if (chart.legend.enabled) {
                        //switch legend position
                        switch (chart.legend.position) {
                            case 'left':
                                return 'translate(' + (base.yAxisLeftMargin + base.legendWidthMargin) + ')';
                            case 'right':
                                return 'translate(' + (base.yAxisLeftMargin) + ')';
                            case 'top':
                                return 'translate(' + (base.yAxisLeftMargin) + ')';
                            case 'bottom':
                                return 'translate(' + (base.yAxisLeftMargin) + ')';
                        }
                    } else {
                        return 'translate(' + (base.yAxisLeftMargin) + ')';
                    }
                })
                .call(yAxis);

            //select all lines in yaxis
            base.yAxis.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', chart.yAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke', chart.yAxis.color);

            //select all texts in yaxis
            base.yAxis.selectAll('text')
                .style('fill', chart.yAxis.labelFontColor)
                .style('font-size', chart.yAxis.labelFontSize + 'px')
                .style('font-family', chart.yAxis.labelFontFamily)
                .style('font-style', chart.yAxis.labelFontStlye === 'bold' ? 'normal' : chart.yAxis.labelFontStlye)
                .style('font-weight', chart.yAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                .style('stroke-width', '0px');

            //add x axis title if available
            if (chart.xAxis.title != '') {
                //create x axis title
                xAxisTitle = base.canvas.append('g').append('text')
                    .style('fill', chart.xAxis.titleFontColor)
                    .style('font-family', chart.xAxis.titleFontFamily)
                    .style('font-size', chart.xAxis.titleFontSize + 'px')
                    .style('font-style', chart.xAxis.titleFontStlye === 'bold' ? 'normal' : chart.xAxis.titleFontStyle)
                    .style('font-weight', chart.xAxis.titleFontStlye === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'middle')
                    .attr('x', plot.width / 2)
                    .attr('y', plot.height - chart.margin.bottom)
                    .text(chart.xAxis.title);
            }

            //create x axis
            base.xAxis = base.canvas.append('g')
                .style('fill', 'none')
                .style('stroke', chart.xAxis.color)
                .style('stroke-width', chart.xAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', function (d) {
                    //check whether the legends are enabled
                    if (chart.legend.enabled) {
                        //switch legend pos
                        switch (chart.legend.position) {
                            case 'left':
                                return 'translate(' + (base.yAxisLeftMargin + base.legendWidthMargin) + ',' + (plot.height - chart.margin.bottom - chart.xAxis.labelFontSize - base.xAxisBottomMargin) + ')'
                            case 'right':
                                return 'translate(' + (base.yAxisLeftMargin) + ',' + (plot.height - chart.margin.bottom - chart.xAxis.labelFontSize - base.xAxisBottomMargin) + ')'
                            case 'top':
                                return 'translate(' + (base.yAxisLeftMargin) + ',' + (plot.height - chart.margin.bottom - chart.xAxis.labelFontSize - base.xAxisBottomMargin) + ')'
                            case 'bottom':
                                return 'translate(' + (base.yAxisLeftMargin) + ',' + (plot.height - chart.margin.bottom - chart.xAxis.labelFontSize - base.xAxisBottomMargin) + ')'
                        }
                    } else {
                        return 'translate(' + (base.yAxisLeftMargin) + ',' + (plot.height - chart.margin.bottom - chart.xAxis.labelFontSize - base.xAxisBottomMargin) + ')'
                    }
                })
                .call(xAxis);

            //select all lines in xaxis
            base.xAxis.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', chart.xAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke', chart.xAxis.color);

            //select all texts in xaxis
            base.xAxis.selectAll('text')
                .style('fill', chart.xAxis.labelFontColor)
                .style('font-size', chart.xAxis.labelFontSize + 'px')
                .style('font-family', chart.xAxis.labelFontFamily)
                .style('font-style', chart.xAxis.labelFontStlye === 'bold' ? 'normal' : chart.xAxis.labelFontStlye)
                .style('font-weight', chart.xAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                .style('stroke-width', '0px');
        }

        //set legend
        setLegend();

        //draw axes
        drawAxes();
    };

    //stores chart instances
    eveCharts.instances = {};

    //stores eve.charts version
    eveCharts.version = '0.0.1 beta';

    //stores constants to use in eve visualization library
    eveCharts.constants = {
        min: 'Min',
        max: 'Max',
        total: 'Total',
        average: 'Average',
        sum: 'Sum',
        count: 'Count',
        records: 'Records'
    };

    //stores chart colors in general
    eveCharts.colors = ['#83AA30', '#1499D3', '#4D6684', '#3D3D3D', '#B9340B', '#CEA45C', '#C5BE8B', '#498379', '#3F261C', '#E74700', '#F1E68F', '#FF976F', '#FF6464', '#554939', '#706C4D']

    //gets chart count
    eveCharts.getChartCount = function () {
        /// <summary>
        /// Gets total chart count.
        /// </summary>
        /// <returns type="number"></returns>

        //iterate all charts in instances
        var chartCount = 0;

        //iterate all keys in chart
        for (var key in this.instances) {
            //check whether the key has eveCharts word
            if (key.indexOf('eveCharts') > -1)
                chartCount++;
        };

        //return chart count
        return chartCount;
    };

    //removes given chart
    eveCharts.remove = function (chart) {
        /// <summary>
        /// Removes given chart from instances.
        /// </summary>
        /// <param name="chart"></param>
        if (this.instances[chart.id])
            delete this.instances[chart.id];
    };

    //create plot
    eveCharts.createPlot = function (chart) {
        //return new chartPlot object
        return new chartPlot(chart);
    };

    //create axis
    eveCharts.createAxis = function (chart, plot) {
        //return new axis object
        return new axis(chart, plot);
    }
})(eve.charts);