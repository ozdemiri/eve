/*!
 * eve.scatter.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Scatter chart class.
 */
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
        labelFontColor: '#ffffff',
        labelFontFamily: 'Tahoma',
        labelFontSize: 11,
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
                .attr('transform', function (d) { return 'translate(' + (axis.x(d.xValue) + axis.offset.left) + ',' + axis.y(d.yValue) + ')'; })
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
