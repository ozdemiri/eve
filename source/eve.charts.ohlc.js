/*!
 * eve.charts.ohlc.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * OHLC and candlestick chart class.
 */
(function (eveCharts) {
    //ohlc chart creator class
    function ohlcChart(chart, isCandlestick) {
        //create plot and axis
        var plot = chart.plot,
            isUp = function (d) { return d.closeField > d.openField; },
            isDown = function (d) { return !isUp(d); },
            line = d3.svg.line().x(function (d) { return d.x; }).y(function (d) { return d.y; }),
            axis, ohlcSeries, ohlcLines, ohlcOpenSeries, ohlcOpenLines, ohlcCloseSeries, ohlcCloseLines, candlestickBarSeries, candlestickBars;

        //create an internal function to create ohlc series
        function createOHLCSeries() {
            //create ohlc series
            ohlcSeries = plot.canvas.selectAll('.eve-series').data(axis.series).enter().append('g').attr('class', 'eve-series');

            //create ohlc lines
            ohlcLines = ohlcSeries.selectAll('.eve-ohlc-serie')
                .data(function (d) { return d.values; })
                .enter().append('path')
                .attr('class', function (d, i) { return 'eve-ohlc-serie eve-ohlc-serie-' + d.index; })
                .attr('d', function (d, i) {
                    //return line function
                    return line([
                        { x: axis.x(d.xField) + axis.offset.left, y: axis.y(d.lowField) },
                        { x: axis.x(d.xField) + axis.offset.left, y: axis.y(d.highField) }
                    ]);
                })
                .style('stroke', function (d, i) { return isUp(d) ? chart.series[d.index].upDayColor : chart.series[d.index].downDayColor; })
                .style('stroke-width', function (d, i) { return chart.series[d.index].lineSize; })
                .style('stroke-opacity', function (d, i) { return chart.series[d.index].lineAlpha; })
                .style('stroke-dasharray', function (d, i) {
                    //check whether the serie line drawing style
                    if (chart.series[d.index].lineDrawingStyle === 'dotted')
                        return '2, 2';
                    else if (chart.series[d.index].lineDrawingStyle === 'dashed')
                        return '5, 2';
                    else
                        return '0';
                })
                .style('cursor', 'pointer')
                .on('mousemove', function (d, i) {
                    //get serie color
                    var serieColor = isUp(d) ? chart.series[d.index].upDayColor : chart.series[d.index].downDayColor,
                        balloonContent = chart.setBalloonContent({
                            data: d,
                            dataIndex: i,
                            format: chart.balloon.format,
                            serie: chart.series[d.index]
                        });;

                    //set balloon border color
                    plot.balloon.style('borderColor', serieColor);

                    //Show balloon
                    chart.showBalloon(balloonContent);
                })
                .on('mouseout', function (d, i) {
                    //Hide balloon
                    chart.hideBalloon();
                });

            //check whether the chart is candlestick
            if (isCandlestick) {
                //create candlestick bar series
                candlestickBarSeries = plot.canvas.selectAll('.eve-series-candlestick').data(axis.series).enter().append('g').attr('class', 'eve-series-candlestick');

                //create candlestick bars
                candlestickBars = candlestickBarSeries.selectAll('eve-candlestick-serie')
                    .data(function (d) { return d.values; })
                    .enter().append('rect')
                    .attr('class', function (d, i) { return 'eve-candlestick-serie eve-candlestick-serie-' + d.index; })
                    .style('fill', function (d, i) { return isUp(d) ? chart.series[d.index].upDayColor : chart.series[d.index].downDayColor; })
                    .attr('x', function (d, i) {
                        //calculate rect width
                        var rectWidth = chart.series[d.index].lineSize * 8;

                        //return x pos
                        return axis.x(d.xField) + axis.offset.left - rectWidth / 2;
                    })
                    .attr('y', function (d, i) { return isUp(d) ? axis.y(d.closeField) : axis.y(d.openField); })
                    .attr('width', function (d, i) { return chart.series[d.index].lineSize * 8; })
                    .attr('height', function (d, i) {
                        return isUp(d) ? (axis.y(d.openField) - axis.y(d.closeField)) : (axis.y(d.closeField) - axis.y(d.openField));
                    })
                    .on('mousemove', function (d, i) {
                        //get serie color
                        var serieColor = isUp(d) ? chart.series[d.index].upDayColor : chart.series[d.index].downDayColor,
                            balloonContent = chart.setBalloonContent({
                                data: d,
                                dataIndex: i,
                                format: chart.balloon.format,
                                serie: chart.series[d.index]
                            });

                        //set balloon border color
                        plot.balloon.style('borderColor', serieColor);

                        //Show balloon
                        chart.showBalloon(balloonContent);
                    })
                    .on('mouseout', function (d, i) {
                        //Hide balloon
                        chart.hideBalloon();
                    });
            } else {
                //create ohlc open series
                ohlcOpenSeries = plot.canvas.selectAll('.eve-series-open').data(axis.series).enter().append('g').attr('class', 'eve-series-open');

                //create ohlc close series
                ohlcCloseSeries = plot.canvas.selectAll('.eve-series-close').data(axis.series).enter().append('g').attr('class', 'eve-series-close');

                //create open ohlcOpenSeries
                ohlcOpenLines = ohlcOpenSeries.selectAll('.eve-ohlc-serie-open')
                    .data(function (d) { return d.values; })
                    .enter().append('path')
                    .attr('class', function (d, i) { return 'eve-ohlc-serie-open eve-ohlc-serie-open-' + d.index; })
                    .attr('d', function (d, i) {
                        //calculate tickwidth
                        var tickWidth = chart.series[d.index].lineSize * 4;

                        //return line function
                        return line([
                            { x: axis.x(d.xField) + axis.offset.left - tickWidth, y: axis.y(d.openField) },
                            { x: axis.x(d.xField) + axis.offset.left, y: axis.y(d.openField) }
                        ]);
                    })
                    .style('stroke', function (d, i) { return isUp(d) ? chart.series[d.index].upDayColor : chart.series[d.index].downDayColor; })
                    .style('stroke-width', function (d, i) { return chart.series[d.index].lineSize; })
                    .style('stroke-opacity', function (d, i) { return chart.series[d.index].lineAlpha; })
                    .style('stroke-dasharray', function (d, i) {
                        //check whether the serie line drawing style
                        if (chart.series[d.index].lineDrawingStyle === 'dotted')
                            return '2, 2';
                        else if (chart.series[d.index].lineDrawingStyle === 'dashed')
                            return '5, 2';
                        else
                            return '0';
                    })
                    .style('cursor', 'pointer')
                    .on('mousemove', function (d, i) {
                        //get serie color
                        var serieColor = isUp(d) ? chart.series[d.index].upDayColor : chart.series[d.index].downDayColor,
                            balloonContent = chart.setBalloonContent({
                                data: d,
                                dataIndex: i,
                                format: chart.balloon.format,
                                serie: chart.series[d.index]
                            });

                        //set balloon border color
                        plot.balloon.style('borderColor', serieColor);

                        //Show balloon
                        chart.showBalloon(balloonContent);
                    })
                    .on('mouseout', function (d, i) {
                        //Hide balloon
                        chart.hideBalloon();
                    });

                //create close lines
                ohlcCloseLines = ohlcCloseSeries.selectAll('.eve-ohlc-serie-close')
                    .data(function (d) { return d.values; })
                    .enter().append('path')
                    .attr('class', function (d, i) { return 'eve-ohlc-serie-close eve-ohlc-serie-close-' + d.index; })
                    .attr('d', function (d, i) {
                        //calculate tickwidth
                        var tickWidth = chart.series[d.index].lineSize * 4;

                        //return line function
                        return line([
                            { x: axis.x(d.xField) + axis.offset.left, y: axis.y(d.closeField) },
                            { x: axis.x(d.xField) + axis.offset.left + tickWidth, y: axis.y(d.closeField) }
                        ]);
                    })
                    .style('stroke', function (d, i) { return isUp(d) ? chart.series[d.index].upDayColor : chart.series[d.index].downDayColor; })
                    .style('stroke-width', function (d, i) { return chart.series[d.index].lineSize; })
                    .style('stroke-opacity', function (d, i) { return chart.series[d.index].lineAlpha; })
                    .style('stroke-dasharray', function (d, i) {
                        //check whether the serie line drawing style
                        if (chart.series[d.index].lineDrawingStyle === 'dotted')
                            return '2, 2';
                        else if (chart.series[d.index].lineDrawingStyle === 'dashed')
                            return '5, 2';
                        else
                            return '0';
                    })
                    .style('cursor', 'pointer')
                    .on('mousemove', function (d, i) {
                        //get serie color
                        var serieColor = isUp(d) ? chart.series[d.index].upDayColor : chart.series[d.index].downDayColor,
                            balloonContent = chart.setBalloonContent({
                                data: d,
                                dataIndex: i,
                                format: chart.balloon.format,
                                serie: chart.series[d.index]
                            });

                        //set balloon border color
                        plot.balloon.style('borderColor', serieColor);

                        //Show balloon
                        chart.showBalloon(balloonContent);
                    })
                    .on('mouseout', function (d, i) {
                        //Hide balloon
                        chart.hideBalloon();
                    });
            }
        };

        //create an internal function init chart
        function init() {
            //create axis
            axis = chart.createAxis();

            //create ohlc series
            createOHLCSeries(isCandlestick);
        };

        //init chart
        init();

        //return chart
        return chart;
    };


    //set eve charts create candlestick chart method
    eveCharts.candleStick = function (options) {
        /// <summary>
        /// Creates a new candlestick chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'candlestick';
                });
            }

            //create configurator
            var config = new this.configurator(options); config.legend.enabled = false;

            //create chart object
            var candlestick = ohlcChart(config, true);

            //add chart instance
            if (candlestick !== null)
                this.instances[candlestick.id] = candlestick;

            //return new chart object
            return candlestick;
        } else {
            //return null
            return null;
        }
    };

    //set eve charts create ohlc chart method
    eveCharts.ohlc = function (options) {
        /// <summary>
        /// Creates a new ohlc chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'ohlc';
                });
            }

            //create configurator
            var config = new this.configurator(options); config.legend.enabled = false;

            //create chart object
            var ohlc = ohlcChart(config, false);

            //add chart instance
            if (ohlc !== null)
                this.instances[ohlc.id] = ohlc;

            //return new chart object
            return ohlc;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts)