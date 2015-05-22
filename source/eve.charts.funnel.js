/*!
 * eve.charts.funnel.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Funnel chart class.
 */
(function (eveCharts) {
    //funnel chart creator class
    function funnelChart(chart) {
        //global variables to use in funnel chart
        var plot = chart.plot,
            baseData = chart.data,
            serie = chart.series[0],
            legendIcons = null,
            legendTexts = null,
            base = this,
            slices, labels, lines, neck;

        //handle serie type mistmatch error
        if (serie.type !== 'funnel' && serie.type !== 'pyramid') {
            throw new Error('Serie type mistmatch! When creating a funnel chart, serie type should be set as "funnel" or "pyramid"...');
            return null;
        }

        //create an internal function to create init chart
        function init() {
            //dimension variables
            var legendWidth = 0,
                legendHeight = 0,
                alphaMin = 0,
                alphaMax = 0,
                totalData = d3.sum(chart.data, function (d) { return d[serie.valueField]; }),
                gradePercent = 1 / 10,
                funnelWidth = plot.width - chart.margin.left - chart.margin.right,
                funnelHeight = plot.height - chart.margin.top - chart.margin.bottom,
                transX = chart.margin.left,
                transY = chart.margin.top;

            //check whether the serie alpha Field is not empty
            if (serie.alphaField !== '') {
                //set alpha min & max
                alphaMin = d3.min(chart.data, function (d) { return d[serie.alphaField]; });
                alphaMax = d3.max(chart.data, function (d) { return d[serie.alphaField]; });
            }

            //check whether the chart is pyramid
            if (serie.type === 'pyramid') gradePercent = 1 / 200;

            //create funnel line function
            var funnel = d3.svg.line().x(function (d) { return d[0]; }).y(function (d) { return d[1]; });

            //declare an internal function to calculate path points
            function getPaths() {
                //declare needed variables to draw trapezoid path points
                var paths = [], pathPoints = [];

                //internal function to create path points
                function createPathPoints(ll, lr, lh, i) {
                    // reached end of funnel
                    if (i >= chart.data.length) return;

                    // math to calculate coordinates of the next base
                    v = chart.data[i][serie.valueField];
                    a = v * totalArea / totalData;
                    pw = lr - ll;
                    nw = Math.sqrt((grade * pw * pw - 4 * a) / grade);
                    nl = (pw - nw) / 2 + ll;
                    nr = lr - (pw - nw) / 2;
                    nh = (grade * (pw - nw) / 2 + lh);

                    //create point array
                    pathPoints = [[nr, nh]];
                    pathPoints.push([lr, lh]);
                    pathPoints.push([ll, lh]);
                    pathPoints.push([nl, nh]);
                    pathPoints.push([nr, nh]);

                    //push the creeated points into the path array
                    paths.push(pathPoints);

                    //increase point index and create next path points
                    createPathPoints(nl, nr, nh, i + 1);
                }

                //calculate next pathPoints
                createPathPoints(0, funnelWidth, 0, 0);

                //return paths
                return paths;
            }

            //append pie chart slices, labels and lines into canvas
            plot.canvas.append('g').attr('class', 'eve-funnel-slices');

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
                legendHeight = chart.data.length * chart.legend.fontSize;

                //create legend icon
                legendTexts = plot.canvas.select('.eve-legend-text').selectAll('text.eve-legend-text')
                    .data(chart.data);

                //create legend icon
                legendIcons = plot.canvas.select('.eve-legend-icon').selectAll('path.eve-legend-icon')
                    .data(chart.data);

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
                            type: 'funnel',
                            format: chart.legend.format,
                            dataIndex: i,
                            data: d,
                            serie: serie
                        });
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
                            return d[serie.colorField];
                        else
                            return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                    });

                //exit legend icons
                legendIcons.exit().remove();

                //exit legend texts
                legendTexts.exit().remove();
            }

            //set dimensions by legend
            if (chart.legend.enabled) funnelWidth -= legendWidth * 2;

            //check whether the serie has neck
            if (serie.type === 'funnel' && serie.neckHeight > 0) funnelHeight -= serie.neckHeight;

            //calculate grade and total area
            var grade = 2 * funnelHeight / (funnelWidth - gradePercent * funnelWidth),
                totalArea = (funnelWidth + gradePercent * funnelWidth) * funnelHeight / 2,
                paths = getPaths();

            //transform the canvas to set margins
            plot.canvas.attr('transform', 'translate(' + transX + ', ' + transY + ')');

            //create slice data
            slices = plot.canvas.select('.eve-funnel-slices').selectAll('path.eve-funnel-slice')
                .data(chart.data);

            //create funnel slices
            slices.enter().insert('path')
                .attr('class', function (d, i) { return 'eve-funnel-slice eve-funnel-slice-' + i; })
                .attr('d', function (d, i) { return funnel(paths[i]); })
                .style('fill', function (d, i) {
                    //check whether the serie has colorField
                    if (serie.colorField !== '')
                        return d[serie.colorField];
                    else
                        return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                })
                .style('fill-opacity', function (d, i) {
                    //check whether the serie has alphaField
                    if (serie.alphaField !== '') {
                        //calculate alpha
                        var range = alphaMax - alphaMin,
                            alpha = d[serie.alphaField] / range * .8 - (alphaMin / range * .8) + .2;

                        //return new alpha
                        return alpha;;
                    }
                    else
                        return 1;
                })
                .style("stroke-width", 0)
                .on('mousemove', function (d, i) {
                    //get data color
                    var dataColor = '';
                    var balloonContent = chart.setBalloonContent({
                        type: 'funnel',
                        data: d,
                        dataIndex: i,
                        serie: serie,
                        format: chart.balloon.format
                    })

                    //set data color
                    if (serie.colorField !== '')
                        dataColor = d[serie.colorField];
                    else
                        dataColor = i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();

                    //set balloon border color
                    plot.balloon.style('borderColor', dataColor);

                    //Show balloon
                    chart.showBalloon(balloonContent);

                    //Set hover for the current slice
                    d3.select(this).style('opacity', serie.hoverOpacity);

                    //check whether the neck is not null
                    if (neck !== undefined && i === chart.data.length - 1)
                        neck.style('opacity', serie.hoverOpacity);
                })
                .on('mouseout', function (d, i) {
                    //Hide balloon
                    chart.hideBalloon();

                    //Remove opacity of the curent slice
                    d3.select(this).style('opacity', 1);

                    //check whether the neck is not null
                    if (neck !== undefined && i === chart.data.length - 1)
                        neck.style('opacity', 1);
                });

            //check whether the chart has neck
            if (serie.type === 'funnel' && serie.neckHeight > 0) {
                //get last funnel point
                var lastVal = chart.data[chart.data.length - 1][serie.valueField],
                    lfp = slices[0][chart.data.length - 1].getBBox(),
                    neckY = lfp.height + lfp.y,
                    neckH = serie.neckHeight,
                    lfpArea = lastVal * totalArea / totalData,
                    neckW = Math.sqrt((grade * lfp.width * lfp.width - 4 * lfpArea) / grade),
                    neckX = lfp.x + lfp.width / 2 - neckW / 2;

                //insert neck
                neck = plot.canvas.insert('rect')
                        .style('fill', function () {
                            //get last data
                            var d = chart.data[chart.data.length - 1],
                                i = chart.data.length - 1;

                            //check whether the serie has colorField
                            if (serie.colorField !== '')
                                return d[serie.colorField];
                            else
                                return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                        })
                        .style('fill-opacity', function () {
                            //get last data
                            var d = chart.data[chart.data.length - 1],
                                i = chart.data.length - 1;

                            //check whether the serie has alphaField
                            if (serie.alphaField !== '') {
                                //calculate alpha
                                var range = alphaMax - alphaMin,
                                    alpha = d[serie.alphaField] / range * .8 - (alphaMin / range * .8) + .2;

                                //return new alpha
                                return alpha;;
                            }
                            else
                                return 1;
                        })
                        .style("stroke-width", 0)
                        .attr('width', neckW)
                        .attr('height', neckH)
                        .attr('y', neckY)
                        .attr('x', neckX)
                        .on('mousemove', function () {
                            //get last data
                            var d = chart.data[chart.data.length - 1],
                                i = chart.data.length - 1;

                            //get data color
                            var dataColor = '';
                            var balloonContent = chart.setBalloonContent({
                                type: 'funnel',
                                data: d,
                                dataIndex: i,
                                serie: serie,
                                format: chart.balloon.format
                            })

                            //set data color
                            if (serie.colorField !== '')
                                dataColor = d[serie.colorField];
                            else
                                dataColor = i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();

                            //set balloon border color
                            plot.balloon.style('borderColor', dataColor);

                            //Show balloon
                            chart.showBalloon(balloonContent);

                            //Set hover for the current slice
                            d3.select(this).style('opacity', serie.hoverOpacity);

                            //check whether the neck is not null
                            if (i === chart.data.length - 1)
                                d3.select(slices[0][chart.data.length - 1]).style('opacity', serie.hoverOpacity);
                        })
                        .on('mouseout', function () {
                            //get last data
                            var d = chart.data[chart.data.length - 1],
                                i = chart.data.length - 1;

                            //Hide balloon
                            chart.hideBalloon();

                            //Remove opacity of the curent slice
                            d3.select(this).style('opacity', 1);

                            //check whether the neck is not null
                            if (i === chart.data.length - 1)
                                d3.select(slices[0][chart.data.length - 1]).style('opacity', 1);
                        })
            }

            //check whether the serie is pyramid and reverse the funnel
            if (serie.type === 'pyramid') {
                //translate slices
                slices.attr('transform', 'translate(' + (funnelWidth) + ',' + (funnelHeight) + ')rotate(180)');
            }

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
                            var x = funnelWidth + 10,
                                y = funnelHeight / 2 - legendHeight + (chart.legend.fontSize * i) * 2;

                            //return translation
                            return 'translate(' + x + ',' + y + ')';
                        })

                    //set legend texts x position
                    legendTexts
                        .attr('x', funnelWidth + chart.legend.fontSize + 10)
                        .attr('y', function (d, i) {
                            return funnelHeight / 2 - legendHeight + (chart.legend.fontSize / 3) + (chart.legend.fontSize * i) * 2;
                        });
                } else {
                    //set legend icons x position
                    legendIcons
                        .attr('transform', function (d, i) {
                            //calculate path pos
                            var x = chart.margin.left,
                                y = funnelHeight / 2 - legendHeight + (chart.legend.fontSize * i) * 2;

                            //return translation
                            return 'translate(' + x + ',' + y + ')';
                        });

                    //set legend texts x position
                    legendTexts
                        .attr('x', chart.margin.left + 10)
                        .attr('y', function (d, i) {
                            return funnelHeight / 2 - legendHeight + (chart.legend.fontSize * i) * 2;
                        });
                }
            }

            //check whether the labels are enables
            if (serie.labelsEnabled) {
                //add g for funnel labels
                plot.canvas.append('g').attr('class', 'eve-funnel-labels');

                //set labels
                labels = plot.canvas.select('.eve-funnel-labels').selectAll('text').data(chart.data);

                //append labels;
                labels.enter().append('text')
                    .style('fill', serie.labelFontColor)
                    .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                    .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                    .style("font-family", serie.labelFontFamily)
                    .style("font-size", serie.labelFontSize + 'px')
                    .style('text-anchor', 'left')
                    .text(function (d, i) {
                        return chart.setBalloonContent({
                            type: 'funnel',
                            format: serie.labelFormat,
                            dataIndex: i,
                            data: d,
                            serie: serie
                        });
                    })
                    .attr('transform', function (d, i) {
                        //get positions
                        var fSlice = slices[0][i].getBBox(),
                            bbox = this.getBBox(),
                            xPos = funnelWidth / 2 - bbox.width / 2,
                            yPos = fSlice.y + fSlice.height / 2 + bbox.height / 2;

                        //check whether the chart is pyramid
                        if (serie.type === 'pyramid') yPos = (funnelHeight - fSlice.y) - fSlice.height / 2 + bbox.height / 2;

                        return 'translate(' + xPos + ',' + yPos + ')';
                    });
            }
        };

        //init chart
        init();

        //return chart
        return chart;
    };

    //set eve charts create funnel chart method
    eveCharts.funnel = function (options) {
        /// <summary>
        /// Creates a new funnel chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'funnel';
                });
            }

            //create chart object
            var funnel = funnelChart(new this.configurator(options));

            //add chart instance
            if (funnel !== null)
                this.instances[funnel.id] = funnel;

            //return new chart object
            return funnel;
        } else {
            //return null
            return null;
        }
    };

    //set eve charts create pyramid chart method
    eveCharts.pyramid = function (options) {
        /// <summary>
        /// Creates a new pyramid chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'pyramid';
                });
            }

            //create chart object
            var pyramid = funnelChart(new this.configurator(options));

            //add chart instance
            if (pyramid !== null)
                this.instances[pyramid.id] = pyramid;

            //return new chart object
            return pyramid;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts);