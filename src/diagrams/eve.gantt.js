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
        var diagram = eve.base.init(options),
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
            currentRectWidth = 0,
            yAxisSVG = null;

        //calculates scales and environmental variables
        function calculateScales() {
            //get min and max values
            maxTaskLength = d3.max(diagram.data, function (d) { return d[currentSerie.sourceField].toString().length; });
            timeDomainStart = d3.min(diagram.data, function (d) { return new Date(d[currentSerie.startField]); });
            timeDomainEnd = d3.max(diagram.data, function (d) { return new Date(d[currentSerie.startField]); });
            dateDiff = timeDomainEnd.diff(timeDomainStart);
            tasks = e.getUniqueValues(diagram.data, currentSerie.sourceField);
            groups = e.getUniqueValues(diagram.data, currentSerie.groupField);
            
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
                .transition(diagram.animation.duration)
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
                .transition(diagram.animation.duration)
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
        var getTaskKey = function (d) {
            return d[currentSerie.startField] + d[currentSerie.sourceField] + d[currentSerie.endField];
        };

        //returns rectangular transform for the current task
        var getTaskTransform = function (d, isInit) {
            return 'translate(' + (isInit ? 0 : xScale(new Date(d[currentSerie.startField]))) + ',' + yScale(d[currentSerie.sourceField]) + ')';
        };

        //returns rectangle color for the current task status
        var getTaskStatusColor = function (d) {
            //get color
            var taskColor = e.colors[0];

            //iterate all legend colors
            diagram.legendValues.forEach(function (l) {
                if (l.value === d[currentSerie.groupField])
                    taskColor = l.color;
            });

            //return color for the group
            return taskColor;
        };

        //animates diagram
        function animateDiagram() {
            //animate rectangles
            taskRects
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .style('fill', getTaskStatusColor)
                .attr('transform', function (d) { return getTaskTransform(d, false); })
                .attr('rx', 2)
                .attr('ry', 2)
                .attr('y', 0)
                .attr('height', function (d) { return yScale.bandwidth(); })
                .attr('width', function (d) {
                    //set current rectangle width
                    currentRectWidth = (xScale(new Date(d[currentSerie.endField])) - xScale(new Date(d[currentSerie.startField])));

                    //check width and return
                    return currentRectWidth < 0 ? 0 : currentRectWidth;
                });
        }

        //initializes diagram and creates axes
        function initDiagram() {
            //create rectangles
            taskRects = diagramG.selectAll('.eve-gannt-chart')
                .data(diagram.data, getTaskKey)
                .enter().append('rect')
                .attr('class', 'eve-gannt-chart')
                .style('fill', getTaskStatusColor)
                .attr('rx', 2)
                .attr('ry', 2)
                .attr('y', 0)
                .attr('height', function (d) { return yScale.bandwidth(); })
                .attr('width', 0)
                .attr('transform', function (d) { return getTaskTransform(d, true); })
                .style('cursor', 'pointer')
                .on('mousemove', function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                });
        }

        //create scales and environment
        calculateScales();

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + diagram.plot.top + ')');

        //create axes and init diagram
        createAxes();
        initDiagram();
        animateDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //re-calculate scales
            calculateScales();

            //change transform
            diagramG = diagram.svg.attr('transform', 'translate(' + margin.left + ',' + diagram.plot.top + ')');

            //update x axis
            xAxisSVG
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .call(xAxis);

            //update y axis left
            yAxisSVG
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .call(yAxis);

            //update axis style with new scale
            updateAxisStyle();

            //update rectangle datas
            taskRects.data(diagram.data).exit().remove();

            //create rectangles
            taskRects
                .style('fill', getTaskStatusColor)
                .attr('rx', 2)
                .attr('ry', 2)
                .attr('y', 0)
                .attr('height', function (d) { return yScale.bandwidth(); })
                .attr('width', 0)
                .attr('transform', function (d) { return getTaskTransform(d, true); })
                .style('cursor', 'pointer');

            //animate diagram
            animateDiagram();
        };

        //draws the chart into a canvas
        diagram.toCanvas = function () {
            //get the chart container
            var orgDiv = document.getElementById(diagram.container);
            /* create the promise for function response
            ** this is required for handling async canvas conversion
            */
            return new Promise(function (resolve) {
                //convert the final clone to canvas
                html2canvas(orgDiv).then(function (canvas) {
                    //return promise with canvas
                    resolve(canvas);
                });
            });
        };

        //returns the chart image 
        diagram.toImage = function () {
            //get the chart container
            var orgDiv = document.getElementById(diagram.container);
            /* create the promise for function response
            ** this is required for handling async canvas conversion
            */
            return new Promise(function (resolve) {
                //convert the final clone to canvas
                html2canvas(orgDiv).then(function (canvas) {
                    //return promise with canvas
                    resolve(canvas.toDataURL('image/png'));
                });
            });
        };

        //return abacus diagram
        return diagram;
    }

    //attach timeline method into the eve
    e.gantt = function (options) {
        options.type = 'grouped';
        return new gantt(options);
    };
})(eve);