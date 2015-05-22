/*!
 * eve.charts.scatter.js
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
(function (eveCharts) {
    //scatter chart creator class
    function scatterChart(chart, isBubble) {
        //create plot and axis
        var plot = chart.plot,
            axis, scatterSeries, scatterBullets;

        //create scatter bullet
        var scatterBullet = d3.svg.symbol().type(function (d) {
            return chart.series[d.index].bullet === 'none' ? 'circle' : chart.series[d.index].bullet;
        }).size(function (d) {
            //get axis serie
            var chartSerie = chart.series[d.index];
            var axisSerie = axis.series[d.index];

            //check whether the chartSerie has sizeField
            if (chartSerie.sizeField !== '') {
                //calculate bullet size
                var axisSerieRange = axisSerie.maxSize - axisSerie.minSize,
                    chartSerieRange = chartSerie.maxBulletSize - chartSerie.minBulletSize,
                    bulletSize = d.sizeField / axisSerieRange * chartSerieRange - (axisSerie.minSize / axisSerieRange * chartSerieRange) + chartSerie.minBulletSize;

                //return calculated bullet size
                return Math.pow(bulletSize, 2);
            } else {
                //return default bullet size
                return Math.pow(chartSerie.bulletSize, 2);
            }
        });

        //create an internal function to create error path
        function createErrorPath(d) {
            var serie = chart.series[d.index],
                h = serie.yErrorField === '' ? [-5, 5] : [(axis.y(d.yField - d.yErrorField) - axis.y(d.yField)), (axis.y(d.yField + d.yErrorField) - axis.y(d.yField))],
                w = serie.xErrorField === '' ? [-5, 5] : [(axis.x(d.xField - d.xErrorField) - axis.x(d.xField)), (axis.x(d.xField + d.xErrorField) - axis.x(d.xField))];

            //return path
            return "M 0," + h[0] + " L 0," + h[1] + " M " + w[0] + "," + h[1] + " L " + w[1] + "," + h[1] + " M " + w[0] + "," + h[0] + " L " + w[1] + "," + h[0];
        };

        //create an internal function to create scatter points
        function createScatterPoints() {
            //create scatter series
            scatterSeries = plot.canvas.selectAll('.eve-series')
                .data(axis.series)
                .enter().append('g')
                .attr('class', 'eve-series');

            //create gradient
            var grads = plot.canvas.append('defs').selectAll('radialGradient')
                .data(axis.series)
                .enter().append('radialGradient')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', '100%')
                .attr('id', function (d, i) { return 'eve-grad-' + i; })

            //append stops in grads
            grads.append('stop').attr('offset', '10%').attr('stop-color', '#ffffff');
            grads.append('stop').attr('offset', '100%').attr('stop-color', function (d, i) {
                //check whether the serie has color
                if (chart.series[i].color === '')
                    return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                else
                    return chart.series[i].color;
            });

            //append serie points
            scatterBullets = scatterSeries.selectAll('.eve-scatter-point')
                .data(function (d) { return d.values; })
                .enter().append('path')
                .attr('class', function (d, i) { return 'eve-scatter-point eve-scatter-point-' + d.index; })
                .attr('d', function (d) {
                    if (isBubble) return scatterBullet(d);
                    return chart.series[d.index].bullet === 'error' ? createErrorPath(d) : scatterBullet(d);
                })
                .style('cursor', 'pointer')
                .style('fill', function (d) {
                    if (isBubble) {
                        return 'url(#eve-grad-' + d.index + ')';
                    } else {
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
                    }
                })
                .style('stroke', function (d) {
                    if (isBubble) {
                        //check whether the serie has color
                        if (chart.series[d.index].color === '')
                            return d.index <= eveCharts.colors.length ? eveCharts.colors[d.index] : eve.randomColor();
                        else
                            return chart.series[d.index].color;
                    } else {
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
                    }
                })
                .style('stroke-width', function (d) {
                    if (isBubble) {
                        return chart.series[d.index].bulletStrokeSize + 'px';
                    } else {
                        //check whether the serie bullet is error
                        if (chart.series[d.index].bullet === 'error') {
                            return chart.series[d.index].lineSize + 'px';
                        } else {
                            return chart.series[d.index].bulletStrokeSize + 'px';
                        }
                    }
                })
                .style('stroke-opacity', function (d) {
                    if (isBubble) {
                        return chart.series[d.index].bulletStrokeAlpha;
                    } else {
                        //check whether the serie bullet is error
                        if (chart.series[d.index].bullet === 'error') {
                            return chart.series[d.index].lineAlpha;
                        } else {
                            return chart.series[d.index].bulletStrokeAlpha;
                        }
                    }
                })
                .style('stroke-dasharray', function (d, i) {
                    if (isBubble) {
                        return '0';
                    } else {
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
                    }
                })
                .style('fill-opacity', function (d) {
                    if (isBubble) {
                        return chart.series[d.index].bulletAlpha;
                    } else {
                        //check whether the serie bullet is error
                        if (chart.series[d.index].bullet === 'error') {
                            return 0;
                        } else {
                            return chart.series[d.index].bulletAlpha;
                        }
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

                    //increase bullet stroke size
                    if (isBubble) {
                        d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize + 1);
                    } else {
                        //check whether the serie bullet is error
                        if (chart.series[d.index].bullet === 'error') {
                            //increase bullet stroke size
                            d3.select(this).style('stroke-width', chart.series[d.index].lineSize + 1);
                        } else {
                            //increase bullet stroke size
                            d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize + 1);
                        }
                    }
                })
                .on('mouseout', function (d, i) {
                    //Hide balloon
                    chart.hideBalloon();

                    //decrease bullet stroke size
                    if (isBubble) {
                        d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize);
                    } else {
                        //check whether the serie bullet is error
                        if (chart.series[d.index].bullet === 'error') {
                            //decrease bullet stroke size
                            d3.select(this).style('stroke-width', chart.series[d.index].lineSize);
                        } else {
                            //decrease bullet stroke size
                            d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize);
                        }
                    }
                });
        };

        //create an internal function to init chart
        function init() {
            //create axis
            axis = chart.createAxis();

            //create scatter points
            createScatterPoints();
        };

        //init chart
        init();

        //return chart
        return chart;
    };


    //set eve charts create scatter chart method
    eveCharts.scatter = function (options) {
        /// <summary>
        /// Creates a new scatter chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'scatter';
                });
            }

            //create chart object
            var scatter = scatterChart(new this.configurator(options), false);

            //add chart instance
            if (scatter !== null)
                this.instances[scatter.id] = scatter;

            //return new chart object
            return scatter;
        } else {
            //return null
            return null;
        }
    };

    //set eve charts create bubble chart method
    eveCharts.bubble = function (options) {
        /// <summary>
        /// Creates a new bubble chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'scatter';
                });
            }

            //create chart object
            var bubble = scatterChart(new this.configurator(options), true);

            //add chart instance
            if (bubble !== null)
                this.instances[bubble.id] = bubble;

            //return new chart object
            return bubble;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts);