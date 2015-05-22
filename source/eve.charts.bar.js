/*!
 * eve.charts.bar.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Bar chart class.
 */
(function (eveCharts) {
    //bar chart creator class
    function barChart(chart, isReversed) {
        //create plot and axis
        var plot = chart.plot,
            axis, groupAxis, stackedBars, stackedBarsRects, groupedBars, groupedBarsRects;

        //create an internal function to create stacked bar chart
        function createStackedBars() {
            //set all values by series
            chart.data.each(function (d) {
                //hold first y value value
                var y0 = 0;

                //set serie values
                d.values = axis.serieNames.map(function (name) {
                    //set value object
                    var dataObj = {
                        name: 'name',
                        xField: d[chart.xField],
                        yField: +d[name],
                        y0: y0,
                        y1: y0 += +d[name]
                    };

                    //return data object
                    return dataObj;
                });

                //set serie total
                d.total = d.values[d.values.length - 1].y1;
            });

            //check whether the axis is reversed
            if (isReversed)
                axis.x.domain([0, d3.max(chart.data, function (d) { return d.total; })]);
            else
                axis.y.domain([0, d3.max(chart.data, function (d) { return d.total; })]);

            //check whether the chart is reversed
            if (isReversed) {
                //update x axis
                plot.canvas.select('.eve-x-axis')
                    .call(axis.xAxis)
                    .selectAll('text')
                    .style('fill', chart.xAxis.labelFontColor)
                    .style('font-size', chart.xAxis.labelFontSize + 'px')
                    .style('font-family', chart.xAxis.labelFontFamily)
                    .style('font-style', chart.xAxis.labelFontStlye === 'bold' ? 'normal' : chart.yAxis.labelFontStlye)
                    .style('font-weight', chart.xAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                    .style('stroke-width', '0px');
            } else {
                //update y axis
                plot.canvas.select('.eve-y-axis')
                    .call(axis.yAxis)
                    .selectAll('text')
                    .style('fill', chart.yAxis.labelFontColor)
                    .style('font-size', chart.yAxis.labelFontSize + 'px')
                    .style('font-family', chart.yAxis.labelFontFamily)
                    .style('font-style', chart.yAxis.labelFontStlye === 'bold' ? 'normal' : chart.yAxis.labelFontStlye)
                    .style('font-weight', chart.yAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                    .style('stroke-width', '0px');
            }

            //create stack bars on canvas
            stackedBars = plot.canvas.selectAll('.eve-series')
                .data(chart.data)
                .enter().append('g')
                .attr('class', 'eve-series')
                .attr('transform', function (d) {
                    //check whether the chart is reversed
                    if (isReversed) {
                        //check chart data type
                        if (chart.xAxis.dataType === 'number')
                            return 'translate(' + axis.offset.left + ',' + (axis.y(d[chart.xField]) - (groupAxis.rangeBand() / 2)) + ')';
                        else
                            return 'translate(' + axis.offset.left + ',' + (axis.y(d[chart.xField]) + (groupAxis.rangeBand() / 2)) + ')';
                    } else {
                        //check chart data type
                        if (chart.xAxis.dataType === 'number')
                            return 'translate(' + (axis.x(d[chart.xField]) + axis.offset.left - groupAxis.rangeBand() / 2) + ',0)';
                        else
                            return 'translate(' + (axis.x(d[chart.xField]) + axis.offset.left + groupAxis.rangeBand() / 2) + ',0)';
                    }
                });

            //create stacked bar rectangles
            stackedBarsRects = stackedBars.selectAll('rect')
                .data(function (d) { return d.values; })
                .enter().append('rect')
                .attr('class', function (d, i) { return 'eve-bar-serie eve-bar-serie-' + i; })
                .attr('width', function (d) { return isReversed ? (axis.x(d.y1) - axis.x(d.y0)) : groupAxis.rangeBand(); })
                .attr('height', function (d) { return isReversed ? groupAxis.rangeBand() : (axis.y(d.y0) - axis.y(d.y1)); })
                .style('fill', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                    else
                        return chart.series[i].color;
                })
                .style('stroke', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                    else
                        return chart.series[i].color;
                })
                .style('stroke-width', function (d, i) { return chart.series[i].lineSize + 'px'; })
                .style('stroke-opacity', function (d, i) { return chart.series[i].lineAlpha; })
                .style('fill-opacity', function (d, i) { return chart.series[i].alpha; })
                .on('mousemove', function (d, i) {
                    //get serie color
                    var serieColor = '',
                        balloonContent = chart.setBalloonContent({
                            data: d,
                            dataIndex: i,
                            format: chart.balloon.format,
                            serie: chart.series[d.index]
                        });;

                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        serieColor = i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                    else
                        serieColor = chart.series[i].color;

                    //set balloon border color
                    plot.balloon.style('borderColor', serieColor);

                    //Show balloon
                    chart.showBalloon(balloonContent);

                    //increase bullet stroke size
                    d3.select(this).style('stroke-width', chart.series[i].bulletStrokeSize + 1);
                })
                .on('mouseout', function (d, i) {
                    //Hide balloon
                    chart.hideBalloon();

                    //decrease bullet stroke size
                    d3.select(this).style('stroke-width', chart.series[i].bulletStrokeSize);
                });

            //check whether the chart is reversed
            if (isReversed) {
                stackedBarsRects.attr('x', function (d) { return axis.x(d.y0); });
            } else {
                stackedBarsRects.attr('y', function (d) { return axis.y(d.y1); });
            }

        };

        //create an internal function to create grouped bar chart
        function createGroupedBars() {
            //set all values by series
            chart.data.each(function (d) {
                d.values = axis.serieNames.map(function (name) {
                    return {
                        name: name,
                        xField: d[chart.xField],
                        yField: +d[name]
                    };
                })
            });

            //get new y domain
            var newYDomain = [0, d3.max(chart.data, function (d) {
                return d3.max(d.values, function (d2) {
                    return d2.yField * 1.1;
                });
            })];

            //check whether the chart is reversed
            if (isReversed) {
                //set new domain
                newYDomain = [d3.max(chart.data, function (d) {
                    return d3.max(d.values, function (d2) {
                        return d2.yField * 1.1;
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
            //console.log(groupAxis.range());
            groupedBars = plot.canvas.selectAll('.eve-series')
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
                .attr('width', function (d) { return isReversed ? (axis.offset.width - axis.x(d.yField)) : rangeBand; })
                .attr('x', function (d) { return isReversed ? 0 : groupAxis(d.name); })
                .attr('y', function (d) { return isReversed ? groupAxis(d.name) : axis.y(d.yField); })
                .attr('height', function (d) { return isReversed ? rangeBand : (axis.offset.height - axis.y(d.yField)); })
                .style('fill', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                    else
                        return chart.series[i].color;
                })
                .style('stroke', function (d, i) {
                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                    else
                        return chart.series[i].color;
                })
                .style('stroke-width', function (d, i) { return chart.series[i].lineSize + 'px'; })
                .style('stroke-opacity', function (d, i) { return chart.series[i].lineAlpha; })
                .style('fill-opacity', function (d, i) { return chart.series[i].alpha; })
                .on('mousemove', function (d, i) {
                    //get serie color
                    var serieColor = '',
                        balloonContent = chart.setBalloonContent({
                            data: d,
                            dataIndex: i,
                            format: chart.balloon.format,
                            serie: chart.series[d.index]
                        });;

                    //check whether the serie has color
                    if (chart.series[i].color === '')
                        serieColor = i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                    else
                        serieColor = chart.series[i].color;

                    //set balloon border color
                    plot.balloon.style('borderColor', serieColor);

                    //Show balloon
                    chart.showBalloon(balloonContent);

                    //increase bullet stroke size
                    d3.select(this).style('stroke-width', chart.series[i].bulletStrokeSize + 1);
                })
                .on('mouseout', function (d, i) {
                    //Hide balloon
                    chart.hideBalloon();

                    //decrease bullet stroke size
                    d3.select(this).style('stroke-width', chart.series[i].bulletStrokeSize);
                });
        };

        //create an internal function to init chart
        function init() {
            //get range band
            var rangeBand = 0,
                barPadding = 25;

            //create axis
            axis = chart.createAxis(isReversed);

            //switch x axis data type
            switch (chart.xAxis.dataType) {
                case 'string':
                    rangeBand = isReversed ? axis.y.rangeBand() : axis.x.rangeBand();
                    break;
                case 'date':
                    rangeBand = (isReversed ? plot.height : plot.width) / chart.data.length - barPadding + (barPadding / axis.series.length);
                    break;
                default:
                    rangeBand = (isReversed ? plot.height : plot.width) / chart.data.length - barPadding + (barPadding / axis.series.length);
                    break;
            }

            //create group axis
            groupAxis = d3.scale.ordinal().domain(axis.serieNames).rangeRoundBands([0, rangeBand]);

            //check whether the chart is istacked
            if (chart.yAxis.isStacked)
                createStackedBars();
            else
                createGroupedBars();
        };

        //init chart
        init();

        //return chart
        return chart;
    };


    //set eve charts create bar chart method
    eveCharts.bar = function (options) {
        /// <summary>
        /// Creates a new bar chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'bar';
                });
            }

            //get configuration
            var config = new this.configurator(options);

            //set x axis data type as string
            config.xAxis.dataType = 'string';

            //create chart object
            var bar = barChart(config, true);

            //add chart instance
            if (bar !== null)
                this.instances[bar.id] = bar;

            //return new chart object
            return bar;
        } else {
            //return null
            return null;
        }
    };

    //set eve charts create column chart method
    eveCharts.column = function (options) {
        /// <summary>
        /// Creates a new column chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'bar';
                });
            }

            //get configuration
            var config = new this.configurator(options);

            //set x axis data type as string
            config.xAxis.dataType = 'string';

            //create chart object
            var column = barChart(config, false);

            //add chart instance
            if (column !== null)
                this.instances[column.id] = column;

            //return new chart object
            return column;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts);