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
        var diagram = eve.base.init(options),
            currentSerie = diagram.series[0],
            currentMeasure = 0,
            currentColor = e.colors[0],
            currentAngle = 0,
            currentFontSize = 0,
            width = 0,
            scaleColor = null,
            wordsSVG = null,
            height = 0;

        //calculates scales and environemnt
        function calculateScales() {
            //calculate dimension
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right - diagram.margin.left - diagram.margin.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom - diagram.margin.bottom - diagram.margin.top;

            //create color scale
            scaleColor = d3.scaleLinear().range(diagram.legend.gradientColors).domain(diagram.domains.y);

            //iterate data to enhance data
            diagram.data.forEach(function(d) {
                //get current values
                currentMeasure = +d[currentSerie.measureField];
                currentColor = diagram.legend.enabled ? scaleColor(currentMeasure) : e.randColor();
                currentAngle = e.randInt(-90, 90);
                currentFontSize = currentSerie.minFontSize + (currentMeasure / diagram.domains.y[1]) * currentSerie.maxFontSize; 

                //update data
                d.fontSize = currentFontSize;
                d.fontColor = currentColor;
                d.angle = currentAngle;
            });
        }

        //initializes diagram and creates cloud
        function initDiagram() {
            //create cloud
            d3.layout.cloud()
                .size([width, height])
                .words(diagram.data.map(function (d) {
                    return {
                        text: d[currentSerie.sourceField],
                        size: parseFloat(d.fontSize),
                        value: +d[currentSerie.measureField],
                        color: d.fontColor,
                        angle: d.angle,
                        opacity: 1
                    };
                }))
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
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .style("font-size", function(d) { return d.size + "px"; })
                .style("fill", function (d, i) { return d.color; })
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                });
        }

        //calculate environment and create cloud
        calculateScales();

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

        //animate environment
        initDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //update legend
            diagram.updateStandardDomain();
            diagram.updateLegend();

            //re-calculate scales
            calculateScales();
            
            //remove content
            diagramG.attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

            //exit transition
            wordsSVG.remove();

            //update cloud
            initDiagram();
        };

        //draws the chart into a canvas
        diagram.toCanvas = function () {
            //get the chart container
            var orgDiv = document.getElementById(diagram.container);
            /* create the promise for function response
            ** this is required for handling async canvas conversion
            */
            return new Promise(function (resolve) {
                //convert the final clone to canvas
                html2canvas(orgDiv).then(function (canvas) {
                    //return promise with canvas
                    resolve(canvas);
                });
            });
        };

        //returns the chart image 
        diagram.toImage = function () {
            //get the chart container
            var orgDiv = document.getElementById(diagram.container);
            /* create the promise for function response
            ** this is required for handling async canvas conversion
            */
            return new Promise(function (resolve) {
                //convert the final clone to canvas
                html2canvas(orgDiv).then(function (canvas) {
                    //return promise with canvas
                    resolve(canvas.toDataURL('image/png'));
                });
            });
        };

        //return abacus diagram
        return diagram;
    }

    //attach timeline method into the eve
    e.wordCloud = function (options) {
        options.type = 'standard';
        return new wordCloud(options);
    };
})(eve);