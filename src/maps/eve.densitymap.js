/*!
 * eve.densitymap.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for density map.
 */
(function (e) {
    //define density map class
    function densityMap(options) {
        //declare needed variables
        let map = e.initVis(options),
            latField = map.series[0].latField,
            longField = map.series[0].longField,
            valueField = map.series[0].valueField,
            expression = map.series[0].expression,
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
            tile = null,
            tiles = null,
            zoom = null,
            colorizeVisible = map.series[0].colorizeVisible,
            filteredData = [],
            heatRadius = map.series[0].radius,
            heatBlur = map.series[0].blur,
            circleCanvas = document.createElement('canvas'),
            heatGradient = null,
            tileLabels = [],
            initialLoad = false,
            ignoreCurrent = false,
            heatData = [],
            calculatedTrans = null,
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

        //set map plot width and height
        map.plot.width = map.plot.width - map.plot.left * 2 - map.plot.right;
        map.plot.height = map.plot.height - map.plot.top;

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
            .attr("id", map.container + "_svgOverlay");

        //create svg for overlay
        let overlayCanvas = document.createElement('canvas');
        overlayCanvas.className = 'overlay';
        overlayCanvas.style.position = 'absolute';
        overlayCanvas.id = map.container + "_overlay";
        overlayCanvas.width = map.plot.width;
        overlayCanvas.height = map.plot.height;

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

        //creates route map
        function createMap() {
            //set zoom
            zoom = d3.zoom().scaleExtent([1 << 9, 1 << 22]).on("zoom", zoomed);//.on("end", ended);
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

            //handle nulls and non-numeric values in lat and long
            filteredData = map.data.filter(function (d) {
                if (!isNaN(parseFloat(d[latField])) && parseFloat(d[latField]) !== 0 && !isNaN(parseFloat(d[longField])) && parseFloat(d[longField]) !== 0) {
                    return true;
                } else
                    return false;
            });

            initialLoad = true;
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

            //attach clear content method to chart
            map.clear = function () {};

            //set update method to map
            map.update = function (data, keepAxis) {
                //set map data
                map.data = data;

                //handle nulls and non-numeric values in lat and long
                filteredData = map.data.filter(function (d) {
                    if (!isNaN(parseFloat(d[latField])) && parseFloat(d[latField]) !== 0 && !isNaN(parseFloat(d[longField])) && parseFloat(d[longField]) !== 0) {
                        return true;
                    } else
                        return false;
                });

                let currTransform;
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
                prepareDensityGrid(currTransform.k);

                //update xy domain
                map.calculateDomain();

                //update legend
                map.updateLegend();

                if (map.series[0].updateReZoom) {
                    calculateZoom(true);
                }
            };
        }

        //handles zoom event
        function zoomed() {
            //declare needed variables
            let transform = d3.event.transform,
                oldCenter = [map.plot.width / 2, map.plot.height / 2],
                drag = false,
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
                        drag = initialLoad ? false : true;
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
            initialLoad = false;
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

            if (tileLabels.length > 0) {
                tileLabels.forEach(function (lbl) {
                    lbl.attr('transform', function (d) {
                        let point = pointToMap([d.geometry.coordinates[0], d.geometry.coordinates[1]], tiles.scale, tiles.translate, true);
                        return 'translate(' + point[0] + ',' + point[1] + ')';
                    });
                });
            }

            vectorDiv.node().appendChild(overlayCanvas);
            overlayCanvas.style.left = pointToMap('', tiles.scale, tiles.translate)[0] + "px";
            overlayCanvas.style.top = pointToMap('', tiles.scale, tiles.translate)[1] + "px";
            prepareDensityGrid(transform.k, drag);


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
                labelObj = overlaySvg.selectAll('.tile-label')
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

        function log2(number) {
            return Math.log(number) / Math.log(2);
        }

        //create density grid
        function prepareDensityGrid(currentZoom, drag) {
            let cellSize = heatRadius / 2,
                k = 1 / Math.pow(2, Math.max(0, Math.min(24 - log2(currentZoom), 12))),
                grid = [],
                difference = [],
                factor = [0, 0],
                maxK = 0,
                val,
                cell,
                currTransform;

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
            
            if (drag) {
                difference[0] = calculatedTrans.x - currTransform.x;
                difference[1] = calculatedTrans.y - currTransform.y;

                if (difference[0] < 0) factor[0] = -Math.floor((difference[0]) / cellSize);
                if (difference[1] < 0) factor[1] = -Math.floor((difference[1]) / cellSize);
            } else {
                calculatedTrans = e.clone(currTransform);
            }
            for (var i = 0, len = filteredData.length; i < len; i++) {
                var x, y, p;
                p = pointToMap([filteredData[i][longField], filteredData[i][latField]], tiles.scale, tiles.translate, true);
                if (colorizeVisible) {
                    if (p[0] < 0 || p[0] > overlayCanvas.width || p[1] < 0 || p[1] > overlayCanvas.height) {
                        continue;
                    }
                }
                if (drag) {
                    x = Math.floor((p[0] + difference[0]) / cellSize) + factor[0];
                    y = Math.floor((p[1] + difference[1]) / cellSize) + factor[1];
                }
                else {
                    x = Math.floor(p[0] / cellSize);
                    y = Math.floor(p[1] / cellSize);
                }

                grid[y] = grid[y] || [];
                cell = grid[y][x];
                if (valueField) {
                    switch (expression) {
                        case 'count': {
                            if (!cell) {
                                grid[y][x] = [p[0], p[1], 1];
                            } else {
                                cell[0] = (cell[0] * cell[2] + p[0]) / (cell[2] + 1); // x
                                cell[1] = (cell[1] * cell[2] + p[1]) / (cell[2] + 1); // y
                                cell[2] += 1; // cumulated intensity value
                            }
                        }
                            break;
                        case 'sum': {
                            val = filteredData[i][valueField];
                            if (!cell) {
                                grid[y][x] = [p[0], p[1], val];
                            } else {
                                cell[0] = (cell[0] * cell[2] + p[0] * val) / (cell[2] + val); // x
                                cell[1] = (cell[1] * cell[2] + p[1] * val) / (cell[2] + val); // y
                                cell[2] += val; // cumulated intensity value
                            }
                        }
                            break;
                        case 'avg': {
                            val = filteredData[i][valueField];
                            if (!cell) {
                                grid[y][x] = [p[0], p[1], val, val, 1];
                            } else {
                                cell[0] = (cell[0] * cell[2] + p[0] * val) / (cell[2] + val); // x
                                cell[1] = (cell[1] * cell[2] + p[1] * val) / (cell[2] + val); // y
                                cell[3] += val;
                                cell[4] += 1;
                                cell[2] = cell[3] / cell[4]; // cumulated intensity value
                            }
                            }
                            break;
                        case 'max': {
                            val = filteredData[i][valueField];
                            if (!cell) {
                                grid[y][x] = [p[0], p[1], val];
                            } else {
                                cell[0] = (cell[0] * cell[2] + p[0] * val) / (cell[2] + val); // x
                                cell[1] = (cell[1] * cell[2] + p[1] * val) / (cell[2] + val); // y
                                cell[2] = Math.max(val, cell[2]); // cumulated intensity value
                            }
                        }
                            break;
                        case 'min': {
                            val = filteredData[i][valueField];
                            if (!cell) {
                                grid[y][x] = [p[0], p[1], val];
                            } else {
                                cell[0] = (cell[0] * cell[2] + p[0] * val) / (cell[2] + val); // x
                                cell[1] = (cell[1] * cell[2] + p[1] * val) / (cell[2] + val); // y
                                cell[2] = Math.min(val, cell[2]); // cumulated intensity value
                            }
                        }
                            break;
                        default: {
                            if (!cell) {
                                grid[y][x] = [p[0], p[1], k];
                            } else {
                                cell[0] = (cell[0] * cell[2] + p[0] * k) / (cell[2] + k); // x
                                cell[1] = (cell[1] * cell[2] + p[1] * k) / (cell[2] + k); // y
                                cell[2] += k; // cumulated intensity value
                            }
                        }
                            break;
                    }
                } else {
                    if (!cell) {
                        grid[y][x] = [p[0], p[1], k];
                    } else {
                        cell[0] = (cell[0] * cell[2] + p[0] * k) / (cell[2] + k); // x
                        cell[1] = (cell[1] * cell[2] + p[1] * k) / (cell[2] + k); // y
                        cell[2] += k; // cumulated intensity value
                    }
                }
                if (grid[y][x][2] > maxK)
                    maxK = grid[y][x][2];
            }
            heatData = [];
            grid.forEach(function (d) {
                d.forEach(function (v) {
                    heatData.push([
                        Math.round(v[0]),
                        Math.round(v[1]),
                        v[2]
                    ]);
                });
            });

            heatData.sort(function (a, b) { return a[2] - b[2]; });
            createDensityCircles(maxK);
        }

        //create heat circles
        function createDensityCircles(maxK) {
            try {
                let ctx = overlayCanvas.getContext('2d');
                ctx.clearRect(0, 0, map.plot.width, map.plot.height);

                // draw a grayscale heatmap by putting a blurred circle at each data point
                for (let i = 0, len = heatData.length, p; i < len; i++) {
                    p = heatData[i];
                    ctx.globalAlpha = Math.max(p[2] / maxK, 0.05);
                    ctx.drawImage(circleCanvas, p[0] - (heatRadius + heatBlur), p[1] - (heatRadius + heatBlur));
                }

                // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
                let colored = ctx.getImageData(0, 0, map.plot.width, map.plot.height);
                colorize(colored.data, heatGradient);
                ctx.putImageData(colored, 0, 0);

                //raise render complete
                if (map.renderComplete) {
                    setTimeout(function () {
                        map.renderComplete();
                    }, 1000);
                }
            } catch (ex) { }

        }

        //create circle canvas
        function createCircleCanvas() {
            let ctx = circleCanvas.getContext('2d'),
                r2 = heatRadius + heatBlur;
            circleCanvas.width = circleCanvas.height = r2 * 2;
            ctx.shadowOffsetX = ctx.shadowOffsetY = r2 * 2;
            ctx.shadowBlur = heatBlur;
            ctx.shadowColor = 'black';

            ctx.beginPath();
            ctx.arc(-r2, -r2, heatRadius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }

        //create canvas gradient
        function createGradient() {
            let canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, 0, 256),
            gradientPercentage = 1 / (map.legend.gradientColors.length - 1);

            canvas.width = 1;
            canvas.height = 256;

            for (let i = 0; i < map.legend.gradientColors.length; i++) {
                if (i === map.legend.gradientColors.length - 1)
                    gradient.addColorStop(1, map.legend.gradientColors[i]);
                else
                    gradient.addColorStop(i * gradientPercentage, map.legend.gradientColors[i]);
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1, 256);

            heatGradient = ctx.getImageData(0, 0, 1, 256).data;
        }

        //set color for canvas
        function colorize(pixels, gradient) {
            for (let i = 0, len = pixels.length, j; i < len; i += 4) {
                j = pixels[i + 3] * 4; // get gradient color from opacity value

                if (j) {
                    pixels[i] = gradient[j];
                    pixels[i + 1] = gradient[j + 1];
                    pixels[i + 2] = gradient[j + 2];
                }
            }
        }

        if (map.currTransform == null)
            calculateZoom();
        createCircleCanvas();
        createGradient();
        createMap();

        //draws the map into a canvas
        map.toCanvas = function (id) {
            //declare needed variables
            let vectorDiv = document.getElementById(map.container + '_map'),
                legendSvg = document.getElementById(map.container + '_legend_svg'),
                svgElements = vectorDiv.getElementsByClassName('tile'),
                overlayS = document.getElementById(map.container + '_svgOverlay'),
                topPos = parseFloat(overlayCanvas.style.top),
                leftPos = parseFloat(overlayCanvas.style.left),
                tempTop,
                tempLeft,
                legendSvgTemp,
                xml,
                canvas = document.createElement('canvas'),
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
                    //draw overlay canvas to vector layer
                    ctx.drawImage(canvas, 0, 0);
                    canvas.svg.stop();
                }
            });
            //draw overlay canvas to vector layer
            vectorLayerCanvas.getContext('2d').drawImage(overlayCanvas, 0, 0);

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
            });
        };

        //returns the map image 
        map.toImage = function () {
            //declare needed variables
            let vectorDiv = document.getElementById(map.container + '_map'),
                legendSvg = document.getElementById(map.container + '_legend_svg'),
                svgElements = vectorDiv.getElementsByClassName('tile'),
                overlayS = document.getElementById(map.container + '_svgOverlay'),
                topPos = parseFloat(overlayCanvas.style.top),
                leftPos = parseFloat(overlayCanvas.style.left),
                tempTop,
                tempLeft,
                legendSvgTemp,
                xml,
                canvas = document.createElement('canvas'),
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
                    //draw overlay canvas to vector layer
                    ctx.drawImage(canvas, 0, 0);
                    canvas.svg.stop();
                }
            });
            //draw overlay canvas to vector layer
            vectorLayerCanvas.getContext('2d').drawImage(overlayCanvas, 0, 0);

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
                //convert the final clone to canvas
                html2canvas(document.getElementById(map.container)).then(function (canvas) {
                    //restore legend elements if exists
                    if (legendSvg) {
                        legendSvgTemp.parentNode.appendChild(legendSvg);
                        legendSvgTemp.parentNode.removeChild(legendSvgTemp);
                    }
                    //restore orgDiv elements
                    tempDiv.parentNode.insertBefore(vectorDiv, tempDiv);
                    tempDiv.parentNode.removeChild(tempDiv);
                    //return promise with image
                    resolve(canvas.toDataURL('image/png'));
                });
            });
        };

        //return standard map
        return map;
    }

    //attach standard map method into the eve
    e.densityMap = function (options) {
        options.type = 'densityMap';
        options.masterType = 'map';
        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new densityMap(options);
    };
})(eve);