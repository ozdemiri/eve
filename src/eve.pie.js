/*!
 * eve.charts.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Pie chart class.
 */
(function(e) {
    //serie defaults
    var defaults = {
        alphaField: '',
        colorField: '',
        hoverOpacity: .9,
        labelPosition: 'inside',
        labelFontColor: '#ffffff',
        labelFontFamily: 'Tahoma',
        labelFontSize: 11,
        labelFontStyle: 'normal',
        labelFormat: '{percent}',
        sliceBorderOpacity: .1,
        titleField: '',
        valueField: '',
        valueFormat: ''
    };

    //pie chart class
    function pie(options) {
        //create chart
        var that = this,
            chart = e.charts.init(options),
            isDonut = options.type === 'donut',
            serie = e.extend(chart.series[0], defaults),
            transX = chart.width / 2,
            transY = chart.height / 2,
            pieWidth = chart.width,
            pieHeight = chart.height,
            pieData = d3.layout.pie().sort(null).value(function (d) { return d[serie.valueField]; }),
            key = function (d) { return d.data[serie.titleField]; },
            legendWidth = 0,
            legendHeight = 0,
            alphaMin = 0,
            alphaMax = 0,
            symbolSize = Math.pow(chart.legend.fontSize, 2),
            radius = Math.min(pieWidth, pieHeight) / 2,
            outerRadius = serie.labelFormat !== '' ? (serie.labelPosition === 'outside' ? radius * .8 : radius * .9) : radius * .9,
            innerRadius = isDonut ? radius / 2 : 0,
            slices, legendTexts, legendIcons;

        //check chart series
        if(chart.series.length === 0) {
            throw Error('Chart serie could not found!');
        }

        //set default balloon format
        if(chart.balloon.format === '')
            chart.balloon.format = '{title}: {value}';

        //set alpha size
        if(serie.alphaField !== '') {
            alphaMin = d3.min(chart.data, function(d) { return d[serie.alphaField]; })
            alphaMax = d3.max(chart.data, function(d) { return d[serie.alphaField]; })
        }

        //initializes pie chart
        function init() {
            //create legends
            if (chart.legend.enabled) {
                //add g for legend texts and icons
                chart.svg.append('g').attr('class', 'eve-legend-icon');
                chart.svg.append('g').attr('class', 'eve-legend-text');

                //set legend height
                legendHeight = chart.data.length * (chart.legend.fontSize + 5);

                //create legend texts
                legendTexts = chart.svg.select('.eve-legend-text').selectAll('text.eve-legend-text')
                    .data(pieData(chart.data), key)
                    .enter().insert('text')
                    .attr('class', 'eve-legend-text')
                    .style('cursor', 'pointer')
                    .style('fill', chart.legend.fontColor)
                    .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                    .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                    .style("font-family", chart.legend.fontFamily)
                    .style("font-size", chart.legend.fontSize + 'px')
                    .text(function (d, i) { return d.data[serie.titleField] })
                    .style("text-anchor", function(d, i) {
                        //calculate legend width
                        var textWidth = this.getBBox().width + chart.legend.fontSize;

                        //check textwidth > legendiwdth
                        if(textWidth > legendWidth)
                            legendWidth = textWidth;

                        return 'left';
                    })
                    .on('click', function(d, i) {
                        if(slices != null) {
                            //set data selected event
                            if (d.data.selected) { d.data.selected = false; } else { d.data.selected = true; }

                            //scale the current pie element
                            if (d.data.selected) {
                                //create selection
                                d3.select(slices[0][i])
                                    .style("stroke-opacity", 1)
                                    .transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', function () {
                                        //get new angle
                                        var newAngle = (d.startAngle + d.endAngle) / 2,
                                            newX = Math.sin(newAngle) * 5,
                                            newY = -Math.cos(newAngle) * 5;

                                        //return translation
                                        return 'translate(' + newX + ',' + newY + ')';
                                    });

                            } else {
                                d3.select(slices[0][i])
                                    .style("stroke-opacity", 0.1)
                                    .transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', 'translate(0,0)');
                            }
                        }

                        //check legendClick event handler to raise it
                        if(chart.legendClick)
                            chart.legendClick(d, i);
                    });

                //create legend icons
                legendIcons = chart.svg.select('.eve-legend-icon').selectAll('path.eve-legend-icon')
                    .data(pieData(chart.data), key)
                    .enter().insert('path')
                    .attr('d', d3.svg.symbol().type(chart.legend.icon).size(symbolSize))
                    .attr('class', 'eve-legend-icon')
                    .style('cursor', 'pointer')
                    .style('fill', function (d, i) {
                        if (slices !== undefined)
                            return d3.select(slices[0][i]).style('fill');

                        //check whether the serie has colorField
                        if (serie.colorField !== '')
                            return d.data[serie.colorField];
                        else
                            return i <= e.colors.length ? e.colors[i] : e.randColor();
                    })
                    .on('click', function(d, i) {
                        if(slices != null) {
                            //set data selected event
                            if (d.data.selected) { d.data.selected = false; } else { d.data.selected = true; }

                            //scale the current pie element
                            if (d.data.selected) {
                                //create selection
                                d3.select(slices[0][i])
                                    .style("stroke-opacity", 1)
                                    .transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', function () {
                                        //get new angle
                                        var newAngle = (d.startAngle + d.endAngle) / 2,
                                            newX = Math.sin(newAngle) * 5,
                                            newY = -Math.cos(newAngle) * 5;

                                        //return translation
                                        return 'translate(' + newX + ',' + newY + ')';
                                    });

                            } else {
                                d3.select(slices[0][i])
                                    .style("stroke-opacity", 0.1)
                                    .transition()
                                    .duration(chart.animationDuration / 2)
                                    .attr('transform', 'translate(0,0)');
                            }
                        }

                        //check legendClick event handler to raise it
                        if(chart.legendClick)
                            chart.legendClick(d, i);
                    });

                //re-calculate x translation
                if(chart.legend.position === 'left')
                    transX = transX + legendWidth / 2;
                else
                    transX = transX - legendWidth / 2;

                //re-calculate pie width
                pieWidth -= legendWidth * 2;
                radius = Math.min(pieWidth, pieHeight) / 2;
                outerRadius = serie.labelFormat !== '' ? (serie.labelPosition === 'outside' ? radius * .8 : radius * .9) : radius * .9;
                innerRadius = isDonut ? radius / 2 : 0;
            }

            //append a new g into the svg
            chart.svg.append('g').attr('class', 'eve-pie-slices');

            //calculate pie area
            var arc = d3.svg.arc().outerRadius(outerRadius).innerRadius(innerRadius);

            //centralize svg canvas
            chart.svg.attr('transform', 'translate(' + transX + ',' + transY + ')');

            //create slices and attach data
            slices = chart.svg
                .select('.eve-pie-slices').selectAll('path.eve-pie-slice')
                .data(pieData(chart.data), key);

            //create slice paths
            slices.enter().insert('path')
                .style('fill', function (d, i) {
                    //check whether the serie has colorField
                    if (serie.colorField !== '')
                        return d.data[serie.colorField];
                    else
                        return i <= e.colors.length ? e.colors[i] : e.randColor();
                })
                .style('fill-opacity', function (d, i) {
                    //check whether the serie has alphaField
                    if (serie.alphaField !== '') {
                        //calculate alpha
                        var range = alphaMax - alphaMin,
                            alpha = d.data[serie.alphaField] / range * .8 - (alphaMin / range * .8) + .2;

                        //return new alpha
                        return alpha;;
                    }
                    else
                        return 1;
                })
                .style("stroke", serie.sliceBorderColor)
                .style("stroke-width", 1)
                .style("stroke-opacity", serie.sliceBorderOpacity)
                .attr('class', 'eve-pie-slice')
                .on('click', function (d, i) {
                    //set data selected event
                    if (d.data.selected) { d.data.selected = false; } else { d.data.selected = true; }

                    //scale the current pie element
                    if (d.data.selected) {
                        //create selection
                        d3.select(this)
                            .style("stroke-opacity", 1)
                            .transition()
                            .duration(chart.animationDuration / 2)
                            .attr('transform', function () {
                                //get new angle
                                var newAngle = (d.startAngle + d.endAngle) / 2,
                                    newX = Math.sin(newAngle) * 5,
                                    newY = -Math.cos(newAngle) * 5;

                                //return translation
                                return 'translate(' + newX + ',' + newY + ')';
                            });
                    } else {
                        d3.select(this)
                            .style("stroke-opacity", 0.1)
                            .transition()
                            .duration(chart.animationDuration / 2)
                            .attr('transform', 'translate(0,0)');
                    }

                    //check whether the serieClick event is not null
                    if (chart.serieClick)
                        chart.serieClick(d.data);
                })
                .on('mousemove', function (d, i) {
                    //get bubble content
                    var balloonContent = chart.getSlicedFormat(i, serie);

                    //show balloon
                    chart.showBalloon(balloonContent);

                    //set hover for the current slice
                    this.style['opacity'] = serie.hoverOpacity;
                })
                .on('mouseout', function (d) {
                    //hide balloon
                    chart.hideBalloon();

                    //set hover for the current slice
                    this.style['opacity'] = 1;
                });

            //set slice animation
            slices.transition().duration(chart.animationDuration)
               .attrTween('d', function (d) {
                   //set current data
                   this._current = this._current || d;

                   //set interpolation
                   var interpolated = d3.interpolate(this._current, d);

                   //set current as interpolated
                   this._current = interpolated(0);

                   //return interpolated arc
                   return function (t) {
                       return arc(interpolated(t));
                   };
               });

            //exit from slices
            slices.exit().remove();

            //re-position legend texts and icons
            if(chart.legend.enabled) {
                //reposition texts
                legendTexts
                    .attr('x', radius + Math.sqrt(symbolSize))
                    .attr('y', function(d, i) {
                        return ((legendHeight / chart.data.length) * i) - (legendHeight / 2) + chart.legend.fontSize;
                    });

                //reposition icons
                legendIcons
                    .attr('transform', function(d, i) {
                        //calculate x, y position
                        var bbox = this.getBBox(),
                            x = radius,
                            iconHeight = Math.sqrt(symbolSize) / 2,
                            y = ((legendHeight / chart.data.length) * i) - (legendHeight / 2) + chart.legend.fontSize - iconHeight;

                        //return translation
                        return 'translate(' + x + ',' + y + ')';
                    });
            }

            //check whether the labels are enabled
            if(serie.labelFormat !== '') {
                //add label g
                chart.svg.append('g').attr('class', 'eve-pie-labels');

                //check label position
                if(serie.labelPosition === 'inside') {
                    //create labels
                    chart.svg.select('.eve-pie-labels')
                        .selectAll('text')
                        .data(pieData(chart.data), key)
                        .enter().append('text')
                        .style('fill', serie.labelFontColor)
                        .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                        .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                        .style("font-family", serie.labelFontFamily)
                        .style("font-size", serie.labelFontSize + 'px')
                        .style('text-anchor', 'middle')
                        .text(function(d, i) { return chart.getSlicedFormat(i, serie, 'label'); })
                        .transition().duration(chart.animationDuration)
                        .attr('transform', function(d) { return 'translate(' + arc.centroid(d) + ')'; });
                } else {
                    //add g for label lines
                    chart.svg.append('g').attr('class', 'eve-pie-labels-lines');

                    //create label lines
                    chart.svg.select('.eve-pie-labels-lines')
                        .selectAll('line')
                        .data(pieData(chart.data), key)
                        .enter().append('line')
                        .style('stroke', function (d, i) {
                            if (serie.colorField !== '')
                                return d.data[serie.colorField];
                            else
                                return i <= e.colors.length ? e.colors[i] : e.randColor();
                        })
                        .style('stroke-width', 1)
                        .style('stroke-opacity', 0.2)
                        .transition().duration(chart.animationDuration)
                        .attr("x1", function (d) { return arc.centroid(d)[0]; })
                        .attr("y1", function (d) { return arc.centroid(d)[1]; })
                        .attr("x2", function (d) {
                            //get centroid
                            var centroid = arc.centroid(d);

                            //calculate middle point
                            var midAngle = Math.atan2(centroid[1], centroid[0]);

                            //calculate x position of the line
                            var x = Math.cos(midAngle) * (radius * 0.9);

                            //return x
                            return x;
                        })
                        .attr("y2", function (d) {
                            //get centroid
                            var centroid = arc.centroid(d);

                            //calculate middle point
                            var midAngle = Math.atan2(centroid[1], centroid[0]);

                            //calculate y position of the line
                            var y = Math.sin(midAngle) * (radius * 0.9);

                            //return y
                            return y;
                        });

                    //create labels
                    chart.svg.select('.eve-pie-labels')
                        .selectAll('text')
                        .data(pieData(chart.data), key)
                        .enter().append('text')
                        .style('fill', serie.labelFontColor)
                        .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                        .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                        .style("font-family", serie.labelFontFamily)
                        .style("font-size", serie.labelFontSize + 'px')
                        .text(function(d, i) { return chart.getSlicedFormat(i, serie, 'label'); })
                        .transition().duration(chart.animationDuration)
                        .attr('x', function (d) {
                            //Get centroid of the inner arc
                            var centroid = arc.centroid(d);

                            //Get middle angle
                            var midAngle = Math.atan2(centroid[1], centroid[0]);

                            //Calculate x position
                            var x = Math.cos(midAngle) * (radius * 0.9);

                            //Return x position
                            return x + (5 * ((x > 0) ? 1 : -1));
                        })
                        .attr('y', function (d) {
                            //Get centroid of the inner arc
                            var centroid = arc.centroid(d);

                            //Get middle angle
                            var midAngle = Math.atan2(centroid[1], centroid[0]);

                            //Return y position
                            return Math.sin(midAngle) * (radius * 0.9);
                        })
                        .style("text-anchor", function (d) {
                            //Get centroid of the inner arc
                            var centroid = arc.centroid(d);

                            //Get middle angle
                            var midAngle = Math.atan2(centroid[1], centroid[0]);

                            //Calculate x position
                            var x = Math.cos(midAngle) * (radius * 0.9);

                            //Return text anchor
                            return (x > 0) ? "start" : "end";
                        });

                }
            }
        }

        //init pie chart
        init();

        //return chart object
        return chart;
    };

    //attach pie method into eve
    e.pieChart = function(options) {
        //set chart type
        options.type = 'pie';

        return new pie(options, false);
    }

    //attach donut method into eve
    e.donutChart = function(options) {
        //set chart type
        options.type = 'donut';

        return new pie(options, true);
    }
})(eve);
