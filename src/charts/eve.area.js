/*!
 * eve.area.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for area chart.
 */
(function (e) {
    //define area chart class
    function areaChart(options) {
        //declare needed variables
        var that = this,
            chart = eve.base.init(options),
            stack = d3.stack(),
            axis = eve.base.createAxis(chart),
            stackedData = null,
            currentSerie = null,
            currentDataSet = null,
            areaSeries = null,
            areaPolygons = null,
            areaBullets = null,
            xField = chart.xField,
            groupName = '',
            tooltipContent = '',
            diffMinBase = 0,
            areaF = null,
            bulletF = null,
            areaLabels = null;

        //create chart g
        var chartG = chart.svg.append('g')
            .attr('transform', 'translate(' + chart.plot.left + ',' + chart.plot.top + ')');

        //animates stacked area
        function animateStacked() {
            //calculate diff min base
            diffMinBase = Math.abs(axis.yScale(0) - axis.yScale(chart.domains.y[0]));

            //set area fucntion
            areaF = d3.area()
                .x(function (d) {
                    if (chart.xFieldDataType === 'string')
                        return axis.xScale(d.data[chart.xField]) + axis.xScale.bandwidth() / 2;
                    return axis.xScale(d.data[chart.xField]);
                })
                .y0(function (d) {
                    if(chart.series.length === 1)
                        return axis.yScale(chart.domains.y[0]);
                    return axis.yScale(d[0]) - diffMinBase;
                })
                .y1(function (d) {
                    if(chart.series.length === 1)
                        return axis.yScale(d[1] - d[0]);
                    return axis.yScale(d[1]) - diffMinBase;
                });

            //transform area polygons
            areaPolygons
                .transition(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .delay(function (d, i) {
                    return i * chart.animation.delay;
                })
                .attr('d', areaF);

            //transform area bullets
            chart.series.forEach(function (currentSerie, serieIndex) {
                //select current serie bullets
                chartG.selectAll('.eve-area-bullet-' + serieIndex)
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * chart.animation.delay; })
                    .attr('transform', function (d) { return getBulletTransformStacked(d, false); });
            });
        }

        //animates nonstacked area
        function animateNonStacked() {
            //calculate diff min base
            diffMinBase = Math.abs(axis.yScale(0) - axis.yScale(chart.domains.y[0]));

            //set area fucntion
            areaF = d3.area()
                .x(function (d) {
                    if (chart.xFieldDataType === 'string')
                        return axis.xScale(d[chart.xField]) + axis.xScale.bandwidth() / 2;
                    return axis.xScale(d[chart.xField]);
                })
                .y0(function (d) {
                    if(chart.series.length === 1)
                        return axis.yScale(chart.domains.y[0]);
                    return chart.plot.height;
                })
                .y1(function (d) {
                    if(chart.series.length === 1)
                        return axis.yScale(d[chart.serieNames[d._serieIndex]]);
                    return axis.yScale(d[chart.serieNames[d._serieIndex]]) - diffMinBase;
                });

            //transform area polygons
            areaSeries.selectAll('path')
                .transition(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .delay(function (d, i) {
                    return i * chart.animation.delay;
                })
                .attr('d', areaF);

            //transform area bullets
            chart.series.forEach(function (currentSerie, serieIndex) {
                //select current serie bullets
                chartG.selectAll('.eve-area-bullet-' + serieIndex)
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * chart.animation.delay; })
                    .attr('transform', function (d) { return getBulletTransformNonStacked(d, false); });
            });
        }

        //gets bullet transform for stacked
        function getBulletTransformStacked(d, isInit) {
            //declare x and y positions
            var xPos = 0,
                yPos = 0,
                serie = chart.series[d.serieIndex];

            //set x position
            if (chart.xFieldDataType === 'string')
                xPos = axis.xScale(d.data[chart.xField]) + axis.xScale.bandwidth() / 2;
            else
                xPos = axis.xScale(d.data[chart.xField]);

            //set y position
            if(chart.series.length === 1)
                yPos = isInit ? chart.plot.height : axis.yScale(d[1] - d[0]);
            else
                yPos = isInit ? chart.plot.height : axis.yScale(d[1]);

            //check bullet
            if (serie.bullet.indexOf('image:') > -1) {
                xPos -= serie.bulletSize / 2;
                yPos -= serie.bulletSize / 2;
            }

            //update y position
            if(chart.series.length > 1)
                yPos -= diffMinBase;

            //return translation
            return 'translate(' + xPos + ',' + yPos + ')';
        }

        //gets bullet transform for non stacked
        function getBulletTransformNonStacked(d, isInit) {
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

            //update y position
            if(chart.series.length > 1)
                yPos -= diffMinBase;

            //return translation
            return 'translate(' + xPos + ',' + yPos + ')';
        }

        //creates stacked area chart
        function createStacked() {
            //sort data
            chart.data.sort(function (a, b) { 
                return ((a[chart.xField] < b[chart.xField]) ? -1 : ((a[chart.xField] > b[chart.xField]) ? 1 : 0));
            });
            
            //calculate diff min base
            diffMinBase = Math.abs(axis.yScale(0) - axis.yScale(chart.domains.y[0]));

            //create chart series
            currentSerie = null;

            //set stacked data
            stackedData = stack.keys(chart.serieNames)(chart.data);

            //iterate all stacked data
            stackedData.forEach(function (s) {
                //iterate all currnet stack array
                s.forEach(function (d) {
                    //update current data
                    d.serieIndex = s.index;
                });
            });

            //set area fucntion
            areaF = d3.area()
                .x(function (d) {
                    if (chart.xFieldDataType === 'string')
                        return axis.xScale(d.data[chart.xField]) + axis.xScale.bandwidth() / 2;
                    return axis.xScale(d.data[chart.xField]);
                })
                .y0(function (d) {
                    return chart.plot.height;
                })
                .y1(function (d) {
                    return chart.plot.height;
                });

            //create bullet function
            bulletF = d3.symbol().type(function (d) {
                return chart.series[d.serieIndex].bullet === 'none' ? d3.symbolCircle : chart.series[d.serieIndex].bullet.toSymbol();
            }).size(function (d) {
                return Math.pow(chart.series[d.serieIndex].bulletSize, 2);
            });

            //create area series
            areaSeries = chartG.selectAll('.eve-area-serie')
                .data(stackedData)
                .enter().append('g')
                .attr('class', 'eve-area-serie');

            //create area polygons
            areaPolygons = areaSeries.append('path')
                .attr('d', areaF)
                .attr('class', 'eve-area-path')
                .attr('fill', function (d, i) {
                    //set current serie
                    currentSerie = chart.series[d.index];

                    //check areas to set fill color
                    if (currentSerie.colorField && currentSerie.colorField !== '')
                        return d.data[currentSerie.colorField];
                    else
                        return currentSerie.color;
                })
                .attr('stroke', function (d, i) {
                    //set current serie
                    currentSerie = chart.series[d.index];

                    //check areas to set fill color
                    if (currentSerie.colorField && currentSerie.colorField !== '')
                        return d.data[currentSerie.colorField];
                    else
                        return currentSerie.sliceStrokeColor;
                })
                .attr('fill-opacity', function (d, i) { return chart.series[d.index].alpha; })
                .attr('stroke-opacity', function (d, i) { return chart.series[d.index].sliceStrokeAlpha; })
                .attr('stroke-width', function (d, i) { return chart.series[d.index].sliceStrokeThickness; });

            //iterate all stacked data
            chart.series.forEach(function (currentSerie, serieIndex) {
                //get current dataset
                currentDataSet = stackedData[serieIndex];

                //check whether the current serie bullet is not image
                if (currentSerie.bullet.indexOf('image:') === -1) {
                    //create area bullets
                    chartG.selectAll('.eve-area-bullet-' + serieIndex)
                        .data(currentDataSet)
                        .enter().append('path')
                        .attr('class', 'eve-area-bullets eve-area-bullet-' + serieIndex)
                        .attr('d', bulletF)
                        .attr('fill-opacity', currentSerie.showBullets ? currentSerie.bulletAlpha : 0)
                        .attr('stroke-opacity', currentSerie.bulletStrokeAlpha)
                        .attr('stroke-width', currentSerie.bulletStrokeSize)
                        .attr('fill', function (d, i) {
                            //check areas to set fill color
                            if (currentSerie.colorField && currentSerie.colorField !== '')
                                return d.data[currentSerie.colorField];
                            else if (currentSerie.bulletColor && currentSerie.bulletColor !== '')
                                return d.data[currentSerie.bulletColor];
                            else
                                return currentSerie.color;
                        })
                        .attr('transform', function (d) { return getBulletTransformStacked(d, true); })
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
                    //create area bullets
                    chartG.selectAll('.eve-area-bullet-' + serieIndex)
                        .data(currentDataSet)
                        .enter().append('svg:image')
                        .attr('class', 'eve-area-bullets eve-area-bullet-' + serieIndex)
                        .attr('xlink:href', currentSerie.bullet.replace('image:', ''))
                        .attr('width', currentSerie.bulletSize)
                        .attr('height', currentSerie.bulletSize)
                        .attr('transform', function (d) {
                            return getBulletTransformStacked(d, true);
                        })
                        .on('mousemove', function (d, i) {
                            //show tooltip
                            chart.showTooltip(chart.getContent(d, currentSerie, chart.tooltip.format));
                        })
                        .on('mouseout', function (d, i) {
                            //hide tooltip
                            chart.hideTooltip();
                        });
                }
            });

            //animate areas
            animateStacked();

            //attach update method to chart
            chart.update = function(data) {
                //set chart data
                chart.data = data;

                //sort data
                chart.data.sort(function (a, b) { 
                    return ((a[chart.xField] < b[chart.xField]) ? -1 : ((a[chart.xField] > b[chart.xField]) ? 1 : 0));
                });

                //update xy domain
                axis.updateAxis();
                chart.updateLegend();

                //create chart series
                currentSerie = null;

                //set stacked data
                stackedData = stack.keys(chart.serieNames)(chart.data);

                //iterate all stacked data
                stackedData.forEach(function (s) {
                    //iterate all currnet stack array
                    s.forEach(function (d) {
                        //update current data
                        d.serieIndex = s.index;
                    });
                });

                //update svg data
                areaSeries.data(stackedData).exit().remove();
                areaPolygons.data(stackedData).exit().remove();

                //iterate all stacked data
                chart.series.forEach(function (currentSerie, serieIndex) {
                    //get current dataset
                    currentDataSet = stackedData[serieIndex];

                    //create area bullets
                    chartG.selectAll('.eve-area-bullet-' + serieIndex).data(currentDataSet).exit().remove();
                });
                
                //animate areas
                animateStacked();
            };
        }

        //creates grouped area chart
        function createGrouped() {
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

            //set area fucntion
            areaF = d3.area()
                .x(function (d) {
                    if (chart.xFieldDataType === 'string')
                        return axis.xScale(d[chart.xField]) + axis.xScale.bandwidth() / 2;
                    return axis.xScale(d[chart.xField]);
                })
                .y0(function (d) {
                    return chart.plot.height;
                })
                .y1(function (d) {
                    return chart.plot.height;
                });

            //create bullet function
            bulletF = d3.symbol().type(function (d) {
                return chart.series[d._serieIndex].bullet === 'none' ? d3.symbolCircle : chart.series[d._serieIndex].bullet.toSymbol();
            }).size(function (d) {
                return Math.pow(chart.series[d._serieIndex].bulletSize, 2);
            });

            //create area series
            areaSeries = chartG.selectAll('.eve-area-serie')
                .data(currentDataSet)
                .enter().append('g')
                .attr('class', 'eve-area-serie');

            //create area polygons
            areaPolygons = areaSeries.append('path')
                .attr('d', areaF)
                .attr('class', 'eve-area-path')
                .attr('fill', function (d, i) {
                    //set current serie
                    currentSerie = chart.series[d.index];

                    //check areas to set fill color
                    if (currentSerie.colorField && currentSerie.colorField !== '')
                        return d.data[currentSerie.colorField];
                    else
                        return currentSerie.color;
                })
                .attr('stroke', function (d, i) {
                    //set current serie
                    currentSerie = chart.series[d.index];

                    //check areas to set fill color
                    if (currentSerie.colorField && currentSerie.colorField !== '')
                        return d.data[currentSerie.colorField];
                    else
                        return currentSerie.sliceStrokeColor;
                })
                .attr('fill-opacity', function (d, i) { return chart.series[d.index].alpha; })
                .attr('stroke-opacity', function (d, i) { return chart.series[d.index].sliceStrokeAlpha; })
                .attr('stroke-width', function (d, i) { return chart.series[d.index].sliceStrokeThickness; });

            //iterate all data
            chart.series.forEach(function (currentSerie, serieIndex) {
                //check whether the current serie bullet is not image
                if (currentSerie.bullet.indexOf('image:') === -1) {
                    //create area bullets
                    chartG.selectAll('.eve-area-bullet-' + serieIndex)
                        .data(currentDataSet[serieIndex])
                        .enter().append('path')
                        .attr('class', 'eve-area-bullets eve-area-bullet-' + serieIndex)
                        .attr('d', bulletF)
                        .attr('fill-opacity', currentSerie.showBullets ? currentSerie.bulletAlpha : 0)
                        .attr('stroke-opacity', currentSerie.bulletStrokeAlpha)
                        .attr('stroke-width', currentSerie.bulletStrokeSize)
                        .attr('fill', function (d, i) {
                            //check areas to set fill color
                            if (currentSerie.colorField && currentSerie.colorField !== '')
                                return d.data[currentSerie.colorField];
                            else if (currentSerie.bulletColor && currentSerie.bulletColor !== '')
                                return d.data[currentSerie.bulletColor];
                            else
                                return currentSerie.color;
                        })
                        .attr('transform', function (d) { return getBulletTransformNonStacked(d, true); })
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
                    //create area bullets
                    chartG.selectAll('.eve-area-bullet-' + serieIndex)
                        .data(currentDataSet[serieIndex])
                        .enter().append('svg:image')
                        .attr('class', 'eve-area-bullets eve-area-bullet-' + serieIndex)
                        .attr('xlink:href', currentSerie.bullet.replace('image:', ''))
                        .attr('width', currentSerie.bulletSize)
                        .attr('height', currentSerie.bulletSize)
                        .attr('transform', function (d) {
                            return getBulletTransformNonStacked(d, true);
                        })
                        .on('mousemove', function (d, i) {
                            //show tooltip
                            chart.showTooltip(chart.getContent(d, currentSerie, chart.tooltip.format));
                        })
                        .on('mouseout', function (d, i) {
                            //hide tooltip
                            chart.hideTooltip();
                        });
                }
            });

            //animate area chart
            animateNonStacked();

            //attach update method to chart
            chart.update = function (data) {
                //set chart data
                chart.data = data;

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

                //update xy domain
                axis.updateAxis();
                chart.updateLegend();

                //update svg data
                areaSeries.data(currentDataSet).exit().remove();
                areaPolygons.data(currentDataSet).exit().remove();

                //iterate all stacked data
                chart.series.forEach(function (currentSerie, serieIndex) {
                    //create area bullets
                    chartG.selectAll('.eve-area-bullet-' + serieIndex).data(currentDataSet[serieIndex]).exit().remove();
                });

                //animate areas
                animateNonStacked();
            };
        }

        //check whether the chart y axis is stacked
        if (chart.yAxis.stacked) {
            createStacked();
        } else {
            createGrouped();
        }

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

        //return area chart
        return chart;
    }

    //attach area chart method into the eve
    e.areaChart = function (options) {
        options.type = 'xy';
        return new areaChart(options);
    };
})(eve);