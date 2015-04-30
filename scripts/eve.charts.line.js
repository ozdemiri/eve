/*!
 * eve.charts.line.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Line chart class.
 */
(function (eveCharts) {
    //line chart creator class
    function lineChart(chart) {
        //declare gauge variables
        var plot = eve.charts.createPlot(chart),
            axis = eve.charts.createAxis(chart, plot),
            bisector = d3.bisector(function (d) { return d.xField; }).left,
            base = this;

        //append focusable g to hold up the pointer
        var focusable = axis.canvas.append("g").style("display", "none");

        //append the rectangle to capture mouse
        axis.canvas.append("rect")
            .attr("width", function () {
                //check whether the legends are enabled
                if (chart.legend.enabled) {
                    //switch legend position
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            return plot.width - axis.legendWidthMargin;
                        case 'top':
                        case 'bottom':
                            return plot.width;
                    }
                } else {
                    return plot.width;
                }
            })
            .attr("height", plot.height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", function () { focusable.style("display", null); })
            .on("mouseout", function () { focusable.style("display", "none"); hideBalloons(); })
            .on("mousemove", mousemove);

        //iterate all axis series
        axis.series.each(function (serie, serieIndex) {
            //append balloons for series
            eve(document.body).append('<div id="' + chart.id + '_balloon_serie_' + serieIndex + '" class="eve-balloon"></div>');

            //get chart serie
            var chartSerie = chart.series[serieIndex];

            //set balloon as eve object
            var balloon = eve('#' + chart.id + '_balloon_serie_' + serieIndex);

            //set balloon style
            balloon.style('backgroundColor', chart.balloon.backColor);
            balloon.style('borderStyle', chart.balloon.borderStyle);
            balloon.style('borderColor', chart.balloon.borderColor);
            balloon.style('borderRadius', chart.balloon.borderRadius + 'px');
            balloon.style('borderWidth', chart.balloon.borderSize + 'px');
            balloon.style('color', chart.balloon.fontColor);
            balloon.style('fontFamily', chart.balloon.fontFamily);
            balloon.style('fontSize', chart.balloon.fontSize + 'px');
            balloon.style('paddingLeft', chart.balloon.padding + 'px');
            balloon.style('paddingTop', chart.balloon.padding + 'px');
            balloon.style('paddingRight', chart.balloon.padding + 'px');
            balloon.style('paddingBottom', chart.balloon.padding + 'px');
            if (chart.balloon.fontStyle == 'bold') balloon.style('fontWeight', 'bold'); else balloon.style('fontStyle', chart.balloon.fontStyle);

            //append the circle at the intersection 
            focusable.append('circle')
                .attr('class', 'eve-pointer-' + serieIndex)
                .style('fill', (chartSerie.color === '' ? eveCharts.colors[serieIndex] : chartSerie.color))
                .style('fill-opacity', .5)
                .style('stroke', (chartSerie.color === '' ? eveCharts.colors[serieIndex] : chartSerie.color))
                .style('stroke-width', (chartSerie.lineSize + .5))
                .attr("r", 4);

            //check whether the serie is line
            if (chartSerie.type === 'line') {
                //declare line function
                var lineF = d3.svg.line()
                    .x(function (d) { return axis.x(d.xField); })
                    .y(function (d) { return axis.y(d.yField); });

                //check lineType
                if (chartSerie.lineType === 'spLine')
                    lineF.interpolate('basis');
                else if (chartSerie.lineType === 'stepLine')
                    lineF.interpolate('step');

                //create serie lines
                var serieLine = axis.canvas.append('path')
                    .attr('d', lineF(serie.values))
                    .attr('class', 'eve-line-' + serieIndex)
                    .style('fill', 'none')
                    .style('stroke-width', chartSerie.lineSize)
                    .style('stroke-opacity', chartSerie.lineAlpha)
                    .style('stroke', (chartSerie.color === '' ? eveCharts.colors[serieIndex] : chartSerie.color))
                    .attr('transform', function (d) {
                        //check whether the legends are enabled
                        if (chart.legend.enabled) {
                            //switch legend position
                            switch (chart.legend.position) {
                                case 'left':
                                    return 'translate(' + (axis.yAxisLeftMargin + axis.legendWidthMargin) + ')';
                                case 'right':
                                    return 'translate(' + (axis.yAxisLeftMargin) + ')';
                                case 'top':
                                    return 'translate(' + (axis.yAxisLeftMargin) + ')';
                                case 'bottom':
                                    return 'translate(' + (axis.yAxisLeftMargin) + ')';
                            }
                        } else {
                            return 'translate(' + (axis.yAxisLeftMargin) + ')';
                        }
                    })
                    .on('click', function () {
                        //check selected
                        if (serie.selected) { serie.selected = false; } else { serie.selected = true; }

                        //check whether the serie is selected
                        if (serie.selected) {
                            //decrase all paths' stroke opacity
                            axis.canvas.selectAll('path').style('stroke-opacity', .2);

                            //increase current path's stroke opacity
                            axis.canvas.selectAll('.eve-line-' + serieIndex).style('stroke-opacity', 1);
                        } else {
                            //decrase all paths' stroke opacity
                            axis.canvas.selectAll('path').style('stroke-opacity', 1);
                        }
                    });
            }
        });
        
        //formats value
        function formatValue(value, data, serie) {
            //handle errors
            if (arguments.length === 0) return '';
            if (value == null || data == null) return '';

            //declare format variables
            var formatted = value;

            //convert titles
            formatted = formatted.replaceAll('{{title}}', serie.name);

            //convert x values
            if (data['xField'] !== null) formatted = formatted.replaceAll('{{x}}', data.xField);

            //convert y values
            if (data['yField'] !== null) formatted = formatted.replaceAll('{{y}}', (chart.formatNumbers ? data.yField.group(chart.decimalSeperator, chart.thousandSeperator, chart.precision) : data.yField));

            //convert value fields
            if (data['valueField'] !== null) formatted = formatted.replaceAll('{{value}}', (chart.formatNumbers ? data.valueField.group(chart.decimalSeperator, chart.thousandSeperator, chart.precision) : data.valueField));

            //convert size fields
            if (data['sizeField'] !== null) formatted = formatted.replaceAll('{{size}}', (chart.formatNumbers ? data.sizeField.group(chart.decimalSeperator, chart.thousandSeperator, chart.precision) : data.sizeField));

            //return formatted content
            return formatted;
        };

        //create a mouse move event to capture data
        function mousemove() {
            //get base function
            var base = this;

            //iterate all series
            axis.series.each(function (serie, serieIndex) {
                //try to show the circle on the current data
                try {
                    //declare needed variables to estimate data position
                    var dataX = axis.x.invert(d3.mouse(base)[0]),
                        dataBisector = bisector(serie.values, dataX, 1),
                        data0 = serie.values[dataBisector - 1],
                        data1 = serie.values[dataBisector],
                        data = data1 == null ? data0 : (dataX - data0.xField > data1.xField - dataX ? data1 : data0),
                        balloonContent = formatValue(chart.balloon.format, data, serie);

                    //point circle on the path
                    focusable.select('circle.eve-pointer-' + serieIndex)
                        .attr('transform', function (d) {
                            //check whether the legends are enabled
                            if (chart.legend.enabled) {
                                //switch legend position
                                switch (chart.legend.position) {
                                    case 'left':
                                        return 'translate(' + (axis.x(data.xField) + axis.yAxisLeftMargin + axis.legendWidthMargin) + ',' + axis.y(data.yField) + ')';
                                    case 'right':
                                        return 'translate(' + (axis.x(data.xField) + axis.yAxisLeftMargin) + ',' + axis.y(data.yField) + ')';
                                    case 'top':
                                        return 'translate(' + (axis.x(data.xField) + axis.yAxisLeftMargin) + ',' + axis.y(data.yField) + ')';
                                    case 'bottom':
                                        return 'translate(' + (axis.x(data.xField) + axis.yAxisLeftMargin) + ',' + axis.y(data.yField) + ')';
                                }
                            } else {
                                return 'translate(' + (axis.x(data.xField) + axis.yAxisLeftMargin) + ',' + axis.y(data.yField) + ')';
                            }
                        });

                    //get serie balloon
                    var balloon = eve('#' + chart.id + '_balloon_serie_' + serieIndex);

                    //set serie baloons border color
                    balloon.style('borderColor', (chart.series[serieIndex].color === '' ? eveCharts.colors[serieIndex] : chart.series[serieIndex].color));

                    //show balloon
                    showBalloon(serieIndex, balloonContent);
                } catch (e) { }
            });
        }

        //hides balloon
        function hideBalloons() {
            /// <summary>
            /// Hides balloon.
            /// </summary>
            //iterate all series
            axis.series.each(function (serie, serieIndex) {
                //hide serie balloon
                eve('#' + chart.id + '_balloon_serie_' + serieIndex).style('display', 'none');
            });
        };

        //shows balloons
        function showBalloon(serieIndex, content) {
            /// <summary>
            /// Shows balloon with given content.
            /// </summary>
            /// <param name="content"></param>
            /// <param name="data"></param>

            //check whether the arguments
            if (content == null) hideBalloons();

            //check whther the balloon enabled
            if (!chart.balloon.enabled) hideBalloons();

            //get serie balloon
            var balloon = eve('#' + chart.id + '_balloon_serie_' + serieIndex);

            //set balloon content
            balloon.html(content); balloon.style('display', 'block');

            //get balloon height
            var balloonHeight = balloon.offset().height * serieIndex + 5;

            //set balloon postion and show
            balloon.style('left', (d3.event.pageX + 5) + 'px');
            balloon.style('top', (d3.event.pageY + balloonHeight + (serieIndex > 0 ? 5 : 0)) + 'px');
        };
    };

    //set eve charts create line chart method
    eveCharts.line = function (options) {
        /// <summary>
        /// Creates a new line chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //create chart object
            var line = new lineChart(new this.configurator(options));

            //add chart instance
            if (line !== null)
                this.instances[line.id] = line;

            //return new chart object
            return line;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts);