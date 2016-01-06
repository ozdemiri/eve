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
        labelFormat: '',
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

            //fill topology
            d3.json('src/maps/' + chart.series[0].map + '.json', function (error, data) {
                //set topology
                Topology = data;
				
				//set calculate parameter
				var scaleParam = Math.min(chart.width, chart.height);

				//create projection
				var projection = d3.geo.equirectangular()
					.scale((scaleParam / 640) * 100)
					.translate([chart.width / 2, (chart.height / 2) + (chart.labelFontSize * 2)])
					.precision(.1);
	
				//create path
				var path = d3.geo.path().projection(projection);
				var topoData = topojson.feature(Topology, Topology.objects).features;
			
				//iterate all datas
				chart.data.forEach(function (currentData, i) {

					//check whether the labels are enabled
					if (chart.series[0].labelsEnabled) {
						//select all texts
						var _label = chart.svg.append("text")
							.datum(currentData)
							.attr('dy', 0)
							.attr('title', function (d, j) { return d[j].name; })
							.style("text-anchor", "middle")
							.style('fill', chart.series[0].labelFontColor)
							.style('font-size', chart.series[0].labelFontSize + 'px')
							.style('font-family', chart.series[0].labelFontFamily)
							.style('font-style', chart.series[0].labelFontStyle === 'bold' ? 'normal' : chart.series[0].labelFontStyle)
							.style('font-weight', chart.series[0].labelFontStyle === 'bold' ? 'bold' : 'normal')
							.text(function (d, j) {
								//get text
								var labelText = d[j].name;

								//format labels
								var formatted = chart.series[0].labelFormat.replaceAll('{label}', labelText);

								//return formatted
								return formatted;
							})
							.attr('x', chart.width / 2)
							.attr("y", function (d) {
								//get bbox
								var yPos = this.getBBox().height / 2 + 2;

								//return height
								return yPos;
							});
					}

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
							var sData = d.name || d.code;
								minVal = d3.min(chart.data, function (a) { return a[chart.series[0].valueField]; }),
								maxVal = d3.max(chart.data, function (a) { return a[chart.series[0].valueField];}),
								fillColor = '#dddddd',
								fillOpacity = .9;

							//check whether the state data is not null
							if (sData != null) {
								//get colors
								var categoryColor = e.colors[0],
									colorDepthPercent =  Math.abs(currentData[chart.series[0].valueField]) / (maxVal-minVal) * 100 - (minVal / (maxVal-minVal)  * 100);

								//check whether the value is > 0
								if (sData.value > 0) {
									//set fill color & opacity
									fillColor = categoryColor;
									fillOpacity =  (Math.abs(colorDepthPercent) / 100 * .6) + .3;
								}
							}

							//set fill color
							d.fillColor = fillColor;
							d.fillOpacity = fillOpacity;

							//return fill opacity
							return d.fillOpacity;
						} )
						.attr('fill', function (d) { return d.fillColor; });

					});				
            });

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
