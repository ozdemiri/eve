/*!
 * eve.ddcartogram.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for dorling/demers cartogram.
 */
(function (e) {
    //define dorling/demers cartogram class
    function ddCartogram(options) {
        //declare needed variables
        let that = this,
            map = e.initVis(options),
            serie = map.series[0],
            labelField = serie.labelField,
            valueField = serie.valueField,
            colorField = serie.colorField,
            parentField = serie.parentField,
            folderPath = e.mapDirectory + 'cartomaps/',
            mapType = 0,
            mapName = '',
            projection = null,
            labels = null,
            shapes = null,
            simulation = null,
            nodes = null,
            minRadius = 0,
            path = null,
            isUSA = false,
            rscale = null,
            currentFiltered = null,
            currentData = null,
            oldData = null,
            oldFillColor = null,
            labelType = '',
            parentType = '',
            tilePadding = 3,
            gradientRatio = 0,
            labelMeasures = [],
            links = [],
            fontSize = 0,
            minFontSize = 8,
            linkForce = d3.forceLink()
                .distance(function (d) {
                    return d.source.r + d.target.r + tilePadding;
                })
                .strength(0.6);

        map.simulations = [];

        //set map plot width and height
        map.plot.width = map.plot.width - map.plot.left - map.plot.right;
        map.plot.height = map.plot.height - map.plot.top - map.plot.bottom;

        //create map g
        let mapG = map.svg.append('g')
            .attr('transform', 'translate(' + map.plot.left + ',' + map.plot.top + ')');

        //sets initial map variables
        function setMapVariables() {
            let labelLengths = [],
                parentLengths = [],
                dataLength = 0,
                tempLength = 0;
            //trim map name
            mapName = serie.map.replace('%20', '').trim();

            //determine folder path and map type based on map name
            //0: Region, 1: Country, 2: Counties, 3: Zip
            if (mapName.length === 3) {
                folderPath = e.mapDirectory + 'cartomaps/countries/';
                mapType = 1;
            }
            else if (mapName.substring(0, 3) === "SC_") {
                folderPath = e.mapDirectory + 'cartomaps/SubCountries/';
                if (mapName.substring(0, 6) === "SC_Zip")
                    mapType = 3;
                else
                    mapType = 2;
            }

            //determine projection type
            isUSA = (mapName === "USA" || mapName === "SC_USACounties");

            dataLength = map.data.length > 10 ? 10 : map.data.length;
            let i = 0;
            while (labelLengths.length < dataLength) {
                if (isNaN(map.data[i][labelField]) || mapType === 3)
                    labelLengths.push(map.data[i][labelField].length);
                i++;
            }
            if (parentField) {
                i = 0;
                while (parentLengths.length < dataLength) {
                    if (isNaN(map.data[i][parentField]))
                        parentLengths.push(map.data[i][parentField].length);
                    i++;
                }
            }
            //determine label field type
            tempLength = d3.max(labelLengths);
            if (tempLength < 3)
                labelType = 'code2'
            else if (tempLength < 4)
                labelType = 'code3'
            else
                labelType = 'name'
            //determine parent field type if exists
            if (parentField !== '' && parentField !== null) {
                tempLength = d3.max(parentLengths);
                if (tempLength < 3)
                    parentType = 'code'
                else
                    parentType = 'name'
            }
        }

        //animates columns
        function animatePaths() {

            //animate and color shapes based on icon type
            switch (serie.tileIcon) {
                case 'circle':
                    {
                        shapes
                            .transition().duration(map.animation.duration)
                            .ease(map.animation.easing.toEasing())
                            .delay(function (d, i) { return i * map.animation.delay; })
                            .attr('fill', function (d) { return d.fillColor; })
                            .attr('fill-opacity', function (d) { return d.fillOpacity; })
                            .attr('stroke', function (d) { return d.fillColor; })
                            .attr('stroke-opacity', function (d) { return d.fillOpacity; })
                            .attr('r', function (d) { return d.r; });
                    }
                    break;
                case 'square':
                    {
                        shapes
                            .transition().duration(map.animation.duration)
                            .ease(map.animation.easing.toEasing())
                            .delay(function (d, i) { return i * map.animation.delay; })
                            .attr('fill', function (d) { return d.fillColor; })
                            .attr('fill-opacity', function (d) { return d.fillOpacity; })
                            .attr('stroke', function (d) { return d.fillColor; })
                            .attr('stroke-opacity', function (d) { return d.fillOpacity; })
                            .attr('width', function (d) { return d.r * 2; })
                            .attr('height', function (d) { return d.r * 2; });
                    }
                    break;
                default:
                    {
                        shapes
                            .transition().duration(map.animation.duration)
                            .ease(map.animation.easing.toEasing())
                            .delay(function (d, i) { return i * map.animation.delay; })
                            .attr('fill', function (d) { return d.fillColor; })
                            .attr('fill-opacity', function (d) { return d.fillOpacity; })
                            .attr('stroke', function (d) { return d.fillColor; })
                            .attr('stroke-opacity', function (d) { return d.fillOpacity; })
                            .attr('r', function (d) { return d.r; });
                    }
            }

            //check if labels are enabled
            //if (serie.labelsEnabled && serie.labelFormat !== '') {
            if (serie.labelFormat !== '') {
                //color labels
                labels
                    .transition().duration(map.animation.duration)
                    .ease(map.animation.easing.toEasing())
                    .delay(function (d, i) { return i * map.animation.delay; })
                    .style('fill', function (d) {
                        if (!d.fillColor)
                            return 'rgb(221, 221, 221)';
                        else
                            return map.series[0].labelFontColor === 'auto' ? map.getAutoColor(d.fillColor) : map.series[0].labelFontColor;
                    });
            }

            //raise render complete
            if (map.renderComplete) {
                setTimeout(function () {
                    map.renderComplete();
                }, 1000);
            }
        }

        //creates dorling/demers cartogram
        function createMap() {
            //declare needed variables
            let tooltipContent = '',
                labelFormat = '',
                labelValue = '',
                codeValue = '';

            //fill topology
            d3.json(folderPath + mapName + '.json', function (error, data) {
                //create topology data
                let topoData = topojson.feature(data, data.objects[mapName + '.geo']).features,
                    pointData = e.clone(data);
                if (serie.linkShapes) {
                    let nl = topojson.neighbors(data.objects[mapName + '.geo'].geometries);
                    nl.forEach(function (d, i) {
                        d.forEach(function (c) {
                            links.push({ target: c, source: i });
                        });
                    });
                }
                //point based data
                pointData.arcs = [];
                delete pointData.transform;
                topoData.forEach(function (c, i) {
                    pointData.objects[mapName + '.geo'].geometries[i] = {
                        type: 'Point',
                        id: c.id,
                        properties: c.properties,
                        coordinates: d3.geoCentroid(c)
                    };
                });
                //update topology data
                topoData = topojson.feature(pointData, pointData.objects[mapName + '.geo']).features;

                //create scaling object
                let objGeo = topojson.feature(pointData, {
                    type: "GeometryCollection",
                    geometries: pointData.objects[mapName + '.geo'].geometries
                });

                minRadius = map.domains.minY === map.domains.maxY ? serie.maxBulletSize : serie.minBulletSize;
                //calculate initial radius scale
                rscale = d3.scalePow().exponent(0.5).domain([map.domains.minY, map.domains.maxY]).range([minRadius, serie.maxBulletSize]);

                //initialize projection based on map name
                if (isUSA) {
                    projection = d3.geoAlbersUsa();
                    //set scale and translate of the projection
                    projection.fitExtent([[serie.maxBulletSize, serie.maxBulletSize], [map.plot.width - serie.maxBulletSize, map.plot.height - serie.maxBulletSize]], objGeo);
                    projection.translate([map.plot.width / 2, map.plot.height / 2]);
                } else {
                    projection = d3.geoEquirectangular();
                    //set scale and translate of the projection
                    projection.fitExtent([[serie.maxBulletSize, serie.maxBulletSize], [map.plot.width - serie.maxBulletSize, map.plot.height - serie.maxBulletSize]], objGeo);
                }

                //create scaled data
                let cartoData = [];
                topoData.forEach(function (d) {
                    cartoData.push({
                        coordinates: projection(d.geometry.coordinates),
                        properties: d.properties
                    });
                });

                //create force nodes
                nodes = cartoData.map(function (d) {
                    return {
                        coordinates: d.coordinates,
                        x: d.coordinates[0],
                        y: d.coordinates[1],
                        properties: d.properties
                    };
                });

                //assing map data to matching nodes
                nodes.forEach(function (d) {
                    //set default node values
                    d.currentData = null;
                    d.fillColor = 'rgb(221,221,221)';
                    d.fillOpacity = 0.9;
                    if (serie.hideEmptyShapes)
                        d.r = 0;
                    else
                        d.r = serie.minBulletSize;

                    //get data for current shape based on label type
                    if (labelType === 'code2') {
                        switch (mapType) {
                            case 0:
                                {
                                    currentFiltered = e.filterSingle(map.data, { key: labelField, values: d.properties.iso_a2 });
                                }
                                break;
                            case 1:
                                {
                                    if (d.properties.postal)
                                        currentFiltered = e.filterSingle(map.data, { key: labelField, values: d.properties.postal });
                                }
                                break;
                            default:
                                {
                                    currentFiltered = null;
                                }
                        }
                    }
                    else if (labelType === 'code3') {
                        switch (mapType) {
                            case 0:
                                {
                                    currentFiltered = e.filterSingle(map.data, { key: labelField, values: d.properties.iso_a3 });
                                }
                                break;
                            default:
                                {
                                    currentFiltered = null;
                                }
                        }
                    }
                    else {
                        let names = [], altNames;
                        if (d.properties.name_alt) {
                            names.push(d.properties.name);
                            altNames = d.properties.name_alt.split('|');
                            altNames.forEach(function (n) {
                                names.push(n);
                            });
                        } else {
                            names = d.properties.name;
                        }
                        switch (mapType) {
                            case 2:
                                {
                                    if (mapName === 'SC_USACounties')
                                        currentFiltered = e.filterSingle(map.data, [{ key: labelField, values: names }, { key: parentField, values: (parentType === 'code' ? d.properties.parent : d.properties.parentName) }]);
                                    else
                                        currentFiltered = e.filterSingle(map.data, { key: labelField, values: names, replaceChar: true });
                                }
                                break;
                            case 3:
                                {
                                    currentFiltered = e.filterSingle(map.data, { key: labelField, values: names }, true);
                                }
                                break;
                            default:
                                {
                                    currentFiltered = e.filterSingle(map.data, { key: labelField, values: names, replaceChar: true });
                                }
                        }
                    }
                    //check if data exists for current shape
                    if (currentFiltered) {
                        //check whether the value exists
                        if (currentFiltered[valueField] != 0 && currentFiltered[valueField] != null) { //do not convert to !== , it gives a different result
                            if (map.legend.type !== 'default')
                                currentFiltered[valueField] = parseFloat(currentFiltered[valueField]);
                            //set opacity,radius and data
                            d.currentData = currentFiltered;
                            d.fillOpacity = 1;
                            d.r = rscale(currentFiltered[valueField]);

                            if (colorField === '') {
                                d.fillColor = map.legend.gradientColors[0];
                            } else {
                                //check whether the value exists
                                if (currentFiltered[colorField] != 0) { //do not convert to !== , it gives a different result
                                    if (map.legend.secondaryType !== 'default')
                                        currentFiltered[colorField] = parseFloat(currentFiltered[colorField]);

                                    //set fill color
                                    switch (map.legend.secondaryType) {
                                        case 'default':
                                            {
                                                d.fillColor = e.matchGroup(currentFiltered[colorField], map.legend.legendColors, 'color') || 'rgb(221,221,221)';
                                            }
                                            break;
                                        case 'ranged':
                                            {
                                                let rangeObj = e.matchRange(currentFiltered[colorField], map.legend.rangeList, 'color');
                                                if (rangeObj) {
                                                    d.fillColor = rangeObj.color;
                                                    d.legendClass = 'ranged-' + rangeObj.index;
                                                } else {
                                                    d.fillColor = 'rgb(221,221,221)';
                                                }
                                            }
                                            break;
                                        default:
                                            {
                                                //check whether data has more than one value
                                                if (map.domains.minColor !== map.domains.maxColor)
                                                    //calculate ratio
                                                    gradientRatio = currentFiltered[colorField] / (map.domains.maxColor - map.domains.minColor) * 100 - (map.domains.minColor / (map.domains.maxColor - map.domains.minColor) * 100);
                                                else
                                                    gradientRatio = 1;
                                                d.fillColor = e.gradient(map.legend.gradientColors, gradientRatio);
                                            }
                                    }
                                }
                            }
                        }
                    }
                });

                //create shapes based on icon type
                switch (serie.tileIcon) {
                    case 'circle':
                        {
                            //create shapes
                            shapes = mapG.append('g')
                                .selectAll('.circle')
                                .data(nodes)
                                .enter().append('circle');
                        }
                        break;
                    case 'square':
                        {
                            //create shapes
                            shapes = mapG.append('g')
                                .selectAll('.rect')
                                .data(nodes)
                                .enter().append('rect');
                        }
                        break;
                    default:
                        {
                            //create shapes
                            shapes = mapG.append('g')
                                .selectAll('.circle')
                                .data(nodes)
                                .enter().append('circle');
                        }
                }

                //create shapes
                shapes
                    .style('stroke-width', '0px')
                    .on('mousemove', function (d) {
                        //check whether tooltip enabled
                        if (map.tooltip.format !== '') {
                            //set default tooltip content
                            tooltipContent = "no data available";
                            //check whether current data exists
                            if (d.currentData) {
                                //get values from shape
                                codeValue = mapName.length === 3 ? d.properties.postal : d.properties.iso_a2;
                                labelValue = d.properties.name;

                                //check whether the current data has iso_a3
                                if (d.properties.iso_a3 !== null) {
                                    //check if iso_a3 = STP
                                    if (d.properties.iso_a3 === 'STP')
                                        labelValue = 'Sao Tome and Principe';
                                    else if (d.properties.iso_a3 === 'CIV')
                                        labelValue = 'Cote dIvoire';
                                    else if (d.properties.iso_a3 === 'BLM')
                                        labelValue = 'St-Barthelemy';
                                    else if (d.properties.iso_a3 === 'CUW')
                                        labelValue = 'Curacao';
                                }
                                //set tooltip content
                                tooltipContent = map.tooltip.format.replaceAll('{code}', codeValue).replaceAll('{label}', labelValue);
                                // check if color field exists
                                if (colorField === '')
                                    tooltipContent = tooltipContent.replaceAll('{color}', '');

                                //assign format
                                tooltipContent = map.getContent(d.currentData, map.series[0], tooltipContent);
                            }
                            //show tooltip
                            map.showTooltip(tooltipContent);
                        }
                    })
                    .on('mouseout', function (d) {
                        //hide tooltip
                        map.hideTooltip();
                    })
                    .call(d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended));

                //create simulation
                simulation = d3.forceSimulation(nodes)
                    .alphaMin(0.04)
                    .alphaDecay(0.05)
                    .force('link', linkForce)
                    .force('collision', collide)
                    .force("x", d3.forceX(function (d) { return d.x; }))
                    .force("y", d3.forceY(function (d) { return d.y; }))
                    .on("tick", ticked);
                map.simulations.push(simulation);
                //start simulation
                if (serie.linkShapes)
                    simulation.force('link').links(links);

                simulation.nodes(nodes);

                //check if labels are enabled
                //if (serie.labelsEnabled && serie.labelFormat !== '') {
                if (serie.labelFormat !== '') {
                    //create labels
                    labels = mapG.append('g').selectAll('text')
                        .data(nodes)
                        .enter().append('text')
                        .style("text-anchor", "middle")
                        .style('font-size', '24px')
                        .style('font-family', serie.labelFontFamily)
                        .style('font-style', serie.labelFontStyle === 'bold' ? 'normal' : serie.labelFontStyle)
                        .style('font-weight', serie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                        .text(function (d) {
                            if (serie.hideEmptyShapes && !d.currentData)
                                return '';

                            //get label format
                            labelFormat = map.series[0].labelFormat;
                            labelValue = d.properties.name;
                            codeValue = mapName.length === 3 ? d.properties.postal : d.properties.iso_a2;

                            //check whether the current data has iso_a3
                            if (d.properties.iso_a3 !== null) {
                                //check if iso_a3 = STP
                                if (d.properties.iso_a3 === 'STP')
                                    labelValue = 'Sao Tome and Principe';
                                else if (d.properties.iso_a3 === 'CIV')
                                    labelValue = 'Cote dIvoire';
                                else if (d.properties.iso_a3 === 'BLM')
                                    labelValue = 'St-Barthelemy';
                                else if (d.properties.iso_a3 === 'CUW')
                                    labelValue = 'Curacao';
                            }

                            // check if data for the shape exists
                            if (d.currentData) {
                                //assign format
                                labelFormat = labelFormat.replaceAll('{code}', codeValue).replaceAll('{label}', labelValue);
                                // check if color field exists
                                if (colorField === '')
                                    labelFormat = labelFormat.replaceAll('{color}', '');
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
                        .style('font-size', function (d) {
                            //check whether the label font size is auto
                            if (serie.labelFontSize === 'auto') {
                                fontSize = ((2 * d.r - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * 24);
                                if (fontSize < 8)
                                    d3.select(this).text('');
                            } else {
                                fontSize = serie.labelFontSize;
                            }
                            //if not out then set defined one
                            return fontSize + 'px';
                        })
                        .style('fill', 'none')
                        .attr("dy", "0.35em")
                        .on('mousemove', function (d) {
                            //check whether tooltip enabled
                            if (map.tooltip.format !== '') {
                                //set default tooltip content
                                tooltipContent = "no data available";
                                //check whether current data exists
                                if (d.currentData) {
                                    //get values from shape
                                    codeValue = mapName.length === 3 ? d.properties.postal : d.properties.iso_a2;
                                    labelValue = d.properties.name;

                                    //check whether the current data has iso_a3
                                    if (d.properties.iso_a3 !== null) {
                                        //check if iso_a3 = STP
                                        if (d.properties.iso_a3 === 'STP')
                                            labelValue = 'Sao Tome and Principe';
                                        else if (d.properties.iso_a3 === 'CIV')
                                            labelValue = 'Cote dIvoire';
                                        else if (d.properties.iso_a3 === 'BLM')
                                            labelValue = 'St-Barthelemy';
                                        else if (d.properties.iso_a3 === 'CUW')
                                            labelValue = 'Curacao';
                                    }
                                    //set tooltip content
                                    tooltipContent = map.tooltip.format.replaceAll('{code}', codeValue).replaceAll('{label}', labelValue);
                                    // check if color field exists
                                    if (colorField === '')
                                        tooltipContent = tooltipContent.replaceAll('{color}', '');

                                    //assign format
                                    tooltipContent = map.getContent(d.currentData, map.series[0], tooltipContent);
                                }
                                //show tooltip
                                map.showTooltip(tooltipContent);
                            }
                        })
                        .on('mouseout', function (d) {
                            //hide tooltip
                            map.hideTooltip();
                        })
                        .call(d3.drag()
                            .on("start", dragstarted)
                            .on("drag", dragged)
                            .on("end", dragended));
                }

                //raise on loaded
                if (map.onLoaded) map.onLoaded();

                //animate paths
                animatePaths();
            });

            //attach clear content method to chart
            map.clear = function () {
                //clear current data from all paths
                nodes.forEach(function (d) {
                    d.currentData = null;
                });
            };

            //set update method to chart
            map.update = function (data, keepAxis) {
                //set chart data
                map.data = data;

                //update xy domain
                map.calculateDomain();

                //update legend
                map.updateLegend();

                //set minimum radius
                minRadius = map.domains.minY === map.domains.maxY ? serie.maxBulletSize : serie.minBulletSize;

                //update radius scale
                rscale = d3.scalePow().exponent(0.5).domain([map.domains.minY, map.domains.maxY]).range([minRadius, serie.maxBulletSize]);

                //assing map data to matching nodes
                nodes.forEach(function (d) {
                    //re-set starting coordinates
                    d.x = d.coordinates[0];
                    d.y = d.coordinates[1];
                    d.vx = 0;
                    d.vy = 0;
                    if (d.currentData) {
                        oldFillColor = d.fillColor;
                        oldData = d.currentData;
                    } else {
                        oldFillColor = '';
                        oldData = null;
                    }
                    //set default node values
                    d.currentData = null;
                    if (serie.hideEmptyShapes)
                        d.r = 0;
                    else
                        d.r = serie.minBulletSize;

                    //get data for current shape based on label type
                    if (labelType === 'code2') {
                        switch (mapType) {
                            case 0:
                                {
                                    currentFiltered = e.filterSingle(map.data, { key: labelField, values: d.properties.iso_a2 });
                                }
                                break;
                            case 1:
                                {
                                    if (d.properties.postal)
                                        currentFiltered = e.filterSingle(map.data, { key: labelField, values: d.properties.postal });
                                }
                                break;
                            default:
                                {
                                    currentFiltered = null;
                                }
                        }
                    }
                    else if (labelType === 'code3') {
                        switch (mapType) {
                            case 0:
                                {
                                    currentFiltered = e.filterSingle(map.data, { key: labelField, values: d.properties.iso_a3 });
                                }
                                break;
                            default:
                                {
                                    currentFiltered = null;
                                }
                        }
                    }
                    else {
                        let names = [], altNames;
                        if (d.properties.name_alt) {
                            names.push(d.properties.name);
                            altNames = d.properties.name_alt.split('|');
                            altNames.forEach(function (n) {
                                names.push(n);
                            });
                        } else {
                            names = d.properties.name;
                        }
                        switch (mapType) {
                            case 2:
                                {
                                    if (mapToRender === 'SC_USACounties')
                                        currentFiltered = e.filterSingle(map.data, [{ key: labelField, values: names }, { key: parentField, values: (parentType === 'code' ? d.properties.parent : d.properties.parentName) }]);
                                    else
                                        currentFiltered = e.filterSingle(map.data, { key: labelField, values: names, replaceChar: true });
                                }
                                break;
                            case 3:
                                {
                                    currentFiltered = e.filterSingle(map.data, { key: labelField, values: names }, true);
                                }
                                break;
                            default:
                                {
                                    currentFiltered = e.filterSingle(map.data, { key: labelField, values: names, replaceChar: true });
                                }
                        }
                    }
                    //check if data exists for current shape
                    if (currentFiltered) {
                        //check whether the value exists
                        if (currentFiltered[valueField] != 0 && currentFiltered[valueField] != null) { //do not convert to !== , it gives a different result
                            if (map.legend.type !== 'default')
                                currentFiltered[valueField] = parseFloat(currentFiltered[valueField]);
                            //set opacity,radius and data
                            d.currentData = currentFiltered;
                            d.fillOpacity = 1;
                            d.r = rscale(currentFiltered[valueField]);

                            if (colorField === '') {
                                d.fillColor = map.legend.gradientColors[0];
                            } else {
                                //check whether the value exists
                                if (currentFiltered[colorField] != 0) { //do not convert to !== , it gives a different result
                                    if (map.legend.secondaryType !== 'default')
                                        currentFiltered[colorField] = parseFloat(currentFiltered[colorField]);

                                    //set fill color
                                    switch (map.legend.secondaryType) {
                                        case 'default':
                                            {
                                                d.fillColor = e.matchGroup(currentFiltered[colorField], map.legend.legendColors, 'color') || 'rgb(221,221,221)';
                                            }
                                            break;
                                        case 'ranged':
                                            {
                                                let rangeObj = e.matchRange(currentFiltered[colorField], map.legend.rangeList, 'color');
                                                if (rangeObj) {
                                                    d.fillColor = rangeObj.color;
                                                    d.legendClass = 'ranged-' + rangeObj.index;
                                                } else {
                                                    d.fillColor = 'rgb(221,221,221)';
                                                }
                                            }
                                            break;
                                        default:
                                            {
                                                //check whether data has more than one value
                                                if (map.domains.minColor !== map.domains.maxColor)
                                                    //calculate ratio
                                                    gradientRatio = currentFiltered[colorField] / (map.domains.maxColor - map.domains.minColor) * 100 - (map.domains.minColor / (map.domains.maxColor - map.domains.minColor) * 100);
                                                else
                                                    gradientRatio = 1;
                                                d.fillColor = e.gradient(map.legend.gradientColors, gradientRatio);
                                            }
                                    }
                                }
                            }
                        }
                    }

                    //set empty shape settings
                    if (!d.currentData) {
                        if (map.animation.effect) {
                            //check whether the effect is fade
                            if (map.animation.effect === 'fade') {
                                d.fillColor = 'rgb(221,221,221)';
                                d.fillOpacity = 0.9;
                            } else if (map.animation.effect === 'dim') {
                                if (oldData) {
                                    d.fillColor = oldFillColor;
                                    d.fillOpacity = 0.3;
                                    d.currentData = oldData;
                                    d.r = rscale(oldData[valueField]);
                                } else {
                                    d.fillColor = 'rgb(221,221,221)';
                                    d.fillOpacity = 0.9;
                                }
                            } else if (map.animation.effect === 'add') {
                                if (oldData) {
                                    d.fillColor = oldFillColor;
                                    d.fillOpacity = 1;
                                    d.currentData = oldData;
                                    d.r = rscale(oldData[valueField]);
                                } else {
                                    d.fillColor = 'rgb(221,221,221)';
                                    d.fillOpacity = 0.9;
                                }
                            } else {
                                d.fillColor = 'rgb(221,221,221)';
                                d.fillOpacity = 0.9;
                            }
                        }
                    }
                });

                //update shape data
                shapes
                    .data(nodes);

                //restart the simulation
                simulation.alpha(1).restart();

                //check if labels are enabled
                //if (serie.labelsEnabled && serie.labelFormat !== '') {
                if (serie.labelFormat !== '') {
                    //create labels
                    labels
                        .data(nodes)
                        .style('font-size', '24px')
                        .text(function (d) {
                            if (serie.hideEmptyShapes && !d.currentData)
                                return '';

                            //get label format
                            labelFormat = map.series[0].labelFormat;
                            labelValue = d.properties.name;
                            codeValue = mapName.length === 3 ? d.properties.postal : d.properties.iso_a2;

                            //check whether the current data has iso_a3
                            if (d.properties.iso_a3 !== null) {
                                //check if iso_a3 = STP
                                if (d.properties.iso_a3 === 'STP')
                                    labelValue = 'Sao Tome and Principe';
                                else if (d.properties.iso_a3 === 'CIV')
                                    labelValue = 'Cote dIvoire';
                                else if (d.properties.iso_a3 === 'BLM')
                                    labelValue = 'St-Barthelemy';
                                else if (d.properties.iso_a3 === 'CUW')
                                    labelValue = 'Curacao';
                            }
                            // check if data for the shape exists
                            if (d.currentData) {
                                //assign format
                                labelFormat = labelFormat.replaceAll('{code}', codeValue).replaceAll('{label}', labelValue);
                                // check if color field exists
                                if (colorField === '')
                                    labelFormat = labelFormat.replaceAll('{color}', '');
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
                        .style('font-size', function (d) {
                            //check whether the label font size is auto
                            if (serie.labelFontSize === 'auto') {
                                fontSize = ((2 * d.r - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * 24);
                                if (fontSize < minFontSize)
                                    d3.select(this).text('');
                            } else {
                                fontSize = serie.labelFontSize;
                            }
                            //if not out then set defined one
                            return fontSize + 'px';
                        })
                        .style('fill', 'none')
                        .attr("dy", "0.35em");
                }

                //animate paths
                animatePaths();
            };

            //handles legend click
            map.legendClick = function (d, i) {
                if (map.legend.secondaryType === 'ranged') {
                    if (d.clicked) {
                        shapes.attr('fill-opacity', function (d) {
                            if (d.legendClass === 'ranged-' + i)
                                return 0.1;
                            else
                                return d.fillOpacity;
                        });
                    } else {
                        shapes.attr('fill-opacity', function (d) {
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
                if (map.legend.secondaryType === 'ranged') {
                    if (status) {
                        shapes.attr('fill-opacity', function (d) {
                            if (d.legendClass !== 'ranged-' + i)
                                return 0.1;
                            else
                                return d.fillOpacity;
                        });
                    } else {
                        shapes.attr('fill-opacity', function (d) {
                            return d.fillOpacity;
                        });
                    }
                }
            };
        }

        //handle simulation ticked event
        function ticked() {
            //update shapes based on icon type
            switch (serie.tileIcon) {
                case 'circle':
                    {
                        shapes
                            .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
                    }
                    break;
                case 'square':
                    {
                        shapes
                            .attr('transform', function (d) { return 'translate(' + (d.x - d.r) + ',' + (d.y - d.r) + ')'; });
                    }
                    break;
                default:
                    {
                        shapes
                            .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
                    }
            }

            //check whether the labls are enabled and update labels
            //if (serie.labelsEnabled && serie.labelFormat !== '' && labels !== null) {
            if (serie.labelFormat !== '' && labels !== null) {
                labels.attr("transform", function (d) {
                    //return translation
                    return 'translate(' + d.x + ', ' + d.y + ')';
                });
            }
        }

        //handles drag start event
        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        //handles dragged event
        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        //handles drag ended event
        function dragended(d) {
            //set fixed drag as true
            d.fixed = true;

            //set fixed class
            d3.select(this).classed("fixed", true);
        }

        //handles collision
        function collide(alpha) {
            let quadtree = d3.quadtree()
                .x(function (d) { return d.x; })
                .y(function (d) { return d.y; })
                .addAll(nodes);

            nodes.forEach(function (d) {
                let r = d.r + serie.maxBulletSize + tilePadding,
                    nx1 = d.x - r,
                    nx2 = d.x + r,
                    ny1 = d.y - r,
                    ny2 = d.y + r;
                quadtree.visit(function (quad, x1, y1, x2, y2) {
                    if (quad.data && (quad.data !== d)) {
                        if (d.index > quad.data.index) { return }
                        if (serie.tileIcon === 'square') {
                            let x = d.x + d.vx - quad.data.x - quad.data.vx,
                                y = d.y + d.vy - quad.data.y - quad.data.vy,
                                lx = Math.abs(x),
                                ly = Math.abs(y),
                                r = d.r + quad.data.r + tilePadding;
                            if (lx < r && ly < r) {
                                if (lx > ly) {
                                    lx = (lx - r) * (x < 0 ? -0.5 : 0.5);
                                    d.vx -= lx;
                                    quad.data.vx += lx;
                                } else {
                                    ly = (ly - r) * (y < 0 ? -0.5 : 0.5);
                                    d.vy -= ly;
                                    quad.data.vy += ly;
                                }
                            }
                        }
                        else {
                            let x = d.x - quad.data.x,
                                y = d.y - quad.data.y,
                                l = Math.sqrt(x * x + y * y),
                                r = d.r + quad.data.r + tilePadding;
                            if (l < r) {
                                l = (l - r) / l * 0.5;
                                d.x -= x *= l;
                                d.y -= y *= l;
                                quad.data.x += x;
                                quad.data.y += y;
                            }
                        }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            });
        }

        setMapVariables();

        createMap();

        //return dorling cartogram
        return map;
    }

    //attach dorling cartogram method into the eve
    e.ddCartogram = function (options) {
        options.type = 'ddCartogram';
        options.masterType = 'map';
        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new ddCartogram(options);
    };
})(eve);