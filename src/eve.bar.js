/*!
 * eve.line.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Line chart class.
 */
(function(e) {
    //define default options
    var defaults = {
        alpha: 1,
        color: '',
        dateFormat: '',
        labelFontColor: '#ffffff',
        labelFontFamily: 'Tahoma',
        labelFontSize: 11,
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
            groupAxis, stackedBars, stackedBarsRects, groupedBars, groupedBarsRects;

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
            chart.data.sort(function(a, b) { return b.total - a.total; });

            //check whether the axis is reversed
            if (isReversed)
                axis.x.domain([0, d3.max(chart.data, function (d) { return d.total; })]);
            else
                axis.y.domain([0, d3.max(chart.data, function (d) { return d.total; })]);

            //check whether the chart is reversed
            if (isReversed) {
                //update x axis
                chart.svg.select('.eve-x-axis')
                    .call(axis.xAxis)
                    .selectAll('text')
                    .style('fill', chart.xAxis.labelFontColor)
                    .style('font-size', chart.xAxis.labelFontSize + 'px')
                    .style('font-family', chart.xAxis.labelFontFamily)
                    .style('font-style', chart.xAxis.labelFontStyle === 'bold' ? 'normal' : chart.yAxis.labelFontStyle)
                    .style('font-weight', chart.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('stroke-width', '0px');
            } else {
                //update y axis
                chart.svg.select('.eve-y-axis')
                    .call(axis.yAxis)
                    .selectAll('text')
                    .style('fill', chart.yAxis.labelFontColor)
                    .style('font-size', chart.yAxis.labelFontSize + 'px')
                    .style('font-family', chart.yAxis.labelFontFamily)
                    .style('font-style', chart.yAxis.labelFontStyle === 'bold' ? 'normal' : chart.yAxis.labelFontStyle)
                    .style('font-weight', chart.yAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('stroke-width', '0px');
            }

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

            //check whether the chart is reversed
            if (isReversed)
                stackedBarsRects.attr('x', function (d) { return axis.x(d.y0); });
            else
                stackedBarsRects.attr('y', function (d) { return axis.y(d.y1); });
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
