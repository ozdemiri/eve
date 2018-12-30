/*!
 * eve.gantt.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for gantt diagram.
 */
(function (e) {
    //define gantt diagram class
    function gantt(options) {
        //declare needed variables
        let diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            maxTaskLength = 0,
            timeDomainStart = null,
            timeDomainEnd = null,
            autoMargin = 0,
            margin = { left: 0, top: 0, right: 0, bottom: 0 },
            axisFormatting = d3.utcFormat('%x'),
            width = 0,
            height = 0,
            dateDiff = 0,
            maxAxisLength = 0,
            singleAxisWidth = 0,
            autoTickCount = 0,
            xScale = null,
            yScale = null,
            xAxis = null,
            yAxis = null,
            tasks = [],
            groups = [],
            xAxisSVG = null,
            taskRects = null,
            taskLabels = null,
            currentRectWidth = 0,
            hasSelection = false,
            minFontSize = 11,
            xPos = 0, yPos = 0,
            bbox = null,
            currentColor = null,
            yAxisSVG = null,
            startDateField = currentSerie.startField || currentSerie.startDateField,
            endDateField = currentSerie.endField || currentSerie.endDateField;

        //calculates scales and environmental variables
        function calculateScales(keepAxis) {
            //get min and max values
            maxTaskLength = d3.max(diagram.data, function (d) { return d[currentSerie.sourceField].toString().length; });
            tasks = e.getUniqueValues(diagram.data, currentSerie.sourceField);
            groups = e.getUniqueValues(diagram.data, currentSerie.groupField);

            //set domain info
            timeDomainStart = d3.min(diagram.data, function (d) { return new Date(d[startDateField]); });
            timeDomainEnd = d3.max(diagram.data, function (d) { return new Date(d[endDateField]); });
            dateDiff = timeDomainEnd.diff(timeDomainStart);

            //set axis formatting via date diff
            if (dateDiff > 365) {
                //set axis formatting
                axisFormatting = d3.utcFormat('%e-%b-%Y');
            } else {
                if (dateDiff < 1) {
                    //set axis formatting
                    axisFormatting = d3.utcFormat('%X');
                } else {
                    //set axis formatting
                    axisFormatting = d3.utcFormat('%b-%e');
                }
            }

            //calculate margins
            autoMargin = ((diagram.yAxis.labelFontSize / 2) * (maxTaskLength + 1)) + diagram.yAxis.labelFontSize;
            margin.left = diagram.margin.left + autoMargin;
            margin.right = diagram.margin.right;
            margin.top = diagram.margin.top;
            margin.bottom = diagram.margin.bottom;

            //set dimension
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right - margin.left - margin.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom - margin.top - margin.bottom;

            //caclulate tick count
            maxAxisLength = axisFormatting(timeDomainEnd).length;
            singleAxisWidth = (((diagram.xAxis.labelFontSize / 2) * (maxAxisLength)) + diagram.xAxis.labelFontSize);
            autoTickCount = Math.floor(width / singleAxisWidth);

            //create scales
            xScale = d3.scaleUtc().domain([timeDomainStart, timeDomainEnd]).range([0, width]).clamp(true);
            yScale = d3.scaleBand().domain(tasks).range([height - margin.top - margin.bottom, 0]).padding(0.1);

            //create axes
            xAxis = d3.axisBottom().scale(xScale).ticks(autoTickCount / 2).tickFormat(axisFormatting);
            yAxis = d3.axisLeft().scale(yScale).tickSize(0);

            if (currentSerie.labelFontSize === 'auto')
                currentSerie.labelFontSize = 11;
        }

        //updates axis
        function updateAxisStyle() {
            //select x axis path and change stroke
            xAxisSVG.selectAll('path')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('stroke', diagram.xAxis.color);

            //select all lines in xaxis
            xAxisSVG.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke', diagram.xAxis.color);

            //select all texts in xaxis
            xAxisSVG.selectAll('text')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'middle')
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .text(function (d) {
                    return axisFormatting(new Date(d));
                });

            //select x axis path and change stroke
            yAxisSVG.selectAll('path')
                .style('stroke-opacity', diagram.yAxis.alpha)
                .style('stroke-width', diagram.yAxis.thickness + 'px')
                .style('stroke', diagram.yAxis.color);

            //select all lines in yaxis
            yAxisSVG.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', diagram.yAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', diagram.yAxis.alpha)
                .style('stroke', diagram.yAxis.color);

            //select all texts in yaxis
            yAxisSVG.selectAll('text')
                .style('fill', diagram.yAxis.labelFontColor)
                .style('font-size', diagram.yAxis.labelFontSize + 'px')
                .style('font-family', diagram.yAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.yAxis.labelFontStyle === 'bold' ? 'normal' : diagram.yAxis.labelFontStyle)
                .style('font-weight', diagram.yAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .text(function (d) { return d; });
        }

        //initializes axes for both cases
        function createAxes() {
            //create x axis svg
            xAxisSVG = diagramG.append('g')
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', 'translate(0,' + (height - margin.bottom - margin.top) + ')')
                .attr('class', 'eve-x-axis')
                .call(xAxis);

            //create y axis left svg
            yAxisSVG = diagramG.append('g')
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', 'translate(0)')
                .attr('class', 'eve-y-axis')
                .call(yAxis);

            //set axes styling
            updateAxisStyle();
        }

        //returns a key for the current task
        let getTaskKey = function (d) {
            return d[startDateField] + d[currentSerie.sourceField] + d[endDateField];
        };

        //returns rectangular transform for the current task
        let getTaskTransform = function (d, isInit) {
            return 'translate(' + (isInit ? 0 : xScale(new Date(d[startDateField]))) + ',' + yScale(d[currentSerie.sourceField]) + ')';
        };

        //returns rectangular transform for the current task
        let getLabelTransform = function (d, isInit) {
            //get y pos
            xPos = (isInit ? 0 : xScale(new Date(d[startDateField])) + 5)
            yPos = yScale(d[currentSerie.sourceField]) + yScale.bandwidth() / 2 + currentSerie.labelFontSize / 2;

            //return translation
            return 'translate(' + xPos + ',' + yPos + ')';
        };

        //returns rectangle color for the current task status
        let getTaskStatusColor = function (d) {
            //get color
            let taskColor = e.colors[0],
                groups = [];

            //iterate all groups
            diagram.data.forEach(function (currentData) {
                if (groups.indexOf(currentData[currentSerie.groupField]) === -1)
                    groups.push(currentData[currentSerie.groupField]);
            });

            //sort groups
            groups.sort();

            //check whethr the currrent serie has group field
            if (currentSerie.groupField) {
                //check legend values
                if (diagram.legend.legendColors && diagram.legend.legendColors.length) {
                    //iterate all legend colors
                    diagram.legend.legendColors.forEach(function (l) {
                        if (l.value === d[currentSerie.groupField])
                            taskColor = l.color;
                    });
                } else {
                    //iterate all legend colors
                    groups.forEach(function (currentGroup, groupIndex) {
                        if (currentGroup === d[currentSerie.groupField])
                            taskColor = groupIndex > e.colors.length ? e.randColor() : e.colors[groupIndex];
                    });
                }
            } else {
                //return serie color if there is no group
                taskColor = diagram.legend.legendColors.length > 0 ? diagram.legend.legendColors[0].color : (i >= e.colors.length ? e.randColor() : e.colors[0]);
            }

            //return color for the group
            return taskColor;
        };

        //animates diagram
        function animateDiagram() {
            //animate rectangles
            taskRects
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .style('fill', getTaskStatusColor)
                .attr('transform', function (d) { return getTaskTransform(d, false); })
                .attr('rx', 2)
                .attr('ry', 2)
                .attr('y', 0)
                .attr('height', function (d) { return yScale.bandwidth(); })
                .attr('width', function (d) {
                    //set current rectangle width
                    currentRectWidth = (xScale(new Date(d[endDateField])) - xScale(new Date(d[startDateField])));

                    //check width and return
                    return currentRectWidth < 0 ? 0 : currentRectWidth;
                });

            //animate labels
            taskLabels
                .style('fill-opacity', function (d) {
                    //set current rectangle width
                    bbox = this.getBBox();
                    currentRectWidth = (xScale(new Date(d[endDateField])) - xScale(new Date(d[startDateField])));

                    //check label visibility
                    if (currentSerie.labelVisibility === 'always')
                        return currentRectWidth < 0 ? 0 : 1;
                    else
                        return currentRectWidth > bbox.width ? 1 : 0;
                })
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('transform', function (d) { return getLabelTransform(d, false); });
        }

        //initializes diagram and creates axes
        function initDiagram() {
            //create rectangles
            taskRects = diagramG.selectAll('.eve-gantt-chart')
                .data(diagram.data, getTaskKey)
                .enter().append('rect')
                .attr('class', 'eve-gantt-chart')
                .attr('fill', getTaskStatusColor)
                .attr('fill-opacity', currentSerie.alpha)
                .attr('rx', 2)
                .attr('ry', 2)
                .attr('y', 0)
                .attr('height', function (d) { return yScale.bandwidth(); })
                .attr('width', 0)
                .attr('transform', function (d) { return getTaskTransform(d, true); })
                .style('cursor', 'pointer')
                .on('click', function (d, i) {
                    //set d clicked
                    if (d.clicked == null) {
                        //set d clicked
                        d.clicked = true;
                    } else {
                        //set d clicked
                        d.clicked = !d.clicked;
                    }

                    //check whether the item clicked
                    if (d.clicked) {
                        //decrease opacity
                        hasSelection = true;
                        diagramG.selectAll('.eve-gantt-chart').attr('fill-opacity', 0.05);
                        diagramG.selectAll('.eve-gantt-labels').attr('fill-opacity', 0.05);

                        //select this
                        d3.select(this).attr('fill-opacity', 1);
                        d3.select('#' + diagram.container + '_svgText_' + i).attr('fill-opacity', 1);
                    } else {
                        //decrease opacity
                        hasSelection = false;
                        diagramG.selectAll('.eve-gantt-chart').attr('fill-opacity', 1);
                        diagramG.selectAll('.eve-gantt-labels').attr('fill-opacity', 1);
                    }
                })
                .on('mousemove', function (d, i) {
                    //show tooltip
                    if (!hasSelection) {
                        diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                        d3.select(this).attr('fill-opacity', 1);
                    }
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    if (!hasSelection) {
                        diagram.hideTooltip();
                        d3.select(this).attr('fill-opacity', currentSerie.alpha);
                    }
                });

            //create labels
            taskLabels = diagramG.selectAll('.eve-gantt-labels')
                .data(diagram.data, getTaskKey)
                .enter().append('text')
                .attr('class', 'eve-gantt-labels')
                .style('pointer-events', 'none')
                .style('text-anchor', 'start')
                .style('fill', function (d, i) {
                    currentColor = getTaskStatusColor(d, i);
                    return currentSerie.labelFontColor === 'auto' ? diagram.getAutoColor(currentColor) : currentSerie.labelFontColor;
                })
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('font-size', currentSerie.labelFontSize + 'px')
                .text(function (d) {
                    //return text content
                    return diagram.getContent(d, currentSerie, currentSerie.labelFormat)
                })
                .attr('transform', function (d) { return getLabelTransform(d, true); });
        }

        //create scales and environment
        calculateScales();

        //create diagram g
        let diagramG = diagram.svg.append('g')
            .attr('class', 'eve-vis-g')
            .attr('transform', 'translate(' + margin.left + ',' + diagram.plot.top + ')');

        //create axes and init diagram
        createAxes();
        initDiagram();
        animateDiagram();

        //update diagram
        diagram.update = function (data, keepAxis) {
            //set diagram data
            diagram.data = data;

            //update legend
            diagram.updateLegend();

            //re-calculate scales
            calculateScales(keepAxis);

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
                .attr('transform', 'translate(' + margin.left + ',' + diagram.plot.top + ')');

            //create axes and init diagram
            createAxes();
            initDiagram();

            //animate diagram
            animateDiagram();
        };

        //attach clear content method to chart
        diagram.clear = function () {
            //remove g from the content
            diagram.svg.selectAll('.eve-vis-g').remove();
        };

        //return abacus diagram
        return diagram;
    }

    //attach timeline method into the eve
    e.gantt = function (options) {
        options.masterType = 'grouped';
        options.type = "gantt";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new gantt(options);
    };

    //attach timeline method into the eve
    e.gannt = function (options) {
        options.masterType = 'grouped';
        options.type = "gantt";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new gantt(options);
    };
})(eve);