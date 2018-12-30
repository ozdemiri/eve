/*!
 * eve.slopegraph.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for combination chart.
 */
(function (e) {
    //define slope graph class
    function slopeGraph(options) {
        //remove legend
        if (options.legend) {
            options.legend.enabled = false;
        } else {
            options.legend = { enabled: false };
        }

        //declare needed variables
        let that = this,
            diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right - diagram.margin.left - diagram.margin.right,
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom - diagram.margin.top - diagram.margin.bottom,
            leftMargin = 0,
            topMargin = diagram.title.fontSize - 10,
            minMeasure = 0,
            maxMeasure = 0,
            minRange = 0,
            maxRange = 0,
            tempTextSVG = null,
            tempTextSVGOffset = null,
            groupTitleOffset = null,
            groupTitleMaxHeight = 0,
            yScale = null,
            yAxisSVG = null,
            diagramG = null,
            yAxisG = null,
            nestedData = null,
            groupField = currentSerie.groupField || currentSerie.sourceField,
            groups = [];

        
        //calculates scales and envrionments
        function calculateScales() {
            //clear nested data
            nestedData = [];

            //check whether the x values is not empty
            if (diagram.xAxis.xValues && diagram.xAxis.xValues.length > 0) {
                //set groups
                groups = diagram.xAxis.xValues.sort();

                //set nested data if there are predefined groups
                groups.forEach(function (currentGroup) {
                    //set current nested data
                    let currentSet = {
                        key: currentGroup,
                        values: []
                    };

                    //iterate all data
                    diagram.data.forEach(function (d) {
                        //set values
                        if (d[groupField] === currentGroup)
                            currentSet.values.push(e.clone(d));
                    });

                    //set nested data
                    nestedData.push(currentSet)
                });
            } else {
                //nest data
                nestedData = d3.nest().key(function (d) { return d[currentSerie.groupField]; }).entries(diagram.data);
            }

            //calculate measures
            minMeasure = d3.min(diagram.data, function (d) { return +d[currentSerie.measureField]; });
            maxMeasure = d3.max(diagram.data, function (d) { return +d[currentSerie.measureField]; }) * 1.1;
            minRange = d3.min(diagram.data, function (d) { return d[currentSerie.rangeField]; });
            maxRange = d3.max(diagram.data, function (d) { return d[currentSerie.rangeField]; });
            groups = (diagram.xAxis.xValues && diagram.xAxis.xValues.length > 0) ? diagram.xAxis.xValues : e.getUniqueValues(diagram.data, currentSerie.groupField);

            //set min measure if there is an axis lock
            if (!isNaN(diagram.yAxis.min) && diagram.yAxis.min !== null)
                minMeasure = diagram.yAxis.min;

            //set max measure if there is an axis lock
            if (!isNaN(diagram.yAxis.max) && diagram.yAxis.max !== null)
                maxMeasure = diagram.yAxis.max * 1.2;

            //set min measure if there is an axis lock
            if (!isNaN(diagram.xAxis.min) && diagram.xAxis.min !== null)
                minRange = diagram.xAxis.min;

            //set max measure if there is an axis lock
            if (!isNaN(diagram.xAxis.max) && diagram.xAxis.max !== null)
                maxRange = diagram.xAxis.max;

            //create temp text
            tempTextSVG = diagram.svg.append('text')
                .text(e.formatNumber(maxMeasure, diagram.yAxis.labelFormat))
                .style('font-size', diagram.yAxis.labelFontSize + 'px')
                .style('color', diagram.yAxis.labelFontColor)
                .style('font-family', diagram.yAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.yAxis.labelFontStyle == 'bold' ? 'normal' : diagram.yAxis.labelFontStyle)
                .style('font-weight', diagram.yAxis.labelFontStyle == 'bold' ? 'bold' : 'normal');

            //get offset
            tempTextOffset = tempTextSVG.node().getBoundingClientRect();

            //remnove temp text
            tempTextSVG.remove();

            //add previously substracted margins
            width += leftMargin;
            height += topMargin * 2 + groupTitleMaxHeight;

            //re-arrange dimension
            leftMargin = tempTextOffset.width + 10;
            topMargin = diagram.title.fontSize * 2;
            width -= leftMargin;
            height -= topMargin * 2;

            //calculat slope widths
            let slopeWidth = width - 10,
                singleSlopeWidth = slopeWidth / nestedData.length - leftMargin;

            //iterate nested
            groupTitleMaxHeight = 0;
            nestedData.forEach(function (currentNestedData) {
                let groupTitleText = (currentNestedData.key === null || currentNestedData.key === undefined || currentNestedData.key === 'undefined') ? '' : currentNestedData.key;

                //create temp text
                tempTextSVG = diagram.svg.append('text')
                    .style('fill', diagram.title.fontColor)
                    .style('font-size', diagram.title.fontSize + 'px')
                    .style('font-family', diagram.title.fontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-style', diagram.title.fontStyle === 'bold' ? 'normal' : diagram.title.fontStyle)
                    .style('font-weight', diagram.title.fontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'middle')
                    .text(groupTitleText);

                //wrap temp text
                diagram.wrapText(tempTextSVG, singleSlopeWidth);

                //get bbox of title
                groupTitleOffset = tempTextSVG.node().getBoundingClientRect();

                //remnove temp text
                tempTextSVG.remove();

                //set max height
                if (groupTitleOffset.height > groupTitleMaxHeight)
                    groupTitleMaxHeight = groupTitleOffset.height;
            });

            //re-arrange dimension
            height -= groupTitleMaxHeight;

            //create y scale
            yScale = d3.scaleLinear().range([height, 0]).domain([minMeasure, maxMeasure]);

            //set diagram g
            diagramG = diagram.svg.append('g')
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + diagram.plot.left + ',' + topMargin + ')');
        }

        //draws y axis
        function drawYAxis() {
            //create y axis g
            yAxisG = diagramG.append('g').attr('transform', 'translate(0, ' + groupTitleMaxHeight + ')');

            //create middle axis
            yAxisSVG = yAxisG.append('g')
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', 'translate(' + leftMargin + ')')
                .attr('class', 'eve-y-axis')
                .call(createYAxis());

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

        //draws x axis for given slope
        function drawXAxis(slopeG, axis) {
            //declare axis margin
            let xAxisTopMargin = height - topMargin;

            //create middle axis
            let xAxisSVG = slopeG.append('g')
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', 'translate(' + leftMargin + ', ' + xAxisTopMargin + ')')
                .attr('class', 'eve-x-axis')
                .call(axis);

            //select x axis path and change stroke
            xAxisSVG.selectAll('path')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('stroke', diagram.xAxis.color);

            //select all lines in yaxis
            xAxisSVG.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke', diagram.xAxis.color);

            //select all texts in yaxis
            xAxisSVG.selectAll('text')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('text-anchor', function (d, i) {
                    if (i === 0)
                        return 'start';
                    else
                        return 'end';
                })
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .text(function (d, i) {
                    if (e.getType(d) === 'number')
                        return d.toString().indexOf('.') > -1 ? d.toFixed(2) : d;
                    return d;
                });
        }

        //creates y axis base
        function createYAxis() { return d3.axisLeft(yScale); }

        //gets bullet transform
        function getBulletTransform(d, scaleX, isInit, rangeInfo) {
            //declare x and y positions
            let xPos = 0,
                yPos = 0;

            //set x position
            xPos = scaleX(d[currentSerie.rangeField]) + leftMargin + (rangeInfo.type === 'string' ? scaleX.bandwidth() / 2 : 0);

            //set y position
            yPos = isInit ? height : yScale(d[currentSerie.measureField]) - topMargin;

            //return translation
            return 'translate(' + xPos + ',' + yPos + ')';
        }

        //gets label transform
        function getLabelTransform(d, scaleX, isInit, rangeInfo) {
            //declare x and y positions
            let xPos = 0,
                yPos = 0;

            //set x position
            xPos = scaleX(d[currentSerie.rangeField]) + leftMargin + (rangeInfo.type === 'string' ? scaleX.bandwidth() / 2 : 0);

            //set y position
            yPos = isInit ? height : yScale(d[currentSerie.measureField]) - topMargin - currentSerie.bulletSize;

            //return translation
            return 'translate(' + xPos + ',' + yPos + ')';
        }

        //normalizes dataset
        function normalizeDataset(dataStack, minRangeX, maxRangeX) {
            //declare needed variables
            let newSet = [];

            //iterate all stack to create a new set
            dataStack.forEach(function (d) {
                //create a new data obejct
                let dataObject = {},
                    currentRangeValue = d[currentSerie.rangeField];

                //check if current range value matches with min or max
                if (currentRangeValue === minRangeX || currentRangeValue === maxRangeX) {
                    //set members of data object
                    dataObject[currentSerie.rangeField] = currentRangeValue;
                    dataObject[currentSerie.sourceField] = d[currentSerie.sourceField];
                    dataObject[currentSerie.measureField] = d[currentSerie.measureField];

                    //set group field member if needed
                    if (currentSerie.groupField !== '')
                        dataObject[currentSerie.groupField] = d[currentSerie.groupField];

                    //push data object into the stack
                    newSet.push(dataObject);
                }
            });

            //return generated new set
            return newSet;
        }

        //draws diagram
        function drawDiagram() {
            //declare needed variables
            let rangeInfo = typeof diagram.data[0][currentSerie.rangeField],// diagram.dataProps.columns[currentSerie.rangeField],
                rangeUniques = e.getUniqueValues(diagram.data, currentSerie.rangeField).sort(),
                slopeWidth = width - 10,
                singleSlopeWidth = slopeWidth / nestedData.length - leftMargin;

            //iterate all nested data
            nestedData.forEach(function (currentNestedData, currentIndex) {
                //get current sources
                let currentMinRange = rangeInfo.type === 'string' ? rangeUniques[0] : d3.min(currentNestedData.values, function (d) { return d[currentSerie.rangeField]; }),
                    currentMaxRange = rangeInfo.type === 'string' ? rangeUniques[1] : d3.max(currentNestedData.values, function (d) { return d[currentSerie.rangeField]; }),
                    slopeLeftMargin = currentIndex === 0 ? 0 : (singleSlopeWidth * currentIndex) + (leftMargin * currentIndex),
                    normalizedDataSet = normalizeDataset(currentNestedData.values, currentMinRange, currentMaxRange);

                //create current x scale
                let xScale = null;

                //set current min and max range
                if (rangeInfo.type !== 'string') {
                    if (!isNaN(diagram.xAxis.min) && diagram.xAxis.min !== null)
                        currentMinRange = minRange;
                    if (!isNaN(diagram.xAxis.max) && diagram.xAxis.max !== null)
                        currentMaxRange = maxRange;
                }

                //check range info type to set scale
                if (rangeInfo.type === 'string')
                    xScale = d3.scaleBand().range([0, singleSlopeWidth]).padding(0.1).round(true).domain([currentMinRange, currentMaxRange]);
                else
                    xScale = d3.scaleLinear().range([0, singleSlopeWidth]).domain([currentMinRange, currentMaxRange]);

                //set x axis
                let xAxis = d3.axisBottom(xScale).tickValues([currentMinRange, currentMaxRange]);

                //create current g
                let slopeG = diagramG.append('g').attr('transform', 'translate(' + slopeLeftMargin + ', ' + (topMargin + groupTitleMaxHeight) + ')');

                //create line function
                let lineF = d3.line()
                    .x(function (d) {
                        return xScale(d[currentSerie.rangeField]) + leftMargin + (rangeInfo.type === 'string' ? xScale.bandwidth() / 2 : 0);
                    })
                    .y(function (d) {
                        return height;
                    });

                //create line function
                let lineFAnimated = d3.line()
                    .x(function (d) {
                        return xScale(d[currentSerie.rangeField]) + leftMargin + (rangeInfo.type === 'string' ? xScale.bandwidth() / 2 : 0);
                    })
                    .y(function (d) {
                        return yScale(d[currentSerie.measureField]) - topMargin;
                    });

                //create bullet function
                let bulletF = d3.symbol().type(function (d) {
                    return currentSerie.bullet === 'none' ? d3.symbolCircle : currentSerie.bullet.toSymbol();
                }).size(function (d) {
                    return Math.pow(currentSerie.bulletSize, 2);
                });

                //create x axis for current slope
                drawXAxis(slopeG, xAxis, currentIndex);

                //create lines
                let nestedSources = d3.nest().key(function (d) { return d[currentSerie.sourceField]; }).entries(normalizedDataSet),
                    currentDataSet = [];

                //set current data set
                nestedSources.forEach(function (d) {
                    //set current
                    currentDataSet.push(e.clone(d.values));
                });

                //create y axis grid lines
                yAxisGrid = slopeG.append('g')
                    .attr('class', 'eve-y-grid');

                //init y axis grid
                yAxisGrid
                    .attr('transform', 'translate(' + leftMargin + ', ' + (-topMargin) + ')')
                    .call(createYAxis().tickSize(-singleSlopeWidth, 0, 0).tickFormat(''));

                //set y axis grid domain style
                yAxisGrid.selectAll('.domain')
                    .style('stroke', 'none')
                    .style('stroke-width', '0px');

                //set y axis grid line style
                yAxisGrid.selectAll('line')
                    .style('stroke-opacity', diagram.yAxis.gridLineAlpha)
                    .style('stroke-width', diagram.yAxis.gridLineThickness + 'px')
                    .style('stroke', diagram.yAxis.gridLineColor);

                //set group title text
                let groupTitleText = (currentNestedData.key === null || currentNestedData.key === undefined || currentNestedData.key === 'undefined') ? '' : currentNestedData.key;

                //get y axis width
                let yAxisWidth = yAxisG.node().getBBox().width,
                    slopeLineClass = '';

                //create group title
                let groupTitle = diagramG.append('text')
                    .style('fill', diagram.title.fontColor)
                    .style('font-size', diagram.title.fontSize + 'px')
                    .style('font-family', diagram.title.fontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-style', diagram.title.fontStyle === 'bold' ? 'normal' : diagram.title.fontStyle)
                    .style('font-weight', diagram.title.fontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'middle')
                    .text(groupTitleText)
                    .attr('transform', 'translate(' + (leftMargin + slopeLeftMargin + singleSlopeWidth / 2) + ', ' + (0) + ')');

                //wrap group title
                diagram.wrapText(groupTitle, singleSlopeWidth);

                //create line series
                let lineSeries = slopeG.selectAll('.eve-slope-serie')
                    .data(currentDataSet)
                    .enter().append('g')
                    .attr('class', 'eve-slope-serie');

                //create lines
                lineSeries.append('path')
                    .attr('d', lineF)
                    .attr('fill', 'none')
                    .attr('class', function (d, i) {
                        //create slope line class
                        slopeLineClass = d[0][currentSerie.sourceField].toString().trim().toLowerCase().replace(/[^a-zA-Z ]/g, "");

                        //return the class
                        return 'eve-slope-line eve-slope-line-' + slopeLineClass;
                    })
                    .attr('stroke', function (d, i) {
                        if (groups.length > 0)
                            return currentIndex >= e.colors.length ? e.randColor() : e.colors[currentIndex];
                        else
                            return i >= e.colors.length ? e.randColor() : e.colors[i];
                    })
                    .attr('stroke-opacity', 1)
                    .attr('stroke-width', 2);

                //transform lines
                lineSeries.selectAll('path')
                    .on('click', function (d, i) {
                        if (d.clicked == null) {
                            slopeLineClass = d[0][currentSerie.sourceField].toString().trim().toLowerCase().replace(/[^a-zA-Z ]/g, "");
                            diagramG.selectAll('.eve-slope-line').attr('stroke-opacity', 0.1);
                            diagramG.selectAll('.eve-slope-line-' + slopeLineClass).attr('stroke-opacity', 1);
                            d.clicked = true;
                        } else {
                            if (d.clicked) {
                                diagramG.selectAll('.eve-slope-line').attr('stroke-opacity', 1);
                                d.clicked = false;
                            } else {
                                slopeLineClass = d[0][currentSerie.sourceField].toString().trim().toLowerCase().replace(/[^a-zA-Z ]/g, "");
                                diagramG.selectAll('.eve-slope-line').attr('stroke-opacity', 0.1);
                                diagramG.selectAll('.eve-slope-line-' + slopeLineClass).attr('stroke-opacity', 1);
                                d.clicked = true;
                            }
                        }
                    })
                    .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .delay(function (d, i) { return i * diagram.animation.delay; })
                    .attr('opacity', 1)
                    .attr('d', lineFAnimated);

                //iterate data set to set bullets and labels
                currentDataSet.forEach(function (currentSet, currentSetIndex) {
                    //create bullets
                    slopeG.selectAll('.eve-slope-bullet-' + currentSetIndex)
                        .data(currentSet)
                        .enter().append('path')
                        .attr('class', 'eve-slope-bullet' + currentSetIndex)
                        .attr('d', bulletF)
                        .attr('fill-opacity', 0)
                        .attr('stroke-opacity', currentSerie.bulletStrokeAlpha)
                        .attr('stroke-width', currentSerie.bulletStrokeSize)
                        .attr('fill', function (d, i) {
                            return currentSetIndex >= e.colors.length ? e.randColor() : e.colors[currentSetIndex];
                        })
                        .attr('transform', function (d) { return getBulletTransform(d, xScale, true, rangeInfo); })
                        .on('mousemove', function (d, i) {
                            //set group value
                            d._groupValue = d[currentSerie.sourceField];

                            //show tooltip
                            diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                        })
                        .on('mouseout', function (d, i) {
                            //hide tooltip
                            diagram.hideTooltip();
                        })
                        .transition().duration(diagram.animation.duration)
                        .ease(diagram.animation.easing.toEasing())
                        .delay(function (d, i) { return i * diagram.animation.delay; })
                        .attr('transform', function (d) { return getBulletTransform(d, xScale, false, rangeInfo); });

                    //create labels
                    if (currentSerie.labelFormat) {
                        slopeG.selectAll('.eve-slope-label-' + currentSetIndex)
                            .data(currentSet)
                            .enter().append('text')
                            .attr('class', 'eve-slope-label' + currentSetIndex)
                            .style('fill', currentSerie.labelFontColor)
                            .style('font-size', (currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize) + 'px')
                            .style('font-family', currentSerie.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                            .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                            .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                            .attr('text-anchor', 'middle')
                            .text(function (d) { return diagram.getContent(d, currentSerie, currentSerie.labelFormat); })
                            .attr('transform', function (d) { return getLabelTransform(d, xScale, true, rangeInfo); })
                            .transition().duration(diagram.animation.duration)
                            .ease(diagram.animation.easing.toEasing())
                            .delay(function (d, i) { return i * diagram.animation.delay; })
                            .attr('transform', function (d) { return getLabelTransform(d, xScale, false, rangeInfo); });
                    }
                });
            });
        }

        //calculate scales and draw daigram
        calculateScales();
        drawYAxis();
        drawDiagram();

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

            //calculate scales and draw daigram
            calculateScales();

            drawYAxis();
            drawDiagram();
        };

        //attach clear content method to chart
        diagram.clear = function () {
            //remove g from the content
            diagram.svg.selectAll('.eve-vis-g').remove();
        };

        //return slope graph object
        return diagram;
    }

    //attach slopeGraph method into the eve
    e.slopeGraph = function (options) {
        options.masterType = 'sourced';
        options.type = 'slopeGraph';

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new slopeGraph(options);
    };

    //attach slopeGraph method into the eve
    e.slope = function (options) {
        options.masterType = 'sourced';
        options.type = 'slopeGraph';

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new slopeGraph(options);
    };
})(eve);