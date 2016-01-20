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
            
            //set calculate parameter
            var folderPath = 'src/maps/';
            
            // assign zoom settings
            var labels = null;
			var scale = 0;
			if (chart.series[0].map === "USA")
                scale = 1;
			else
				scale = Math.min(chart.width, chart.height) / 2;
            
			var projection = null;
            //create projection
			if (chart.series[0].map === "USA")
                projection = d3.geo.albersUsa().scale(scale);
			else
				projection = d3.geo.equirectangular();
            
            //create path
            var path = d3.geo.path().projection(projection),
                zoom = null;
            
            //fill topology
            chart.series[0].map = chart.series[0].map.replace('%20', '').trim();
            
            //check map name
            if (chart.series[0].map.length === 3)
                folderPath = 'src/maps/countries/';
            
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
                
                //build paths
                var paths = chart.svg.append('g').selectAll('path')
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
                            var format = chart.series[0].labelFormat;
                        
                            //check length of the map name
                            if (chart.series[0].map.length === 3)
                                format = format.replaceAll('{code}', d.properties.postal).replaceAll('{label}', d.properties.name);
                            else
                                format = format.replaceAll('{code}', d.properties.iso_a2).replaceAll('{label}', d.properties.name);

                            //return format
                            return format;
                        })
						.attr("transform", function (d) { return "translate(" + path.centroid(d) + ")"; })
						.attr("dy", ".35em");
                }
                
                //get bbox from the g
                var actualBox = chart.svg.select('g')[0][0].getBBox();
                
				//set g dimension and re-calculate scale
				if (chart.series[0].map === "USA"){
					scale = 1 + (chart.width - actualBox.width) * 1.25 < 1 + (chart.height - actualBox.height) * 2 ? 1 + (chart.width - actualBox.width) * 1.25 : 1 + (chart.height - actualBox.height) * 2;
				} else {
					scale = chart.width / actualBox.width  * 150 < chart.height / actualBox.height * 150 ? chart.width / actualBox.width * 150 : chart.height / actualBox.height * 150;
					scale = scale-25;
				}
                
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
                
				
				//apply zoom
				if (chart.series[0].map === "USA"){
					zoom = d3.behavior.zoom()
                    .scale(scale)
                    .translate([chart.width/2, chart.height/2])
                    .scaleExtent([scale, 8 * scale])
				    .on("zoom", zoomed);
				}
				else{
					zoom = d3.behavior.zoom()
                    .scale(scale)
                    .translate([chart.width/2, chart.height/2])
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
				if (chart.series[0].map === "USA"){
					projection
						.translate(zoom.translate())
						.scale(zoom.scale());
				}
				else{
					projection
						.translate(zoom.translate())
						.center(zoom.center())
						.scale(zoom.scale());
				}

                //update map paths
                chart.svg.select('g').selectAll('path').attr("d", path);
                
                //check whether the labls are enabled and update labels
				if(chart.series[0].labelsEnabled && chart.series[0].labelFormat !== '' && labels !== null) {
                    labels.attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
                }
			}
        }


        //init chart
        init();

        //return chart object
        return chart;
    }

    //attach bar method into eve
    e.map = function(options) {
        //set chart type
        options.type = 'map';

        return new map(options);
    };


})(eve);
