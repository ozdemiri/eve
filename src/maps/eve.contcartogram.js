/*!
 * eve.contcartogram.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for continuous cartogram.
 */
(function (e) {
    //define continuous cartogram class
    function contCartogram(options) {
        //declare needed variables
        let that = this,
            map = e.initVis(options),
            serie = map.series[0],
            labelField = serie.labelField,
            valueField = serie.valueField,
            colorField = serie.colorField,
            parentField = serie.parentField,
            folderPath = e.mapDirectory + 'cartomaps/',
            cartoData = null,
            cartoGeo = null,
            mapType = 0,
            mapName = '',
            projection = null,
            carto = null,
            labels = null,
            zoom = null,
            paths = null,
            path = null,
            minVal = 0,
            maxVal = 0,
            fillColor = '',
            oldFillColor = '',
            oldData = null,
            currentFiltered = null,
            currentData = null,
            labelType = '',
            parentType = '',
            labelwoutMeasure = [],
            fillOpacity = 0,
            gradientRatio = 0,
            coloringBase = '';

        //set map plot width and height
        map.plot.width = map.plot.width - map.plot.left - map.plot.right;
        map.plot.height = map.plot.height - map.plot.top - map.plot.bottom;

        //create chart g
        let mapG = map.svg.append('g')
            .attr('transform', 'translate(' + map.plot.left + ',' + map.plot.top + ')');

        //create foreign object for map paths
        let pathG = mapG
            .append('svg')
            .attr('width', map.plot.width - map.plot.left)
            .attr('height', map.plot.height)
            .attr('transform', 'translate(0,0)');

        //sets initial map variables
        function setMapVariables() {
            let labelLengths = [],
                parentLengths = [],
                dataLength = 0,
                tempLength = 0;

            //trim map name
            mapName = map.series[0].map.replace('%20', '').trim();

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

            //initialize projection based on map name
            if (mapName === "USA" || mapName === "SC_USACounties")
                projection = d3.geoAlbersUsa();
            else
                projection = d3.geoEquirectangular();

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

            if (colorField === '') {
                minVal = map.domains.minY;
                maxVal = map.domains.maxY;
                coloringBase = valueField;
            } else {
                minVal = map.domains.minColor;
                maxVal = map.domains.maxColor;
                coloringBase = colorField;
            }
            //create scaling for cartogram distortion
            let scale = d3.scaleLinear().domain([map.domains.minY, map.domains.maxY]).range([(map.domains.minY === map.domains.maxY ? 500 : 1), 500]);

            // tell the cartogram to use the scaled values
            carto.value(function (d) {
                if (d.currentData) {
                    oldFillColor = d3.select(this).attr('fill');
                    oldData = d.currentData;
                } else {
                    oldFillColor = '';
                    oldData = null;
                }
                //reset data
                d.currentData = null;
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
                        //set fill color
                        switch (map.legend.type) {
                            case 'default':
                                {
                                    fillColor = e.matchGroup(currentFiltered[coloringBase], map.legend.legendColors, 'color') || 'rgb(221,221,221)';
                                }
                                break;
                            case 'ranged':
                                {
                                    let rangeObj = e.matchRange(currentFiltered[coloringBase], map.legend.rangeList, 'color');
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
                                        gradientRatio = currentFiltered[coloringBase] / (maxVal - minVal) * 100 - (minVal / (maxVal - minVal) * 100);
                                    else
                                        gradientRatio = 1;
                                    fillColor = e.gradient(map.legend.gradientColors, gradientRatio);
                                }
                        }
                        //set opacity and data
                        fillOpacity = 1;
                        d.currentData = currentFiltered;
                    }
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
                if (!d.currentData)
                    return 1;
                else
                    return scale(d.currentData[valueField]);
            });

            //generate the new features, pre-projected
            let topoData = carto(cartoData, cartoGeo).features,
                    usaShape,
                    minX;

            if (mapName === 'world' || mapName === 'worldwoantarctica') {
                usaShape = e.filterSingle(topoData, { key: 'id', values: 'USA' });
                minX = Number.MAX_SAFE_INTEGER;
                for (let i = 0; i < usaShape.geometry.coordinates.length; i++) {
                    for (let j = 0; j < usaShape.geometry.coordinates[i][0].length; j++) {
                        if (usaShape.geometry.coordinates[i][0][j][0] < minX)
                            minX = usaShape.geometry.coordinates[i][0][j][0];
                    }
                }
                for (let k = 0; k < topoData.length; k++) {
                    if (topoData[k].id == 'RUS') {
                        for (let i = 0; i < topoData[k].geometry.coordinates.length; i++) {
                            for (let j = 0; j < topoData[k].geometry.coordinates[i][0].length; j++) {
                                if (topoData[k].geometry.coordinates[i][0][j][0] < minX) {
                                    topoData[k].geometry.coordinates[i][0][j][0] = map.plot.width;
                                }
                            }
                        }
                    }
                }
            }

            paths
                .data(topoData)
                .transition().duration(map.animation.duration)
                .ease(map.animation.easing.toEasing())
                .delay(function (d, i) { return i * map.animation.delay / Math.max(1, Math.sqrt(i / 8)); })
                .attr('fill-opacity', function (d) { return d.fillOpacity; })
                .attr('fill', function (d) { return d.fillColor; })
                .attr("d", carto.path);

            //check whether the labls are enabled and update labels
            //if (map.series[0].labelsEnabled && map.series[0].labelFormat !== '' && labels !== null) {
            if (map.series[0].labelFormat !== '' && labels !== null) {
                labels
                    .data(topoData)
                    .text(function (d) {
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
                    .style('fill', function (d) { return map.series[0].labelFontColor === 'auto' ? map.getAutoColor(d.fillColor) : map.series[0].labelFontColor; })
                    .style('font-size', map.series[0].labelFontSize + 'px')
                    .attr('transform', function (d) { return 'translate(' + carto.path.centroid(d) + ')'; });
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
                cartoData = data;
                cartoGeo = data.objects[mapName + '.geo'].geometries;
                //create object for scaling and translating
                let objGeo = topojson.feature(data, {
                    type: "GeometryCollection",
                    geometries: data.objects[mapName + '.geo'].geometries
                });

                //set scale and translate of the projection
                projection.fitExtent([[0, 0], [map.plot.width, map.plot.height]], objGeo);

                //create path
                path = d3.geoPath().projection(projection);

                //create distorted cartogram    
                carto = d3.cartogram()
                    .projection(projection)
                    .properties(function (d) {
                        return d.properties;
                    })
                    .value(function (d) {
                        return 1;
                    });

                //create topology data
                let topoData = carto.features(cartoData, cartoGeo);

                //build paths
                paths = pathG.append('g').selectAll('path')
                    .data(topoData)
                    .enter().append('path')
                    .attr('d', path)
                    .attr('stroke', 'rgb(255,255,255)')
                    .attr('stroke-width', 0.5)
                    .attr('fill', '#fafafa')
                    .attr('width', map.plot.width)
                    .attr('height', map.plot.width / 2)
                    .on('mousemove', function (d, i) {
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
                    labels = pathG.append('g').selectAll('text')
                        .data(topoData)
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

                //animate paths
                animatePaths();
            });

            //attach clear content method to map
            map.clear = function () {
                //clear current data from all paths
                paths.each(function (d) {
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

                //animate paths
                animatePaths();
            };

            //handles legend click
            map.legendClick = function (d, i) {
                if (map.legend.type === 'ranged') {
                    if (d.clicked) {
                        paths.attr('fill-opacity', function (d) {
                            if (d.legendClass === 'ranged-' + i)
                                return 0.1;
                            else
                                return d.fillOpacity;
                        });
                    } else {
                        paths.attr('fill-opacity', function (d) {
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
                        paths.attr('fill-opacity', function (d) {
                            if (d.legendClass !== 'ranged-' + i)
                                return 0.1;
                            else
                                return d.fillOpacity;
                        });
                    } else {
                        paths.attr('fill-opacity', function (d) { return d.fillOpacity; });
                    }
                }
            };
        }

        setMapVariables();

        createMap();

        //return continuous cartogram
        return map;
    }

    //attach continuous cartogram method into the eve
    e.contCartogram = function (options) {
        options.type = 'contCartogram';
        options.masterType = 'map';

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new contCartogram(options);
    };
})(eve);