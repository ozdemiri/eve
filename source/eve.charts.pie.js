/*!
 * eve.charts.pie.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Pie chart class.
 */
(function (eveCharts) {
    //pie chart creator class
    function pieChart(chart) {
        //global variables to use in pie chart
        var plot = chart.plot,
            baseData = chart.data,
            serie = chart.series[0],
            isDonut = false,
            pie = d3.layout.pie().sort(null).value(function (d) { return d[serie.valueField]; }),
            key = function (d) { return d.data[serie.titleField]; },
            legendIcons = null,
            legendTexts = null,
            base = this,
            slices, labels, lines;

        //handle serie type mistmatch error
        if (serie.type !== 'pie' && serie.type !== 'donut') {
            throw new Error('Serie type mistmatch! When creating a pie chart, serie type should be set as "pie" or "donut"...');
            return null;
        }

        //check whether the chart is donut
        if (serie.type === 'donut') isDonut = true;

        //append pie chart slices, labels and lines into canvas
        plot.canvas.append('g').attr('class', 'eve-pie-slices');

        //create an internal function to create pie series
        function init() {
            //dimension variables
            var legendWidth = 0,
                legendHeight = 0,
                transX = (plot.width + chart.margin.left - chart.margin.right) / 2,
                transY = (plot.height + chart.margin.top - chart.margin.bottom) / 2,
                alphaMin = 0,
                alphaMax = 0,
                pieWidth = plot.width - chart.margin.left - chart.margin.right,
                pieHeight = plot.height - chart.margin.top - chart.margin.bottom;

            //check whether the serie alpha Field is not empty
            if (serie.alphaField !== '') {
                //set alpha min & max
                alphaMin = d3.min(baseData, function (d) { return d[serie.alphaField]; });
                alphaMax = d3.max(baseData, function (d) { return d[serie.alphaField]; });
            }

            //create legends
            if (chart.legend.enabled) {
                //add g for legend texts and icons
                plot.canvas.append('g').attr('class', 'eve-legend-icon');
                plot.canvas.append('g').attr('class', 'eve-legend-text');

                //create legend icon symbol
                var symbolSize = Math.pow(chart.legend.fontSize, 2);

                //set legend width
                legendWidth = chart.legend.fontSize + 5;

                //set legend height
                legendHeight = baseData.length * chart.legend.fontSize;

                //create legend icon
                legendTexts = plot.canvas.select('.eve-legend-text').selectAll('text.eve-legend-text')
                    .data(pie(baseData), key);

                //create legend icon
                legendIcons = plot.canvas.select('.eve-legend-icon').selectAll('path.eve-legend-icon')
                    .data(pie(baseData), key);

                //set legend texts
                legendTexts.enter().insert('text')
                    .attr('class', 'eve-legend-text')
                    .style('cursor', 'pointer')
                    .style('fill', chart.legend.fontColor)
                    .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                    .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                    .style("font-family", chart.legend.fontFamily)
                    .style("font-size", chart.legend.fontSize + 'px')
                    .style("text-anchor", 'left')
                    .text(function (d, i) {
                        return chart.setBalloonContent({
                            format: chart.legend.format,
                            dataIndex: i,
                            data: d,
                            serie: serie,
                            type: 'pie'
                        });
                    })
                    .on('click', function (d, i) {
                        //set data selected event
                        if (d.data.selected) { d.data.selected = false; } else { d.data.selected = true; }

                        //scale the current pie element
                        if (d.data.selected) {
                            //create selection
                            d3.select(slices[0][i])
                                .style("stroke-opacity", 1)
                                .transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', function () {
                                    //get new angle
                                    var newAngle = (d.startAngle + d.endAngle) / 2,
                                        newX = Math.sin(newAngle) * 10,
                                        newY = -Math.cos(newAngle) * 10;

                                    //return translation
                                    return 'translate(' + newX + ',' + newY + ')';
                                });

                        } else {
                            d3.select(slices[0][i])
                                .style("stroke-opacity", 0.1)
                                .transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', 'translate(0,0)');
                        }

                        //check whether the legendclick event is not null
                        if (chart['legendClick'] !== null) chart.legendClick(d.data);
                    });

                //iterate all legend texts to get legend width
                legendTexts[0].each(function (legendText) {
                    //get legend text bbox
                    var bboxWidth = legendText.getBBox().width + chart.legend.fontSize + 5;

                    //check whether the bbox.width is greater than legendwidth
                    if (bboxWidth > legendWidth) legendWidth = bboxWidth;
                });

                //create legend icons
                legendIcons.enter().insert('path')
                    .attr('d', d3.svg.symbol().type(chart.legend.iconType).size(symbolSize))
                    .attr('class', 'eve-legend-icon')
                    .style('cursor', 'pointer')
                    .style('fill', function (d, i) {
                        if (slices !== undefined)
                            return d3.select(slices[0][i]).style('fill');

                        //check whether the serie has colorField
                        if (serie.colorField !== '')
                            return d.data[serie.colorField];
                        else
                            return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                    })
                    .on('click', function (d, i) {
                        //set data selected event
                        if (d.data.selected) { d.data.selected = false; } else { d.data.selected = true; }

                        //scale the current pie element
                        if (d.data.selected) {
                            //create selection
                            d3.select(slices[0][i])
                                .style("stroke-opacity", 1)
                                .transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', function () {
                                    //get new angle
                                    var newAngle = (d.startAngle + d.endAngle) / 2,
                                        newX = Math.sin(newAngle) * 10,
                                        newY = -Math.cos(newAngle) * 10;

                                    //return translation
                                    return 'translate(' + newX + ',' + newY + ')';
                                });

                        } else {
                            d3.select(slices[0][i])
                                .style("stroke-opacity", 0.1)
                                .transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', 'translate(0,0)');
                        }

                        //check whether the legendclick event is not null
                        if (chart['legendClick'] !== null) chart.legendClick(d.data);
                    });

                //exit legend icons
                legendIcons.exit().remove();

                //exit legend texts
                legendTexts.exit().remove();
            }

            //set dimensions by legend
            if (chart.legend.enabled) {
                //check legend position left or right to set transx pos
                if (chart.legend.position === 'left')
                    transX = transX + legendWidth / 2;
                else
                    transX = transX - legendWidth / 2;

                //set pieWidth
                pieWidth -= legendWidth * 2;
            }

            //calculate radius
            var radius = Math.min((pieWidth), (pieHeight)) / 2,
                outerRadius = serie.labelsEnabled ? (serie.labelPosition === 'outside' ? radius * .8 : radius * .9) : radius * .9,
                innerRadius = 0;

            //check whether the chart is donut
            if (isDonut) innerRadius = serie.innerRadius === 0 ? radius / 2 : serie.innerRadius;

            //create arcs
            var arc = d3.svg.arc().outerRadius(outerRadius).innerRadius(innerRadius);

            //translate canvas center
            plot.canvas.attr('transform', 'translate(' + transX + ',' + transY + ')');

            //create slice data
            slices = plot.canvas.select('.eve-pie-slices').selectAll('path.eve-pie-slice')
                .data(pie(baseData), key);

            //create slice paths
            slices.enter().insert('path')
                .style('fill', function (d, i) {
                    //check whether the serie has colorField
                    if (serie.colorField !== '')
                        return d.data[serie.colorField];
                    else
                        return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                })
                .style('fill-opacity', function (d, i) {
                    //check whether the serie has alphaField
                    if (serie.alphaField !== '') {
                        //calculate alpha
                        var range = alphaMax - alphaMin,
                            alpha = d.data[serie.alphaField] / range * .8 - (alphaMin / range * .8) + .2;

                        //return new alpha
                        return alpha;;
                    }
                    else
                        return 1;
                })
                .style("stroke", serie.sliceBorderColor)
                .style("stroke-width", 1)
                .style("stroke-opacity", serie.sliceBorderOpacity)
                .attr("class", "eve-pie-slice")
                .on('click', function (d, i) {
                    //set data selected event
                    if (d.data.selected) { d.data.selected = false; } else { d.data.selected = true; }

                    //scale the current pie element
                    if (d.data.selected) {
                        //create selection
                        d3.select(this)
                            .style("stroke-opacity", 1)
                            .transition()
                            .duration(chart.animationDuration / 2)
                            .attr('transform', function () {
                                //get new angle
                                var newAngle = (d.startAngle + d.endAngle) / 2,
                                    newX = Math.sin(newAngle) * 10,
                                    newY = -Math.cos(newAngle) * 10;

                                //return translation
                                return 'translate(' + newX + ',' + newY + ')';
                            });

                    } else {
                        d3.select(this)
                            .style("stroke-opacity", 0.1)
                            .transition()
                            .duration(chart.animationDuration / 2)
                            .attr('transform', 'translate(0,0)');
                    }

                    //check whether the serieClick event is not null
                    if (chart['serieClick'] !== null) chart.serieClick(d.data);
                })
                .on('mousemove', function (d, i) {
                    //get data color
                    var dataColor = '';
                    var thisObj = eve(this);
                    var balloonContent = chart.setBalloonContent({
                        format: chart.balloon.format,
                        dataIndex: i,
                        data: d,
                        serie: serie,
                        type: 'pie'
                    });

                    //set data color
                    if (serie.colorField !== '')
                        dataColor = d.data[serie.colorField];
                    else
                        dataColor = i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();

                    //set balloon border color
                    plot.balloon.style('borderColor', dataColor);

                    //Show balloon
                    chart.showBalloon(balloonContent);

                    //Set hover for the current slice
                    thisObj.style('opacity', serie.hoverOpacity);
                })
                .on('mouseout', function (d) {
                    //Hide balloon
                    chart.hideBalloon();

                    //Remove opacity of the curent slice
                    eve(this).style('opacity', 1);
                });

            //set slice animation
            slices.transition().duration(chart.animationDuration)
                .attrTween('d', function (d) {
                    //set current data
                    this._current = this._current || d;

                    //set interpolation
                    var interpolated = d3.interpolate(this._current, d);

                    //set current as interpolated
                    this._current = interpolated(0);

                    //return interpolated arc
                    return function (t) {
                        return arc(interpolated(t));
                    };
                });

            //exit from slices
            slices.exit().remove();

            //set legend pos
            if (chart.legend.enabled) {
                //check legend position to set legend
                if (chart.legend.position === 'right') {
                    //set legend icons x position
                    legendIcons
                        .attr('transform', function (d, i) {
                            //calculate path pos
                            var x = radius + 10,
                                y = 0 - legendHeight + (chart.legend.fontSize * i) * 2;

                            //return translation
                            return 'translate(' + x + ',' + y + ')';
                        })

                    //set legend texts x position
                    legendTexts
                        .attr('x', radius + chart.legend.fontSize + 10)
                        .attr('y', function (d, i) { return 0 - legendHeight + (chart.legend.fontSize / 3) + (chart.legend.fontSize * i) * 2; });
                } else {
                    //set legend icons x position
                    legendIcons
                        .attr('transform', function (d, i) {
                            //calculate path pos
                            var x = 0 - radius - legendWidth - chart.legend.fontSize - 10,
                                y = 0 - legendHeight + (chart.legend.fontSize * i) * 2;

                            //return translation
                            return 'translate(' + x + ',' + y + ')';
                        });

                    //set legend texts x position
                    legendTexts
                        .attr('x', 0 - radius - legendWidth - 10)
                        .attr('y', function (d, i) { return 0 - legendHeight + (chart.legend.fontSize / 3) + (chart.legend.fontSize * i) * 2; });
                }
            }

            //check whether the labels are enables
            if (serie.labelsEnabled) {
                //add g for pie labels
                plot.canvas.append('g').attr('class', 'eve-pie-labels');

                //check whether the label position is inside
                if (serie.labelPosition === 'inside') {
                    //set labels
                    labels = plot.canvas.select('.eve-pie-labels').selectAll('text').data(pie(baseData), key);

                    //append labels
                    labels.enter().append('text')
                        .style('fill', serie.labelFontColor)
                        .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                        .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                        .style("font-family", serie.labelFontFamily)
                        .style("font-size", serie.labelFontSize + 'px')
                        .style('text-anchor', 'middle');

                    //set labels text
                    labels.text(function (d, i) {
                        return chart.setBalloonContent({
                            format: serie.labelFormat,
                            dataIndex: i,
                            data: d,
                            serie: serie,
                            type: 'pie'
                        });
                    });

                    //animate labels
                    labels.transition().duration(chart.animationDuration)
                        .attr('transform', function (d) { return 'translate(' + arc.centroid(d) + ')'; });

                    //exit from labels
                    labels.exit().remove();
                } else {
                    //add g for label lines
                    plot.canvas.append('g').attr('class', 'eve-pie-labels-lines');

                    //create label lines
                    lines = plot.canvas.select('.eve-pie-labels-lines').selectAll('line').data(pie(baseData), key);

                    //append label lines
                    lines.enter().append('line')
                        .style('stroke', function (d, i) {
                            if (serie.colorField !== '')
                                return d.data[serie.colorField];
                            else
                                return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                        })
                        .style('stroke-width', 1)
                        .style('stroke-opacity', 0.2);

                    //animate label lines
                    lines.transition().duration(chart.animationDuration)
                        .attr("x1", function (d) { return arc.centroid(d)[0]; })
                        .attr("y1", function (d) { return arc.centroid(d)[1]; })
                        .attr("x2", function (d) {
                            //get centroid
                            var _centroid = arc.centroid(d);

                            //calculate middle point
                            var _midAngle = Math.atan2(_centroid[1], _centroid[0]);

                            //calculate x position of the line
                            var _x = Math.cos(_midAngle) * (radius * 0.9);

                            //return x
                            return _x;
                        })
                        .attr("y2", function (d) {
                            //get centroid
                            var _centroid = arc.centroid(d);

                            //calculate middle point
                            var _midAngle = Math.atan2(_centroid[1], _centroid[0]);

                            //calculate y position of the line
                            var _y = Math.sin(_midAngle) * (radius * 0.9);

                            //return y
                            return _y;
                        });

                    //exit lines
                    lines.exit().remove();

                    //create labels
                    labels = plot.canvas.select('.eve-pie-labels').selectAll('text').data(pie(baseData), key);

                    //append labels
                    labels.enter().append('text')
                        .style('fill', serie.labelFontColor)
                        .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                        .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                        .style("font-family", serie.labelFontFamily)
                        .style("font-size", serie.labelFontSize + 'px')
                        .text(function (d, i) {
                            return chart.setBalloonContent({
                                format: serie.labelFormat,
                                dataIndex: i,
                                data: d,
                                serie: serie,
                                type: 'pie'
                            });
                        });

                    //animate labels
                    labels.transition().duration(chart.animationDuration)
                        .attr('x', function (d) {
                            //Get centroid of the inner arc
                            var _centroid = arc.centroid(d);

                            //Get middle angle
                            var _midAngle = Math.atan2(_centroid[1], _centroid[0]);

                            //Calculate x position
                            var _x = Math.cos(_midAngle) * (radius * 0.9);

                            //Return x position
                            return _x + (5 * ((_x > 0) ? 1 : -1));
                        })
                        .attr('y', function (d) {
                            //Get centroid of the inner arc
                            var _centroid = arc.centroid(d);

                            //Get middle angle
                            var _midAngle = Math.atan2(_centroid[1], _centroid[0]);

                            //Return y position
                            return Math.sin(_midAngle) * (radius * 0.9);
                        })
                        .style("text-anchor", function (d) {
                            //Get centroid of the inner arc
                            var _centroid = arc.centroid(d);

                            //Get middle angle
                            var _midAngle = Math.atan2(_centroid[1], _centroid[0]);

                            //Calculate x position
                            var _x = Math.cos(_midAngle) * (radius * 0.9);

                            //Return text anchor
                            return (_x > 0) ? "start" : "end";
                        });

                    //exit labels
                    labels.exit().remove();
                }
            }
        };

        //init chart
        init();

        //return chart
        return chart;
    };

    //set eve charts create pie chart method
    eveCharts.pie = function (options) {
        /// <summary>
        /// Creates a new pie chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'pie';
                });
            }

            //create chart object
            var pie = pieChart(new this.configurator(options));

            //add chart instance
            if (pie !== null)
                this.instances[pie.id] = pie;

            //return new chart object
            return pie;
        } else {
            //return null
            return null;
        }
    };

    //set eve charts create donut chart method
    eveCharts.donut = function (options) {
        /// <summary>
        /// Creates a new donut chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'donut';
                });
            }

            //create chart object
            var pie = pieChart(new this.configurator(options));

            //add chart instance
            if (pie !== null)
                this.instances[pie.id] = pie;

            //return new chart object
            return pie;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts);