/*!
 * eve.charts.js
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
(function(e) {
    //serie defaults
    var defaults = {
        alphaField: '',
        colorField: '',
        hoverOpacity: .9,
        labelPosition: 'inside',
        labelFontColor: '#ffffff',
        labelFontFamily: 'Tahoma',
        labelFontSize: 11,
        labelFontStyle: 'normal',
        labelFormat: '{percent}',
        neckHeight: 25,
        sliceBorderOpacity: .1,
        titleField: '',
        valueField: '',
        valueFormat: ''
    };

    //funnel chart class
    function funnel(options) {
        //create chart
        var that = this,
            chart = e.charts.init(options),
            isPyramid = options.type === 'pyramid',
            serie = e.extend(chart.series[0], defaults),
            symbolSize = Math.pow(chart.legend.fontSize, 2),
            margin = { left: 10 + Math.sqrt(symbolSize), top: 10 + Math.sqrt(symbolSize), right: 10 + Math.sqrt(symbolSize), bottom: 10 + Math.sqrt(symbolSize) },
            transX = margin.left,
            transY = margin.top,
            funnelWidth = chart.width - margin.left - margin.right,
            funnelHeight = (!isPyramid && serie.neckHeight > 0) ? (chart.height - serie.neckHeight - margin.top - margin.bottom) : chart.height - margin.top - margin.bottom,
            gradePercent = isPyramid ? 1 / 200 : 1 / 10,
            grade = 2 * funnelHeight / (funnelWidth - gradePercent * funnelWidth),
            totalArea = (funnelWidth + gradePercent * funnelWidth) * funnelHeight / 2,
            totalData = d3.sum(chart.data, function (d) { return d[serie.valueField]; }),
            legendWidth = 0,
            legendHeight = 0,
            alphaMin = 0,
            alphaMax = 0,
            slices, neck, legendTexts, legendIcons,
            funnel = d3.svg.line().x(function (d) { return d[0]; }).y(function (d) { return d[1]; });

        //check chart series
        if(chart.series.length === 0) {
            throw Error('Chart serie could not found!');
        }

        //set default balloon format
        if(chart.balloon.format === '')
            chart.balloon.format = '{title}: {value}';

        //set alpha size
        if(serie.alphaField !== '') {
            alphaMin = d3.min(chart.data, function(d) { return d[serie.alphaField]; })
            alphaMax = d3.max(chart.data, function(d) { return d[serie.alphaField]; })
        }

        //gets paths
        function getPaths() {
            var paths = [], pathPoints = [];

            //inner function to create path points
            function createPathPoints(ll, lr, lh, i) {
                if (i >= chart.data.length) return;
                v = chart.data[i][serie.valueField];
                a = v * totalArea / totalData;
                pw = lr - ll;
                nw = Math.sqrt((grade * pw * pw - 4 * a) / grade);
                nl = (pw - nw) / 2 + ll;
                nr = lr - (pw - nw) / 2;
                nh = (grade * (pw - nw) / 2 + lh);

                pathPoints = [[nr, nh]];
                pathPoints.push([lr, lh]);
                pathPoints.push([ll, lh]);
                pathPoints.push([nl, nh]);
                pathPoints.push([nr, nh]);

                paths.push(pathPoints);
                createPathPoints(nl, nr, nh, i + 1);
            }

            createPathPoints(0, funnelWidth, 0, 0);
            return paths;
        }

        //initializes funnel
        function init() {
            //append g for funnel slices
            chart.svg.append('g').attr('class', 'eve-funnel-slices');

            //create legends
            if (chart.legend.enabled) {
                //add g for legend texts and icons
                chart.svg.append('g').attr('class', 'eve-legend-icon');
                chart.svg.append('g').attr('class', 'eve-legend-text');

                //set legend height
                legendHeight = chart.data.length * (chart.legend.fontSize + 5);

                //create legend texts
                legendTexts = chart.svg.select('.eve-legend-text').selectAll('text.eve-legend-text')
                    .data(chart.data)
                    .enter().insert('text')
                    .attr('class', 'eve-legend-text')
                    .style('cursor', 'pointer')
                    .style('fill', chart.legend.fontColor)
                    .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                    .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                    .style("font-family", chart.legend.fontFamily)
                    .style("font-size", chart.legend.fontSize + 'px')
                    .text(function (d, i) { return d[serie.titleField] })
                    .style("text-anchor", function(d, i) {
                        //calculate legend width
                        var textWidth = this.getBBox().width + chart.legend.fontSize;

                        //check textwidth > legendiwdth
                        if(textWidth > legendWidth)
                            legendWidth = textWidth;

                        return 'left';
                    })
                    .on('click', function(d, i) {
                        //set data selected event
                        if (d.selected) { d.selected = false; } else { d.selected = true; }

                        //check if data is selected
                        if(d.selected) {
                            //get current slices
                            d3.select(slices[0][i])
                                .transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', function () {
                                    //return translation
                                    if(isPyramid)
                                        return 'translate(' + (funnelWidth + 10) + ',' + funnelHeight + ')rotate(180)';
                                    else
                                        return 'translate(10)';
                                });

                            //check index
                            if(i === chart.data.length - 1 && neck != null) {
                                neck.transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', function () {
                                        //return translation
                                        return 'translate(10)';
                                    });
                            }
                        } else {
                            //get current slices
                            d3.select(slices[0][i])
                                .transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', function () {
                                    //return translation
                                    if(isPyramid)
                                        return 'translate(' + funnelWidth + ',' + funnelHeight + ')rotate(180)';
                                    else
                                        return 'translate(0)';
                                });

                            //check index
                            if(i === chart.data.length - 1) {
                                //check index
                                if(i === chart.data.length - 1 && neck != null) {
                                    neck.transition()
                                        .duration(chart.animationDuration / 2)
                                        .attr('transform', function () {
                                            //return translation
                                            return 'translate(0)';
                                        });
                                }
                            }
                        }

                        //check legendClick event handler to raise it
                        if(chart.legendClick)
                            chart.legendClick(d, i);
                    });

                //create legend icons
                legendIcons = chart.svg.select('.eve-legend-icon').selectAll('path.eve-legend-icon')
                    .data(chart.data)
                    .enter().insert('path')
                    .attr('d', d3.svg.symbol().type(chart.legend.icon).size(symbolSize))
                    .attr('class', 'eve-legend-icon')
                    .style('cursor', 'pointer')
                    .style('fill', function (d, i) {
                        if (slices !== undefined)
                            return d3.select(slices[0][i]).style('fill');

                        //check whether the serie has colorField
                        if (serie.colorField !== '')
                            return d[serie.colorField];
                        else
                            return i <= e.colors.length ? e.colors[i] : e.randColor();
                    })
                    .on('click', function(d, i) {
                        //set data selected event
                        if (d.selected) { d.selected = false; } else { d.selected = true; }

                        //check if data is selected
                        if(d.selected) {
                            //get current slices
                            d3.select(slices[0][i])
                                .transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', function () {
                                    //return translation
                                    if(isPyramid)
                                        return 'translate(' + (funnelWidth + 10) + ',' + funnelHeight + ')rotate(180)';
                                    else
                                        return 'translate(10)';
                                });

                            //check index
                            if(i === chart.data.length - 1 && neck != null) {
                                neck.transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', function () {
                                        //return translation
                                        return 'translate(10)';
                                    });
                            }
                        } else {
                            //get current slices
                            d3.select(slices[0][i])
                                .transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', function () {
                                    //return translation
                                    if(isPyramid)
                                        return 'translate(' + funnelWidth + ',' + funnelHeight + ')rotate(180)';
                                    else
                                        return 'translate(0)';
                                });

                            //check index
                            if(i === chart.data.length - 1) {
                                //check index
                                if(i === chart.data.length - 1 && neck != null) {
                                    neck.transition()
                                        .duration(chart.animationDuration / 2)
                                        .attr('transform', function () {
                                            //return translation
                                            return 'translate(0)';
                                        });
                                }
                            }
                        }

                        //check legendClick event handler to raise it
                        if(chart.legendClick)
                            chart.legendClick(d, i);
                    });

                //update funnel width
                funnelWidth -= legendWidth;
                grade = 2 * funnelHeight / (funnelWidth - gradePercent * funnelWidth);
                totalArea = (funnelWidth + gradePercent * funnelWidth) * funnelHeight / 2;
            }

            //get trapezoid paths
            var paths = getPaths();

            //transform the canvas to set margins
            chart.svg.attr('transform', 'translate(' + transX + ', ' + transY + ')');

            //create slice data
            slices = chart.svg.select('.eve-funnel-slices')
                .selectAll('path.eve-funnel-slice')
                .data(chart.data)
                .enter().insert('path')
                .attr('class', function(d, i) { return 'eve-funnel-slice eve-funnel-slice-' + i; })
                .attr('d', function(d, i) { return funnel(paths[i]); })
                .style('stroke', '#ffffff')
                .style("stroke-width", 0)
                .style('fill', function (d, i) {
                    //check whether the serie has colorField
                    if (serie.colorField !== '')
                        return d.data[serie.colorField];
                    else
                        return i <= e.colors.length ? e.colors[i] : e.randColor();
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
                .on('click', function(d, i) {
                    //set data selected event
                    if (d.selected) { d.selected = false; } else { d.selected = true; }

                    //check if data is selected
                    if(d.selected) {
                        //get current slices
                        d3.select(this)
                            .transition()
                            .duration(chart.animationDuration / 2)
                            .attr('transform', function () {
                                //return translation
                                if(isPyramid)
                                    return 'translate(' + (funnelWidth + 10) + ',' + funnelHeight + ')rotate(180)';
                                else
                                    return 'translate(10)';
                            });

                        //check index
                        if(i === chart.data.length - 1 && neck != null) {
                            neck.transition()
                                .duration(chart.animationDuration / 2)
                                .attr('transform', function () {
                                    //return translation
                                    return 'translate(10)';
                                });
                        }
                    } else {
                        //get current slices
                        d3.select(this)
                            .transition()
                            .duration(chart.animationDuration / 2)
                            .attr('transform', function () {
                                //return translation
                                if(isPyramid)
                                    return 'translate(' + funnelWidth + ',' + funnelHeight + ')rotate(180)';
                                else
                                    return 'translate(0)';
                            });

                        //check index
                        if(i === chart.data.length - 1) {
                            //check index
                            if(i === chart.data.length - 1 && neck != null) {
                                neck.transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', function () {
                                        //return translation
                                        return 'translate(0)';
                                    });
                            }
                        }
                    }
                })
                .on('mousemove', function (d, i) {
                    //get data color
                    var balloonContent = chart.getSlicedFormat(i, serie);

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
            if (!isPyramid && serie.neckHeight > 0) {
                //get last funnel point
                var lastVal = chart.data[chart.data.length - 1][serie.valueField],
                    lfp = slices[0][chart.data.length - 1].getBBox(),
                    neckY = lfp.height + lfp.y,
                    neckH = serie.neckHeight,
                    lfpArea = lastVal * totalArea / totalData,
                    neckW = Math.sqrt((grade * lfp.width * lfp.width - 4 * lfpArea) / grade),
                    neckX = lfp.x + lfp.width / 2 - neckW / 2;

                //insert neck
                neck = chart.svg.insert('rect')
                    .style('fill', function () {
                        //get last data
                        var d = chart.data[chart.data.length - 1],
                            i = chart.data.length - 1;

                        //check whether the serie has colorField
                        if (serie.colorField !== '')
                            return d[serie.colorField];
                        else
                            return i <= e.colors.length ? e.colors[i] : e.randColor();
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
                        //get data color
                        var balloonContent = chart.getSlicedFormat((chart.data.length - 1), serie);

                        //Show balloon
                        chart.showBalloon(balloonContent);

                        //Set hover for the current slice
                        d3.select(this).style('opacity', serie.hoverOpacity);

                        //check whether the neck is not null
                        d3.select(slices[0][chart.data.length - 1]).style('opacity', serie.hoverOpacity);
                    })
                    .on('mouseout', function () {
                        //Hide balloon
                        chart.hideBalloon();

                        //Remove opacity of the curent slice
                        d3.select(this).style('opacity', 1);

                        //check whether the neck is not null
                        d3.select(slices[0][chart.data.length - 1]).style('opacity', 1);
                    });
            }

            //check whether the serie is pyramid and reverse the funnel
            if (isPyramid)
                slices.attr('transform', 'translate(' + (funnelWidth) + ',' + (funnelHeight) + ')rotate(180)');

            //re-position legend texts and icons
            if(chart.legend.enabled) {
                //reposition texts
                legendTexts
                    .attr('x', chart.width - legendWidth - margin.left)
                    .attr('y', function(d, i) {
                        //calculate y position
                        var iconHeight = Math.sqrt(symbolSize) / 2,
                            y = ((chart.height - legendHeight) / 2) + ((chart.legend.fontSize + iconHeight) * i) - Math.sqrt(symbolSize);

                        //return y pos
                        return y;
                    });

                //reposition icons
                legendIcons
                    .attr('transform', function(d, i) {
                        //calculate x, y position
                        var bbox = this.getBBox(),
                            iconHeight = Math.sqrt(symbolSize) / 2,
                            x = chart.width - legendWidth - margin.left - Math.sqrt(symbolSize),
                            y = ((chart.height - legendHeight) / 2) + ((chart.legend.fontSize + iconHeight) * i) - (chart.legend.fontSize + iconHeight);

                        //return translation
                        return 'translate(' + x + ',' + y + ')';
                    });
            }

            //check whether the labels are enables
            if (serie.labelFormat !== '') {
                //add g for funnel labels
                var labelTexts = chart.svg.append('g').attr('class', 'eve-funnel-labels');

                //set labels
                chart.svg.select('.eve-funnel-labels')
                    .selectAll('text')
                    .data(chart.data)
                    .enter().append('text')
                    .style('fill', serie.labelFontColor)
                    .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                    .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                    .style("font-family", serie.labelFontFamily)
                    .style("font-size", serie.labelFontSize + 'px')
                    .style('text-anchor', 'left')
                    .text(function (d, i) { return chart.getSlicedFormat(i, serie, 'label'); })
                    .attr('transform', function (d, i) {
                        //get positions
                        var fSlice = slices[0][i].getBBox(),
                            bbox = this.getBBox(),
                            xPos = funnelWidth / 2 - bbox.width / 2,
                            yPos = fSlice.y + fSlice.height / 2 + bbox.height / 2;

                        //check whether the chart is pyramid
                        if (isPyramid)
                            yPos = (funnelHeight - fSlice.y) - fSlice.height / 2 + bbox.height / 2;

                        //return translation
                        return 'translate(' + xPos + ',' + yPos + ')';
                    });
            }
        }

        //init funnel
        init();

        //return chart object
        return chart;
    }

    //attach funnel method into eve
    e.funnelChart = function(options) {
        //set chart type
        options.type = 'funnel';

        return new funnel(options);
    }

    //attach donut method into eve
    e.pyramidChart = function(options) {
        //set chart type
        options.type = 'pyramid';

        return new funnel(options);
    }

})(eve);
