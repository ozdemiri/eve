/*!
 * eve.area.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Area chart class.
 */
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
