/*!
 * eve.charts.pie.js
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
(function (eveCharts) {
    //pie chart creator class
    function pieChart(chart) {
        //declare container element.
        var plot = eve.charts.createPlot(chart),
            serie = chart.series[0],
            isDonut = false,
            transX = plot.width / 2,
            transY = plot.height / 2;

        //check serie to handle errors
        if (serie.type !== 'pie' && serie.type !== 'donut') {
            throw new Error('Serie type mistmatch! When creating a pie chart, serie type should be set as "pie" or "donut"...');
            return null;
        }

        //set this data
        this.data = null;

        //update margins by legend
        if (chart.legend.enabled) {
            //switch legend position
            switch (chart.legend.position) {
                case 'left':
                    transX = (plot.width + chart.legend.maxWidth) / 2;
                    break;
                case 'right':
                    transX = (plot.width - chart.legend.maxWidth) / 2;
                    break;
                case 'top':
                    transY = (plot.height + chart.legend.maxHeight) / 2;
                    break;
                case 'bottom':
                    transY = (plot.height - chart.legend.maxHeight) / 2;
                    break;
            }
        }

        //append balloon div into the document
        eve(document.body).append('<div id="' + chart.id + '_balloon" class="eve-balloon"></div>');

        //set balloon as eve object
        var balloon = eve('#' + chart.id + '_balloon');

        //set balloon style
        balloon.style('backgroundColor', chart.balloon.backColor);
        balloon.style('borderStyle', chart.balloon.borderStyle);
        balloon.style('borderColor', chart.balloon.borderColor);
        balloon.style('borderRadius', chart.balloon.borderRadius + 'px');
        balloon.style('borderWidth', chart.balloon.borderSize + 'px');
        balloon.style('color', chart.balloon.fontColor);
        balloon.style('fontFamily', chart.balloon.fontFamily);
        balloon.style('fontSize', chart.balloon.fontSize + 'px');
        balloon.style('paddingLeft', chart.balloon.padding + 'px');
        balloon.style('paddingTop', chart.balloon.padding + 'px');
        balloon.style('paddingRight', chart.balloon.padding + 'px');
        balloon.style('paddingBottom', chart.balloon.padding + 'px');
        if (chart.balloon.fontStyle == 'bold') balloon.style('fontWeight', 'bold'); else balloon.style('fontStyle', chart.balloon.fontStyle);

        //check serie type
        if (serie.type === 'donut') isDonut = true;

        //declare pie chart plot variables
        var radius = Math.min((plot.width - plot.legendRateWidth), (plot.height - plot.legendRateHeight)) / 2,
            outerRadius = serie.labelsEnabled ? (serie.labelPosition === 'outside' ? radius * .8 : radius * .9) : radius * .9,
            innerRadius = 0,
            pie = d3.layout.pie().sort(null).value(function (d) { return d[serie.valueField]; }),
            key = function (d) { return d.data[serie.titleField]; },
            legendIcons = null, legendTexts = null,
            slices, labels, lines;

        //check whether the chart is donut
        if (isDonut) innerRadius = serie.innerRadius === 0 ? radius / 2 : serie.innerRadius;

        //declare arcs
        var arc = d3.svg.arc().outerRadius(outerRadius).innerRadius(innerRadius),
            arcSelected = d3.svg.arc().outerRadius(outerRadius + 10).innerRadius(innerRadius);

        //set chart canvas
        var canvas = d3.select(plot.container.reference).append('svg')
            .attr('width', plot.width).attr('height', plot.height).append('g');

        //set slices, labels and label lines
        canvas.append('g').attr('class', 'eve-pie-slices');
        canvas.append('g').attr('class', 'eve-pie-labels');
        canvas.append('g').attr('class', 'eve-pie-labels-lines');
        canvas.append('g').attr('class', 'eve-legend-icon');
        canvas.append('g').attr('class', 'eve-legend-text');

        //translate canvas center
        canvas.attr('transform', 'translate(' + transX + ',' + transY + ')');

        //formats value
        function formatValue(value, data) {
            //handle errors
            if (arguments.length === 0) return '';
            if (value == null || data == null) return '';

            //declare format variables
            var formatted = value,
                totalValue = d3.sum(chart.data, function (d) { return d[serie.valueField]; }),
                currentValue = data[serie.valueField] === null ? 0 : data[serie.valueField],
                percentValue = currentValue / totalValue * 100;

            //convert titles
            if (serie['titleField'] != null) formatted = formatted.replaceAll('{{title}}', data[serie.titleField] == null ? '' : data[serie.titleField]);

            //convert values
            if (serie['valueField'] != null) formatted = formatted.replaceAll('{{value}}', (chart.formatNumbers ? currentValue.group(chart.decimalSeperator, chart.thousandSeperator, chart.precision) : currentValue));

            //convert opacity
            if (serie['opacityField'] != null) formatted = formatted.replaceAll('{{opacity}}', data[serie.opacityField] == null ? '' : data[serie.opacityField]);

            //convert opacity
            if (serie['colorField'] != null) formatted = formatted.replaceAll('{{color}}', data[serie.colorField] == null ? '' : data[serie.colorField]);

            //convert totals
            if (totalValue != null) formatted = formatted.replaceAll('{{total}}', (chart.formatNumbers ? totalValue.group(chart.decimalSeperator, chart.thousandSeperator, chart.precision) : totalValue));

            //convert percents
            if (percentValue != null) formatted = formatted.replaceAll('{{percent}}', '%' + percentValue.group(chart.decimalSeperator, chart.thousandSeperator, chart.precision));

            //return formatted content
            return formatted;
        };

        //set legend
        this.setLegend = function () {
            //check whether the chart legends are enabled
            if (!chart.legend.enabled) return false;

            //declare base
            var base = this;

            //check whether the chart legend icons and texts are already rendered
            if (legendIcons != null) legendIcons.remove();
            if (legendTexts != null) legendTexts.remove();

            //select legend icons
            legendIcons = canvas.select('.eve-legend-icon').selectAll('rect.eve-legend-icon').data(pie(this.data), key);

            //select legend texts
            legendTexts = canvas.select('.eve-legend-text').selectAll('text.eve-legend-text').data(pie(this.data), key);

            //append legend icons
            legendIcons.enter().insert('rect')
                .style('cursor', 'pointer')
                .attr('class', 'eve-legend-icon')
                .attr('width', chart.legend.iconWidth)
                .attr('height', chart.legend.iconHeight)
                .style('fill', function (d, i) { return d3.select(slices[0][i]).style('fill'); })
                .on('click', function (d, i) {
                    //set data selected event
                    d.data.selected = !d.data.selected;

                    //scale the current pie element
                    if (d.data.selected) {
                        d3.select(slices[0][i])
                            .style("stroke-opacity", 1)
                            .transition()
                            .duration(chart.animationDuration)
                            .attr("d", arcSelected);
                    } else {
                        d3.select(slices[0][i])
                            .style("stroke-opacity", 0.1)
                            .transition()
                            .duration(chart.animationDuration)
                            .attr("d", arc);
                    }

                    //check whether the legendclick event is not null
                    if (chart['legendClick'] !== null) chart.legendClick(d.data);
                });

            //append legend texts
            legendTexts.enter().insert('text')
                .style('cursor', 'pointer')
                .attr('class', 'eve-legend-text')
                .style('fill', chart.legend.fontColor)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style("font-family", chart.legend.fontFamily)
                .style("font-size", chart.legend.fontSize + 'px')
                .style("text-anchor", 'left')
                .text(function (d) { return formatValue(chart.legend.format, d.data); })
                .on('click', function (d, i) {
                    //set data selected event
                    d.data.selected = !d.data.selected;

                    //scale the current pie element
                    if (d.data.selected) {
                        d3.select(slices[0][i])
                            .style("stroke-opacity", 1)
                            .transition()
                            .duration(chart.animationDuration)
                            .attr("d", arcSelected);
                    } else {
                        d3.select(slices[0][i])
                            .style("stroke-opacity", 0.1)
                            .transition()
                            .duration(chart.animationDuration)
                            .attr("d", arc);
                    }

                    //check whether the legendclick event is not null
                    if (chart['legendClick'] !== null) chart.legendClick(d.data);
                });

            //switch legend position to set 
            switch (chart.legend.position) {
                case 'left':
                    {
                        //calculate items height
                        var itemsHeight = this.data.length * (chart.legend.iconHeight + chart.legend.fontSize) + 5;
                        var startY = //chart.margin.top + (height - itemsHeight) / 2;
                        
                        //set legend icons positions
                        legendIcons.attr('x', (transX * -1) + chart.margin.left)
                            .attr('y', function (d, i) {
                                //get y position
                                var yPos = (transY / 2 - itemsHeight) + ((chart.legend.fontSize + chart.legend.iconHeight) * i);

                                //check y pos
                                if (itemsHeight > transY && itemsHeight < plot.height)
                                    yPos = ((chart.legend.fontSize + chart.legend.iconHeight) * i) - transY + chart.margin.top + (plot.height - itemsHeight) / 2;
                                else if (itemsHeight > plot.height)
                                    yPos = ((chart.legend.fontSize + chart.legend.iconHeight) * i) - transY + chart.margin.top;


                                //return y position
                                return yPos;
                            });

                        
                        //set legend texts positions
                        legendTexts.attr('x', (transX * -1) + chart.margin.left + chart.legend.iconWidth + 5)
                            .attr('y', function (d, i) { return parseFloat(d3.select(legendIcons[0][i]).attr('y')) + chart.legend.fontSize; })
                    }
                    break;
                case 'right':
                    {
                        //calculate items height
                        var itemsHeight = this.data.length * (chart.legend.iconHeight + chart.legend.fontSize) + 5;
                        var startY = chart.margin.top + (plot.height - itemsHeight) / 2;

                        //set legend icons positions
                        legendIcons.attr('x', (transX  - chart.margin.right))
                            .attr('y', function (d, i) {
                                //get y position
                                var yPos = (transY / 2 - itemsHeight) + ((chart.legend.fontSize + chart.legend.iconHeight) * i);

                                //check y pos
                                if (itemsHeight > transY && itemsHeight < plot.height)
                                    yPos = ((chart.legend.fontSize + chart.legend.iconHeight) * i) - transY + chart.margin.top + (plot.height - itemsHeight) / 2;
                                else if (itemsHeight > plot.height)
                                    yPos = ((chart.legend.fontSize + chart.legend.iconHeight) * i) - transY + chart.margin.top;

                                //return y position
                                return yPos;
                            });


                        //set legend texts positions
                        legendTexts.attr('x', (transX - chart.margin.right + chart.legend.iconWidth + 5))
                            .attr('y', function (d, i) { return parseFloat(d3.select(legendIcons[0][i]).attr('y')) + chart.legend.fontSize; })
                    }
                    break;
                case 'bottom':
                    {
                        //calculate items height
                        var itemsWidth = this.data.length * (chart.legend.iconWidth + chart.legend.maxTextWidth);
                        var startX = chart.margin.left + (plot.width - itemsWidth) / 2;

                        //set legend icons positions
                        legendIcons.attr('x', function (d, i) {
                            //get x position
                            var xPos = ((chart.legend.maxTextWidth + chart.legend.iconWidth) * i) - transX / 2;

                            //check items width
                            if (itemsWidth > plot.width) xPos = (transX * -1) + ((chart.legend.maxTextWidth + chart.legend.iconWidth) * i) + chart.margin.left;

                            //return x position
                            return xPos;
                        }).attr('y', transY);


                        //set legend texts positions
                        legendTexts.attr('x', function (d, i) { return parseFloat(d3.select(legendIcons[0][i]).attr('x')) + chart.legend.iconWidth + 5; })
                            .attr('y', transY + chart.legend.fontSize);
                    }
                    break;
                case 'top':
                    {
                        //calculate items height
                        var itemsWidth = this.data.length * (chart.legend.iconWidth + chart.legend.maxTextWidth);
                        var startX = chart.margin.left + (plot.width - itemsWidth) / 2;

                        //set legend icons positions
                        legendIcons.attr('x', function (d, i) {
                            //get x position
                            var xPos = ((chart.legend.maxTextWidth + chart.legend.iconWidth) * i) - transX / 2;

                            //check items width
                            if (itemsWidth > plot.width) xPos = (transX * -1) + ((chart.legend.maxTextWidth + chart.legend.iconWidth) * i) + chart.margin.left;

                            //return x position
                            return xPos;
                        }).attr('y', (transY * -1) + chart.margin.top);


                        //set legend texts positions
                        legendTexts.attr('x', function (d, i) { return parseFloat(d3.select(legendIcons[0][i]).attr('x')) + chart.legend.iconWidth + 5; })
                            .attr('y', (transY * -1) + chart.legend.fontSize + chart.margin.top);
                    }
                    break;
            }

            //exit legend icons
            legendIcons.exit().remove();

            //exit legend texts
            legendTexts.exit().remove();
        }

        //set this data
        this.mapData = function (data) {
            //check whether the passed data is null
            if (data === null) return null;

            //set base data
            this.data = data.map(function (d) {
                //Set current object's hidden member
                if (d['selected'] == null) d['selected'] = false;

                //Return d
                return d;
            });
        };

        //hides balloon
        function hideBalloon() {
            /// <summary>
            /// Hides balloon.
            /// </summary>
            balloon.style('display', 'none');
        };

        //shows balloon
        function showBalloon(content) {
            /// <summary>
            /// Shows balloon with given content.
            /// </summary>
            /// <param name="content"></param>
            /// <param name="data"></param>

            //check whether the arguments
            if (content == null) hideBalloon();

            //check whther the balloon enabled
            if (!chart.balloon.enabled) hideBalloon();

            //set balloon content
            balloon.html(content);

            //set balloon postion and show
            balloon.style('left', (parseInt(d3.event.pageX) + 5) + 'px');
            balloon.style('top', (parseInt(d3.event.pageY) + 5) + 'px');
            balloon.style('display', 'block');
        };

        //set update function
        this.update = function (data) {
            //declare internal variables
            var base = this;

            //check whether the passed data is null
            if (data == null) data = chart.data;

            //set this data
            this.mapData(data);

            //create slice data
            slices = canvas.select('.eve-pie-slices').selectAll('path.eve-pie-slice')
                .data(pie(this.data), key);
            
            //create slice paths
            slices.enter().insert('path')
                .style('fill', function (d, i) {
                    //check whether the serie has colorField
                    if (serie.colorField !== '')
                        return d.data[serie.colorField];
                    else
                        return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                })
                .style("stroke", this.sliceBorderColor)
                .style("stroke-width", 1)
                .style("stroke-opacity", 0.1)
                .attr("class", "eve-pie-slice")
                .on('click', function (d, i) {
                    //set data selected event
                    d.data.selected = !d.data.selected;

                    //scale the current pie element
                    if (d.data.selected) {
                        d3.select(this)
                            .style("stroke-opacity", 1)
                            .transition()
                            .duration(chart.animationDuration)
                            .attr("d", arcSelected);
                    } else {
                        d3.select(this)
                            .style("stroke-opacity", 0.1)
                            .transition()
                            .duration(chart.animationDuration)
                            .attr("d", arc);
                    }

                    //check whether the serieClick event is not null
                    if (chart['serieClick'] !== null) chart.serieClick(d.data);
                })
                .on('mousemove', function (d, i) {
                    //get data color
                    var dataColor = '';
                    var thisObj = eve(this);
                    var balloonContent = formatValue(chart.balloon.format, d.data);

                    //set data color
                    if (serie.colorField !== '')
                        dataColor = d.data[serie.colorField];
                    else
                        dataColor = i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                    
                    //set balloon border color
                    balloon.style('borderColor', dataColor);

                    //Show balloon
                    showBalloon(balloonContent);

                    //Set hover for the current slice
                    thisObj.style('opacity', serie.hoverOpacity);
                })
                .on('mouseout', function (d) {
                    //Hide balloon
                    hideBalloon();

                    //Remove opacity of the curent slice
                    eve(this).style('opacity', 1);
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

            //check whether the labels are enables
            if (serie.labelsEnabled) {
                //check whether the label position is inside
                if (serie.labelPosition === 'inside') {
                    //set labels
                    labels = canvas.select('.eve-pie-labels').selectAll('text').data(pie(this.data), key);

                    //append labels
                    labels.enter().append('text')
                        .style('fill', serie.labelFontColor)
                        .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                        .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                        .style("font-family", serie.labelFontFamily)
                        .style("font-size", serie.labelFontSize + 'px')
                        .style('text-anchor', 'middle')
                        .text(function (d) { return formatValue(serie.labelFormat, d.data); });

                    //animate labels
                    labels.transition().duration(chart.animationDuration)
                        .attr('transform', function (d) { return 'translate(' + arc.centroid(d) + ')'; });

                    //exit from labels
                    labels.exit().remove();
                } else {
                    //create label lines
                    lines = canvas.select('.eve-pie-labels-lines').selectAll('line').data(pie(this.data), key);

                    //append label lines
                    lines.enter().append('line')
                        .style('stroke', function (d, i) {
                            if (serie.colorField !== '')
                                return d.data[serie.colorField];
                            else
                                return i <= eveCharts.colors.length ? eveCharts.colors[i] : eve.randomColor();
                        })
                        .style('stroke-width', 1)
                        .style('stroke-opacity', 0.2);

                    //animate label lines
                    lines.transition().duration(chart.animationDuration)
                        .attr("x1", function (d) {
                            return arc.centroid(d)[0];
                        })
                        .attr("y1", function (d) {
                            return arc.centroid(d)[1];
                        })
                        .attr("x2", function (d) {
                            //get centroid
                            var _centroid = arc.centroid(d);

                            //calculate middle point
                            var _midAngle = Math.atan2(_centroid[1], _centroid[0]);

                            //calculate x position of the line
                            var _x = Math.cos(_midAngle) * (radius * 0.9);

                            //return x
                            return _x;
                        })
                        .attr("y2", function (d) {
                            //get centroid
                            var _centroid = arc.centroid(d);

                            //calculate middle point
                            var _midAngle = Math.atan2(_centroid[1], _centroid[0]);

                            //calculate y position of the line
                            var _y = Math.sin(_midAngle) * (radius * 0.9);

                            //return y
                            return _y;
                        });

                    //exit lines
                    lines.exit().remove();

                    //create labels
                    labels = canvas.select('.eve-pie-labels').selectAll('text').data(pie(this.data), key);

                    //append labels
                    labels.enter().append('text')
                        .style('fill', serie.labelFontColor)
                        .style('font-weight', serie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                        .style('font-style', serie.labelFontStyle == 'bold' ? 'normal' : serie.labelFontStyle)
                        .style("font-family", serie.labelFontFamily)
                        .style("font-size", serie.labelFontSize + 'px')
                        .text(function (d) { return formatValue(serie.labelFormat, d.data); });

                    //animate labels
                    labels.transition().duration(chart.animationDuration)
                        .attr('x', function (d) {
                            //Get centroid of the inner arc
                            var _centroid = arc.centroid(d);

                            //Get middle angle
                            var _midAngle = Math.atan2(_centroid[1], _centroid[0]);

                            //Calculate x position
                            var _x = Math.cos(_midAngle) * (radius * 0.9);

                            //Return x position
                            return _x + (5 * ((_x > 0) ? 1 : -1));
                        })
                        .attr('y', function (d) {
                            //Get centroid of the inner arc
                            var _centroid = arc.centroid(d);

                            //Get middle angle
                            var _midAngle = Math.atan2(_centroid[1], _centroid[0]);

                            //Return y position
                            return Math.sin(_midAngle) * (radius * 0.9);
                        })
                        .style("text-anchor", function (d) {
                            //Get centroid of the inner arc
                            var _centroid = arc.centroid(d);

                            //Get middle angle
                            var _midAngle = Math.atan2(_centroid[1], _centroid[0]);

                            //Calculate x position
                            var _x = Math.cos(_midAngle) * (radius * 0.9);

                            //Return text anchor
                            return (_x > 0) ? "start" : "end";
                        });

                    //exit labels
                    labels.exit().remove();
                }
            }

            //set legend
            this.setLegend();
        };

        //update pie chart
        this.update();
    }

    //set eve charts create pie chart method
    eveCharts.pie = function (options) {
        /// <summary>
        /// Creates a new pie chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //create chart object
            var pie = new pieChart(new this.configurator(options));
            
            //add chart instance
            if (pie !== null)
                this.instances[pie.id] = pie;

            //return new chart object
            return pie;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts);