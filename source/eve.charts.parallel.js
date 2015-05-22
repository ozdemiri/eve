/*!
 * eve.charts.parallel.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Parallel set chart class.
 */
(function (eveCharts) {
    //parallel lines creator class
    function parallelLinesChart(chart) {
        //global variables to use in parallel lines chart
        var plot = chart.plot,
            serie = chart.series[0],
            legendIcons, legendTexts, legendWidth, legendHeight,
            axisLeft = chart.margin.left,
            axisWidth = plot.width - chart.margin.left - chart.margin.right,
            axisTop = (chart.margin.top + (chart.yAxis.labelFontSize * 2)),
            axisHeight = plot.height - chart.margin.top - chart.margin.bottom - (chart.yAxis.labelFontSize * 2);

        //handle serie type mistmatch error
        if (serie.type !== 'parallel') {
            throw new Error('Serie type mistmatch! When creating a parallel lines chart, serie type should be set as "parallel"...');
            return null;
        }

        //create an internal function to draw legend
        function drawLegend() {
            //create legends
            if (chart.legend.enabled) {
                //create legend icon symbol
                var symbolSize = Math.pow(chart.legend.fontSize, 2);

                //set legend width
                legendWidth = chart.legend.fontSize + 5;

                //set legend height
                legendHeight = chart.data.length * chart.legend.fontSize;

                //create legend icon
                legendTexts = plot.canvas.selectAll('.eve-legend-text').data(chart.data).enter().append('g');

                //create legend icon
                legendIcons = plot.canvas.selectAll('.eve-legend-icon').data(chart.data).enter().append('g');

                //set legend texts
                legendTexts.append('text')
                    .attr('class', 'eve-legend-text')
                    .style('cursor', 'pointer')
                    .style('fill', chart.legend.fontColor)
                    .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                    .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                    .style("font-family", chart.legend.fontFamily)
                    .style("font-size", chart.legend.fontSize + 'px')
                    .style("text-anchor", 'left')
                    .text(function (d, i) { return d[serie.dimensionField]; });

                //iterate all legend texts to get legend width
                legendTexts[0].each(function (legendText) {
                    //get legend text bbox
                    var bboxWidth = legendText.getBBox().width + chart.legend.fontSize + 5;

                    //check whether the bbox.width is greater than legendwidth
                    if (bboxWidth > legendWidth) legendWidth = bboxWidth;
                });

                //create legend icons
                legendIcons.append('path')
                    .attr('d', d3.svg.symbol().type(chart.legend.iconType).size(symbolSize))
                    .attr('class', 'eve-legend-icon')
                    .style('cursor', 'pointer')
                    .style('fill', function (d, i) {
                        //check whether the serie has colorField
                        var serieColor = eve.randomColor();

                        //check whether the chart has color field
                        if (serie.colorField !== '') {
                            //check whether the indexed color is not null
                            if (colors[i] != null)
                                serieColor = colors[i];
                            else
                                serieColor = i > (eveCharts.colors.length - 1) ? eve.randomColor() : eveCharts.colors[i];
                        } else {
                            serieColor = i > (eveCharts.colors.length - 1) ? eve.randomColor() : eveCharts.colors[i]
                        }

                        //return serie color
                        return serieColor;
                    });

                //check legend position to set legend
                if (chart.legend.position === 'right') {
                    //set legend icons position
                    legendIcons
                        .attr('transform', function (d, i) {
                            //calculate path pos
                            var x = plot.width - legendWidth - chart.legend.fontSize - chart.margin.right,
                                y = plot.height / 2 - legendHeight + (chart.legend.fontSize * i) * 2;

                            //return translation
                            return 'translate(' + x + ',' + y + ')';
                        });

                    //set legend texts position
                    legendTexts
                        .attr('transform', function (d, i) {
                            //calculate path pos
                            var x = plot.width - legendWidth - chart.margin.right,
                                y = plot.height / 2 - legendHeight + (chart.legend.fontSize / 3) + (chart.legend.fontSize * i) * 2;

                            //return translation
                            return 'translate(' + x + ',' + y + ')';
                        });

                    //decrease axis width
                    axisWidth -= legendWidth + chart.legend.fontSize;
                } else {
                    //set legend icons position
                    legendIcons
                        .attr('transform', function (d, i) {
                            //calculate path pos
                            var x = chart.margin.left + chart.yAxis.titleFontSize + 5,
                                y = plot.height / 2 - legendHeight + (chart.legend.fontSize * i) * 2;

                            //return translation
                            return 'translate(' + x + ',' + y + ')';
                        });

                    //set legend texts position
                    legendTexts
                        .attr('transform', function (d, i) {
                            //calculate path pos
                            var x = chart.margin.left + chart.yAxis.titleFontSize + chart.legend.fontSize + 5,
                                y = plot.height / 2 - legendHeight + (chart.legend.fontSize / 3) + (chart.legend.fontSize * i) * 2;

                            //return translation
                            return 'translate(' + x + ',' + y + ')';
                        });

                    //increase axis left
                    axisLeft += legendWidth + chart.legend.fontSize + 5;

                    //decrease axis width
                    axisWidth -= legendWidth + chart.legend.fontSize;
                }
            }
        };

        //create an internal function to init chart
        function init() {
            //draw legend
            drawLegend();

            //declare parallel line inner variables
            var dimensions = [], colors = [],
                yRanges = {},
                dragging = {},
                xRange = d3.scale.ordinal().rangePoints([0, axisWidth], 1),
                lineF = d3.svg.line(),
                yAxis = d3.svg.axis().orient('left'),
                parallelSerie, measureSerie, lineSerie;

            //create an inner function to set dragging position
            function position(d) { var v = dragging[d]; return v == null ? xRange(d) : v; }

            //create an inner function to handle transition
            function transition(g) { return g.transition().duration(chart.animationDuration); }

            //create an inner function to create line path
            function linePath(d) { return lineF(serie.measureFields.map(function (p) { return [position(p), yRanges[p](d[p])]; })); }

            //create an inner function to handle brushing start
            function brushstart() { d3.event.sourceEvent.stopPropagation(); }

            //create an inner function to zooming brush
            function brush() {
                var actives = serie.measureFields.filter(function (p) { return !yRanges[p].brush.empty(); }),
                    extents = actives.map(function (p) { return yRanges[p].brush.extent(); });

                //Set foreground
                lineSerie.style("display", function (d) {
                    return actives.every(function (p, i) {
                        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
                    }) ? null : "none";
                });
            }

            //iterate all data to set dimensions and colors
            chart.data.each(function (d) {
                //push the current dimension in the dimensions
                dimensions.push(d[serie.dimensionField]);

                //check whether the serie has color field and build colors
                if (serie.colorField !== '') colors.push(d[serie.colorField]);
            });

            //transform canvas
            plot.canvas.attr('transform', 'translate(' + axisLeft + ',' + axisTop + ')');

            //set x range domains
            xRange.domain(d3.keys(chart.data[0]).filter(function (d) {
                //check whether the current key is in dimension range
                if (serie.measureFields.indexOf(d) > -1) {
                    return yRanges[d] = d3.scale.linear()
                        .domain(d3.extent(chart.data, function (d2) { return +d2[d]; }))
                        .range([axisHeight, 0]);
                } else {
                    return false;
                }
            }));

            //create parallel line diagram
            parallelSerie = plot.canvas.append("g")
                .attr("class", "eve-parallel-serie")
                .selectAll("path")
                .data(chart.data)
                .enter().append("path")
                .style('fill', 'none')
                .style('stroke', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr("d", linePath);

            //create lines
            lineSerie = plot.canvas.append("g")
                .selectAll("path")
                .data(chart.data)
                .enter().append("path")
                .attr('class', function (d, i) { return 'eve-parallel-lines eve-parallel-line-' + i; })
                .attr("d", linePath)
                .style('fill', 'none')
                .style('fill-opacity', 0)
                .style('stroke', function (d, i) {
                    //get line stroke color
                    var strokeColor = eve.randomColor();

                    //check whether the chart has color field
                    if (serie.colorField !== '') {
                        //check whether the indexed color is not null
                        if (colors[i] != null)
                            strokeColor = colors[i];
                        else
                            strokeColor = i > (eveCharts.colors.length - 1) ? eve.randomColor() : eveCharts.colors[i];
                    } else {
                        strokeColor = i > (eveCharts.colors.length - 1) ? eve.randomColor() : eveCharts.colors[i]
                    }

                    //return stroke color
                    return strokeColor;
                })
                .style('stroke-width', serie.lineSize)
                .style('stroke-opacity', serie.lineAlpha)
                .style('stroke-dasharray', function (d, i) {
                    //check whether the serie line drawing style
                    if (serie.lineDrawingStyle === 'dotted')
                        return '2, 2';
                    else if (serie.lineDrawingStyle === 'dashed')
                        return '5, 2';
                    else
                        return '0';
                })
                .on('mousemove', function (d, i) {
                    //get serie color
                    var serieColor = eve.randomColor(),
                        balloonContent = chart.setBalloonContent({
                            data: d,
                            dataIndex: i,
                            format: chart.balloon.format,
                            serie: chart.series[d.index]
                        });

                    //check whether the chart has color field
                    if (serie.colorField !== '') {
                        //check whether the indexed color is not null
                        if (colors[i] != null)
                            serieColor = colors[i];
                        else
                            serieColor = i > (eveCharts.colors.length - 1) ? eve.randomColor() : eveCharts.colors[i];
                    } else {
                        serieColor = i > (eveCharts.colors.length - 1) ? eve.randomColor() : eveCharts.colors[i]
                    }

                    //set balloon border color
                    plot.balloon.style('borderColor', serieColor);

                    //Show balloon
                    chart.showBalloon(balloonContent);

                    //increase bullet stroke size
                    d3.select(this).style('stroke-width', serie.lineSize + 1);
                })
                .on('mouseout', function (d, i) {
                    //Hide balloon
                    chart.hideBalloon();

                    //decrease bullet stroke size
                    d3.select(this).style('stroke-width', serie.lineSize);
                });

            //create measures
            measureSerie = plot.canvas.selectAll('.eve-parallel-measure')
                .data(serie.measureFields)
                .enter().append('g')
                .attr('class', 'eve-parallel-measure')
                .attr('transform', function (d, i) { return 'translate(' + xRange(d) + ')'; })
                .call(
                    //call drag behavior
                    d3.behavior.drag()
                        .origin(function (d) { return { x: xRange(d) }; })
                        .on("dragstart", function (d) {
                            //set dragging position state
                            dragging[d] = xRange(d);

                            //hide parallel serie
                            parallelSerie.attr("visibility", "hidden");
                        })
                        .on("drag", function (d) {
                            //set dragging position state
                            dragging[d] = Math.min(plot.width, Math.max(0, d3.event.x));

                            //update line serie
                            lineSerie.attr("d", linePath);

                            //sort measures
                            serie.measureFields.sort(function (a, b) { return position(a) - position(b); });

                            //update x range domains
                            xRange.domain(serie.measureFields);

                            //update measure serie translation
                            measureSerie.attr('transform', function (d) { return 'translate(' + position(d) + ')'; })
                        })
                        .on("dragend", function (d) {
                            //remove dragging state
                            delete dragging[d];

                            //create translation transition
                            transition(d3.select(this)).attr('transform', 'translate(' + xRange(d) + ')');

                            //create line transition
                            transition(lineSerie).attr("d", linePath);

                            //update parallel serie and show
                            parallelSerie.attr("d", linePath).transition().delay(500).duration(0).attr("visibility", null);
                        })
                );

            //create axis titles
            measureSerie.append("g")
                .attr("class", "eve-parallel-axis")
                .each(function (d) { d3.select(this).call(yAxis.scale(yRanges[d])); })
                .append("text")
                .attr('class', 'eve-parallel-axis-title')
                .style("text-anchor", "middle")
                .attr("y", -9)
                .text(function (d) { return d });

            //Create pan brush
            measureSerie.append("g")
                .attr("class", "eve-parallel-brush")
                .each(function (d) { d3.select(this).call(yRanges[d].brush = d3.svg.brush().y(yRanges[d]).on('brushstart', brushstart).on('brush', brush)); })
                .selectAll("rect")
                .style('fill', serie.brushColor)
                .style('fill-opacity', serie.brushAlpha)
                .style('stroke', serie.brushBorderColor)
                .style('shape-rendering', 'crispEdges')
                .attr("x", -8)
                .attr("width", 16);

            //select all lines in yaxis
            measureSerie.selectAll('.eve-parallel-axis line')
                .style('fill', 'none')
                .style('stroke-width', chart.yAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', chart.yAxis.alpha)
                .style('stroke', chart.yAxis.color);

            //select all paths in y axis
            measureSerie.selectAll('.eve-parallel-axis path')
                .style('fill', 'none')
                .style('stroke-width', chart.yAxis.thickness + 'px')
                .style('stroke-opacity', chart.yAxis.alpha)
                .style('stroke', chart.yAxis.color);

            //select all texts in yaxis
            measureSerie.selectAll('.eve-parallel-axis text')
                .style('fill', chart.yAxis.labelFontColor)
                .style('font-size', chart.yAxis.labelFontSize + 'px')
                .style('font-family', chart.yAxis.labelFontFamily)
                .style('font-style', chart.yAxis.labelFontStlye === 'bold' ? 'normal' : chart.yAxis.labelFontStlye)
                .style('font-weight', chart.yAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                .style('stroke-width', '0px');

            //select all titles in y axis
            measureSerie.selectAll('.eve-parallel-axis-title')
                .style('fill', chart.yAxis.titleFontColor)
                .style('font-size', chart.yAxis.titleFontSize + 'px')
                .style('font-family', chart.yAxis.titleFontFamily)
                .style('font-style', chart.yAxis.titleFontStlye === 'bold' ? 'normal' : chart.yAxis.titleFontStlye)
                .style('font-weight', chart.yAxis.titleFontStlye === 'bold' ? 'bold' : 'normal')
                .style('stroke-width', '0px');
        };

        //init chart
        init();

        //return chart
        return chart;
    };

    //set eve charts create parallel lines chart method
    eveCharts.parallel = function (options) {
        /// <summary>
        /// Creates a new parallel lines chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'parallel';
                });
            }

            //create configurator
            var config = new this.configurator(options);// config.legend.enabled = false;

            //create chart object
            var parallel = parallelLinesChart(config);

            //add chart instance
            if (parallel !== null)
                this.instances[parallel.id] = parallel;

            //return new chart object
            return parallel;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts);