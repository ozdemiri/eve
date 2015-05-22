/*!
 * eve.charts.area.js
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
(function (eveCharts) {
    //area chart creator class
    function areaChart(chart, isStream) {
        //create plot and declare area chart variables
        var plot = chart.plot,
            axis, areaSeries, areaBullets, areaPoints;

        //create stack
        var stack = d3.layout.stack()
            .values(function (d) { return d.values; })
            .x(function (d) { return axis.x(d.xField); })
            .y(function (d) { return axis.y(d.yField); });

        //create area function
        var areaF = d3.svg.area()
            .x(function (d) { return axis.x(d.xField); })
            .y0(function (d) { return axis.y(d.y0); })
            .y1(function (d) { return axis.y(d.y0 + d.y); });

        //create line bullet
        var lineBullet = d3.svg.symbol().type(function (d) { return chart.series[d.index].bullet === 'none' ? 'circle' : chart.series[d.index].bullet; }).size(function (d) { return Math.pow(chart.series[d.index].bulletSize + 4, 2); });

        //create an internal function to create area series
        function createAreaSeries() {
            //create area series
            areaSeries = plot.canvas.selectAll('.eve-series')
                .data(axis.series)
                .enter().append('g')
                .attr('class', 'eve-series');

            //append serie line paths
            areaSeries.append('path')
                .attr('class', function (d, i) { return 'eve-area-serie eve-area-serie-' + i; })
                .attr('d', function (d, i) {
                    //set line style
                    if (chart.series[i].lineType === 'stepLine')
                        areaF.interpolate('step')
                    else if (chart.series[i].lineType === 'spLine')
                        areaF.interpolate('cardinal');

                    //return line function
                    return areaF(d.values);
                })
                .attr('transform', 'translate(' + axis.offset.left + ')')
                .style('fill', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                    else
                        return chart.series[i].color;
                })
                .style('fill-opacity', function (d, i) { return chart.series[i].alpha; })
                .style('stroke-width', function (d, i) { return chart.series[i].lineSize + 'px'; })
                .style('stroke-opacity', function (d, i) { return chart.series[i].lineAlpha; })
                .style('stroke', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                    else
                        return chart.series[i].color;
                });

            //append serie points
            areaBullets = areaSeries.selectAll('.eve-area-points')
                .data(axis.series)
                .enter().append('g')
                .attr('class', 'eve-area-points');

            //select all points
            areaPoints = areaBullets.selectAll('.eve-area-point')
                .data(function (d) { return d.values; })
                .enter().append('path')
                .attr('class', function (d, i) { return 'eve-area-point eve-are-point-' + d.index; })
                .attr('d', lineBullet)
                .style('cursor', 'pointer')
                .style('fill', function (d) {
                    return '#ffffff';
                    //check whether the serie has color
                    if (chart.series[d.index].color === '')
                        return d.index <= eveCharts.colors.length ? eveCharts.colors[d.index] : eve.randomColor();
                    else
                        return chart.series[d.index].color;
                })
                .style('stroke', function (d) {
                    //check whether the serie has color
                    if (chart.series[d.index].color === '')
                        return d.index <= eveCharts.colors.length ? eveCharts.colors[d.index] : eve.randomColor();
                    else
                        return chart.series[d.index].color;
                })
                .style('stroke-width', function (d) { return chart.series[d.index].bulletStrokeSize + 'px'; })
                .style('stroke-opacity', 0)
                .style('fill-opacity', 0)
                .attr('transform', function (d) { return 'translate(' + (axis.x(d.xField) + axis.offset.left) + ',' + axis.y(d.y0 + d.y) + ')'; })
                .on('mousemove', function (d, i) {
                    //get serie color
                    var serieColor = '',
                        balloonContent = chart.setBalloonContent({
                            data: d,
                            dataIndex: i,
                            format: chart.balloon.format,
                            serie: chart.series[d.index]
                        });
                    //formatValue(chart.balloon.format, d);

                    //check whether the serie has color
                    if (chart.series[d.index].color === '')
                        serieColor = d.index <= eveCharts.colors.length ? eveCharts.colors[d.index] : eve.randomColor();
                    else
                        serieColor = chart.series[d.index].color;

                    //set balloon border color
                    plot.balloon.style('borderColor', serieColor);

                    //Show balloon
                    chart.showBalloon(balloonContent);

                    //increase bullet stroke size
                    d3.select(this)
                        .style('stroke-opacity', chart.series[d.index].bulletAlpha)
                        .style('fill-opacity', chart.series[d.index].alpha);
                })
                .on('mouseout', function (d, i) {
                    //Hide balloon
                    chart.hideBalloon();

                    //decrease bullet stroke size
                    d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize)
                        .style('stroke-opacity', 0)
                        .style('fill-opacity', 0);
                });
        };

        //create an internal function to handle chart init
        function init() {
            //create axis
            axis = chart.createAxis();

            //set stack offset
            if (isStream) stack.offset('wiggle');

            //stack series
            stack(axis.series);

            //update axis domain
            axis.y.domain([
                0,
                d3.max(axis.series, function (d) {
                    return d3.max(d.values, function (d2) { return d2.y0 + d2.y; });
                })
            ]);

            //create area series
            createAreaSeries();
        };

        //init chart
        init();

        //return chart
        return chart;
    };

    //set eve charts create area chart method
    eveCharts.area = function (options) {
        /// <summary>
        /// Creates a new area chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'area';
                });
            }

            //create chart object
            var area = areaChart(new this.configurator(options), false);

            //add chart instance
            if (area !== null)
                this.instances[area.id] = area;

            //return new chart object
            return area;
        } else {
            //return null
            return null;
        }
    };

    //set eve charts create stream chart method
    eveCharts.stream = function (options) {
        /// <summary>
        /// Creates a new stream chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'area';
                });
            }

            //create chart object
            var stream = areaChart(new this.configurator(options), true);

            //add chart instance
            if (stream !== null)
                this.instances[stream.id] = stream;

            //return new chart object
            return stream;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts);