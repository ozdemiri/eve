/*!
 * eve.calendarmap.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for calendarmap diagram.
 */
(function (e) {
    //define the calendarmap class
    function calendarmap(options) {
        //declare date parser
        let dateParser = d3.timeParse('%Y-%m-%d');

        //declare needed variables
        let diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            dataset = e.clone(diagram.data),
            years = [],
            minDate = d3.min(dataset, function (d) { return d[currentSerie.dateField]; }),
            maxDate = d3.max(dataset, function (d) { return d[currentSerie.dateField]; }),
            minMeasure = d3.min(dataset, function (d) { return +d[currentSerie.measureField]; }),
            maxMeasure = d3.max(dataset, function (d) { return +d[currentSerie.measureField]; }),
            topOffset = 5,
            leftOffset = diagram.xAxis.labelFontSize + diagram.xAxis.titleFontSize,
            weeksCount = 53,
            daysCount = 7,
            monthsCount = 12,
            marginTotalWidth = diagram.plot.left + diagram.plot.right,
            marginTotalHeight = diagram.plot.top + diagram.plot.bottom,
            height = 0, width = 0,
            xPos = 0, yPos = 0,
            bbox = null,
            rectX = 0, rectY = 0,
            day = d3.timeFormat('%w'),
            week = d3.timeFormat('%U'),
            yearsG = null,
            yearLabels = null,
            dayLabels = null,
            monthLabels = null,
            monthSeperators = null,
            nestedData = null,
            currentData = null,
            currentDateValue = null,
            currentYear = '', currentMonth = '', currentDay = '',
            currentMeasureValue = 0,
            dayRects = null,
            dataLabels = null,
            scaleColor = null,
            rangeIterator = 0,
            rScale = null,
            cellWidth = 0, cellHeight = 0,
            minFontSize = 8,
            currentRadius = 0,
            minSize = 0;

        //calculates scales and environmental variables
        function calculateScales() {
            //clear years
            years = [];

            //filter dataset
            dataset = dataset.filter(function (d) {
                if (d[currentSerie.measureField] != null)
                    return d;
            });

            //set years
            d3.map(dataset, function (d) {
                //get current date value
                currentDateValue = d3.timeDay(new Date(d[currentSerie.dateField]));
                currentYear = currentDateValue.getFullYear();

                //return year
                if (years.indexOf(currentYear) === -1)
                    years.push(currentYear);
            });

            if (minMeasure === maxMeasure && diagram.domains.maxY > maxMeasure)
                maxMeasure = diagram.domains.maxY;

            //set dimensions
            width = (diagram.plot.width);
            height = ((diagram.plot.height - topOffset) / years.length);
            cellWidth = ((width - leftOffset) / weeksCount) - 1,
            cellHeight = ((height - topOffset) / daysCount) - 2;
            xPos = (((width - leftOffset) - (cellWidth * weeksCount)) / 2);
            yPos = (height - (cellHeight * daysCount)) - topOffset;
            rangeIterator = (minMeasure + maxMeasure) / diagram.legend.gradientColors.length;
            minSize = Math.min(cellWidth, cellHeight);

            //create nested data
            nestedData = d3.nest()
                .key(function (d) {
                    //get current values
                    currentDateValue = d3.timeDay(new Date(d[currentSerie.dateField]));
                    currentYear = currentDateValue.getFullYear();
                    currentMonth = currentDateValue.getMonth();
                    currentDay = currentDateValue.getDate();

                    //return calculated date data
                    return d3.timeDay(new Date(currentYear, currentMonth, currentDay, 0, 0, 0));
                })
                .map(dataset);

            //create color domain. this required for 3 or more color legends
            let colorDomain = d3.range(minMeasure, maxMeasure, (maxMeasure - minMeasure) / (diagram.legend.gradientColors.length - 1));
            colorDomain.push(maxMeasure);

            //create color scale
            scaleColor = d3.scaleLinear().range(diagram.legend.gradientColors).domain(colorDomain);
            rScale = d3.scalePow().exponent(0.5).domain([minMeasure, maxMeasure]).range([minSize, minSize]);
            //console.log(scaleColor(1));
        }

        //creates month seperation paths
        function monthPath(dateVal) {
            //declare needed variables
            let dateValNext = d3.timeDay(new Date(dateVal.getFullYear(), dateVal.getMonth() + 1, 0)),
                d0 = +day(dateVal),
                w0 = +week(dateVal),
                d1 = +day(dateValNext),
                w1 = +week(dateValNext),
                mx = ((w0 + 1) * cellWidth) + leftOffset,
                hx = (w0 * cellWidth) + leftOffset,
                wx = (w1 * cellWidth) + leftOffset,
                hwx = ((w1 + 1) * cellWidth) + leftOffset,
                my = (d0 * cellHeight) + topOffset,
                vy = (7 * cellHeight) + topOffset,
                vy2 = ((d1 + 1) * cellHeight) + topOffset;

            //return path string
            return 'M' + mx + ',' + my + 'H' + hx + 'V' + vy + 'H' + wx + 'V' + vy2 + 'H' + hwx + 'V' + 5 + 'H' + mx + 'Z';
        }

        //animates calendarmap
        function animateCalendarmap() {
            //animate years
            yearsG.attr('transform', function (d, i) {
                //calculate x position of the svg
                xPos = (((width - leftOffset) - (cellWidth * weeksCount)) / 2);

                //calculate y position of the svg
                yPos = (i * (height - topOffset)) + topOffset + diagram.xAxis.titleFontSize;

                //return calculated translation
                return 'translate(' + xPos + ',' + yPos + ')';
            });

            //animate years label
            yearLabels
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .text(function (d) { return d; })
                .attr('transform', function (d, i) {
                    //set x and y pos
                    bbox = this.getBBox();
                    xPos = -1 * bbox.height;
                    yPos = cellHeight * (daysCount / 2);

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')rotate(-90)';
                });

            //animate day names
            dayLabels
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr('y', function (d, i) {
                    return (i * cellHeight) + (cellHeight / 2) + (this.getBBox().height / 2) + (topOffset / 2);
                });

            //animate months names
            monthLabels
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr('x', function (d, i) { return (((weeksCount * cellWidth) / monthsCount) * (i + 1)) - (cellWidth * daysCount / 4) + daysCount; })
                .attr('y', 0);

            //animate month seperations
            monthSeperators
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * (diagram.animation.delay / 2); })
                .attr('opacity', 1)
                .attr('d', monthPath);
        }

        //draws months, days and labels
        function drawEnvironment() {
            //draw month labels
            monthLabels = diagram.svg.append('g')
                .attr('class', 'eve-calendarmap-month-g')
                .attr('transform', function (d, i) {
                    //calculate y position of the svg
                    yPos = topOffset + diagram.xAxis.titleFontSize;

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                })
                .selectAll('.eve-calendarmap-monthnames')
                .data(e.monthsMin)
                .enter().append('text')
                .attr('class', 'eve-calendarmap-monthnames')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('fill-opacity', 1)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily)
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function (d) { return d; })
                .attr('x', function (d, i) { return (((weeksCount * cellWidth) / monthsCount) * (i + 1)) - (cellWidth * daysCount / 4) + daysCount; })
                .attr('y', 0);

            //create g for each year
            yearsG = diagram.svg.selectAll('.eve-calendarmap-g')
                .data(years)
                .enter().append('g')
                .attr('class', 'eve-calendarmap-g')
                .attr('transform', function (d, i) {
                    //calculate y position of the svg
                    yPos = (i * (height - topOffset)) + topOffset + diagram.xAxis.titleFontSize;

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //append year texts
            yearLabels = yearsG.append('text')
                .attr('class', 'eve-calendarmap-years')
                .style('text-anchor', 'middle')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('fill-opacity', 1)
                .style('font-size', diagram.xAxis.titleFontSize + 'px')
                .style('font-family', diagram.xAxis.titleFontFamily)
                .style('font-style', diagram.xAxis.titleFontStyle === 'bold' ? 'normal' : diagram.xAxis.titleFontStyle)
                .style('font-weight', diagram.xAxis.titleFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function (d) { return d; })
                .attr('transform', function (d, i) {
                    //set x and y pos
                    bbox = this.getBBox();
                    xPos = -1 * bbox.height;

                    //return calculated translation
                    return 'translate(' + xPos + ',0)rotate(-90)';
                });

            //draw days
            dayRects = yearsG.selectAll('.eve-calendarmap-days')
                .data(function (d) {
                    return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1));
                })
                .enter().append('rect')
                .attr('class', 'eve-calendarmap-days')
                .style('fill', 'rgb(255,255,255)')
                .style('fill-opacity', currentSerie.alpha)
                .style('stroke', 'rgb(239,239,239)')
                .style('stroke-opacity', 1)
                .attr('width', cellWidth)
                .attr('height', cellHeight)
                .attr('x', function (d) { return (week(d) * cellWidth) + leftOffset; })
                .attr('y', function (d) { return (day(d) * cellHeight) + topOffset; });

            //draw labels
            dataLabels = yearsG.selectAll('.eve-calendarmap-labels')
                .data(function (d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                .enter().append('text')
                .attr('class', 'eve-calendarmap-labels')
                .style('text-anchor', 'middle')
                .style('pointer-events', 'none')
                .style('fill', '#333333')
                .style('font-size', currentSerie.labelFontSize + 'px')
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text('');

            //draw day names
            dayLabels = yearsG.selectAll('.eve-calendarmap-daynames')
                .data(e.daysMin)
                .enter().append('text')
                .attr('class', 'eve-calendarmap-daynames')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('fill-opacity', 1)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily)
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function (d) { return d; })
                .attr('x', daysCount / 2 * -1)
                .attr('y', 0);

            //draw month seperations
            monthSeperators = yearsG.selectAll('.eve-calendarmap-month')
                .data(function (d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                .enter().append('path')
                .attr('class', 'eve-calendarmap-month')
                .style('fill', 'none')
                .style('fill-opacity', 0)
                .style('stroke', 'rgb(215,215,215)')
                .style('stroke-opacity', 1)
                .style('stroke-width', 1)
                .attr('d', monthPath);
        }

        //draws data on calendarmap
        function drawData() {
            //filter day rectangles
            dayRects
                .filter(function (d) { return ('$' + d.toString()) in nestedData; })
                .attr('class', 'eve-calendarmap-days eve-calendarmap-data')
                .on('mousemove', function (d) {
                    //get current data value
                    currentData = nestedData['$' + d.toString()][0];

                    //hover bar
                    d3.select(this).style('fill-opacity', currentSerie.sliceHoverAlpha);

                    //show tooltip
                    diagram.showTooltip(diagram.getContent(currentData, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d) {
                    //hover bar
                    d3.select(this).style('fill-opacity', currentSerie.alpha);

                    //hide tooltip
                    diagram.hideTooltip();
                })
                .attr('fill-opacity', diagram.animation.effect === 'add' ? 0 : currentSerie.alpha)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * (diagram.animation.delay / 4); })
                .attr('fill-opacity', currentSerie.alpha)
                .style('fill', function (d) {
                    //get current data value
                    currentData = nestedData['$' + d.toString()][0];
                    currentMeasureValue = currentData[currentSerie.measureField] ? +currentData[currentSerie.measureField] : 0;

                    //return color of the current data
                    return scaleColor(currentMeasureValue);
                });

            //filter labels
            dataLabels
                .filter(function (d) { return ('$' + d.toString()) in nestedData; })
                .text(function (d) {
                    //get current data value
                    currentData = nestedData['$' + d.toString()][0];

                    //get formatted label
                    return diagram.getContent(currentData, currentSerie, currentSerie.labelFormat);
                })
                .style('font-size', function (d) {
                    //get current data value
                    currentData = nestedData['$' + d.toString()][0];
                    currentMeasureValue = currentData[currentSerie.measureField] ? +currentData[currentSerie.measureField] : 0;
                    currentRadius = rScale(currentMeasureValue);

                    //return font size
                    if (currentSerie.labelFontSize === 'auto')
                        d.fontSize = Math.min(2 * currentRadius, (2 * currentRadius - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * minFontSize);
                    else
                        d.fontSize = currentSerie.labelFontSize;

                    if (d.fontSize < minFontSize)
                        d3.select(this).text('');

                    if (d.fontSize < minFontSize)
                        d.fontSize = minFontSize;

                    return d.fontSize + 'px';
                })
                .style('fill', function (d) {
                    //get current data value
                    currentData = nestedData['$' + d.toString()][0];
                    currentMeasureValue = currentData[currentSerie.measureField] ? +currentData[currentSerie.measureField] : 0;

                    //return generated color
                    return currentSerie.labelFontColor === 'auto' ? diagram.getAutoColor(scaleColor(currentMeasureValue)) : currentSerie.labelFontColor;
                })
                .attr('fill-opacity', function (d) {
                    //get bbox
                    bbox = this.getBBox();

                    let labelVisibility = currentSerie.labelFontSize === "auto" ? "fitting" : "always";

                    //cehck label visivblity
                    if (labelVisibility === 'always') {
                        return 1;
                    } else {
                        return bbox.width > cellWidth ? 0 : 1;
                    }

                })
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * (diagram.animation.delay / 4); })
                .attr('opacity', 1)
                .attr('transform', function (d, i, k) {
                    //get bbox
                    bbox = this.getBBox();
                    rectX = (week(d) * cellWidth) + leftOffset;
                    rectY = (day(d) * cellHeight) + topOffset;
                    xPos = rectX + cellWidth / 2;
                    yPos = rectY + cellHeight / 2 + bbox.height / 2 - 2;

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                })
                .text(function (d) {
                    //get current data value
                    currentData = nestedData['$' + d.toString()][0];

                    //get formatted label
                    return diagram.getContent(currentData, currentSerie, currentSerie.labelFormat);
                });
        }

        //calculate environment variables and draw diagram environment
        calculateScales();
        drawEnvironment();
        drawData();

        //trigger animation
        animateCalendarmap();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;
            dataset = data;

            //update legend
            diagram.calculateDomain();
            diagram.updateLegend();

            //re-calculate scales
            calculateScales();

            //update svg data
            yearsG.remove();
            d3.selectAll('.eve-calendarmap-month-g').remove();

            //remove fill for rects 
            drawEnvironment();
            drawData();

            //trigger animation
            animateCalendarmap();
        };

        //return abacus diagram
        return diagram;
    }

    //attach timeline method into the eve
    e.calendarmap = function (options) {
        options.masterType = "standard";
        options.type = "calendarMap";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new calendarmap(options);
    };

    //attach timeline method into the eve
    e.calendarMap = function (options) {
        options.masterType = "standard";
        options.type = "calendarMap";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new calendarmap(options);
    };
})(eve);