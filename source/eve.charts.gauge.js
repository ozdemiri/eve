/*!
 * eve.charts.gauge.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Gauge chart class.
 */
(function (eveCharts) {
    //gauge creator class
    function gaugeChart(chart) {
        //declare gauge variables
        var plot = chart.plot,
            serie = chart.series[0],
            baseValue = serie.value,
            trendHeight = chart.trends.length > 0 ? serie.trendHeight : 0,
            size = Math.min(plot.width - chart.margin.left - chart.margin.right, plot.height - chart.margin.top - chart.margin.bottom),
            percentValue = getPercent(serie.value),
            minValue = chart.formatNumber(serie.min),
            maxValue = chart.formatNumber(serie.max),
            range = serie.max - serie.min,
            majorDelta = range / (serie.majorTicks - 1),
            radius, innerRadius, btx, bty, titleTextSize, handleTextSize, valueTextSize, labelTextSize,
            matchTrend = null,
            gaugeValueHandle = null,
            gaugeValueHandleCircle = null,
            gaugeValueText = null,
            standardGaugeArc = null,
            standardGaugeInnerArc = null,
            base = this;

        //check serie to handle errors
        if (serie.type !== 'gauge') {
            throw new Error('Serie type mistmatch! When creating a gauge chart, serie type should be set as "gauge"...');
            return null;
        }

        //create an internal function to get percentage value
        function getPercent(value) {
            //declare range and calculate percent
            var percent = value / range * 100 - (serie.min / range * 100);

            //return percent
            return percent;
        };

        //create an internal function to handle standard gauge animation
        function standardGaugeTween(b) {
            var interpolated = d3.interpolate(0, b);
            return function (t) {
                return standardGaugeInnerArc(interpolated(t));
            }
        };

        //create an internal function to convert given value to degrees
        function convertToDegrees(val) {
            return val / range * 270 - (serie.min / range * 270 + 45);
        };

        //create an internal function to convert given value to radians
        function convertToRadians(val) {
            return convertToDegrees(val) * Math.PI / 180;
        };

        //create an internal function to convert given value to point with the given factor
        function convertToPoint(val, factor) {
            return {
                x: btx - radius * factor * Math.cos(convertToRadians(val)),
                y: bty - radius * factor * Math.sin(convertToRadians(val))
            };
        };

        //create an internal function to create needle svg path
        function getNeedlePath(val) {
            //Declare variables
            var _delta = range / 13,
                _head = valueToPoint(val, 0.85),
                _head1 = valueToPoint(val - _delta, 0.12),
                _head2 = valueToPoint(val + _delta, 0.12),
                _tailValue = val - (range * (1 / (270 / 360)) / 2),
                _tail = valueToPoint(_tailValue, 0.28),
                _tail1 = valueToPoint(_tailValue - _delta, 0.12),
                _tail2 = valueToPoint(_tailValue + _delta, 0.12);

            //declare internal value to point function
            function valueToPoint(value, factor) {
                var point = convertToPoint(value, factor);
                point.x -= btx;
                point.y -= bty;
                return point;
            }

            //Return path
            return [_head, _head1, _tail2, _tail, _tail1, _head2, _head];
        };

        //create an internal function to init gauge
        function initGauge() {
            //re-calculate gauge variables
            size = Math.min(plot.width - chart.margin.left - chart.margin.right, plot.height - chart.margin.top - chart.margin.bottom);
            percentValue = getPercent(baseValue);
            minValue = chart.formatNumber(serie.min);
            maxValue = chart.formatNumber(serie.max);
            range = serie.max - serie.min;
            majorDelta = range / (serie.majorTicks - 1);

            //calculate radius and text sizes by gauge behavior
            switch (serie.behavior) {
                case 'standard':
                    {
                        //set standard gauge variables
                        radius = (size - trendHeight) / 2;
                        innerRadius = serie.innerRadius == 0 ? (radius / 2) : serie.innerRadius;
                        btx = (plot.width + chart.margin.left - chart.margin.right - trendHeight) / 2;
                        bty = (plot.height + chart.margin.top - chart.margin.bottom + innerRadius) / 2;
                        titleTextSize = radius / 4;
                        handleTextSize = titleTextSize * .5;
                        labelTextSize = titleTextSize * .4;
                        valueTextSize = titleTextSize * .9;
                    }
                    break;
                case 'dial':
                    {
                        //set dial gauge variables
                        radius = size / 2;
                        btx = (plot.width + chart.margin.left - chart.margin.right) / 2;
                        bty = (plot.height + chart.margin.top - chart.margin.bottom) / 2;
                        titleTextSize = size / 12;
                        handleTextSize = size / 20;
                        labelTextSize = size / 20;
                        valueTextSize = size / 11;
                    }
                    break;
            }

            //create arc functions
            standardGaugeArc = d3.svg.arc().outerRadius(radius).innerRadius(innerRadius).startAngle(0).endAngle(Math.PI);
            standardGaugeInnerArc = d3.svg.arc().outerRadius(radius).innerRadius(innerRadius).startAngle(0).endAngle(function (d) { return d / 100 * Math.PI });

            //switch behavior
            switch (serie.behavior) {
                case 'standard':
                    initStandard();
                    break;
                case 'dial':
                    initDial();
                    break;
            }

            //update gauge
            update(baseValue);
        }

        //create an internal function to init standard gauge
        function initStandard() {
            //set min handle
            var minHandle = plot.canvas.append('text')
                .text(minValue)
                .style('fill', serie.handleFontColor)
                .style('font-size', handleTextSize + 'px')
                .style('font-family', serie.handleFontFamily)
                .style('font-style', serie.handleFontStyle == 'bold' ? 'normal' : serie.handleFontStyle)
                .style('font-weight', serie.handleFontStyle == 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'start')
                .attr('x', function (d) { return btx - radius; })
                .attr('y', function (d) { return bty + this.getBBox().height; });

            //set max handle
            var maxHandle = plot.canvas.append('text')
                .text(maxValue)
                .style('fill', serie.handleFontColor)
                .style('font-size', handleTextSize + 'px')
                .style('font-family', serie.handleFontFamily)
                .style('font-style', serie.handleFontStyle == 'bold' ? 'normal' : serie.handleFontStyle)
                .style('font-weight', serie.handleFontStyle == 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'end')
                .attr('x', function (d) { return btx + radius + trendHeight; })
                .attr('y', function (d) { return bty + this.getBBox().height; });

            //Create back circle
            var backCircle = plot.canvas.append('path')
                .attr('transform', 'translate(' + btx + ',' + bty + ')rotate(270)')
                .style('fill', serie.gaugeBackColor)
                .style('stroke', serie.gaugeBorderColor)
                .style('stroke-width', serie.gaugeBorderSize + 'px')
                .attr('d', standardGaugeArc);

            //Set trends
            chart.trends.each(function (trend) {
                //Calculate trend angles
                var trendStartAngle = trend.start / serie.max * Math.PI;
                var trendEndAngle = trend.end / serie.max * Math.PI;
                var trendArc = d3.svg.arc().outerRadius(radius + trendHeight).innerRadius(radius).startAngle(trendStartAngle).endAngle(trendEndAngle);

                //Create trend circle
                var trendCircle = plot.canvas.append('path')
                    .attr('transform', 'translate(' + btx + ',' + bty + ')rotate(270)')
                    .style('fill', trend.color)
                    .attr('d', trendArc)
                    .on('mousemove', function (d) {
                        //set balloon content
                        var balloonContent = trend.balloonFormat.replaceAll('{{title}}', trend.title).replaceAll('{{start}}', chart.formatNumber(trend.start))
                            .replaceAll('{{end}}', chart.formatNumber(trend.end)).replaceAll('{{value}}', chart.formatNumber(baseValue)).replaceAll('{{percent}}', percentValue);

                        //set balloon border color
                        plot.balloon.style('borderColor', trend.color);

                        //show balloon
                        chart.showBalloon(balloonContent);
                    })
                    .on('mouseout', function (d) {
                        //hide bubble
                        chart.hideBalloon();
                    });
            });

            //create value circle
            gaugeValueHandle = plot.canvas.append('path')
                .attr('transform', 'translate(' + btx + ',' + bty + ')rotate(270)')
                .style('fill', serie.color)
                .on('mousemove', function (d) {
                    //set balloon content
                    var balloonData = {
                        value: baseValue,
                        percent: percentValue,
                        max: serie.max,
                        min: serie.min,
                        trend: matchTrend
                    };
                    var balloonContent = chart.setBalloonContent({
                        data: balloonData,
                        dataIndex: 0,
                        format: chart.balloon.format,
                        serie: serie,
                        type: 'gauge'
                    });
                    //formatValue(chart.balloon.format, balloonData);

                    //set balloon border color
                    plot.balloon.style('borderColor', serie.color);

                    //show balloon
                    chart.showBalloon(balloonContent);
                })
                .on('mouseout', function (d) {
                    //hide bubble
                    chart.hideBalloon();
                });;

            //create value handle
            gaugeValueText = plot.canvas.append('text')
                .style('fill', serie.handleFontColor)
                .style('text-anchor', 'middle')
                .style('font-family', serie.handleFontFamily)
                .style('font-style', serie.handleFontStyle == 'bold' ? 'normal' : serie.handleFontStyle)
                .style('font-weight', serie.handleFontStyle == 'bold' ? 'bold' : 'normal')
                .style('font-size', valueTextSize + 'px');

            //check whether the gauge has label
            if (serie.label.trim() != '') {
                //set label
                plot.canvas.append('text').text(serie.label)
                    .style('fill', serie.labelFontColor)
                    .style('font-family', serie.labelFontFamily)
                    .style('text-anchor', 'middle')
                    .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                    .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                    .attr('x', (plot.width + trendHeight) / 2)
                    .attr('y', bty + valueTextSize / 2);
            }
        };

        //create an internal function to init dial gauge
        function initDial() {
            //create top circle
            var topCircle = plot.canvas.append('circle').attr('cx', btx).attr('cy', bty).attr('r', radius)
                .style('fill', serie.gaugeBackColor).style('stroke', serie.gaugeBorderColor).style('stroke-width', serie.gaugeBorderSize + 'px');

            //create inner circle
            var innerCircle = plot.canvas.append('circle').attr('cx', btx).attr('cy', bty).attr('r', radius * 0.9)
                .style('fill', serie.innerBackColor).style('stroke', serie.innerBorderColor).style('stroke-width', serie.innerBorderSize + 'px');

            //set trends
            chart.trends.each(function (trend) {
                //Calculate trend angles
                var trendStartAngle = convertToRadians(trend.start);
                var trendEndAngle = convertToRadians(trend.end);
                var trendArc = d3.svg.arc().outerRadius(radius * 0.88).innerRadius(radius * 0.8).startAngle(trendStartAngle).endAngle(trendEndAngle);

                //Create trend circle
                var trendCircle = plot.canvas.append('path')
                    .attr('transform', 'translate(' + btx + ',' + bty + ')rotate(270)')
                    .style('fill', trend.color)
                    .attr('d', trendArc)
                    .on('mousemove', function (d) {
                        //set balloon content
                        var balloonContent = trend.balloonFormat.replaceAll('{{title}}', trend.title).replaceAll('{{start}}', chart.formatNumber(trend.start))
                            .replaceAll('{{end}}', chart.formatNumber(trend.end)).replaceAll('{{value}}', chart.formatNumber(baseValue)).replaceAll('{{percent}}', percentValue);

                        //set balloon border color
                        plot.balloon.style('borderColor', trend.color);

                        //show balloon
                        chart.showBalloon(balloonContent);
                    })
                    .on('mouseout', function (d) {
                        //hide bubble
                        chart.hideBalloon();
                    });
            });

            //set major ticks
            for (var major = serie.min; major <= serie.max; major += majorDelta) {
                //set minor delta
                var minorDelta = majorDelta / serie.minorTicks;

                //set minor ticks
                for (var minor = major + minorDelta; minor <= Math.min(major + majorDelta, serie.max) ; minor += minorDelta) {
                    //create minor point
                    var minorPoint1 = convertToPoint(minor, 0.75);
                    var minorPoint2 = convertToPoint(minor, 0.85);

                    //append minor point
                    plot.canvas.append('line')
                        .attr('x1', minorPoint1.x).attr('y1', minorPoint1.y)
                        .attr('x2', minorPoint2.x).attr('y2', minorPoint2.y)
                        .style('stroke', serie.minorTickColor)
                        .style('stroke-width', serie.minorTickSize + 'px');
                }

                //create major points
                var majorPoint1 = convertToPoint(major, 0.7);
                var majorPoint2 = convertToPoint(major, 0.85);

                //append major point
                plot.canvas.append('line')
                    .attr('x1', majorPoint1.x).attr('y1', majorPoint1.y)
                    .attr('x2', majorPoint2.x).attr('y2', majorPoint2.y)
                    .style('stroke', serie.majorTickColor)
                    .style('stroke-width', serie.majorTickSize + 'px');

                //create min and max handles
                if (major == serie.min || major == serie.max) {
                    //create handle point
                    var handlePoint = convertToPoint(major, 0.63);

                    //create handle text
                    plot.canvas.append('text')
                        .attr('x', handlePoint.x)
                        .attr('y', function (d) { return handlePoint.y + handleTextSize; })
                        .attr('dy', handleTextSize / 3)
                        .text(chart.formatNumber(major))
                        .attr('text-anchor', major == serie.max ? 'end' : 'start')
                        .style('fill', serie.handleFontColor)
                        .style('font-family', serie.handleFontFamily)
                        .style('font-style', serie.handleFontStyle == 'bold' ? 'normal' : serie.handleFontStyle)
                        .style('font-weight', serie.handleFontStyle == 'bold' ? 'bold' : 'normal');
                }
            }

            //declare needle variables
            var midVal = (serie.min + serie.max) / 2,
                needlePath = getNeedlePath(midVal),
                needleLine = d3.svg.line().x(function (d) { return d.x; }).y(function (d) { return d.y; }).interpolate('basis');

            //set gauge handle
            gaugeValueHandle = plot.canvas.append('g').selectAll('path')
                .data([needlePath]).enter().append('svg:path')
                .attr('d', needleLine)
                .style('fill', serie.handleColor)
                .style('stroke', serie.handleBorderColor)
                .style('fill-opacity', 0.7)
                .style('stroke-opacity', 0.7)
                .on('mousemove', function (d) {
                    //set balloon content
                    var balloonData = {
                        value: baseValue,
                        percent: percentValue,
                        max: serie.max,
                        min: serie.min,
                        trend: matchTrend
                    };
                    var balloonContent = chart.setBalloonContent({
                        data: balloonData,
                        dataIndex: 0,
                        format: chart.balloon.format,
                        serie: serie,
                        type: 'gauge'
                    });

                    //set balloon border color
                    plot.balloon.style('borderColor', serie.handleColor);

                    //show balloon
                    chart.showBalloon(balloonContent);
                })
                .on('mouseout', function (d) {
                    //hide bubble
                    chart.hideBalloon();
                });;

            //create needle circle
            plot.canvas.append('circle')
                .attr('cx', btx).attr('cy', bty)
                .attr('r', serie.handleCircleSize > radius ? 10 : serie.handleCircleSize)
                .style('fill', serie.handleCircleColor)
                .style('stroke', serie.handleCircleBorderColor);

            //create value handle
            gaugeValueText = plot.canvas.append('text')
                .style('fill', serie.handleFontColor)
                .style('text-anchor', 'middle')
                .style('font-family', serie.handleFontFamily)
                .style('font-style', serie.handleFontStyle == 'bold' ? 'normal' : serie.handleFontStyle)
                .style('font-weight', serie.handleFontStyle == 'bold' ? 'bold' : 'normal')
                .style('font-size', valueTextSize + 'px');

            //check whether the gauge has label
            if (serie.label.trim() != '') {
                //set label
                plot.canvas.append('text').text(serie.label)
                    .style('fill', serie.labelFontColor)
                    .style('font-family', serie.labelFontFamily)
                    .style('text-anchor', 'middle')
                    .style('font-size', labelTextSize + 'px')
                    .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                    .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                    .attr('x', btx)
                    .attr('y', bty + valueTextSize * 2 + labelTextSize * 2);
            }
        };

        //expose update method
        function update(value) {
            /// <summary>
            /// Updates chart data.
            /// </summary>
            /// <param name="value"></param>
            /// <returns type=""></returns>

            //check whether the value is null
            if (value == null) return null;

            //set this value
            baseValue = value;

            //set percent value
            percentValue = getPercent(value);

            //Iterate all trends
            chart.trends.each(function (trend) {
                //check value is in trend range
                if (baseValue >= trend.start && baseValue <= trend.end)
                    matchTrend = trend;
            });

            //switch behavior
            switch (serie.behavior) {
                case 'standard':
                    {
                        //animate inner circle to visualize value
                        gaugeValueHandle.transition().ease('linear').duration(chart.animationDuration)
                            .attrTween('d', function () {
                                return standardGaugeTween(percentValue);
                            });

                        //set value
                        gaugeValueText.text(chart.formatNumber(value))
                            .attr('x', (plot.width + trendHeight) / 2)
                            .attr('y', bty);
                    }
                    break;
                case 'dial':
                    {
                        //animate needle
                        gaugeValueHandle.transition().duration(chart.animationDuration)
                            .attrTween('transform', function () {
                                //set needle value
                                var needleValue = value;

                                //check range
                                if (baseValue > serie.max)
                                    needleValue = serie.max + 0.02 * range;
                                else if (baseValue < serie.min)
                                    needleValue = serie.min - 0.02 * range;

                                //set target position
                                var target = (convertToDegrees(needleValue) - 90);
                                var current = this._current || target;

                                //set this current
                                this._current = target;

                                //return transition
                                return function (step) {
                                    //Get pos
                                    var pos = current + (target - current) * step;

                                    //Return transformation
                                    return 'translate(' + btx + ',' + bty + ')rotate(' + pos + ')';
                                };
                            });

                        //set value
                        gaugeValueText.text(chart.formatNumber(value))
                            .attr('x', function (d) { return btx; })
                            .attr('y', function (d) { return bty + (radius * 0.12) + this.getBBox().height + valueTextSize / 2; });
                    }
                    break;
            }
        };

        //init gauge
        initGauge(baseValue);

        //return chart
        return chart;
    };


    //set eve charts create gauge chart method
    eveCharts.gauge = function (options) {
        /// <summary>
        /// Creates a new gauge chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'gauge';
                });
            }

            //create chart object
            var gauge = gaugeChart(new this.configurator(options));

            //add chart instance
            if (gauge !== null)
                this.instances[gauge.id] = gauge;

            //return new chart object
            return gauge;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts);