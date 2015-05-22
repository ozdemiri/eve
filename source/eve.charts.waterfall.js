/*!
 * eve.charts.waterfall.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Waterfall chart class.
 */
(function (eveCharts) {
    //waterfall creator class
    function waterfallChart(chart) {
        //create plot and axis
        var plot = chart.plot,
            axis, waterfallSeries, waterfallBars, waterfallTexts, waterfallLines;

        //create an internal function to create x axis
        function createXAxis() {
            return d3.svg.axis().scale(axis.x).orient('bottom').ticks(chart.xAxis.tickCount);
        };

        //create an internal function to create y axis
        function createYAxis() {
            return d3.svg.axis().scale(axis.y).orient('left').ticks(chart.yAxis.tickCount);
        };

        //create an internal function draw waterfall
        function createWaterfall() {
            //calculate cumulative
            var totalValue = 0,
                serie = chart.series[0],
                data = eve.clone(chart.data);

            //iterate all chart data
            data.each(function (d, i) {
                //set x field
                d.xField = d[chart.xField];

                //set y field
                d.yField = d[serie.yField];

                //set start value
                d.start = totalValue;

                //increase total value
                totalValue += d[chart.series[0].yField];

                //set end value
                d.end = totalValue;

                //set istotal as false
                d.isTotal = false;
            });

            //create total data object
            var totalDataObj = {
                xField: serie.totalText,
                yField: totalValue,
                start: 0,
                end: totalValue,
                isTotal: true
            };

            //set total data object x field
            totalDataObj[chart.xField] = chart.series[0].totalText;

            //push the total value into the data stack
            data.push(totalDataObj);

            //update x axis domain
            axis.x.domain(data.map(function (d) { return d[chart.xField]; }));

            //update y axis domain
            axis.y.domain([0, d3.max(data, function (d) { return d.end; })]);

            //update x axis
            plot.canvas.select('.eve-x-axis')
                .call(axis.xAxis)
                .selectAll('text')
                .style('fill', chart.xAxis.labelFontColor)
                .style('font-size', chart.xAxis.labelFontSize + 'px')
                .style('font-family', chart.xAxis.labelFontFamily)
                .style('font-style', chart.xAxis.labelFontStlye === 'bold' ? 'normal' : chart.yAxis.labelFontStlye)
                .style('font-weight', chart.xAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                .style('stroke-width', '0px');

            //update x axis grid lines
            plot.canvas.select('.eve-y-grid')
                .attr('transform', function () { return 'translate(' + axis.offset.left + ', ' + axis.offset.height + ')'; })
                .call(createXAxis().tickSize(-axis.offset.height, 0, 0).tickFormat(''));

            //update y axis
            plot.canvas.select('.eve-y-axis')
                .call(axis.yAxis)
                .selectAll('text')
                .style('fill', chart.yAxis.labelFontColor)
                .style('font-size', chart.yAxis.labelFontSize + 'px')
                .style('font-family', chart.yAxis.labelFontFamily)
                .style('font-style', chart.yAxis.labelFontStlye === 'bold' ? 'normal' : chart.yAxis.labelFontStlye)
                .style('font-weight', chart.yAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                .style('stroke-width', '0px');

            //update y axis grid lines
            plot.canvas.select('.eve-x-grid')
                .attr('transform', function () { return 'translate(' + axis.offset.left + ')'; })
                .call(createYAxis().tickSize(-axis.offset.width, 0, 0).tickFormat(''));

            //create waterfall series
            waterfallSeries = plot.canvas.selectAll('.eve-series')
                .data(data)
                .enter().append('g')
                .attr('class', function (d) { return 'eve-series'; })
                .attr("transform", function (d) { return "translate(" + (axis.x(d[chart.xField]) + axis.offset.left) + ",0)"; });

            //create waterfall bars
            waterfallBars = waterfallSeries.append('rect')
                .attr('class', 'eve-waterfall-bar')
                .style('fill', function (d) {
                    //check whether the value is total
                    if (d.isTotal)
                        return serie.totalColor;
                    else {
                        return d[serie.yField] >= 0 ? serie.positiveColor : serie.negativeColor;
                    }
                })
                .style('fill-opacity', serie.alpha)
                .on('mousemove', function (d, i) {
                    //get serie color
                    var serieColor = '',
                        balloonContent = chart.setBalloonContent({
                            data: d,
                            dataIndex: i,
                            format: chart.balloon.format,
                            serie: chart.series[d.index]
                        });

                    //set serie color
                    if (d.isTotal)
                        serieColor = serie.totalColor;
                    else {
                        serieColor = d[serie.yField] >= 0 ? serie.positiveColor : serie.negativeColor;
                    }

                    //set balloon border color
                    plot.balloon.style('borderColor', serieColor);

                    //Show balloon
                    chart.showBalloon(balloonContent);

                    //increase bullet stroke size
                    d3.select(this).style('fill-opacity', 1);
                })
                .on('mouseout', function (d, i) {
                    //Hide balloon
                    chart.hideBalloon();

                    //decrease bullet stroke size
                    d3.select(this).style('fill-opacity', serie.alpha);
                })
                .attr("y", function (d) { return axis.y(Math.max(d.start, d.end)); })
                .attr("height", function (d) { return Math.abs(axis.y(d.start) - axis.y(d.end)); })
                .attr("width", axis.x.rangeBand());

            //create waterfall texts
            waterfallTexts = waterfallSeries.append("text")
                .attr('class', 'eve-waterfall-text')
                .style('fill', serie.valueFontColor)
                .style('text-anchor', 'middle')
                .style('font-size', serie.valueFontSize + 'px')
                .style('font-family', serie.valueFontFamily)
                .style('font-style', serie.valueFontStlye === 'bold' ? 'normal' : serie.valueFontStlye)
                .style('font-weight', serie.valueFontStlye === 'bold' ? 'bold' : 'normal')
                .text(function (d) { var value = (d.end - d.start); return chart.formatNumbers ? value.group(chart.decimalSeperator, chart.thousandSeperator, chart.precision) : value; })
                .attr("x", function (d) { return axis.x.rangeBand() / 2 - this.getBBox().width / 2; })
                .attr("y", function (d) { return axis.y(d.end) + 5; })
                .attr("dy", function (d) { return (d[serie.yField] < 0 ? '-' : '') + ".75em" });

            //create waterfall lines
            waterfallLines = waterfallSeries.filter(function (d) { return !d.isTotal })
                .append("line")
                .attr('class', 'eve-waterfall-line')
                .style('stroke', serie.lineColor)
                .style("stroke-length", serie.lineSize)
                .style("stroke-opacity", serie.lineAlpha)
                .style('stroke-dasharray', function (d, i) {
                    //check whether the serie line drawing style
                    if (serie.lineDrawingStyle === 'dotted')
                        return '2, 2';
                    else if (serie.lineDrawingStyle === 'dashed')
                        return '5, 2';
                    else
                        return '0';
                })
                .attr("x1", axis.x.rangeBand())
                .attr("y1", function (d) { return axis.y(d.end) })
                .attr("x2", axis.x.rangeBand() + (plot.width / axis.x.rangeBand() * chart.data.length))
                .attr("y2", function (d) { return axis.y(d.end) });
        };

        //create an internal function init chart
        function init() {
            //create axis
            axis = chart.createAxis();

            //create waterfall
            createWaterfall();
        };

        //init chart
        init();

        //return chart
        return chart;
    };

    //set eve charts create waterfall chart method
    eveCharts.waterfall = function (options) {
        /// <summary>
        /// Creates a new waterfall chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'waterfall';
                });
            }

            //set chart config
            var config = new this.configurator(options);

            //set x axis data type
            config.xAxis.dataType = 'string';
            config.series[0].lineDrawingStyle = 'dashed';

            //create chart object
            var waterfall = waterfallChart(config, true);

            //add chart instance
            if (waterfall !== null)
                this.instances[waterfall.id] = waterfall;

            //return new chart object
            return waterfall;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts);