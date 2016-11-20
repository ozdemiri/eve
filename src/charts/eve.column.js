/*!
 * eve.column.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for column chart.
 */
(function(e) {
    //define column chart class
    function columnChart(options) {
        //declare needed variables
        var that = this,
            chart = eve.base.init(options),
            stack = d3.stack(),
            axis = eve.base.createAxis(chart),
            stackedData = null,
            currentSerie = null,
            columnSeries = null,
            columnRects = null,
            xField = chart.xField,
            groupName = '',
            tooltipContent = '',
            groupAxis = null,
            singleGroupWidth = 0,
            diffStacked = 0,
            diffMinBase = 0, 
            columnLabels = null;

        //create chart g
        var chartG = chart.svg.append('g')
            .attr('transform', 'translate(' + chart.plot.left + ',' + chart.plot.top + ')');

        //animates columns
        function animateColumns(isStacked) {
            if(isStacked) {
                //calculate diff min base
                diffMinBase = Math.abs(axis.yScale(0) - axis.yScale(chart.domains.y[0]));

                //animate column chart
                columnRects
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function(d, i) { return i * chart.animation.delay; })
                    .attr('x', function (d) { return axis.xScale(d.data[xField]); })
                    .attr('y', function (d) {
                        if (chart.series.length === 1)
                            return d[1] < 0 ? axis.yScale(d[0]) : axis.yScale(d[1]);
                        return d[1] < 0 ? axis.yScale(d[0]) : axis.yScale(d[1]) - diffMinBase; 
                    })
                    .attr('height', function(d) { 
                        if (chart.series.length === 1)
                            return Math.abs(axis.yScale(d[0]) - axis.yScale(d[1])) - diffMinBase;
                        return Math.abs(axis.yScale(d[0]) - axis.yScale(d[1]));
                    })
                    .attr('width', axis.xScale.bandwidth());
            } else {
                //animate column chart
                columnRects
                    .transition(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function(d, i) { return i * chart.animation.delay; })
                    .attr('width', singleGroupWidth)
                    .attr('height', function(d, i) { return axis.yScale(chart.domains.y[0]) - axis.yScale(d.data[d.name]); })
                    .attr('x', function(d) { return groupAxis(d.name); })
                    .attr('y', function(d) { return axis.yScale(d.data[d.name]); });
            }
        }

        //creates stacked column chart
        function createStacked() {
            //sort data
            chart.data.sort(function(a, b) { return b.total - a.total; });

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
            
            //set column rectangles
            columnSeries = chartG.selectAll('.eve-column-serie')
                .data(stackedData)
                .enter().append('g')
                .attr('class', 'eve-column-serie')
                .attr('fill', function(d, i) {
                    //set current serie
                    currentSerie = chart.series[i];

                    //check columns to set fill color
                    if(currentSerie.colorField && currentSerie.colorField !== '')
                        return d.data[currentSerie.colorField];
                    else
                        return currentSerie.color;
                })
                .attr('stroke', function(d, i) {
                    //set current serie
                    currentSerie = chart.series[i];

                    //check columns to set fill color
                    if(currentSerie.colorField && currentSerie.colorField !== '')
                        return d.data[currentSerie.colorField];
                    else 
                        return currentSerie.sliceStrokeColor;
                })
                .attr('fill-opacity', function(d, i) { return chart.series[i].alpha; })
                .attr('stroke-opacity', function(d, i) { return chart.series[i].sliceStrokeAlpha; })
                .attr('stroke-width', function (d, i) { return chart.series[i].sliceStrokeThickness; });

            //create column rectangles
            columnRects = columnSeries
                .selectAll('rect')
                .data(function (d, i) { return d; })
                .enter().append('rect')
                .on('click', function (d) {
                    if(chart.sliceClick)
                        chart.sliceClick(d.data);
                })
                .on('mousemove', function (d, i) {
                    //set current serie
                    currentSerie = chart.series[d.serieIndex];
                    
                    //set slice hover
                    d3.select(this).attr('fill-opacity', currentSerie.sliceHoverAlpha);

                    //show tooltip
                    chart.showTooltip(chart.getContent(d, currentSerie, chart.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //set current serie
                    currentSerie = chart.series[d.serieIndex];

                    //set slice hover
                    d3.select(this).attr('fill-opacity', currentSerie.alpha);

                    //hide tooltip
                    chart.hideTooltip();
                });

            //init column rectangles
            columnRects
                .attr('x', function (d) { return axis.xScale(d.data[xField]); })
                .attr('y', chart.plot.height)
                .attr('width', axis.xScale.bandwidth())
                .attr('height', 0);

            //animate column rects
            animateColumns(true);

            //set update method to chart
            chart.update = function (data) {
                //set chart data
                chart.data = data;

                //update xy domain
                axis.updateAxis();
                chart.updateLegend();

                //sort data
                chart.data.sort(function (a, b) { return b.total - a.total; });

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
                columnSeries.data(stackedData).exit().remove();
                columnRects.data(function (d) { return d; }).exit().remove();

                //update column rectangles
                columnRects
                    .attr('x', function (d) { return axis.xScale(d.data[xField]); })
                    .attr('y', chart.plot.height)
                    .attr('width', axis.xScale.bandwidth())
                    .attr('height', 0);

                //animate columns
                animateColumns(true);
            };
        }

        //creates grouped column chart
        function createGrouped() {
            //create group axis
            groupAxis = d3.scaleBand().domain(chart.serieNames).range([0, axis.xScale.bandwidth()]).round(true).padding(0.1);

            //get single group width
            singleGroupWidth = groupAxis.bandwidth();

            //create column series
            columnSeries = chartG.selectAll('.eve-column-serie')
                .data(chart.data)
                .enter().append('g')
                .attr('class', 'eve-column-serie')
                .attr('transform', function(d) {
                    return 'translate(' + axis.xScale(d[chart.xField]) + ')';
                });

            //create column rectangles
            columnRects = columnSeries.selectAll('rect')
                .data(function(d) {
                    return chart.serieNames.map(function(s) {
                        return {
                            name: s,
                            data: d
                        };
                    });
                })
                .enter().append('rect')
                .attr('fill', function(d, i) {
                    //set current serie
                    currentSerie = chart.series[i];

                    //check columns to set fill color
                    if(currentSerie.colorField && currentSerie.colorField !== '')
                        return d.data[currentSerie.colorField];
                    else
                        return currentSerie.color;
                })
                .attr('stroke', function(d, i) {
                    //set current serie
                    currentSerie = chart.series[i];

                    //check columns to set fill color
                    if(currentSerie.colorField && currentSerie.colorField !== '')
                        return d.data[currentSerie.colorField];
                    else 
                        return currentSerie.sliceStrokeColor;
                })
                .attr('fill-opacity', function(d, i) { return chart.series[i].alpha; })
                .attr('stroke-opacity', function(d, i) { return chart.series[i].sliceStrokeAlpha; })
                .attr('stroke-width', function (d, i) { return chart.series[i].sliceStrokeThickness; })
                .attr('width', singleGroupWidth)
                .attr('height', 0)
                .attr('x', function(d) { return groupAxis(d.name); })
                .attr('y', axis.yScale(0))
                .on('click', function (d) {
                    if(chart.sliceClick)
                        chart.sliceClick(d.data);
                })
                .on('mousemove', function (d, i) {
                    //set current serie
                    currentSerie = chart.series[i];
                    
                    //set slice hover
                    d3.select(this).attr('fill-opacity', currentSerie.sliceHoverAlpha);

                    //show tooltip
                    chart.showTooltip(chart.getContent(d, currentSerie, chart.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //set current serie
                    currentSerie = chart.series[i];

                    //set slice hover
                    d3.select(this).attr('fill-opacity', currentSerie.alpha);

                    //hide tooltip
                    chart.hideTooltip();
                });

            //animate columns
            animateColumns();

            //set update method to chart
            chart.update = function(data) {
                //set chart data
                chart.data = data;

                //update xy domain
                axis.updateAxis();
                chart.updateLegend();

                //create group axis
                groupAxis = d3.scaleBand().domain(chart.serieNames).range([0, axis.xScale.bandwidth()]).round(true).padding(0.1);

                //get single group width
                singleGroupWidth = groupAxis.bandwidth();

                //update svg data
                columnSeries.data(chart.data).exit().remove();
                columnRects.data(function (d) { 
                    return chart.serieNames.map(function(s) {
                        return {
                            name: s,
                            data: d
                        };
                    });
                }).exit().remove();

                //animate columns
                animateColumns();
            };
        }

        //check whether the chart y axis is stacked
        if(chart.yAxis.stacked) {
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

        //return column chart
        return chart;
    }
    
    //attach column chart method into the eve
    e.columnChart = function(options) {
        options.type = 'xy';
        return new columnChart(options);
    };
})(eve);