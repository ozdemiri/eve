/*!
 * eve.timeline.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for timeline diagram.
 */
(function (e) {
    //define timeline diagram class
    function timeline(options) {
        //declare needed variables
        var diagram = eve.base.init(options),
            currentSerie = diagram.series[0],
            actualHeight = (diagram.plot.height - diagram.plot.top - diagram.plot.bottom - diagram.margin.bottom - diagram.margin.top),
            laneRatio = actualHeight / 4,
            tickSize = 10,
            baseMargin = { top: 0, left: 0, right: diagram.plot.right, bottom: laneRatio},
            laneMargin = { top: (actualHeight - laneRatio + diagram.xAxis.labelFontSize * 2), left: 0, right: diagram.plot.right, bottom: 0 },
            baseHeight = actualHeight - baseMargin.top - baseMargin.bottom,
            laneHeight = actualHeight - laneMargin.top - laneMargin.bottom - (diagram.xAxis.labelFontSize * 2) + tickSize,
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right - diagram.margin.right - diagram.margin.left,
            minDate = null,
            maxDate = null,
            dateDiff = null,
            sources = [],
            currentSource = '',
            sourceValue = '',
            dataBySource = {},
            baseXScale = d3.scaleUtc().range([0, width]),
            laneXScale = d3.scaleUtc().range([0, width]),
            baseYSCale = d3.scaleBand().range([baseHeight, 0]).padding(0.1),
            laneYScale = d3.scaleBand().range([laneHeight, 0]).padding(0.1),
            baseXAxis = null, baseAxis = null,
            laneXAxis = null, laneAxis = null,
            baseGrid = null,
            brush = null,
            baseG, laneG,
            baseContent, laneContent,
            baseIconSize = baseHeight / diagram.data.length,
            laneIconSize = 4,
            currentSize = 0,
            xPos = 0, yPos = 0,
            currentColor = currentSerie.color,
            dataIndex = 0;

        //creates axis
        function createAxis(isLane) {
            return d3.axisBottom().scale(isLane ? laneXScale : baseXScale);
        }

        //calculates environment variables
        function calculateScales() {
            //sort data by source
            diagram.data.sort(function (a, b) {
                return d3.ascending(a[currentSerie.labelField], b[currentSerie.labelField]);
            });

            //calculate min and max dates
            minDate = d3.min(diagram.data, function (d) { return new Date(d[currentSerie.startField]); });
            maxDate = d3.max(diagram.data, function (d) { return currentSerie.endField ? new Date(d[currentSerie.endField]) : new Date(d[currentSerie.startField]); });
            dateDiff = maxDate.diff(minDate);

            //check date diff
            if (dateDiff > 365) {
                //update time domain
                minDate = d3.timeMonth.offset(minDate, -1);
                maxDate = d3.timeMonth.offset(maxDate, 1);
            } else {
                if (dateDiff < 1) {
                    //update time domain
                    minDate = d3.timeDay.offset(minDate, -1);
                    maxDate = d3.timeDay.offset(maxDate, 1);
                } else {
                    //update time domain
                    minDate = d3.timeDay.offset(minDate, -1);
                    maxDate = d3.timeDay.offset(maxDate, 1);
                }
            }

            //create data by sources
            diagram.data.forEach(function (d, i) {
                //get source value
                sourceValue = d[currentSerie.labelField];

                //push the current source into the all sources
                if (sources.indexOf(sourceValue) === -1)
                    sources.push(sourceValue);

                //check whether the source value is different
                if (sourceValue !== currentSource) {
                    //set data by source
                    if (dataBySource[sourceValue]) {
                        dataBySource[sourceValue].push(e.clone(d));  
                    } else {
                        dataBySource[sourceValue] = [];
                        dataBySource[sourceValue].push(e.clone(d));
                    }
                } else {
                    dataBySource[sourceValue].push(e.clone(d));
                }

                //set current source
                currentSource = sourceValue;
            });

            //create axes
            baseXAxis = createAxis(false);
            laneXAxis = createAxis(true);
            baseIconSize = baseHeight / diagram.data.length;

            //set scales
            baseXScale.domain([minDate, maxDate]);
            baseYSCale.domain(sources);
            laneXScale.domain(baseXScale.domain());
            laneYScale.domain(baseYSCale.domain());
        }

        //finds index of the data
        function findDataIndex(labelValue, d) {
            //declare index
            var index = 0;

            //iterate all source datas
            dataBySource[labelValue].forEach(function (a, i) {
                //check whether the a matches with d
                if (currentSerie.dateEndField) {
                    if (d[currentSerie.startField] == a[currentSerie.startField] && d[currentSerie.endField] == a[currentSerie.endField] && d[currentSerie.groupField] == a[currentSerie.groupField])
                        index = i;
                } else {
                    if (d[currentSerie.startField] == a[currentSerie.startField] && d[currentSerie.groupField] == a[currentSerie.groupField])
                        index = i;
                }
            });

            //return founded index
            return index;
        }

        //gets base transform
        function getBaseTransform(d) {
            //set source value
            sourceValue = d[currentSerie.labelField];
            dataIndex = findDataIndex(sourceValue, d);
            xPos = baseXScale(new Date(d[currentSerie.startField]));
            yPos = baseYSCale(d[currentSerie.labelField]) + (baseIconSize * dataIndex);

            //return calculate position
            return 'translate(' + (isNaN(xPos) ? 0 : xPos) + ',' + yPos + ')';
        }

        //gets lane transform
        function getLaneTransform(d) {
            //set source value
            xPos = laneXScale(new Date(d[currentSerie.startField]));
            yPos = laneYScale(d[currentSerie.labelField]);

            //return calculate position
            return 'translate(' + (isNaN(xPos) ? 0 : xPos) + ',' + yPos + ')';
        }

        //gets fill color
        function getFillColor(d, i) {
            //check whethr the currrent serie has group field
            if (currentSerie.groupField) {
                //return group color
                diagram.legendValues.forEach(function (currentLegend, currentLegendIndex) {
                    //check whether the current legend matches with the current data group
                    if (d[currentSerie.groupField] === currentLegend.value)
                        currentColor = currentLegend.color;
                });
                return currentColor;
            } else {
                //return serie color if there is no group
                return currentSerie.color;
            }
        }

        //creates base and lane g
        function createBaseAndLaneG() {
            //append clip paths
            diagramG.append('defs').append('clipPath')
                .attr('id', 'eve-timeline-clip')
                .append('rect')
                .attr('width', width)
                .attr('height', baseHeight);

            //create base g
            baseG = diagramG.append('g')
                .attr('class', 'eve-timeline-base')
                .attr('width', width)
                .attr('transform', 'translate(' + baseMargin.left + ',' + baseMargin.top + ')');

            //create context g
            laneG = diagramG.append('g')
                .attr('class', 'eve-timeline-context')
                .attr('width', width)
                .attr('transform', 'translate(' + laneMargin.left + ',' + laneMargin.top + ')');
        }

        //creates contents for base and lane
        function createContents() {
            //create base content
            baseContent = baseG.append('g')
                .selectAll('.eve-timeline-base-content')
                .data(diagram.data)
                .enter().append('rect')
                .attr('class', 'eve-timeline-base-content')
                .attr('transform', getBaseTransform)
                .style('fill', getFillColor)
                .attr('height', currentSerie.endField ? baseIconSize : laneIconSize)
                .attr('rx', currentSerie.endField ? baseIconSize / 2 : 0)
                .attr('ry', currentSerie.endField ? baseIconSize / 2 : 0)
                .attr('width', function (d) {
                    //check whether the end field is not empty
                    if (currentSerie.endField) {
                        //calculate current size
                        currentSize = Math.abs(baseXScale(new Date(d[currentSerie.endField])) - baseXScale(new Date(d[currentSerie.startField])));

                        //return calculated size
                        return isNaN(currentSize) ? 0 : currentSize;
                    } else {
                        //if there is no end field then we need to use lane icon size
                        return laneIconSize;
                    }
                })
                .on('mousemove', function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                });

            //create lane content
            laneContent = laneG.append('g')
                .selectAll('.eve-timeline-lane-content')
                .data(diagram.data)
                .enter().append('rect')
                .attr('class', 'eve-timeline-lane-content')
                .attr('transform', getLaneTransform)
                .style('fill', getFillColor)
                .style('fill-opacity', 0.1)
                .attr('rx', currentSerie.endField ? laneIconSize / 2 : 0)
                .attr('ry', currentSerie.endField ? laneIconSize / 2 : 0)
                .attr('height', laneIconSize)
                .attr('width', function (d) {
                    //check whether the end field is not empty
                    if (currentSerie.endField) {
                        //calculate current size
                        currentSize = Math.abs(laneXScale(new Date(d[currentSerie.endField])) - laneXScale(new Date(d[currentSerie.startField])));

                        //return calculated size
                        return isNaN(currentSize) ? 0 : currentSize;
                    } else {
                        //if there is no end field then we need to use lane icon size
                        return laneIconSize;
                    }
                });
                
        }

        //update axes styles
        function updateAxisStyles() {
            //set base grid domain style
            baseGrid.selectAll('.domain')
                .style('stroke', 'none')
                .style('stroke-width', '0px');

            //set base grid line style
            baseGrid.selectAll('line')
                .style('stroke-opacity', diagram.xAxis.gridLineThickness)
                .style('stroke-width', diagram.xAxis.gridLineAlpha)
                .style('stroke-dasharray', '2,2')
                .style('stroke', diagram.xAxis.gridLineColor);

            //select x axis path and change stroke
            baseAxis.selectAll('path')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('stroke', diagram.xAxis.color);

            //select all lines in xaxis
            baseAxis.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke', diagram.xAxis.color);

            //select all texts in xaxis
            baseAxis.selectAll('text')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal');
        }

        //creates axes
        function createAxes() {
            //create grid for base
            baseGrid = baseG.append('g')
                .attr('class', 'eve-x-grid')
                .attr('transform', 'translate(0,' + baseHeight + ')')
                .call(createAxis(false).tickSize(-baseHeight, 0, 0).tickFormat(''));

            //create x axis for base
            baseAxis = baseG.append('g')
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr('class', 'eve-timeline-x-axis-base')
                .attr("transform", "translate(0," + baseHeight + ")")
                .call(baseXAxis);

            //create x axis for base
            laneAxis = laneG.append('g')
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr('class', 'eve-timeline-x-axis-base')
                .attr("transform", "translate(0," + laneHeight + ")")
                .call(laneXAxis);

            //select x axis path and change stroke
            laneAxis.selectAll('path')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('stroke', diagram.xAxis.color);

            //select all lines in xaxis
            laneAxis.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke', diagram.xAxis.color);

            //select all texts in xaxis
            laneAxis.selectAll('text')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal');

            //update styles of the axes
            updateAxisStyles();
        }

        //creates brush
        function createBrush() {
            //create brush
            brush = d3.brushX()
                .extent([[0, 0], [width, laneHeight]])
                .on('brush end', brushed);

            //calculate ranges
            var xRange = baseXScale.range(),
                xRangeDiff = xRange[1] - xRange[0],
                xRangeMid = xRangeDiff / 2,
                xRangePerTick = xRangeDiff / tickSize,
                xRangeStart = xRangeMid - xRangePerTick,
                xRangeEnd = xRangeMid + xRangePerTick;

            //append brush
            laneG.append('g')
                .attr('class', 'eve-x-brush')
                .call(brush)
                .call(brush.move, [xRangeStart, xRangeEnd])
                .selectAll('rect')
                .attr('y', 0)
                .attr('height', laneHeight);
        }

        //handles brushed event
        function brushed() {
            //get brushed area from the lane
            var selection = d3.event.selection || laneXScale.range();

            //update base domain
            baseXScale.domain(selection.map(laneXScale.invert, laneXScale));

            //update base rectangles
            baseContent
                .attr('transform', getBaseTransform)
                .attr('rx', currentSerie.endField ? baseIconSize / 2 : 0)
                .attr('ry', currentSerie.endField ? baseIconSize / 2 : 0)
                .attr('width', function (d) {
                    //check whether the end field is not empty
                    if (currentSerie.endField) {
                        //calculate current size
                        currentSize = Math.abs(baseXScale(new Date(d[currentSerie.endField])) - baseXScale(new Date(d[currentSerie.startField])));

                        //return calculated size
                        return isNaN(currentSize) ? 0 : currentSize;
                    } else {
                        //if there is no end field then we need to use lane icon size
                        return laneIconSize;
                    }
                });

            //update base axis
            baseAxis.call(baseXAxis);

            //update base grid
            baseGrid.call(createAxis().tickSize(-baseHeight, 0, 0).tickFormat(''));

            //update axis styles
            updateAxisStyles();
        }

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')')
            .attr('width', width);

        //initializes the diagram
        function init() {
            //calculate scales to draw the timeline
            calculateScales();
            createBaseAndLaneG();
            createContents();
            createAxes();
            createBrush();
        }

        //initialize diagram
        init();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //update legend
            diagram.updateLegend();

            //clear svg
            diagramG.selectAll('*').remove();

            //reinit diagram 
            init();
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
    e.timeline = function (options) {
        options.type = 'grouped';
        return new timeline(options);
    };
})(eve);