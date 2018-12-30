/*!
 * eve.standardmap.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for standard map.
 */
(function (e) {
    //define standard map
    function standardMap(options) {
		//declare needed variables
		let that = this;
		let map = e.initVis(options);
		let labelField = map.series[0].labelField;
		let valueField = map.series[0].valueField;
		let parentField = map.series[0].parentField;
		let folderPath = e.mapDirectory + 'stdmaps/';
		let mapType = 0;
		let mapName = '';
        let projection = null;
        let labels = null;
        let labelData = null;
        let zoom = null;
        let paths = null;
        let path = null;
        let minVal = map.domains.minY;
        let maxVal = map.domains.maxY;
        let fillColor = '';
        let oldFillColor = '';
        let oldData = null;
        let currentFiltered = null;
        let uniqueParents = [];
        let mapToRender = '';
        let stateList = [
            { "name": "Alabama", "code": "AL" },
            { "name": "Alaska", "code": "AK" },
            { "name": "Arizona", "code": "AZ" },
            { "name": "Arkansas", "code": "AR" },
            { "name": "California", "code": "CA" },
            { "name": "Colorado", "code": "CO" },
            { "name": "Connecticut", "code": "CT" },
            { "name": "Delaware", "code": "DE" },
            { "name": "District of Columbia", "code": "DC" },
            { "name": "Florida", "code": "FL" },
            { "name": "Georgia", "code": "GA" },
            { "name": "Hawaii", "code": "HI" },
            { "name": "Idaho", "code": "ID" },
            { "name": "Illinois", "code": "IL" },
            { "name": "Indiana", "code": "IN" },
            { "name": "Iowa", "code": "IA" },
            { "name": "Kansa", "code": "KS" },
            { "name": "Kentucky", "code": "KY" },
            { "name": "Lousiana", "code": "LA" },
            { "name": "Maine", "code": "ME" },
            { "name": "Maryland", "code": "MD" },
            { "name": "Massachusetts", "code": "MA" },
            { "name": "Michigan", "code": "MI" },
            { "name": "Minnesota", "code": "MN" },
            { "name": "Mississippi", "code": "MS" },
            { "name": "Missouri", "code": "MO" },
            { "name": "Montana", "code": "MT" },
            { "name": "Nebraska", "code": "NE" },
            { "name": "Nevada", "code": "NV" },
            { "name": "New Hampshire", "code": "NH" },
            { "name": "New Jersey", "code": "NJ" },
            { "name": "New Mexico", "code": "NM" },
            { "name": "New York", "code": "NY" },
            { "name": "North Carolina", "code": "NC" },
            { "name": "North Dakota", "code": "ND" },
            { "name": "Ohio", "code": "OH" },
            { "name": "Oklahoma", "code": "OK" },
            { "name": "Oregon", "code": "OR" },
            { "name": "Pennsylvania", "code": "PA" },
            { "name": "Rhode Island", "code": "RI" },
            { "name": "South Carolina", "code": "SC" },
            { "name": "South Dakota", "code": "SD" },
            { "name": "Tennessee", "code": "TN" },
            { "name": "Texas", "code": "TX" },
            { "name": "Utah", "code": "UT" },
            { "name": "Vermont", "code": "VT" },
            { "name": "Virginia", "code": "VA" },
            { "name": "Washington", "code": "WA" },
            { "name": "West Virginia", "code": "WV" },
            { "name": "Wisconsin", "code": "WI" },
            { "name": "Wyoming", "code": "WY" }
        ];
        let renderedMap = '';
        let labelType = '';
        let parentType = '';
        let labelwoutMeasure = [];
        let fillOpacity = 0;
        let gradientRatio = 0;

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

            if (mapName.length === 3) {
                mapType = 1;
            } else if (mapName.substring(0, 3) === "SC_") {
                if (mapName.substring(0, 6) === "SC_Zip")
                    mapType = 3;
                else
                    mapType = 2;
            } else {
                mapType = 0;
            }

            //initialize projection based on map name
            if (mapName === "USA" || mapName === "SC_USACounties")
                projection = d3.geoAlbersUsa();
            else
                projection = d3.geoEquirectangular();

            dataLength = map.data.length > 10 ? 10 : map.data.length;

            let i = 0;
            if (map.dataProperties.columns[labelField].type === 'number' && mapType === 2) {
                labelType = 'fips';
            } else {
                while (labelLengths.length < dataLength) {
                    if (isNaN(map.data[i][labelField]) || mapType === 3) {
                        if (map.data[i][labelField])
                            labelLengths.push(map.data[i][labelField].length);
                    }
                    i++;
                }
                //determine label field type
                tempLength = d3.max(labelLengths);
                if (tempLength < 3)
                    labelType = 'code2'
                else if (tempLength < 4)
                    labelType = 'code3'
                else
                    labelType = 'name'
            }
            
            if (parentField) {
                i = 0;
                while (parentLengths.length < dataLength) {
                    if (isNaN(map.data[i][parentField])) {
                        if (map.data[i][parentField])
                            parentLengths.push(map.data[i][parentField].length);
                    }
                    i++;
                }
                tempLength = d3.max(parentLengths);
                if (tempLength < 3)
                    parentType = 'code'
                else
                    parentType = 'name'
            }
            
            //determine folder path and map type based on map name
            //0: Region, 1: Country, 2: Counties, 3: Zip
            if (mapName.length === 3) {
                folderPath = e.mapDirectory + 'stdmaps/countries/';
                createMap();
            }
            else if (mapName.substring(0, 3) === "SC_") {
                folderPath = e.mapDirectory + 'stdmaps/SubCountries/';
                createMap();
            } else {
                //read the label location data if enabled
                //if (map.series[0].labelsEnabled && map.series[0].labelFormat !== '') {
                if (map.series[0].labelFormat !== '') {
                    d3.json(folderPath + 'country_labels.json', function (error, data) {
                        labelData = topojson.feature(data, data.objects['places']).features;
                        createMap();
                    });
                } else {
                    createMap();
                }
            }
        }

        //animates columns
        function animatePaths() {
            minVal = map.domains.minY;
            maxVal = map.domains.maxY;
            paths
                .transition().duration(map.animation.duration)
                .ease(map.animation.easing.toEasing())
                .delay(function (d, i) { return i * map.animation.delay / Math.max(1, Math.sqrt(i / 8)); })
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
                    else if (labelType === 'name') {
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
                                    if (mapToRender === 'SC_USACounties') {
                                        let filterList = [];
                                        filterList.push({ key: labelField, values: names });
                                        switch (parentType) {
                                            case 'code':
                                                {
                                                    filterList.push({ key: parentField, values: d.properties.parent });
                                                }
                                                break;
                                            case 'name':
                                                {
                                                    filterList.push({ key: parentField, values: d.properties.parentName });
                                                }
                                                break;
                                        }
                                        currentFiltered = e.filterSingle(map.data, filterList);
                                    }
                                    else {
                                        currentFiltered = e.filterSingle(map.data, { key: labelField, values: names, replaceChar: true });
                                    }
                                }
                                break;
                            case 3:
                                {
                                    currentFiltered = e.filterSingle(map.data, { key: labelField, values: names, isNumeric: true });
                                }
                                break;
                            default:
                                {
                                    currentFiltered = e.filterSingle(map.data, { key: labelField, values: names, replaceChar: true });
                                }
                        }
                    } else if (labelType === 'fips') {
                        switch (mapType) {
                            case 2:
                                {
                                    currentFiltered = e.filterSingle(map.data, { key: labelField, values: d.properties.countyFIPS, isNumeric: true });
                                }
                                break;
                            default:
                                {
                                    currentFiltered = null;
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
                                        fillColor = e.matchGroup(currentFiltered[valueField], map.legend.legendColors, 'color') || 'rgb(221,221,221)';
                                    }
                                    break;
                                case 'ranged':
                                    {
                                        let rangeObj = e.matchRange(currentFiltered[valueField], map.legend.rangeList, 'color');
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
                                            gradientRatio = currentFiltered[valueField] / (maxVal - minVal) * 100 - (minVal / (maxVal - minVal) * 100);
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

                    //return fill opacity
                    return d.fillOpacity;
                })
                .attr('fill', function (d) { return d.fillColor; });

            //check whether the labls are enabled and update labels
            //if (map.series[0].labelsEnabled && map.series[0].labelFormat !== '' && labels !== null) {
            if (map.series[0].labelFormat !== '' && labels !== null) {
                labels
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
                    .style('font-size', map.series[0].labelFontSize + 'px');
            }

            //raise render complete
            if (map.renderComplete) {
                setTimeout(function () {
                    map.renderComplete();
                }, 1000);
            }
        }

        //determines which state to render
        function checkState() {
            if (mapName === "SC_USACounties" && map.series[0].filterStates && labelType !== 'fips') {
                uniqueParents = e.getUniqueValues(map.data, parentField);
                if (uniqueParents.length === 1) {
                    if (parentType === 'code')
                        mapToRender = 'SC_' + uniqueParents[0];
                    else {
                        stateList.forEach(function (d) {
                            if (d.name === uniqueParents[0])
                                mapToRender = 'SC_' + d.code;
                        });
                    }
                } else {
                    mapToRender = mapName;
                }
            } else {
                mapToRender = mapName;
            }
            uniqueParents = [];
        }

        //creates grouped column chart
        function createMap() {

            checkState();

            createTopology(true);
            //append zoom controls if not hidden
            if (!map.hideZoom) {

                //insert div into the foreign object
                let zoomDiv = d3.select('#' + map.innerContainer)
                    .append('div')
                    .attr('class', 'zoom-container')
                    .style('position', 'absolute')
                    .style('top', (map.plot.top + map.plot.titleHeight + (map.legend.position === 'top' ? map.legendSize.height : 0)) + 'px')
                    .style('left', (map.plot.left + (map.legend.position === 'left' ? map.legendSize.width : 0)) + 'px')
                    .attr('id', map.container + '_zoom_container');

                zoomDiv.append("a")
                    .attr("class", "zoom")
                    .attr("id", "zoom_in")
                    .text("+")
                    .on('click', function () {
                        // Apply a zoom transform equivalent to projection.{scale,translate,center}.
                        zoom.scaleBy(pathG, 2);
                    });

                zoomDiv.append("a")
                    .attr("class", "zoom")
                    .attr("id", "zoom_out")
                    .text("-")
                    .on('click', function () {
                        // Apply a zoom transform equivalent to projection.{scale,translate,center}.
                        zoom.scaleBy(pathG, 0.5);
                    });
            }

            //handles map zoom
            function zoomed() {
                let transform = d3.event.transform;

                //update projection
                projection
                    .scale(transform.k)
                    .translate([transform.x, transform.y]);

                //update map paths
                pathG.select('g').selectAll('path').attr('d', path);

                //check whether the labls are enabled and update labels
                //if (map.series[0].labelsEnabled && map.series[0].labelFormat !== '' && labels !== null) {
                if (map.series[0].labelFormat !== '' && labels !== null) {
                    labels.attr('transform', function (d) {
                        if (d.properties.coordinates) {
                            return 'translate(' + projection(d.properties.coordinates) + ')';
                        } else {
                            return 'translate(' + path.centroid(d) + ')';
                        }
                    });
                }
            }

            //reads the json file creates topology
            function createTopology(raiseOnLoaded) {
                //declare needed variables
                let tooltipContent = '',
                    labelFormat = '',
                    labelValue = '',
                    codeValue = '';

                //fill topology
                d3.json(folderPath + mapToRender + '.json', function (error, data) {
                    //set current map
                    renderedMap = mapToRender;

                    //create topology data
                    let topoData = topojson.feature(data, data.objects[mapToRender + '.geo']).features,
                        bgData = mapType == 3 ? topojson.feature(data, data.objects['SC_' + mapToRender.substring(6, 8) + '.geo']).features : [];

                    //merge background and map shapes
                    topoData = bgData.concat(topoData);

                    //create object for scaling and translating
                    let objGeo = topojson.feature(data, {
                        type: "GeometryCollection",
                        geometries: data.objects[mapToRender + '.geo'].geometries
                    });
                    //set scale and translate of the projection
                    projection.fitExtent([[0, 0], [map.plot.width, map.plot.height]], objGeo);

                    //create path
                    path = d3.geoPath().projection(projection);

                    //build paths
                    paths = pathG.append('g').selectAll('path')
                        .data(topoData)
                        .enter().append('path')
                        .attr('stroke', 'rgb(255,255,255)')
                        .attr('stroke-width', 0.5)
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
                        if (labelData) {
                            for (let j = 0; j < topoData.length; j++) {
                                for (let k = 0; k < labelData.length; k++) {
                                    if (topoData[j].properties.iso_a3 === labelData[k].properties.iso_a3) {
                                        topoData[j].properties.coordinates = labelData[k].geometry.coordinates;
                                        break;
                                    }
                                }
                            }
                        }
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

                    //create zoom with defaults
                    zoom = d3.zoom()
                        .scaleExtent([projection.scale(), 8 * projection.scale()])
                        .on("zoom", zoomed);

                    //append zoom
                    pathG
                        .call(zoom)
                        .call(zoom.transform, d3.zoomIdentity
                            .translate(projection.translate()[0], projection.translate()[1])
                            .scale(projection.scale()));

                    if (raiseOnLoaded) {
                        //raise on loaded
                        if (map.onLoaded) map.onLoaded();
                    }

                    //animate paths
                    animatePaths();
                });
            }

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

                checkState();

                if (renderedMap !== mapToRender) {
                    pathG.selectAll('g').remove();
                    createTopology(false);
                } else {
                    //animate paths
                    animatePaths();
                }
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

        //return standard map
        return map;

	}

	//attach standard map
	eve.standardMap = function (options) {
	    options.type = 'standardMap';
	    options.masterType = 'map';
	    //stack the options to the visualizations stack
	    e.visualizations.push(options);

		return new standardMap(options);
	};

})(eve);