/*!
 * eve.bullet.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for bullet diagram.
 */
(function (e) {
    //define bullet diagram class
    function bulletDiagram(options) {
        //remove legend
        if (!options.legend) {
            options.legend = { enabled: false };
        } else {
            options.legend.enabled = false;
        }

        //declare needed variables
        let diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            dataset = e.clone(diagram.data),
            diagramG = null,
            barOffset = 10,
            tickSize = 10,
            axisHeight = tickSize + diagram.xAxis.labelFontSize,
            height = (diagram.plot.height - diagram.plot.top - diagram.plot.bottom),
            widthRatio = diagram.multipleWidth ? diagram.multipleWidth : diagram.plot.width,
            width = widthRatio - diagram.plot.left - diagram.plot.right - diagram.margin.left - diagram.margin.right,
            sectorHeight = height / dataset.length - axisHeight,
            itemHeight = sectorHeight - barOffset,
            rangeFields = currentSerie.rangeFields || currentSerie.rangeField,
            itemWidth = 0,
            sectorWidth = 0,
            maxLongText = '',
            maxTextLength = 0,
            maxTextWidth = 0,
            tempTextSVG = null,
            tempTextSVGOffset = null,
            currentLabel = '',
            labelOffset = 10,
            allMaxValues = [],
            xPos = 0, yPos = 0,
            xDomain = null,
            xAxis = null,
            axis = null,
            bbox = null,
            minFontSize = 8,
            currentTicks = [],
            singleRectWidth = 0,
            currentDataVals = null;

        //calculate axis height
        if (diagram.xAxis.locked) {
            axisHeight = diagram.xAxis.labelFontSize;
            sectorHeight = height / dataset.length - axisHeight;
            itemHeight = sectorHeight - barOffset;
        }

        //check item height
        if (itemHeight <= 0)
            itemHeight = sectorHeight;

        //gets range values
        function getRangeValues(data) {
            //declare an array to get ranges
            let ranges = [];

            //iterate all range fields
            rangeFields.forEach(function (rangeField) {
                //check whether the data has current range field
                if (data[rangeField] !== null)
                    ranges.push(parseFloat(data[rangeField]));
            });

            //return ranges
            if (ranges.length === 0)
                return [0];

            //return sorted ranges
            return ranges.sort(d3.descending);
        }

        //gets max measure
        function getDataValues(data) {
            //declare needed variables
            let dataVals = {
                ranges: [],
                marker: 0,
                measure: 0,
                max: 0
            };

            //check if locked axis
            if (diagram.xAxis.locked) {
                //declare needed variables
                allMaxValues = [];

                //iterate all datas
                dataset.forEach(function (d, i) {
                    //push max value
                    allMaxValues.push(d3.sum(getRangeValues(d)));

                    //push marker and measure into the current ranges
                    allMaxValues.push(d[currentSerie.measureField] ? +d[currentSerie.measureField] : 0);
                    allMaxValues.push(d[currentSerie.markerField] ? +d[currentSerie.markerField] : 0);
                });

                //set data values
                dataVals.max = d3.max(allMaxValues);
                dataVals.ranges = getRangeValues(data);
                dataVals.marker = data[currentSerie.markerField] ? +data[currentSerie.markerField] : 0;
                dataVals.measure = data[currentSerie.measureField] ? +data[currentSerie.measureField] : 0;
            } else {
                //set data values
                dataVals.ranges = getRangeValues(data);
                dataVals.marker = data[currentSerie.markerField] ? +data[currentSerie.markerField] : 0;
                dataVals.measure = data[currentSerie.measureField] ? +data[currentSerie.measureField] : 0;
                dataVals.max = Math.max(d3.sum(dataVals.ranges), dataVals.marker, dataVals.measure);
            }

            if (diagram.yAxis.max)
                dataVals.max = diagram.yAxis.max;

            //return calculated data values
            return dataVals;
        }

        //gets max y value
        function getMaxYValue() {
            let maxVal = Number.MIN_VALUE;
            diagram.data.forEach(function (d) {
                for (var key in d) {
                    if (key !== currentSerie.groupField) {
                        if (+d[key] > maxVal)
                            maxVal = +d[key];
                    }
                }
            });
            return maxVal;
        }

        //gets x axis tick count
        function getYAxisTickCount(areaWidth) {
            //set tick count to 10
            let tickCount = 10,
                maxValueRatio = getMaxYValue();

            //set max value ratio
            if (diagram.maxMeasureValue)
                maxValueRatio = diagram.maxMeasureValue;

            //attach text
            tempTextSVG = diagramG.append('text')
                .style('font-size', diagram.yAxis.labelFontSize + 'px')
                .style('color', diagram.yAxis.labelFontColor)
                .style('font-family', diagram.yAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.yAxis.labelFontStyle == 'bold' ? 'normal' : diagram.yAxis.labelFontStyle)
                .style('font-weight', diagram.yAxis.labelFontStyle == 'bold' ? 'bold' : 'normal')
                .text(e.formatNumber(maxValueRatio, diagram.yAxis.labelFormat));

            //get offset for x axis value
            tempXAxisSVGOffset = tempTextSVG.node().getBoundingClientRect();

            //remove svg text for x axis
            tempTextSVG.remove();

            //check whether the axis tick count is auto
            if (diagram.yAxis.tickCount === 'auto') {
                //set tick count
                tickCount = Math.ceil(areaWidth / tempXAxisSVGOffset.width) - 1;
            } else {
                //set manuel tick count
                tickCount = parseInt(diagram.yAxis.tickCount);
            }

            if (tickCount > 10)
                tickCount = 10;

            //return updated tick count
            return 5;//e.closestPower(Math.ceil(tickCount));
        }

        //creates axes
        function createAxes(i) {
            //check whether the axis is locked
            if (diagram.xAxis.locked && i < diagram.data.length - 1)
                return false;

            //create axis
            axis = diagramG.append('g')
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', 'translate(' + maxTextWidth + ',' + ((sectorHeight + axisHeight) * i + sectorHeight) + ')')
                .attr('class', 'eve-x-axis')
                .call(xAxis);

            //update axis style
            axis.selectAll('path')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('stroke', diagram.xAxis.color);

            //update axis lines
            axis.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke', diagram.xAxis.color);

            //update axis texts
            axis.selectAll('text')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'middle')
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .text(function (axisText, axisTextIndex) {
                    //get bbox
                    formattedText = e.formatNumber(axisText, diagram.xAxis.labelFormat);

                    //get current ticks
                    return formattedText;
                });
        }

        //sets default environment for bullet
        function setDefaults() {
            //set max long label value
            maxTextLength = 0;
            dataset.forEach(function (d) {
                currentLabel = d[currentSerie.groupField];
                if (currentLabel && currentLabel.toString().length > maxTextLength) {
                    maxLongText = currentLabel;
                    maxTextLength = currentLabel.toString().length;
                }
            });

            //attach text
            tempTextSVG = diagramG.append('text')
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('color', diagram.xAxis.labelFontColor)
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle == 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle == 'bold' ? 'bold' : 'normal')
                .text(maxLongText);

            //set max text length
            tempTextSVGOffset = tempTextSVG.node().getBoundingClientRect();
            maxTextWidth = tempTextSVGOffset.width + labelOffset;

            //remove temporary text
            tempTextSVG.remove();

            //calculate axis height
            if (diagram.xAxis.locked) {
                axisHeight = diagram.xAxis.labelFontSize + 2;
            }

            //set item width
            sectorWidth = width - maxTextWidth;
            sectorHeight = height / dataset.length - axisHeight;
            itemHeight = sectorHeight - barOffset;

            //compare it
            if (itemHeight <= 0)
                itemHeight = sectorHeight;

            //set automatic label size
            if (currentSerie.labelFontSize === 'auto')
                currentSerie.labelFontSize = itemHeight / 1.5;

            //check min font size
            if (currentSerie.labelFontSize < minFontSize)
                currentSerie.labelFontSize = minFontSize;

            //set automatic label size
            if (currentSerie.labelFontColor === 'auto')
                currentSerie.labelFontColor = '#333333';
        }

        //renders the diagram
        function renderDiagram() {
            //iterate all data
            dataset.forEach(function (d, i) {
                //iterate all range fields
                if (rangeFields.length > 0) {
                    //get current data values
                    currentDataVals = getDataValues(d);

                    //get current data values and set domains
                    xDomain = d3.scaleLinear().domain([0, (diagram.yAxis.locked ? diagram.yAxis.max : currentDataVals.max)]).range([0, sectorWidth]);
                    xAxis = d3.axisBottom().scale(xDomain).ticks(getYAxisTickCount(sectorWidth));

                    //create ranges for the current data
                    diagramG.selectAll('.eve-bullet-range-' + i)
                        .data(currentDataVals.ranges)
                        .enter().append('rect')
                        .attr('class', 'eve-bullet-range-' + i)
                        .attr('height', sectorHeight)
                        .style('fill', currentSerie.rangeColor)
                        .style('fill-opacity', 0)
                        .attr('width', 0)
                        .attr('transform', function (currentRange, rangeIndex) {
                            //set y position for the current range
                            yPos = (sectorHeight + axisHeight) * i;

                            //set x positon for the current range
                            xPos = 0;

                            //return calculated translation
                            return 'translate(' + xPos + ',' + yPos + ')';
                        });

                    //create axes
                    createAxes(i);
                }
            });

            //create labels for each data
            diagramG.selectAll('.eve-bullet-group')
                .data(dataset)
                .enter().append('text')
                .attr('class', 'eve-bullet-group')
                .style('font-size', diagram.yAxis.labelFontSize + 'px')
                .style('fill', diagram.yAxis.labelFontColor)
                .style('font-family', diagram.yAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.yAxis.labelFontStyle == 'bold' ? 'normal' : diagram.yAxis.labelFontStyle)
                .style('font-weight', diagram.yAxis.labelFontStyle == 'bold' ? 'bold' : 'normal')
                .text(function (d) { return d[currentSerie.groupField]; })
                .attr('transform', 'translate(0,0)');

            //create actual bars
            diagramG.selectAll('.eve-bullet-bar')
                .data(dataset)
                .enter().append('rect')
                .attr('class', 'eve-bullet-bar')
                .style('fill', currentSerie.color ? currentSerie.color : e.colors[0])
                .style('fill-opacity', currentSerie.alpha)
                .attr('height', itemHeight)
                .attr('width', 0)
                .attr('transform', function (d, i) {
                    //set y position for the current range
                    yPos = ((sectorHeight + axisHeight) * i) + barOffset / 2;

                    if (sectorHeight === itemHeight)
                        yPos = (sectorHeight + axisHeight) * i;

                    //set x positon for the current range
                    xPos = maxTextWidth;

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                })
                .on('click', function (d) {
                    if (diagram.onClick)
                        diagram.onClick(d);
                })
                .on('mousemove', function (d) {
                    //hover bar
                    d3.select(this).style('fill-opacity', currentSerie.sliceHoverAlpha);

                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d) {
                    //hover bar
                    d3.select(this).style('fill-opacity', currentSerie.alpha);

                    //hide tooltip
                    diagram.hideTooltip();
                });

            //create labels for each data
            diagramG.selectAll('.eve-bullet-label')
                .data(dataset)
                .enter().append('text')
                .attr('class', 'eve-bullet-label')
                .style('pointer-events', 'none')
                .style('fill', currentSerie.labelFontColor)
                .style('font-size', currentSerie.labelFontSize + 'px')
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function (d) { return diagram.getContent(d, currentSerie, currentSerie.labelFormat); })
                .attr('transform', function (d, i) {
                    yPos = ((sectorHeight + axisHeight) * i) + sectorHeight / 2 + this.getBBox().height / 2 + itemHeight / 2;
                    return 'translate(0,' + yPos + ')';
                });

            //create markers
            diagramG.selectAll('.eve-bullet-marker')
                .data(dataset)
                .enter().append('rect')
                .attr('class', 'eve-bullet-marker')
                .style('fill', currentSerie.markerColor)
                .attr('width', currentSerie.markerWidth)
                .attr('height', sectorHeight)
                .attr('transform', function (d, i) {
                    //set y position for the current range
                    yPos = ((sectorHeight + axisHeight) * i);

                    //set x positon for the current range
                    xPos = maxTextWidth;

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                })
                .on('click', function (d) {
                    if (diagram.onClick)
                        diagram.onClick(d);
                })
                .on('mousemove', function (d) {
                    //hover bar
                    d3.select(this).style('fill-opacity', currentSerie.sliceHoverAlpha);

                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d) {
                    //hover bar
                    d3.select(this).style('fill-opacity', currentSerie.alpha);

                    //hide tooltip
                    diagram.hideTooltip();
                });
        }

        //animates diagram
        function animateDiagram() {
            //iterate all data
            dataset.forEach(function (d, i) {
                //iterate all range fields
                if (rangeFields.length > 0) {
                    //get current data values and set domains
                    currentDataVals = getDataValues(d);

                    //create ranges for the current data
                    diagramG.selectAll('.eve-bullet-range-' + i)
                        .style('fill-opacity', diagram.animation.effect === 'add' ? 0 : 1)
                        .transition().duration(diagram.animation.duration)
                        .ease(diagram.animation.easing.toEasing())
                        .delay(function (currentData, currentDataIndex) { return currentDataIndex * diagram.animation.delay; })
                        .style('fill-opacity', function (currentRange, rangeIndex) { return (rangeIndex + 1) / currentDataVals.ranges.length; })
                        .attr('width', function (currentRange) {
                            return currentRange / currentDataVals.max * sectorWidth;
                        })
                        .attr('transform', function (currentRange, rangeIndex) {
                            //set item width
                            itemWidth = rangeIndex === 0 ? 0 : (currentDataVals.ranges[rangeIndex - 1] / currentDataVals.max * sectorWidth);

                            //set y position for the current range
                            yPos = (sectorHeight + axisHeight) * i;

                            //set x positon for the current range
                            xPos = maxTextWidth + itemWidth;

                            //return calculated translation
                            return 'translate(' + xPos + ',' + yPos + ')';
                        });
                }
            });

            //animate groups
            diagramG.selectAll('.eve-bullet-group')
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .text(function (d) { return d[currentSerie.groupField]; })
                .attr('transform', function (d, i) {
                    //set y position for the current label
                    yPos = ((sectorHeight + axisHeight) * i) + sectorHeight / 2 + this.getBBox().height / 2;

                    //set x position
                    xPos = 0;

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //animate actual bars
            diagramG.selectAll('.eve-bullet-bar')
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('height', itemHeight)
                .attr('width', function (d) {
                    //get current values
                    currentDataVals = getDataValues(d);

                    //return width of the bar
                    return currentDataVals.measure / currentDataVals.max * sectorWidth;
                })
                .attr('transform', function (d, i) {
                    //set y position for the current range
                    yPos = ((sectorHeight + axisHeight) * i) + barOffset / 2;

                    if (sectorHeight === itemHeight)
                        yPos = (sectorHeight + axisHeight) * i;

                    //set x positon for the current range
                    xPos = maxTextWidth;

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //animate labels
            diagramG.selectAll('.eve-bullet-label')
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('transform', function (d, i) {
                    //get current values
                    currentDataVals = getDataValues(d);
                    bbox = this.getBBox();

                    //set y position for the current range
                    yPos = (((sectorHeight + axisHeight) * i) + barOffset / 2) + (itemHeight / 2) + currentSerie.labelFontSize / 2;

                    //set x positon for the current range
                    xPos = maxTextWidth + (currentDataVals.measure / currentDataVals.max * sectorWidth) + 5;

                    //check x position
                    if ((xPos + bbox.width) > sectorWidth)
                        xPos -= bbox.width;

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //animate markers
            diagramG.selectAll('.eve-bullet-marker')
                .style('fill-opacity', currentSerie.markerField ? 1 : 0)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('height', sectorHeight)
                .attr('transform', function (d, i) {
                    //get current values
                    currentDataVals = getDataValues(d);

                    //set y position for the current range
                    yPos = ((sectorHeight + axisHeight) * i);

                    //set x positon for the current range
                    xPos = maxTextWidth + currentDataVals.marker / currentDataVals.max * sectorWidth;

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });
        }

        //initializes diagram
        function initDiagram() {
            //create diagram g
            diagramG = diagram.svg.append('g')
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

            //calculate sector environment to place the bars
            setDefaults();

            //draw diagram
            renderDiagram();
            animateDiagram();
        }

        //now we can initialize bullet diagram
        initDiagram();

        //attach update method to the chart
        diagram.update = function (data) {
            //update chart data
            diagram.data = data;
            dataset = data;

            //re-calculate sector environment to place the bars
            diagram.calculateDomain();
            setDefaults();

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
                    diagramG.remove();
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
                .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

            //re-render diagram
            renderDiagram();
            animateDiagram();
        };

        //attach clear content method to chart
        diagram.clear = function () {
            //remove g from the content
            diagram.svg.selectAll('.eve-vis-g').remove();
        };

        //return bullet diagram
        return diagram;
    };

    //attach donut chart method into the eve
    e.bullet = function (options) {
        options.masterType = "sliced";
        options.type = "bullet";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new bulletDiagram(options);
    };
})(eve);