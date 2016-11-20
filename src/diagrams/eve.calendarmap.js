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
    //define calendarmap diagram class
    function calendarmap(options) {
        //declare needed variables
        var diagram = eve.base.init(options),
            currentSerie = diagram.series[0],
            years = [],
            minDate = d3.min(diagram.data, function (d) { return new Date(d[currentSerie.dateField]); }),
            maxDate = d3.max(diagram.data, function (d) { return new Date(d[currentSerie.dateField]); }),
            minMeasure = d3.min(diagram.data, function (d) { return +d[currentSerie.measureField]; }),
            maxMeasure = d3.max(diagram.data, function (d) { return +d[currentSerie.measureField]; }),
            topOffset = 5,
            leftOffset = diagram.xAxis.labelFontSize + diagram.xAxis.titleFontSize,
            weeksCount = 53,
            daysCount = 7,
            monthsCount = 12,
            marginTotalWidth = diagram.plot.left + diagram.plot.right + diagram.margin.left + diagram.margin.right,
            marginTotalHeight = diagram.plot.top + diagram.plot.bottom + diagram.margin.bottom + diagram.margin.top,
            height = 0, width = 0,
            xPos = 0, yPos = 0,
            bbox = null,
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
            scaleColor = null,
            rangeIterator = 0,
            cellWidth = 0, cellHeight = 0;

        //calculates scales and environmental variables
        function calculateScales() {
            //clear years
            years = [];

            //iterate from min year to max year
            for (var i = minDate.getFullYear() ; i <= maxDate.getFullYear() ; i++) {
                //push current year
                years.push(i);
            }

            //set dimensions
            width = (diagram.plot.width - marginTotalWidth);
            height = (diagram.plot.height - marginTotalHeight) / years.length;
            cellWidth = ((width - leftOffset) / weeksCount) - 1,
            cellHeight = (height / daysCount) - topOffset;
            xPos = (((width - leftOffset) - (cellWidth * weeksCount)) / 2);
            yPos = (height - (cellHeight * daysCount)) - topOffset;
            rangeIterator = (minMeasure + maxMeasure) / diagram.legend.gradientColors.length;

            //create nested data
            nestedData = d3.nest()
                .key(function (d) {
                    //get current values
                    currentDateValue = new Date(d[currentSerie.dateField]);
                    currentYear = currentDateValue.getFullYear();
                    currentMonth = currentDateValue.getMonth();
                    currentDay = currentDateValue.getDate();

                    //return calculated date data
                    return new Date(currentYear, currentMonth, currentDay, 0, 0, 0);
                })
                .map(diagram.data);

            //create color scale
            scaleColor = d3.scaleLinear().range(diagram.legend.gradientColors).domain([minMeasure, maxMeasure]);
        }

        //creates month seperation paths
        function monthPath(dateVal) {
            //declare needed variables
            var dateValNext = new Date(dateVal.getFullYear(), dateVal.getMonth() + 1, 0),
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
                yPos = (i * height) + topOffset + diagram.xAxis.titleFontSize;

                //return calculated translation
                return 'translate(' + xPos + ',' + yPos + ')';
            });

            //animate years label
            yearLabels
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
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
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('y', function (d, i) {
                    return (i * cellHeight) + (cellHeight / 2) + (this.getBBox().height / 2) + (topOffset / 2);
                });

            //animate months names
            monthLabels
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('x', function (d, i) { return (((weeksCount * cellWidth) / monthsCount) * (i + 1)) - (cellWidth * daysCount / 4) + daysCount; })
                .attr('y', 0);

            //animate month seperations
            monthSeperators
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('d', monthPath);
        }

        //draws months, days and labels
        function drawEnvironment() {
            //create g for each year
            yearsG = diagram.svg.selectAll('.eve-calendarmap-g')
                .data(years)
                .enter().append('g')
                .attr('class', 'eve-calendarmap-g')
                .attr('transform', function (d, i) {
                    //calculate y position of the svg
                    yPos = (i * height) + topOffset + diagram.xAxis.titleFontSize;

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
                .data(function (d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                .enter().append('rect')
                .attr('class', 'eve-calendarmap-days')
                .style('fill', '#ffffff')
                .style('fill-opacity', 1)
                .style('stroke', '#efefef')
                .style('stroke-opacity', 1)
                .attr('width', cellWidth)
                .attr('height', cellHeight)
                .attr('x', function (d) { return (week(d) * cellWidth) + leftOffset; })
                .attr('y', function (d) { return (day(d) * cellHeight) + topOffset; });

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

            //draw month names
            monthLabels = yearsG.selectAll('.eve-calendarmap-monthnames')
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

            //draw month seperations
            monthSeperators = yearsG.selectAll('.eve-calendarmap-month')
                .data(function (d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                .enter().append('path')
                .attr('class', 'eve-calendarmap-month')
                .style('fill', 'none')
                .style('fill-opacity', 0)
                .style('stroke', '#d7d7d7')
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
                .style('fill-opacity', currentSerie.alpha)
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .style('fill', function(d) {
                    //get current data value
                    currentData = nestedData['$' + d.toString()][0];
                    currentMeasureValue = currentData[currentSerie.measureField] ? +currentData[currentSerie.measureField] : 0;

                    //return color of the current data
                    return scaleColor(currentMeasureValue);
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

            //update legend
            diagram.updateLegend();

            //re-calculate scales
            calculateScales();

            //update svg data
            yearsG.data(years).exit().remove();
            yearLabels.data(years).exit().remove();
            dayRects.data(function (d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); }).exit().remove();
            monthSeperators.data(function (d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); }).exit().remove();
            
            //remove fill for rects 
            dayRects.style('fill', '#ffffff');
            drawData();

            //trigger animation
            animateCalendarmap();
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
    e.calendarmap = function (options) {
        options.type = 'standard';
        return new calendarmap(options);
    };
})(eve);