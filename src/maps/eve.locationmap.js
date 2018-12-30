/*!
 * eve.locationmap.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for location map.
 */
(function (e) {
    //define location map class
    function locationMap(options) {
        //store current legend status
        let tempLegendStatus = options.legend.enabled;
        //hide legend if not applicable
        if (!options.series[0].valueField && !options.series[0].groupField) {
            options.legend.enabled = false;
        }

        //declare needed variables
        let that = this,
            map = e.initVis(options),
            valueField = map.series[0].valueField,
            latField = map.series[0].latField,
            longField = map.series[0].longField,
            groupField = map.series[0].groupField,
            minRadius = map.series[0].minBulletSize,
            maxRadius = map.series[0].maxBulletSize,
            isGrouped = map.series[0].groupField != '' ? true : false,
            filteredData = [],
            singleColor = map.legend.legendColors[0].color,
            zoomLevel = 1 << 22,
            zoomLevels = [
                { 'minValue': 90, 'maxValue': 360, 'zoom': 1 << 9 },
                { 'minValue': 45, 'maxValue': 90, 'zoom': 1 << 10 },
                { 'minValue': 22.5, 'maxValue': 45, 'zoom': 1 << 11 },
                { 'minValue': 11.25, 'maxValue': 22.5, 'zoom': 1 << 12 },
                { 'minValue': 5.625, 'maxValue': 11.25, 'zoom': 1 << 13 },
                { 'minValue': 2.813, 'maxValue': 5.625, 'zoom': 1 << 14 },
                { 'minValue': 1.406, 'maxValue': 2.813, 'zoom': 1 << 15 },
                { 'minValue': 0.703, 'maxValue': 1.406, 'zoom': 1 << 16 },
                { 'minValue': 0.352, 'maxValue': 0.703, 'zoom': 1 << 17 },
                { 'minValue': 0.176, 'maxValue': 0.352, 'zoom': 1 << 18 },
                { 'minValue': 0.088, 'maxValue': 0.176, 'zoom': 1 << 19 },
                { 'minValue': 0.044, 'maxValue': 0.088, 'zoom': 1 << 20 },
                { 'minValue': 0.022, 'maxValue': 0.044, 'zoom': 1 << 21 },
                { 'minValue': 0.011, 'maxValue': 0.022, 'zoom': 1 << 22 }
            ],
            tau = 2 * Math.PI,
            projection = d3.geoMercator().scale(1 / tau).translate([0, 0]),
            path = d3.geoPath().projection(projection),
            tile = null,
            zoom = null,
            labels = null,
            tileLabels = [],
            shapes = null,
            oldShapes = null,
            oldLabels = null,
            rscale = null,
            ignoreCurrent = false,
            fontSize = 0,
            minFontSize = 8,
            center = [],
            platform = "";

        if (window.app && (map.index || map.index === 0)) {
            platform = "vysda";
        }
        else if(window.report && report.dashboard && report.dashboard.tabs) {
            platform = "ssweb";
        }
        else {
            platform = "eve";
        }

        //restore legend status
        options.legend.enabled = tempLegendStatus;

        //set map plot width and height
        map.plot.width = map.plot.width - map.plot.left * 2 - map.plot.right;
        map.plot.height = map.plot.height - map.plot.top - map.plot.bottom;

        //create map g
        let mapDiv = d3.select('#' + map.innerContainer)
            .style('padding-left', map.plot.left + 'px')
            .append('div')
            .attr('class', 'vectormap')
            .style('position', 'relative')
            .style('overflow', 'hidden')
            .style('width', map.plot.width + "px")
            .style('height', map.plot.height + "px")
            .attr("id", map.container + "_map");

        //create foreign object for vector map
        let vectorDiv = mapDiv
            .append('div')
            .attr("id", map.container + "_zoomApply")
            .append('div')
            .attr('class', 'vectorlayer')
            .style('position', 'absolute')
            .style('will-change', 'transform')
            .attr("id", map.container + "_vectorlayer");

        vectorDiv
            .insert('defs', ':first-child')
            .html(e.vectorTileStyle);

        //create svg for overlay
        let overlaySvg = vectorDiv
            .append('svg')
            .attr("class", "overlay")
            .style('position', 'absolute')
            .attr("id", map.container + "_overlay");

        let currentG = overlaySvg.append('g');

        function calculateZoom(apply) {
            //declare needed variables
            let diffDegrees = [];

            if (map.data.length === 1) {
                center = [map.domains.minLong, map.domains.minLat];
                zoomLevel = 1 << 22;
            } else {
                //calculate center and difference of latitude
                if (map.domains.minLat > 0 && map.domains.maxLat > 0 || map.domains.minLat < 0 && map.domains.maxLat < 0) {
                    center[1] = (map.domains.maxLat - Math.abs(map.domains.maxLat - map.domains.minLat) / 2);
                    diffDegrees[0] = Math.abs(map.domains.maxLat - map.domains.minLat);
                }
                else {
                    center[1] = (map.domains.maxLat - (Math.abs(map.domains.minLat) + Math.abs(map.domains.maxLat)) / 2);
                    diffDegrees[0] = Math.abs(map.domains.maxLat) + Math.abs(map.domains.minLat);
                }

                //calculate center and difference of longitude
                if (map.domains.minLong > 0 && map.domains.maxLong > 0 || map.domains.minLong < 0 && map.domains.maxLong < 0) {
                    center[0] = (map.domains.maxLong - Math.abs(map.domains.maxLong - map.domains.minLong) / 2);
                    diffDegrees[1] = Math.abs(map.domains.maxLong - map.domains.minLong);
                }
                else {
                    center[0] = (map.domains.maxLong - (Math.abs(map.domains.minLong) + Math.abs(map.domains.maxLong)) / 2);
                    diffDegrees[1] = Math.abs(map.domains.maxLong) + Math.abs(map.domains.minLong);
                }
                if (map.yAxis.diffDegrees)
                    diffDegrees = e.clone(map.yAxis.diffDegrees);

                //calculate tile counts for both axis
                let tileCountX = map.plot.width / 256,
                    tileCountY = map.plot.height / 256;

                //calculate the tile degree difference
                diffDegrees[0] = diffDegrees[0] / tileCountY;
                diffDegrees[1] = diffDegrees[1] / tileCountX;

                //determine zoom level
                zoomLevel = Math.min(e.findRange(diffDegrees[0], zoomLevels, 'zoom'), e.findRange(diffDegrees[1], zoomLevels, 'zoom'));
                if (zoomLevel == 1 << 9 && map.plot.width > 512)
                    zoomLevel = 1 << 10;
            }

            //calculate center for map
            center = d3.geoMercator().scale(1 / tau).translate([0, 0])(center);

            if (apply) {
                ignoreCurrent = true;
                // Apply a zoom transform equivalent to projection.{scale,translate,center}.
                d3.select('#' + map.container + "_zoomApply")
                    .call(zoom.transform, d3.zoomIdentity
                        .translate(map.plot.width / 2, map.plot.height / 2)
                        .scale(zoomLevel)
                        .translate(-center[0], -center[1]));
            }
        }

        //animates shapes
        function animateShapes() {
            //animate and color shapes based on icon type
            switch (map.series[0].tileIcon) {
                case 'circle':
                    {
                        shapes
                            .transition().duration(map.animation.duration)
                            .ease(map.animation.easing.toEasing())
                            .delay(function (d, i) { return i * map.animation.delay / Math.max(1, Math.sqrt(i / 16)); })
                            .attr("r", function (d) { return rscale(d[valueField]); });
                    }
                    break;
                case 'square':
                    {
                        shapes
                            .transition().duration(map.animation.duration)
                            .ease(map.animation.easing.toEasing())
                            .delay(function (d, i) { return i * map.animation.delay / Math.max(1, Math.sqrt(i / 16)); })
                            .attr('width', function (d) { return rscale(d[valueField]) * 2; })
                            .attr('height', function (d) { return rscale(d[valueField]) * 2; });
                    }
                    break;
                default:
                    {
                        shapes
                            .transition().duration(map.animation.duration)
                            .ease(map.animation.easing.toEasing())
                            .delay(function (d, i) { return i * map.animation.delay / Math.max(1, Math.sqrt(i / 16)); })
                            .attr("r", function (d) { return rscale(d[valueField]); });
                    }
            }

            //raise render complete
            if (map.renderComplete) {
                setTimeout(function () {
                    map.renderComplete();
                }, 1000);
            }
        }

        //creates grouped location map
        function createMap() {
            //declare needed variables
            let tooltipContent = '',
                labelFormat = '',
                groupValue = '';

            //set zoom
            zoom = d3.zoom().scaleExtent([1 << 9, 1 << 22]).on("zoom", zoomed);
            //set tiles
            tile = d3.tile().size([map.plot.width, map.plot.height]);

            //append zoom controls if not hidden
            if (!map.hideZoom) {
                //insert div into the foreign object
                let zoomDiv = mapDiv.append('div')
                    .attr('class', 'zoom-container')
                    .style('position', 'absolute')
                    .style('top', '10px')
                    .style('left', '10px')
                    .attr('id', map.container + '_zoom_container');

                zoomDiv.append("a")
                    .attr("class", "zoom")
                    .attr("id", "zoom_in")
                    .text("+")
                    .on('click', function () {
                        // Apply a zoom transform equivalent to projection.{scale,translate,center}.
                        zoom.scaleBy(d3.select('#' + map.container + "_zoomApply"), 2);
                    });

                zoomDiv.append("a")
                    .attr("class", "zoom")
                    .attr("id", "zoom_out")
                    .text("-")
                    .on('click', function () {
                        // Apply a zoom transform equivalent to projection.{scale,translate,center}.
                        zoom.scaleBy(d3.select('#' + map.container + "_zoomApply"), 0.5);
                    });
            }

            //create foreign object for info
            mapDiv
                .append('div')
                .attr('class', 'info')
                .style('position', 'absolute')
                .style('bottom', '0px')
                .style('right', '0px')
                .style('background', 'rgba(255, 255, 255, 0.8)')
                .style('padding', '0px 5px')
                .style('font-family', 'Tahoma, Arial, Helvetica, Ubuntu')
                .style('font-size', '11px')
                .attr('id', map.container + '_info')
                .html('<a href="https://www.maptiler.com/license/maps/" target="_blank">&copy MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy OpenStreetMap contributors</a>');

            if (valueField) {
                //calculate radius variables
                minRadius = map.domains.minY === map.domains.maxY ? map.series[0].maxBulletSize : map.series[0].minBulletSize;
                rscale = d3.scalePow().exponent(0.5).domain([map.domains.minY, map.domains.maxY]).range([minRadius, maxRadius]);
                //create circle data
                filteredData = map.data.filter(function (d) {
                    if (!isNaN(parseFloat(d[valueField])) && parseFloat(d[valueField]) !== 0) {
                        d[valueField] = parseFloat(d[valueField]);
                        return true;
                    } else
                        return false;
                });
            }
            else {
                //calculate radius variables
                minRadius = map.series[0].minBulletSize;
                rscale = function (val) { return minRadius };
                //create circle data
                filteredData = map.data;
            }

            //create shapes based on icon type
            switch (map.series[0].tileIcon) {
                case 'circle':
                    {
                        //create shapes
                        shapes = currentG.selectAll('.overlay-shape')
                            .data(filteredData)
                            .enter().append('circle');
                    }
                    break;
                case 'square':
                    {
                        //create shapes
                        shapes = currentG.selectAll('.overlay-shape')
                            .data(filteredData)
                            .enter().append('rect');
                    }
                    break;
                default:
                    {
                        //create shapes
                        shapes = currentG.selectAll('.overlay-shape')
                            .data(filteredData)
                            .enter().append('circle');
                    }
            }

            shapes
                .attr('class', 'overlay-shape')
                .style("stroke", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                .style("opacity", 0.6)
                .style("fill", function (d) { return d.fillColor; })
                .on('mousemove', tooltipAction)
                .on('mouseout', function () {
                    //hide tooltip
                    map.hideTooltip();
                });

            //check if labels are enabled
            //if (map.series[0].labelsEnabled && map.series[0].labelFormat !== '') {
            if (map.series[0].labelFormat !== '') {
                //create labels
                labels = currentG.selectAll('text')
                    .data(filteredData)
                    .enter().append('text')
                    .style("text-anchor", "middle")
                    .style('fill', function (d) { return map.series[0].labelFontColor === 'auto' ? map.getAutoColor(d.fillColor) : map.series[0].labelFontColor; })
                    .style('font-size', '24px')
                    .style('font-family', map.series[0].labelFontFamily)
                    .style('font-style', map.series[0].labelFontStyle === 'bold' ? 'normal' : map.series[0].labelFontStyle)
                    .style('font-weight', map.series[0].labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .text(function (d) {
                        //get label format
                        labelFormat = map.series[0].labelFormat;
                        groupValue = d[groupField];

                        // check if data for the shape exists
                        if (isGrouped)
                            labelFormat = labelFormat.replaceAll('{group}', groupValue);
                        else
                            labelFormat = labelFormat.replaceAll('{group}', '');

                        //assign format
                        labelFormat = map.getContent(d, map.series[0], labelFormat);

                        //return format
                        return labelFormat;
                    })
                    .style('font-size', function (d) {
                        //check whether the label font size is auto
                        if (map.series[0].labelFontSize === 'auto') {
                            fontSize = ((2 * rscale(d[valueField]) - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * 24);
                            if (fontSize < minFontSize)
                                d3.select(this).text('');
                        } else {
                            fontSize = map.series[0].labelFontSize;
                        }
                        //if not out then set defined one
                        return fontSize + 'px';
                    })
                    .on('mousemove', tooltipAction)
                    .on('mouseout', function () {
                        //hide tooltip
                        map.hideTooltip();
                    })
                    .attr("dy", ".35em");
            }

            if (map.currTransform != null) {
                let currTransform;
                if (typeof map.currTransform === "string")
                    currTransform = JSON.parse(map.currTransform);
                else
                    currTransform = map.currTransform;

                // Apply a zoom transform equivalent to projection.{scale,translate,center}.
                d3.select('#' + map.container + "_zoomApply").call(zoom).on("dblclick.zoom", null)
                    .call(zoom.transform, d3.zoomIdentity
                        .translate(currTransform.x, currTransform.y)
                        .scale(currTransform.k));
            } else {
                // Apply a zoom transform equivalent to projection.{scale,translate,center}.
                d3.select('#' + map.container + "_zoomApply").call(zoom).on("dblclick.zoom", null)
                    .call(zoom.transform, d3.zoomIdentity
                        .translate(map.plot.width / 2, map.plot.height / 2)
                        .scale(zoomLevel)
                        .translate(-center[0], -center[1]));
            }
            //raise on loaded
            if (map.onLoaded) map.onLoaded();

            //animate shapes
            animateShapes();

            //attach clear content method to chart
            map.clear = function () {
                overlaySvg.selectAll('.overlay-shape').remove();
                overlaySvg.selectAll('text').remove();
            };

            //set update method to map
            map.update = function (data, keepAxis) {
                //set map data
                map.data = data;

                //update xy domain
                map.calculateDomain();

                //update legend
                map.updateLegend();

                if (map.series[0].updateReZoom) {
                    calculateZoom(true);
                }

                if (valueField) {
                    //calculate radius variables
                    minRadius = map.domains.minY === map.domains.maxY ? map.series[0].maxBulletSize : map.series[0].minBulletSize;
                    rscale = d3.scalePow().exponent(0.5).domain([map.domains.minY, map.domains.maxY]).range([minRadius, maxRadius]);
                    //update base data
                    filteredData = map.data.filter(function (d) {
                        if (!isNaN(parseFloat(d[valueField])) && parseFloat(d[valueField]) !== 0) {
                            d[valueField] = parseFloat(d[valueField]);
                            return true;
                        } else
                            return false;
                    });
                }
                else {
                    //calculate radius variables
                    minRadius = map.series[0].minBulletSize;
                    rscale = function (val) { return minRadius };
                    //update base data
                    filteredData = map.data;
                }

                //remove g
                if (map.animation.effect) {
                    //check whether the effect is fade
                    if (map.animation.effect === 'fade') {
                        //remove with transition
                        currentG.transition().duration(1000).style('opacity', 0).remove();
                        currentG = overlaySvg.append('g');
                        defaultAnimation();
                    } else if (map.animation.effect === 'dim') {
                        oldShapes = overlaySvg.selectAll('.overlay-shape').style('opacity', 0.1).on('mousemove', null).on('mouseout', null);
                        if (labels) {
                            oldLabels = overlaySvg.selectAll('text').style('opacity', 0.1).on('mousemove', null).on('mouseout', null);
                        }
                        effectAnimation();
                    } else if (map.animation.effect === 'add') {
                        oldShapes = overlaySvg.selectAll('.overlay-shape');
                        if (labels) {
                            oldLabels = overlaySvg.selectAll('text');
                        }
                        effectAnimation();
                    } else {
                        defaultAnimation();
                    }
                } else {
                    defaultAnimation();
                }

                //animate shapes
                animateShapes();

                function defaultAnimation() {

                    //update shapes based on icon type
                    switch (map.series[0].tileIcon) {
                        case 'circle':
                            {
                                //update circle svgs
                                let circleBase = currentG.selectAll('.overlay-shape')
                                    .data(filteredData)
                                circleBase
                                    .attr('class', 'overlay-shape update');
                                circleBase
                                    .exit().remove();
                                shapes = circleBase
                                    .enter().append('circle')
                                    .attr('class', 'overlay-shape')
                                    .style("stroke", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                                    .style("opacity", 0.6)
                                    .on('mousemove', tooltipAction)
                                    .on('mouseout', function () {
                                        //hide tooltip
                                        map.hideTooltip();
                                    })
                                    .merge(circleBase)
                                    .attr("cx", function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return d.position[0]; })
                                    .attr("cy", function (d) { return d.position[1]; })
                                    .attr("r", null)
                                    .style("fill", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                            }
                            break;
                        case 'square':
                            {
                                //update rect svgs
                                let rectBase = currentG.selectAll('.overlay-shape')
                                    .data(filteredData)
                                rectBase
                                    .attr('class', 'overlay-shape update');
                                rectBase
                                    .exit().remove();
                                shapes = rectBase
                                    .enter().append('rect')
                                    .attr('class', 'overlay-shape')
                                    .style("stroke", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                                    .style("opacity", 0.6)
                                    .on('mousemove', tooltipAction)
                                    .on('mouseout', function () {
                                        //hide tooltip
                                        map.hideTooltip();
                                    })
                                    .merge(rectBase)
                                    .attr("x", function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return d.position[0] - rscale(d[valueField]); })
                                    .attr("y", function (d) { return d.position[1] - rscale(d[valueField]); })
                                    .attr('width', null)
                                    .attr('height', null)
                                    .style("fill", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                            }
                            break;
                        default:
                            {
                                //update circle svgs
                                let circleBase = currentG.selectAll('.overlay-shape')
                                    .data(filteredData)
                                circleBase
                                    .attr('class', 'overlay-shape update');
                                circleBase
                                    .exit().remove();
                                shapes = circleBase
                                    .enter().append('circle')
                                    .attr('class', 'overlay-shape')
                                    .style("stroke", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                                    .style("opacity", 0.6)
                                    .on('mousemove', tooltipAction)
                                    .on('mouseout', function () {
                                        //hide tooltip
                                        map.hideTooltip();
                                    })
                                    .merge(circleBase)
                                    .attr("cx", function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return d.position[0]; })
                                    .attr("cy", function (d) { return d.position[1]; })
                                    .attr("r", null)
                                    .style("fill", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                            }
                    }

                    //update labels if exists
                    if (labels !== null) {
                        let labelBase = currentG.selectAll('text')
                            .data(filteredData)
                        labelBase
                            .attr('class', 'update');
                        labelBase
                            .exit().remove();
                        labels = labelBase
                            .enter().append('text')
                            .style("text-anchor", "middle")
                            .style('fill', function (d) { return map.series[0].labelFontColor === 'auto' ? map.getAutoColor(d.fillColor) : map.series[0].labelFontColor; })
                            .style('font-family', map.series[0].labelFontFamily)
                            .style('font-style', map.series[0].labelFontStyle === 'bold' ? 'normal' : map.series[0].labelFontStyle)
                            .style('font-weight', map.series[0].labelFontStyle === 'bold' ? 'bold' : 'normal')
                            .on('mousemove', tooltipAction)
                            .on('mouseout', function () {
                                //hide tooltip
                                map.hideTooltip();
                            })
                            .attr("dy", ".35em")
                            .merge(labelBase)
                            .style('font-size', '24px')
                            .text(function (d) {
                                //get label format
                                labelFormat = map.series[0].labelFormat;
                                groupValue = d[groupField];

                                // check if data for the shape exists
                                if (isGrouped)
                                    labelFormat = labelFormat.replaceAll('{group}', groupValue);
                                else
                                    labelFormat = labelFormat.replaceAll('{group}', '');

                                //assign format
                                labelFormat = map.getContent(d, map.series[0], labelFormat);

                                //return format
                                return labelFormat;
                            })
                            .style('font-size', function (d) {
                                //check whether the label font size is auto
                                if (map.series[0].labelFontSize === 'auto') {
                                    fontSize = ((2 * rscale(d[valueField]) - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * 24);
                                    if (fontSize < minFontSize)
                                        d3.select(this).text('');
                                } else {
                                    fontSize = map.series[0].labelFontSize;
                                }
                                //if not out then set defined one
                                return fontSize + 'px';
                            })
                            .attr('transform', function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return "translate(" + d.position[0] + "," + (d.position[1] - this.getBBox().height / 4) + ")"; });
                    }
                }

                function effectAnimation() {

                    //update shapes based on icon type
                    switch (map.series[0].tileIcon) {
                        case 'circle':
                            {
                                shapes = overlaySvg.append('g')
                                    .selectAll('.overlay-shape')
                                    .data(filteredData)
                                    .enter().append('circle')
                                    .attr('class', 'overlay-shape')
                                    .style("stroke", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                                    .style("opacity", 0.6)
                                    .on('mousemove', tooltipAction)
                                    .on('mouseout', function () {
                                        //hide tooltip
                                        map.hideTooltip();
                                    })
                                    .attr("cx", function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return d.position[0]; })
                                    .attr("cy", function (d) { return d.position[1]; })
                                    .attr("r", null)
                                    .style("fill", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                            }
                            break;
                        case 'square':
                            {
                                shapes = overlaySvg.append('g')
                                    .selectAll('.overlay-shape')
                                    .enter().append('rect')
                                    .attr('class', 'overlay-shape')
                                    .style("stroke", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                                    .style("opacity", 0.6)
                                    .on('mousemove', tooltipAction)
                                    .on('mouseout', function () {
                                        //hide tooltip
                                        map.hideTooltip();
                                    })
                                    .attr("x", function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return d.position[0] - rscale(d[valueField]); })
                                    .attr("y", function (d) { return d.position[1] - rscale(d[valueField]); })
                                    .attr('width', null)
                                    .attr('height', null)
                                    .style("fill", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                            }
                            break;
                        default:
                            {
                                shapes = overlaySvg.append('g')
                                    .selectAll('.overlay-shape')
                                    .enter().append('circle')
                                    .attr('class', 'overlay-shape')
                                    .style("stroke", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                                    .style("opacity", 0.6)
                                    .on('mousemove', tooltipAction)
                                    .on('mouseout', function () {
                                        //hide tooltip
                                        map.hideTooltip();
                                    })
                                    .attr("cx", function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return d.position[0]; })
                                    .attr("cy", function (d) { return d.position[1]; })
                                    .attr("r", null)
                                    .style("fill", function (d) { d.fillColor = isGrouped ? e.matchGroup(d[groupField], map.legend.legendColors, 'color') : singleColor; return d.fillColor; })
                            }
                    }

                    //update labels if exists
                    if (labels !== null) {
                        labels = overlaySvg
                            .data(filteredData)
                            .enter().append('text')
                            .style("text-anchor", "middle")
                            .style('fill', function (d) { return map.series[0].labelFontColor === 'auto' ? map.getAutoColor(d.fillColor) : map.series[0].labelFontColor; })
                            .style('font-family', map.series[0].labelFontFamily)
                            .style('font-style', map.series[0].labelFontStyle === 'bold' ? 'normal' : map.series[0].labelFontStyle)
                            .style('font-weight', map.series[0].labelFontStyle === 'bold' ? 'bold' : 'normal')
                            .on('mousemove', tooltipAction)
                            .on('mouseout', function () {
                                //hide tooltip
                                map.hideTooltip();
                            })
                            .attr("dy", ".35em")
                            .style('font-size', '24px')
                            .text(function (d) {
                                //get label format
                                labelFormat = map.series[0].labelFormat;
                                groupValue = d[groupField];

                                // check if data for the shape exists
                                if (isGrouped)
                                    labelFormat = labelFormat.replaceAll('{group}', groupValue);
                                else
                                    labelFormat = labelFormat.replaceAll('{group}', '');

                                //assign format
                                labelFormat = map.getContent(d, map.series[0], labelFormat);

                                //return format
                                return labelFormat;
                            })
                            .style('font-size', function (d) {
                                //check whether the label font size is auto
                                if (map.series[0].labelFontSize === 'auto') {
                                    fontSize = ((2 * rscale(d[valueField]) - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * 24);
                                    if (fontSize < minFontSize)
                                        d3.select(this).text('');
                                } else {
                                    fontSize = map.series[0].labelFontSize;
                                }
                                //if not out then set defined one
                                return fontSize + 'px';
                            })
                            .attr('transform', function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return "translate(" + d.position[0] + "," + (d.position[1] - this.getBBox().height / 4) + ")"; });
                    }
                }
            };
        }

        //handles zoom event
        function zoomed() {
            //declare needed variables
            let transform = d3.event.transform,
                oldCenter = [map.plot.width / 2, map.plot.height / 2],
                centerDiff = [0, 0],
                currTransform;

            if (ignoreCurrent) {
                ignoreCurrent = false;
                currTransform = {
                    x: transform.x,
                    y: transform.y,
                    k: transform.k,
                    center: oldCenter
                };
            } else {
                //handle no scale value
                if (!transform.k)
                    return;

                if (platform === "vysda") {
                    currTransform = app.maps[map.index].currTransform;
                }
                else if(platform === "ssweb") {
                    //iterate tabs
                    report.dashboard.tabs.forEach(function (tab) {
                        if (tab.id === map.tabID) {
                            //iterate visualizations
                            tab.visualizations.forEach(function (vis) {
                                if (vis.visualizationID === map.visualizationID) {
                                    if (vis.currTransform) {
                                        currTransform = JSON.parse(vis.currTransform);
                                    }
                                }
                            });
                        }
                    });
                }
                else {
                    currTransform = map.currTransform;
                }

                if (currTransform == null) {
                    currTransform = {
                        x: transform.x,
                        y: transform.y,
                        k: transform.k,
                        center: oldCenter
                    };
                } else {
                    if (currTransform.center) {
                        if (oldCenter[0] != currTransform.center[0] && oldCenter[1] != currTransform.center[1]) {
                            centerDiff[0] = oldCenter[0] - currTransform.center[0];
                            centerDiff[1] = oldCenter[1] - currTransform.center[1];
                        }
                    }
                    if (transform === currTransform)
                        return;
                    if (currTransform.k < transform.k) {
                        transform.x = currTransform.x * 2 - oldCenter[0] + centerDiff[0];
                        transform.y = currTransform.y * 2 - oldCenter[1] + centerDiff[1];
                        transform.k = currTransform.k * 2;
                    } else if (currTransform.k > transform.k) {
                        transform.x = currTransform.x * 0.5 + (oldCenter[0] / 2);
                        transform.y = currTransform.y * 0.5 + (oldCenter[1] / 2);
                        transform.k = currTransform.k * 0.5;
                    } else if (currTransform.k == transform.k) {
                        transform.x = transform.x + centerDiff[0];
                        transform.y = transform.y + centerDiff[1];
                    }
                    centerDiff = [0, 0];
                    currTransform.x = transform.x;
                    currTransform.y = transform.y;
                    currTransform.k = transform.k;
                    currTransform.center = oldCenter;

                }
            }

            if (platform === "vysda") {
                app.maps[map.index].currTransform = currTransform;
            }
            else if(platform === "ssweb") {
                //iterate tabs
                report.dashboard.tabs.forEach(function (tab) {
                    if (tab.id === map.tabID) {
                        //iterate visualizations
                        tab.visualizations.forEach(function (vis) {
                            if (vis.visualizationID === map.visualizationID) {
                                vis.currTransform = JSON.stringify(currTransform);
                            }
                        });
                    }
                });
            }
            else {
                map.currTransform = currTransform;
            }

            //update tiles
            tiles = tile
                .scale(transform.k)
                .translate([transform.x, transform.y])
                ();

            //update projection
            projection
                .scale(transform.k / tau)
                .translate([transform.x, transform.y]);

            let image = vectorDiv
                .style("transform", stringify(tiles.scale, tiles.translate, tiles[0]))
                .selectAll(".tile")
                .data(tiles, function (d) { return d; });

            image.exit()
                .each(function (d) { if (this.labels) this.labels.remove(); this.labels = null; })
                .remove();

            image.enter()
                .append("svg")
                .attr("class", map.container + " tile")
                .style('position', 'absolute')
                .style('background-color', 'rgb(221,221,221)')
                .style("width", "256px")
                .style("height", "256px")
                .each(function (d) {
                    let limit = Math.pow(2, d[2]) - 1;
                    let that = this;
                    if (this.labels) this.labels.remove();
                    if (d[0] <= limit && d[1] <= limit)
                        render(d, this).then(function (l) { if (l) that.labels = renderLabels(l); });
                    else
                        this.parentNode.removeChild(this);
                });

            vectorDiv.selectAll('.tile')
                .style("left", function (d) { return (d[0] - tiles[0][0]) * 256 + "px"; })
                .style("top", function (d) { return (d[1] - tiles[0][1]) * 256 + "px"; });
            
            d3.select('#' + map.container + "_map").selectAll('svg').sort(function (a, b) { return a ? -1 : 0; });
            d3.select('#' + map.container + "_map").selectAll('svg').sort(function (a, b) { return a ? 0 : 1; });

            overlaySvg.style("left", (pointToMap('', tiles.scale, tiles.translate)[0]) + "px")
                .style("top", (pointToMap('', tiles.scale, tiles.translate)[1]) + "px")
                .style("width", map.plot.width + "px")
                .style("height", map.plot.height + "px");

            //update positions based on icon type
            switch (map.series[0].tileIcon) {
                case 'circle':
                    {
                        shapes
                            .attr("cx", function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return d.position[0]; })
                            .attr("cy", function (d) { return d.position[1]; });
                        if (oldShapes)
                            oldShapes
                                .attr("cx", function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return d.position[0]; })
                                .attr("cy", function (d) { return d.position[1]; });
                    }
                    break;
                case 'square':
                    {
                        shapes
                            .attr("x", function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return d.position[0] - rscale(d[valueField]); })
                            .attr("y", function (d) { return d.position[1] - rscale(d[valueField]); });
                        if (oldShapes)
                            oldShapes
                                .attr("x", function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return d.position[0] - rscale(d[valueField]); })
                                .attr("y", function (d) { return d.position[1] - rscale(d[valueField]); });
                    }
                    break;
                default:
                    {
                        shapes
                            .attr("cx", function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return d.position[0]; })
                            .attr("cy", function (d) { return d.position[1]; });
                        if (oldShapes)
                            oldShapes
                                .attr("cx", function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return d.position[0]; })
                                .attr("cy", function (d) { return d.position[1]; });
                    }
            }

            if (tileLabels.length > 0) {
                tileLabels.forEach(function (lbl) {
                    lbl.attr('transform', function (d) {
                        let point = pointToMap([d.geometry.coordinates[0], d.geometry.coordinates[1]], tiles.scale, tiles.translate, true);
                        return 'translate(' + point[0] + ',' + point[1] + ')';
                    });
                });
            }
            if (labels !== null) {
                labels.attr('transform', function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return "translate(" + d.position[0] + "," + d.position[1] + ")"; });
                if (oldLabels) oldLabels.attr('transform', function (d) { d.position = pointToMap([d[longField], d[latField]], tiles.scale, tiles.translate, true); return "translate(" + d.position[0] + "," + d.position[1] + ")"; });
            }
        }

        //handles tile render
        function render(d, node) {
            let mapLayers = e.clone(map.series[0].mapLayers);

            if (mapLayers.indexOf("landcover") === -1)
                mapLayers.push("landcover");
            if (mapLayers.indexOf("water") === -1)
                mapLayers.push("water");

            for (let i = 0; i < mapLayers.length; i++) {
                if (mapLayers[i] === "boundaries") {
                    mapLayers[i] = "boundary";
                } else if (mapLayers[i] === "buildings") {
                    mapLayers[i] = "building";
                    mapLayers.push("housenumber");
                } else if (mapLayers[i] === "places") {
                    mapLayers[i] = "place";
                } else if (mapLayers[i] === "roads") {
                    mapLayers[i] = "transportation";
                } else if (mapLayers[i] === "lakesandrivers") {
                    mapLayers[i] = "waterway";
                }

            }
            if (mapLayers.indexOf('aeroway') !== -1) mapLayers.splice(mapLayers.indexOf('aeroway'), 1);
            if (mapLayers.indexOf('landcover') !== -1) mapLayers.push('landcover');
            if (mapLayers.indexOf('mountain_peak') !== -1) mapLayers.splice(mapLayers.indexOf('mountain_peak'), 1);
            if (mapLayers.indexOf('park') !== -1) mapLayers.splice(mapLayers.indexOf('park'), 1);
            if (mapLayers.indexOf('pois') !== -1) mapLayers.splice(mapLayers.indexOf('pois'), 1);
            if (mapLayers.indexOf('transit') !== -1) mapLayers.splice(mapLayers.indexOf('transit'), 1);
            if (mapLayers.indexOf('water_name') !== -1) mapLayers.splice(mapLayers.indexOf('water_name'), 1);
            if (mapLayers.indexOf('transportation_name') !== -1) mapLayers.splice(mapLayers.indexOf('transportation_name'), 1);

            if (!e.vectorSource || !e.vectorKey) {
                e.renderVectorError(node);
                return new Promise(function(resolve, reject) {
                    resolve(null);
                });
            }

            let urlOptions = { base: e.vectorSource, z: d[2], x: d[0], y: d[1], token: e.vectorKey };

            return vectorJSON.getVectorTilePromise(urlOptions).then(function (json) {
                if (_.isEmpty(json)) {
                    e.renderVectorError(node);
                    return null;
                }
                // build up a single concatenated array of all tile features from all tile layers
                let features = [],
                    labels = [],
                    k = Math.pow(2, d[2]) * 256,// size of the world in pixels
                    innerProjection = d3.geoMercator().scale(k / tau).translate([k / 2 - d[0] * 256, k / 2 - d[1] * 256]).precision(0);
                mapLayers.forEach(function (layer) {
                    if (json[layer]) {
                        if (json[layer].features.length > 0) {
                            for (i = 0; i < json[layer].features.length; i++) {
                                if (layer === 'boundary') {
                                    if (json[layer].features[i].properties.admin_level === 2) {
                                        json[layer].features[i].properties.cssClass = 'outerBorder';
                                    }
                                    else if (json[layer].features[i].properties.admin_level === 4) {
                                        if (d[2] < 6)
                                            json[layer].features[i].properties.cssClass = 'innerBorder';
                                        else
                                            json[layer].features[i].properties.cssClass = 'outerBorder';
                                    }
                                    else {
                                        continue;
                                    }
                                } else if (layer === 'building' || layer === 'housenumber') {
                                    if (d[2] <= 14 && json[layer].features[i].properties.render_height >= 100) {
                                        continue;
                                    }
                                    json[layer].features[i].properties.cssClass = 'buildingAndHouseNo';
                                } else if (layer === 'landcover') {
                                    json[layer].features[i].properties.cssClass = 'notVisible';
                                } else if (layer === 'water') {
                                    json[layer].features[i].properties.cssClass = 'water';
                                } else if (layer === 'waterway') {
                                    json[layer].features[i].properties.cssClass = 'waterway';
                                } else if (layer === 'place') {
                                    if (d[2] < 3) {
                                        if (json[layer].features[i].properties.class === 'continent')
                                            json[layer].features[i].properties.cssClass = 'noneStyle';
                                        else if (json[layer].features[i].properties.class === 'country' && json[layer].features[i].properties.rank === 1)
                                            json[layer].features[i].properties.cssClass = 'noneStyle';
                                        else
                                            continue;
                                    } else if (d[2] < 5) {
                                        if (json[layer].features[i].properties.class === 'continent' || json[layer].features[i].properties.class === 'country' || json[layer].features[i].properties.class === 'state' || json[layer].features[i].properties.class === 'province')
                                            json[layer].features[i].properties.cssClass = 'noneStyle';
                                        else
                                            continue;
                                    } else if (d[2] < 9) {
                                        if (json[layer].features[i].properties.class === 'continent' || json[layer].features[i].properties.class === 'country' || json[layer].features[i].properties.class === 'state' || json[layer].features[i].properties.class === 'province')
                                            json[layer].features[i].properties.cssClass = 'noneStyle';
                                        else if (json[layer].features[i].properties.class === 'city' || json[layer].features[i].properties.class === 'town')
                                            json[layer].features[i].properties.cssClass = 'noneStyle';
                                        else
                                            continue;
                                    } else {
                                        json[layer].features[i].properties.cssClass = 'noneStyle';
                                    }
                                } else if (layer === 'transportation') {
                                    let cls = json[layer].features[i].properties.class;
                                    if (cls === 'motorway') {
                                        json[layer].features[i].properties.cssClass = 'roads-motorway';
                                    } else if (cls === 'trunk' || cls === 'primary' || cls === 'secondary' || cls === 'tertiary' || cls === 'trunk') {
                                        json[layer].features[i].properties.cssClass = 'roads-major_road';
                                    } else if (cls === 'raceway' || cls === 'service' || cls === 'minor') {
                                        json[layer].features[i].properties.cssClass = 'roads-minor_road';
                                    } else if (cls === 'rail') {
                                        json[layer].features[i].properties.cssClass = 'roads-rail';
                                    }
                                    else {
                                        json[layer].features[i].properties.cssClass = 'notVisible';
                                    }
                                } else {
                                    json[layer].features[i].properties.cssClass = 'notVisible';
                                }

                                json[layer].features[i].layer_name = layer;

                                if (layer === 'place')
                                    labels.push(json[layer].features[i]);
                                else
                                    features.push(json[layer].features[i]);
                            }
                        }
                    }
                });

                d3.select(node).selectAll("path")
                    .data(features)
                    .enter().append("path")
                    .attr("class", function (d) { return d.properties.cssClass; })
                    .attr("d", d3.geoPath().projection(innerProjection));

                return labels;
            });
        }

        //render tile labels
        function renderLabels(labels) {
            let styleObj = { style: '', weight: '', size: 0 };
            let labelObj;
            if (labels.length > 0) {
                //create labels
                labelObj = currentG.selectAll('.tile-label')
                    .data(labels)
                    .enter().append('text')
                    .style("text-anchor", "middle")
                    .style('font-family', map.series[0].labelFontFamily)
                    .style('font-style', function (d) {
                        if (d.properties.class === 'continent')
                            styleObj.style = 'oblique';
                        else if (d.properties.class === 'region')
                            styleObj.style = 'italic';
                        else
                            styleObj.style = 'normal';
                        return styleObj.style;
                    })
                    .style('font-weight', function (d) {
                        if (d.properties.class === 'country')
                            styleObj.weight = '600';
                        else
                            styleObj.weight = 'normal';
                        return styleObj.weight;
                    })
                    .attr("dy", ".35em")
                    .text(function (d) { return d.properties['name:en'] ? d.properties['name:en'] : d.properties.name; })
                    .style('fill', 'black')
                    .style('font-size', function (d) {
                        if (d.properties.class === 'continent')
                            styleObj.size = 12;
                        else if (d.properties.class === 'region')
                            styleObj.size = 12;
                        else if (d.properties.class === 'country')
                            styleObj.size = 11;
                        else
                            styleObj.size = 10;
                        return styleObj.size + 'px';
                    })
                    .attr('transform', function (d) {
                        let point = pointToMap([d.geometry.coordinates[0], d.geometry.coordinates[1]], tiles.scale, tiles.translate, true);
                        return 'translate(' + point[0] + ',' + point[1] + ')';
                    });
                tileLabels.push(labelObj);
            }
            return labelObj;
        }

        //handles latlong to svg point conversion
        function pointToMap(d, scale, translate, t) {
            let dPoint = projection(d), r = scale % 1 ? Number : Math.round;
            return t ? [dPoint[0], dPoint[1]] : [-r((translate[0] + tiles[0][0]) * scale), -r((translate[1] + tiles[0][1]) * scale)];
        }

        //helper function for vector tiles
        function stringify(scale, translate, min) {
            let k = scale / 256, r = scale % 1 ? Number : Math.round;
            return "matrix3d(" + [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, r((translate[0] + min[0]) * scale), r((translate[1] + min[1]) * scale), 0, 1] + ")";
        }

        function tooltipAction(d) {
            //check whether balloon enabled
            if (map.tooltip.format !== '') {
                //get label format
                tooltipContent = map.tooltip.format;
                groupValue = d[groupField];

                // check if data for the shape exists
                if (isGrouped)
                    tooltipContent = tooltipContent.replaceAll('{group}', groupValue);
                else
                    tooltipContent = tooltipContent.replaceAll('{group}', '');

                //assign format
                tooltipContent = map.getContent(d, map.series[0], tooltipContent);

                //show tooltip
                map.showTooltip(tooltipContent);
            }
        }

        if (map.currTransform == null)
            calculateZoom();

        createMap();

        //draws the map into a canvas
        map.toCanvas = function (id) {
            //declare needed variables
            let vectorDiv = document.getElementById(map.container + '_map'),
                legendSvg = document.getElementById(map.container + '_legend_svg'),
                svgElements = vectorDiv.getElementsByClassName('tile'),
                overlayS = document.getElementById(map.container + '_overlay'),
                topPos = parseFloat(overlayS.style.top),
                leftPos = parseFloat(overlayS.style.left),
                tempTop,
                tempLeft,
                legendSvgTemp,
                xml,
                canvas = document.createElement('canvas'),
				ready = false,
                vectorLayerCanvas = document.createElement('canvas'),
                ctx = vectorLayerCanvas.getContext("2d"),
                tempDiv = document.createElement('div'),
                defs = document.createElement('defs');

            //set tile style definitions
            defs.innerHTML = e.vectorTileStyle;

            //set temp div style
            tempDiv.style.position = vectorDiv.style.position;
            tempDiv.style.overflow = vectorDiv.style.overflow;
            tempDiv.style.width = vectorDiv.style.width;
            tempDiv.style.height = vectorDiv.style.height;
            //set temp tile style
            vectorLayerCanvas.style.top = 0;
            vectorLayerCanvas.style.left = 0;
            vectorLayerCanvas.style.position = 'absolute';
            vectorLayerCanvas.width = map.plot.width;
            vectorLayerCanvas.height = map.plot.height;

            ctx.fillStyle = 'rgb(221, 221, 221)';

            //replace all map svgs with canvas
            for (let i = 0; i < svgElements.length; i++) {
                //calculate canvas position
                tempTop = (parseFloat(svgElements[i].style.top) - topPos);
                tempLeft = (parseFloat(svgElements[i].style.left) - leftPos);

                //insert style into svg
                svgElements[i].insertBefore(defs, svgElements[i].firstChild);
                //convert SVG into a XML string
                xml = (new XMLSerializer()).serializeToString(svgElements[i]);
                if (e.detectMS())
                    xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                //draw the SVG onto a canvas
                canvg(canvas, xml, { ignoreMouse: true, ignoreAnimation: true });
                //draw the canvas to vector layer
                ctx.fillRect(tempLeft, tempTop, canvas.width, canvas.height);
                ctx.drawImage(canvas, tempLeft, tempTop);
                //remove styles from svg
                svgElements[i].removeChild(defs);
            }

            //convert SVG into a XML string
            xml = (new XMLSerializer()).serializeToString(overlayS);
            if (e.detectMS())
                xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
            //draw the SVG onto a canvas
            canvg(canvas, xml, {
                ignoreMouse: true, ignoreAnimation: true, renderCallback: function () {
                    ready = true;
                    //draw overlay canvas to vector layer
                    vectorLayerCanvas.getContext('2d').drawImage(canvas, 0, 0);
                    canvas.svg.stop();
                }
            });

            //insert canvas to tempDiv
            tempDiv.appendChild(vectorLayerCanvas);
            //copy info to tempDiv
            tempDiv.appendChild(document.getElementById(map.container + '_info').cloneNode(true));

            //restore elements
            vectorDiv.parentNode.insertBefore(tempDiv, vectorDiv);
            vectorDiv.parentNode.removeChild(vectorDiv);

            //serialize legend svg if exists
            if (legendSvg) {
                //create the canvas       
                legendSvgTemp = document.createElement("canvas");
                //convert SVG into a XML string
                xml = (new XMLSerializer()).serializeToString(legendSvg);
                if (e.detectMS())
                    xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');

                //draw the SVG onto a canvas
                canvg(legendSvgTemp, xml, {
                    ignoreMouse: true, ignoreAnimation: true, renderCallback: function () {
                        legendSvgTemp.svg.stop();
                    }
                });
                //replace innerSvg with canvas
                legendSvg.parentNode.appendChild(legendSvgTemp);
                legendSvg.parentNode.removeChild(legendSvg);
            }

            /* create the promise for function response
            ** this is required for handling async canvas conversion
            */
            return new Promise(function (resolve) {
                let canvasInterval = setInterval(function () {
                    if (ready) {
                        //convert the final clone to canvas
                        html2canvas(document.getElementById(map.container)).then(function (canvas) {
                            //restore legend elements if exists
                            if (legendSvg) {
                                legendSvgTemp.parentNode.appendChild(legendSvg);
                                legendSvgTemp.parentNode.removeChild(legendSvgTemp);
                            }
                            //restore elements
                            tempDiv.parentNode.insertBefore(vectorDiv, tempDiv);
                            tempDiv.parentNode.removeChild(tempDiv);
                            //return promise with canvas
                            canvas.id = id + '-canvas';
                            resolve(canvas);
                        });
                        clearInterval(canvasInterval);
                    }
                }, 50);
            });
        };

        //returns the map image 
        map.toImage = function () {
            //declare needed variables
            let vectorDiv = document.getElementById(map.container + '_map'),
                legendSvg = document.getElementById(map.container + '_legend_svg'),
                svgElements = vectorDiv.getElementsByClassName('tile'),
                overlayS = document.getElementById(map.container + '_overlay'),
                topPos = parseFloat(overlayS.style.top),
                leftPos = parseFloat(overlayS.style.left),
                tempTop,
                tempLeft,
                legendSvgTemp,
                xml,
                canvas = document.createElement("canvas"),
				ready = false,
                vectorLayerCanvas = document.createElement('canvas'),
                ctx = vectorLayerCanvas.getContext("2d"),
                tempDiv = document.createElement('div'),
                defs = document.createElement('defs');

            //set tile style definitions
            defs.innerHTML = e.vectorTileStyle;

            //set temp div style
            tempDiv.style.position = vectorDiv.style.position;
            tempDiv.style.overflow = vectorDiv.style.overflow;
            tempDiv.style.width = vectorDiv.style.width;
            tempDiv.style.height = vectorDiv.style.height;
            //set temp tile style
            vectorLayerCanvas.style.top = 0;
            vectorLayerCanvas.style.left = 0;
            vectorLayerCanvas.style.position = 'absolute';
            vectorLayerCanvas.width = map.plot.width;
            vectorLayerCanvas.height = map.plot.height;
            ctx.fillStyle = 'rgb(221, 221, 221)';

            //replace all map svgs with canvas
            for (let i = 0; i < svgElements.length; i++) {
                //calculate canvas position
                tempTop = (parseFloat(svgElements[i].style.top) - topPos);
                tempLeft = (parseFloat(svgElements[i].style.left) - leftPos);
                //insert style into svg
                svgElements[i].insertBefore(defs, svgElements[i].firstChild);
                //convert SVG into a XML string
                xml = (new XMLSerializer()).serializeToString(svgElements[i]);
                if (e.detectMS())
                    xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                //draw the SVG onto a canvas
                canvg(canvas, xml, { ignoreMouse: true, ignoreAnimation: true });
                //draw the canvas to vector layer
                ctx.fillRect(tempLeft, tempTop, canvas.width, canvas.height);
                ctx.drawImage(canvas, tempLeft, tempTop);
                //remove styles from svg
                svgElements[i].removeChild(defs);
            }

            //convert SVG into a XML string
            xml = (new XMLSerializer()).serializeToString(overlayS);
            if (e.detectMS())
                xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
            //draw the SVG onto a canvas
            canvg(canvas, xml, {
                ignoreMouse: true, ignoreAnimation: true, renderCallback: function () {
                    ready = true;
                    //draw overlay canvas to vector layer
                    vectorLayerCanvas.getContext('2d').drawImage(canvas, 0, 0);
                    canvas.svg.stop();
                }
            });

            //insert canvas to tempDiv
            tempDiv.appendChild(vectorLayerCanvas);
            //copy info to tempDiv
            tempDiv.appendChild(document.getElementById(map.container + '_info').cloneNode(true));
            //restore elements
            vectorDiv.parentNode.insertBefore(tempDiv, vectorDiv);
            vectorDiv.parentNode.removeChild(vectorDiv);

            //serialize legend svg if exists
            if (legendSvg) {
                //create the canvas       
                legendSvgTemp = document.createElement("canvas");
                //convert SVG into a XML string
                xml = (new XMLSerializer()).serializeToString(legendSvg);
                if (e.detectMS())
                    xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');

                //draw the SVG onto a canvas
                canvg(legendSvgTemp, xml, {
                    ignoreMouse: true, ignoreAnimation: true, renderCallback: function () {
                        legendSvgTemp.svg.stop();
                    }
                });

                //replace innerSvg with canvas
                legendSvg.parentNode.appendChild(legendSvgTemp);
                legendSvg.parentNode.removeChild(legendSvg);
            }
            /* create the promise for function response
            ** this is required for handling async canvas conversion
            */
            return new Promise(function (resolve) {
                let canvasInterval = setInterval(function () {
                    if (ready) {
                        //convert the final clone to canvas
                        html2canvas(document.getElementById(map.container)).then(function (canvas) {
                            //restore legend elements if exists
                            if (legendSvg) {
                                legendSvgTemp.parentNode.appendChild(legendSvg);
                                legendSvgTemp.parentNode.removeChild(legendSvgTemp);
                            }
                            //restore elements
                            tempDiv.parentNode.insertBefore(vectorDiv, tempDiv);
                            tempDiv.parentNode.removeChild(tempDiv);
                            //return promise with image
                            resolve(canvas.toDataURL('image/png'));
                        });
                        clearInterval(canvasInterval);
                    }
                }, 1);
            });
        };

        //return standard map
        return map;
    }

    //attach standard map method into the eve
    e.locationMap = function (options) {
        options.type = 'locationMap';
        options.masterType = 'map';
        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new locationMap(options);
    };
})(eve);