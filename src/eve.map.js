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
(function(e) {
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
        if(options.series == null && e.getType(options.series) !== 'array') {
            throw new Error('Invalid chart series!');
        }

        //iterate all series in options to extend them
        for(var i=0; i<options.series.length; i++) {
            //extend current serie with defaults
            e.extend(options.series[i], defaults);
        }

        //create chart
        var that = this,
            chart = e.charts.init(options)

        //initializes map
        function init() {
            //set default balloon format
            if(chart.balloon.format === '')
                chart.balloon.format = '{label}: {value}';
            //set calculate parameter
			var scaleParam = Math.min(chart.width, chart.height);

			//leaflet base map

			//create projection
			var projection = d3.geo.equirectangular()
				.scale((scaleParam / 640) * 100)
				.translate([chart.width / 2, (chart.height / 2) + (chart.series[0].labelFontSize * 2)])
				.precision(.1);

			// assign zoom settings
			var labels = null;
			var scale0 = (chart.width - 1) / 2 / Math.PI;
			var zoom = d3.behavior.zoom()
				.translate([chart.width / 2, chart.height / 2])
				.scale(scale0)
				.scaleExtent([scale0, 8 * scale0])
				.on("zoom", zoomed);

            //create path
            var path = d3.geo.path().projection(projection),
                folderPath = 'src/maps/';
            
            //append zoom
            chart.svg
				.call(zoom)
				.call(zoom.event);

            //fill topology
            chart.series[0].map = chart.series[0].map.replace('%20', '').trim();
            
            //check map name
            if (chart.series[0].map.length === 3)
                folderPath = 'src/maps/countries/';
                
            //fill topology
            d3.json(folderPath + chart.series[0].map + '.json', function (error, data) {
                //create topology data
                var topoData = topojson.feature(data, data.objects[chart.series[0].map + '.geo']).features;

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
                        var sData = '';
							minVal = d3.min(chart.data, function (a) { return a[chart.series[0].valueField]; }),
							maxVal = d3.max(chart.data, function (a) { return a[chart.series[0].valueField];}),
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
								colorDepthPercent =  Math.abs(currentData[chart.series[0].valueField]) / (maxVal-minVal) * 100 - (minVal / (maxVal-minVal)  * 100);

                            //check whether the value is > 0
							if (currentData[chart.series[0].valueField] > 0) {
								//set fill color & opacity
								fillColor = categoryColor;
								fillOpacity =  (Math.abs(colorDepthPercent) / 100 * .6) + .3;
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
                    .on('mousemove', function(d, i) {
                        //get balloon content
                        var balloonContent = chart.getMapFormat(d.currentData, chart.series[0]);

                        //show balloon
                        chart.showBalloon(balloonContent);
                    })
                    .on('mouseout', function(d, i) {
                        //hide balloon
                        chart.hideBalloon();
                    });

                //check if labels are enabled
                if(chart.series[0].labelsEnabled && chart.series[0].labelFormat !== '') {
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
                        .text(function(d) {
							if (chart.series[0].map.length === 3)
								return d.properties.postal;
							else
								return d.properties.iso_a2;
							})
						.attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
						.attr("dy", ".35em");
                }
            });

			function zoomed() {
				projection
					.translate(zoom.translate())
					.scale(zoom.scale());

				chart.svg.select('g').selectAll('path').attr("d", path);
				if(chart.series[0].labelsEnabled && chart.series[0].labelFormat !== '' && labels !== null) {
                    //create labels
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
