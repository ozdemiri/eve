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
 * Base class for bubble chart.
 */
(function (e) {
    //define bubble chart class
    function bubbleChart(options) {
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
            currentDataSet = [],
            xField = chart.xField,
            groupName = '',
            tooltipContent = '',
            diffMinBase = 0,
            bulletF = null,
            minSize = 0,
            maxSize = 0,
            bubbleLabels = null;

        //create chart g
        var chartG = chart.svg.append('g')
            .attr('transform', 'translate(' + chart.plot.left + ',' + chart.plot.top + ')');

        //gets size of the bullet
        var getBulletSize = function (serie, data) {
            //check whtehr the serie has size field
            if (serie.sizeField !== '') {
                //declare needed variables
                var currentData = currentDataSet[data._serieIndex],
                    dataSizeRange = currentData.maxSize - currentData.minSize,
                    bulletSizeRange = serie.maxBulletSize - serie.minBulletSize,
                    bulletSize = serie.maxBulletSize;

                //check whether the data size range is not 0
                if (dataSizeRange !== 0)
                    bulletSize = (data[serie.sizeField] / dataSizeRange * bulletSizeRange) - (currentData.minSize / dataSizeRange * bulletSizeRange) + serie.minBulletSize;

                //return calculated bullet size
                if (serie.bullet.indexOf('image:') === -1)
                    return Math.pow(bulletSize, 2);
                else
                    return bulletSize;
            } else {
                //return default bulet size
                return Math.pow(serie.bulletSize, 2);
            }
        };

        //create bullet function
        bulletF = d3.symbol().type(function (d) {
            return chart.series[d._serieIndex].bullet === 'none' ? d3.symbolCircle : chart.series[d._serieIndex].bullet.toSymbol();
        }).size(function (d) {
            return getBulletSize(chart.series[d._serieIndex], d);
        });

        //animates bubble bullets
        function animateBullets() {
            //calculate diff min base
            diffMinBase = Math.abs(axis.yScale(0) - axis.yScale(chart.domains.y[0]));

            //transform bubble bullets
            chart.series.forEach(function (currentSerie, serieIndex) {
                //select current serie bullets
                chartG.selectAll('.eve-bubble-bullet-' + serieIndex)
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
                serieData.minSize = d3.min(chart.data, function(d) {
                    return d[chart.series[serieIndex].sizeField];
                });
                serieData.maxSize = d3.max(chart.data, function(d) {
                    return d[chart.series[serieIndex].sizeField];
                });

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

        //iterate all data
        chart.series.forEach(function (currentSerie, serieIndex) {
            //check whether the current serie bullet is not image
            if (currentSerie.bullet.indexOf('image:') === -1) {
                //create bubble bullets
                chartG.selectAll('.eve-bubble-bullet-' + serieIndex)
                    .data(currentDataSet[serieIndex])
                    .enter().append('path')
                    .attr('class', 'eve-bubble-bullets eve-bubble-bullet-' + serieIndex)
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
                //create bubble bullets
                chartG.selectAll('.eve-bubble-bullet-' + serieIndex)
                    .data(currentDataSet[serieIndex])
                    .enter().append('svg:image')
                    .attr('class', 'eve-bubble-bullets eve-bubble-bullet-' + serieIndex)
                    .attr('xlink:href', currentSerie.bullet.replace('image:', ''))
                    .attr('width', function (d) { return getBulletSize(currentSerie, d); })
                    .attr('height', function (d) { return getBulletSize(currentSerie, d); })
                    .attr('transform', function (d) {
                        return getBulletTransform(d, true);
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

        //animate columns
        animateBullets();

        //add update function to chart
        chart.update = function (data) {
            //update chart data
            chart.data = data;

            //update data series
            updateDataSeries();

            //update xy domain
            axis.updateAxis();
            chart.updateLegend();

            //iterate all stacked data
            chart.series.forEach(function (currentSerie, serieIndex) {
                //create bubble bullets
                chartG.selectAll('.eve-bubble-bullet-' + serieIndex).data(currentDataSet[serieIndex]).exit().remove();
            });

            //animate columns
            animateBullets();
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

    //attach bubble chart method into the eve
    e.bubbleChart = function (options) {
        options.type = 'xy';
        return new bubbleChart(options);
    };
})(eve);