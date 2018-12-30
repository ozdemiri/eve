/*!
 * eve.wordCloud.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for wordCloud diagram.
 */
(function (e) {
    //define wordCloud diagram class
    function wordCloud(options) {
        //declare needed variables
        let diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            currentMeasure = 0,
            currentColor = e.colors[0],
            currentAngle = 0,
            currentFontSize = 0,
            width = 0,
            scaleColor = null,
            scaleSize = null,
            wordsSVG = null,
            height = 0;

        //calculates scales and environemnt
        function calculateScales() {
            //calculate dimension
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right - diagram.margin.left - diagram.margin.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom - diagram.margin.bottom - diagram.margin.top;

            //create color scale
            scaleColor = d3.scaleLinear().range(diagram.legend.gradientColors).domain([diagram.domains.minY, diagram.domains.maxY]);
            scaleSize = d3.scaleLinear()
                .domain([diagram.domains.minY, diagram.domains.maxY])
                .range([currentSerie.minFontSize, currentSerie.maxFontSize]);

            //iterate data to enhance data
            diagram.data.forEach(function (d, i) {
                //get current values
                currentMeasure = +d[currentSerie.measureField];
                currentColor = diagram.legend.enabled ? scaleColor(currentMeasure) : (i >= e.colors.length ? e.randColor() : e.colors[i]);
                currentAngle = e.randInt(-90, 90);
                currentFontSize = scaleSize(currentMeasure);

                //update data
                d.value = currentMeasure;
                d.fontSize = currentFontSize;
                d.size = currentFontSize;
                d.fontColor = currentColor;
                d.color = currentColor;
                d.angle = currentAngle;
            });
        }

        //initializes diagram and creates cloud
        function initDiagram() {
            d3.layout.cloud()
                .size([width, height])
                .words(diagram.data)
                .padding(5)
                .rotate(function () { return ~~(Math.random() * 2) * 90; })
                .font(currentSerie.fontFamily)
                .fontSize(function (d) { return d.size; })
                .on("end", draw)
                .start();
        }

        //draws diagram
        function draw(words) {
            //create words svg
            wordsSVG = diagramG.selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", function (d) { return d.size + "px"; })
                .style("font-family", currentSerie.fontFamily)
                .style("cursor", "pointer")
                .style("fill", function (d, i) { return d.color; })
                .attr("text-anchor", "middle")
                .attr("transform", function (d) { return "translate(" + [0, 0] + ")rotate(0)"; })
                .on('mousemove', function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                })
                .text(function (d) { return d.text; });

            //animate translation
            wordsSVG
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .attr('opacity', 1)
                .style("font-size", function (d) { return d.size + "px"; })
                .style("fill", function (d, i) { return d.color; })
                .attr("transform", function (d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                });
        }

        //calculate environment and create cloud
        calculateScales();

        //create diagram g
        let diagramG = diagram.svg.append('g')
            .attr('class', 'eve-vis-g')
            .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

        //animate environment
        initDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //update legend
            diagram.calculateDomain();
            diagram.updateLegend();

            //re-calculate scales
            calculateScales();

            //remove g
            if (diagram.animation.effect) {
                //check whether the effect is fade
                if (diagram.animation.effect === 'fade') {
                    //remove with transition
                    diagramG.transition().duration(1000).style('opacity', 0).remove();
                } else if (diagram.animation.effect === 'dim') {
                    //remove with transition
                    diagramG.style('opacity', 0.15);
                } else if (diagram.animation.effect === 'add') {
                    //remove with transition
                    diagramG.style('opacity', 1);
                } else {
                    //remove immediately
                    diagramG.remove();
                }
            } else {
                //remove immediately
                diagramG.remove();
            }

            //re-append g
            diagramG = diagram.svg.append('g')
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

            //update cloud
            initDiagram();
        };

        //attach clear content method to chart
        diagram.clear = function () {
            //remove g from the content
            diagram.svg.selectAll('.eve-vis-g').remove();
        };

        //return abacus diagram
        return diagram;
    }

    //attach timeline method into the eve
    e.wordCloud = function (options) {
        options.masterType = 'standard';
        options.type = "wordCloud";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new wordCloud(options);
    };

    //attach timeline method into the eve
    e.wordcloud = function (options) {
        options.masterType = 'standard';
        options.type = "wordCloud";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new wordCloud(options);
    };
})(eve);