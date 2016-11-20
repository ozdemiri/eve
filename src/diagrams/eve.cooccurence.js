/*!
 * eve.cooccurenceMatrix.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for cooccurenceMatrix diagram.
 */
(function (e) {
    //define cooccurenceMatrix diagram class
    function cooccurenceMatrix(options) {
        //declare needed variables
        var diagram = eve.base.init(options),
            currentSerie = diagram.series[0],
            tempLinks = [],
            tempNodes = [],
            maxTextLength = 0,
            dataLinks = [],
            dataNodes = [],
            largestText = '',
            margin = { left: 0, top: 0, bottom: diagram.margin.bottom, right: diagram.margin.right },
            autoMargin = 0,
            proportion = 0,
            proportionalSize = 0,
            width = 0,
            height = 0,
            x, z, c, matrix, nodes, n,
            orders,
            baseRect,
            rows,
            columns,
            scaleColor = null,
            cells,
            data = {};

        //coccurence link entity
        function coOccurenceLink(options) {
            //set members
            this.source = 0;
            this.target = 0;
            this.measure = 0;
            this.value = 0;

            //set options
            for (var key in options) {
                if(this.hasOwnProperty(key))
                    this[key] = options[key];
            }
        }

        //coccurence link details entity
        function coOccurenceLinkDetails(options) {
            //set members
            this.count = 0;
            this.totalMeasure = 0;

            //set options
            for (var key in options) {
                if(this.hasOwnProperty(key))
                    this[key] = options[key];
            }
        }

        //gets coccurence link details
        function getCoOccurenceLinkDetails(source, target, links) {
            //declare variables
            var linkDetails = new coOccurenceLinkDetails(),
                link = null;

            //iterate all links
            for (var i = 0; i <= links.length - 1; i++) {
                //get link
                link = links[i];

                //compare link source and target with the given source and target
                if (link.source == source && link.target == target) {
                    //set link details
                    linkDetails.count = linkDetails.count + 1;
                    linkDetails.totalMeasure = linkDetails.totalMeasure + link.measure;
                }
            }

            //return set details
            return linkDetails;
        }

        //gets cooccurence link index
        function getCoOccurenceLinkIndex(source, target, links) {
            //declare return value
            var index = -1;

            //iterate all links to set index
            for (var i = 0; i <= links.length - 1; i++) {
                //get current link
                var link = links[i];

                //compare link source and target with the given source and target
                if (link.source == source && link.target == target)
                    index = i;
            }

            //return found index
            return index;
        }

        //generate links and nodes
        function generateLinksAndNodes() {
            //iterate all data to create nodes
            diagram.data.forEach(function (d) {
                //get needed varibles
                var key = d[currentSerie.sourceField],
                    value = d[currentSerie.targetField],
                    node = {},
                    group = currentSerie.groupField ? d[currentSerie.groupField] : '';

                //check temp nodes
                if (tempNodes.indexOf(key) === -1) {
                    //declare a node object
                    node = { name: key };

                    //set group value
                    if (currentSerie.groupField)
                        node.group = group;

                    //add temp node
                    tempNodes.push(key);

                    //add node
                    dataNodes.push(node);
                }

                //set nodes via values
                if (tempNodes.indexOf(value) == -1) {
                    //declare a node object
                    node = {
                        name: value
                    };

                    //set group value
                    if (currentSerie.groupField)
                        node.group = group;

                    //add temp node
                    tempNodes.push(value);

                    //add node
                    dataNodes.push(node);
                }

                //check key length to set max text length
                if (key && key.length > maxTextLength)
                    maxTextLength = key.length;

                //check value length to set max text length
                if (value && value.length > maxTextLength)
                    maxTextLength = value.length;
            });

            //iterate all data to set temp links
            diagram.data.forEach(function (d) {
                //get needed varibles
                var key = d[currentSerie.sourceField],
                    value = d[currentSerie.targetField],
                    measure = isNaN(+d[currentSerie.measureField]) ? 0 : d[currentSerie.measureField],
                    keyIndex = tempNodes.indexOf(key),
                    valueIndex = tempNodes.indexOf(value);

                //create link object
                var link = new coOccurenceLink({
                    source: keyIndex,
                    target: valueIndex,
                    value: 1,
                    measure: measure
                });

                //push current link into the temp
                tempLinks.push(link);
            });

            //iterate all links
            tempLinks.forEach(function (link) {
                //get needed variables
                var linkDetails = getCoOccurenceLinkDetails(link.source, link.target, tempLinks),
                    linkIndex = getCoOccurenceLinkIndex(link.source, link.target, dataLinks);

                //check whether the link index is -1
                if (linkIndex == -1) {
                    //create a new link
                    var newLink = new coOccurenceLink({
                        source: link.source,
                        target: link.target,
                        value: linkDetails.count,
                        measure: linkDetails.totalMeasure
                    });

                    //add new link into the links
                    dataLinks.push(newLink);
                }
            });

            //set data
            data.links = dataLinks;
            data.nodes = dataNodes;
        }

        //calculates scales and environments
        function calculateScales() {
            //generate data links
            generateLinksAndNodes();

            //iterate all nodes
            data.nodes.forEach(function (n) {
                //check the name length
                if (n.name.length >= maxTextLength) {
                    //set largest text
                    largestText = n.name;

                    //set max text length
                    maxTextLength = n.name.length;
                }
            });

            //calculate auto margin and update margins
            autoMargin = (maxTextLength * (diagram.yAxis.labelFontSize / 2)) + 1;
            margin.left = diagram.margin.left + autoMargin;
            margin.top = diagram.margin.top + autoMargin;

            //calculate dimensions
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom;
            proportion = Math.min(width, height);

            //set scales
            x = d3.scaleBand().range([0, proportion - margin.left]);
            z = d3.scaleLinear().domain([0, 4]).clamp(true);
            c = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10));
            scaleColor = d3.scaleLinear().range(diagram.legend.gradientColors).domain(diagram.domains.y);
            matrix = [];
            nodes = data.nodes;
            n = nodes.length;
            proportionalSize = proportion - autoMargin;

            //create nodes and fill matrix
            nodes.forEach(function (node, i) {
                //set node index & count
                node.index = i;
                node.count = 0;

                //set matrix
                matrix[i] = d3.range(n).map(function (j) { return { x: j, y: i, z: 0 }; });
            });

            //create adjacency links
            data.links.forEach(function (link) {
                matrix[link.source][link.target].z += link.value;
                matrix[link.target][link.source].z += link.value;
                matrix[link.source][link.source].z += link.value;
                matrix[link.target][link.target].z += link.value;
                matrix[link.target][link.target].m += link.measure;
                nodes[link.source].count += link.value;
                nodes[link.target].count += link.value;
            });
            
            //declare order algorithms
            orders = {
                name: d3.range(n).sort(function (a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
                count: d3.range(n).sort(function (a, b) { return nodes[b].count - nodes[a].count; }),
                group: d3.range(n).sort(function (a, b) { return nodes[b].group - nodes[a].group; })
            };

            //sort the data
            if (currentSerie.orderMode == 'name')
                x.domain(orders.name);
            else if (currentSerie.orderMode == 'frequency')
                x.domain(orders.count);
            else if (currentSerie.orderMode == 'custom')
                x.domain(orders.group);
        }

        //initializes diagram
        function initDiagram() {
            //create rows
            rows = diagramG.selectAll('.row')
                .data(matrix).enter().append('g')
                .attr('class', 'row')
                .attr('transform', function (d, i) { return 'translate(0,' + x(i) + ')'; })
                .each(rowFunction);

            //append lines
            rows.append('line').style('stroke', '#fff').attr('x2', proportionalSize);

            //set row texts
            rows.append("text")
                .attr("x", -8)
                .attr("y", x.bandwidth() / 2)
                .attr("dy", ".32em")
                .attr("text-anchor", "end")
                .style('fill', diagram.yAxis.labelFontColor)
                .style('font-size', diagram.yAxis.labelFontSize + 'px')
                .style('font-family', diagram.yAxis.labelFontFamily)
                .style('font-style', diagram.yAxis.labelFontStyle === 'bold' ? 'normal' : diagram.yAxis.labelFontStyle)
                .style('font-weight', diagram.yAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function (d, i) { return nodes[i].name; });

            //append columns
            columns = diagramG.selectAll('.column')
                .data(matrix).enter().append('g')
                .attr('class', 'column')
                .attr('transform', function (d, i) { return 'translate(' + x(i) + ')rotate(-90)'; });

            //set column lines
            columns.append("line").style('stroke', '#fff').attr("x1", -proportionalSize);

            //Set column texts
            columns.append("text")
                .attr("x", 6)
                .attr("y", x.bandwidth() / 2)
                .attr("dy", ".32em")
                .attr("text-anchor", "start")
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily)
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function (d, i) { return nodes[i].name; });
        }

        //gets link for given source and target
        function getLink(source, target) {
            //declare variables
            var link = { source: -1, target: -1, value: 0, measure: 0 };

            //iterate all links to find link
            data.links.forEach(function (l) {
                //check whether the source and target matches
                if (l.source == source && l.target == target)
                    link = l;
            });

            //return found link
            return link;
        }

        //create row function and place cells into the grid
        function rowFunction(row) {
            //create cells
            cells = d3.select(this).selectAll('.cell')
                .data(row.filter(function (d) { return d.z; }))
                .enter().append('rect')
                .attr('class', 'cell')
                .attr('x', function (d) { return x(d.x); })
                .attr('width', x.bandwidth())
                .attr('height', x.bandwidth())
                .on('mousemove', function (d, i) {
                    //declare colorize variables
                    var source = d.y,
                        target = d.x,
                        link = getLink(source, target);

                    //show tooltip
                    diagram.showTooltip(diagram.getContent(link, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                })
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .style('fill', function (d) {
                    //declare colorize variables
                    var source = d.y,
                        target = d.x,
                        link = getLink(source, target);

                    //return gradient color
                    return scaleColor(link.measure);
                });
        }

        //calculate environment
        calculateScales();
        
        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + ((width / 2) - (proportion / 2) + margin.left / 2) + ',' + margin.top + ')');

        //create base rectangle
        baseRect = diagramG.append('rect')
            .attr('class', 'eve-cooc-back')
            .style('fill', '#eeeeee')
            .style('fill-opacity', 1)
            .attr('width', proportion - margin.left)
            .attr('height', proportion - margin.top);

        //initialize diagram
        initDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //update legend
            diagram.updateXYDomain();
            diagram.updateLegend();

            //re-calculate scales
            calculateScales();

            //clear diagram g
            diagramG.attr('transform', 'translate(' + ((width / 2) - (proportion / 2) + margin.left / 2) + ',' + margin.top + ')');
            
            //update base rectangle
            baseRect
                .attr('width', proportion - margin.left)
                .attr('height', proportion - margin.top);

            //remove rows and others
            rows.remove();
            columns.remove();

            //reinitialize diagram
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
    e.cooccurenceMatrix = function (options) {
        return new cooccurenceMatrix(options);
    };
})(eve);