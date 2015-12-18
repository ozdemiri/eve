/*!
 * eve.bubble.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Bubble chart class.
 */
(function(e) {
    //define default options
    var defaults = {
        bullet: 'none',
        bulletAlpha: .5,
        bulletColor: '',
        bulletSize: 8,
        bulletStrokeSize: 1,
        bulletStrokeAlpha: 1,
        color: '',
        dateFormat: '',
        labelFontColor: '#333333',
        labelFontFamily: 'Tahoma',
        labelFontSize: 10,
        labelFontStyle: 'normal',
        labelFormat: '',
        maxBulletSize: 50,
        minBulletSize: 5,
        numberFormat: '',
        title: '',
        type: 'bubble',
        yField: ''
    };

    //bubble chart class
    function bubble(options) {
        //check whether the options has series
        if(options.series == null && e.getType(options.series) !== 'array') {
            throw new Error('Invalid chart series!');
        }

        //iterate all series in options to extend them
        for(var i=0; i<options.series.length; i++) {
            //extend current serie with defaults
            e.extend(options.series[i], defaults);
        }

        //create chart
        var that = this,
            chart = e.charts.init(options),
            axis = e.charts.createAxis(chart),
            bubbleSeries, bulletF;

        //initializes bubble chart
        function init() {
            //create bullet function
            bulletF = d3.svg.symbol().type(function(d) {
                return chart.series[d.index].bullet === 'none' ? 'circle' : chart.series[d.index].bullet;
            }).size(function(d) {
                //get axis serie
                var chartSerie = chart.series[d.index];
                var axisSerie = axis.series[d.index];

                //check whether the chartSerie has sizeField
                if (chartSerie.sizeField !== '') {
                    //calculate bullet size
                    var axisSerieRange = axisSerie.maxSize - axisSerie.minSize,
                        chartSerieRange = chartSerie.maxBulletSize - chartSerie.minBulletSize,
                        bulletSize = d.sizeValue / axisSerieRange * chartSerieRange - (axisSerie.minSize / axisSerieRange * chartSerieRange) + chartSerie.minBulletSize;

                    //return calculated bullet size
                    return Math.pow(bulletSize, 2);
                } else {
                    //return default bullet size
                    return Math.pow(chartSerie.bulletSize, 2);
                }
            });

            //set default balloon format
            if(chart.balloon.format === '')
                chart.balloon.format = 'x: {x}: y: {y}, size: {size}';

            //create gradient
            var grads = chart.svg.append('defs').selectAll('radialGradient')
                .data(axis.series)
                .enter().append('radialGradient')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', '100%')
                .attr('id', function (d, i) { return 'eve-grad-' + i; })

            //append stops in grads
            grads.append('stop').attr('offset', '10%').attr('stop-color', '#ffffff');
            grads.append('stop').attr('offset', '100%').attr('stop-color', function (d, i) {
                //check whether the serie has color
                if (chart.series[i].color === '')
                    return i <= e.colors.length ? e.colors[i] : e.randColor();
                else
                    return chart.series[i].color;
            });

            //create bubble series
            bubbleSeries = chart.svg.selectAll('.eve-series')
                .data(axis.series)
                .enter().append('g')
                .attr('class', 'eve-series');

            //set serie labels
            bubbleSeries.selectAll('.eve-bubble-label')
                .data(function(d) { return d.values; })
                .enter().append('text')
                .attr('class', function (d, i) {
                    return 'eve-bubble-label eve-bubble-label-' + i;
                })
                .style('cursor', 'pointer')
                .style('fill', function(d, i) { return chart.series[d.index].labelFontColor; })
                .style('font-weight', function(d, i) { return chart.series[d.index].labelFontStyle == 'bold' ? 'bold' : 'normal'; })
                .style('font-style', function(d, i) { return chart.series[d.index].labelFontStyle == 'bold' ? 'normal' : chart.series[d.index].labelFontStyle; })
                .style("font-family", function(d, i) { return chart.series[d.index].labelFontFamily; })
                .style("font-size", function(d, i) { return chart.series[d.index].labelFontSize + 'px'; })
                .style('text-anchor', 'middle')
                .text(function(d, i) {
                    //check whether the label format is enabled
                    if(chart.series[d.index].labelFormat != '')
                        return chart.getXYFormat(d, chart.series[d.index], 'label');
                })
                .attr('transform', function(d) {
                    //get axis serie
                    var chartSerie = chart.series[d.index];
                    var axisSerie = axis.series[d.index];
                    var labelHeightPos = 0;
                    var bulletSize = 0;

                    //check whether the chartSerie has sizeField
                    if (chartSerie.sizeField !== '') {
                        //calculate bullet size
                        var axisSerieRange = axisSerie.maxSize - axisSerie.minSize,
                            chartSerieRange = chartSerie.maxBulletSize - chartSerie.minBulletSize;
                    
                        //set bullet size
                        bulletSize = d.sizeValue / axisSerieRange * chartSerieRange - (axisSerie.minSize / axisSerieRange * chartSerieRange) + chartSerie.minBulletSize;

                        //return calculated bullet size
                        labelHeightPos = bulletSize / 2;
                    } else {
                        //return default bullet size
                        labelHeightPos = chartSerie.bulletSize / 2;
                    }

                    //return translated label positions
                    return 'translate(' + (axis.x(d.xValue) + axis.offset.left) + ',' + (axis.y(d.yValue) - labelHeightPos - (chart.series[d.index].labelFontSize / 2) - bulletSize) + ')';
                });

            //append serie points
            bubbleSeries.selectAll('.eve-bubble-point')
                .data(function (d) { return d.values; })
                .enter().append('path')
                .attr('class', function (d, i) {
                    if (d.yValue === 0)
                        return 'eve-bubble-point-null eve-bubble-point-null-' + d.index;
                    else
                        return 'eve-bubble-point eve-bubble-point-' + d.index;
                })
                .attr('d', function (d) { return bulletF(d); })
                .style('cursor', 'pointer')
                .style('fill', function (d) {
                    return 'url(#eve-grad-' + d.index + ')';
                })
                .style('stroke', function (d) {
                    //check whether the serie has color
                    if (chart.series[d.index].color === '')
                        return d.index <= e.colors.length ? e.colors[d.index] : e.randColor();
                    else
                        return chart.series[d.index].color;
                })
                .style('stroke-width', function (d) { return chart.series[d.index].bulletStrokeSize + 'px'; })
                .style('stroke-opacity', function (d) {
                    if (d.yValue === 0) return 0;
                    return chart.series[d.index].bulletStrokeAlpha;
                })
                .style('stroke-dasharray', 0)
                .style('fill-opacity', function (d) {
                    if (d.yValue === 0) return 0;
                    return chart.series[d.index].bulletAlpha;
                })
                .attr('transform', function (d) {
                    //declare needed variables
                    var chartSerie = chart.series[d.index];
                    var axisSerie = axis.series[d.index];
                    var bulletSize = 0;
                
                    //check size field
                    if (chartSerie.sizeField !== '') {
                        //calculate bullet size
                        var axisSerieRange = axisSerie.maxSize - axisSerie.minSize,
                            chartSerieRange = chartSerie.maxBulletSize - chartSerie.minBulletSize;
                    
                        //set bullet size
                        bulletSize = d.sizeValue / axisSerieRange * chartSerieRange - (axisSerie.minSize / axisSerieRange * chartSerieRange) + chartSerie.minBulletSize;
                    }
                
                    //check x axis data type
                    if(axis.xAxisDataType === 'string')
                        return 'translate(' + (axis.x(d.xValue) + axis.offset.left + (axis.x.rangeBand() / 2)) + ',' + (axis.y(d.yValue) - bulletSize / 2) + ')';
                    else
                        return 'translate(' + (axis.x(d.xValue) + axis.offset.left) + ',' + (axis.y(d.yValue) - bulletSize / 2) + ')';
                })
                .on('mousemove', function (d, i) {
                    if (d.yValue === 0) return null;
                    var balloonContent = chart.getXYFormat(d, chart.series[d.index]);

                    //show balloon
                    chart.showBalloon(balloonContent);

                    //increase bullet stroke size
                    d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize + 1);
                })
                .on('mouseout', function(d, i) {
                    //hide balloon
                    chart.hideBalloon();

                    //increase bullet stroke size
                    d3.select(this).style('stroke-width', chart.series[d.index].bulletStrokeSize);
                });
        }

        //init bubble chart
        init();

        //return chart object
        return chart;
    };

    //attach bubble method into eve
    e.bubbleChart = function(options) {
        //set chart type
        options.type = 'bubble';

        return new bubble(options);
    };
})(eve);
