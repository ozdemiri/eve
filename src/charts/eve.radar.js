/*!
 * eve.radar.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for radar chart.
 */
(function (e) {
    //define radar chart class
    function radarChart(options) {
        //remove stack
        if(options.yAxis) {
            options.yAxis.stacked = false;
        } else {
            options.yAxis = {
                stacked: false
            };
        }

        //declare needed variables
        var chart = eve.base.init(options),
            currentSerie = null,
            radarWidth = (chart.width - chart.plot.left - chart.plot.right),
            radarHeight = (chart.height - chart.plot.top - chart.plot.top - (chart.xAxis.labelFontSize * 2)),
            radius = Math.min(radarWidth / 2, radarHeight / 2),
            radians = 2 * Math.PI,
            yScale = d3.scaleLinear().domain(chart.domains.y).range([0, radius]),
            autoTickCount = 0,
            axisValues = [],
            yTicks = 0,
            series = [],
            axisMin = 0,
            axisMax = 0,
            currentSegmentFactor = 0,
            axis = null;

        //calculates scales and envrionmental variables
        function calculateScales() {
            //calculate ticks
            autoTickCount = Math.floor(radius / (chart.yAxis.labelFontSize * 2));

            //set y ticks
            yTicks = yScale.ticks(autoTickCount);

            //set axis values
            axisValues = chart.data.map(function (d) { return d[chart.xField]; });

            //set axis min and max
            axisMin = chart.domains.y[0];
            axisMax = chart.domains.y[1];

            //map series
            series = chart.serieNames.map(function (name, index) {
                //get data values
                var dataValueStack = chart.data.map(function (d) {
                    //get x value
                    var xValue = d[chart.xField],
                        serie = chart.series[index],
                        dataObject = {};

                    //set data object
                    dataObject.name = name;
                    dataObject.index = index;
                    dataObject.serieType = serie.type;
                    dataObject.xValue = xValue;

                    //set y value if set
                    if (serie.yField)
                        dataObject.yValue = parseFloat(d[name]);

                    //return data object
                    return dataObject;
                });

                //set data object
                var dataObject = {
                    name: name,
                    serieType: chart.series[index].type,
                    values: dataValueStack,
                    totalArea: d3.sum(dataValueStack, function (a) { return a.yValue; })
                };

                //return data object
                return dataObject;
            });
        }

        //creates levels
        function createLevels() {
            //get current serie
            currentSerie = chart.series[0];

            //create radar segments
            for (var k = 0; k < yTicks.length; k++) {
                 //calculate segment factor
                 currentSegmentFactor = radius * ((k + 1) / (yTicks.length));

                 //create segments
                 var segmentLine = chartG.selectAll('.eve-radar-segment-line-' + k)
                     .data(axisValues)
                     .enter().append('line')
                     .attr('class', 'eve-radar-segment-line-' + k)
                     .style("stroke", currentSerie.segmentLineColor)
                     .style("stroke-opacity", currentSerie.segmentLineAlpha / 2)
                     .style("stroke-width", currentSerie.segmentLineThickness)
                     .attr("x1", calculateSegmentPosX1)
                     .attr("y1", calculateSegmentPosY1)
                     .attr("x2", calculateSegmentPosX2)
                     .attr("y2", calculateSegmentPosY2)
                     .attr("transform", "translate(" + (radarWidth / 2 - currentSegmentFactor) + ", " + (radarHeight / 2 - currentSegmentFactor) + ")");

                //exit and remove dismisseds
                segmentLine.exit().remove();
             }
        }

        //calculates segment position for x1
        function calculateSegmentPosX1(d, i) { return currentSegmentFactor * (1 - Math.sin(i * radians / axisValues.length)); }

        //calculates segment position for x1
        function calculateSegmentPosY1(d, i) { return currentSegmentFactor * (1 - Math.cos(i * radians / axisValues.length)); }

        //calculates segment position for x1
        function calculateSegmentPosX2(d, i) { return currentSegmentFactor * (1 - Math.sin((i + 1) * radians / axisValues.length)); }

        //calculates segment position for x1
        function calculateSegmentPosY2(d, i) { return currentSegmentFactor * (1 - Math.cos((i + 1) * radians / axisValues.length)); }

        //creates level texts
        function createLevelAxisTexts() {
            //create radar axis texts
            for (var k = 0; k < yTicks.length - 1; k++) {
                //calculate segment factor
                var segmentFactor = radius * ((k + 1) / (yTicks.length));

                //create segments
                var segmentText = chartG.selectAll('.eve-radar-segment-text-' + k)
                    .data([0])
                    .enter().append('text')
                    .attr('class', 'eve-radar-segment-text-' + k)
                    .text(yTicks[k])
                    .style("fill", chart.yAxis.labelFontColor)
                    .style("font-size", chart.yAxis.labelFontSize)
                    .style('text-anchor', 'start')
                    .attr("x", segmentFactor * (1 - Math.sin(0)))
                    .attr("y", segmentFactor * (1 - Math.cos(0)))
                    .attr("transform", "translate(" + (radarWidth / 2 - segmentFactor) + ", " + (radarHeight / 2 - segmentFactor) + ")");

                //exit and remove dismisseds
                segmentText.exit().remove();
            }
        }

        //creates axes
        function createAxes() {
            //get current serie
            currentSerie = chart.series[0];

            //create axes
            axis = chartG.selectAll('.eve-radar-axis')
                .data(axisValues)
                .enter().append('g')
                .attr('class', 'eve-radar-axis');

            //create axis lines
            axis.append('line')
                .attr('x1', radarWidth / 2)
                .attr('y1', radarHeight / 2)
                .attr("x2", function (d, i) {
                    //calculate final x post
                    var finalX = radarWidth / 2 * (1 - Math.sin(i * radians / axisValues.length));
                    var baseX = radius * (1 - Math.sin(i * radians / axisValues.length));
                    var transformation = radarWidth / 2 - radius;

                    //check whether the index is 0
                    if (i > 0)
                        finalX = baseX + transformation;

                    //return new final x position
                    return finalX;
                })
                .attr("y2", function (d, i) {
                    //calculate final y position
                    var finalY = radarHeight / 2 * (1 - Math.cos(i * radians / axisValues.length));

                    //return new final y position
                    return finalY;
                })
                .style("stroke", currentSerie.segmentLineColor)
                .style("stroke-opacity", currentSerie.segmentLineAlpha)
                .style("stroke-width", currentSerie.segmentLineThickness);

            //create axis labels
            axis.append('text')
                .style('fill', chart.xAxis.labelFontColor)
                .style('font-size', chart.xAxis.labelFontSize + 'px')
                .style('font-family', chart.xAxis.labelFontFamily)
                .style('font-style', chart.xAxis.labelFontStyle === 'bold' ? 'normal' : chart.xAxis.labelFontStyle)
                .style('font-weight', chart.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .attr('text-anchor', function (d, i) {
                    //calculate final x post
                    var finalX = radarWidth / 2 * (1 - Math.sin(i * radians / axisValues.length));
                    
                    //return start or end
                    if (i === 0)
                        return 'middle';

                    //return start or end anchor by radius
                    return finalX > radius ? 'start' : 'end';
                })
                .text(function (d) { return d; })
                .attr("x", function (d, i) {
                    //calculate final x post
                    var xPos = radarWidth / 2 * (1 - Math.sin(i * radians / axisValues.length));
                    var centerX = radius * (1 - Math.sin(i * radians / axisValues.length));
                    var transformation = radarWidth / 2 - radius;
                    var xPosActual = xPos;

                    //check whether the index is 0
                    if (i > 0)
                        xPosActual = centerX + transformation;

                    //check whether the xPos > radius
                    if (xPos > radius)
                        xPosActual += 10;
                    else
                        xPosActual -= 10;

                    //return new final x position
                    return xPosActual;
                })
                .attr("y", function (d, i) {
                    //calculate y position
                    var yPos = radarHeight / 2 * (1 - Math.cos(i * radians / axisValues.length));
                    var yPosActual = yPos;

                    //check whether the ypos > radius
                    if (yPos > radius)
                        yPosActual += 5;
                    else
                        yPosActual -= 5;

                    //return new final y position
                    return yPosActual;
                });

            //remove axis
            axis.exit().remove();
        }

        //creates area nodes
        function createAreaNodes() {
            //sort series
            series.sort(function (a, b) {
                return b.totalArea - a.totalArea;
            });

            //iterate all series to create area for the radar chart
            series.forEach(function (serie, index) {
                //declare serie values
                var serieValues = [];

                //create radar nodes
                chartG.selectAll('.eve-radar-nodes')
                    .data(serie.values, function (s, i) {
                        //calculate final x post
                        var xPos = radarWidth / 2 * (1 - (s.yValue / axisMax) * Math.sin(i * radians / axisValues.length)),
                            centerX = radius * (1 - (s.yValue / axisMax) * Math.sin(i * radians / axisValues.length)),
                            transformation = radarWidth / 2 - radius,
                            yPos = radarHeight / 2 * (1 - (s.yValue / axisMax) * Math.cos(i * radians / axisValues.length));

                        //check whether the index is 0
                        if (i > 0) xPos = centerX + transformation;

                        //push the current serie value into the stack
                        serieValues.push([
                            xPos,
                            yPos
                        ]);
                    });

                //add first serie value at the end of the stack to merge them as polygon
                serieValues.push(serieValues[0]);

                //create area polygon
                chartG.selectAll('.eve-radar-serie-' + index)
                    .data([serieValues])
                    .enter().append('path')
                    .attr('class', 'eve-radar-serie-' + index)
                    .style('stroke-width', chart.series[index].lineThickness)
                    .style('stroke', chart.series[index].color)
                    .style('fill', chart.series[index].color)
                    .style('fill-opacity', chart.series[index].alpha)
                    .attr('d', function (d, i) {
                        //declare points value
                        var seriePoints = [];

                        //iterate to value length
                        for (var j = 0; j < d.length; j++) {
                            //create point value
                            seriePoints.push([radarWidth / 2, radarHeight / 2]);
                        }

                        //return points content
                        return 'M' + seriePoints.join('L') + 'Z';
                    })
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * chart.animation.delay; })
                    .attr('d', function (d, i) {
                        //declare points value
                        var seriePoints = [];

                        //iterate to value length
                        for (var j = 0; j < d.length; j++) {
                            //create point value
                            seriePoints.push([d[j][0], d[j][1]]);
                        }

                        //return points content
                        return 'M' + seriePoints.join('L') + 'Z';
                    });

                //create bullets
                chartG.selectAll('.eve-radar-bullets-' + index)
                    .data(serie.values)
                    .enter().append('circle')
                    .attr('class', 'eve-radar-bullets-' + index)
                    .style('stroke-width', 1)
                    .style('stroke', chart.series[index].color)
                    .style('fill', chart.series[index].color)
                    .style('fill-opacity', 0.9)
                    .attr('r', chart.series[index].bulletSize)
                    .attr('transform', 'translate(' + radarWidth / 2 + ',' + radarHeight / 2 + ')')
                    .on('mousemove', function (d, i) {
                        //set slice hover
                        d3.select(this).attr('fill-opacity', chart.series[index].sliceHoverAlpha);

                        //show tooltip
                        chart.showTooltip(chart.getContent(d, chart.series[index], chart.tooltip.format));
                    })
                    .on('mouseout', function (d, i) {
                        //set slice hover
                        d3.select(this).attr('fill-opacity', chart.series[index].alpha);

                        //hide tooltip
                        chart.hideTooltip();
                    })
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * chart.animation.delay; })
                    .attr('transform', function (d, i) {
                        //calculate final x post
                        var xPos = radarWidth / 2 * (1 - (d.yValue / axisMax) * Math.sin(i * radians / axisValues.length)),
                            centerX = radius * (1 - (d.yValue / axisMax) * Math.sin(i * radians / axisValues.length)),
                            transformation = radarWidth / 2 - radius,
                            yPos = radarHeight / 2 * (1 - (d.yValue / axisMax) * Math.cos(i * radians / axisValues.length));

                        //check whether the index is 0
                        if (i > 0) xPos = centerX + transformation;

                        //return translation
                        return 'translate(' + xPos + ',' + yPos + ')';
                    });
            });
        }

        //calculate scales and envrionment
        calculateScales();

        //create chart g
        var chartG = chart.svg.append('g')
            .attr('width', radarWidth)
            .attr('height', radarHeight)
            .attr('transform', 'translate(' + chart.plot.left + ',' + (chart.plot.top + chart.xAxis.labelFontSize) + ')');

        //create levels and init chart
        createLevels();
        createLevelAxisTexts();
        createAxes();
        createAreaNodes();

        //updates chart
        chart.update = function(data) {
            //set chart data
            chart.data = data;

            //update xy domain
            chart.updateXYDomain();
            chart.updateLegend();

            //re-calculate scales
            calculateScales();

            //update environment
            createLevels();
            createLevelAxisTexts();
            createAxes();
            
            //sort series
            series.sort(function (a, b) { return b.totalArea - a.totalArea; });

            //iterate all series to create area for the radar chart
            series.forEach(function (serie, index) {
                //declare serie values
                var serieValues = [];

                //create radar nodes
                chartG.selectAll('.eve-radar-nodes')
                    .data(serie.values, function (s, i) {
                        //calculate final x post
                        var xPos = radarWidth / 2 * (1 - (s.yValue / axisMax) * Math.sin(i * radians / axisValues.length)),
                            centerX = radius * (1 - (s.yValue / axisMax) * Math.sin(i * radians / axisValues.length)),
                            transformation = radarWidth / 2 - radius,
                            yPos = radarHeight / 2 * (1 - (s.yValue / axisMax) * Math.cos(i * radians / axisValues.length));

                        //check whether the index is 0
                        if (i > 0) xPos = centerX + transformation;

                        //push the current serie value into the stack
                        serieValues.push([
                            xPos,
                            yPos
                        ]);
                    }).exit().remove();

                //add first serie value at the end of the stack to merge them as polygon
                serieValues.push(serieValues[0]);

                //update area data
                chartG.selectAll('.eve-radar-serie-' + index).data([serieValues]).exit().remove();

                //update bullet data
                chartG.selectAll('.eve-radar-bullets-' + index).data(serie.values).exit().remove();

                //update area series
                chartG.selectAll('.eve-radar-serie-' + index)
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * chart.animation.delay; })
                    .attr('d', function (d, i) {
                        //declare points value
                        var seriePoints = [];

                        //iterate to value length
                        for (var j = 0; j < d.length; j++) {
                            //create point value
                            seriePoints.push([d[j][0], d[j][1]]);
                        }

                        //return points content
                        return 'M' + seriePoints.join('L') + 'Z';
                    });

                //update bullet series
                chartG.selectAll('.eve-radar-bullets-' + index)
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * chart.animation.delay; })
                    .attr('transform', function (d, i) {
                        //calculate final x post
                        var xPos = radarWidth / 2 * (1 - (d.yValue / axisMax) * Math.sin(i * radians / axisValues.length)),
                            centerX = radius * (1 - (d.yValue / axisMax) * Math.sin(i * radians / axisValues.length)),
                            transformation = radarWidth / 2 - radius,
                            yPos = radarHeight / 2 * (1 - (d.yValue / axisMax) * Math.cos(i * radians / axisValues.length));

                        //check whether the index is 0
                        if (i > 0) xPos = centerX + transformation;

                        //return translation
                        return 'translate(' + xPos + ',' + yPos + ')';
                    });
            });
        };

        //draws the chart into a canvas
        chart.toCanvas = function () {
            //get the chart container
            var orgDiv = document.getElementById(chart.container);
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
        chart.toImage = function () {
            //get the chart container
            var orgDiv = document.getElementById(chart.container);
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

        //return enhanced chart object
        return chart;
    }

    //attach pie chart method into the eve
    e.radarChart = function (options) {
        options.type = 'xy';
        return new radarChart(options);
    };
})(eve);