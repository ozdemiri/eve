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
    //gauge chart creator class
    function gaugeChart(chart) {
        //declare gauge variables
        var plot = eve.charts.createPlot(chart),
            serie = chart.series[0],
            trendHeight = chart.trends.length > 0 ? serie.trendHeight : 0,
            size = Math.min(plot.width - chart.margin.left - chart.margin.right, plot.height - chart.margin.top - chart.margin.bottom),
            percentValue = getPercent(serie.value),
            minValue = plot.formatNumber(serie.min),
            maxValue = plot.formatNumber(serie.max),
            range = serie.max - serie.min,
            majorDelta = range / (serie.majorTicks - 1),
            radius, innerRadius, btx, bty, titleTextSize, handleTextSize, valueTextSize, labelTextSize,
            matchTrend = null,
            gaugeValueHandle = null,
            gaugeValueHandleCircle = null,
            gaugeValueText = null;

        //check serie to handle errors
        if (serie.type !== 'gauge') {
            throw new Error('Serie type mistmatch! When creating a gauge chart, serie type should be set as "gauge"...');
            return null;
        }

        //append balloon div into the document
        eve(document.body).append('<div id="' + chart.id + '_balloon" class="eve-balloon"></div>');

        //set balloon as eve object
        var balloon = eve('#' + chart.id + '_balloon');

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

        //set this data
        this.value = serie.value;

        //calculate radius and text sizes by gauge behavior
        switch (serie.behavior) {
            case 'standard':
                {
                    //set standard gauge variables
                    radius = (size - trendHeight) / 2;
                    innerRadius = serie.innerRadius == 0 ? (radius / 2) : serie.innerRadius;
                    btx = (plot.width + chart.margin.left + chart.margin.right - trendHeight) / 2;
                    bty = (plot.height + chart.margin.top + chart.margin.bottom + innerRadius) / 2;
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
                    btx = (plot.width + chart.margin.left + chart.margin.right) / 2;
                    bty = (plot.height + chart.margin.top + chart.margin.bottom) / 2;
                    titleTextSize = size / 12;
                    handleTextSize = size / 20;
                    labelTextSize = size / 20;
                    valueTextSize = size / 11;
                }
                break;
        }

        //create arc functions
        var standardGaugeArc = d3.svg.arc().outerRadius(radius).innerRadius(innerRadius).startAngle(0).endAngle(Math.PI);
        var standardGaugeInnerArc = d3.svg.arc().outerRadius(radius).innerRadius(innerRadius).startAngle(0).endAngle(function (d) { return d / 100 * Math.PI });

        //get percent value
        function getPercent(value) { return Math.round((value - serie.min) / serie.max * 100); }

        //Create a tween for arc
        function standardGaugeTween(b) {
            var interpolated = d3.interpolate(0, b);
            return function (t) {
                return standardGaugeInnerArc(interpolated(t));
            }
        }

        //Converts value to degrees
        function convertToDegrees(val) {
            return val / range * 270 - (serie.min / range * 270 + 45);
        }

        //Converts value to radians
        function convertToRadians(val) {
            return convertToDegrees(val) * Math.PI / 180;
        }

        //Converts value to point
        function convertToPoint(val, factor) {
            return {
                x: btx - radius * factor * Math.cos(convertToRadians(val)),
                y: bty - radius * factor * Math.sin(convertToRadians(val))
            };
        }

        //Gets needle path
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
        }

        //formats value
        function formatValue(value, data) {
            //handle errors
            if (arguments.length === 0) return '';
            if (value == null || data == null) return '';

            //declare format variables
            var formatted = value;
                
            //convert value
            formatted = formatted.replaceAll('{{value}}', plot.formatNumber(data.value));

            //convert percent
            formatted = formatted.replaceAll('{{percent}}', '%' + data.percent);

            //convert max
            formatted = formatted.replaceAll('{{max}}', plot.formatNumber(data.max));

            //convert min
            formatted = formatted.replaceAll('{{min}}', plot.formatNumber(data.min));

            //check whether the data trend is not null
            if (data.trend != null) {
                //convert trend title
                formatted = formatted.replaceAll('{{trendTitle}}', data.trend.title);

                //convert trend start
                formatted = formatted.replaceAll('{{trendStart}}', plot.formatNumber(data.trend.start));

                //convert trend end
                formatted = formatted.replaceAll('{{trendEnd}}', plot.formatNumber(data.trend.end));
            }

            //return formatted content
            return formatted;
        };

        //set base object
        var base = this;

        //create canvas
        var canvas = d3.select(plot.container.reference).append('svg')
            .attr('width', plot.width).attr('height', plot.height);

        //inits standard gauge
        function initStandard() {
            //set min handle
            var minHandle = canvas.append('text')
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
            var maxHandle = canvas.append('text')
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
            var backCircle = canvas.append('path')
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
                var trendCircle = canvas.append('path')
                    .attr('transform', 'translate(' + btx + ',' + bty + ')rotate(270)')
                    .style('fill', trend.color)
                    .attr('d', trendArc)
                    .on('mousemove', function (d) {
                        //set balloon content
                        var balloonContent = trend.balloonFormat.replaceAll('{{title}}', trend.title).replaceAll('{{start}}', plot.formatNumber(trend.start))
                            .replaceAll('{{end}}', plot.formatNumber(trend.end)).replaceAll('{{value}}', plot.formatNumber(base.value)).replaceAll('{{percent}}', percentValue);

                        //set balloon border color
                        balloon.style('borderColor', trend.color);

                        //show balloon
                        showBalloon(balloonContent);
                    })
                    .on('mouseout', function (d) {
                        //hide bubble
                        hideBalloon();
                    });
            });

            //create value circle
            gaugeValueHandle = canvas.append('path')
                .attr('transform', 'translate(' + btx + ',' + bty + ')rotate(270)')
                .style('fill', serie.color)
                .on('mousemove', function (d) {
                    //set balloon content
                    var balloonData = {
                        value: base.value,
                        percent: percentValue,
                        max: serie.max,
                        min: serie.min,
                        trend: matchTrend
                    };
                    var balloonContent = formatValue(chart.balloon.format, balloonData);

                    //set balloon border color
                    balloon.style('borderColor', serie.color);

                    //show balloon
                    showBalloon(balloonContent);
                })
                .on('mouseout', function (d) {
                    //hide bubble
                    hideBalloon();
                });;

            //create value handle
            gaugeValueText = canvas.append('text')
                .style('fill', serie.handleFontColor)
                .style('text-anchor', 'middle')
                .style('font-family', serie.handleFontFamily)
                .style('font-style', serie.handleFontStyle == 'bold' ? 'normal' : serie.handleFontStyle)
                .style('font-weight', serie.handleFontStyle == 'bold' ? 'bold' : 'normal')
                .style('font-size', valueTextSize + 'px');

            //check whether the gauge has label
            if (serie.label.trim() != '') {
                //set label
                canvas.append('text').text(serie.label)
                    .style('fill', serie.labelFontColor)
                    .style('font-family', serie.labelFontFamily)
                    .style('text-anchor', 'middle')
                    .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                    .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                    .attr('x', (plot.width + trendHeight) / 2)
                    .attr('y', bty + valueTextSize / 2);
            }
        };

        //inits dial gauge
        function initDial() {
            //create top circle
            var topCircle = canvas.append('circle').attr('cx', btx).attr('cy', bty).attr('r', radius)
                .style('fill', serie.gaugeBackColor).style('stroke', serie.gaugeBorderColor).style('stroke-width', serie.gaugeBorderSize + 'px');

            //create inner circle
            var innerCircle = canvas.append('circle').attr('cx', btx).attr('cy', bty).attr('r', radius * 0.9)
                .style('fill', serie.innerBackColor).style('stroke', serie.innerBorderColor).style('stroke-width', serie.innerBorderSize + 'px');

            //set trends
            chart.trends.each(function (trend) {
                //Calculate trend angles
                var trendStartAngle = convertToRadians(trend.start);
                var trendEndAngle = convertToRadians(trend.end);
                var trendArc = d3.svg.arc().outerRadius(radius * 0.88).innerRadius(radius * 0.8).startAngle(trendStartAngle).endAngle(trendEndAngle);

                //Create trend circle
                var trendCircle = canvas.append('path')
                    .attr('transform', 'translate(' + btx + ',' + bty + ')rotate(270)')
                    .style('fill', trend.color)
                    .attr('d', trendArc)
                    .on('mousemove', function (d) {
                        //set balloon content
                        var balloonContent = trend.balloonFormat.replaceAll('{{title}}', trend.title).replaceAll('{{start}}', plot.formatNumber(trend.start))
                            .replaceAll('{{end}}', plot.formatNumber(trend.end)).replaceAll('{{value}}', plot.formatNumber(base.value)).replaceAll('{{percent}}', percentValue);

                        //set balloon border color
                        balloon.style('borderColor', trend.color);

                        //show balloon
                        showBalloon(balloonContent);
                    })
                    .on('mouseout', function (d) {
                        //hide bubble
                        hideBalloon();
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
                    canvas.append('line')
                        .attr('x1', minorPoint1.x).attr('y1', minorPoint1.y)
                        .attr('x2', minorPoint2.x).attr('y2', minorPoint2.y)
                        .style('stroke', serie.minorTickColor)
                        .style('stroke-width', serie.minorTickSize + 'px');
                }

                //create major points
                var majorPoint1 = convertToPoint(major, 0.7);
                var majorPoint2 = convertToPoint(major, 0.85);

                //append major point
                canvas.append('line')
                    .attr('x1', majorPoint1.x).attr('y1', majorPoint1.y)
                    .attr('x2', majorPoint2.x).attr('y2', majorPoint2.y)
                    .style('stroke', serie.majorTickColor)
                    .style('stroke-width', serie.majorTickSize + 'px');

                //create min and max handles
                if (major == serie.min || major == serie.max) {
                    //create handle point
                    var handlePoint = convertToPoint(major, 0.63);

                    //create handle text
                    canvas.append('text')
                        .attr('x', handlePoint.x)
                        .attr('y', function (d) { return handlePoint.y + handleTextSize; })
                        .attr('dy', handleTextSize / 3)
                        .text(plot.formatNumber(major))
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
            gaugeValueHandle = canvas.append('g').selectAll('path')
                .data([needlePath]).enter().append('svg:path')
                .attr('d', needleLine)
                .style('fill', serie.handleColor)
                .style('stroke', serie.handleBorderColor)
                .style('fill-opacity', 0.7)
                .style('stroke-opacity', 0.7)
                .on('mousemove', function (d) {
                    //set balloon content
                    var balloonData = {
                        value: base.value,
                        percent: percentValue,
                        max: serie.max,
                        min: serie.min,
                        trend: matchTrend
                    };
                    var balloonContent = formatValue(chart.balloon.format, balloonData);

                    //set balloon border color
                    balloon.style('borderColor', serie.handleColor);

                    //show balloon
                    showBalloon(balloonContent);
                })
                .on('mouseout', function (d) {
                    //hide bubble
                    hideBalloon();
                });;

            //create needle circle
            canvas.append('circle')
                .attr('cx', btx).attr('cy', bty)
                .attr('r', serie.handleCircleSize > radius ? 10 : serie.handleCircleSize)
                .style('fill', serie.handleCircleColor)
                .style('stroke', serie.handleCircleBorderColor);

            //create value handle
            gaugeValueText = canvas.append('text')
                .style('fill', serie.handleFontColor)
                .style('text-anchor', 'middle')
                .style('font-family', serie.handleFontFamily)
                .style('font-style', serie.handleFontStyle == 'bold' ? 'normal' : serie.handleFontStyle)
                .style('font-weight', serie.handleFontStyle == 'bold' ? 'bold' : 'normal')
                .style('font-size', valueTextSize + 'px');

            //check whether the gauge has label
            if (serie.label.trim() != '') {
                //set label
                canvas.append('text').text(serie.label)
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

        //hides balloon
        function hideBalloon() {
            /// <summary>
            /// Hides balloon.
            /// </summary>
            balloon.style('display', 'none');
        };

        //shows balloon
        function showBalloon(content) {
            /// <summary>
            /// Shows balloon with given content.
            /// </summary>
            /// <param name="content"></param>
            /// <param name="data"></param>

            //check whether the arguments
            if (content == null) hideBalloon();

            //check whther the balloon enabled
            if (!chart.balloon.enabled) hideBalloon();

            //set balloon content
            balloon.html(content);

            //set balloon postion and show
            balloon.style('left', (parseInt(d3.event.pageX) + 5) + 'px');
            balloon.style('top', (parseInt(d3.event.pageY) + 5) + 'px');
            balloon.style('display', 'block');
        };

        //update
        this.update = function (value) {
            //check whether the value is null
            if (value == null) return null;

            //set this value
            this.value = value;

            //set percent value
            percentValue = getPercent(value);

            //Iterate all trends
            chart.trends.each(function (trend) {
                //check value is in trend range
                if (base.value >= trend.start && base.value <= trend.end)
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
                        gaugeValueText.text(plot.formatNumber(value))
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
                                if (base.value > serie.max)
                                    needleValue = serie.max + 0.02 * range;
                                else if (base.value < serie.min)
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
                        gaugeValueText.text(plot.formatNumber(value))
                            .attr('x', function (d) { return btx; })
                            .attr('y', function (d) { return bty + (radius * 0.12) + this.getBBox().height + valueTextSize / 2; });
                    }
                    break;
            }
        };

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
        this.update(serie.value);
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
            //create chart object
            var gauge = new gaugeChart(new this.configurator(options));

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