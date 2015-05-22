/*!
 * eve.charts.line.js
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
(function (eveCharts) {
    //line chart creator class
    function lineChart(chart) {
        //create plot and declare line chart variables
        var plot = chart.plot,
            axis, lineSeries, lineBullets;

        //create line function
        var lineF = d3.svg.line()
            .x(function (d) { return axis.x(d.xField); })
            .y(function (d) { return axis.y(d.yField); });

        //create line bullet
        var lineBullet = d3.svg.symbol().type(function (d) {
            return chart.series[d.index].bullet === 'none' ? 'circle' : chart.series[d.index].bullet;
        }).size(function (d) {
            return Math.pow(chart.series[d.index].bulletSize, 2);
        });

        //create an internal function to create error path
        function createErrorPath(d) {
            var serie = chart.series[d.index],
                h = serie.yErrorField === '' ? [-5, 5] : [(axis.y(d.yField - d.yErrorField) - axis.y(d.yField)), (axis.y(d.yField + d.yErrorField) - axis.y(d.yField))],
                w = serie.xErrorField === '' ? [-5, 5] : [(axis.x(d.xField - d.xErrorField) - axis.x(d.xField)), (axis.x(d.xField + d.xErrorField) - axis.x(d.xField))];

            //return path
            return "M 0," + h[0] + " L 0," + h[1] + " M " + w[0] + "," + h[1] + " L " + w[1] + "," + h[1] + " M " + w[0] + "," + h[0] + " L " + w[1] + "," + h[0];
        };

        //create an internal function to create line series
        function createLineSeries() {
            //create line series
            lineSeries = plot.canvas.selectAll('.eve-series')
                .data(axis.series)
                .enter().append('g')
                .attr('class', 'eve-series');

            //append serie line paths
            lineSeries.append('path')
                .attr('class', function (d, i) { return 'eve-line-serie eve-line-serie-' + i; })
                .attr('d', function (d, i) {
                    //set line style
                    if (chart.series[i].lineType === 'stepLine')
                        lineF.interpolate('step')
                    else if (chart.series[i].lineType === 'spLine')
                        lineF.interpolate('cardinal');

                    //return line function
                    return lineF(d.values);
                })
                .attr('transform', 'translate(' + axis.offset.left + ')')
                .style('fill', 'none')
                .style('stroke-width', function (d, i) { return chart.series[i].lineSize + 'px'; })
                .style('stroke-opacity', function (d, i) { return chart.series[i].lineAlpha; })
                .style('stroke-dasharray', function (d, i) {
                    //check whether the serie line drawing style
                    if (chart.series[i].lineDrawingStyle === 'dotted')
                        return '2, 2';
                    else if (chart.series[i].lineDrawingStyle === 'dashed')
                        return '5, 2';
                    else
                        return '0';
                })
                .style('stroke', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                    else
                        return chart.series[i].color;
                });

            //append serie points
            lineBullets = lineSeries.selectAll('.eve-line-point')
                .data(function (d) { return d.values; })
                .enter().append('path')
                .attr('class', function (d, i) { return 'eve-line-point eve-line-point-' + d.index; })
                .attr('d', function (d) { return chart.series[d.index].bullet === 'error' ? createErrorPath(d) : lineBullet(d); })
                .style('cursor', 'pointer')
                .style('fill', function (d) {
                    //check whether the serie bullet is error
                    if (chart.series[d.index].bullet === 'error') {
                        return 'none';
                    } else {
                        //check whether the serie has color
                        if (chart.series[d.index].color === '')
                            return d.index <= eveCharts.colors.length ? eveCharts.colors[d.index] : eve.randomColor();
                        else
                            return chart.series[d.index].color;
                    }
                })
                .style('stroke', function (d) {
                    //check whether the serie bullet is error
                    if (chart.series[d.index].bullet === 'error') {
                        return chart.series[d.index].lineColor;
                    } else {
                        //check whether the serie has color
                        if (chart.series[d.index].color === '')
                            return d.index <= eveCharts.colors.length ? eveCharts.colors[d.index] : eve.randomColor();
                        else
                            return chart.series[d.index].color;
                    }
                })
                .style('stroke-width', function (d) {
                    //check whether the serie bullet is error
                    if (chart.series[d.index].bullet === 'error') {
                        return chart.series[d.index].lineSize + 'px';
                    } else {
                        return chart.series[d.index].bulletStrokeSize + 'px';
                    }
                })
                .style('stroke-opacity', function (d) {
                    //check whether the serie bullet is error
                    if (chart.series[d.index].bullet === 'error') {
                        return chart.series[d.index].lineAlpha;
                    } else {
                        return chart.series[d.index].bulletStrokeAlpha;
                    }
                })
                .style('stroke-dasharray', function (d, i) {
                    //check whether the serie bullet is error
                    if (chart.series[d.index].bullet === 'error') {
                        //check whether the serie line drawing style
                        if (chart.series[d.index].errorDrawingStyle === 'dotted')
                            return '2, 2';
                        else if (chart.series[d.index].errorDrawingStyle === 'dashed')
                            return '5, 2';
                        else
                            return '0';
                    } else {
                        return '0';
                    }
                })
                .style('fill-opacity', function (d) {
                    //check whether the serie bullet is error
                    if (chart.series[d.index].bullet === 'error') {
                        return 0;
                    } else {
                        return chart.series[d.index].bulletAlpha;
                    }
                })
                .attr('transform', function (d) { return 'translate(' + (axis.x(d.xField) + axis.offset.left) + ',' + axis.y(d.yField) + ')'; })
                .on('mousemove', function (d, i) {
                    //get serie color
                    var serieColor = '',
                        balloonContent = chart.setBalloonContent({
                            data: d,
                            dataIndex: i,
                            format: chart.balloon.format,
                            serie: chart.series[d.index]
                        });

                    //check whether the serie has color
                    if (chart.series[d.index].color === '')
                        serieColor = d.index <= eveCharts.colors.length ? eveCharts.colors[d.index] : eve.randomColor();
                    else
                        serieColor = chart.series[d.index].color;

                    //set balloon border color
                    plot.balloon.style('borderColor', serieColor);

                    //Show balloon
                    chart.showBalloon(balloonContent);

                    //check whether the serie bullet is error
                    if (chart.series[d.index].bullet === 'error') {
                        //increase bullet stroke size
                        d3.select(this).style('stroke-width', chart.series[d.index].lineSize + 1);
                    } else {
                        //increase bullet stroke size
                        d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize + 1);
                    }
                })
                .on('mouseout', function (d, i) {
                    //Hide balloon
                    chart.hideBalloon();

                    //check whether the serie bullet is error
                    if (chart.series[d.index].bullet === 'error') {
                        //decrease bullet stroke size
                        d3.select(this).style('stroke-width', chart.series[d.index].lineSize);
                    } else {
                        //decrease bullet stroke size
                        d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize);
                    }
                });
        };

        //create an internal function to init chart
        function init() {
            //create axis
            axis = chart.createAxis();

            //create line series
            createLineSeries();
        };

        //init chart
        init();

        //return chart
        return chart;
    };


    //set eve charts create line chart method
    eveCharts.line = function (options) {
        /// <summary>
        /// Creates a new line chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'line';
                });
            }

            //create chart object
            var line = lineChart(new this.configurator(options));

            //add chart instance
            if (line !== null)
                this.instances[line.id] = line;

            //return new chart object
            return line;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts);