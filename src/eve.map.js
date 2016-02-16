/*!
 * eve.map.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Map class.
 */
 
(function (e) {
    //define default options
    var defaults = {
        map: 1,
        labelField: '',
        valueField: '',
        colorField: '',
        useLeaflet: false,
        labelFontColor: '#333333',
        labelFontFamily: 'Tahoma',
        labelFontSize: 10,
        labelFontStyle: 'normal',
        labelFormat: '{label}',
        labelsEnabled: true,
        numberFormat: '',
        title: '',
        type: 'map'
    };
    
    //map class
    function map(options) {
        //check whether the options has series
        if (options.series == null && e.getType(options.series) !== 'array') {
            throw new Error('Invalid chart series!');
        }
        
        //iterate all series in options to extend them
        for (var i = 0; i < options.series.length; i++) {
            //extend current serie with defaults
            e.extend(options.series[i], defaults);
        }
        
        //create chart
        var that = this,
            chart = e.charts.init(options)
        
        //initializes map
        function init() {
            //set default balloon format
            if (chart.balloon.format === '')
                chart.balloon.format = '{label}: {value}';
            
            //trim map name
            chart.series[0].map = chart.series[0].map.replace('%20', '').trim();
            
            //determine folder path based on map name
            var folderPath = 'src/maps/'
            if (chart.series[0].map.length === 3)
                folderPath = 'src/maps/countries/';
            
            var projection = null;
            //create projection
            if (chart.series[0].map === "USA")
                projection = d3.geo.albersUsa();
            else
                projection = d3.geo.equirectangular();
            
            var labels = null,
                zoom = null,
                paths = null,
                path = null;
            
            //fill topology
            d3.json(folderPath + chart.series[0].map + '.json', function (error, data) {
                //create topology data
                var topoData = topojson.feature(data, data.objects[chart.series[0].map + '.geo']).features,
                    x1Array = [],
                    minx1, maxx1, 
                    minx2, maxx2,
                    miny1, maxy1,
                    miny2, maxy2,
                    minx, maxx,
                    miny, maxy,
                    xcen, ycen,
                    x2Array = [],
                    y1Array = [],
                    y2Array = [];
                
                //iterate geographic data to set map boundaries
                topoData.forEach(function (ft) {
                    //calculate bounds for the current features [x1,y1]; [x2,y2]
                    var currentBound = d3.geo.bounds(ft);
                    
                    //fill bound arrays
                    x1Array.push(currentBound[0][0]);
                    x2Array.push(currentBound[1][0]);
                    y1Array.push(currentBound[0][1]);
                    y2Array.push(currentBound[1][1]);
                });
                
                //calculate min and max boundaries
                minx1 = d3.min(x1Array);
                maxx1 = d3.max(x1Array);
                minx2 = d3.min(x2Array);
                maxx2 = d3.max(x2Array);
                miny1 = d3.min(y1Array);
                maxy1 = d3.max(y1Array);
                miny2 = d3.min(y2Array);
                maxy2 = d3.max(y2Array);
                minx = minx1 < minx2 ? minx1 : minx2;
                maxx = maxx1 > maxx2 ? maxx1 : maxx2;
                miny = miny1 < miny2 ? miny1 : miny2;
                maxy = maxy1 > maxy2 ? maxy1 : maxy2;
                
                var xlenght = 0,
                    ylenght = 0;
                //calculate lenght of x and y
                xlenght = maxx - minx;
                ylenght = maxy - miny;
                
                //calculate center of x
                if (minx > 0 && maxx > 0 || minx < 0 && maxx < 0)
                    xcen = (maxx - Math.abs(maxx - minx) / 2);
                else
                    xcen = (maxx - (Math.abs(minx) + Math.abs(maxx)) / 2);
                
                //calculate center of y
                if (miny > 0 && maxy > 0 || miny < 0 && maxy < 0)
                    ycen = (maxy - Math.abs(maxy - miny) / 2);
                else
                    ycen = (maxy - (Math.abs(miny) + Math.abs(maxy)) / 2);
                
                //create and calculate scale
                var scale = 0;
				if (chart.series[0].map === "USA") {
					scale = chart.width / (xlenght * 0.00225) < chart.height / (ylenght * 0.0087) ? chart.width / (xlenght * 0.00225) : chart.height / (ylenght * 0.0087);
                }
                else {
					scale = chart.width / (0.0177 * xlenght) < chart.height / (0.0177 * ylenght) ? chart.width / (0.0177 * xlenght) : chart.height / (0.0177 * ylenght);
					scale = scale * 0.85;
                }

                projection.scale(scale);
                //create path
                path = d3.geo.path().projection(projection);
                
                //build paths
                paths = chart.svg.append('g').selectAll('path')
					.data(topoData)
					.enter().append('path')
					.attr('d', path)
					.attr('stroke', '#ffffff')
					.attr('stroke-width', .5)
					.attr('fill-opacity', .9)
					.attr('width', chart.width)
					.attr('height', chart.width / 2)
					.attr('fill-opacity', function (d) {
                    //get  data
                    minVal = d3.min(chart.data, function (a) { return a[chart.series[0].valueField]; }),
							    maxVal = d3.max(chart.data, function (a) { return a[chart.series[0].valueField]; }),
							    fillColor = '#dddddd',
                                currentDataName = e.filter(chart.data, chart.series[0].labelField, d.properties.name),
                                currentDataCode2 = e.filter(chart.data, chart.series[0].labelField, d.properties.iso_a2),
                                currentDataCode3 = e.filter(chart.data, chart.series[0].labelField, d.properties.iso_a3),
                                currentPostal = e.filter(chart.data, chart.series[0].labelField, d.properties.postal),
                                currentData = null,
							    fillOpacity = .9;
                    
                    //check data
                    if (currentDataName.length > 0)
                        currentData = currentDataName[0];
                    else if (currentDataCode2.length > 0)
                        currentData = currentDataCode2[0];
                    else if (currentDataCode3.length > 0)
                        currentData = currentDataCode3[0];
                    else if (currentPostal.length > 0)
                        currentData = currentPostal[0];
                    
                    //check whether the state data is not null
                    if (currentData != null) {
                        //get colors
                        var categoryColor = chart.legend.baseColor,
                            colorDepthPercent = Math.abs(currentData[chart.series[0].valueField]) / (maxVal - minVal) * 100 - (minVal / (maxVal - minVal) * 100);
                        
                        //check whether the value is > 0
                        if (currentData[chart.series[0].valueField] > 0) {
                            //set fill color & opacity
                            fillColor = categoryColor;
                            fillOpacity = (Math.abs(colorDepthPercent) / 100 * .6) + .3;
                        }
                    }
                    
                    //set fill color
                    d.fillColor = fillColor;
                    d.fillOpacity = fillOpacity;
                    d.currentData = currentData;
                    
                    //return fill opacity
                    return d.fillOpacity;
                })
					.attr('fill', function (d) { return d.fillColor; })
                    .on('mousemove', function (d, i) {
                    //get balloon content
                    var balloonContent = chart.getMapFormat(d.currentData, chart.series[0]);
                    
                    //show balloon
                    chart.showBalloon(balloonContent);
                })
                    .on('mouseout', function (d, i) {
                    //hide balloon
                    chart.hideBalloon();
                });
                //check if labels are enabled
                if (chart.series[0].labelsEnabled && chart.series[0].labelFormat !== '') {
                    //create labels
                    labels = chart.svg.append('g').selectAll('text')
							.data(topoData)
							.enter().append('text')
							.style("text-anchor", "middle")
							.style('fill', chart.series[0].labelFontColor)
							.style('font-size', chart.series[0].labelFontSize + 'px')
							.style('font-family', chart.series[0].labelFontFamily)
							.style('font-style', chart.series[0].labelFontStyle === 'bold' ? 'normal' : chart.series[0].labelFontStyle)
							.style('font-weight', chart.series[0].labelFontStyle === 'bold' ? 'bold' : 'normal')
							.text(function (d) {
                                //get label format
                                var format = chart.series[0].labelFormat,
                                    labelValue = d.properties.name,
									measureValue = '',
                                    codeValue = chart.series[0].map.length === 3 ? d.properties.postal : d.properties.iso_a2;
									
								// check if data for the shape exists
								if(d.currentData)
									measureValue = d.currentData.Measure;
								
                                //check whether the current data has iso_a3
                                if(d.properties.iso_a3 != null) {
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
                                //assign format
								format = format.replaceAll('{code}', codeValue).replaceAll('{label}', labelValue).replaceAll('{measure}', measureValue);
								console.log(measureValue);
								if(measureValue === '')
									format = format.replaceAll(':','');
									
                                //return format
                                return format;
                            })
					        .attr("transform", function (d) { return "translate(" + path.centroid(d) + ")"; })
					        .attr("dy", ".35em");
						
                }
                //apply zoom
                if (chart.series[0].map === "USA") {
                    zoom = d3.behavior.zoom()
						.scale(scale)
						.translate([chart.width / 2, chart.height / 2])
						.scaleExtent([scale, 8 * scale])
						.on("zoom", zoomed);
                }
                else {
                    zoom = d3.behavior.zoom()
						.scale(scale)
						.translate([chart.width / 2, chart.height / 2])
						.center([xcen, ycen])
						.scaleExtent([scale, 8 * scale])
						.on("zoom", zoomed);
                }
                
                //append zoom
                chart.svg.call(zoom).call(zoom.event);
					
            });
            //handles map zoom
            function zoomed() {
                //update projection
                if (chart.series[0].map === "USA") {
                    projection
						.translate(zoom.translate())
						.scale(zoom.scale());
                }
                else {
                    projection
						.translate(zoom.translate())
						.center(zoom.center())
						.scale(zoom.scale());
                }
                
                //update map paths
                chart.svg.select('g').selectAll('path').attr("d", path);
                
                //check whether the labls are enabled and update labels
                if (chart.series[0].labelsEnabled && chart.series[0].labelFormat !== '' && labels !== null) {
                    labels.attr("transform", function (d) { return "translate(" + path.centroid(d) + ")"; })
                }
            }
        }
        
        //init chart
        init();
        
        //return chart object
        return chart;
    }
    
    //attach bar method into eve
    e.map = function (options) {
        //set chart type
        options.type = 'map';
        return new map(options);
    };
})(eve);