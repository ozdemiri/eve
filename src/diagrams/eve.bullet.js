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
        var diagram = eve.base.init(options),
            currentSerie = diagram.series[0],
            barOffset = 10,
            tickSize = 10,
            axisHeight = tickSize + diagram.xAxis.labelFontSize,
            height = (diagram.plot.height - diagram.plot.top - diagram.plot.bottom),
            sectorHeight = height / diagram.data.length - axisHeight,
            itemHeight = sectorHeight - barOffset,
            itemWidth = 0,
            sectorWidth = 0,
            maxLongText = '',
            maxTextLength = 0,
            maxTextWidth = 0,
            tempTextSVG = null,
            currentLabel = '',
            labelOffset = 10,
            allMaxValues = [],
            xPos = 0, yPos = 0,
            xDomain = null,
            xAxis = null,
            axis = null,
            bbox = null,
            currentDataVals = null;

        //animates bullet diagram
        function animateBars() {
            //iterate all data
            diagram.data.forEach(function (d, i) {
                //iterate all range fields
                if (currentSerie.rangeField.length > 0) {
                    //get current data values and set domains
                    currentDataVals = getDataValues(d);
                    
                    //create ranges for the current data
                    diagramG.selectAll('.eve-bullet-range-' + i)
                        .transition(diagram.animation.duration)
                        .ease(diagram.animation.easing.toEasing())
                        .delay(function (currentData, currentDataIndex) { return currentDataIndex * diagram.animation.delay; })
                        .style('fill-opacity', function (currentRange, rangeIndex) {
                            return (rangeIndex + 1) / currentDataVals.ranges.length;
                        })
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
            //animate labels
            diagramG.selectAll('.eve-bullet-label')
                .transition(diagram.animation.duration)
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
                .transition(diagram.animation.duration)
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

                    //set x positon for the current range
                    xPos = maxTextWidth;

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //animate markers
            diagramG.selectAll('.eve-bullet-marker')
                .transition(diagram.animation.duration)
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

        //calculates sector environment
        function calculateSectors() {
            maxTextLength = 0;
            diagram.data.forEach(function (d) {
                currentLabel = d[currentSerie.groupField];
                if (currentLabel && currentLabel.toString().length > maxTextLength) {
                    maxLongText = currentLabel;
                    maxTextLength = currentLabel.toString().length;
                }
            });
            
            //attach text
            tempTextSVG = diagramG.append('text')
                .style('font-size', diagram.xAxis.labelFontSize)
                .style('color', diagram.xAxis.labelFontColor)
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle == 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle == 'bold' ? 'bold' : 'normal')
                .text(maxLongText);

            //set max text length
            maxTextWidth = tempTextSVG.node().getBoundingClientRect().width + labelOffset;

            //set item width
            sectorWidth = diagram.plot.width - maxTextWidth;
            sectorHeight = height / diagram.data.length - axisHeight;
            itemHeight = sectorHeight - barOffset;

            //remove temp text
            tempTextSVG.remove();
        }

        //gets range values
        function getRangeValues(data) {
            //declare an array to get ranges
            var ranges = [];

            //iterate all range fields
            currentSerie.rangeField.forEach(function (rangeField) {
                //check whether the data has current range field
                if (data[rangeField] !== null)
                    ranges.push(parseFloat(data[rangeField]));
            });

            //return ranges
            if (ranges.length === 0)
                return [0];
            return ranges.sort(d3.descending);
        }

        //gets max measure
        function getDataValues(data) {
            //declare needed variables
            var dataVals = {
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
                diagram.data.forEach(function (d, i) {
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

            //return calculated data values
            return dataVals;
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
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .text(function (d) {
                    bbox = this.getBoundingClientRect();
                    if (bbox.right > diagram.plot.width)
                        return '';
                    return d;
                });
        }

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

        //calculate sector environment to place the bars
        calculateSectors();

        //iterate all data
        diagram.data.forEach(function (d, i) {
            //iterate all range fields
            if (currentSerie.rangeField.length > 0) {
                //get current data values and set domains
                currentDataVals = getDataValues(d);
                xDomain = d3.scaleLinear().domain([0, currentDataVals.max]).range([0, sectorWidth]);
                xAxis = d3.axisBottom().scale(xDomain).tickFormat(diagram.xAxis.labelFormat);

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
        diagramG.selectAll('.eve-bullet-label')
            .data(diagram.data)
            .enter().append('text')
            .attr('class', 'eve-bullet-label')
            .style('font-size', diagram.xAxis.labelFontSize)
            .style('fill', diagram.xAxis.labelFontColor)
            .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
            .style('font-style', diagram.xAxis.labelFontStyle == 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
            .style('font-weight', diagram.xAxis.labelFontStyle == 'bold' ? 'bold' : 'normal')
            .text(function (d) { return d[currentSerie.groupField]; })
            .attr('transform', 'translate(0,0)');

        //create actual bars
        diagramG.selectAll('.eve-bullet-bar')
            .data(diagram.data)
            .enter().append('rect')
            .attr('class', 'eve-bullet-bar')
            .style('fill', currentSerie.color ? currentSerie.color : e.colors[0])
            .style('fill-opacity', currentSerie.alpha)
            .attr('height', itemHeight)
            .attr('width', 0)
            .attr('transform', function (d, i) {
                //set y position for the current range
                yPos = ((sectorHeight + axisHeight) * i) + barOffset / 2;

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

        //create markers
        diagramG.selectAll('.eve-bullet-marker')
            .data(diagram.data)
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


        //animate bullet diagram
        animateBars();

        //attach update method to the chart
        diagram.update = function (data) {
            //update chart data
            diagram.data = data;

            //re-calculate sector environment to place the bars
            calculateSectors();

            //iterate all data to update ranges
            diagram.data.forEach(function (d, i) {
                //iterate all range fields
                if (currentSerie.rangeField.length > 0) {
                    //get current data values and set domains
                    currentDataVals = getDataValues(d);
                    
                    //update current range
                    diagramG.selectAll('.eve-bullet-range-' + i).data(currentDataVals.ranges).exit().remove();
                }
            });

            //update labels data
            diagramG.selectAll('.eve-bullet-label').data(diagram.data).exit().remove();

            //update measures data
            diagramG.selectAll('.eve-bullet-bar').data(diagram.data).exit().remove();

            //update marker data
            diagramG.selectAll('.eve-bullet-marker').data(diagram.data).exit().remove();

            //animate bar series
            animateBars();
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

        //return bullet diagram
        return diagram;
    }

    //attach donut chart method into the eve
    e.bullet = function (options) {
        options.type = 'sliced';
        return new bulletDiagram(options);
    };
})(eve);