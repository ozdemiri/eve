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
        let diagram = eve.initVis(options),
            currentSerie = diagram.series[0];

        //check whether the diagram data is not number
        if (typeof diagram.data !== "number")
            diagram.data = 0;

        //precaution for min range
        if (currentSerie.minRange == null || typeof currentSerie.minRange !== "number")
            currentSerie.minRange = 0;

        //precaution for max range
        if (currentSerie.maxRange == null || typeof currentSerie.maxRange !== "number")
            currentSerie.maxRange = 0;

        //check whther the min and max ranges are 0
        if (currentSerie.minRange === 0 && currentSerie.maxRange === 0) {
            currentSerie.minRange = 0;
            currentSerie.maxRange = 100;
        }

        //declare variables
        let currentRange = 0,
            valueIsNull = diagram.data == null ? true : false,
            actualValue = +diagram.data,
            value = +diagram.data,
            trendHeight = 0,
            radius = 0,
            innerRadius = 0,
            transX = 0,
            transY = 0,
            trendOffset = 0,
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right,
            height = diagram.plot.height,
            percentValue = 0,
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
            pathG = null,
            markerSVG = null,
            backCircleSVG = null,
            gaugeCircle = null,
            size = 0,
            textOffset = 5,
            handlePath = null,
            handleLine = null,
            hasHeader = currentSerie.title !== '',
            headerHeight = hasHeader ? height / textOffset : 0,
            centerHeight = height - headerHeight,
            negativePercent = 0,
            positivePercent = 0,
            posX, bwp, posY,
            tooltipContent = '',
            bbox = null,
            currentRadius = 0,
            minFontSize = 8,
            baseColor = currentSerie.color ? currentSerie.color : e.colors[0],
            element = document.getElementById(diagram.container),
            elementOffset = e.offset(element),
            cumulativeMax = Number.MIN_VALUE,
            currentTrendHeightPercent = 0,
            currentTrendWidthPercent = 0,
            currentTrendWidth = 0,
            currentTrendHeight = 0,
            currentHeight = 0,
            currentWidth = 0,
            widthOffset = 0,
            heightOffset = 0,
            markerPercent = 0,
            labelOffset = currentSerie.labelFormat ? (currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize) : 0,
            availableBarHeight = diagram.plot.height,
            availableBarWidth = diagram.plot.width,
            xStartMargin = 0,
            xPrevTrend = 0,
            p1, p2;

        //fix value
        if (diagram.data > currentSerie.maxRange)
            currentSerie.maxRange = diagram.data;

        //set current range
        currentRange = currentSerie.maxRange - currentSerie.minRange;

        //calculate percent value
        percentValue = getPercentValue(value);

        //gets percent value
        function getPercentValue(val) {
            //return percentage
            let percentage = Math.abs(val) / currentRange * 100 - (currentSerie.minRange / currentRange * 100);
            if (isNaN(percentage))
                percentage = 0;
            return percentage;
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
            //set the object
            let pointObject = {
                x: transX - radius * factor * Math.cos(convertToRadians(val)),
                y: transY - radius * factor * Math.sin(convertToRadians(val))
            };

            if (isNaN(pointObject.x))
                pointObject.x = 0;

            if (isNaN(pointObject.y))
                pointObject.y = 0;

            return pointObject;
        }

        //Gets needle path
        function getHandlePath(val) {
            //declare variables
            let delta = currentRange / 13,
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
            let interpolated = d3.interpolate(oldValue ? oldValue : 0, newValue);
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

            //generate the path
            pathG = diagramG.append('g')
                .attr('transform', 'translate(0,' + (transY - transX) + ')');

            //create back circle
            backCircleSVG = pathG.append('path')
                .attr('transform', 'rotate(270,' + transX + ',0)')
                .style('fill', currentSerie.backColor)
                .style('stroke', currentSerie.borderColor)
                .attr('d', backArc);

            //create gauge circle
            gaugeCircle = pathG.append('path')
                .attr('transform', 'rotate(270,' + transX + ',0)')
                .attr('class', 'eve-handle')
                .style('fill', baseColor)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attrTween('d', function () { return arcTween(percentValue); });

            //iterate all trends
            diagram.trends.forEach(function (currentTrend, trendIndex) {
                //get previous trend
                let currentStartAngle = 0,
                    currentEndAngle = 0,
                    startPercent = getPercentValue(currentTrend.start),
                    endPercent = getPercentValue(currentTrend.end),
                    currentTrendArc = null;

                //set current angles
                currentStartAngle = startPercent / 100 * Math.PI;
                currentEndAngle = endPercent / 100 * Math.PI;

                //set current trend arc
                currentTrendArc = d3.arc().outerRadius(radius + trendOffset).innerRadius(radius).startAngle(currentStartAngle).endAngle(currentEndAngle);

                //check whether the trend is drawable
                if (currentTrend.start >= currentSerie.minRange && currentTrend.start <= currentSerie.maxRange && currentTrend.end >= currentSerie.minRange && currentTrend.end <= currentSerie.maxRange && currentTrend.end >= currentTrend.start) {
                    //create trend arc
                    pathG.append('path')
                        .attr('transform', 'rotate(270,' + transX + ',0)')
                        .style('fill', currentTrend.color)
                        .style('fill-opacity', currentSerie.alpha)
                        .attr('d', currentTrendArc)
                        .on('mousemove', function (d, i) {
                            //set hover
                            d3.select(this).attr('fill-opacity', 1);

                            //set tooltip content
                            tooltipContent = (currentTrend.title || currentTrend.name) + ' starts from ' + e.formatNumber(currentTrend.start, currentSerie.numberFormat || currentSerie.labelFormat) + ' ends at ' + e.formatNumber(currentTrend.end, currentSerie.numberFormat || currentSerie.labelFormat);

                            //show tooltip
                            diagram.showTooltip(tooltipContent);
                        })
                        .on('mouseout', function (d, i) {
                            //set hover
                            d3.select(this).attr('fill-opacity', currentSerie.alpha);

                            //hide tooltip
                            diagram.hideTooltip();
                        });
                }
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
                    .text(e.formatNumber(currentSerie.minRange, currentSerie.numberFormat || currentSerie.labelFormat))
                    .style('fill', currentSerie.labelFontColor)
                    .style('font-size', handleTextSize + 'px')
                    .style('text-anchor', 'start')
                    .attr('x', function (d) { return transX - radius; })
                    .attr('y', transY + handleTextSize);

                //create max handle
                maxHandleSVG = diagramG.append('text')
                    .text(e.formatNumber(currentSerie.maxRange, currentSerie.numberFormat || currentSerie.labelFormat))
                    .style('fill', currentSerie.labelFontColor)
                    .style('font-size', handleTextSize + 'px')
                    .style('text-anchor', 'end')
                    .attr('x', function (d) { return transX + radius; })
                    .attr('y', transY + handleTextSize);

                //create value handle
                handleSVG = diagramG.append('text')
                    .text(e.formatNumber(actualValue, currentSerie.numberFormat || currentSerie.labelFormat))
                    .style('fill', currentSerie.labelFontColor)
                    .style('font-size', valueTextSize + 'px')
                    .style('text-anchor', 'middle')
                    .attr('x', transX)
                    .attr('y', transY);

                //create label
                labelSVG = diagramG.append('text')
                    .text(currentSerie.labelFormat)
                    .style('fill', currentSerie.labelFontColor)
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
            handleLine = d3.line().x(function (d) { return d.x; }).y(function (d) { return d.y; });

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
                .style('fill', currentSerie.fillColor ? currentSerie.fillColor : 'rgb(255,255,255)')
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
            pathG = diagramG.append('g')
                .attr('transform', 'translate(0,' + (transY - transX) + ')');
            pathG.selectAll('.eve-gauge-trend')
                .data(diagram.trends)
                .enter().append('path')
                .attr('class', 'eve-gauge-trend')
                .style('fill', function (currentTrend) { return currentTrend.color; })
                .attr('transform', 'rotate(270,' + transX + ',0)')
                .on('mousemove', function (d, i) {
                    //set hover
                    d3.select(this).attr('fill-opacity', 1);

                    //set tooltip content
                    tooltipContent = (d.title || d.name) + ' starts from ' + e.formatNumber(d.start, currentSerie.numberFormat || currentSerie.labelFormat) + ' ends at ' + e.formatNumber(d.end, currentSerie.numberFormat || currentSerie.labelFormat);

                    //show tooltip
                    diagram.showTooltip(tooltipContent);
                })
                .on('mouseout', function (d, i) {
                    //set hover
                    d3.select(this).attr('fill-opacity', currentSerie.alpha);

                    //hide tooltip
                    diagram.hideTooltip();
                })
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attrTween('d', function (currentTrend) {
                    return d3.arc().outerRadius(radius * 0.88).innerRadius(radius * 0.80).startAngle(convertToRadians(currentTrend.start)).endAngle(convertToRadians(currentTrend.end));
                });

            //calculate major ticks delta
            let majorDelta = currentRange / (currentSerie.majorTicks - 1);

            //iterate min and max by major delta
            for (let major = currentSerie.minRange; major <= currentSerie.maxRange; major += majorDelta) {
                //calculate minor delta
                let minorDelta = majorDelta / currentSerie.minorTicks;

                //iterate to create minor ticks
                for (let minor = major + minorDelta; minor < Math.min(major + majorDelta, currentSerie.maxRange) ; minor += minorDelta) {
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
                    let pHandle = convertToPoint(major, 0.63);

                    //create handle text
                    diagramG.append('text')
                        .attr('x', pHandle.x)
                        .attr('y', pHandle.y)
                        .attr('dy', handleTextSize / 3)
                        .style('text-anchor', major == currentSerie.minRange ? 'start' : 'end')
                        .text(e.formatNumber(major, currentSerie.numberFormat || currentSerie.labelFormat))
                        .style('font-size', handleTextSize + 'px')
                        .style('fill', currentSerie.labelFontColor);
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
                .transition().duration(diagram.animation.duration)
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
                .style("fill-opacity", 1);

            //create label svg
            labelSVG = diagramG.append('text')
                .text(e.formatNumber(actualValue, currentSerie.numberFormat || currentSerie.labelFormat))
                .style('fill', currentSerie.labelFontColor)
                .style('font-size', valueTextSize + 'px')
                .style('text-anchor', 'middle')
                .attr("x", width / 2)
                .attr("y", transY + radius - valueTextSize - (valueTextSize / 2));

            //create label
            diagramG.append('text')
                .text(currentSerie.labelFormat)
                .style('fill', currentSerie.labelFontColor)
                .style('font-size', (valueTextSize / 2) + 'px')
                .style('text-anchor', 'middle')
                .attr('x', width / 2)
                .attr('y', transY + radius - valueTextSize);
        }

        //initializes digital gauge
        function digitalGauge() {
            //set title text size
            titleTextSize = headerHeight / 1.5;
            valueTextSize = width / 6; //> centerHeight ? width / 2.5 : centerHeight / 2.5;
            transY = headerHeight / 2 + titleTextSize / 2 - textOffset;
            transX = width / 2;
            valueHeight = height - headerHeight;

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
                    .style('font-family', "Arial")
                    .style('font-size', '10px')
                    .style('font-size', function (d) {
                        var maxHeight = (headerHeight - 6) / this.getBBox().height * 10,
                            maxWidth = (width - 6) / this.getComputedTextLength() * 10;
                        titleTextSize = Math.min(maxHeight, maxWidth);
                        transY = headerHeight / 2 + titleTextSize / 2 - textOffset;
                        return titleTextSize + 'px';
                    })
                    .style('text-anchor', 'middle')
                    .attr('x', transX)
                    .attr('y', transY);
            }

            //create value label
            labelSVG = diagramG.append('text')
                .style('font-size', minFontSize + 'px')
                .text(e.formatNumber(diagram.data, currentSerie.numberFormat || currentSerie.labelFormat))
                .style('fill', baseColor)
                .style('font-family', "Arial")
                .style('font-size', function (d) {
                    /*if (width > height)
                        currentRadius = (Math.min(width, valueHeight) / 2) * 0.5;
                    else
                        currentRadius = (Math.min(width, valueHeight) / 2) * 0.5;

                    //set value text size
                    valueTextSize = Math.min(2 * currentRadius, (2 * currentRadius - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * minFontSize);

                    //check if there is label
                    if (currentSerie.labelFormat)
                        valueTextSize -= (valueTextSize / 2);

                    //check whether the with is greater than the height
                    if (width > valueHeight)
                        return valueHeight + "px";
                    */
                    currentRadius = width / 2;
                    valueTextSize = Math.min(2 * currentRadius, (2 * currentRadius - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * minFontSize);
                    if (valueTextSize > valueHeight)
                        valueTextSize = valueHeight;

                    if (e.getBrowserName() === "Firefox") {
                        valueTextSize -= 10;
                        if (valueTextSize < minFontSize)
                            valueTextSize = minFontSize;
                    }

                    return valueTextSize + 'px';
                })
                .style('text-anchor', 'middle')
                .attr("x", transX)
                .attr('y', function () {
                    //if (width > valueHeight)
                    //    return valueHeight + headerHeight / 2;

                    //return y
                    return ((height - headerHeight) / 2) + (valueTextSize / 2) + minFontSize;
                });

            //create label text
            diagramG.append('text')
                .text(currentSerie.labelFormat)
                .style('fill', currentSerie.handleColor)
                .style('font-family', "Arial")
                .style('font-size', (valueTextSize / 2) + 'px')
                .style('text-anchor', 'middle')
                .attr('x', width / 2)
                .attr('y', (height / 2) + valueTextSize);
        }

        //initializes linear gauge
        function linear() {
            //set dimension
            element = document.getElementById(diagram.container);
            elementOffset = e.offset(element);
            width = elementOffset.width + diagram.margin.left;
            height = elementOffset.height + diagram.margin.top;

            //remove margins
            diagram.svg.remove();
            diagram.svg = d3.select('#' + diagram.innerContainer)
                .append('svg')
                .attr('id', diagram.container + '_svg')
                .attr('class', 'vis_svg')
                .attr('width', width - diagram.margin.left)
                .attr('height', height - diagram.margin.top);

            //set g
            diagramG = diagram.svg.append('g')
                .attr('transform', 'translate(0,0)')
                .attr('width', width)
                .attr('height', height + diagram.margin.top);


            //create base rectangle
            diagramG.append('rect')
                .attr('width', width)
                .attr('height', height)
                .style('fill', 'transparent')
                .attr('x', 0).attr('y', 0);
            //.attr('rx', 5).attr('ry', 5);

            //check range
            if (currentSerie.minRange < 0) {
                //set needed variables
                currentRange = currentSerie.maxRange - currentSerie.minRange;
                negativePercent = Math.abs(currentSerie.minRange) / currentRange;
                positivePercent = Math.abs(currentSerie.maxRange) / currentRange;
                bwp = Math.abs(value) / currentRange * 100;

                //check value direction
                if (value > 0) {
                    //calculate envrionment
                    posX = width * negativePercent;

                    //create rectangle
                    handleSVG = diagramG.append('rect')
                        .style('fill', baseColor)
                        .style('fill-opacity', currentSerie.alpha)
                        .attr('y', 0)
                        .attr('height', height)
                        .attr('x', posX)
                        .attr('width', width * bwp / 100);

                } else {
                    //calculate envrionment
                    posX = (width * negativePercent) - (width * bwp / 100);

                    //create rectangle
                    handleSVG = diagramG.append('rect')
                        .style('fill', currentSerie.negativeColor)
                        .style('fill-opacity', currentSerie.alpha)
                        .attr('y', 0)
                        .attr('height', height)
                        .attr('x', posX)
                        .attr('width', width * bwp / 100);
                }
            } else {
                //create rectangle
                handleSVG = diagramG.append('rect')
                    .style('fill', baseColor)
                    .style('fill-opacity', currentSerie.alpha)
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', width * percentValue / 100)
                    .attr('height', height);
            }

            //create text
            labelSVG = diagramG.append('text')
                .style('fill', '#333333')
                .style('font-size', (currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize) + 'px')
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('text-anchor', function () {
                    //check label position
                    if (currentSerie.labelPosition) {
                        if (currentSerie.labelPosition === 'right')
                            return 'end'
                        else if (currentSerie.labelPosition === 'center')
                            return 'middle';
                    }
                    return 'start';
                })
                .text(currentSerie.labelHidden ? '' : (valueIsNull ? '' : (e.formatNumber(diagram.data, currentSerie.numberFormat || currentSerie.labelFormat))))
                .attr('transform', function () {
                    //set x and y
                    bbox = this.getBBox();
                    posY = bbox.height;
                    posX = 0;

                    //check label position
                    if (currentSerie.labelPosition) {
                        if (currentSerie.labelPosition === 'right')
                            posX = width - diagram.margin.left;
                        else if (currentSerie.labelPosition === 'center')
                            posX = (width - diagram.margin.left) / 2;
                    }

                    //return translation
                    return 'translate(' + posX + ',' + posY + ')';
                });
        }

        //initializes bullet gauge
        function bullet() {
            //check if diagram has marker value
            if (!diagram.marker)
                diagram.marker = 0;

            //set font size
            if (currentSerie.labelFontSize === 'auto')
                currentSerie.labelFontSize = 11;

            //iterate all trends to set cumulative max
            diagram.trends.forEach(function (currentTrend) {
                //check trend end value
                if (currentTrend.end > cumulativeMax)
                    cumulativeMax = currentTrend.end;
            });

            //check values
            if (diagram.data > cumulativeMax)
                cumulativeMax = diagram.data;

            //check marker is greater than cumulative max
            if (diagram.marker > cumulativeMax)
                cumulativeMax = diagram.marker;

            //set max length
            if (!currentSerie.maxLength)
                currentSerie.maxLength = currentSerie.labelFormat.length;

            //check orientation
            if (currentSerie.orientation === 'vertical') {
                //set width offset
                widthOffset = diagram.plot.width / 5;

                //set label
                labelSVG = diagramG.append('text')
                    .text(currentSerie.labelFormat)
                    .style('fill', currentSerie.labelFontColor === 'auto' ? diagram.getAutoColor(baseColor) : currentSerie.labelFontColor)
                    .style('font-size', (currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize) + 'px')
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'middle')
                    .attr('transform', function (d) {
                        //get pos
                        posY = currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize;
                        posX = (diagram.plot.width / 2);
                        bbox = this.getBBox();
                        labelOffset = bbox.height + 2;

                        //return translation
                        return 'translate(' + posX + ', ' + posY + ')';
                    });

                //set bar height
                availableBarHeight = diagram.plot.height - labelOffset;

                //iterate all trends to set ranges
                diagram.trends.forEach(function (currentTrend) {
                    //create ranges
                    diagramG.append('rect')
                        .attr('fill', currentTrend.color)
                        .attr('fill-opacity', currentSerie.alpha)
                        .attr('width', diagram.plot.width)
                        .attr('height', function () {
                            //calculate height
                            currentTrendHeightPercent = getPercentRange(cumulativeMax, currentTrend.end - currentTrend.start);
                            currentTrendHeight = availableBarHeight * currentTrendHeightPercent / 100;

                            //return height
                            return currentTrendHeight;
                        })
                        .attr('x', diagram.margin.left)
                        .attr('y', function (d) {
                            //calculate width
                            currentTrendHeightPercent = getPercentRange(cumulativeMax, currentTrend.end - currentTrend.start);
                            currentTrendHeight = availableBarHeight * currentTrendHeightPercent / 100;
                            percentValue = getPercentRange(cumulativeMax, currentTrend.start);
                            posY = availableBarHeight - (currentTrendHeight + (availableBarHeight * percentValue / 100));

                            //return y
                            return posY + labelOffset;
                        })
                        .on('mousemove', function (d, i) {
                            //set tooltip content
                            tooltipContent = (currentTrend.title || currentTrend.name) + ' starts from ' + e.formatNumber(currentTrend.start, currentSerie.numberFormat || currentSerie.labelFormat) + ' ends at ' + e.formatNumber(currentTrend.end, currentSerie.numberFormat || currentSerie.labelFormat);

                            //show tooltip
                            diagram.showTooltip(tooltipContent);
                        })
                        .on('mouseout', function (d, i) {
                            //hide tooltip
                            diagram.hideTooltip();
                        });
                });

                //set measure handle
                handleSVG = diagramG.append('rect')
                    .attr('fill', baseColor)
                    .on('mousemove', function (d, i) {
                        //set tooltip content
                        tooltipContent = e.formatNumber(diagram.data, currentSerie.numberFormat || currentSerie.labelFormat);

                        //show tooltip
                        diagram.showTooltip(tooltipContent);
                    })
                    .on('mouseout', function (d, i) {
                        //hide tooltip
                        diagram.hideTooltip();
                    })
                    .attr('width', diagram.plot.width - widthOffset)
                    .attr('height', 0)
                    .attr('x', widthOffset / 2)
                    .attr('y', diagram.plot.height)
                    .transition().duration(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .attr('height', function () {
                        //calculate height
                        percentValue = getPercentRange(cumulativeMax, diagram.data);
                        currentHeight = availableBarHeight * percentValue / 100;
                        return currentHeight;
                    })
                    .attr('y', function () { return availableBarHeight - currentHeight + labelOffset; });

                //set marker handle
                markerSVG = diagramG.append('rect')
                    .attr('fill', '#333333')
                    .attr('width', diagram.plot.width - widthOffset)
                    .attr('height', 5)
                    .on('mousemove', function (d, i) {
                        //set tooltip content
                        tooltipContent = e.formatNumber(diagram.marker, currentSerie.numberFormat || currentSerie.labelFormat);

                        //show tooltip
                        diagram.showTooltip(tooltipContent);
                    })
                    .on('mouseout', function (d, i) {
                        //hide tooltip
                        diagram.hideTooltip();
                    })
                    .attr('x', widthOffset / 2)
                    .attr('y', diagram.plot.height)
                    .transition().duration(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .attr('y', function () {
                        //calculate y
                        markerPercent = getPercentRange(cumulativeMax, diagram.marker);
                        currentHeight = availableBarHeight * markerPercent / 100;
                        posY = availableBarHeight - currentHeight + labelOffset;
                        return posY < 0 ? 0 : posY;
                    });
            } else {
                //set heigh offset
                heightOffset = diagram.plot.height / 5;

                //set label
                labelSVG = diagramG.append('text')
                    .text(currentSerie.labelFormat)
                    .style('fill', currentSerie.labelFontColor === 'auto' ? diagram.getAutoColor(baseColor) : currentSerie.labelFontColor)
                    .style('font-size', (currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize) + 'px')
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'start')
                    .attr('transform', function (d) {
                        //get pos
                        bbox = this.getBBox();
                        posX = 0;
                        posY = diagram.plot.height / 2;

                        //return translation
                        return 'translate(' + posX + ', ' + posY + ')';
                    });

                //set x start margin
                xStartMargin = (currentSerie.maxLength * (currentSerie.labelFontSize / 2)) + 1;
                availableBarWidth = diagram.plot.width - xStartMargin;

                //iterate all trends to set ranges
                diagram.trends.forEach(function (currentTrend) {
                    //create ranges
                    diagramG.append('rect')
                        .attr('fill', currentTrend.color)
                        .attr('fill-opacity', currentSerie.alpha)
                        .attr('width', function (d) {
                            //set width
                            currentTrendWidthPercent = getPercentRange(cumulativeMax, currentTrend.end - currentTrend.start);
                            currentTrendWidth = availableBarWidth * currentTrendWidthPercent / 100;
                            return currentTrendWidth;
                        })
                        .attr('height', diagram.plot.height)
                        .attr('x', function (d) {
                            //calculate x pos
                            bbox = this.getBBox();
                            posX = xStartMargin + xPrevTrend;
                            xPrevTrend += bbox.width;
                            return posX;
                        })
                        .attr('y', 0)
                        .on('mousemove', function (d, i) {
                            //set tooltip content
                            tooltipContent = (currentTrend.title || currentTrend.name) + ' starts from ' + e.formatNumber(currentTrend.start, currentSerie.numberFormat || currentSerie.labelFormat) + ' ends at ' + e.formatNumber(currentTrend.end, currentSerie.numberFormat || currentSerie.labelFormat);

                            //show tooltip
                            diagram.showTooltip(tooltipContent);
                        })
                        .on('mouseout', function (d, i) {
                            //hide tooltip
                            diagram.hideTooltip();
                        });
                });

                //set measure handle
                handleSVG = diagramG.append('rect')
                    .attr('fill', baseColor)
                    .on('mousemove', function (d, i) {
                        //set tooltip content
                        tooltipContent = e.formatNumber(diagram.data, currentSerie.numberFormat || currentSerie.labelFormat);

                        //show tooltip
                        diagram.showTooltip(tooltipContent);
                    })
                    .on('mouseout', function (d, i) {
                        //hide tooltip
                        diagram.hideTooltip();
                    })
                    .attr('width', 0)
                    .attr('height', diagram.plot.height - heightOffset)
                    .attr('x', xStartMargin)
                    .attr('y', heightOffset / 2)
                    .transition().duration(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .attr('width', function () {
                        //calculate height
                        percentValue = getPercentRange(cumulativeMax, diagram.data);
                        currentWidth = availableBarWidth * percentValue / 100;
                        return currentWidth;
                    });

                //set measure handle
                markerSVG = diagramG.append('rect')
                    .attr('fill', '#333333')
                    .on('mousemove', function (d, i) {
                        //set tooltip content
                        tooltipContent = e.formatNumber(diagram.marker, currentSerie.numberFormat || currentSerie.labelFormat);

                        //show tooltip
                        diagram.showTooltip(tooltipContent);
                    })
                    .on('mouseout', function (d, i) {
                        //hide tooltip
                        diagram.hideTooltip();
                    })
                    .attr('width', 5)
                    .attr('height', diagram.plot.height - heightOffset)
                    .attr('x', xStartMargin)
                    .attr('y', heightOffset / 2)
                    .transition().duration(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .attr('x', function () {
                        //calculate height
                        markerPercent = getPercentRange(cumulativeMax, diagram.marker);
                        currentWidth = availableBarWidth * markerPercent / 100;
                        posX = currentWidth + xStartMargin;
                        return posX > availableBarWidth ? availableBarWidth : posX;
                    });
            }
        }

        //create diagram g
        let diagramG = null;

        //set g
        if (type !== 'linear') {
            diagramG = diagram.svg.append('g')
                .attr('width', width)
                .attr('height', height)
                .on("click", function () {
                    if (diagram.onClick)
                        diagram.onClick();
                });
        }

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
            case 'linear':
                linear();
                break;
        }

        //update diagram
        diagram.update = function (data, marker) {
            //check data
            if (arguments.length === 0)
                data = diagram.data;

            //set diagram data
            actualValue = data;
            oldPercentValue = percentValue;
            diagram.data = data;
            value = data;

            //check if old percent value > 100
            if (oldPercentValue > 100)
                oldPercentValue = 100;

            //set marker
            if (marker)
                diagram.marker = marker;

            //fix value
            if (diagram.data > currentSerie.maxRange)
                currentSerie.maxRange = diagram.data;

            //set percent value
            percentValue = getPercentValue(value);

            //check if new percent value > 100
            if (percentValue > 100)
                percentValue = 100;

            //check gauge type
            switch (type) {
                case 'standard':
                    {
                        //update text value
                        handleSVG
                            .transition().duration(diagram.animation.duration)
                            .ease(diagram.animation.easing.toEasing())
                            .delay(function (d, i) { return i * diagram.animation.delay; })
                            .text(e.formatNumber(value, currentSerie.numberFormat || currentSerie.labelFormat));

                        //update gauge arc
                        diagramG.selectAll('.eve-handle')
                            .transition().duration(diagram.animation.duration)
                            .ease(diagram.animation.easing.toEasing())
                            .delay(function (d, i) { return i * diagram.animation.delay; })
                            .attrTween('d', function () {
                                return arcTween(percentValue, oldPercentValue);
                            });
                    }
                    break;
                case 'dial':
                    {
                        //update text value
                        labelSVG
                            .transition().duration(diagram.animation.duration)
                            .ease(diagram.animation.easing.toEasing())
                            .delay(function (d, i) { return i * diagram.animation.delay; })
                            .text(e.formatNumber(value, currentSerie.numberFormat || currentSerie.labelFormat));

                        //animate handle
                        handlePath = getHandlePath(diagram.data);
                        handleSVG.selectAll('path')
                            .data([handlePath])
                            .transition().duration(diagram.animation.duration)
                            .ease(diagram.animation.easing.toEasing())
                            .delay(function (d, i) { return i * diagram.animation.delay; })
                            .attr('d', handleLine);
                    }
                    break;
                case 'digital':
                    {
                        //animate text
                        labelSVG
                            .text(e.formatNumber(diagram.data, currentSerie.numberFormat || currentSerie.labelFormat));
                    }
                    break;
                case 'linear':
                    {
                        //remove g
                        diagramG.remove();
                        linear();
                    }
                    break;
                case 'bullet':
                    {
                        //remove g
                        diagramG.remove();
                        diagramG = diagram.svg.append('g').attr('width', width).attr('height', height);
                        xStartMargin = 0;
                        xPrevTrend = 0;
                        bullet();
                    }
                    break;
            }
        };

        //return abacus diagram
        return diagram;
    }

    //attach standard gauge method into the eve
    e.standardGauge = function (options) {
        options.type = 'standardGauge';

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new gauge(options, 'standard');
    };

    //attach dial gauge method into the eve
    e.dialGauge = function (options) {
        options.type = 'dialGauge';

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new gauge(options, 'dial');
    };

    //attach digital gauge method into the eve
    e.digitalGauge = function (options) {
        options.type = 'digitalGauge';

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new gauge(options, 'digital');
    };

    //attach linear gauge method into the eve
    e.linearGauge = function (options) {
        options.type = 'linearGauge';

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new gauge(options, 'linear');
    };

    //attach dial gauge method into the eve
    e.linearBullet = function (options) {
        options.type = 'linearBullet';

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new gauge(options, 'bullet');
    };
})(eve);
