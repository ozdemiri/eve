/*!
 * eve.gauge.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for gauge diagram.
 */
(function (e) {
    //define gauge diagram class
    function gauge(options, type) {
        //remove legend
        if (options.legend) {
            options.legend.enabled = false;
        } else {
            options.legend = {
                enabled: false
            };
        }

        //declare needed variables
        var diagram = eve.base.init(options),
            currentSerie = diagram.series[0],
            currentRange = 0,
            value = +diagram.data,
            trendHeight = 0,
            radius = 0,
            innerRadius = 0,
            transX = 0,
            transY = 0,
            trendOffset = 0,
            width = diagram.plot.width,
            height = diagram.plot.height,
            percentValue = getPercentValue(value),
            oldPercentValue = 0,
            titleTextSize = 0,
            handleTextSize = 0,
            labelTextSize = 0,
            valueTextSize = 0,
            backArc = null,
            innerArc = null,
            titleSVG = null,
            minHandleSVG = null,
            maxHandleSVG = null,
            labelSVG = null,
            handleSVG = null,
            backCircleSVG = null,
            gaugeCircle = null,
            size = 0,
            textOffset = 5,
            handlePath = null,
            handleLine = null,
            hasHeader = currentSerie.title !== '',
            headerHeight = height / textOffset,
            baseColor = currentSerie.color ? currentSerie.color : e.colors[0],
            p1, p2;
        
        //gets percent value
        function getPercentValue(val) {
            //set current range
            currentRange = currentSerie.maxRange - currentSerie.minRange;

            //return percentage
            return Math.abs(val) / currentRange * 100 - (currentSerie.minRange / currentRange * 100);
        }

        //gets percent range
        function getPercentRange(cumulativeMax, val) { return val / cumulativeMax * 100 - (currentSerie.minRange / cumulativeMax * 100); }

        //gets positive percent value
        function getPositivePercentValue(val) { return val / currentSerie.maxRange * 100; }

        //gets negative percent value
        function getNegativePercentValue(val) { return val / Math.abs(currentSerie.minRange) * 100; }

        //converts value to degrees
        function convertToDegrees(val) { return val / currentRange * 270 - (currentSerie.minRange / currentRange * 270 + 45); }

        //converts value to radians
        function convertToRadians(val) { return convertToDegrees(val) * Math.PI / 180; }

        //converts value to point
        function convertToPoint(val, factor) {
            return {
                x: transX - radius * factor * Math.cos(convertToRadians(val)),
                y: transY - radius * factor * Math.sin(convertToRadians(val))
            };
        }

        //Gets needle path
        function getHandlePath(val) {
            //declare variables
            var delta = currentRange / 13,
                head = convertToPoint(val, 0.85),
                head1 = convertToPoint(val - delta, 0.12),
                head2 = convertToPoint(val + delta, 0.12),
                tailValue = val - (currentRange * (1 / (270 / 360)) / 2),
                tail = convertToPoint(tailValue, 0.28),
                tail1 = convertToPoint(tailValue - delta, 0.12),
                tail2 = convertToPoint(tailValue + delta, 0.12);

            //return path
            return [head, head1, tail2, tail, tail1, head2, head];
        }

        //returns an arc tween to interpolate values
        function arcTween(newValue, oldValue) {
            var interpolated = d3.interpolate(oldValue ? oldValue : 0, newValue);
            return function (t) {
                return innerArc(interpolated(t));
            };
        }

        //initializes standard gauge
        function standardGauge() {
            //calculate needed variables
            trendOffset = 10;
            trendHeight = diagram.trends.length > 0 ? trendOffset : 0;
            radius = (Math.min(width, height) - trendHeight) / 2;
            innerRadius = radius / 2 + trendOffset;
            titleTextSize = radius / 4;
            handleTextSize = titleTextSize * 0.5;
            labelTextSize = titleTextSize * 0.4;
            valueTextSize = titleTextSize * 0.9;
            transX = (width - trendHeight) / 2;
            transY = height / 2 + innerRadius;
            backArc = d3.arc().outerRadius(radius).innerRadius(innerRadius).startAngle(0).endAngle(Math.PI),
            innerArc = d3.arc().outerRadius(radius).innerRadius(innerRadius).startAngle(0).endAngle(function (d) { return d / 100 * Math.PI; });

            //create back circle
            backCircleSVG = diagramG.append('path')
                .attr('transform', 'translate(' + transX + ',' + transY + ')rotate(270)')
                .style('fill', currentSerie.backColor)
                .style('stroke', currentSerie.borderColor)
                .attr('d', backArc);

            //create gauge circle
            gaugeCircle = diagramG.append('path')
                .attr('transform', 'translate(' + transX + ',' + transY + ')rotate(270)')
                .attr('class', 'eve-handle')
                .style('fill', baseColor)
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attrTween('d', function () { return arcTween(percentValue); });

            //create trend arc
            diagramG.selectAll('.eve-gauge-trends')
                .data(diagram.trends)
                .enter().append('path')
                .attr('transform', 'translate(' + transX + ',' + transY + ')rotate(270)')
                .style('fill', function (currentTrend) { return currentTrend.color; })
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attrTween('d', function (currentTrend) {
                    //calculate trend values
                    var currentStartAngle = currentTrend.start / currentSerie.maxRange * Math.PI,
                        currentEndAngle = currentTrend.end / currentSerie.maxRange * Math.PI,
                        currentTrendArc = d3.arc().outerRadius(radius + trendOffset).innerRadius(radius).startAngle(currentStartAngle).endAngle(currentEndAngle);

                    //return arc
                    return currentTrendArc;
                });

            //check whether the serie is sparkline
            if (!currentSerie.isSparkline) {
                //check whether the title text is not empty
                if (currentSerie.title !== '') {
                    //create title text
                    titleSVG = diagramG.append('text')
                        .text(currentSerie.title)
                        .style('fill', currentSerie.titleColor)
                        .style('font-size', titleTextSize + 'px')
                        .style('text-anchor', 'middle')
                        .attr('x', transX)
                        .attr('y', transY - radius - titleTextSize / 2);
                }

                //create min handle
                minHandleSVG = diagramG.append('text')
                    .text(diagram.formatNumber(currentSerie.minRange))
                    .style('fill', currentSerie.handleColor)
                    .style('font-size', handleTextSize + 'px')
                    .style('text-anchor', 'start')
                    .attr('x', function (d) { return transX - radius; })
                    .attr('y', transY + handleTextSize);

                //create max handle
                maxHandleSVG = diagramG.append('text')
                    .text(diagram.formatNumber(currentSerie.maxRange))
                    .style('fill', currentSerie.handleColor)
                    .style('font-size', handleTextSize + 'px')
                    .style('text-anchor', 'end')
                    .attr('x', function (d) { return transX + radius; })
                    .attr('y', transY + handleTextSize);

                //create value handle
                handleSVG = diagramG.append('text')
                    .text(diagram.formatNumber(value, currentSerie.numberFormat))
                    .style('fill', currentSerie.titleColor)
                    .style('font-size', valueTextSize + 'px')
                    .style('text-anchor', 'middle')
                    .attr('x', transX)
                    .attr('y', transY);

                //create label
                labelSVG = diagramG.append('text')
                    .text(currentSerie.labelFormat)
                    .style('fill', currentSerie.handleColor)
                    .style('font-size', labelTextSize + 'px')
                    .style('text-anchor', 'middle')
                    .attr('x', transX)
                    .attr('y', transY + valueTextSize / 2);
            }
        }

        //initializes dial guage
        function dialGauge() {
            //calculate needed variables
            size = Math.min(width, height);
            radius = size / 2;
            transX = width / 2;
            transY = height / 2;
            currentRange = currentSerie.maxRange - currentSerie.minRange;
            titleTextSize = size / 12;
            handleTextSize = size / 20;
            valueTextSize = size / 11;
            handlePath = getHandlePath(diagram.data);
            handleLine = d3.line().x(function (d) { return d.x; }).y(function (d) { return d.y; }).curve(d3.curveBasis);

            //create back circle
            diagramG.append('circle')
                .attr('cx', transX)
                .attr('cy', transY)
                .attr('r', radius)
                .style('fill', currentSerie.backColor)
                .style('stroke', currentSerie.borderColor)
                .style('stroke-width', '0.5px');

            //create inner circle
            diagramG.append('circle')
                .attr('cx', transX)
                .attr('cy', transY)
                .attr('r', radius * 0.9)
                .style('fill', currentSerie.fillColor ? currentSerie.fillColor : '#ffffff')
                .style('stroke', d3.color(currentSerie.borderColor).darker(0.2))
                .style('stroke-width', '1px');

            //check whether the title text is not empty
            if (currentSerie.title !== '') {
                //create title text
                titleSVG = diagramG.append('text')
                    .text(currentSerie.title)
                    .style('fill', currentSerie.titleColor)
                    .style('font-size', titleTextSize + 'px')
                    .style('text-anchor', 'middle')
                    .attr('x', transX)
                    .attr('y', transY - (radius * 0.8) + titleTextSize)
                    .attr('dy', titleTextSize / 2);
            }

            //create trends
            diagramG.selectAll('.eve-gauge-trend')
                .data(diagram.trends)
                .enter().append('path')
                .attr('class', 'eve-gauge-trend')
                .style('fill', function (currentTrend) { return currentTrend.color; })
                .attr('transform', 'translate(' + transX + ',' + transY + ')rotate(270)')
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attrTween('d', function(currentTrend) { 
                    return d3.arc().outerRadius(radius * 0.88).innerRadius(radius * 0.80).startAngle(convertToRadians(currentTrend.start)).endAngle(convertToRadians(currentTrend.end)); 
                });

            //calculate major ticks delta
            var majorDelta = currentRange / (currentSerie.majorTicks - 1);

            //iterate min and max by major delta
            for (var major = currentSerie.minRange; major <= currentSerie.maxRange; major += majorDelta) {
                //calculate minor delta
                var minorDelta = majorDelta / currentSerie.minorTicks;

                //iterate to create minor ticks
                for (var minor = major + minorDelta; minor < Math.min(major + majorDelta, currentSerie.maxRange); minor += minorDelta) {
                    //create minor points
                    p1 = convertToPoint(minor, 0.75);
                    p2 = convertToPoint(minor, 0.85);

                    //create minor tick line
                    diagramG.append("line")
                        .attr("x1", p1.x)
                        .attr("y1", p1.y)
                        .attr("x2", p2.x)
                        .attr("y2", p2.y)
                        .style("stroke", d3.color(currentSerie.borderColor).darker(0.3))
                        .style("stroke-width", "1px");
                }

                //create major points
                p1 = convertToPoint(major, 0.7);
                p2 = convertToPoint(major, 0.85);

                //create major tick line
                diagramG.append("line")
                    .attr("x1", p1.x)
                    .attr("y1", p1.y)
                    .attr("x2", p2.x)
                    .attr("y2", p2.y)
                    .style("stroke", d3.color(currentSerie.borderColor).darker(0.5))
                    .style("stroke-width", "2px");

                //Create min and max handle
                if (major == currentSerie.minRange || major == currentSerie.maxRange) {
                    //create minmax handle point
                    var pHandle = convertToPoint(major, 0.63);

                    //create handle text
                    diagramG.append('text')
                        .attr('x', pHandle.x)
                        .attr('y', pHandle.y)
                        .attr('dy', handleTextSize / 3)
                        .attr('text-anchor', major == currentSerie.minRange ? 'start' : 'end')
                        .text(major)
                        .style('font-size', handleTextSize + 'px')
                        .style('fill', currentSerie.handleColor);
                }
            }

            //create handle g
            handleSVG = diagramG.append('g').attr('class', 'eve-gauge-handle');

            //draw handle
            handleSVG.selectAll('path')
                .data([getHandlePath(currentSerie.minRange)])
                .enter().append('path')
                .attr('d', handleLine)
                .style('fill', baseColor)
                .style('stroke', d3.color(baseColor).darker(0.5))
                .style('fill-opacity', 0.7);

            //animate handle
            handlePath = getHandlePath(diagram.data);
            handleSVG.selectAll('path')
                .data([handlePath])
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('d', handleLine);

            //draw handle circle
            diagramG.append("circle")
                .attr("cx", transX)
                .attr("cy", transY)
                .attr("r", 0.12 * radius)
                .style("fill", currentSerie.backColor)
                .style("stroke", currentSerie.borderColor)
                .style("opacity", 1);

            //create label svg
            labelSVG = diagramG.append('text')
                .text(value)
                .style('fill', currentSerie.titleColor)
                .style('font-size', valueTextSize + 'px')
                .style('text-anchor', 'middle')
                .attr("x", width / 2)
                .attr("y", transY + radius - valueTextSize - (valueTextSize / 2));

            //create label
            diagramG.append('text')
                .text(currentSerie.labelFormat)
                .style('fill', currentSerie.handleColor)
                .style('font-size', (valueTextSize / 2) + 'px')
                .style('text-anchor', 'middle')
                .attr('x', width / 2)
                .attr('y', transY + radius - valueTextSize);
        }

        //initializes digital gauge
        function digitalGauge() {
            //set title text size
            titleTextSize = headerHeight / 1.5;
            valueTextSize = (height - headerHeight) / 2;
            transY = headerHeight / 2 + titleTextSize / 2 - textOffset;
            transX = width / 2;

            //create base rectangle
            diagramG.append('rect')
                .attr('width', width)
                .attr('height', height)
                .style('fill', currentSerie.backColor)
                .style('stroke', currentSerie.borderColor)
                .style('stroke-width', '0.5px');

            //check whether the gauge has header
            if (hasHeader) {
                //create header rectangle
                diagramG.append('rect')
                    .attr('width', width)
                    .attr('height', headerHeight)
                    .style('fill', d3.color(currentSerie.backColor).darker(0.2))
                    .style('stroke', currentSerie.borderColor);
                    
                //append title text
                diagramG.append('text')
                    .text(currentSerie.title)
                    .style('fill', currentSerie.titleColor)
                    .style('font-size', titleTextSize + 'px')
                    .style('text-anchor', 'middle')
                    .attr('x', transX)
                    .attr('y', transY);
            }

            //create value label
            labelSVG = diagramG.append('text')
                .text('0')
                .style('fill', baseColor)
                .style('font-size', valueTextSize + 'px')
                .style('text-anchor', 'middle')
                .attr("x", transX)
                .attr('y', (height / 2) + (valueTextSize / (currentSerie.labelFormat ? 4 : 2)));

            //animate text
            labelSVG
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .tween("text", function () {
                    var textObj = this;
                    var interpolate = d3.interpolateNumber(d3.select(textObj).text(), diagram.data);
                    return function (t) {
                        d3.select(textObj).text(interpolate(t).toFixed(2));
                    };
                });

            //create label text
            diagramG.append('text')
                .text(currentSerie.labelFormat)
                .style('fill', currentSerie.handleColor)
                .style('font-size', (valueTextSize / 2) + 'px')
                .style('text-anchor', 'middle')
                .attr('x', width / 2)
                .attr('y', (height / 2) + valueTextSize);
        }

        //initializes bullet gauge
        function bullet() {

        }

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('width', width)
            .attr('height', height);

        //initialize gauge
        switch (type) {
            case 'standard':
                standardGauge();
                break;
            case 'dial':
                dialGauge();
                break;
            case 'digital':
                digitalGauge();
                break;
            case 'bullet':
                bullet();
                break;
        }

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            oldPercentValue = percentValue;
            diagram.data = data;
            value = data;
            percentValue = getPercentValue(value);

            //check gauge type
            switch (type) {
                case 'standard':
                    {
                        //update text value
                        handleSVG
                            .transition(diagram.animation.duration)
                            .ease(diagram.animation.easing.toEasing())
                            .delay(function (d, i) { return i * diagram.animation.delay; })
                            .text(diagram.formatNumber(value, currentSerie.numberFormat));

                        //update gauge arc
                        diagramG.selectAll('.eve-handle')
                            .transition(diagram.animation.duration)
                            .ease(diagram.animation.easing.toEasing())
                            .delay(function (d, i) { return i * diagram.animation.delay; })
                            .attrTween('d', function () { return arcTween(percentValue, oldPercentValue); });
                    }
                    break;
                case 'dial':
                    {
                        //update text value
                        labelSVG
                            .transition(diagram.animation.duration)
                            .ease(diagram.animation.easing.toEasing())
                            .delay(function (d, i) { return i * diagram.animation.delay; })
                            .text(diagram.formatNumber(value, currentSerie.numberFormat));

                        //animate handle
                        handlePath = getHandlePath(diagram.data);
                        handleSVG.selectAll('path')
                            .data([handlePath])
                            .transition(diagram.animation.duration)
                            .ease(diagram.animation.easing.toEasing())
                            .delay(function (d, i) { return i * diagram.animation.delay; })
                            .attr('d', handleLine);
                    }
                    break;
                case 'digital':
                    {
                        //animate text
                        labelSVG
                            .transition(diagram.animation.duration)
                            .ease(diagram.animation.easing.toEasing())
                            .delay(function (d, i) { return i * diagram.animation.delay; })
                            .tween("text", function () {
                                var textObj = this;
                                var interpolate = d3.interpolateNumber(d3.select(textObj).text(), diagram.data);
                                return function (t) {
                                    d3.select(textObj).text(interpolate(t).toFixed(2));
                                };
                            });
                    }
                    break;
            }
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

    //attach standard gauge method into the eve
    e.standardGauge = function (options) {
        options.type = '';
        return new gauge(options, 'standard');
    };

    //attach dial gauge method into the eve
    e.dialGauge = function (options) {
        options.type = '';
        return new gauge(options, 'dial');
    };

    //attach digital gauge method into the eve
    e.digitalGauge = function (options) {
        options.type = '';
        return new gauge(options, 'digital');
    };

    //attach dial gauge method into the eve
    e.linearBullet = function (options) {
        options.type = '';
        return new gauge(options, 'bullet');
    };
})(eve);