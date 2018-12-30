/*!
 * eve.seat.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for seat map.
 */
(function (e) {
    //define seat map class
    function seatMap(options) {
        //disable legend if direction is linear
        if (options.series[0].direction === 'linear') {
            if (options.legend) {
                options.legend.enabled = false;
            } else {
                options.legend = { enabled: false };
            }
        }

        //declare needed variables
        let that = this,
            diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            singleGroupWidth = 0,
            singleSeatWidth = 0,
            groups = [],
            sources = [],
            width = 0,
            height = 0,
            spaceOffset = 0,
            currentX = 0,
            posX = 0,
            posY = 0,
            maxGroupLength = 0,
            maxRowLength = 0,
            nearestFiller = 0,
            currentColor = '',
            currentData = null,
            currentG = null,
            currentRects = null,
            bandScale = null,
            pack = null,
            treemap = null,
            seatWidth = 0,
            bbox = null,
            bulletType = currentSerie.bullet === 'circle' ? 'circle' : 'square',
            outerRadius = 0,
            innerRadius = 0,
            seatCount = 0,
            maxSeatCount = 0,
            buffer = 0.5,
            colCount = 0,
            rowCount = 0,
            rowWidth = 0,
            ratio = 0.5,
            seats = [],
            diagramG = null,
            divider = 0,
            nestedData = null;

        //calculates scales
        function calculateScales() {
            //nest data
            nestedData = d3.nest().key(function (d) { return d[currentSerie.groupField]; }).entries(diagram.data);

            //set groups and sources
            groups = diagram.xAxis.xValues ? diagram.xAxis.xValues : e.getUniqueValues(diagram.data, currentSerie.groupField);
            sources = e.getUniqueValues(diagram.data, currentSerie.sourceField);

            //calculate dimensions
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right - diagram.margin.left - diagram.margin.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom - diagram.margin.top - diagram.margin.bottom;

            //calculate offset and single width
            spaceOffset = 20;
            divider = groups.length;

            //set divider if y axis is proper
            if (diagram.yAxis.maxSizeValue)
                divider = diagram.yAxis.maxSizeValue === Number.MIN_VALUE ? groups.length : diagram.yAxis.maxSizeValue;

            //calculate single group width
            singleGroupWidth = (width / divider) - spaceOffset;
            
            //check if the layout is linear
            if (currentSerie.direction === 'linear') {
                //set max group length
                maxGroupLength = d3.max(nestedData, function (d) { return d.values.length });

                //set divider if y axis is proper
                if (diagram.xAxis.maxSizeValue)
                    maxGroupLength = diagram.xAxis.maxSizeValue === Number.MIN_VALUE ? maxGroupLength : diagram.xAxis.maxSizeValue;

                //set nearest filer
                nearestFiller = Math.ceil(maxGroupLength / 10) * 10;

                //create pack
                //console.log(singleGroupWidth, height);
                //pack = d3.pack().padding(2).size([singleGroupWidth, height - singleGroupWidth]);

                //create treemap
                treemap = d3.treemap()
                    .tile(d3.treemapResquarify)
                    .size([singleGroupWidth, height - singleGroupWidth])
                    .round(true).paddingInner(0);
            }
        }

        //get root data for given group
        function getRootData(groupData, groupKey, groupIndex) {
            //set base data
            let baseData = { name: groupKey, children: [] },
                rootData = null;

            //iterate to filler
            for (let i = 0; i < nearestFiller; i++) {
                //crete group data
                let currentGroupData = groupData[i];

                //create a child node for the base
                let child = {
                    name: currentGroupData ? currentGroupData[currentSerie.sourceField] : '',
                    key: currentGroupData ? currentGroupData[currentSerie.sourceField] : '',
                    size: 1,
                    value: currentGroupData ? 1 : 0
                };

                //push child
                baseData.children.push(child);
            }

            //set hierarchy
            rootData = d3.hierarchy(baseData)
                .each(function (d) { if (/^other[0-9]+$/.test(d.name)) d.name = null; })
                .sum(function (d) { return +d.size; })
                .sort(function (a, b) { return b.value - a.value; });

            //mapify root
            treemap(rootData);

            //check if the first group to set row and col count
            if (groupIndex === 0) {
                //set counts
                rowCount = rootData._squarify.length;
                colCount = rootData._squarify[0].value;
            }

            //return leaves of the treemap
            return rootData.leaves();
        }

        // serializes and gets max
        function series(s, n) {
            let r = 0;
            for (let i = 0; i <= n; i++) {
                r += s(i);
            }
            return r;
        }

        //draws linear seats
        function drawLinear() {
            //remove current diagram if available
            if (diagramG) {
                //remove g
                if (diagram.animation.effect) {
                    //check whether the effect is fade
                    if (diagram.animation.effect === 'fade') {
                        //remove with transition
                        diagramG.transition().duration(1000).style('opacity', 0).remove('');
                    } else if (diagram.animation.effect === 'dim') {
                        //remove with transition
                        diagramG.style('opacity', 0.15);
                    } else if (diagram.animation.effect === 'add') {
                        //remove with transition
                        diagramG.style('opacity', 1);
                    } else {
                        //remove immediately
                        diagramG.remove('');
                    }
                } else {
                    //remove immediately
                    diagramG.remove('');
                }
            }

            //append g for diagram
            diagramG = diagram.svg.append('g')
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

            //declare nested g array
            let nestedG = [],
                titleHeigths = [],
                rowIndex = 0,
                colIndex = 0,
                colModulo = 0,
                maxHeight = 0;

            //iterae all nested data to set titles
            nestedData.forEach(function (currentNestedData, index) {
                //calculate single seat dimension
                currentX = (index * (singleGroupWidth + (index === 0 ? 0 : spaceOffset)));
                currentG = diagramG.append('g').attr('transform', 'translate(' + currentX + ')');

                //create group title
                let groupTitle = currentG.append('text')
                    .style('fill', diagram.xAxis.titleFontColor)
                    .style('fill-opacity', 0.5)
                    .style('font-size', (diagram.xAxis.titleFontSize) + 'px')
                    .style('font-family', diagram.xAxis.titleFontFamily + ', Arial, Helvetica, Ubuntu')
                    .style('font-style', diagram.xAxis.titleFontStyle === 'bold' ? 'normal' : diagram.xAxis.titleFontStyle)
                    .style('font-weight', diagram.xAxis.titleFontStyle === 'bold' ? 'bold' : 'normal')
                    .text(currentNestedData.key)
                    .attr('transform', 'translate(0, ' + diagram.xAxis.titleFontSize + ')');

                //wrap group title
                diagram.wrapText(groupTitle, singleGroupWidth);

                //get bbox of title
                bbox = groupTitle.node().getBoundingClientRect();

                //push title height
                titleHeigths.push(bbox.height);

                //push nested g
                nestedG.push(currentG);
            });

            //set max title height
            maxHeight = d3.max(titleHeigths) + diagram.xAxis.titleFontSize;

            //iterate all nested data
            nestedData.forEach(function (currentNestedData, index) {
                //set group specific values
                currentData = getRootData(currentNestedData.values, currentNestedData.key, index);
                currentColor = diagram.legend.legendColors.length > 0 ? (e.matchGroup(currentNestedData.key, diagram.legend.legendColors, 'color')) : (index >= e.colors.length ? e.randColor() : e.colors[index]);
                rowIndex = 0;
                colIndex = 0;

                //set seat width
                seatWidth = (Math.min(singleGroupWidth, height) / colCount) - 2;

                //create cells for the current set
                let currentCells = nestedG[index].selectAll("g")
                    .data(currentData)
                    .enter().append("g")
                    .attr("transform", function (d, i) {
                        //calculate dimension differences
                        colModulo = (i + 1) % colCount;

                        //set width and height and return data id
                        d._width = seatWidth;
                        d._height = seatWidth;
                        d._cornerRadius = seatWidth / 10;
                        d._radius = Math.sqrt(seatWidth) * 2;
                        d._backColor = i < currentNestedData.values.length ? currentColor : 'none';

                        //set posx and posy
                        if (bulletType === 'circle') {
                            d._posX = ((d._radius * 2) * colIndex) + d._radius;
                            d._posY = ((d._radius * 2) * rowIndex) + maxHeight + d._radius;
                        } else {
                            d._posX = (seatWidth * colIndex) + (colIndex * 2);
                            d._posY = (seatWidth * rowIndex) + maxHeight + (rowIndex * 2);
                        }

                        //check if new row
                        if (colModulo === 0) {
                            rowIndex++;
                            colIndex = 0;
                        } else {
                            colIndex++;
                        }

                        //return position of the sector
                        return "translate(" + d._posX + ",0)";
                    });

                //check serie bullet type
                if (bulletType === 'circle') {
                    //set rectangles
                    currentCells.append("circle")
                        //.attr("id", function (d) { return d.data.id; })
                        .attr('r', function (d) { return d._radius; })
                        //.attr('title', function (d) { return d.data.name + ':' + d.data.value; })
                        .attr("fill", function (d, i) { return d._backColor; })
                        .attr('fill-opacity', diagram.animation.effect === 'add' ? 0 : currentSerie.alpha)
                        .on('mousemove', function (d, i) {
                            //check index
                            if (i < currentNestedData.values.length) {
                                //change opacity
                                d3.select(this).attr('fill-opacity', 1);

                                //check whether the source is numeric
                                let isNumeric = d.data.key ? (d.data.key.toString().indexOf('Seat') > -1) : false;
                                let posIndex = (i + 1).toString();
                                let sourceVal = isNumeric ? posIndex : d.data.key;

                                //set group and source value
                                d.data._groupValue = currentNestedData.key;
                                d.data._sourceValue = sourceVal ? sourceVal : 1;

                                //show tooltip
                                diagram.showTooltip(diagram.getContent(d.data, currentSerie, diagram.tooltip.format, d.data._sourceValue));
                            }
                        })
                        .on('mouseout', function (d, i) {
                            //check index
                            if (i < currentNestedData.values.length) {
                                //change opacity
                                d3.select(this).attr('fill-opacity', currentSerie.alpha);

                                //hide tooltip
                                diagram.hideTooltip();
                            }
                        })
                        .transition().duration(diagram.animation.duration)
                        .ease(diagram.animation.easing.toEasing())
                        .attr('fill-opacity', currentSerie.alpha)
                        .attr('transform', function (d) { return 'translate(0,' + d._posY + ')'; });
                } else {
                    //set rectangles
                    currentCells.append("rect")
                        .attr("id", function (d) { return d.data.id; })
                        .attr('rx', function (d) { return d._cornerRadius; })
                        .attr('ry', function (d) { return d._cornerRadius; })
                        .attr("width", function (d) { return d._width; })
                        .attr("height", function (d) { return d._height; })
                        .attr("fill", function (d, i) { return d._backColor; })
                        .attr('fill-opacity', diagram.animation.effect === 'add' ? 0 : currentSerie.alpha)
                        .on('mousemove', function (d, i) {
                            //check index
                            if (i < currentNestedData.values.length) {
                                //change opacity
                                d3.select(this).attr('fill-opacity', 1);

                                //check whether the source is numeric
                                let isNumeric = (d.data.key.toString().indexOf('Seat') > -1);
                                let posIndex = (i + 1).toString();
                                let sourceVal = isNumeric ? posIndex : d.data.key;

                                //set group and source value
                                d.data._groupValue = currentNestedData.key;
                                d.data._sourceValue = sourceVal ? sourceVal : 1;

                                //show tooltip
                                diagram.showTooltip(diagram.getContent(d.data, currentSerie, diagram.tooltip.format, d.data._sourceValue));
                            }
                        })
                        .on('mouseout', function (d, i) {
                            //check index
                            if (i < currentNestedData.values.length) {
                                //change opacity
                                d3.select(this).attr('fill-opacity', currentSerie.alpha);

                                //hide tooltip
                                diagram.hideTooltip();
                            }
                        })
                        .transition().duration(diagram.animation.duration)
                        .ease(diagram.animation.easing.toEasing())
                        .attr('fill-opacity', currentSerie.alpha)
                        .attr('transform', function (d) { return 'translate(0,' + d._posY + ')'; })
                }
            });
        }

        //draws circular seats
        function drawCircular() {
            //clear seats
            seats = [];

            //set outer and inner radius
            outerRadius = Math.min(width / 2, height);
            innerRadius = outerRadius * ratio;

            //iterate all nested data
            nestedData.forEach(function (d, i) {
                //check data
                if (d) {
                    d._backColor = diagram.legend.legendColors.length > 0 ? (e.matchGroup(d.key, diagram.legend.legendColors, 'color')) : (i >= e.colors.length ? e.randColor() : e.colors[i]);
                } else {
                    d._backColor = 'none';
                }
            });

            //set seat count
            seatCount = diagram.data.length;

            //calculate max seat count
            (function () {
                let alpha = ratio / (1 - ratio);
                while (maxSeatCount < seatCount) {
                    rowCount++;
                    buffer += alpha;
                    maxSeatCount = series(function (i) { return Math.floor(Math.PI * (buffer + i)); }, rowCount - 1);
                }
            })();

            //set row width
            rowWidth = (outerRadius - innerRadius) / rowCount;

            //set polar and cartesian layout of the seats
            (function () {
                //declare seats that will be removed
                let seatsToRemove = maxSeatCount - seatCount;

                //iterate all rows
                for (let i = 0; i < rowCount; i++) {
                    //calculate radius and angle
                    let rowRadius = innerRadius + rowWidth * (i + 0.5);
                    let rowSeats = Math.floor(Math.PI * (buffer + i)) - Math.floor(seatsToRemove / rowCount) - (seatsToRemove % rowCount > i ? 1 : 0);
                    let anglePerSeat = Math.PI / rowSeats;

                    //iterate to row seats
                    for (let j = 0; j < rowSeats; j++) {
                        //set polar and cartesian layout
                        let seatObj = {};

                        //set polar coordinate
                        seatObj.polar = {
                            r: rowRadius,
                            teta: -Math.PI + anglePerSeat * (j + 0.5)
                        };

                        //set cartesian coordinate
                        seatObj.cartesian = {
                            x: seatObj.polar.r * Math.cos(seatObj.polar.teta),
                            y: seatObj.polar.r * Math.sin(seatObj.polar.teta)
                        };

                        //push to seats
                        seats.push(seatObj);
                    }
                };
            })();

            //sort seats by teta values or radius
            seats.sort(function (a, b) { return a.polar.teta - b.polar.teta || b.polar.r - a.polar.r; });

            //set seat data
            (function () {
                //declare indexes
                let setIndex = 0;
                let seatIndex = 0;

                //iterate all seats to fill them
                seats.forEach(function (s) {
                    //get current set
                    let currentSet = nestedData[setIndex];
                    let seatsInSet = currentSet ? currentSet.values.length : 0;
                    if (seatIndex >= seatsInSet) {
                        setIndex++;
                        seatIndex = 0;
                        currentSet = nestedData[setIndex];
                    }

                    //set data
                    s.set = currentSet;
                    s.data = currentSet ? currentSet.values[seatIndex] : {};

                    //increase seat index
                    seatIndex++;
                });
            })();

            //declare helper functions
            let seatX = function (d) { return d.cartesian.x; };
            let seatY = function (d) { return d.cartesian.y; };
            let seatRadius = function (d) {
                let r = 0.4 * rowWidth;
                if (d.data && typeof d.data.size === 'number') {
                    r *= d.data.size;
                }
                return r;
            };

            //remove current diagram if available
            if (diagramG) {
                //remove g
                if (diagram.animation.effect) {
                    //check whether the effect is fade
                    if (diagram.animation.effect === 'fade') {
                        //remove with transition
                        diagramG.transition().duration(1000).style('opacity', 0).remove('');
                    } else if (diagram.animation.effect === 'dim') {
                        //remove with transition
                        diagramG.style('opacity', 0.15);
                    } else if (diagram.animation.effect === 'add') {
                        //remove with transition
                        diagramG.style('opacity', 1);
                    } else {
                        //remove immediately
                        diagramG.remove('');
                    }
                } else {
                    //remove immediately
                    diagramG.remove('');
                }
            }

            //append g for diagram
            diagramG = diagram.svg.append('g')
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + (width / 2) + ',' + outerRadius + ')');

            //check bullet type
            if (bulletType === 'circle') {
                //attach seats to circles
                let circles = diagramG.selectAll(".eve-seatmap")
                    .data(seats)
                    .enter().append('circle')
                    .attr('class', 'eve-seatmap')
                    .attr('cx', 0)
                    .attr('cy', 0)
                    .attr('r', 0)
                    .attr('fill', function (d, i) {
                        return d.set ? d.set._backColor : 'none';
                    })
                    .attr('fill-opacity', diagram.animation.effect === 'add' ? 0 : currentSerie.alpha)
                    .on('mousemove', function (d, i) {
                        //change opacity
                        d3.select(this).attr('fill-opacity', 1);

                        //show tooltip
                        diagram.showTooltip(diagram.getContent(d.data, currentSerie, diagram.tooltip.format));
                    })
                    .on('mouseout', function (d, i) {
                        //change opacity
                        d3.select(this).attr('fill-opacity', currentSerie.alpha);

                        //hide tooltip
                        diagram.hideTooltip();
                    })
                    .transition().duration(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .delay(function (d, i) { return i * diagram.animation.delay; })
                    .attr('fill-opacity', currentSerie.alpha)
                    .attr("cx", seatX)
                    .attr("cy", seatY)
                    .attr("r", seatRadius);
            } else {
                //attach seats to circles
                let squares = diagramG.selectAll(".eve-seatmap")
                    .data(seats)
                    .enter().append('rect')
                    .attr('class', 'eve-seatmap')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', 0)
                    .attr('height', 0)
                    .attr('fill', function (d, i) {
                        //attach width and height
                        d._width = seatRadius(d) * 2;
                        d._height = d._width;
                        d._cornerRadius = d._width / 10;

                        //return set color
                        return d.set ? d.set._backColor : 'none';
                    })
                    .attr('fill-opacity', diagram.animation.effect === 'add' ? 0 : currentSerie.alpha)
                    .attr('rx', function (d) { return d._cornerRadius; })
                    .attr('ry', function (d) { return d._cornerRadius; })
                    .on('mousemove', function (d, i) {
                        //change opacity
                        d3.select(this).attr('fill-opacity', 1);

                        //show tooltip
                        diagram.showTooltip(diagram.getContent(d.data, currentSerie, diagram.tooltip.format));
                    })
                    .on('mouseout', function (d, i) {
                        //change opacity
                        d3.select(this).attr('fill-opacity', currentSerie.alpha);

                        //hide tooltip
                        diagram.hideTooltip();
                    })
                    .transition().duration(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .delay(function (d, i) { return i * diagram.animation.delay; })
                    .attr('fill-opacity', currentSerie.alpha)
                    .attr("x", seatX)
                    .attr("y", seatY)
                    .attr("width", function (d) { return d._width; })
                    .attr("height", function (d) { return d._height; });
            }
        }

        //calculate scales
        calculateScales();

        //create seats
        if (currentSerie.direction === 'linear')
            drawLinear();
        else
            drawCircular();

        //attach update method to the chart
        diagram.update = function (data, keepAxis) {
            //update chart data
            diagram.data = data;

            //update legend
            diagram.updateLegend();

            //re-calculate environment to place the seats
            calculateScales();

            //create seats
            if (currentSerie.direction === 'linear')
                drawLinear();
            else
                drawCircular();
        };

        //attach clear content method to chart
        diagram.clear = function () {
            //remove g from the content
            diagram.svg.selectAll('.eve-vis-g').remove();
        };

        //return seatmap obejct
        return diagram;
    }

    //attach seat map method into the eve
    e.seatMap = function (options) {
        options.masterType = 'grouped';
        options.type = "seatMap";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new seatMap(options);
    };

    //attach seat map method into the eve
    e.seatmap = function (options) {
        options.masterType = 'grouped';
        options.type = "seatMap";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new seatMap(options);
    };
})(eve);