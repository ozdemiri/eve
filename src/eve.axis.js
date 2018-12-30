/*!
 * eve.axis.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for chart axes.
 */
(function (e) {
    /**
     * Stack Types:
     * default, full
     */

    //define classical axis class
    function chartClassicalAxis(options) {
        //handle chart object error
        if (options == null)
            throw Error('Invalid chart data!');

        //set axis members
        this.xScale = null;
        this.yScale = null;
        this.xAxis = null;
        this.yAxis = null;

        //declare needed variables
        let that = this;
        let chart = arguments[0];
        let isReversed = (options.type === 'barChart' || options.type === 'abacus');
        let xAxisOptions = isReversed ? chart.yAxis : chart.xAxis;
        let yAxisOptions = isReversed ? chart.xAxis : chart.yAxis;
        let xAxisGrid = null;
        let yAxisGrid = null;
        let xAxis = null;
        let yAxis = null;
        let tempXAxisSVGOffset = null;
        let tempYAxisSVGOffset = null;
        let tickSize = 6;
        let xPos = 0;
        let yPos = 0;
        let bbox = null;
        let axisG = null;

        //draws axis titles
        let drawAxisTitles = function () {
            //declare needed variables
            let xAxisTitleSVG = null;
            let yAxisTitleSVG = null;

            //event handler for x axis title click
            let xAxisTitleClickHandler = function () {
                //raise the event
                if (chart.onAxisTitleClick)
                    chart.onAxisTitleClick('xAxisTitle', xAxisOptions.title);

                //prevent parent click
                d3.event.stopPropagation();
            };

            //event handler for y axis title click
            let yAxisTitleClickHandler = function () {
                //raise the event
                if (chart.onAxisTitleClick)
                    chart.onAxisTitleClick('yAxisTitle', yAxisOptions.title);

                //prevent parent click
                d3.event.stopPropagation();
            };

            //calculates y position for x axis
            let calculateXAxisTitlePos = function () {
                //get bbox
                bbox = this.getBBox();

                //check position
                if (xAxisOptions.position === 'top') {
                    //calculate y position
                    yPos = chart.plot.top + bbox.height / 2;
                } else {
                    //set y pos as height
                    yPos = chart.plot.height - bbox.height / 2;
                }

                //return y position of the title
                return yPos;
            };

            //calculates x position for y axis
            let calculateYAxisTitlePos = function () {
                //get bbox
                bbox = this.getBBox();

                //check position
                if (yAxisOptions.position === "left") {
                    yPos = yAxisOptions.titleFontSize + 5;
                } else {
                    yPos = chart.plot.width - yAxisOptions.titleFontSize - 5;
                }

                return yPos
            };

            //check whether the x axis title is not empty
            if (xAxisOptions.title) {
                //create the svg
                xAxisTitleSVG = chart.svg.append('g').append('text')
                    .text(xAxisOptions.title)
                    .style('fill', xAxisOptions.titleFontColor)
                    .style('font-family', xAxisOptions.titleFontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-size', xAxisOptions.titleFontSize + 'px')
                    .style('font-style', xAxisOptions.titleFontStyle === 'bold' ? 'normal' : xAxisOptions.titleFontStyle)
                    .style('font-weight', xAxisOptions.titleFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'middle')
                    .on('click', xAxisTitleClickHandler)
                    .attr('x', chart.plot.width / 2)
                    .attr('y', calculateXAxisTitlePos);

                //get bounding box for x axis title
                bbox = xAxisTitleSVG.node().getBBox();

                //increase plot bottom margin
                if (xAxisOptions.position === 'top')
                    chart.plot.top += bbox.height;
                else
                    chart.plot.bottom += bbox.height;
            }

            //check whether the x axis title is not empty
            if (yAxisOptions.title) {
                //create the svg
                yAxisTitleSVG = chart.svg.append('g').append('text')
                    .text(yAxisOptions.title)
                    .style('fill', yAxisOptions.titleFontColor)
                    .style('font-family', yAxisOptions.titleFontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-size', yAxisOptions.titleFontSize + 'px')
                    .style('font-style', yAxisOptions.titleFontStyle === 'bold' ? 'normal' : yAxisOptions.titleFontStyle)
                    .style('font-weight', yAxisOptions.titleFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'middle')
                    .on('click', yAxisTitleClickHandler)
                    .attr('transform', 'rotate(-90)')
                    .attr('x', ((chart.plot.height / 2) * -1))
                    .attr('y', calculateYAxisTitlePos);

                //get bounding box for x axis title
                bbox = yAxisTitleSVG.node().getBBox();

                //increase plot left margin
                if (yAxisOptions.position === 'right')
                    chart.plot.right += bbox.height + 5;
                else
                    chart.plot.left += bbox.height + 5;
            }
        };

        //updates plot area
        let updatePlot = function () {
            //declare needed variables
            let tempTextSVG = null;
            let labelFormat = isReversed ? yAxisOptions.labelFormat : xAxisOptions.labelFormat;
            let valueLength = 0;
            let maxLongXValue = 0;
            let maxLongYValue = 0;
            let margin = 5;
            let tempXValue = "";
            let tempYValue = "";

            //check whether the chart created by multiples
            if (chart.fromMultiples || chart.animation.enabled) {
                switch (chart.type) {
                    case "networkMatrix":
                        {
                            if (chart.yAxis.values && chart.yAxis.values.length)
                                chart.domains.yValues = chart.yAxis.values;

                            if (chart.xAxis.values && chart.xAxis.values.length) {
                                chart.domains.xValues = chart.xAxis.values;
                                if (chart.xDataType === "number" || chart.xDataType === "date") {
                                    chart.domains.minX = d3.min(chart.domains.xValues);
                                    chart.domains.maxX = d3.max(chart.domains.xValues);
                                }
                            }
                        }
                        break;
                }
            }

            //switch x axis data type
            switch (chart.xDataType) {
                case 'number':
                case 'numeric':
                    {
                        //get label format
                        if (labelFormat)
                            maxLongXValue = e.formatNumber(chart.domains.maxX, labelFormat);
                        else
                            maxLongXValue = chart.domains.maxX != null ? chart.domains.maxX.toFixed(1) : "";
                    }
                    break;
                case 'date':
                    {
                        //get label format
                        if (labelFormat)
                            maxLongXValue = e.formatDate(chart.domains.maxX, labelFormat);
                        else
                            maxLongXValue = e.formatDate(chart.domains.maxX, '');
                    }
                    break;
                default:
                    {
                        //iterate all x values
                        let allXValues = (chart.allXValues && chart.allXValues.length > 0) ? chart.allXValues : chart.domains.xValues;
                        valueLength = 0;
                        for (let i = 0; i < allXValues.length; i++) {
                            let val = allXValues[i];
                            if (val && val.toString().length > valueLength) {
                                valueLength = val.length;
                                maxLongXValue = val;
                            }
                        }
                    }
                    break;
            }

            //check whether the y domains is string
            if (chart.domains.yValues && chart.domains.yValues.length && chart.domains.yValues.length > 0) {
                //iterate all x values
                valueLength = 0;
                for (let i = 0; i < chart.domains.yValues.length; i++) {
                    let val = chart.domains.yValues[i];
                    if (val && val.toString().length > valueLength) {
                        valueLength = val.toString().length;
                        maxLongYValue = val;
                    }
                }
            } else {
                //get label format
                labelFormat = isReversed ? xAxisOptions.labelFormat : yAxisOptions.labelFormat;

                //get label format
                if (labelFormat)
                    maxLongYValue = e.formatNumber(chart.domains.maxY, labelFormat);
                else
                    maxLongYValue = chart.domains.maxY != null ? chart.domains.maxY.toFixed(1) : "";
            }

            //set x and y value
            if (isReversed) {
                tempXValue = maxLongYValue;
                tempYValue = maxLongXValue;
            } else {
                tempYValue = maxLongYValue;
                tempXValue = maxLongXValue;
            }

            //set temporary text value for x axis
            tempTextSVG = chart.svg.append('text')
                .style('font-size', xAxisOptions.labelFontSize + 'px')
                .style('color', xAxisOptions.labelFontColor)
                .style('font-family', xAxisOptions.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', xAxisOptions.labelFontStyle == 'bold' ? 'normal' : xAxisOptions.labelFontStyle)
                .style('font-weight', xAxisOptions.labelFontStyle == 'bold' ? 'bold' : 'normal')
                .attr('transform', 'rotate(' + xAxisOptions.labelAngle + ')')
                .text(tempXValue);

            //get offset for x axis value
            tempXAxisSVGOffset = tempTextSVG.node().getBoundingClientRect();

            //remove svg text for x axis
            tempTextSVG.remove();

            //set temporary text value for x axis
            tempTextSVG = chart.svg.append('text')
                .style('font-size', yAxisOptions.labelFontSize + 'px')
                .style('color', yAxisOptions.labelFontColor)
                .style('font-family', yAxisOptions.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', yAxisOptions.labelFontStyle == 'bold' ? 'normal' : yAxisOptions.labelFontStyle)
                .style('font-weight', yAxisOptions.labelFontStyle == 'bold' ? 'bold' : 'normal')
                .attr('transform', 'rotate(' + yAxisOptions.labelAngle + ')')
                .text(tempYValue);

            //get offset for x axis value
            tempYAxisSVGOffset = tempTextSVG.node().getBoundingClientRect();

            //remove svg text for x axis
            tempTextSVG.remove();

            //increase plot margins
            chart.plot.top += margin;
            chart.plot.bottom += margin;
            chart.plot.left += margin;
            chart.plot.right += margin;

            //check y axis position to set plot left and right margins
            if (yAxisOptions.position === 'right') {
                chart.plot.right += yAxisOptions.enabled ? tempYAxisSVGOffset.width + tickSize : tickSize;
                chart.plot.left += yAxisOptions.enabled ? (tempYAxisSVGOffset.width / 2) : 0;
            } else {
                chart.plot.left += yAxisOptions.enabled ? tempYAxisSVGOffset.width + tickSize : tickSize;
                chart.plot.right += yAxisOptions.enabled ? (tempYAxisSVGOffset.width / 2) : 0;
            }

            //check x axis position to set plot top and bottom margin
            if (xAxisOptions.position === 'top')
                chart.plot.top += xAxisOptions.enabled ? tempXAxisSVGOffset.height + tickSize : 0;
            else
                chart.plot.bottom += xAxisOptions.enabled ? tempXAxisSVGOffset.height + tickSize : 0;

            //set chart plot width and height
            chart.plot.width = Math.abs(chart.plot.width - chart.plot.left - chart.plot.right);
            chart.plot.height = Math.abs(chart.plot.height - chart.plot.top - chart.plot.bottom);
        };

        //checks whether the chart has an order
        let isSlicedXY = function () {
            let isIt = false;
            if (chart.type === "barChart" || chart.type === "columnChart") {
                isIt = true;
            }
            return isIt;
        }

        //updates scales
        let updateScales = function () {
            //declare needed variables
            let xScale = null;
            let yScale = null;
            
            //if chart is reversed then scales should be vice versa
            if (isReversed) {
                //switch x axis data type to set ranges
                switch (chart.xDataType) {
                    case 'number':
                    case 'numeric':
                        {
                            //create linear scale
                            yScale = d3.scaleLinear().domain([chart.domains.minX, chart.domains.maxX]);

                            //check order field name
                            if (chart.xAxis.orderFieldName) {
                                if (chart.xAxis.orderDirection === "desc" && chart.xAxis.orderFieldName === chart.xField)
                                    yScale = d3.scaleLinear().domain([chart.domains.maxX, chart.domains.minX]);
                            }

                            //update scale range by chart type
                            if (chart.type === "barChart") {
                                yScale.range([chart.plot.height / chart.data.length / 2, chart.plot.height - chart.plot.height / chart.data.length / 2]);
                            } else {
                                yScale.range([0, chart.plot.height]);
                            }
                        }
                        break;
                    case 'date':
                        {
                            //create date based scale
                            yScale = d3.scaleTime().range([0, chart.plot.height]).domain([chart.domains.minX, chart.domains.maxX]);

                            //check order field name
                            if (chart.xAxis.orderFieldName) {
                                if (chart.xAxis.orderDirection === "desc" && chart.xAxis.orderFieldName === chart.xField)
                                    yScale = d3.scaleTime().range([0, chart.plot.height]).domain([chart.domains.maxX, chart.domains.minX]);
                            }
                        }
                        break;
                    default:
                        {
                            //check chart type
                            if (!isSlicedXY()) {
                                chart.domains.xValues.sort(d3.ascending);
                            }

                            //create string scale
                            yScale = d3.scaleBand().range([0, chart.plot.height]).padding(0.1).round(true).domain(chart.domains.xValues);
                        }
                        break;
                }

                //set y scale
                xScale = d3.scaleLinear().range([0, chart.plot.width]).domain([chart.domains.minY, chart.domains.maxY]);
            } else {
                //switch x axis data type to set ranges
                switch (chart.xDataType) {
                    case 'number':
                    case 'numeric':
                        {
                            //check whether the chart created by multiples
                            if (chart.fromMultiples || chart.animation.enabled) {
                                switch (chart.type) {
                                    case "networkMatrix":
                                        {
                                            if (chart.xAxis.values && chart.xAxis.values.length) {
                                                chart.domains.xValues = chart.xAxis.values;
                                                chart.domains.minX = d3.min(chart.domains.xValues);
                                                chart.domains.maxX = d3.max(chart.domains.xValues);
                                            }
                                        }
                                        break;
                                }
                            }

                            //create linear scale
                            xScale = d3.scaleLinear().domain([chart.domains.minX, chart.domains.maxX]);

                            //check order field name
                            if (chart.xAxis.orderFieldName) {
                                if (chart.xAxis.orderDirection === "desc" && chart.xAxis.orderFieldName === chart.xField)
                                    xScale = d3.scaleLinear().domain([chart.domains.maxX, chart.domains.minX]);
                            }

                            //update scale range by chart type
                            if (chart.type === "columnChart") {
                                xScale.range([chart.plot.width / chart.data.length / 2, chart.plot.width - chart.plot.width / chart.data.length / 2]);
                            } else {
                                xScale.range([0, chart.plot.width]);
                            }
                        }
                        break;
                    case 'date':
                        {
                            //check whether the chart created by multiples
                            if (chart.fromMultiples || chart.animation.enabled) {
                                switch (chart.type) {
                                    case "networkMatrix":
                                        {
                                            if (chart.xAxis.values && chart.xAxis.values.length) {
                                                chart.domains.xValues = chart.xAxis.values;
                                                chart.domains.minX = d3.min(chart.domains.xValues);
                                                chart.domains.maxX = d3.max(chart.domains.xValues);
                                            }
                                        }
                                        break;
                                }
                            }

                            //create date based scale
                            xScale = d3.scaleTime().range([0, chart.plot.width]).domain([chart.domains.minX, chart.domains.maxX]);

                            //check order field name
                            if (chart.xAxis.orderFieldName) {
                                if (chart.xAxis.orderDirection === "desc" && chart.xAxis.orderFieldName === chart.xField)
                                    xScale = d3.scaleTime().range([0, chart.plot.width]).domain([chart.domains.maxX, chart.domains.minX]);
                            }
                        }
                        break;
                    default:
                        {
                            //check chart type
                            if (!isSlicedXY()) {
                                chart.domains.xValues.sort(d3.ascending);
                            }

                            //create string scale
                            xScale = d3.scaleBand().range([0, chart.plot.width]).padding(0.1).round(true).domain(chart.domains.xValues);
                        }
                        break;
                }

                //create linear scale for y axis
                if (chart.frozenYAxis && chart.frozenYAxis === 'string') {
                    //sort content
                    chart.domains.yValues.sort(d3.ascending);

                    //set y values
                    if (chart.yAxis.yValues && chart.yAxis.yValues.length && chart.yAxis.yValues.length > 0)
                        chart.domains.yValues = chart.yAxis.yValues;

                    //check whether the chart created by multiples
                    if (chart.fromMultiples || chart.animation.enabled) {
                        switch (chart.type) {
                            case "networkMatrix":
                                {
                                    if (chart.yAxis.values && chart.yAxis.values.length)
                                        chart.domains.yValues = chart.yAxis.values;
                                }
                                break;
                        }
                    }

                    //set y scale
                    yScale = d3.scaleBand().range([0, chart.plot.height]).padding(0.1).round(true).domain(chart.domains.yValues);
                } else {
                    //set y scale
                    yScale = d3.scaleLinear().range([chart.plot.height, 0]).domain([chart.domains.minY, chart.domains.maxY]);
                }
            }

            //set chart scales
            that.xScale = xScale;
            that.yScale = yScale;
        };

        //gets x axis tick count
        let getXAxisTickCount = function () {
            //set tick count to 10
            let tickCount = 10,
                dimensionHelper = isReversed ? chart.plot.height : chart.plot.width;

            //check whether the axis tick count is auto
            if (xAxisOptions.tickCount === 'auto') {
                //set tick count
                tickCount = Math.ceil(dimensionHelper / (isReversed ? tempYAxisSVGOffset.width : tempXAxisSVGOffset.width)) - 1;

                //check if we have more than 10 ticks
                if (tickCount > 10)
                    tickCount = (Math.round(tickCount / 10) * 10);

                //if its a date we can consider to set half of the ticks
                if (chart.xDataType === "date" && tickCount >= 5)
                    tickCount /= 2;
            } else {
                //set manuel tick count
                tickCount = parseInt(xAxisOptions.tickCount);
            }

            if (tickCount <= 1)
                tickCount = 2;

            //set tick count
            if (xAxisOptions.tickCount === "auto") {
                if (tickCount > 10)
                    tickCount = 10;
            }

            //return updated tick count
            return tickCount;
        };

        //gets x axis tick count
        let getYAxisTickCount = function () {
            //set tick count to 10
            let tickCount = 10,
                dimensionHelper = isReversed ? chart.plot.width : chart.plot.height;

            //check whether the axis tick count is auto
            if (yAxisOptions.tickCount === 'auto') {
                //set tick count
                tickCount = Math.ceil(dimensionHelper / (isReversed ? tempXAxisSVGOffset.height : tempYAxisSVGOffset.height)) - 1;

                //check if we have more than 10 ticks
                if (tickCount > 10)
                    tickCount = (Math.round(tickCount / 10) * 10) / 2;
            } else {
                //set manuel tick count
                tickCount = parseInt(yAxisOptions.tickCount);
            }

            if (tickCount <= 1)
                tickCount = 2;

            //set tick count
            if (yAxisOptions.tickCount === "auto") {
                if (tickCount > 10)
                    tickCount = 10;
            }

            //return updated tick count
            return tickCount;
        };

        //creates x axis
        let createXAxis = function () {
            //declare needed variables
            let xAxisFunction = null;
            let tickCount = getXAxisTickCount();

            //set position for the axis function
            if (xAxisOptions.position === 'top') {
                xAxisFunction = d3.axisTop(that.xScale);
            } else {
                xAxisFunction = d3.axisBottom(that.xScale);
            }

            //when x axis is string then we need to show all values
            if (!isReversed && chart.xDataType === "string") {
                return xAxisFunction.tickValues(chart.domains.xValues);
            }

            //check if the vis has x axis
            try {
                if (!isReversed && chart.xField && chart.dataProperties) {
                    //get unique values for the x field
                    let uniqueValues = chart.dataProperties.columns[chart.xField].uniques;

                    //need to check if the unique values count
                    if (uniqueValues.length < tickCount)
                        tickCount = uniqueValues.length;
                }
            } catch (eX) {
                tickCount = 10;
            }

            //update tick count
            tickCount = e.calculateTicks(tickCount);

            //check screen width
            if (chart.width < 360)
                tickCount = 3;

            //when x axis is not string then we can get the auto count
            return xAxisFunction.ticks(tickCount);
        };

        //creates y axis
        let createYAxis = function () {
            //declare needed variables
            let yAxisFunction = null;
            let tickCount = getYAxisTickCount();

            //set position for the axis function
            if (yAxisOptions.position === 'right') {
                yAxisFunction = d3.axisRight(that.yScale);
            } else {
                yAxisFunction = d3.axisLeft(that.yScale);
            }

            //when x axis is string then we need to show all values
            if (isReversed && chart.xDataType === "string")
                return yAxisFunction.tickValues(chart.domains.xValues);

            //check if the vis has x axis
            if (isReversed && chart.xField && chart.dataProperties) {
                //get unique values for the x field
                let uniqueValues = chart.dataProperties.columns[chart.xField].uniques;

                //need to check if the unique values count
                if (uniqueValues.length < tickCount)
                    tickCount = uniqueValues.length;
            }

            //update tick count
            tickCount = e.calculateTicks(tickCount);

            //check screen width
            if (chart.height < 360)
                tickCount = 3;

            //when x axis is not string then we can get the auto count
            return yAxisFunction.ticks(tickCount);
        };

        //creates or updates the grid style
        let updateGrid = function (isUpdate) {
            if (isUpdate) {
                //init x axis grid
                xAxisGrid
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .attr('transform', 'translate(0,' + (xAxisOptions.position === 'top' ? 0 : chart.plot.height) + ')')
                    .call(createXAxis().tickSize(-chart.plot.height, 0, 0).tickFormat(''));

                //init y axis grid
                yAxisGrid
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .attr('transform', 'translate(' + (yAxisOptions.position === 'right' ? (chart.plot.width) : 0) + ')')
                    .call(createYAxis().tickSize(-chart.plot.width, 0, 0).tickFormat(''));
            } else {
                //init x axis grid
                xAxisGrid
                    .attr('transform', 'translate(0,' + (xAxisOptions.position === 'top' ? 0 : chart.plot.height) + ')')
                    .call(createXAxis().tickSize(-chart.plot.height, 0, 0).tickFormat(''));

                //init y axis grid
                yAxisGrid
                    .attr('transform', 'translate(' + (yAxisOptions.position === 'right' ? (chart.plot.width) : 0) + ')')
                    .call(createYAxis().tickSize(-chart.plot.width, 0, 0).tickFormat(''));
            }

            //set x axis grid domain style
            xAxisGrid.selectAll('.domain')
                .style('stroke', 'none')
                .style('stroke-width', '0px');

            //set x axis grid line style
            xAxisGrid.selectAll('line')
                .style('stroke-opacity', xAxisOptions.gridLineAlpha)
                .style('stroke-width', xAxisOptions.gridLineThickness + 'px')
                .style('stroke', xAxisOptions.gridLineColor);

            //set y axis grid domain style
            yAxisGrid.selectAll('.domain')
                .style('stroke', 'none')
                .style('stroke-width', '0px');

            //set y axis grid line style
            yAxisGrid.selectAll('line')
                .style('stroke-opacity', yAxisOptions.gridLineAlpha)
                .style('stroke-width', yAxisOptions.gridLineThickness + 'px')
                .style('stroke', yAxisOptions.gridLineColor);
        };

        //updates axis styles
        let updateAxisStyle = function () {
            //gets x axis anchor
            let getXAxisTextAnchor = function (d, i) {
                //check if y axis positioned to right
                if (yAxisOptions.position === 'right' && i === 0)
                    return 'start';

                //check label angle
                if (xAxisOptions.labelAngle > 0)
                    return 'start';
                else if (xAxisOptions.labelAngle < 0)
                    return 'end';
                else
                    return 'middle';
            };

            //handles x axis click
            let xAxisClickHandler = function (d, i) {
                //raise click event
                if (chart.onAxisLabelClick)
                    chart.onAxisLabelClick('xAxis', d);

                //prevent parent bubbling
                d3.event.stopPropagation();
            };

            //handles y axis click
            let yAxisClickHandler = function (d, i) {
                //raise click event
                if (chart.onAxisLabelClick)
                    chart.onAxisLabelClick('yAxis', d);

                //prevent parent bubbling
                d3.event.stopPropagation();
            };

            //formats x axis text
            let getFormattedXAxis = function (d, i) {
                let valueType = e.getType(d);
                if (d === 0) return d;
                if (valueType === "array" && d.length > 0) return d[0];

                if (valueType === 'number')
                    return d ? e.formatNumber(d, xAxisOptions.labelFormat) : '';
                else if (valueType === 'date')
                    return d ? e.formatDate(d, xAxisOptions.labelFormat) : '';
                else
                    return d ? d.replaceAll('&lt;', '<').replaceAll('&gt;', '>') : '';
            };

            //formats x axis text
            let getFormattedYAxis = function (d, i) {
                let valueType = e.getType(d);
                if (d === 0) return d;

                if (valueType === 'number')
                    return d ? e.formatNumber(d, yAxisOptions.labelFormat) : '';
                else if (valueType === 'date')
                    return d ? e.formatDate(d, yAxisOptions.labelFormat) : '';
                else
                    return d ? d.replaceAll('&lt;', '<').replaceAll('&gt;', '>') : '';
            };

            //check whether the x axis is enabled
            if (xAxisOptions.enabled) {
                //select x axis path and change stroke
                xAxis.selectAll('path')
                    .style('stroke-opacity', xAxisOptions.alpha)
                    .style('stroke-width', xAxisOptions.thickness + 'px')
                    .style('stroke', xAxisOptions.color);

                //select all lines in xaxis
                xAxis.selectAll('line')
                    .style('fill', 'none')
                    .style('stroke-width', xAxisOptions.thickness + 'px')
                    .style('shape-rendering', 'crispEdges')
                    .style('stroke-opacity', xAxisOptions.alpha)
                    .style('stroke', xAxisOptions.color);

                //select all texts in xaxis
                xAxis.selectAll('text')
                    .style('fill', xAxisOptions.labelFontColor)
                    .style('font-size', xAxisOptions.labelFontSize + 'px')
                    .style('font-family', xAxisOptions.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-style', xAxisOptions.labelFontStyle === 'bold' ? 'normal' : xAxisOptions.labelFontStyle)
                    .style('font-weight', xAxisOptions.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', "middle")
                    .attr('transform', function (d) {
                        bbox = this.getBBox();
                        if (isReversed) {
                            if (xAxisOptions.labelAngle === 45) {
                                return 'rotate(' + xAxisOptions.labelAngle + ')translate(' + (bbox.height * 2) + ')';
                            } else if (xAxisOptions.labelAngle === -45) {
                                return 'rotate(' + xAxisOptions.labelAngle + ')translate(-' + (bbox.height * 2) + ')';
                            } else if (xAxisOptions.labelAngle === 90) {
                                return 'rotate(' + xAxisOptions.labelAngle + ')translate(' + ((bbox.height * 2) + tickSize) + ', -' + bbox.height + ')';
                            }
                        } else {
                            if (xAxisOptions.labelAngle === 45) {
                                return 'rotate(' + xAxisOptions.labelAngle + ')translate(' + (bbox.width / 2) + ')';
                            } else if (xAxisOptions.labelAngle === -45) {
                                return 'rotate(' + xAxisOptions.labelAngle + ')translate(-' + (bbox.width / 2) + ')';
                            } else if (xAxisOptions.labelAngle === 90) {
                                return 'rotate(' + xAxisOptions.labelAngle + ')translate(' + ((bbox.width / 2) + tickSize) + ', -' + bbox.height + ')';
                            }

                            return 'rotate(' + xAxisOptions.labelAngle + ')';
                        }
                    })
                    .on('click', xAxisClickHandler)
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .text(getFormattedXAxis);
            }

            //check whether the y axis is enabled
            if (yAxisOptions.enabled) {
                //select x axis path and change stroke
                yAxis.selectAll('path')
                    .style('stroke-opacity', yAxisOptions.alpha)
                    .style('stroke-width', yAxisOptions.thickness + 'px')
                    .style('stroke', yAxisOptions.color);

                //select all lines in yaxis
                yAxis.selectAll('line')
                    .style('fill', 'none')
                    .style('stroke-width', yAxisOptions.thickness + 'px')
                    .style('shape-rendering', 'crispEdges')
                    .style('stroke-opacity', yAxisOptions.alpha)
                    .style('stroke', yAxisOptions.color);

                //select all texts in yaxis
                yAxis.selectAll('text')
                    .style('fill', yAxisOptions.labelFontColor)
                    .style('font-size', yAxisOptions.labelFontSize + 'px')
                    .style('font-family', yAxisOptions.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-style', yAxisOptions.labelFontStyle === 'bold' ? 'normal' : yAxisOptions.labelFontStyle)
                    .style('font-weight', yAxisOptions.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', function (d) {
                        //check whether the chart is reversed
                        if (isReversed) {
                            if (yAxisOptions.labelAngle === 90)
                                return "start";
                            else
                                return "end";
                        } else {
                            if (yAxisOptions.position === "right")
                                return "start";

                            return "end";
                        }
                    })
                    .attr('transform', function (d) {
                        bbox = this.getBBox();
                        
                        if (isReversed) {
                            if (yAxisOptions.labelAngle === 90) {
                                return 'rotate(' + yAxisOptions.labelAngle + ')translate(0,' + (bbox.width / 2) + ')';
                            } else {
                                if (yAxisOptions.position === "right")
                                    return 'rotate(' + yAxisOptions.labelAngle + ')translate(' + bbox.width + ')';
                                else
                                    return 'rotate(' + yAxisOptions.labelAngle + ')';
                            }
                        } else {
                            if (yAxisOptions.labelAngle === 90) {
                                return 'rotate(' + yAxisOptions.labelAngle + ')translate(' + (bbox.width / 2) + ',' + bbox.height + ')';
                            } else {
                                return 'rotate(' + yAxisOptions.labelAngle + ')';
                            }
                        }
                    })
                    .on('click', yAxisClickHandler)
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .text(getFormattedYAxis);
            }
        };

        //draws axes
        let drawAxes = function () {
            //declare needed variables
            axisG = null;

            //update plot and scales due to changes
            updatePlot();
            updateScales();

            //create the axis g
            axisG = chart.svg.append('g')
                .attr('transform', 'translate(' + chart.plot.left + ',' + chart.plot.top + ')');

            //create x axis grid lines
            xAxisGrid = axisG.append('g')
                .attr('class', 'eve-x-grid');

            //create y axis grid lines
            yAxisGrid = axisG.append('g')
                .attr('class', 'eve-y-grid');

            //create the grid
            updateGrid();

            //set x axis
            that.xAxis = createXAxis();

            //set y axis
            that.yAxis = createYAxis();

            //check whether the x axis is enabled
            if (xAxisOptions.enabled) {
                //create x axis
                xAxis = axisG.append('g')
                    .style('fill', 'none')
                    .style('shape-rendering', 'crispEdges')
                    .attr('transform', function () {
                        if (xAxisOptions.axisCrossing === "zero") {
                            return 'translate(0,' + that.yScale(0) + ')';
                        } else {
                            return 'translate(0,' + (xAxisOptions.position === 'top' ? 0 : chart.plot.height + 0) + ')';
                        }
                    })
                    .attr('class', 'eve-x-axis')
                    .call(that.xAxis);
            }

            //check whether the y axis is enabled
            if (yAxisOptions.enabled) {
                //create y axis
                yAxis = axisG.append('g')
                    .style('fill', 'none')
                    .style('shape-rendering', 'crispEdges')
                    .attr('transform', function () {
                        if (yAxisOptions.axisCrossing === "zero") {
                            return 'translate(' + that.xScale(0) + ')';
                        } else {
                            return 'translate(' + (yAxisOptions.position === 'right' ? (chart.plot.width) : 0) + ')';
                        }
                    })
                    .attr('class', 'eve-y-axis')
                    .call(that.yAxis);
            }

            //update axes
            updateAxisStyle();
        };

        //start axis drawing process
        drawAxisTitles();
        drawAxes();

        //attach update axis method
        that.update = function () {
            //re-calculate the domains
            chart.calculateDomain();

            //update scales
            updateScales();
            updateGrid(true);

            //check if x axis is enabled
            if (xAxisOptions.enabled) {
                //update x axis
                xAxis
                    .style('fill', 'none')
                    .style('shape-rendering', 'crispEdges')
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .call(createXAxis());
            }

            //check if y axis is enabled
            if (yAxisOptions.enabled) {
                //update y axis
                yAxis
                    .style('fill', 'none')
                    .style('shape-rendering', 'crispEdges')
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .call(createYAxis());
            }

            updateAxisStyle();
        };

        return this;
    }

    //define radar axis class
    function chartRadarAxis() {
        //handle chart object error
        if (arguments.length === 0)
            throw Error('Invalid chart data!');

        //declare needed variables
        let that = this;
        let chart = arguments[0];
        let xAxisOptions = chart.xAxis;
        let yAxisOptions = chart.yAxis;
        let xValues = e.getUniqueValues(chart.data, chart.xField);
        let currentSerie = chart.series[0];
        let radius = 0;
        let sliceAngle = 0;
        let yScale = null;
        let xScale = null;
        let ticks = null;
        let tickCount = 5;
        let axisG = null;
        let yAxis = null;
        let xAxis = null;
        let dataRange = null;
        let maxRange = 0;
        let maxRangeValue = 0;

        //formats x axis text
        let getFormattedAxisValue = function (d, format) {
            let valueType = e.getType(d);
            if (d === 0) return d;
            if (valueType === "array" && d.length > 0) return d[0];

            if (valueType === 'number')
                return d ? e.formatNumber(d, format) : '';
            else if (valueType === 'date')
                return d ? e.formatDate(d, format) : '';
            else
                return d ? d.replaceAll('&lt;', '<').replaceAll('&gt;', '>') : '';
        };

        //wraps given text
        function wrapText(text, width) {
            text.each(function () {
                let text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.4, // ems
                    y = text.attr("y"),
                    x = text.attr("x"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        }

        //updates plot area
        let updatePlot = function () {
            //declare plot variables
            let tempTextSVG = null;
            let tempTextOffset = null;
            let maxLongXValue = xValues.getLongestText();

            //create a temporary text
            tempTextSVG = chart.svg.append("text")
                .style('font-size', xAxisOptions.labelFontSize + 'px')
                .style('color', xAxisOptions.labelFontColor)
                .style('font-family', xAxisOptions.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', xAxisOptions.labelFontStyle == 'bold' ? 'normal' : xAxisOptions.labelFontStyle)
                .style('font-weight', xAxisOptions.labelFontStyle == 'bold' ? 'bold' : 'normal')
                .text(maxLongXValue);

            //set text offset
            tempTextOffset = tempTextSVG.node().getBoundingClientRect();

            //remove temp text
            tempTextSVG.remove();

            //compare width and heght of the text to reduce dimension
            let reducer = tempTextOffset.width + tempTextOffset.height + chart.plot.titleHeight * 2;

            //reduce width and height
            chart.plot.width -= reducer;
            chart.plot.height -= reducer;
        };

        //updates scales
        let updateScales = function () {
            //set radius and angle to calculate scales
            radius = Math.min(chart.plot.width / 2, chart.plot.height / 2);
            sliceAngle = Math.PI * 2 / xValues.length;

            //declare data range
            dataRange = d3.range(1, (tickCount + 1)).reverse();

            //create the scale 
            that.yScale = d3.scaleLinear().range([0, radius]).domain([chart.domains.minY, chart.domains.maxY]);
            ticks = that.yScale.ticks();
            that.sliceAngle = sliceAngle;
        };

        //creates the axis levels
        let createAxisLevels = function () {
            //create the axis g
            axisG = chart.svg.append('g')
                .attr('transform', 'translate(' + (chart.width / 2) + ',' + (chart.height / 2) + ')');

            //create the base grid g
            yAxis = axisG.append("g");

            //draw the level circles (y axis)
            yAxis.selectAll(".eve-y-axis")
                .data(dataRange)
                .enter()
                .append("circle")
                .attr("class", "eve-y-axis")
                .attr("r", function (d, i) { return radius / tickCount * d; })
                .style("fill", "none")
                .style("stroke", yAxisOptions.color);

            //create the level texts
            yAxis.selectAll(".eve-yAxis-labels")
                .data(dataRange.reverse())
                .enter().append("text")
                .attr("class", "eve-yAxis-labels")
                .attr("x", 0)
                .attr("y", function (d) { return -d * radius / tickCount; })
                .attr("dy", "0.4em")
                .style('pointer-events', 'none')
                .style('fill', yAxisOptions.labelFontColor)
                .style('font-family', yAxisOptions.labelFontFamily)
                .style('font-style', yAxisOptions.labelFontStyle === 'bold' ? 'normal' : yAxisOptions.labelFontStyle)
                .style('font-weight', yAxisOptions.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('font-size', yAxisOptions.labelFontSize)
                .text(function (d, i) {
                    let textValue = Math.round(chart.domains.maxY * d / tickCount);
                    //let textValueBase = eve.getNumberBase(textValue);
                    //if (chart.domains.minY >= 0)
                    //    textValue = (Math.round(textValue / textValueBase) * textValueBase);
                    return getFormattedAxisValue(textValue, yAxisOptions.labelFormat);
                    return textValue;
                });

            //create the x axis
            xAxis = yAxis.selectAll(".eve-x-axis")
                .data(xValues)
                .enter()
                .append("g")
                .attr("class", "eve-x-axis");

            //create the x axis lines
            xAxis.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", function (d, i) { return that.yScale(chart.domains.maxY * 1) * Math.cos(sliceAngle * i - Math.PI / 2); })
                .attr("y2", function (d, i) { return that.yScale(chart.domains.maxY * 1) * Math.sin(sliceAngle * i - Math.PI / 2); })
                .attr("class", "line")
                .style("stroke", xAxisOptions.color)
                .style("stroke-width", 1);

            //create the x axis labels
            xAxis.append("text")
                .attr("text-anchor", "middle")
                .style('fill', xAxisOptions.labelFontColor)
                .style('font-family', xAxisOptions.labelFontFamily)
                .style('font-style', xAxisOptions.labelFontStyle === 'bold' ? 'normal' : xAxisOptions.labelFontStyle)
                .style('font-weight', xAxisOptions.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('font-size', xAxisOptions.labelFontSize)
                .attr("dy", "0.35em")
                .attr("x", function (d, i) { return that.yScale(chart.domains.maxY * 1.1) * Math.cos(sliceAngle * i - Math.PI / 2); })
                .attr("y", function (d, i) { return that.yScale(chart.domains.maxY * 1.1) * Math.sin(sliceAngle * i - Math.PI / 2); })
                .text(function (d) {
                    return getFormattedAxisValue(d, xAxisOptions.labelFormat);
                })
                .call(wrapText, 60);
        };

        //create a temporary text
        updatePlot();
        updateScales();
        createAxisLevels();

        //attach update axis method
        that.update = function () {
            //re-calculate the domains
            chart.calculateDomain();

            //remove the axis geometry
            axisG.remove();

            //update scales and update axis
            updateScales();
            createAxisLevels();
        };

        return this;
    }

    //define combination axis class
    function chartCombinationAxis() {
        //handle chart object error
        if (arguments.length === 0)
            throw Error('Invalid chart data!');

        //set axis members
        this.xScale = null;
        this.yScale = null;
        this.xAxis = null;
        this.yAxis = null;

        //declare needed variables
        let that = this;
        let chart = arguments[0];
        let xAxisOptions = chart.xAxis;
        let yAxisOptions = chart.yAxis;
        let bbox = null;
        let tempTextSVG = null;
        let maxLongValue = "";
        let tempXAxisSVGOffset = null;
        let tempYAxisSVGOffsets = {};
        let tickSize = 6;
        let xScale = null;
        let serieScale = null;
        let serieScales = {};
        let serieDomain = null;
        let serieDomains = {};
        let xAxisGrid = null;
        let yAxisGrid = null;
        let xAxis = null;
        let yAxes = [];

        //creates x axis title
        let createXAxisTitle = function () {
            //create x axis title
            tempTextSVG = chart.svg.append('g').append('text')
                .text(xAxisOptions.title)
                .style('fill', xAxisOptions.titleFontColor)
                .style('font-family', xAxisOptions.titleFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-size', xAxisOptions.titleFontSize + 'px')
                .style('font-style', xAxisOptions.titleFontStyle === 'bold' ? 'normal' : xAxisOptions.titleFontStyle)
                .style('font-weight', xAxisOptions.titleFontStyle === 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'middle')
                .attr('x', chart.plot.width / 2)
                .attr('y', function () {
                    //get bbox
                    bbox = this.getBBox();

                    //check position
                    if (xAxisOptions.position === 'top') {
                        //calculate y position
                        yPos = chart.plot.top + bbox.height / 2;
                    } else {
                        //set y pos as height
                        yPos = chart.plot.height - bbox.height / 2;
                    }

                    //return y position of the title
                    return yPos;
                });

            //get bounding box for x axis title
            bbox = tempTextSVG.node().getBBox();

            //increase plot bottom margin
            if (xAxisOptions.position === 'top')
                chart.plot.top += bbox.height;
            else
                chart.plot.bottom += bbox.height;
        };

        //updates plot area
        let updatePlot = function () {
            //switch x field data type to set plot
            switch (chart.xDataType) {
                case 'string':
                    {
                        //iterate all x values
                        valueLength = 0;
                        chart.domains.xValues.forEach(function (v) {
                            if (v && v.toString().length > valueLength) {
                                valueLength = v.length;
                                maxLongValue = v;
                            }
                        });
                    }
                    break;
                case 'number':
                    {
                        //get max value in data
                        maxLongValue = e.formatNumber(chart.domains.maxX, xAxisOptions.axisFormat);
                    }
                    break;
                case 'date':
                    {
                        //get max value in data
                        maxLongValue = e.formatDate(chart.domains.maxX, xAxisOptions.axisFormat);
                    }
                    break;
            }

            //set temporary text value for x axis
            tempTextSVG = chart.svg.append('text')
                .style('font-size', chart.xAxis.labelFontSize + 'px')
                .style('color', chart.xAxis.labelFontColor)
                .style('font-family', chart.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.xAxis.labelFontStyle == 'bold' ? 'normal' : chart.xAxis.labelFontStyle)
                .style('font-weight', chart.xAxis.labelFontStyle == 'bold' ? 'bold' : 'normal')
                .attr('transform', 'rotate(' + chart.xAxis.labelAngle + ')')
                .text(maxLongValue);

            //get offset for x axis value
            bbox = tempTextSVG.node().getBoundingClientRect();
            tempXAxisSVGOffset = tempTextSVG.node().getBoundingClientRect();

            //remove svg text for x axis
            tempTextSVG.remove();

            //increase plot margins
            chart.plot.top += 5;
            chart.plot.bottom += 10;
            chart.plot.left += 5;
            chart.plot.right += 5;

            //check x axis position to set plot top and bottom margin
            if (chart.xAxis.position === 'top')
                chart.plot.top += chart.xAxis.enabled ? bbox.height : 0;
            else
                chart.plot.bottom += chart.xAxis.enabled ? bbox.height : 0;

            //declare plot margins counts for positions
            let leftAxisCount = 0,
                rightAxisCount = 0,
                marginWidth = 0,
                leftAxisWidths = [],
                rightAxisWidths = [];

            //iterate all series to update plot by series
            chart.series.forEach(function (serie) {
                //get max serie value
                let maxSerieValue = d3.max(chart.data, function (d) { return +d[serie.yField]; });
                let serieKey = serie.yField.toValueKey();

                //set temporary text value for x axis
                tempTextSVG = chart.svg.append('text')
                    .style('font-size', yAxisOptions.labelFontSize + 'px')
                    .style('color', yAxisOptions.labelFontColor)
                    .style('font-family', yAxisOptions.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-style', yAxisOptions.labelFontStyle == 'bold' ? 'normal' : yAxisOptions.labelFontStyle)
                    .style('font-weight', yAxisOptions.labelFontStyle == 'bold' ? 'bold' : 'normal')
                    .attr('transform', 'rotate(' + yAxisOptions.labelAngle + ')')
                    .text(e.formatNumber(maxSerieValue, yAxisOptions.labelFormat));

                //get offset for x axis value
                bbox = tempTextSVG.node().getBoundingClientRect();

                //set y axis svg offset
                tempYAxisSVGOffsets[serieKey] = bbox;

                //remove svg text for x axis
                tempTextSVG.remove();

                //set margin width
                marginWidth = (yAxisOptions.enabled ? bbox.width + tickSize + yAxisOptions.titleFontSize * 2 : tickSize);

                //increase left axis index
                if (serie.axisPosition === 'left') {
                    leftAxisWidths.push(bbox.width + yAxisOptions.titleFontSize * 2 + tickSize);
                    leftAxisCount++;
                }

                //increase right axis index
                if (serie.axisPosition === 'right') {
                    rightAxisWidths.push(bbox.width + yAxisOptions.titleFontSize * 2 + tickSize);
                    rightAxisCount++;
                }
            });

            //get max widths
            leftAxisWidth = d3.max(leftAxisWidths);
            rightAxisWidth = d3.max(rightAxisWidths);

            //set chart plot width and height
            chart.plot.left = leftAxisWidth * leftAxisCount;
            chart.plot.right = rightAxisWidth * rightAxisCount;
            chart.plot.width = Math.abs(chart.plot.width - chart.plot.left - chart.plot.right) - 10;
            chart.plot.height = Math.abs(chart.plot.height - chart.plot.top - chart.plot.bottom);
        };

        //updates scales
        let updateScales = function () {
            //switch x axis data type to set ranges
            switch (chart.xDataType) {
                case 'number':
                case 'numeric':
                    {
                        //create linear scale
                        xScale = d3.scaleLinear().range([0, chart.plot.width]).domain([chart.domains.minX, chart.domains.maxX]);
                    }
                    break;
                case 'date':
                    {
                        //create date based scale
                        xScale = d3.scaleTime().range([0, chart.plot.width]).domain([chart.domains.minX, chart.domains.maxX]);
                    }
                    break;
                default:
                    {
                        //create string scale
                        xScale = d3.scaleBand().range([0, chart.plot.width]).padding(0.1).round(true).domain(chart.domains.xValues);
                    }
                    break;
            }

            //iterate all nested series to create combinations
            chart.series.forEach(function (serie, serieIndex) {
                //get key of the given serie
                let serieKey = serie.yField.toValueKey(),
                    minSerieValue = d3.min(chart.data, function (d) { return d[serie.yField]; }),
                    maxSerieValue = d3.max(chart.data, function (d) { return d[serie.yField]; }) * 1.02;

                if (serie.axisPosition === 'left') {
                    if (yAxisOptions.min)
                        minSerieValue = yAxisOptions.min * 0.9;

                    if (yAxisOptions.max)
                        maxSerieValue = yAxisOptions.max * 1.2; 
                } else if (serie.axisPosition === 'right') {
                    if (yAxisOptions.minRight)
                        minSerieValue = (yAxisOptions.minRight || yAxisOptions.colorMin) * 0.9;

                    if (yAxisOptions.maxRight)
                        maxSerieValue = (yAxisOptions.maxRight || yAxisOptions.colorMax) * 1.2;
                }

                //check if starts from zero
                if (yAxisOptions.startsFromZero)
                    minSerieValue = 0;

                //create scale for the current serie
                serieScales[serieKey] = d3.scaleLinear().range([chart.plot.height, 0]).domain([minSerieValue, maxSerieValue]);
                serieDomains[serieKey] = {
                    min: minSerieValue,
                    max: maxSerieValue
                };
            });

            //set chart scales
            that.xScale = xScale;
            that.serieScales = serieScales;
            that.serieDomains = serieDomains;
        };

        //gets x axis tick count
        let getXAxisTickCount = function () {
            //set tick count to 10
            let tickCount = 10;

            //check whether the axis tick count is auto
            if (xAxisOptions.tickCount === 'auto') {
                //set tick count
                tickCount = Math.ceil(chart.plot.width / tempXAxisSVGOffset.width) - 1;

                //check if we have more than 10 ticks
                if (tickCount > 10)
                    tickCount = (Math.round(tickCount / 10) * 10);
            } else {
                //set manuel tick count
                tickCount = parseInt(xAxisOptions.tickCount);
            }

            //return updated tick count
            return e.closestPower(Math.ceil(tickCount));
        };

        //gets x axis tick count
        let getYAxisTickCount = function (serieKey) {
            //set tick count to 10
            let tickCount = 10;
            let svgOffset = tempYAxisSVGOffsets[serieKey];

            //check whether the axis tick count is auto
            if (yAxisOptions.tickCount === 'auto') {
                //set tick count
                tickCount = Math.ceil(chart.plot.height / svgOffset.height) - 1;

                //check if we have more than 10 ticks
                if (tickCount > 10)
                    tickCount = (Math.round(tickCount / 10) * 10) / 2;
            } else {
                //set manuel tick count
                tickCount = parseInt(yAxisOptions.tickCount);
            }

            //return updated tick count
            return tickCount;
        };

        //creates x axis
        let createXAxis = function () {
            //declare needed variables
            let xAxisFunction = null;
            let tickCount = getXAxisTickCount();

            //set position for the axis function
            if (xAxisOptions.position === 'top') {
                xAxisFunction = d3.axisTop(that.xScale);
            } else {
                xAxisFunction = d3.axisBottom(that.xScale);
            }

            //when x axis is string then we need to show all values
            if (chart.xDataType === "string") {
                return xAxisFunction.tickValues(chart.domains.xValues);
            } else {
                //when x axis is date then we need to calculate tick values
                let perBar = Math.floor(chart.plot.width / tempXAxisSVGOffset.width);
                
                //update tick count
                tickCount = e.calculateTicks(tickCount);

                if (xAxisOptions.tickCount === 'auto' && tickCount > 15)
                    tickCount = 15;

                //check screen width
                if (chart.width < 360)
                    tickCount = 3;

                //when x axis is not string then we can get the auto count
                return xAxisFunction.ticks(tickCount);
            }
        };

        //creates y axis
        let createYAxis = function (serieIndex) {
            //declare needed variables
            let serie = chart.series[serieIndex];
            let serieKey = serie.yField.toValueKey();
            let yAxisFunction = null;
            let tickCount = getYAxisTickCount(serieKey);

            /*
            //set position for the axis function
            if (yAxisOptions.position === 'right') {
                yAxisFunction = d3.axisRight(serieScales[serieKey]);
            } else {
                yAxisFunction = d3.axisLeft(serieScales[serieKey]);
            }

            //when x axis is string then we need to show all values
            if (isReversed && chart.xDataType === "string")
                return yAxisFunction.tickValues(chart.domains.xValues);

            //check if the vis has x axis
            if (isReversed && chart.xField && chart.dataProperties) {
                //get unique values for the x field
                let uniqueValues = chart.dataProperties.columns[chart.xField].uniques;

                //need to check if the unique values count
                if (uniqueValues.length < tickCount)
                    tickCount = uniqueValues.length;
            }

            //when x axis is not string then we can get the auto count
            return yAxisFunction.ticks(tickCount);
            */

            //return left aligned axis
            if (serie.axisPosition === 'right')
                return d3.axisRight(serieScales[serieKey]);
            else
                return d3.axisLeft(serieScales[serieKey]);
        };

        //udpdates axes grid
        let updateGridStyle = function (isUpdate) {
            //transform x grid
            if (isUpdate) {
                //updatet x axis grid
                xAxisGrid
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .attr('transform', 'translate(0,' + (chart.xAxis.position === 'top' ? 0 : chart.plot.height) + ')')
                    .call(createXAxis().tickSize(-chart.plot.height, 0, 0).tickFormat(''));

                //update y axis grid
                yAxisGrid
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .attr('transform', 'translate(' + (chart.yAxis.position === 'right' ? (chart.plot.width) : 0) + ')')
                    .call(createYAxis(0).tickSize(-chart.plot.width, 0, 0).tickFormat(''));
            } else {
                //init x axis grid
                xAxisGrid
                    .attr('transform', 'translate(0,' + (chart.xAxis.position === 'top' ? 0 : chart.plot.height) + ')')
                    .call(createXAxis().tickSize(-chart.plot.height, 0, 0).tickFormat(''));

                //init y axis grid
                yAxisGrid
                    .attr('transform', 'translate(' + (chart.yAxis.position === 'right' ? (chart.plot.width) : 0) + ')')
                    .call(createYAxis(0).tickSize(-chart.plot.width, 0, 0).tickFormat(''));

            }

            //set x axis grid domain style
            xAxisGrid.selectAll('.domain')
                .style('stroke', 'none')
                .style('stroke-width', '0px');

            //set x axis grid line style
            xAxisGrid.selectAll('line')
                .style('stroke-opacity', chart.xAxis.gridLineAlpha)
                .style('stroke-width', chart.xAxis.gridLineThickness + 'px')
                .style('stroke', chart.xAxis.gridLineColor);

            //set y axis grid domain style
            yAxisGrid.selectAll('.domain')
                .style('stroke', 'none')
                .style('stroke-width', '0px');

            //set y axis grid line style
            yAxisGrid.selectAll('line')
                .style('stroke-opacity', chart.yAxis.gridLineAlpha)
                .style('stroke-width', chart.yAxis.gridLineThickness + 'px')
                .style('stroke', chart.yAxis.gridLineColor);
        }

        //formats x axis text
        let getFormattedXAxis = function (d, i) {
            let valueType = e.getType(d);
            if (d === 0) return d;
            if (valueType === "array" && d.length > 0) return d[0];

            if (valueType === 'number')
                return d ? e.formatNumber(d, xAxisOptions.labelFormat) : '';
            else if (valueType === 'date')
                return d ? e.formatDate(d, xAxisOptions.labelFormat) : '';
            else
                return d ? d.replaceAll('&lt;', '<').replaceAll('&gt;', '>') : '';
        };

        //formats x axis text
        let getFormattedYAxis = function (d, i) {
            let valueType = e.getType(d);
            if (d === 0) return d;

            if (valueType === 'number')
                return d ? e.formatNumber(d, yAxisOptions.labelFormat) : '';
            else if (valueType === 'date')
                return d ? e.formatDate(d, yAxisOptions.labelFormat) : '';
            else
                return d ? d.replaceAll('&lt;', '<').replaceAll('&gt;', '>') : '';
        };

        //updates axis style
        let updateAxisStyle = function () {
            //check whether the x axis is enabled
            if (chart.xAxis.enabled) {
                //select x axis path and change stroke
                xAxis.selectAll('path')
                    .style('stroke-opacity', chart.xAxis.alpha)
                    .style('stroke-width', chart.xAxis.thickness + 'px')
                    .style('stroke', chart.xAxis.color);

                //select all lines in xaxis
                xAxis.selectAll('line')
                    .style('fill', 'none')
                    .style('stroke-width', chart.xAxis.thickness + 'px')
                    .style('shape-rendering', 'crispEdges')
                    .style('stroke-opacity', chart.xAxis.alpha)
                    .style('stroke', chart.xAxis.color);

                //select all texts in xaxis
                xAxis.selectAll('text')
                    .style('fill', chart.xAxis.labelFontColor)
                    .style('font-size', chart.xAxis.labelFontSize + 'px')
                    .style('font-family', chart.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-style', chart.xAxis.labelFontStyle === 'bold' ? 'normal' : chart.xAxis.labelFontStyle)
                    .style('font-weight', chart.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', function (d, i) {
                        //check label angle
                        if (chart.xAxis.labelAngle > 0)
                            return 'start';
                        else if (chart.xAxis.labelAngle < 0)
                            return 'end';
                        else
                            return 'middle';
                    })
                    .attr('transform', 'rotate(' + chart.xAxis.labelAngle + ')')
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .text(getFormattedXAxis);
            }

            //check whether the y axis is enabled
            if (chart.yAxis.enabled) {
                //iterate all y axes
                yAxes.forEach(function (currentYAxis, currentYAxisIndex) {
                    //select x axis path and change stroke
                    currentYAxis.selectAll('path')
                        .style('stroke-opacity', chart.yAxis.alpha)
                        .style('stroke-width', chart.yAxis.thickness + 'px')
                        .style('stroke', chart.yAxis.color);

                    //select all lines in yaxis
                    currentYAxis.selectAll('line')
                        .style('fill', 'none')
                        .style('stroke-width', chart.yAxis.thickness + 'px')
                        .style('shape-rendering', 'crispEdges')
                        .style('stroke-opacity', chart.yAxis.alpha)
                        .style('stroke', chart.yAxis.color);

                    //select all texts in yaxis
                    currentYAxis.selectAll('text')
                        .style('fill', chart.yAxis.labelFontColor)
                        .style('font-size', chart.yAxis.labelFontSize + 'px')
                        .style('font-family', chart.yAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                        .style('font-style', chart.yAxis.labelFontStyle === 'bold' ? 'normal' : chart.yAxis.labelFontStyle)
                        .style('font-weight', chart.yAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                        .attr('transform', 'rotate(' + chart.yAxis.labelAngle + ')')
                        .transition().duration(chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .text(getFormattedYAxis);
                });
            }
        }

        //draws axes
        let drawAxes = function () {
            //create x axis title
            createXAxisTitle();
            updatePlot();
            updateScales();

            //create axis g
            axisG = chart.svg.append('g')
                .attr('transform', 'translate(' + chart.plot.left + ',' + chart.plot.top + ')');

            //create x axis grid lines
            xAxisGrid = axisG.append('g')
                .attr('class', 'eve-x-grid');

            //create y axis grid lines
            yAxisGrid = axisG.append('g')
                .attr('class', 'eve-y-grid');

            //create axis grid
            updateGridStyle();

            //create x axis
            if (xAxisOptions.enabled) {
                xAxis = axisG.append('g')
                    .style('fill', 'none')
                    .style('shape-rendering', 'crispEdges')
                    .attr('transform', 'translate(0,' + (xAxisOptions.position === 'top' ? 0 : chart.plot.height + 0) + ')')
                    .attr('class', 'eve-x-axis')
                    .call(createXAxis());
            }

            //declare axes seperate
            let leftAxes = [],
                rightAxes = [];

            //create y axes
            chart.series.forEach(function (serie, serieIndex) {
                //update actual serie index
                serie._actualSerieIndex = serieIndex;

                //cehck if serie position is left
                if (serie.axisPosition === 'left')
                    leftAxes.push(e.clone(serie));
                else
                    rightAxes.push(e.clone(serie));
            });

            //iterate left axes
            if (yAxisOptions.enabled) {
                leftAxes.forEach(function (serie, serieIndex) {
                    //get current serie info
                    let serieKey = serie.yField.toValueKey(),
                        textX = ((leftAxisWidth * (serieIndex + 1)) - yAxisOptions.titleFontSize) * -1,
                        posX = serieIndex === 0 ? 0 : (serieIndex * leftAxisWidth) * -1;

                    //create axis title
                    let yAxisTitleContainer = axisG.append('g');
                    let yAxisTitleSVG = yAxisTitleContainer.append('text')
                        .style('fill', yAxisOptions.titleFontColor)
                        .style('font-family', yAxisOptions.titleFontFamily + ', Arial, Helvetica, Ubuntu')
                        .style('font-size', yAxisOptions.titleFontSize + 'px')
                        .style('font-style', yAxisOptions.titleFontStyle === 'bold' ? 'normal' : yAxisOptions.titleFontStyle)
                        .style('font-weight', yAxisOptions.titleFontStyle === 'bold' ? 'bold' : 'normal')
                        .style('text-anchor', 'middle')
                        .text(serie.axisTitle ? serie.axisTitle : '')
                        .attr('transform', 'rotate(-90)');

                    //translate the y axis container
                    yAxisTitleContainer.attr('transform', 'translate(' + textX + ',' + (chart.plot.height / 2) + ')');

                    //create y axes
                    yAxis = axisG.append('g')
                        .style('fill', 'none')
                        .style('shape-rendering', 'crispEdges')
                        .attr('transform', 'translate(' + posX + ')')
                        .attr('class', 'eve-y-axis')
                        .call(createYAxis(serie._actualSerieIndex));

                    //push y axis into stack
                    yAxes.push(yAxis);
                });
            }

            //iterate left axes
            if (yAxisOptions.enabled) {
                rightAxes.forEach(function (serie, serieIndex) {
                    //get current serie info
                    let serieKey = serie.yField.toValueKey(),
                        textX = chart.plot.width + (((rightAxisWidth * (serieIndex + 1)) - yAxisOptions.titleFontSize)),
                        posX = chart.plot.width + serieIndex * rightAxisWidth;

                    //create axis title
                    let yAxisTitleContainer = axisG.append('g');
                    let yAxisTitleSVG = yAxisTitleContainer.append('text')
                        .style('fill', yAxisOptions.titleFontColor)
                        .style('font-family', yAxisOptions.titleFontFamily + ', Arial, Helvetica, Ubuntu')
                        .style('font-size', yAxisOptions.titleFontSize + 'px')
                        .style('font-style', yAxisOptions.titleFontStyle === 'bold' ? 'normal' : yAxisOptions.titleFontStyle)
                        .style('font-weight', yAxisOptions.titleFontStyle === 'bold' ? 'bold' : 'normal')
                        .style('text-anchor', 'middle')
                        .text(serie.axisTitle ? serie.axisTitle : '')
                        .attr('transform', 'rotate(90)');

                    //translate the title container
                    yAxisTitleContainer.attr('transform', 'translate(' + textX + ',' + (chart.plot.height / 2) + ')');

                    //create y axes
                    yAxis = axisG.append('g')
                        .style('fill', 'none')
                        .style('shape-rendering', 'crispEdges')
                        .attr('transform', 'translate(' + posX + ')')
                        .attr('class', 'eve-y-axis')
                        .call(createYAxis(serie._actualSerieIndex));

                    //push y axis into stack
                    yAxes.push(yAxis);
                });
            }
            //update axis styles
            updateAxisStyle();
        };

        //create the axes
        drawAxes();

        //attach update axis method
        that.update = function () {
            //re-calculate the domains
            chart.calculateDomain();

            //update scales and update axis
            updateScales();
            updateGridStyle(true);

            //check if x axis is enabled
            if (chart.xAxis.enabled) {
                //update x axis
                xAxis
                    .style('fill', 'none')
                    .style('shape-rendering', 'crispEdges')
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .call(createXAxis());
            }

            //check if y axis is enabled
            if (chart.yAxis.enabled) {
                //iterate y axes
                yAxes.forEach(function (yAxis, axisIndex) {
                    //update y axis
                    yAxis
                        .style('fill', 'none')
                        .style('shape-rendering', 'crispEdges')
                        .transition().duration(chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .call(createYAxis(axisIndex));
                });
            }

            //update axis styles
            updateAxisStyle();
        };

        return this;
    }

    //attach classical axis method into the eve charts
    e.initClassicalAxis = function (chart) {
        return new chartClassicalAxis(chart);
    };

    //attach radar axis method into the eve charts
    e.initRadarAxis = function (chart) {
        return new chartRadarAxis(chart);
    };

    //attach combination axis method into the eve charts
    e.initCombinationAxis = function (chart) {
        return new chartCombinationAxis(chart);
    };
})(eve);