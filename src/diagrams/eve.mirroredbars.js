/*!
 * eve.populationpyramid.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for population pyramid diagram.
 */
(function (e) {
    //define multiples diagram class
    function mirroredBars(options) {
        //declare needed variables
        let diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            margin = { left: 0, top: 0, right: 0, bottom: 0 },
            autoTickCount = 0,
            xScaleLeft = null,
            xScaleRight = null,
            yScale = null,
            xAxisLeft = null,
            xAxisRight = null,
            yAxis = null,
            xAxisLeftSVG = null,
            xAxisRightSVG = null,
            yAxisSVG = null,
            minFontSize = 11,
            xPos = 0, yPos = 0,
            groupNames = [],
            maxGroupLength = 0,
            maxGroupText = '',
            tempTextSVG = null,
            tempTextOffset = null,
            sources = [],
            yAxisWidth = 0,
            sourceFieldType = typeof diagram.data[0][currentSerie.sourceField],
            singleDiagramWidth = 0,
            minMeasure = 0,
            maxMeasure = 0,
            rightAxisStart = 0,
            totalDiagramWidth = 0,
            diagramHeight = 0,
            axisLeftG = null,
            axisMiddleG = null,
            axisRightG = null,
            yAxisStart = 0,
            rectsLeftSVG = null,
            rectsRightSVG = null,
            labelsLeftSVG = null,
            labelsRightSVG = null,
            colors = [],
            bbox = null;

        //gets x axis tick count
        function getXAxisTickCount() {
            //set tick count to 10
            let tickCount = 10;

            //set temporary text value for x axis
            tempTextSVG = diagram.svg.append('text')
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('color', diagram.xAxis.labelFontColor)
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle == 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle == 'bold' ? 'bold' : 'normal')
                .attr('transform', 'rotate(' + diagram.xAxis.labelAngle + ')')
                .text(diagram.formatNumber(maxMeasure, diagram.xAxis.labelFormat));

            //get offset for x axis value
            tempXAxisSVGOffset = tempTextSVG.node().getBoundingClientRect();

            //remove svg text for x axis
            tempTextSVG.remove();

            //check whether the axis tick count is auto
            if (diagram.xAxis.tickCount === 'auto') {
                //set tick count
                tickCount = Math.ceil(singleDiagramWidth / tempXAxisSVGOffset.width) - 1;

                //set tick count via x props
                if (tickCount > diagram.data.length)
                    tickCount = diagram.data.length;
            } else {
                //set manuel tick count
                tickCount = parseInt(diagram.xAxis.tickCount);
            }

            //return updated tick count
            return e.closestPower(Math.ceil(tickCount));
        }

        //creates x axis
        function createXAxis(position) {
            return d3.axisBottom(position === 'left' ? xScaleLeft : xScaleRight).tickValues([minMeasure, maxMeasure]);
        }

        //creates y axis
        function createYAxis() {
            return d3.axisLeft(yScale);
        }

        //calculates scales
        function calculateScales() {
            //get group names
            groupNames = d3.keys(diagram.data[0]).filter(function (d) {
                if (d !== currentSerie.sourceField && d !== 'total' && d.indexOf('_') === -1)
                    return d;
            });

            //iterate data
            diagram.data.forEach(function (d) {
                //iterate all keys
                for (let key in d) {
                    if (key !== currentSerie.sourceField) {
                        d[key] = +d[key];
                    }
                }
            });

            //get unique values as sources
            sources = e.getUniqueValues(diagram.data, currentSerie.sourceField);

            //iterate all sources to set maxes
            sources.forEach(function (d) {
                //check if current content > max group
                if (d) {
                    if (d.toString().length > maxGroupLength) {
                        //set max group length
                        maxGroupLength = d.toString().length;
                        maxGroupText = d.toString();
                    }
                }
            });

            //check whether the x values is not null
            if (diagram.xAxis.xValues)
                sources = diagram.xAxis.xValues;

            //create temp text
            tempTextSVG = diagramG.append('text')
                .text(maxGroupText)
                .style('font-size', diagram.yAxis.labelFontSize + 'px')
                .style('color', diagram.yAxis.labelFontColor)
                .style('font-family', diagram.yAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.yAxis.labelFontStyle == 'bold' ? 'normal' : diagram.yAxis.labelFontStyle)
                .style('font-weight', diagram.yAxis.labelFontStyle == 'bold' ? 'bold' : 'normal');

            //get offset
            tempTextOffset = tempTextSVG.node().getBoundingClientRect();

            //remnove temp text
            tempTextSVG.remove();

            //set dimensions
            yAxisWidth = tempTextOffset.width + 10;
            singleDiagramWidth = (diagram.plot.width - diagram.plot.left - diagram.plot.right - yAxisWidth) / 2;
            rightAxisStart = singleDiagramWidth + yAxisWidth;
            totalDiagramWidth = singleDiagramWidth * 2 + yAxisWidth;
            diagramHeight = diagram.plot.height - diagram.plot.top - diagram.plot.bottom - diagram.margin.top - diagram.margin.bottom - diagram.xAxis.labelFontSize;
            yAxisStart = rightAxisStart - yAxisWidth / 2 + 10;

            //sort descending
            sources.sort(d3.descending);

            //set min measure
            minMeasure = d3.min(diagram.data, function (d) {
                return d3.min(groupNames, function (v) {
                    return d[v];
                });
            });

            //check start from zero
            if (diagram.xAxis.startsFromZero) {
                diagram.domains.minY = 0;
                minMeasure = 0;
            }

            //set max measure
            maxMeasure = d3.max(diagram.data, function (d) {
                return d3.max(groupNames, function (v) {
                    return d[v];
                });
            });

            //set diagram domains
            diagram.domains.xValues = sources;
            diagram.domains.minY = minMeasure / 2;
            diagram.domains.maxY = maxMeasure * 1.2;
                
            //check whether the y axis has min and max
            if (diagram.yAxis.locked) {
                //check whether the y axis has min and max
                if (!isNaN(diagram.yAxis.min) && diagram.yAxis.min !== null) {
                    minMeasure = diagram.yAxis.min;
                    diagram.domains.minY = diagram.yAxis.min / 2;
                }

                if (!isNaN(diagram.yAxis.max) && diagram.yAxis.max !== null) {
                    maxMeasure = diagram.yAxis.max;
                    diagram.domains.maxY = diagram.yAxis.max * 1.2;
                }
            }

            //create scales
            xScaleLeft = d3.scaleLinear().range([singleDiagramWidth, 0]).domain([diagram.domains.minY, diagram.domains.maxY]);
            xScaleRight = d3.scaleLinear().range([rightAxisStart, totalDiagramWidth]).domain([diagram.domains.minY, diagram.domains.maxY]);
            yScale = d3.scaleBand().range([0, diagramHeight]).padding(0.1).round(true).domain(diagram.domains.xValues);

            if (currentSerie.labelFontSize === 'auto')
                currentSerie.labelFontSize = minFontSize;
        }

        //creates axes
        function drawAxes() {
            //create x axis g
            axisLeftG = diagramG.append('g').attr('transform', 'translate(0, 0)');
            axisMiddleG = diagramG.append('g').attr('transform', 'translate(0, 0)');
            axisRightG = diagramG.append('g').attr('transform', 'translate(0, 0)');

            //set x and y axis
            xAxisLeft = createXAxis('left');
            xAxisRight = createXAxis('right');
            yAxis = createYAxis();

            //create x axis svg left
            xAxisLeftSVG = axisLeftG.append('g')
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', 'translate(0,' + diagramHeight + ')')
                .attr('class', 'eve-x-axis')
                .call(xAxisLeft);

            //create x axis svg right
            xAxisRightSVG = axisRightG.append('g')
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', 'translate(0,' + diagramHeight + ')')
                .attr('class', 'eve-x-axis')
                .call(xAxisRight);

            //create middle axis
            yAxisSVG = axisMiddleG.append('g')
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', 'translate(' + yAxisStart + ')')
                .attr('class', 'eve-y-axis')
                .call(yAxis);
        }

        //updates axis
        function updateAxisStyle() {
            //select x axis path and change stroke
            xAxisLeftSVG.selectAll('path')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('stroke', diagram.xAxis.color);

            //select all lines in xaxis
            xAxisLeftSVG.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke', diagram.xAxis.color);

            //select all texts in xaxis
            xAxisLeftSVG.selectAll('text')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'middle')
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .text(function (d) {
                    if (e.getType(d) === 'number') {
                        if (diagram.xAxis.labelFormat)
                            return e.formatNumber(d, diagram.xAxis.labelFormat);
                        else if (d.toString().indexOf('.') > -1)
                            return d.toFixed(2);
                    }
                    return d;
                });

            //select x axis path and change stroke
            xAxisRightSVG.selectAll('path')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('stroke', diagram.xAxis.color);

            //select all lines in xaxis
            xAxisRightSVG.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke', diagram.xAxis.color);

            //select all texts in xaxis
            xAxisRightSVG.selectAll('text')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'middle')
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .text(function (d) {
                    if (e.getType(d) === 'number') {
                        if (diagram.xAxis.labelFormat)
                            return e.formatNumber(d, diagram.xAxis.labelFormat);
                        else if (d.toString().indexOf('.') > -1)
                            return d.toFixed(2);
                    }
                    return d;
                });

            //select x axis path and change stroke
            yAxisSVG.selectAll('path')
                .style('stroke-opacity', 0)
                .style('stroke-width', '0px')
                .style('stroke', diagram.yAxis.color);

            //select all lines in yaxis
            yAxisSVG.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', diagram.yAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', 0)
                .style('stroke', diagram.yAxis.color);

            //select all texts in yaxis
            yAxisSVG.selectAll('text')
                .style('fill', diagram.yAxis.labelFontColor)
                .style('font-size', diagram.yAxis.labelFontSize + 'px')
                .style('font-family', diagram.yAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.yAxis.labelFontStyle === 'bold' ? 'normal' : diagram.yAxis.labelFontStyle)
                .style('font-weight', diagram.yAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'middle')
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .text(function (d) {
                    if (e.getType(d) === 'number') {
                        if (diagram.yAxis.labelFormat)
                            return e.formatNumber(d, diagram.yAxis.labelFormat);
                        else if (d.toString().indexOf('.') > -1)
                            return d.toFixed(2);
                    }
                    return d;
                });
        }

        //initializes diagram
        function initDiagram() {
            //create left rectangles
            rectsLeftSVG = axisLeftG.selectAll('eve-mirror-left')
                .data(diagram.data)
                .enter().append('rect')
                .attr('class', 'eve-mirror-left')
                .attr('height', yScale.bandwidth())
                .attr('width', function (d) {
                    //calculate rectangle width
                    d._rectWidth = singleDiagramWidth - xScaleLeft(d[groupNames[0]]);

                    //we need to return 0 to animate rectangle
                    return 0;
                })
                .attr('fill', diagram.legend.legendColors.length > 0 ? (e.matchGroup(groupNames[0], diagram.legend.legendColors, 'color')) : e.colors[0])
                .attr('stroke', diagram.legend.legendColors.length > 0 ? (e.matchGroup(groupNames[0], diagram.legend.legendColors, 'color')) : e.colors[0])
                .attr('fill-opacity', diagram.animation.effect === 'add' ? 0 : currentSerie.alpha)
                .attr('stroke-opacity', diagram.animation.effect === 'add' ? 0 : currentSerie.sliceStrokeAlpha)
                .attr('stroke-width', currentSerie.sliceStrokeThickness)
                .attr('y', function (d) { return yScale(d[currentSerie.sourceField]); })
                .attr('x', function (d) {
                    //calculate x position
                    d._rectX = singleDiagramWidth - d._rectWidth;

                    //we need to return diagram width to animate rectangle
                    return singleDiagramWidth;
                })
                .on('mousemove', function (d, i) {
                    //set slice hover
                    d3.select(this).attr('fill-opacity', currentSerie.sliceHoverAlpha);

                    //update d value
                    d._measureValue = d[groupNames[0]];
                    d._groupValue = groupNames[0];

                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //set slice hover
                    d3.select(this).attr('fill-opacity', currentSerie.alpha);

                    //hide tooltip
                    diagram.hideTooltip();
                })
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('fill-opacity', currentSerie.alpha)
                .attr('stroke-opacity', currentSerie.sliceStrokeAlpha)
                .attr('width', function (d) { return d._rectWidth; })
                .attr('x', function (d) { return d._rectX; });

            //create right rectangles
            rectsRightSVG = axisRightG.selectAll('eve-mirror-right')
                .data(diagram.data)
                .enter().append('rect')
                .attr('class', 'eve-mirror-right')
                .attr('height', yScale.bandwidth())
                .attr('width', function (d) {
                    //calculate rectangle width
                    d._rectWidth = singleDiagramWidth - xScaleLeft(d[groupNames[1]]);

                    //we need to return 0 to animate rectangle
                    return 0;
                })
                .attr('fill', diagram.legend.legendColors.length > 0 ? (e.matchGroup(groupNames[1], diagram.legend.legendColors, 'color')) : e.colors[1])
                .attr('stroke', diagram.legend.legendColors.length > 0 ? (e.matchGroup(groupNames[1], diagram.legend.legendColors, 'color')) : e.colors[1])
                .attr('fill-opacity', diagram.animation.effect === 'add' ? 0 : currentSerie.alpha)
                .attr('stroke-opacity', diagram.animation.effect === 'add' ? 0 : currentSerie.sliceStrokeAlpha)
                .attr('stroke-width', currentSerie.sliceStrokeThickness)
                .attr('y', function (d) { return yScale(d[currentSerie.sourceField]); })
                .attr('x', rightAxisStart)
                .on('mousemove', function (d, i) {
                    //set slice hover
                    d3.select(this).attr('fill-opacity', currentSerie.sliceHoverAlpha);

                    //update d value
                    d._measureValue = d[groupNames[1]];
                    d._groupValue = groupNames[1];

                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //set slice hover
                    d3.select(this).attr('fill-opacity', currentSerie.alpha);

                    //hide tooltip
                    diagram.hideTooltip();
                })
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('fill-opacity', currentSerie.alpha)
                .attr('stroke-opacity', currentSerie.sliceStrokeAlpha)
                .attr('width', function (d) { return d._rectWidth; });

            //check whether the label format available
            if (currentSerie.labelFormat) {
                //create left labels
                labelsLeftSVG = axisLeftG.selectAll('eve-mirror-label-left')
                    .data(diagram.data)
                    .enter().append('text')
                    .attr('class', 'eve-mirror-label-left')
                    .text(function (d) {
                        //update d value
                        d._measureValue = d[groupNames[0]];
                        d._groupValue = groupNames[0];
                        return diagram.getContent(d, currentSerie, currentSerie.labelFormat);
                    })
                    .style('fill', currentSerie.labelFontColor)
                    .style('font-size', currentSerie.labelFontSize + 'px')
                    .style('font-family', currentSerie.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'left')
                    .attr('x', singleDiagramWidth)
                    .attr('y', function (d) { return yScale(d[currentSerie.sourceField]) + yScale.bandwidth() / 2 + currentSerie.labelFontSize / 2; })
                    .transition().duration(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .delay(function (d, i) { return i * diagram.animation.delay; })
                    .attr('x', function (d) {
                        return d._rectX - this.getBBox().width;
                    })

                //create right labels
                labelsRightSVG = axisLeftG.selectAll('eve-mirror-label-right')
                    .data(diagram.data)
                    .enter().append('text')
                    .attr('class', 'eve-mirror-label-right')
                    .text(function (d) {
                        //update d value
                        d._measureValue = d[groupNames[1]];
                        d._groupValue = groupNames[1];
                        return diagram.getContent(d, currentSerie, currentSerie.labelFormat);
                    })
                    .style('fill', currentSerie.labelFontColor)
                    .style('font-size', currentSerie.labelFontSize + 'px')
                    .style('font-family', currentSerie.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'left')
                    .attr('x', rightAxisStart)
                    .attr('y', function (d) { return yScale(d[currentSerie.sourceField]) + yScale.bandwidth() / 2 + currentSerie.labelFontSize / 2; })
                    .transition().duration(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .delay(function (d, i) { return i * diagram.animation.delay; })
                    .attr('x', function (d) { return rightAxisStart + d._rectWidth; })
            }
        }

        //create diagram g
        let diagramG = diagram.svg.append('g')
            .attr('class', 'eve-vis-g')
            .attr('transform', 'translate(10,0)');

        //calculate mirrored bar diagram environment
        calculateScales();
        drawAxes();
        updateAxisStyle();
        initDiagram();

        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //remove g
            if (diagram.animation.effect) {
                //check whether the effect is fade
                if (diagram.animation.effect === 'fade') {
                    //remove with transition
                    diagramG.transition().duration(1000).style('opacity', 0).remove();
                } else if (diagram.animation.effect === 'dim') {
                    //remove with transition
                    diagramG.style('opacity', 0.15);
                } else if (diagram.animation.effect === 'add') {
                    //remove with transition
                    diagramG.style('opacity', 1);
                } else {
                    //remove immediately
                    diagramG.remove();
                }
            } else {
                //remove immediately
                diagramG.remove();
            }

            //re-append g
            diagramG = diagram.svg.append('g')
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(10,0)');

            //calculate mirrored bar diagram environment
            calculateScales();
            drawAxes();
            updateAxisStyle();
            initDiagram();
        };

        //attach clear content method to chart
        diagram.clear = function () {
            //remove g from the content
            diagram.svg.selectAll('.eve-vis-g').remove();
        };

        return diagram;
    }

    //attach population pyramid method into the eve
    e.mirroredBars = function (options) {
        options.type = 'mirroredBars';

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new mirroredBars(options);
    };
})(eve);