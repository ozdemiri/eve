/*!
 * eve.abacus.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for abacus diagram.
 */
(function (e) {
    //define abacus diagram class
    function abacus(options) {
        //update grid lines
        if (!options.xAxis) {
            options.xAxis = {
                gridLineThickness: 0
            };
        } else {
            if (!options.xAxis.gridLineThickness)
                options.xAxis.gridLineThickness = 0;
        }

        //remove stacked
        if (!options.yAxis) {
            options.yAxis = { stacked: false };
        } else {
            options.yAxis.stacked = false;
        }

        //declare needed variables
        var diagram = eve.base.init(options),
            axis = eve.base.createAxis(diagram),
            currentDataSet = [],
            bulletF = null,
            xField = diagram.xField,
            dataColumns = null,
            guideYPos = 0,
            currentMeasure = 0,
            nextMeasure = 0,
            currentSerie = null,
            currentSerieIndex = -1,
            bulletSize = diagram.series[0].bulletSize < 16 ? 16 : diagram.series[0].bulletSize,
            guideLineSize = bulletSize / 3;

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

        //create bullet function
        bulletF = d3.symbol().type(function (d) {
            return diagram.series[d._serieIndex].bullet === 'none' ? d3.symbolCircle : diagram.series[d._serieIndex].bullet.toSymbol();
        }).size(function (d) {
            return Math.pow(bulletSize, 2);
        });

        //gets bullet transform
        var getBulletTransform = function (d, isInit) {
            //declare x and y positions
            var xPos = 0,
                yPos = 0,
                currentSerie = diagram.series[d._serieIndex];

            //set x position
            if (diagram.xFieldDataType === 'string')
                yPos = axis.yScale(d[diagram.xField]) + axis.yScale.bandwidth() / 2;
            else
                yPos = axis.yScale(d[diagram.xField]);

            //set y position
            xPos = isInit ? 0 : axis.xScale(d[currentSerie.yField]);
            
            //return translation
            return 'translate(' + xPos + ',' + yPos + ')';
        };

        //animates abacus diagram
        var animateAbacus = function () {
            //transform abacus bullets
            diagram.series.forEach(function (currentSerie, serieIndex) {
                //iterate all data to create guide lines
                diagram.data.forEach(function (data, dataIndex) {
                    //declare needed variables
                    setDataColumns(data);

                    //get y position of the current guide lines
                    guideYPos = axis.yScale(data[xField]) + axis.yScale.bandwidth() / 2;

                    //create guide lines for the current set
                    diagramG.selectAll('.eve-abacus-line-' + serieIndex + '-' + dataIndex)
                        .data(dataColumns)
                        .enter().append('line')
                        .attr('class', 'eve-abacus-lines eve-abacus-line-' + serieIndex + '-' + dataIndex)
                        .style('stroke', function (d, i) {
                            //get measures
                            currentMeasure = d;
                            nextMeasure = dataColumns[i + 1];
                            currentSerieIndex = -1;

                            //check whether the next measure is not empty
                            if (nextMeasure) {
                                //get proper measure index
                                if (parseFloat(currentMeasure.value) < parseFloat(nextMeasure.value))
                                    currentSerieIndex = diagram.getSerieIndexByName(nextMeasure.name);
                                else
                                    currentSerieIndex = diagram.getSerieIndexByName(currentMeasure.name);

                                //check measure index is > -1
                                if (currentSerieIndex > -1)
                                    return diagram.series[currentSerieIndex].color;
                                else
                                    return 'none';
                            } else {
                                //there is no next meausure so no fill
                                return 'none';
                            }
                        })
                        .style('stroke-width', guideLineSize)
                        .attr('y1', guideYPos)
                        .attr('y2', guideYPos)
                        .attr('x1', function (d, i) {
                            //get current measure value
                            currentMeasure = d;
                            nextMeasure = dataColumns[i + 1];

                            //check whether the next measure is not empty
                            if (nextMeasure) {
                                //get proper measure index
                                return axis.xScale(parseFloat(currentMeasure.value)) + bulletSize / 2;
                            } else {
                                //there is no next meausure so remove
                                return 0;
                            }
                        })
                        .transition(diagram.animation.duration)
                        .ease(diagram.animation.easing.toEasing())
                        .delay(function (d, i) { return i * diagram.animation.delay; })
                        .attr('x2', function (d, i) {
                            //get current measure value
                            currentMeasure = d;
                            nextMeasure = dataColumns[i + 1];

                            //check whether the next measure is not empty
                            if (nextMeasure) {
                                //get proper measure index
                                return axis.xScale(parseFloat(nextMeasure.value)) - bulletSize / 2;
                            } else {
                                //there is no next meausure so remove
                                return 0;
                            }
                        });
                });

                //select current serie bullets
                diagramG.selectAll('.eve-abacus-bullet-' + serieIndex)
                    .transition(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .delay(function (d, i) { return i * diagram.animation.delay; })
                    .attr('fill-opacity', function (d) {
                        if (!d[currentSerie.yField])
                            return 0;
                        return 1;
                    })
                    .attr('fill', function (d, i) {
                        if (currentSerie.bullet.indexOf('image:') === -1) {
                            //check columns to set fill color
                            if (currentSerie.colorField && currentSerie.colorField !== '')
                                return d.data[currentSerie.colorField];
                            else if (currentSerie.bulletColor && currentSerie.bulletColor !== '')
                                return d.data[currentSerie.bulletColor];
                            else
                                return currentSerie.color;
                        }
                    })
                    .attr('transform', function (d) { return getBulletTransform(d, false); });
            });
        };

        //updates data series
        function updateDataSeries() {
            //create new diagram data
            currentDataSet = [];

            //iterate all diagram series
            diagram.serieNames.forEach(function (serieName, serieIndex) {
                //declare serie data
                var serieData = [];

                //iterate diagram data to set values
                diagram.data.forEach(function (d, i) {
                    //iterate keys
                    for (var key in d) {
                        //update diagram data
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

            //create diagram series
            currentSerie = null;
        }

        //sets data columns
        function setDataColumns(data) {
            //get all keys in current data
            dataColumns = [];
            d3.keys(data).map(function (a) {
                //check whether the key is not source field
                if (a !== xField && a !== '_serieIndex' && a !== 'total') {
                    //get current value
                    var currVal = data[a];

                    //check whether the value is not null
                    if (currVal) {
                        dataColumns.push({
                            name: a,
                            value: currVal
                        });
                    }
                }
            });

            //check whether the data columns is not empty
            if (dataColumns && dataColumns.length > 0) {
                //sort data columns
                dataColumns.sort(function (a, b) { return a.value - b.value; });
            }
        }

        //update data sereis
        updateDataSeries();

        //iterate all series to create abacus bullets
        diagram.series.forEach(function (currentSerie, serieIndex) {
            //check whether the current serie bullet is not image
            if (currentSerie.bullet.indexOf('image:') === -1) {
                //create scatter bullets
                diagramG.selectAll('.eve-abacus-bullet-' + serieIndex)
                    .data(currentDataSet[serieIndex])
                    .enter().append('path')
                    .attr('class', 'eve-abacus-bullets eve-abacus-bullet-' + serieIndex)
                    .attr('d', bulletF)
                    .attr('stroke-opacity', currentSerie.bulletStrokeAlpha)
                    .attr('stroke-width', currentSerie.bulletStrokeSize)
                    .attr('fill-opacity', function (d) {
                        if (!d[currentSerie.yField])
                            return 0;
                        return 1;
                    })
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
                        if (diagram.sliceClick)
                            diagram.sliceClick(d.data);
                    })
                    .on('mousemove', function (d, i) {
                        //set slice hover
                        d3.select(this).attr('fill-opacity', currentSerie.sliceHoverAlpha);

                        //show tooltip
                        diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                    })
                    .on('mouseout', function (d, i) {
                        //hide tooltip
                        diagram.hideTooltip();
                    });
            } else {
                //create scatter bullets
                diagramG.selectAll('.eve-abacus-bullet-' + serieIndex)
                    .data(currentDataSet[serieIndex])
                    .enter().append('svg:image')
                    .attr('class', 'eve-abacus-bullets eve-abacus-bullet-' + serieIndex)
                    .attr('xlink:href', currentSerie.bullet.replace('image:', ''))
                    .attr('fill-opacity', function (d) {
                        if (!d[currentSerie.yField])
                            return 0;
                        return 1;
                    })
                    .attr('width', currentSerie.bulletSize)
                    .attr('height', currentSerie.bulletSize)
                    .attr('transform', function (d) {
                        return getBulletTransform(d, true);
                    })
                    .on('mousemove', function (d, i) {
                        //show tooltip
                        diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                    })
                    .on('mouseout', function (d, i) {
                        //hide tooltip
                        diagram.hideTooltip();
                    });
            }
        });

        //animate abacus diagram
        animateAbacus();

        //updates diagram
        diagram.update = function (data) {
            //update diagram data
            diagram.data = data;

            //update data series
            updateDataSeries();

            //update xy domain
            axis.updateAxis();
            diagram.updateLegend();

            //iterate all stacked data
            diagram.series.forEach(function (currentSerie, serieIndex) {
                //remove lines
                diagramG.selectAll('.eve-abacus-lines').remove();

                //update bullet data
                diagramG.selectAll('.eve-abacus-bullet-' + serieIndex).data(currentDataSet[serieIndex]).exit().remove();
            });

            //animate abacus diagram
            animateAbacus();
        };

        //draws the chart into a canvas
        diagram.toCanvas = function () {
            //get the chart container
            var orgDiv = document.getElementById(diagram.container);
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
        diagram.toImage = function () {
            //get the chart container
            var orgDiv = document.getElementById(diagram.container);
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

        //return abacus diagram
        return diagram;
    }

    //attach abacus method into the eve
    e.abacus = function (options) {
        options.type = 'xy';
        options.reversedAxis = true;
        return new abacus(options);
    };

})(eve);