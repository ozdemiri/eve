/*!
 * eve.sliced.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for sliced charts.
 */
(function (e) {
    //define sliced chart class
    function slicedChart(options) {
        //set internal members for xy specific charts
        options.__baseChartType = "sliced";

        //declare needed variables
        let that = this,
            chart = eve.initVis(options),
            currentSerie = chart.series[0],
            currentFontSize = 11,
            xField = chart.xField,
            valueField = currentSerie.valueField || currentSerie.yField || currentSerie.sizeField,
            data = e.clone(chart.data),
            emptyData = e.clone(chart.data),
            sliceSeries = null,
            sliceLabels = null,
            sliceLabelLines = null,
            chartG = null,
            explodeOffset = 15,
            width = (chart.plot.width - chart.plot.left - chart.plot.right) - explodeOffset,
            height = (chart.plot.height - chart.plot.bottom - chart.plot.top) - explodeOffset,
            transX = 0,
            transY = 0,
            tempTextSVG = null,
            tempTextSVGOffset = null,
            arc = null,
            bbox = null,
            fakeArc = null,
            labelArc = null;

        //handles mouse move
        let handleMouseMove = function (obj, d) {
            //set slice hover
            d3.select(obj).attr('fill-opacity', currentSerie.sliceHoverAlpha);
            
            //show tooltip
            chart.showTooltip(chart.getContent(d, currentSerie, chart.tooltip.format));
        };

        //handles mouse out
        let handleMouseOut = function (obj, d) {
            //set slice hover
            d3.select(obj).attr('fill-opacity', currentSerie.alpha);

            //hide tooltip
            chart.hideTooltip();
        };

        //handles slice click
        let handleSliceClick = function (obj, d) {
            //set whether the sliced clicked
            if (!d.clicked) {
                d.clicked = true;
            } else {
                d.clicked = null;
            }

            //raise slice click event
            if (chart.sliceClick)
                chart.sliceClick(d.data);

            //switch chart type to act to click event
            switch (chart.type) {
                case "donutChart":
                case "pieChart":
                    {
                        //get arc center
                        let arcCenter = arc.centroid(d);

                        //check if the slice has clicked
                        if (d.clicked) {
                            d3.select(obj).transition().duration(100).attr('transform', explode(d, true))
                        } else {
                            d3.select(obj).transition().duration(100).attr('transform', explode(d, false))
                        }
                    }
                    break;
                case "funnelChart":
                    {
                        //check if the slice has clicked
                        if (d.clicked) {
                            d3.select(obj).transition().duration(100).attr('transform', 'translate(' + explodeOffset + ',0)');
                        } else {
                            d3.select(obj).transition().duration(100).attr('transform', 'translate(0,0)');
                        }
                    }
                    break;
                default:
                    {
                        //declare x and y
                        let newX = width / 2,
                            newY = height / 2;

                        //check if the slice has clicked
                        if (d.clicked) {
                            newX += explodeOffset;
                            d3.select(obj).transition().duration(100).attr('transform', 'rotate(180,' + newX + ',' + newY + ')');
                        } else {
                            d3.select(obj).transition().duration(100).attr('transform', 'rotate(180,' + newX + ',' + newY + ')');
                        }
                    }
                    break;
            }
        };

        //get explode translation
        let explode = function (x, isClicked) {
            switch (chart.type) {
                case "pieChart":
                case "donutChart":
                    {
                        let offset = isClicked ? explodeOffset : 0;
                        let angle = (x.startAngle + x.endAngle) / 2;
                        let xOff = Math.sin(angle) * offset;
                        let yOff = -Math.cos(angle) * offset;
                        return "translate(" + xOff + "," + yOff + ")";
                    }
                    break;
            }
        };

        //gets class name
        let getClassName = function (d, index) {
            //set class name
            let className = "eve-vis-series";
            let dataVal = (d.data && d.data[currentSerie.xField]) ? d.data[currentSerie.xField] : "";

            //direct row 
            if (!dataVal)
                dataVal = d[currentSerie.xField];

            //check whether the current data has serie index member
            if (d.index != null) {
                className += " eve-vis-series-" + d.index;
            } else if (index != null) {
                className += " eve-vis-series-" + index;
            }

            //set named serie class
            if (dataVal) {
                if (chart.columnNames[dataVal]) {
                    dataVal = chart.columnNames[dataVal].toString();
                }
                className += " serie-" + dataVal.toString().toClassSelector();
            }

            return className;
        };

        //renders pie chart
        let renderPieChart = function () {
            //declare donut data function
            let sliceData = d3.pie().sort(null).value(function (d) {
                return Math.abs(+d[currentSerie.yField]) || Math.abs(+d[currentSerie.sizeField]) || Math.abs(+d[currentSerie.valueField]);
            });
            let autoMargin = 0;
            let maxTextLength = 0;
            let maxText = "";
            let outerRadius = 0;
            let innerRadius = 0;
            let labelRadius = 0;
            let alpha = 0.5;
            let spacing = 12;

            //set translations and dimensions
            width = (chart.plot.width - chart.plot.left - chart.plot.right) - explodeOffset;
            height = (chart.plot.height - chart.plot.bottom - chart.plot.top) - explodeOffset;
            transX = (chart.plot.width - chart.plot.left - chart.plot.right) / 2;
            transY = chart.plot.top + height / 2;

            //sets default members of pie/donut chart
            function setDefaults() {
                //set serie label position
                if (currentSerie.labelPosition === 'auto')
                    currentSerie.labelPosition = 'inside';

                //set font size
                currentFontSize = currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize;
                
                //iterate all datasets
                maxTextLength = 0;
                data.forEach(function (d, i) {
                    //define color of the slice
                    let legendColor = chart.legend.legendColors.length > 0 ? e.matchGroup(d[chart.xField], chart.legend.legendColors, 'color') : null;
                    let serieColor = legendColor ? legendColor : (i >= e.colors.length ? e.randColor() : e.colors[i]);
                    let currentText = chart.getContent(d, currentSerie, currentSerie.labelFormat).toString();

                    //set value field
                    d.value = d[currentSerie.valueField];
                    d[currentSerie.valueField] = Math.abs(d[currentSerie.valueField]);
                    
                    //set text length
                    if (currentText.length > maxTextLength) {
                        maxTextLength = currentText.length;
                        maxText = currentText;
                    }
                    
                    //set slice color
                    d.sliceColor = serieColor;

                    //set empty dataset
                    if (emptyData[i])
                        emptyData[i].sliceColor = serieColor;

                    //check whether the current serie has color field
                    if (currentSerie.colorField !== '') {
                        d.sliceColor = d[currentSerie.colorField];

                        //set empty dataset
                        if (emptyData[i])
                            emptyData[i].sliceColor = d[currentSerie.colorField];
                    } else if (currentSerie.dataColors) {
                        d.sliceColor = currentSerie.dataColors[d[chart.xField].toString()];

                        //set empty dataset
                        if (emptyData[i])
                            emptyData[i].sliceColor = currentSerie.dataColors[d[chart.xField].toString()];
                    }

                    //iterate all keys in current data
                    for (let colKey in d) {
                        //set empty dataset
                        if (emptyData[i]) {
                            if (colKey === currentSerie.yField)
                                emptyData[i][colKey] = 0;
                            else if (colKey === currentSerie.sizeField)
                                emptyData[i][colKey] = 0;
                            else if (colKey === currentSerie.valueField)
                                emptyData[i][colKey] = 0;
                        }
                    }
                });

                //attach max text to get dimension of it
                tempTextSVG = chartG.append("text")
                    .style('font-size', currentFontSize + 'px')
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .text(maxText);

                //extract the offset for the text
                tempTextSVGOffset = tempTextSVG.node().getBoundingClientRect();
                
                //remove temp text
                tempTextSVG.remove();

                //calculate plot area
                autoMargin = tempTextSVGOffset.width / 2;//(tempTextSVGOffset.width + tempTextSVGOffset.height) * 2;
                width = (chart.plot.width - chart.plot.left - chart.plot.right) - explodeOffset - autoMargin;
                height = (chart.plot.height - chart.plot.bottom - chart.plot.top) - explodeOffset - autoMargin;
                transX = (chart.plot.width - chart.plot.left - chart.plot.right) / 2;
                transY = (chart.plot.height - chart.plot.top - chart.plot.bottom) / 2;
                outerRadius = Math.min(width, height) / 2 - ((currentSerie.labelFormat !== '' && currentSerie.labelPosition === 'outside') ? autoMargin : 0);
                innerRadius = chart.type === "donutChart" ? (outerRadius / 2) : 0;
                arc = d3.arc().outerRadius(outerRadius).innerRadius(innerRadius);
                fakeArc = d3.arc().outerRadius(outerRadius).innerRadius(outerRadius - 1);
                labelRadius = currentSerie.labelPosition === 'inside' ? outerRadius - autoMargin : outerRadius + 10;
                labelArc = d3.arc().outerRadius(labelRadius).innerRadius(labelRadius);

                //set center
                chartG.attr('transform', 'translate(' + transX + ',' + transY + ')');

                //set chart arc
                chart.__tempArc = arc;
            }

            //gets the angle of the arc
            function textAngle(d) {
                //check whethe the current serie's label angle is auto
                if (currentSerie.labelAngle !== 'auto')
                    return currentSerie.labelAngle;

                //get angle
                let angle = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;

                //return new angle
                return angle > 90 ? angle - 180 : angle;
            }

            //checks whether the given point in the arc
            function pointIsInArc(pt, ptData, d3Arc) {
                // Center of the arc is assumed to be 0,0
                let r1 = arc.innerRadius()(ptData),
                    r2 = arc.outerRadius()(ptData),
                    theta1 = arc.startAngle()(ptData),
                    theta2 = arc.endAngle()(ptData);

                //calculate distance and angle
                let dist = pt.x * pt.x + pt.y * pt.y,
                    angle = Math.atan2(pt.x, -pt.y);

                //calculate angle
                angle = (angle < 0) ? (angle + Math.PI * 2) : angle;

                //return status
                return (r1 * r1 <= dist) && (dist <= r2 * r2) && (theta1 <= angle) && (angle <= theta2);
            }

            //relaxes labels
            function relaxLabels() {
                again = false;
                sliceLabels.each(function (d, i) {
                    a = this;
                    da = d3.select(a);
                    y1 = da.attr("y");
                    sliceLabels.each(function (d, j) {
                        b = this;
                        if (a == b) return;
                        db = d3.select(b);
                        if (da.attr("text-anchor") != db.attr("text-anchor")) return;
                        y2 = db.attr("y");
                        deltaY = y1 - y2;
                        if (Math.abs(deltaY) > spacing) return;
                        again = true;
                        sign = deltaY > 0 ? 1 : -1;
                        adjust = sign * alpha;
                        da.attr("y", +y1 + adjust);
                        db.attr("y", +y2 - adjust);
                    });
                });

                //run again
                if (again) {
                    setTimeout(relaxLabels, 20)
                }
            }

            //animates pie slices
            function animateSlices() {
                //set slice data
                let slicedData = sliceData(data);

                //set chart sliced set
                chart.__slicedSet = slicedData;

                //animate slices
                sliceSeries
                    .data(slicedData)
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * chart.animation.delay; })
                    .attrTween('d', function (d) {
                        let interpolate = d3.interpolate(this._current, d);
                        this._current = interpolate(0);
                        return function (t) {
                            return arc(interpolate(t));
                        };
                    });

                //if there is no label formatting then no need a run
                if (!currentSerie.labelFormat)
                    return false;

                //check label position
                switch (currentSerie.labelPosition) {
                    case "inside":
                        {
                            //animate labels
                            sliceLabels
                                .transition().duration(chart.animation.duration)
                                .ease(chart.animation.easing.toEasing())
                                .delay(function (d, i) { return i * chart.animation.delay; })
                                .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")rotate(" + textAngle(d) + ")"; });
                        }
                        break;
                    case "outside":
                        {
                            //animate labels
                            sliceLabels
                                .style('text-anchor', function (d) {
                                    arcCentroid = arc.centroid(d);
                                    midAngle = Math.atan2(arcCentroid[1], arcCentroid[0]);
                                    x = Math.cos(midAngle) * (outerRadius + maxTextLength);
                                    return (x > 0) ? "start" : "end";
                                })
                                .transition().duration(chart.animation.duration)
                                .ease(chart.animation.easing.toEasing())
                                .delay(function (d, i) { return i * chart.animation.delay; })
                                .attr('x', function (d) {
                                    arcCentroid = arc.centroid(d);
                                    midAngle = Math.atan2(arcCentroid[1], arcCentroid[0]);
                                    xPos = Math.cos(midAngle) * (outerRadius + maxTextLength);
                                    sign = (xPos > 0) ? 1 : -1;
                                    labelX = xPos + (5 * sign);
                                    return labelX;
                                })
                                .attr('y', function (d) {
                                    arcCentroid = arc.centroid(d);
                                    midAngle = Math.atan2(arcCentroid[1], arcCentroid[0]);
                                    y = Math.sin(midAngle) * (outerRadius + maxTextLength);
                                    return y;
                                });

                            //set label lines
                            sliceLabelLines
                                .transition().duration(chart.animation.duration)
                                .ease(chart.animation.easing.toEasing())
                                .delay(function (d, i) { return i * chart.animation.delay; })
                                .attr('x2', function (d) {
                                    arcCentroid = arc.centroid(d);
                                    midAngle = Math.atan2(arcCentroid[1], arcCentroid[0]);
                                    xPos = Math.cos(midAngle) * (outerRadius + maxTextLength);
                                    return xPos;
                                })
                                .attr('y2', function (d) {
                                    arcCentroid = arc.centroid(d);
                                    midAngle = Math.atan2(arcCentroid[1], arcCentroid[0]);
                                    yPos = Math.sin(midAngle) * (outerRadius + maxTextLength);
                                    return yPos;
                                });

                            //initiate relaxing labels
                            relaxLabels();
                        }
                        break;
                }
            }

            //draws slices
            function drawSlices() {
                //set slice series
                sliceSeries = chartG.selectAll('path')
                    .data(sliceData(emptyData))
                    .enter()
                    .append('path')
                    .attr('d', arc)
                    .attr('class', getClassName)
                    .attr('fill-opacity', currentSerie.alpha)
                    .attr('fill', function (d) { return d.data.sliceColor; })
                    .attr('stroke', currentSerie.sliceStrokeColor === '' ? 'rgb(255,255,255)' : currentSerie.sliceStrokeColor)
                    .attr('stroke-opacity', currentSerie.sliceStrokeAlpha)
                    .attr('stroke-width', currentSerie.sliceStrokeThickness)
                    .on('click', function (d) { handleSliceClick(this, d); })
                    .on('mousemove', function (d) { handleMouseMove(this, d); })
                    .on('mouseout', function (d) { handleMouseOut(this, d); })
                    .each(function (d) { this._current = d; });
            }

            //draws labels
            function renderLabels() {
                //if there is no label formatting then no need a run
                if (!currentSerie.labelFormat)
                    return false;

                //check label position
                switch (currentSerie.labelPosition) {
                    case "inside":
                        {
                            //create pie labels
                            sliceLabels = chartG.selectAll('text')
                                .data(sliceData(data))
                                .enter().append('text')
                                .attr("dy", ".35em")
                                .style('text-anchor', 'middle')
                                .style('pointer-events', 'none')
                                .style('fill', function (d) { return currentSerie.labelFontColor === 'auto' ? d3.color(d.data.sliceColor).brighter(5) : currentSerie.labelFontColor; })
                                .style('font-size', currentFontSize + 'px')
                                .style('font-family', currentSerie.labelFontFamily)
                                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                                .text(function (d) {
                                    return chart.getContent(d, currentSerie, currentSerie.labelFormat);
                                })
                                .attr("transform", function (d) { return "translate(0,0)rotate(" + textAngle(d) + ")"; })
                                .each(function (d, i) {
                                    //get bbox and center of the arc
                                    bbox = this.getBBox();
                                    let arcCentroid = labelArc.centroid(d);
                                    let topLeft = { x: arcCentroid[0] + bbox.x, y: arcCentroid[1] + bbox.y };
                                    let topRight = { x: topLeft.x + bbox.width, y: topLeft.y };
                                    let bottomLeft = { x: topLeft.x, y: topLeft.y + bbox.height };
                                    let bottomRight = { x: topLeft.x + bbox.width, y: topLeft.y + bbox.height };

                                    //set visibility
                                    d.visible = true;//(pointIsInArc(topLeft, d, arc) && pointIsInArc(topRight, d, arc) && pointIsInArc(bottomLeft, d, arc) && pointIsInArc(bottomRight, d, arc));
                                })
                                .style('display', function (d) {
                                    if (currentSerie.labelFontSize !== 'auto')
                                        return null
                                    return currentSerie.labelVisibility === 'always' ? null : (d.visible ? null : 'none');
                                });
                        }
                        break;
                    default:
                        {
                            //create pie lines
                            sliceLabelLines = chartG.selectAll('line')
                                .data(sliceData(data))
                                .enter().append('line')
                                .style('stroke', currentSerie.segmentLineColor)
                                .style('stroke-width', currentSerie.segmentLineThickness)
                                .style('stroke-opacity', currentSerie.segmentLineAlpha)
                                .attr("dy", ".35em")
                                .attr('x1', function (d) { return fakeArc.centroid(d)[0]; })
                                .attr('y1', function (d) { return fakeArc.centroid(d)[1]; })
                                .attr('x2', function (d) { return fakeArc.centroid(d)[0]; })
                                .attr('y2', function (d) { return fakeArc.centroid(d)[1]; });

                            //create pie labels
                            sliceLabels = chartG.selectAll('text')
                                .data(sliceData(data))
                                .enter().append('text')
                                .attr("dy", ".35em")
                                .style('text-anchor', function (d) {
                                    arcCentroid = arc.centroid(d);
                                    midAngle = Math.atan2(arcCentroid[1], arcCentroid[0]);
                                    x = Math.cos(midAngle) * (outerRadius + maxTextLength);
                                    return (x > 0) ? "start" : "end";
                                })
                                .style('pointer-events', 'none')
                                .style('fill', function (d) {
                                    if (currentSerie.labelFontSize === 'auto')
                                        return '#333333';
                                    return currentSerie.labelFontColor === 'auto' ? d3.color(d.data.sliceColor).brighter(5) : currentSerie.labelFontColor;
                                })
                                .style('font-size', currentFontSize + 'px')
                                .style('font-family', currentSerie.labelFontFamily)
                                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                                .text(function (d) { return chart.getContent(d, currentSerie, currentSerie.labelFormat); })
                                .attr('x', 0)
                                .attr('y', 0);
                        }
                        break;
                }
            }

            //create chart g
            chartG = chart.svg.append('g').attr('class', 'eve-vis-g');

            //render sliced pie/donut chart
            setDefaults();
            drawSlices();
            renderLabels();
            animateSlices();
        };

        //renders funnel chart
        let renderFunnelChart = function () {
            //declare needed variables
            let height = chart.plot.height - chart.plot.top - chart.plot.bottom - currentSerie.neckHeight;
            let width = chart.plot.width - chart.plot.left - chart.plot.right;
            let gradePercent = chart.type === "funnelChart" ? (1 / 10) : (1 / 200);
            let grade = 2 * height / (width - gradePercent * width);
            let totalArea = (width + gradePercent * width) * height / 2;
            let totalData = d3.sum(data, function (d) { return Math.abs(d[valueField]); });
            let paths = null;
            let tempPaths = null;
            let autoMargin = 0;
            let maxTextLength = 0;
            let maxText = "";
            let xPos = 0;
            let yPos = 0;
            let sliceHeight = 0;
            let pathInfo = null;
            let funnel = d3.line().x(function (d) { return d[0]; }).y(function (d) { return d[1]; });

            //gets paths
            function getPaths(dataset) {
                let paths = [], pathPoints = [];

                //inner function to create path points
                function createPathPoints(ll, lr, lh, i) {
                    if (i >= dataset.length) return;
                    v = dataset[i][valueField];
                    a = v * totalArea / totalData;
                    pw = lr - ll;
                    nw = Math.sqrt((grade * pw * pw - 4 * a) / grade);
                    nl = (pw - nw) / 2 + ll;
                    nr = lr - (pw - nw) / 2;
                    nh = (grade * (pw - nw) / 2 + lh);

                    pathPoints = [[nr, nh]];
                    pathPoints.push([lr, lh]);
                    pathPoints.push([ll, lh]);
                    pathPoints.push([nl, nh]);
                    pathPoints.push([nr, nh]);

                    //check whether the neck height > 0
                    if (currentSerie.neckHeight > 0 && chart.type === "funnelChart") {
                        //create neck path
                        if (i === dataset.length - 1) {
                            pathPoints.push([nr, nh + currentSerie.neckHeight]);
                            pathPoints.push([nl, nh + currentSerie.neckHeight]);
                            pathPoints.push([nl, nh]);
                        }
                    }

                    paths.push(pathPoints);
                    createPathPoints(nl, nr, nh, i + 1);
                }

                createPathPoints(0, width, 0, 0);
                return paths;
            }

            //sets default members of pie/donut chart
            function setDefaults() {
                //set serie label position
                if (currentSerie.labelPosition === 'auto')
                    currentSerie.labelPosition = 'inside';

                //set font size
                currentFontSize = currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize;

                //iterate all datasets
                maxTextLength = 0;
                data.forEach(function (d, i) {
                    //define color of the slice
                    let legendColor = chart.legend.legendColors.length > 0 ? e.matchGroup(d[chart.xField], chart.legend.legendColors, 'color') : null;
                    let serieColor = legendColor ? legendColor : (i >= e.colors.length ? e.randColor() : e.colors[i]);
                    let currentText = chart.getContent(d, currentSerie, currentSerie.labelFormat).toString();

                    //set value field
                    d[currentSerie.valueField] = Math.abs(d[currentSerie.valueField]);

                    //set text length
                    if (currentText.length > maxTextLength) {
                        maxTextLength = currentText.length;
                        maxText = currentText;
                    }

                    //set slice color
                    d.sliceColor = serieColor;

                    //set empty dataset
                    if (emptyData[i])
                        emptyData[i].sliceColor = serieColor;

                    //check whether the current serie has color field
                    if (currentSerie.colorField !== '') {
                        d.sliceColor = d[currentSerie.colorField];

                        //set empty dataset
                        if (emptyData[i])
                            emptyData[i].sliceColor = d[currentSerie.colorField];
                    } else if (currentSerie.dataColors) {
                        d.sliceColor = currentSerie.dataColors[d[chart.xField].toString()];

                        //set empty dataset
                        if (emptyData[i])
                            emptyData[i].sliceColor = currentSerie.dataColors[d[chart.xField].toString()];
                    }

                    //iterate all keys in current data
                    for (let colKey in d) {
                        //set empty dataset
                        if (emptyData[i]) {
                            //set zeroed dataset
                            if (colKey === currentSerie.yField)
                                emptyData[i][colKey] = 0;
                            else if (colKey === currentSerie.sizeField)
                                emptyData[i][colKey] = 0;
                            else if (colKey === currentSerie.valueField)
                                emptyData[i][colKey] = 0;
                        }
                    }
                });

                //attach max text to get dimension of it
                tempTextSVG = chartG.append("text")
                    .style('font-size', currentFontSize + 'px')
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .text(maxText);

                //extract the offset for the text
                tempTextSVGOffset = tempTextSVG.node().getBoundingClientRect();

                //remove temp text
                tempTextSVG.remove();

                //calculate plot area
                autoMargin = (currentSerie.labelFormat && currentSerie.labelPosition === "outside") ? tempTextSVGOffset.width : 0;
                width = (chart.plot.width - chart.plot.left - chart.plot.right) - explodeOffset - autoMargin;
                height = (chart.plot.height - chart.plot.bottom - chart.plot.top) - explodeOffset;
                let gradePercent = chart.type === "funnelChart" ? (1 / 10) : (1 / 200);
                grade = 2 * height / (width - gradePercent * width);
                totalArea = (width + gradePercent * width) * height / 2;
                
                //get trapezoid paths
                paths = getPaths(emptyData);
                tempPaths = getPaths(data);

                //set temp width and hight
                chart.__funnelWidth = width;
                chart.__funnelHeight = height;
            }

            //draws slices
            function drawSlices() {
                //cehck label position
                if (currentSerie.labelPosition === 'outside' && currentSerie.labelFormat) {
                    //create pie lines
                    sliceLabelLines = chartG.selectAll('line')
                        .data(data)
                        .enter().append('line')
                        .style('stroke', currentSerie.segmentLineColor)
                        .style('stroke-width', currentSerie.segmentLineThickness)
                        .style('stroke-opacity', 0.2)
                        .attr("dy", ".35em")
                        .attr('x1', width / 2)
                        .attr('y1', function (d, i) {
                            pathInfo = tempPaths[i];
                            sliceHeight = pathInfo[0][1] - pathInfo[1][1];
                            return chart.type === "funnelChart" ? (pathInfo[0][1] - sliceHeight / 2) : (height - pathInfo[0][1] + sliceHeight / 2);
                        })
                        .attr('x2', width / 2)
                        .attr('y2', function (d, i) {
                            pathInfo = tempPaths[i];
                            sliceHeight = pathInfo[0][1] - pathInfo[1][1];
                            return chart.type === "funnelChart" ? (pathInfo[0][1] - sliceHeight / 2) : (height - pathInfo[0][1] + sliceHeight / 2);
                        });
                }

                //create funnel slices
                sliceSeries = chartG.selectAll('path.eve-vis-series')
                    .data(emptyData)
                    .enter().insert('path')
                    .attr('class', function (d, i) {
                        return getClassName(d, i);
                    })
                    .attr('d', function (d, i) { return funnel(paths[i]); })
                    .attr('fill-opacity', function (d) { return currentSerie.alphaField ? +d[currentSerie.alphaField] : currentSerie.alpha; })
                    .attr('fill', function (d) { return d.sliceColor; })
                    .attr('stroke', currentSerie.sliceStrokeColor === '' ? 'rgb(255,255,255)' : currentSerie.sliceStrokeColor)
                    .attr('stroke-opacity', currentSerie.sliceStrokeAlpha)
                    .attr('stroke-width', currentSerie.sliceStrokeThickness)
                    .on('click', function (d) { handleSliceClick(this, d); })
                    .on('mousemove', function (d) { handleMouseMove(this, d); })
                    .on('mouseout', function (d) { handleMouseOut(this, d); });

                //is that a pyramid?
                if (chart.type === "pyramidChart")
                    sliceSeries.attr('transform', 'rotate(180,' + width / 2 + ',' + height / 2 + ')');

                //if there is no label formatting then no need a run
                if (!currentSerie.labelFormat)
                    return false;

                //create labels
                sliceLabels = chartG.selectAll('text')
                    .data(data)
                    .enter().append('text')
                    .style('text-anchor', currentSerie.labelPosition === 'inside' ? 'middle' : 'end')
                    .style('pointer-events', 'none')
                    .style('fill', function (d) {
                        if (currentSerie.labelPosition === 'outside') {
                            if (currentSerie.labelFontSize === 'auto')
                                return '#333333';
                        }
                        return currentSerie.labelFontColor === 'auto' ? d3.color(d.sliceColor).brighter(5) : currentSerie.labelFontColor;
                    })
                    .style('font-size', currentFontSize + 'px')
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .text(function (d) { return chart.getContent(d, currentSerie, currentSerie.labelFormat); })
                    .each(function (d, i) {
                        //get positions
                        pathInfo = tempPaths[i];

                        //get slice height
                        sliceHeight = pathInfo[0][1] - pathInfo[1][1];

                        //check whether the slice height > font size
                        d.visible = sliceHeight > currentFontSize;
                    })
                    .style('display', function (d) { return currentSerie.labelVisibility === 'always' ? null : (d.visible ? null : 'none'); });
            }

            //animates slices
            function animateSlices() {
                //update paths
                paths = getPaths(data);

                //animate funnel series
                sliceSeries
                    .data(chart.data)
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * chart.animation.delay; })
                    .attr('d', function (d, i) { return funnel(paths[i]); });

                //if there is no label formatting then no need a run
                if (!currentSerie.labelFormat)
                    return false;

                //check label posiion
                if (currentSerie.labelPosition === 'inside') {
                    //animate labels
                    sliceLabels
                        .transition().duration(chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .delay(function (d, i) { return i * chart.animation.delay; })
                        .attr('transform', function (d, i) {
                            //get positions
                            pathInfo = paths[i];

                            //set x and y pos
                            sliceHeight = pathInfo[0][1] - pathInfo[1][1];
                            xPos = width / 2;
                            yPos = chart.type === "funnelChart" ? (pathInfo[0][1] - sliceHeight / 2 + currentFontSize / 2) : ((height - pathInfo[1][1]) - (sliceHeight / 2) + (currentFontSize / 2));

                            //return translation
                            return 'translate(' + xPos + ',' + yPos + ')';
                        });
                } else {
                    //animate labels
                    sliceLabels
                        .transition().duration(chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .delay(function (d, i) { return i * chart.animation.delay; })
                        .attr('transform', function (d, i) {
                            //get positions
                            pathInfo = paths[i];
                            bbox = this.getBBox();

                            //set x and y pos
                            sliceHeight = pathInfo[0][1] - pathInfo[1][1];
                            xPos = width + bbox.width;
                            yPos = chart.type === "funnelChart" ? (pathInfo[0][1] - sliceHeight / 2 + currentFontSize / 2) : (height - pathInfo[0][1] + sliceHeight / 2);
                            
                            //return translation
                            return 'translate(' + xPos + ',' + yPos + ')';
                        });

                    //aimate lines
                    sliceLabelLines
                        .transition().duration(chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .delay(function (d, i) { return i * chart.animation.delay; })
                        .attr('x2', function (d, i) {
                            pathInfo = tempPaths[i];
                            return pathInfo[0][0] + (width - pathInfo[0][0]);
                        });
                }
            }

            //create chart g
            chartG = chart.svg.append('g').attr('class', 'eve-vis-g').attr('transform', 'translate(' + chart.plot.left + ',' + chart.plot.top + ')');

            //render sliced funnel/pyramid chart
            setDefaults();
            drawSlices();
            animateSlices();
        };

        //switch chart type to render
        switch (chart.type) {
            case 'donutChart':
            case 'pieChart':
                renderPieChart();
                break;
            case 'funnelChart':
            case 'pyramidChart':
                renderFunnelChart();
                break;
        }

        //updates chart
        chart.update = function (data, title) {
            //update chart data
            chart.data = data;

            //clear content
            $("#" + chart.container).html("");

            //check title content
            if (title)
                chart.title.content = title;

            //re-create the chart
            eve[chart.type](chart);
        };

        //attach clear content method to chart
        chart.clear = function () {
            //remove g from the content
            chart.svg.selectAll('.eve-vis-g').remove();
        };

        //return column chart
        return chart;
    }

    //attach donut chart
    eve.donutChart = function (options) {
        //update options
        options.type = 'donutChart';
        options.masterType = "sliced";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the charts
        return new slicedChart(options);
    };

    //attach funnel chart
    eve.funnelChart = function (options) {
        //update options
        options.type = 'funnelChart';
        options.masterType = "sliced";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the charts
        return new slicedChart(options);
    };

    //attach funnel chart
    eve.pieChart = function (options) {
        //update options
        options.type = 'pieChart';
        options.masterType = "sliced";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the charts
        return new slicedChart(options);
    };

    //attach funnel chart
    eve.pyramidChart = function (options) {
        //update options
        options.type = 'pyramidChart';
        options.masterType = "sliced";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the charts
        return new slicedChart(options);
    };
})(eve);