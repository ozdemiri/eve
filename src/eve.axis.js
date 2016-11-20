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
(function(e) {
    /**
     * Stack Types:
     * default, full
     */

    //define axis class
    function chartAxis() {
        //handle chart object error
        if(arguments.length === 0) {
          throw Error('Invalid chart data!');
        }

        //set chart
        var chart = arguments[0];

        //set axis members
        this.xScale = null;
        this.yScale = null;
        this.xAxis = null;
        this.yAxis = null;

        //declare needed variables
        var that = this,
            xAxisTitleSVG = null,
            yAxisTitleSVG = null,
            xPos = 0,
            yPos = 0,
            valueLength = 0,
            maxLongXValue = '',
            maxLongYValue = '',
            tempTextSVG = null,
            tempXAxisSVGOffset = null,
            tempYAxisSVGOffset = null,
            xAxisGrid = null,
            yAxisGrid = null,
            xAxis = null,
            yAxis = null,
            axisG = null,
            xAxisOptions = null,
            yAxisOptions = null,
            scaleX = null,
            scaleY = null,
            tickSize = 6,
            bbox = null;

        //set x axis options
        xAxisOptions = chart.reversedAxis ? chart.yAxis : chart.xAxis;

        //set y axis options
        yAxisOptions = chart.reversedAxis ? chart.xAxis : chart.yAxis;

        //updates plot
        function updateChartPlot() {
            //switch x field data type to set plot
            switch (chart.xFieldDataType) {
                case 'string':
                    {
                        //iterate all x values
                        valueLength = 0;
                        chart.domains.x.forEach(function (v) {
                            if (v && v.toString().length > valueLength) {
                                valueLength = v.length;
                                maxLongXValue = v;
                            }
                        });
                    }
                    break;
                case 'number':
                    {
                        //get max value in data
                        maxLongXValue = chart.formatNumber(chart.domains.x[1]);
                    }
                    break;
                case 'date':
                    {
                        //get max value in data
                        maxLongXValue = chart.formatDate(chart.domains.x[1]);
                    }
                    break;
            }

            //set temporary text value for x axis
            tempTextSVG = chart.svg.append('text')
                .style('font-size', chart.xAxis.labelFontSize)
                .style('color', chart.xAxis.labelFontColor)
                .style('font-family', chart.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.xAxis.labelFontStyle == 'bold' ? 'normal' : chart.xAxis.labelFontStyle)
                .style('font-weight', chart.xAxis.labelFontStyle == 'bold' ? 'bold' : 'normal')
                .attr('transform', 'rotate(' + chart.xAxis.labelAngle + ')')
                .text(maxLongXValue);

            //get offset for x axis value
            tempXAxisSVGOffset = tempTextSVG.node().getBoundingClientRect();

            //remove svg text for x axis
            tempTextSVG.remove();
            
            //set max long y value
            maxLongYValue = chart.formatNumber(chart.domains.y[1]);

            //set temporary text value for x axis
            tempTextSVG = chart.svg.append('text')
                .style('font-size', chart.yAxis.labelFontSize)
                .style('color', chart.yAxis.labelFontColor)
                .style('font-family', chart.yAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.yAxis.labelFontStyle == 'bold' ? 'normal' : chart.yAxis.labelFontStyle)
                .style('font-weight', chart.yAxis.labelFontStyle == 'bold' ? 'bold' : 'normal')
                .attr('transform', 'rotate(' + chart.yAxis.labelAngle + ')')
                .text(maxLongYValue);

            //get offset for x axis value
            tempYAxisSVGOffset = tempTextSVG.node().getBoundingClientRect();

            //remove svg text for x axis
            tempTextSVG.remove();

            //set plot width and left
            if (yAxisOptions.enabled) {
                //increase plot left
                if (yAxisOptions.position === 'right')
                    chart.plot.right += chart.reversedAxis ? tempXAxisSVGOffset.width + yAxisOptions.titleFontSize : tempYAxisSVGOffset.width + yAxisOptions.titleFontSize;
                else
                    chart.plot.left += chart.reversedAxis ? tempXAxisSVGOffset.width + yAxisOptions.titleFontSize : tempYAxisSVGOffset.width + yAxisOptions.titleFontSize;
            }

            //set plot height and bottom
            if (xAxisOptions.enabled) {
                //increase plot bottom
                if (xAxisOptions.position === 'top')
                    chart.plot.top += chart.reversedAxis ? tempYAxisSVGOffset.height : tempXAxisSVGOffset.height;
                else
                    chart.plot.bottom += chart.reversedAxis ? tempYAxisSVGOffset.height : tempXAxisSVGOffset.height;

                //decrease left margin by length of the max long x value
                //chart.plot.left += tempXAxisSVGOffset.width / 2;
            }

            //set chart plot width and height
            chart.plot.width = chart.plot.width - chart.plot.left - chart.plot.right;
            chart.plot.height = chart.plot.height - chart.plot.top - chart.plot.bottom;
        }

        //updates scales
        function updateScales() {
            //check whether the chart has reversed axis
            if(chart.reversedAxis) {
                //switch x axis data type
                switch (chart.xFieldDataType) {
                    case 'string':
                        {
                            //create string based scale
                            scaleY = d3.scaleBand().range([0, chart.plot.height]).padding(0.1).round(true).domain(chart.domains.x);
                        }
                        break;
                    case 'date':
                        {
                            //create date based scale
                            scaleY = d3.scaleTime().range([0, chart.plot.height]).domain(chart.domains.x);
                        }
                        break;
                    default:
                        {
                            //create linear scale
                            scaleY = d3.scaleLinear().range([0, chart.plot.height]).domain(chart.domains.x);
                        }
                        break;
                }

                //create linear scale for y axis
                scaleX = d3.scaleLinear().range([0, chart.plot.width]).domain(chart.domains.y);
            } else {
                //switch x axis data type
                switch (chart.xFieldDataType) {
                    case 'string':
                        {
                            //create string based scale
                            scaleX = d3.scaleBand().range([0, chart.plot.width]).padding(0.1).round(true).domain(chart.domains.x.sort());
                        }
                        break;
                    case 'date':
                        {
                            //create date based scale
                            scaleX = d3.scaleTime().range([0, chart.plot.width]).domain(chart.domains.x);
                        }
                        break;
                    default:
                        {
                            //create linear scale
                            scaleX = d3.scaleLinear().range([0, chart.plot.width]).domain(chart.domains.x);
                        }
                        break;
                }

                //create linear scale for y axis
                if (chart.frozenYAxis && chart.frozenYAxis === 'string')
                    scaleY = d3.scaleBand().range([0, chart.plot.height]).padding(0.1).round(true).domain(chart.domains.y);
                else
                    scaleY = d3.scaleLinear().range([chart.plot.height, 0]).domain(chart.domains.y);
            }
            
            //set chart scales
            that.xScale = scaleX;
            that.yScale = scaleY;
        }

        //draws axis titles
        function drawAxisTitles() {
            //check whether the base x axis has a title
            if (xAxisOptions.title !== '') {
                //create base x axis title
                xAxisTitleSVG = chart.svg.append('g').append('text')
                    .text(xAxisOptions.title)
                    .style('fill', xAxisOptions.titleFontColor)
                    .style('font-family', xAxisOptions.titleFontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-size', xAxisOptions.titleFontSize + 'px')
                    .style('font-style', xAxisOptions.titleFontStyle === 'bold' ? 'normal' : xAxisOptions.titleFontStyle)
                    .style('font-weight', xAxisOptions.titleFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'middle')
                    .attr('x', chart.width / 2)
                    .attr('y', function () {
                        return chart.height - chart.plot.bottom - this.getBBox().height / 2;
                    });

                //get bounding box for x axis title
                bbox = xAxisTitleSVG.node().getBBox();

                //increase plot bottom margin
                chart.plot.bottom += bbox.height;

                //decrease plot height
                chart.plot.height -= bbox.height;
            }

            //check whether the base y axis has a title
            if (yAxisOptions.title !== '') {
                //create base x axis title
                yAxisTitleSVG = chart.svg.append('g').append('text')
                    .text(yAxisOptions.title)
                    .style('fill', yAxisOptions.titleFontColor)
                    .style('font-family', yAxisOptions.titleFontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-size', yAxisOptions.titleFontSize + 'px')
                    .style('font-style', yAxisOptions.titleFontStyle === 'bold' ? 'normal' : yAxisOptions.titleFontStyle)
                    .style('font-weight', yAxisOptions.titleFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'middle')
                    .attr('transform', function (d) {
                        //get bbox
                        bbox = this.getBBox();

                        //calculate x position
                        if (yAxisOptions.position === 'right')
                            xPos = chart.plot.width - chart.plot.right - bbox.height;
                        else
                            xPos = chart.plot.left + bbox.height;
                        
                        //calculate y posiition
                        yPos = (chart.height / 2 - bbox.height / 2);

                        //return translation
                        return 'translate(' + xPos + ',' + yPos + ')rotate(-90)';
                    });

                //increase plot left margin
                chart.plot.left += bbox.height;

                //decrease plot height
                chart.plot.width -= bbox.height;
            }

            //decrease plot height by label font size
            chart.plot.height -= (yAxisOptions.labelFontSize + tickSize);
        }

        //gets x axis tick count
        function getXAxisTickCount() {
            //set tick count to 10
            var tickCount = 10;

            //check whether the axis tick count is auto
            if (xAxisOptions.tickCount === 'auto') {
                //set tick count
                tickCount = (chart.plot.width / (chart.reversedAxis ? tempYAxisSVGOffset.width : tempXAxisSVGOffset.width)) - 1;
            } else {
                //set manuel tick count
                tickCount = parseInt(xAxisOptions.tickCount);
            }
            
            //return updated tick count
            return Math.ceil(tickCount);
        }

        //gets y axis tick count
        function getYAxisTickCount() {
            //set tick count to 10
            var tickCount = 10;

            //check whether the axis tick count is auto
            if (yAxisOptions.tickCount === 'auto') {
                //set tick count
                tickCount = (chart.plot.height / (chart.reversedAxis ? tempXAxisSVGOffset.height : tempYAxisSVGOffset.height)) - 1;
                
                //check whether the tick count > chart data
                if (tickCount > chart.data.length)
                    tickCount = chart.data.length;
            } else {
                //set manuel tick count
                tickCount = parseInt(yAxisOptions.tickCount);
            }
            
            //return updated tick count
            return Math.ceil(tickCount) > 10 ? 10 : Math.ceil(tickCount);
        }

        //creates x axis
        function createXAxis() {
            if (xAxisOptions.position === 'top') {
                //check whether the x axis data type is string
                if (chart.xFieldDataType === 'string')
                    return d3.axisTop(that.xScale);
                else
                    return d3.axisTop(that.xScale).ticks(getXAxisTickCount()).tickFormat(xAxisOptions.labelFormat);
            } else {
                //check whether the x axis data type is string
                if (chart.xFieldDataType === 'string')
                    return d3.axisBottom(that.xScale);
                else
                    return d3.axisBottom(that.xScale).ticks(getXAxisTickCount()).tickFormat(xAxisOptions.labelFormat);
            }
        }

        //creates y axis
        function createYAxis() {
            //return left aligned axis
            if (yAxisOptions.position === 'right')
                return d3.axisRight(that.yScale).ticks(getYAxisTickCount()).tickFormat(yAxisOptions.labelFormat);
            else
                return d3.axisLeft(that.yScale).ticks(getYAxisTickCount()).tickFormat(yAxisOptions.labelFormat);
        }

        //udpdates axes grid
        function updateGridStyle(isUpdate) {
            //transform x grid
            if (isUpdate) {
                //updatet x axis grid
                xAxisGrid
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .attr('transform', 'translate(0,' + (xAxisOptions.position === 'top' ? 0 : chart.plot.height) + ')')
                    .call(createXAxis().tickSize(-chart.plot.height, 0, 0).tickFormat(chart.xAxis.labelFormat));

                //update y axis grid
                yAxisGrid
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .attr('transform', 'translate(' + (yAxisOptions.position === 'right' ? (chart.plot.width) : 0) + ')')
                    .call(createYAxis().tickSize(-chart.plot.width, 0, 0).tickFormat(chart.yAxis.labelFormat));
            } else {
                //init x axis grid
                xAxisGrid
                    .attr('transform', 'translate(0,' + (xAxisOptions.position === 'top' ? 0 : chart.plot.height) + ')')
                    .call(createXAxis().tickSize(-chart.plot.height, 0, 0).tickFormat(chart.xAxis.labelFormat));

                //init y axis grid
                yAxisGrid
                    .attr('transform', 'translate(' + (yAxisOptions.position === 'right' ? (chart.plot.width) : 0) + ')')
                    .call(createYAxis().tickSize(-chart.plot.width, 0, 0).tickFormat(chart.yAxis.labelFormat));
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

        //updates axis
        function updateAxisStyle() {
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
                    .style('text-anchor', function (d) {
                        if (chart.xAxis.labelAngle > 0)
                            return 'start';
                        else if (chart.xAxis.labelAngle < 0)
                            return 'end';
                        else
                            return 'middle';
                    })
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .text(function (d) { return d; });
            }

            //check whether the y axis is enabled
            if (chart.yAxis.enabled) {
                //select x axis path and change stroke
                yAxis.selectAll('path')
                    .style('stroke-opacity', chart.yAxis.alpha)
                    .style('stroke-width', chart.yAxis.thickness + 'px')
                    .style('stroke', chart.yAxis.color);

                //select all lines in yaxis
                yAxis.selectAll('line')
                    .style('fill', 'none')
                    .style('stroke-width', chart.yAxis.thickness + 'px')
                    .style('shape-rendering', 'crispEdges')
                    .style('stroke-opacity', chart.yAxis.alpha)
                    .style('stroke', chart.yAxis.color);

                //select all texts in yaxis
                yAxis.selectAll('text')
                    .style('fill', chart.yAxis.labelFontColor)
                    .style('font-size', chart.yAxis.labelFontSize + 'px')
                    .style('font-family', chart.yAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-style', chart.yAxis.labelFontStyle === 'bold' ? 'normal' : chart.yAxis.labelFontStyle)
                    .style('font-weight', chart.yAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .text(function (d) { return d; });
            }
        }

        //draws axes
        function drawAxes() {
            //update chart plot and scales
            updateChartPlot();
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

            //set x axis
            that.xAxis = createXAxis();

            //set y axis
            that.yAxis = createYAxis();

            //check whether the x axis is enabled
            if (chart.xAxis.enabled) {
                //create x axis
                xAxis = axisG.append('g')
                    .style('fill', 'none')
                    .style('shape-rendering', 'crispEdges')
                    .attr('transform', 'translate(0,' + (xAxisOptions.position === 'top' ? 0 : chart.plot.height) + ')')
                    .attr('class', 'eve-x-axis')
                    .call(that.xAxis);
            }

            //check whether the y axis is enabled
            if (chart.yAxis.enabled) {
                //create y axis
                yAxis = axisG.append('g')
                    .style('fill', 'none')
                    .style('shape-rendering', 'crispEdges')
                    .attr('transform', 'translate(' + (yAxisOptions.position === 'right' ? (chart.plot.width) : 0) + ')')
                    .attr('class', 'eve-y-axis')
                    .call(that.yAxis);
            }

            //update axis text line and stylization
            updateAxisStyle();
        }

        //create axis
        drawAxisTitles();
        drawAxes();
        
        //updates axis
        that.updateAxis = function () {
            //update domains
            chart.updateXYDomain();

            //update chart plot and scale
            updateScales();
            updateGridStyle(true);
            
            //check if x axis is enabled
            if (chart.xAxis.enabled) {
                //update x axis
                xAxis
                    .style('fill', 'none')
                    .style('shape-rendering', 'crispEdges')
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .call(createXAxis());
            }

            //check if y axis is enabled
            if (chart.yAxis.enabled) {
                //update y axis
                yAxis
                    .style('fill', 'none')
                    .style('shape-rendering', 'crispEdges')
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .call(createYAxis());
            }

            //update axis style with new scale
            updateAxisStyle();
        };
    }

    //attach create axis method into the eve charts
    e.base.createAxis = function (chart) {
        return new chartAxis(chart);
    };
})(eve);