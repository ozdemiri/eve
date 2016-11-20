/*!
 * eve.line.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for line chart.
 */
(function (e) {
    //define line chart class
    function lineChart(options) {
        //remove stack
        if(options.yAxis) {
            options.yAxis.stacked = false;
        } else {
            options.yAxis = {
                stacked: false
            };
        }
        
        //declare needed variables
        var that = this,
            chart = eve.base.init(options),
            axis = eve.base.createAxis(chart),
            currentSerie = null,
            currentDataSet = null,
            lineSeries = null,
            lines = null,
            xField = chart.xField,
            groupName = '',
            tooltipContent = '',
            diffMinBase = 0,
            lineF = null,
            bulletF = null,
            lineLabels = null;

        //create chart g
        var chartG = chart.svg.append('g')
            .attr('transform', 'translate(' + chart.plot.left + ',' + chart.plot.top + ')');

        //create bullet function
        bulletF = d3.symbol().type(function (d) {
            return chart.series[d._serieIndex].bullet === 'none' ? d3.symbolCircle : chart.series[d._serieIndex].bullet.toSymbol();
        }).size(function (d) {
            return Math.pow(chart.series[d._serieIndex].bulletSize, 2);
        });

        //create line function
        lineF = d3.line()
            .x(function (d) {
                if (chart.xFieldDataType === 'string')
                    return axis.xScale(d[chart.xField]) + axis.xScale.bandwidth() / 2;
                return axis.xScale(d[chart.xField]);
            })
            .y(function (d) {
                return chart.plot.height;
            });

        //animates line
        function animateLines() {
            //calculate diff min base
            diffMinBase = Math.abs(axis.yScale(0) - axis.yScale(chart.domains.y[0]));

            //create line function
            lineF = d3.line()
                .x(function (d) {
                    if (chart.xFieldDataType === 'string')
                        return axis.xScale(d[chart.xField]) + axis.xScale.bandwidth() / 2;
                    return axis.xScale(d[chart.xField]);
                })
                .y(function (d) {
                    return axis.yScale(d[chart.serieNames[d._serieIndex]]);
                });

            //transform lines
            lineSeries.selectAll('path')
                .transition(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .delay(function (d, i) {
                    return i * chart.animation.delay;
                })
                .attr('d', lineF);

            //transform bullets
            chart.series.forEach(function (currentSerie, serieIndex) {
                //select current serie bullets
                chartG.selectAll('.eve-line-bullet-' + serieIndex)
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * chart.animation.delay; })
                    .attr('transform', function (d) { return getBulletTransform(d, false); });
            });
        }

        //gets bullet transform
        function getBulletTransform(d, isInit) {
            //declare x and y positions
            var xPos = 0,
                yPos = 0,
                serie = chart.series[d._serieIndex];

            //set x position
            if (chart.xFieldDataType === 'string')
                xPos = axis.xScale(d[chart.xField]) + axis.xScale.bandwidth() / 2;
            else
                xPos = axis.xScale(d[chart.xField]);

            //set y position
            yPos = isInit ? chart.plot.height : axis.yScale(d[chart.serieNames[d._serieIndex]]);

            //check bullet
            if (serie.bullet.indexOf('image:') > -1) {
                xPos -= serie.bulletSize / 2;
                yPos -= serie.bulletSize / 2;
            }

            //return translation
            return 'translate(' + xPos + ',' + yPos + ')';
        }

        //updates data series
        function updateDataSeries() {
            //sort data
            chart.data.sort(function (a, b) {
                return ((a[chart.xField] < b[chart.xField]) ? -1 : ((a[chart.xField] > b[chart.xField]) ? 1 : 0));
            });

            //create new chart data
            currentDataSet = [];

            //iterate all chart series
            chart.serieNames.forEach(function (serieName, serieIndex) {
                //declare serie data
                var serieData = [];

                //iterate chart data to set values
                chart.data.forEach(function (d, i) {
                    //iterate keys
                    for (var key in d) {
                        //update chart data
                        d._serieIndex = serieIndex;

                        //check whether the key is serie
                        if (key === serieName)
                            serieData.push(e.clone(d));
                    }
                });

                //set serie data index
                serieData.index = serieIndex;
                serieData.name = serieName;

                //push the current serie data into the current dataset
                currentDataSet.push(serieData);
            });

            //calculate diff min base
            diffMinBase = Math.abs(axis.yScale(0) - axis.yScale(chart.domains.y[0]));

            //create chart series
            currentSerie = null;
        }

        //update data sereis
        updateDataSeries();

        //create line series
        lineSeries = chartG.selectAll('.eve-line-serie')
            .data(currentDataSet)
            .enter().append('g')
            .attr('class', 'eve-line-serie');

        //create lines
        lines = lineSeries.append('path')
            .attr('d', lineF)
            .attr('fill', 'none')
            .attr('stroke', function (d, i) {
                //set current serie
                currentSerie = chart.series[d.index];

                //check columns to set fill color
                if (currentSerie.colorField && currentSerie.colorField !== '')
                    return d.data[currentSerie.colorField];
                else
                    return currentSerie.sliceStrokeColor;
            })
            .attr('stroke-opacity', 1)
            .style('stroke-dasharray', function (d, i) {
                //set current serie
                currentSerie = chart.series[d.index];

                //check whether the serie line drawing style
                if (currentSerie.drawingStyle === 'dotted')
                    return '2, 2';
                else if (currentSerie.drawingStyle === 'dashed')
                    return '5, 2';
                else
                    return '0';
            })
            .attr('stroke-width', function (d, i) { return chart.series[d.index].sliceStrokeThickness < 1 ? 1 : chart.series[d.index].sliceStrokeThickness; });

        //iterate all data
        chart.series.forEach(function (currentSerie, serieIndex) {
            //check whether the current serie bullet is not image
            if (currentSerie.bullet.indexOf('image:') === -1) {
                //create line bullets
                chartG.selectAll('.eve-line-bullet-' + serieIndex)
                    .data(currentDataSet[serieIndex])
                    .enter().append('path')
                    .attr('class', 'eve-line-bullets eve-line-bullet-' + serieIndex)
                    .attr('d', bulletF)
                    .attr('fill-opacity', currentSerie.showBullets ? currentSerie.bulletAlpha : 0)
                    .attr('stroke-opacity', currentSerie.bulletStrokeAlpha)
                    .attr('stroke-width', currentSerie.bulletStrokeSize)
                    .attr('fill', function (d, i) {
                        //check columns to set fill color
                        if (currentSerie.colorField && currentSerie.colorField !== '')
                            return d.data[currentSerie.colorField];
                        else if (currentSerie.bulletColor && currentSerie.bulletColor !== '')
                            return d.data[currentSerie.bulletColor];
                        else
                            return currentSerie.color;
                    })
                    .attr('transform', function (d) { return getBulletTransform(d, true); })
                    .on('click', function (d) {
                        if (chart.sliceClick)
                            chart.sliceClick(d.data);
                    })
                    .on('mousemove', function (d, i) {
                        //set slice hover
                        d3.select(this).attr('fill-opacity', currentSerie.sliceHoverAlpha);

                        //show tooltip
                        chart.showTooltip(chart.getContent(d, currentSerie, chart.tooltip.format));
                    })
                    .on('mouseout', function (d, i) {
                        //set slice hover
                        d3.select(this).attr('fill-opacity', currentSerie.alpha);

                        //hide tooltip
                        chart.hideTooltip();
                    });
            } else {
                //create line bullets
                chartG.selectAll('.eve-line-bullet-' + serieIndex)
                    .data(currentDataSet[serieIndex])
                    .enter().append('svg:image')
                    .attr('class', 'eve-line-bullets eve-line-bullet-' + serieIndex)
                    .attr('xlink:href', currentSerie.bullet.replace('image:', ''))
                    .attr('width', currentSerie.bulletSize)
                    .attr('height', currentSerie.bulletSize)
                    .attr('transform', function (d) {
                        return getBulletTransform(d, true);
                    })
                    .on('mousemove', function (d, i) {
                        //set current serie
                        groupName = currentSerie.title === '' ? currentSerie.yField : currentSerie.title;
                        tooltipContent = chart.tooltip.format.replaceAll('{x}', d[xField]).replaceAll('{y}', d[currentSerie.yField]).replaceAll('{group}', groupName);

                        //show tooltip
                        chart.showTooltip(tooltipContent);
                    })
                    .on('mouseout', function (d, i) {
                        //hide tooltip
                        chart.hideTooltip();
                    });
            }
        });

        //animate columns
        animateLines(true);

        //add update function to chart
        chart.update = function (data) {
            //update chart data
            chart.data = data;

            //update data series
            updateDataSeries();

            //update xy domain
            axis.updateAxis();
            chart.updateLegend();

            //update svg data
            lineSeries.data(currentDataSet).exit().remove();
            lines.data(currentDataSet).exit().remove();

            //iterate all stacked data
            chart.series.forEach(function (currentSerie, serieIndex) {
                //create line bullets
                chartG.selectAll('.eve-line-bullet-' + serieIndex).data(currentDataSet[serieIndex]).exit().remove();
            });

            //animate columns
            animateLines(false);
        };

        //draws the chart into a canvas
        chart.toCanvas = function () {
            //get the chart container
            var orgDiv = document.getElementById(chart.container);
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
        chart.toImage = function () {
            //get the chart container
            var orgDiv = document.getElementById(chart.container);
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

        //return column chart
        return chart;
    }

    //attach line chart method into the eve
    e.lineChart = function (options) {
        options.type = 'xy';
        return new lineChart(options);
    };
})(eve);