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
                    //get balloon content
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
