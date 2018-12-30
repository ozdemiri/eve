/*!
 * eve.tilemap.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for tile map.
 */
(function (e) {
    //define tile map class
    function tileMap(options) {
        //declare needed variables
        let that = this,
            map = e.initVis(options),
            labelField = map.series[0].labelField,
            valueField = map.series[0].valueField,
            folderPath = e.mapDirectory + '/tilemaps/',
            mapName = '',
            mapType = 0,
            xPos = 0,
            yPos = 0,
            labels = null,
            minVal = map.domains.minY,
            maxVal = map.domains.maxY,
            fillColor = '',
            oldFillColor = '',
            oldData = null,
            currentDataName = null,
            currentDataCode = null,
            currentData = null,
            fillOpacity = 0,
            gradientRatio = 0,
            tileSize = 0,
            tiles = null,
            labelMeasures = [],
            tileData = [],
            margins = { x: 0, y: 0 },
            hexOffset = 0,
            fontSize = 0,
            minFontSize = 8,
            r = 0;

        //set map plot width and height
        map.plot.width = map.plot.width - map.plot.left - map.plot.right;
        map.plot.height = map.plot.height - map.plot.top - map.plot.bottom;

        //create chart g
        let mapG = map.svg.append('g')
            .attr('transform', 'translate(' + map.plot.left + ',' + map.plot.top + ')');

        //sets initial map variables
        function setMapVariables() {
            //trim map name
            mapName = map.series[0].map.replace('%20', '').trim();

            //determine folder path and map type based on map name
            //0: Region, 1: Country, 2: Counties, 3: Zip
            if (mapName.length === 3) {
                folderPath = e.mapDirectory + '/tilemaps/countries/';
                mapType = 1;
            }
            else if (mapName.substring(0, 3) === "SC_") {
                folderPath = e.mapDirectory + '/tilemaps/SubCountries/';
                mapType = 2;
            }
        }

        //create square tiles
        function createSquareTiles() {

            //create squares
            tiles = mapG.selectAll(".rect")
                .attr("class", "rect")
                .data(tileData)
                .enter().append('rect')
                .attr('width', tileSize - 2)
                .attr('height', tileSize - 2)
                .attr('rx', 3)
                .attr('ry', 3)
                .attr('transform', function (d) {
                    xPos = d.x * tileSize + margins.x;
                    yPos = d.y * tileSize + margins.y;
                    return 'translate(' + xPos + ',' + yPos + ')';
                });
        }

        //create hexagonal tiles
        function createHexTiles() {
            //create hexes
            tiles = mapG.selectAll(".polygon")
                .attr("class", "polygon")
                .data(tileData)
                .enter().append('polygon')
                .attr('points', function (d) {
                    //calculate points
                    hexOffset = 2 + (Math.sqrt(3) * r) / 2;
                    xPos = d.x * hexOffset * 2 + margins.x + r;
                    yPos = d.y * hexOffset * Math.sqrt(3) + margins.y + (r / 2);

                    if (d.y % 2 !== 0) xPos += hexOffset;

                    let x1 = xPos;
                    let y1 = yPos - r;
                    let x2 = xPos + (Math.cos(Math.PI / 6) * r);
                    let y2 = yPos - (Math.sin(Math.PI / 6) * r);
                    let x3 = xPos + (Math.cos(Math.PI / 6) * r);
                    let y3 = yPos + (Math.sin(Math.PI / 6) * r);
                    let x4 = xPos;
                    let y4 = yPos + r;
                    let x5 = xPos - (Math.cos(Math.PI / 6) * r);
                    let y5 = yPos + (Math.sin(Math.PI / 6) * r);
                    let x6 = xPos - (Math.cos(Math.PI / 6) * r);
                    let y6 = yPos - (Math.sin(Math.PI / 6) * r);

                    return x1 + "," + y1 + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + x4 + "," + y4 + " " + x5 + "," + y5 + " " + x6 + "," + y6;
                });
        }

        //create circle tiles
        function createCircleTiles() {

            //create circles
            tiles = mapG.selectAll(".circle")
                .attr("class", "circle")
                .data(tileData)
                .enter().append('circle')
                .attr('r', r)
                .attr('transform', function (d) {
                    xPos = d.x * tileSize + tileSize / 2 + margins.x;
                    yPos = d.y * tileSize + tileSize / 2 + margins.y;
                    return 'translate(' + xPos + ',' + yPos + ')';
                });
        }

        //animates columns
        function animateTiles() {
            //animate tiles
            minVal = map.domains.minY;
            maxVal = map.domains.maxY;
            tiles
                .transition().duration(map.animation.duration)
                .ease(map.animation.easing.toEasing())
                .delay(function (d, i) { return i * map.animation.delay; })
                .attr('fill-opacity', function (d) {
                    if (d.currentData) {
                        oldFillColor = d3.select(this).attr('fill');
                        oldData = d.currentData;
                    } else {
                        oldFillColor = '';
                        oldData = null;
                    }
                    //reset data
                    d.currentData = null;

                    //get data for current shape
                    currentDataName = mapType === 3 ? e.filterNumeric(map.data, labelField, d.name) : e.filter(map.data, labelField, d.name);
                    currentDataCode = mapType === 1 ? e.filter(map.data, labelField, d.code) : [];
                    currentData = null;

                    //check if data exists for current shape
                    if (currentDataName.length > 0) {
                        if (currentDataName[0][labelField])
                            currentData = currentDataName;
                    }
                    else if (currentDataCode.length > 0) {
                        if (currentDataCode[0][labelField])
                            currentData = currentDataCode;
                    }

                    //check whether the data is not null
                    if (currentData !== null) {
                        currentData.forEach(function (c) {
                            //check whether the value exists
                            if (c[valueField] != 0 && c[valueField] != null) { //do not convert to !== , it gives a different result

                                if (map.legend.type !== 'default')
                                    c[valueField] = parseFloat(c[valueField]);

                                //set fill color
                                switch (map.legend.type) {
                                    case 'default':
                                        {
                                            fillColor = e.matchGroup(c[valueField], map.legend.legendColors, 'color') || 'rgb(221,221,221)';
                                        }
                                        break;
                                    case 'ranged':
                                        {
                                            let rangeObj = e.matchRange(c[valueField], map.legend.rangeList, 'color');
                                            if (rangeObj) {
                                                fillColor = rangeObj.color;
                                                d.legendClass = 'ranged-' + rangeObj.index;
                                            } else {
                                                fillColor = 'rgb(221,221,221)';
                                            }
                                        }
                                        break;
                                    default:
                                        {
                                            //calculate ratio
                                            if (minVal !== maxVal)
                                                gradientRatio = c[valueField] / (maxVal - minVal) * 100 - (minVal / (maxVal - minVal) * 100);
                                            else
                                                gradientRatio = 1;
                                            fillColor = e.gradient(map.legend.gradientColors, gradientRatio);
                                        }
                                }
                                //set opacity and data
                                fillOpacity = 1;
                                d.currentData = c;
                            }
                        });
                    }

                    //set empty shape settings
                    if (!d.currentData) {
                        if (map.animation.effect) {
                            //check whether the effect is fade
                            if (map.animation.effect === 'fade') {
                                fillColor = 'rgb(221,221,221)';
                                fillOpacity = 0.9;
                            } else if (map.animation.effect === 'dim') {
                                if (oldData) {
                                    fillColor = oldFillColor;
                                    fillOpacity = 0.3;
                                    d.currentData = oldData;
                                } else {
                                    fillColor = 'rgb(221,221,221)';
                                    fillOpacity = 0.9;
                                }
                            } else if (map.animation.effect === 'add') {
                                if (oldData) {
                                    fillColor = oldFillColor;
                                    fillOpacity = 1;
                                    d.currentData = oldData;
                                } else {
                                    fillColor = 'rgb(221,221,221)';
                                    fillOpacity = 0.9;
                                }
                            } else {
                                fillColor = 'rgb(221,221,221)';
                                fillOpacity = 0.9;
                            }
                        }
                    }
                    //set fill color
                    d.fillColor = fillColor;
                    d.fillOpacity = fillOpacity;

                    //return fill opacity
                    return d.fillOpacity;
                })
                .attr('fill', function (d) { return d.fillColor; })
                .style('stroke', function (d) { return d.fillColor; })
                .style('stroke-opacity', function (d) { return d.fillOpacity; });

            //check whether the labls are enabled and update labels
            //if (map.series[0].labelsEnabled && map.series[0].labelFormat !== '' && labels !== null) {
            if (map.series[0].labelFormat !== '' && labels !== null) {
                labels
                    .style('fill', function (d) { return map.series[0].labelFontColor === 'auto' ? map.getAutoColor(d.fillColor) : map.series[0].labelFontColor; })
                    .text(function (d) {
                        //get label format
                        labelFormat = map.series[0].labelFormat;
                        labelValue = d.label;
                        codeValue = d.code;

                        // check if data for the shape exists
                        if (d.currentData) {
                            //assign format
                            labelFormat = labelFormat.replaceAll('{code}', codeValue).replaceAll('{label}', labelValue);
                            labelFormat = map.getContent(d.currentData, map.series[0], labelFormat);
                        }
                        else {
                            labelwoutMeasure = ''
                            labelwoutMeasure += labelFormat.search('{code}') !== -1 ? codeValue : '';
                            labelwoutMeasure += labelFormat.search('{label}') !== -1 ? (labelwoutMeasure ? ' ' + labelValue : labelValue) : '';
                            labelFormat = labelwoutMeasure;
                        }

                        //return format
                        return labelFormat;
                    })
                    .style('font-size', '24px')
                    .style('font-size', function (d) {
                        //check whether the label font size is auto
                        if (map.series[0].labelFontSize === 'auto') {
                            if (map.series[0].tileIcon === 'hexagonal')
                                fontSize = ((2 * r - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * 24) - 1;
                            else
                                fontSize = ((2 * r - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * 24);
                            if (fontSize < minFontSize)
                                d3.select(this).text('');
                        } else {
                            fontSize = map.series[0].labelFontSize;
                        }
                        //if not out then set defined one
                        return fontSize + 'px';
                    })
                    .attr("transform", function (d) {
                        if (map.series[0].tileIcon === 'hexagonal') {
                            xPos = d.x * hexOffset * 2 + margins.x + r;
                            yPos = d.y * hexOffset * Math.sqrt(3) + margins.y + (r / 2);
                            if (d.y % 2 !== 0) xPos += hexOffset;
                            return 'translate(' + xPos + ',' + yPos + ')';
                        }
                        else {
                            xPos = d.x * tileSize + tileSize / 2 + margins.x;
                            yPos = d.y * tileSize + tileSize / 2 + margins.y;
                            return 'translate(' + xPos + ',' + yPos + ')';
                        }
                    });
            }

            //raise render complete
            if (map.renderComplete) {
                setTimeout(function () {
                    map.renderComplete();
                }, 1000);
            }
        }

        //creates grouped column chart
        function createMap() {
            //declare needed variables
            let tooltipContent = '',
                labelFormat = '',
                labelValue = '',
                codeValue = '';

            //fill topology
            d3.json(folderPath + mapName + '.json', function (error, data) {

                //get grid size
                let dimensions = data.size;

                if (map.series[0].tileIcon === 'hexagonal') {
                    //set tile size
                    tileSize = Math.min(Math.floor(map.plot.width / (dimensions.x - 1)), Math.floor(map.plot.height / (dimensions.y % 2 === 0 ? 0.5 + dimensions.y * 0.75 : dimensions.y * 0.75)));

                    //calculate margins
                    margins.x = (map.plot.width - (tileSize * dimensions.x)) / 2;
                    margins.y = (map.plot.height - (tileSize * (dimensions.y * 0.75))) / 2;
                }
                else {
                    //set tile size
                    tileSize = Math.min(Math.floor(map.plot.width / dimensions.x), Math.floor(map.plot.height / dimensions.y));

                    //calculate margins
                    margins.x = (map.plot.width - (tileSize * dimensions.x)) / 2;
                    margins.y = (map.plot.height - (tileSize * dimensions.y)) / 2;
                }

                //set radius
                r = tileSize / 2 - 1;

                //center g
                mapG.attr('transform', 'translate(' + map.plot.left + ',' + map.plot.top + ')');

                //set tile map data
                tileData = data.objects;

                //create tile shapes based on icon type
                if (map.series[0].tileIcon === 'circle')
                    createCircleTiles();
                else if (map.series[0].tileIcon === 'square')
                    createSquareTiles();
                else if (map.series[0].tileIcon === 'hexagonal')
                    createHexTiles();

                tiles
                    .on('mousemove', function (d, i) {
                        //check whether tooltip enabled
                        if (map.tooltip.format !== '') {
                            //set default tooltip content
                            tooltipContent = "no data available";
                            //check whether current data exists
                            if (d.currentData) {
                                //get values from shape
                                codeValue = d.code;
                                labelValue = d.name;

                                //set tooltip content
                                tooltipContent = map.tooltip.format.replaceAll('{code}', codeValue).replaceAll('{label}', labelValue);
                                tooltipContent = map.getContent(d.currentData, map.series[0], tooltipContent);
                            }
                            //show tooltip
                            map.showTooltip(tooltipContent);
                        }
                    })
                    .on('mouseout', function (d) {
                        //hide tooltip
                        map.hideTooltip();
                    });

                //check if labels are enabled
                //if (map.series[0].labelsEnabled && map.series[0].labelFormat !== '') {
                if (map.series[0].labelFormat !== '') {
                    //create labels
                    labels = mapG.append('g').selectAll('text')
                        .data(tileData)
                        .enter().append('text')
                        .style("text-anchor", "middle")
                        .style('font-family', map.series[0].labelFontFamily)
                        .style('font-style', map.series[0].labelFontStyle === 'bold' ? 'normal' : map.series[0].labelFontStyle)
                        .style('font-weight', map.series[0].labelFontStyle === 'bold' ? 'bold' : 'normal')
                        .attr("dy", ".35em")
                        .on('mousemove', function (d, i) {
                            //check whether tooltip enabled
                            if (map.tooltip.format !== '') {
                                //set default tooltip content
                                tooltipContent = "no data available";
                                //check whether current data exists
                                if (d.currentData) {
                                    //get values from shape
                                    codeValue = d.code;
                                    labelValue = d.name;

                                    //set tooltip content
                                    tooltipContent = map.tooltip.format.replaceAll('{code}', codeValue).replaceAll('{label}', labelValue);
                                    tooltipContent = map.getContent(d.currentData, map.series[0], tooltipContent);
                                }
                                //show tooltip
                                map.showTooltip(tooltipContent);
                            }
                        })
                        .on('mouseout', function (d) {
                            //hide tooltip
                            map.hideTooltip();
                        });
                }

                //raise on loaded
                if (map.onLoaded) map.onLoaded();

                //animate tiles
                animateTiles();
            });

            //attach clear content method to map
            map.clear = function () {
                //clear current data from all paths
                tiles.each(function (d) {
                    d.currentData = null;
                });
            };

            //set update method to chart
            map.update = function (data, keepAxis) {
                //set chart data
                map.data = data;

                //update xy domain
                map.calculateDomain();
                map.updateLegend();

                //animate tiles
                animateTiles();
            };

            //handles legend click
            map.legendClick = function (d, i) {
                if (map.legend.type === 'ranged') {
                    if (d.clicked) {
                        tiles.attr('fill-opacity', function (d) {
                            if (d.legendClass === 'ranged-' + i)
                                return 0.1;
                            else
                                return d.fillOpacity;
                        });
                    } else {
                        tiles.attr('fill-opacity', function (d) {
                            if (d.legendClass === 'ranged-' + i)
                                return 1;
                            else
                                return d.fillOpacity;
                        });
                    }
                }
            };

            //handles legend hover
            map.onLegendHover = function (d, i, status) {
                if (map.legend.type === 'ranged') {
                    if (status) {
                        tiles
                            .attr('fill-opacity', function (d) {
                                if (d.legendClass !== 'ranged-' + i)
                                    return 0.1;
                                else
                                    return d.fillOpacity;
                            })
                            .style('stroke-opacity', function (d) {
                                if (d.legendClass !== 'ranged-' + i)
                                    return 0.1;
                                else
                                    return d.fillOpacity;
                            });
                    } else {
                        tiles
                            .attr('fill-opacity', function (d) { return d.fillOpacity; })
                            .style('stroke-opacity', function (d) { return d.fillOpacity; });
                    }
                }
            };
        }

        setMapVariables();

        createMap();

        //return tile map
        return map;
    }

    //attach tile map method into the eve
    e.tileMap = function (options) {
        options.type = 'tileMap';
        options.masterType = 'map';
        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new tileMap(options);
    };
})(eve);