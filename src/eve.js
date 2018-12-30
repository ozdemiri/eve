/*!
 * eve.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Helper class.
 * 
 * Available Visualization Types:
 * abacus, area, bar, bubble, bullet, bump, calendarmap, chord, column, donut, funnel, line, map, ohlc, pie, 
 * pyramid, radar, scatter, waterfall  
 */
(function () {
    //adds replaceall function to the string object.
    String.prototype.replaceAll = function (term, replacement) {
        return this.split(term).join(replacement);
    };

    //adds diff function to the date object.
    Date.prototype.diff = function (date) {
        return (this.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    };

    //adds addHours function to the date object.
    Date.prototype.addHours = function (hours) {
        return this.setHours(this.getHours() + hours);
    };

    //adds addHours function to the date object.
    Date.prototype.addDays = function (days) {
        return this.setDate(this.getDate() + days);
    };

    //extend string to handle d3 symbols
    String.prototype.toSymbol = function () {
        let symbolType = d3.symbolSquare;
        switch (this) {
            case 'circle':
                symbolType = d3.symbolCircle;
                break;
            case 'cross':
                symbolType = d3.symbolCross;
                break;
            case 'diamond':
                symbolType = d3.symbolDiamond;
                break;
            case 'star':
                symbolType = d3.symbolStar;
                break;
            case 'triangle':
                symbolType = d3.symbolTriangle;
                break;
            case 'wye':
                symbolType = d3.symbolWye;
                break;
        }
        return symbolType;
    };

    //extend string to handle d3 tile types
    String.prototype.toTileType = function () {
        let tileType = d3.treemapSquarify; //squarify, binary, dice, slice, slicedice, resquarify
        switch (this.toString().toLowerCase()) {
            case 'binary':
                tileType = d3.treemapBinary;
                break;
            case 'dice':
                tileType = d3.treemapDice;
                break;
            case 'slice':
                tileType = d3.treemapSlice;
                break;
            case 'slicedice':
                tileType = d3.treemapSliceDice;
                break;
            case 'resquarify':
                tileType = d3.treemapResquarify;
                break;
        }
        return tileType;
    }

    //extend string to handle d3 easing
    String.prototype.toEasing = function () {
        return d3["ease" + this.toString()[0].toUpperCase() + this.toString().slice(1)] || d3.easeLinearIn;
    };

    //extend string to create key
    String.prototype.toValueKey = function () {
        return this.toString().trim().toLowerCase().replace(/[^a-zA-Z0-9 ]/g, "");
    };

    //extend string to create class selector
    String.prototype.toClassSelector = function () {
        let val = this.toString().toLowerCase().replace(/[^\w\s]/gi, '');
        return val.replaceAll(" ", "_");
    };

    //extends array to remove an item by its name
    Array.prototype.remove = function () {
        let what, a = arguments, L = a.length, ax;
        while (L && this.length) {
            what = a[--L];
            while ((ax = this.indexOf(what)) !== -1) {
                this.splice(ax, 1);
            }
        }
        return this;
    };

    //extends array to find the max length text
    Array.prototype.getLongestText = function () {
        let length = 0;
        let longest = "";
        for (let i = 0; i < this.length; i++) {
            let str = this[i].toString();
            if (str.length > length)
                longest = str;
        }
        return longest;
    };

    //extends number to check if the given one is between the limits
    Number.prototype.between = function (min, max) {
        if (min >= this && this <= max)
            return true;
        else
            return false;
    };

    //declare needed variables
    let eve = {
        configs: {},
        colors: ['rgb(131, 170, 48)', 'rgb(20, 153, 211)', 'rgb(77, 102, 132)', 'rgb(61, 61, 61)', 'rgb(185, 52, 11)', 'rgb(206, 164, 92)', 'rgb(197, 190, 139)', 'rgb(73, 131, 121)', 'rgb(63, 38, 28)', 'rgb(231, 71, 0)', 'rgb(241, 230, 143)', 'rgb(255, 151, 111)', 'rgb(255, 100, 100)', 'rgb(85, 73, 57)', 'rgb(112, 108, 77)', 'rgb(156, 101, 30)', 'rgb(80, 107, 11)', 'rgb(26, 107, 77)', 'rgb(13, 128, 116)', 'rgb(32, 130, 145)', 'rgb(15, 146, 166)'],
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        daysMin: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthsMin: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        mapDirectory: '/libraries/eve/',
        vectorSource: "https://maps.tilehosting.com/data/v3/",
        vectorKey: "TiNL5etp1GifX4gsKGzS",
        vectorTileStyle: "<style type='text/css'>path{stroke-linejoin:round;stroke-linecap:round;}.outerBorder{fill:none;stroke:#fff;stroke-width:1px;}.innerBorder{fill:none;stroke:#fff;stroke-width:0.5px;}.notVisible{fill:none;stroke:#dddddd;}.buildingAndHouseNo{fill:none;stroke:#987284;stroke-width:0.15px;}.noneStyle{fill:none;stroke:none;}.water{fill:#fff;stroke:#fff;}.waterway{fill:none;stroke:#fff;stroke-width:1.5px;}.roads{fill:none;stroke:#dddddd;}.roads-motorway{fill:none;stroke:#FA4A48;stroke-width:1.5px;}.roads-major_road{fill:none;stroke:#fb7b7a;stroke-width:1px;}.roads-minor_road{fill:none;stroke:#999;stroke-width:0.5px;}.roads-rail{fill:none;stroke:#503D3F;stroke-width:0.5px;}</style>",
        visualizations: []
    };

    //attach animation defaults
    eve.configs.animation = {
        duration: 250,
        delay: 5,
        enabled: false,
        easing: 'linear',
        effect: 'default', //default, add, fade, dim
        field: {}, //field object
        order: '', //asc, desc, custom (if it is custom then this field takes the column name)
        autoPlay: true,
        loop: false,
        label: '',
        locked: true
    };

    //attach axis defaults
    eve.configs.axis = {
        alpha: 1,
        color: '#999999',
        gridLineColor: '#aaaaaa',
        gridLineThickness: 0.5,
        gridLineAlpha: 0.5,
        labelAngle: 0,
        labelFontColor: '#999999',
        labelFontFamily: 'Tahoma',
        labelFontSize: 10,
        labelFontStyle: 'normal',
        labelFormat: '',
        startsFromZero: false,
        locked: false,
        min: null,
        max: null,
        values: [],
        colorMin: null,
        colorMax: null,
        tickCount: "auto",
        title: '',
        titleFontColor: '#666666',
        titleFontFamily: 'Tahoma',
        titleFontSize: 11,
        titleFontStyle: 'bold',
        enabled: true,
        skipEmpty: false,
        stacked: false,
        position: 'left', //left, right, top, bottom
        stackType: 'normal', //normal, full
        orderField: '',
        orderDirection: 'asc',
        orderValues: []
    };

    //attach legend defaults
    eve.configs.legend = {
        enabled: true,
        type: 'default', //default, ranged, gradient, scaled
        secondaryType: '', //'', default, ranged, gradient 
        fontColor: '#333333',
        fontFamily: 'Tahoma',
        fontSize: 12,
        fontStyle: 'normal',
        position: 'right',
        circleCount: 3,
        legendColors: [],
        rangeList: [],
        gradientStopCount: 'auto',
        gradientColors: ['', ''],
        numberFormat: '',
        lockedItems: null,
        smartLabels: true
    };

    //attach multiple defaults
    eve.configs.multiples = {
        enabled: false,
        multipleField: {},
        startFromZeroX: false,
        startFromZeroY: false,
        lockAxisX: false,
        lockAxisY: false
    };

    //attach serie defaults
    eve.configs.serie = {
        alpha: 0.8,
        axisPosition: 'left',
        axisTitle: '',
        backColor: '#efefef',
        borderColor: '#cdcdcd',
        bullet: 'none',
        bulletSize: 8,
        colField: '',
        color: '',
        colorField: '',
        dateField: '',
        direction: 'linear', //linear, radial
        enableDrillDown: false,
        endField: '',
        excludeStopWords: false,
        expression: 'none',
        filterStates: false,
        groupField: '',
        handleColor: '#999999',
        hideEmptyShapes: false,
        labelAngle: 0, //auto or numeric
        labelField: '',
        labelFontColor: '#333333',
        labelFontFamily: 'Tahoma',
        labelFontSize: 'auto',
        labelFontStyle: 'normal',
        labelFormat: '',
        labelPosition: 'auto', //auto, inside, outside
        labelVisibility: 'always', //always, fitting
        latField: '',
        lineBehavior: 'linear', //linear, spLine, stepLine
        lineMeasures: false,
        linkShapes: false,
        longField: '',
        majorTicks: 5,
        mapLayers: ['boundaries', 'landuse', 'roads', 'water'],
        markerColor: '#000000',
        markerField: '',
        markerFormat: '{{title}}: {{marker}}',
        markerWidth: 5,
        maxBulletSize: 30,
        maxFontSize: 50,
        maxRadius: 30,
        maxRange: null,
        measureField: '',
        minorTicks: 5,
        minBulletSize: 5,
        minFontSize: 12,
        minRadius: 5,
        minRange: null,
        neckHeight: 25,
        negativeColor: '#E21020',
        numberFormat: '',
        orderMode: 'name', //name, frequency, custom
        orientation: 'vertical',
        parentField: '',
        precision: 2,
        radius: 20,
        rangeColor: '#cccccc',
        rangeField: '',
        rowField: '',
        segmentLineAlpha: 1,
        segmentLineColor: '#cccccc',
        segmentLineThickness: 1,
        sliceStrokeAlpha: 0.1,
        sliceStrokeColor: '',
        sliceStrokeThickness: 0,
        shadowsEnabled: false,
        showBullets: true,
        sizeField: '',
        sourceField: '',
        spriteAngle: 'none',
        startField: '',
        tileIcon: 'circle', //square, hexagonal, circle
        tileType: 'squarify', //squarify, binary, dice, slice, slicedice, resquarify
        title: '',
        titleColor: '#666666',
        titleField: '',
        type: 'column',
        updateReZoom: false,
        valueField: '',
        xField: '',
        yField: '',
    };

    //attach title defaults
    eve.configs.title = {
        content: '',
        fontColor: '#333333',
        fontFamily: 'Tahoma',
        fontSize: 13,
        fontStyle: 'normal',
        position: 'topCenter'
    };

    //attach tooltip defaults
    eve.configs.tooltip = {
        backColor: '#ffffff',
        enabled: true,
        fontColor: '#333333',
        fontFamily: 'Tahoma',
        fontSize: 12,
        fontStyle: 'normal',
        format: '',
        borderColor: '#61c9f6',
        borderRadius: 3,
        borderSize: 1,
        borderStyle: 'solid',
        opacity: 0.9,
        padding: 10
    };

    //attach vis defaults
    eve.configs.vis = {
        animation: eve.configs.animation,
        backColor: '#ffffff',
        border: {
            color: 'transparent',
            size: 0,
            style: 'solid'
        },
        margin: {
            left: 5,
            top: 5,
            right: 5,
            bottom: 5
        },
        colors: [],
        container: '',
        currTransform: null,
        data: null,
        height: 'auto',
        legend: eve.configs.legend,
        multiples: eve.configs.multiples,
        series: [],
        title: eve.configs.title,
        tooltip: eve.configs.tooltip,
        trends: [],
        type: '',
        xAxis: eve.configs.axis,
        xField: '',
        yAxis: eve.configs.axis,
        width: 'auto'
    };

    //checks whether the page loaded in mobile
    eve.isMobile = function () {
        var check = false;
        (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    };

    //gets type of the given object
    eve.getType = function (obj, logger) {
        let objType = typeof obj;
        let returnType = 'null';

        //handle errors
        if (obj === null) return 'null';
        if (obj === undefined) return 'undefined';

        //switch original type
        switch (objType) {
            case 'string':
                {
                    //check if current object is parsable date
                    let parserFull = d3.utcParse('%Y-%m-%dT%H:%M:%S.%LZ');
                    let parserFull2 = d3.utcParse('%Y-%m-%dT%H:%M:%S');
                    let parserHalf = d3.utcParse('%Y-%m-%d');
                    let parsedValue = parserFull(obj) || parserFull2(obj) || parserHalf(obj);

                    //check if both parsers fails
                    if (parsedValue) {
                        return 'date';
                    } else {
                        let parsedDate = new Date(obj);
                        let parsedDateVal = JSON.stringify(parsedDate);
                        /*if (parsedDateVal)
                            return "date";*/

                        return 'string';
                    }
                }
                break;
            case 'number':
            case 'boolean':
            case 'function':
                returnType = objType;
                break;
            default:
                {
                    //check whether the object has getMonth member
                    if (typeof obj.getMonth === 'undefined') {
                        if (Object.prototype.toString.call(obj) === '[object Array]')
                            returnType = 'array';
                        else if (Object.prototype.toString.call(obj) === '[object Function]')
                            returnType = 'function';
                        else if (Object.prototype.toString.call(obj) === '[object NodeList]')
                            returnType = 'nodeList';
                        else if (Object.prototype.toString.call(obj) === '[object Object]') {
                            returnType = 'object';
                        } else {
                            let isHTMLElement = (typeof HTMLElement === "object" ? obj instanceof HTMLElement : obj && typeof obj === "object" && obj !== null && obj.nodeType === 1 && typeof obj.nodeName === "string");
                            if (isHTMLElement)
                                returnType = 'htmlElement';
                            else
                                returnType = 'wtf';
                        }
                    } else {
                        returnType = 'date';
                    }
                }
                break;
        }

        return returnType;
    };

    //gets browser name
    eve.getBrowserName = function () {
        var aKeys = ["MSIE", "Firefox", "Safari", "Chrome", "Opera"],
            sUsrAg = navigator.userAgent,
            nIdx = aKeys.length - 1;

        for (nIdx; nIdx > -1 && sUsrAg.indexOf(aKeys[nIdx]) === -1; nIdx--);

        return aKeys[nIdx];
    };

    //sets eve charts colors
    eve.setColors = function () {
        //check whether the colors is not empty
        if (arguments.length === 0) return;

        //get type of the argument
        let colors = arguments[0];
        let argType = eve.getType(colors);

        //check argument type
        if (argType === 'string') {
            //check whether the argument contains ; or ,
            if (colors.indexOf(';') > -1) {
                eve.colors = colors.split(';');
            } else if (colors.indexOf(',') > -1) {
                eve.colors = colors.split(',');
            }
        } else if (argType === 'array') {
            //set colors
            eve.colors = colors;
        }
    };
	
	//calculates optimum w/h for a single multiple visualization in the area
	eve.getBestDimension = function(containerWidth, containerHeight, visCount, aspectRatio) {
		if(!aspectRatio)
			aspectRatio = 1;
		
		//declare variables
		let best = { area: 0, cols: 0, rows: 0, width: 0, height: 0 };
		const startCols = visCount;
		const colDelta = -1;
		
		// For each combination of rows + cols that can fit the number of rectangles,
		// place them and see the area.
		for (let cols = startCols; cols > 0; cols += colDelta) {
			const rows = Math.ceil(visCount / cols);
			const hScale = containerWidth / (cols * aspectRatio);
			const vScale = containerHeight / rows;
			let width;
			let height;
			// Determine which axis is the constraint.
			if (hScale <= vScale) {
				width = containerWidth / cols;
				height = width / aspectRatio;
			} else {
				height = containerHeight / rows;
				width = height * aspectRatio;
			}
			const area = width * height;
			if (area > best.area) {
				best = {area, width, height, rows, cols};
			}
		}
		return best;
	};

    //gets closest power of given value with given divider
    eve.closestPower = function (value, divider) {
        //check divider
        if (arguments.length === 0)
            return 2;
        if (arguments.length === 1)
            divider = 2;

        //iterate value
        let closestLower = 0;
        for (let i = value; i > 0; --i) {
            if (i % divider === 0) {
                closestLower = i;
                break;
            }
        }

        return closestLower;
    };

    //converts given value into hex.
    eve.toHex = function (value) {
        let hex = value.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    //converts rgb to hex.
    eve.rgbToHex = function () {
        if (arguments.length === 1) {
            if (arguments.toString().indexOf('#') > -1) {
                return arguments[0];
            } else {
                let _arg = arguments[0].toString().replace('rgb(', '').replace(')', '');
                let _rgb = _arg.split(',');
                return '#' + eve.toHex(parseInt(_rgb[0])) + eve.toHex(parseInt(_rgb[1])) + eve.toHex(parseInt(_rgb[2]));
            }
        } else if (arguments.length === 3) {
            return '#' + eve.toHex(parseInt(arguments[0])) + eve.toHex(parseInt(arguments[1])) + eve.toHex(parseInt(arguments[2]));
        } else {
            return '#0066CC';
        }
    };

    //converts given hex value to rgb.
    eve.hexToRgb = function (hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    //converts given hex value to rgb string.
    eve.hexToRgbString = function (hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 'rgb(' + parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) + ')' : null;
    };

    //removes duplicate values from the array
    eve.removeDuplicates = function (arr) {
        return _.uniq(arr);
    };

    //gets the given number's base
    eve.getNumberBase = function (val) {
        let len = val.toString().length;
        let str = "1";
        for (let i = 0; i < len-1; i++)
            str += "0";
        return parseFloat(str);
    };

    //calculates tick count from given
    eve.calculateTicks = function (ticks) {
        if (ticks % 2 === 0)
            return ticks;
        if (ticks % 5 === 0)
            return ticks;
        if (ticks % 10 === 0)
            return ticks;

        return ticks + 1;
    };

    //sorts given array with give order
    eve.customSort = function (data, fieldName, order) {
        //declare needed variables
        let sorted = [];
        let notListed = [];
        let tmpData;
        let nestedSort;
        let cloned;
        let i, j, k;

        if (data[0].hasOwnProperty('group') && data[0].hasOwnProperty('values')) {
            for (j = 0; j < data.length; j++) {
                tmpData = eve.clone(data[j]);
                nestedSort = [];
                for (i = 0; i < order.length; i++) {
                    if (order[i] != null) {
                        for (k = 0; k < tmpData.values.length; k++) {
                            if (tmpData.values[k][fieldName] != null) {
                                if (tmpData.values[k][fieldName].toString().toLowerCase() === order[i].toString().toLowerCase()) {
                                    cloned = eve.clone(tmpData.values[k]);
                                    nestedSort.push(cloned);
                                }
                            } else {
                                notListed.push(eve.clone(tmpData.values[k]));
                            }
                        }
                    }
                }
                nestedSort.concat(notListed);
                tmpData.values = nestedSort;
                sorted.push(tmpData);
            }
        } else {
            for (i = 0; i < order.length; i++) {
                if (order[i] != null) {
                    for (k = 0; k < data.length; k++) {
                        if (data[k][fieldName] != null) {
                            if (data[k][fieldName].toString().toLowerCase() === order[i].toString().toLowerCase()) {
                                cloned = eve.clone(data[k]);
                                sorted.push(cloned);
                            }
                        } else {
                            notListed.push(eve.clone(data[k]));
                        }
                    }
                }
            }
            sorted.concat(notListed);
        }

        //return sorted result
        return sorted;
    };

    //gets gradient color.
    eve.gradient = function (gradientColors, percent) {
        let domains = d3.range(0, 100, 100 / (gradientColors.length - 1));
        domains.push(100);

        let colorScale = d3.scaleLinear().domain(domains).range(gradientColors);
        return colorScale(percent);
    };

    //Gets gradient color.
    eve.gridGradient = function (startColor, endColor, percent) {
        //Declare needed variables
        var newColor = {};
        var color1 = eve.hexToRgb(startColor);
        var color2 = eve.hexToRgb(endColor);

        //Create channel function to inner uses.
        function channel(a, b) { return (a + Math.round((b - a) * (percent / 100))); }

        //Create color piece function to inner uses.
        function colorPiece(num) {
            num = Math.min(num, 255);   // not more than 255
            num = Math.max(num, 0);     // not less than 0
            var str = num.toString(16);
            if (str.length < 2) {
                str = "0" + str;
            }
            return (str);
        }

        //Create new color
        newColor.r = channel(color1.r, color2.r);
        newColor.g = channel(color1.g, color2.g);
        newColor.b = channel(color1.b, color2.b);
        newColor.cssColor = "#" + colorPiece(newColor.r) + colorPiece(newColor.g) + colorPiece(newColor.b);

        //Return color
        return "#" + colorPiece(newColor.r) + colorPiece(newColor.g) + colorPiece(newColor.b);
    };

    //inverts given color
    eve.invertColor = function (color) {
        //check if color is rgb
        if (color.indexOf('rgb') > -1)
            color = eve.rgbToHex(color);

        let newColor = color;
        newColor = newColor.substring(1);
        newColor = parseInt(newColor, 16);
        newColor = 0xFFFFFF ^ newColor;
        newColor = newColor.toString(16);
        newColor = ("000000" + newColor).slice(-6);
        newColor = "#" + newColor;
        return newColor;
    };

    //generates a random integer
    eve.randInt = function () {
        //declare variables
        let min = 0, max = 1;

        //check arguments length
        if (arguments.length === 2) {
            min = arguments[0];
            max = arguments[1];
        }

        if (min >= max) {
            throw Error('Max argument should be greater than min argument!');
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    //generates random decimal
    eve.randDecimal = function (min, max, fixed) {
        return (Math.random() * (max - min) + min).toFixed(fixed) * 1;
    };

    //generates a random color
    eve.randColor = function () {
        let chars = '0123456789ABCDEF'.split(''),
            color = '#';

        for (let i = 0; i < 6; i++)
            color += chars[Math.floor(Math.random() * 16)];

        return eve.hexToRgbString(color);
    };

    //generates a color from the given color
    eve.autoColor = function (color) {
        //set current color
        let actualColor = d3.color(color);
        if (actualColor) {
            //check if the actual color is white
            if (actualColor.r === 255 && actualColor.g === 255 && actualColor.b === 255)
                actualColor = d3.rgb(0, 0, 0);
            else if (actualColor.r === 0 && actualColor.g === 0 && actualColor.b === 0)
                actualColor = d3.rgb(255, 255, 255);
            else {
                if ((1 - (0.299 * actualColor.r + 0.587 * actualColor.g + 0.114 * actualColor.b) / 255) < 0.5)
                    actualColor = d3.rgb(d3.hsl(d3.color(color)).darker()).darker(2); // bright colors
                else
                    actualColor = d3.rgb(d3.hsl(d3.color(color)).brighter()).brighter(2); // dark colors
            }

            //return inverted color
            return actualColor.toString();
        } else {
            return e.randColor();
        }
    };

    //gets days in month
    eve.getDaysInMonth = function (year, month) {
        let monthStart = new Date(year, month, 1);
        let monthEnd = new Date(year, month + 1, 1);
        let monthLength = (monthEnd - monthStart) / (1000 * 60 * 60 * 24);
        return Math.ceil(monthLength);
    };

    //clones given object
    eve.clone = function (obj) {
        // Handle the 3 simple types, and null or undefined
        if (!obj || "object" !== typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            let copy = [];
            for (let i = 0, len = obj.length; i < len; i++) {
                copy[i] = eve.clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            let copy = {};
            for (let attr in obj) {
                copy[attr] = eve.clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    };

    //checks whether the given number is a prime number
    eve.isPrime = function (num) {
        if (isNaN(num) || !isFinite(num) || num % 1 || num < 2) return false;
        if (num % 2 === 0) return (num == 2);

        let r = Math.sqrt(num);
        for (let i = 3; i <= r; i += 2)
            if (num % i === 0)
                return false;

        return true;
    };

    //gets prime factors of the given number
    eve.getPrimeFactors = function (num) {
        if (isNaN(num) || !isFinite(num)) return [];

        let r = Math.sqrt(num),
            res = arguments[1] || [],
            x = 2;

        if (num % x) {
            x = 3;
            while ((num % x) && ((x = x + 2) < r)) { }
        }

        x = (x <= r) ? x : num;
        res.push(x);

        return (x === num) ? res : eve.getPrimeFactors(num / x, res);
    };

    //extends given sub class with the given base class
    eve.extend = function (sub, base) {
        function extended() { }

        extended.prototype = base.prototype;

        if (eve.getType(sub) === 'function' && eve.getType(base) === 'function') {
            for (let key1 in base) {
                eval('sub.' + key1 + ' = base.' + key1);
            }
            return sub;
        } else if (eve.getType(sub) === 'object' && eve.getType(base) === 'object') {
            for (let key2 in base) {
                let baseType = eve.getType(base[key2]);
                if (baseType === 'object') {
                    if (sub[key2])
                        eve.extend(sub[key2], base[key2]);
                    else
                        sub[key2] = base[key2];
                } else {
                    if (sub[key2] === undefined)
                        sub[key2] = base[key2];
                }
            }
            return sub;
        }
    };

    //simplify
    eve.simplify = function () {

    };

    //gets querystring value
    eve.queryString = function (name) {
        if (arguments.length === 0) return '';
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");

        let regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            res = regex.exec(window.location.search);

        if (res === null)
            return '';
        else
            return decodeURIComponent(res[1].replace(/\+/g, ' '));
    };

    //checks whether the all values in the array is identical
    eve.isIdentical = function (arr) {
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] !== arr[i + 1])
                return false;
        }
        return true;
    };

    //gets html element's offset
    eve.offset = function (el) {
        let offset = { width: 0, height: 0, left: 0, top: 0 };

        if (!el) return offset;
        if (eve.getType(el) !== 'htmlElement') return offset;

        let compStyle = getComputedStyle(el, null),
            borderLeft = parseInt(compStyle.getPropertyValue('border-left-width')),
            borderRight = parseInt(compStyle.getPropertyValue('border-right-width')),
            borderTop = parseInt(compStyle.getPropertyValue('border-top-width')),
            borderBottom = parseInt(compStyle.getPropertyValue('border-bottom-width')),
            paddingLeft = parseInt(compStyle.getPropertyValue('padding-left')),
            paddingRight = parseInt(compStyle.getPropertyValue('padding-right')),
            paddingTop = parseInt(compStyle.getPropertyValue('padding-top')),
            paddingBottom = parseInt(compStyle.getPropertyValue('padding-bottom'));
        if (el.getBoundingClientRect) {
            let bcr = el.getBoundingClientRect();
            offset.width = bcr.width - borderLeft - borderRight- paddingLeft - paddingRight;
            offset.height = bcr.height - borderTop - borderBottom- paddingTop - paddingBottom;
            offset.left = bcr.left;
            offset.top = bcr.top;
        } else {
            offset.width = el.offsetWidth ? 0 : parseFloat(el.offsetWidth) - borderLeft - borderRight - paddingLeft - paddingRight;
            offset.height = el.offsetHeight ? 0 : parseFloat(el.offsetHeight) - borderTop - borderBottom - paddingTop - paddingBottom;
            offset.left = el.offsetLeft ? 0 : parseFloat(el.offsetLeft);
            offset.top = el.offsetTop ? 0 : parseFloat(el.offsetTop);
        }

        return offset;
    };

    //filters numeric array
    eve.filterNumeric = function (arr, property, value) {
        return arr.filter(function (a) {
            if (!a[property] || !value)
                return false;
            else
                return a[property] == value;
        });
    };

    //filters array
    eve.filter = function (arr, property, value) {
        return arr.filter(function (a) {
            if (!a[property] || !value)
                return false;
            else
                return a[property].toString().toUpperCase() == value.toString().toUpperCase();
        });
    };

    //filters array
    eve.filterSensitive = function (arr, property, value) {
        return arr.filter(function (a) {
            if (!a[property] || !value)
                return false;
            else
                return a[property] == value;
        });
    };

    //finds the first match in the array and returns it
    eve.filterSingle = function (arr, filterProps) {
        //declare needed variables
        let props = filterProps;
        let i, j, k;
        let specReplace = function (str) {
            return str.toLowerCase().replaceAll("ä", "a").replaceAll("à", "a").replaceAll("â", "a").replaceAll("å", "a").replaceAll("á", "a").replaceAll("ą", "a").replaceAll("ã", "a")
                                    .replaceAll("ă", "a").replaceAll("ç", "c").replaceAll("č", "c").replaceAll("ć", "c").replaceAll("ď", "d").replaceAll("é", "e").replaceAll("è", "e").replaceAll("ê", "e")
                                    .replaceAll("ë", "e").replaceAll("ě", "e").replaceAll("ę", "e").replaceAll("ğ", "g").replaceAll("ï", "i").replaceAll("î", "i").replaceAll("ı", "i").replaceAll("í", "i")
                                    .replaceAll("İ", "I").replaceAll("ň", "n").replaceAll("ń", "n").replaceAll("ñ", "n").replaceAll("ö", "o").replaceAll("ô", "o").replaceAll("ó", "o").replaceAll("ő", "o")
                                    .replaceAll("ð", "o").replaceAll("õ", "o").replaceAll("ř", "r").replaceAll("ş", "s").replaceAll("š", "s").replaceAll("ś", "s").replaceAll("ș", "s").replaceAll("ť", "t")
                                    .replaceAll("ţ", "t").replaceAll("ț", "t").replaceAll("ü", "u").replaceAll("ű", "u").replaceAll("ù", "u").replaceAll("û", "u").replaceAll("ú", "u").replaceAll("ů", "u")
                                    .replaceAll("ŵ", "w").replaceAll("ÿ", "y").replaceAll("ý", "y").replaceAll("ŷ", "y").replaceAll("ž", "z").replaceAll("ź", "z").replaceAll("ż", "z");
        };

        //handle props replacements
        if (eve.getType(props) === 'array') {
            for (i = 0; i < props.length; i++) {
                if (props[i].replaceChar) {
                    if (eve.getType(props[i].values) === 'array') {
                        for (j = 0; j < props[i].values.length; j++) {
                            props[i].values[j] = specReplace(props[i].values[j]);
                        }
                    } else {
                        props[i].values = specReplace(props[i].values);
                    }
                }
            }
        }
        else {
            if (props.replaceChar) {
                if (eve.getType(props.values) === 'array') {
                    for (j = 0; j < props.values.length; j++) {
                        props.values[j] = specReplace(props.values[j]);
                    }
                } else {
                    props.values = specReplace(props.values);
                }
            }
        }

        for (i = 0; i < arr.length; i++) {
            let item = arr[i];
            if (eve.getType(props) === 'array') {
                let propMatch = props.every(function (p) {
                    if (item[p.key]) {
                        if (p.replaceChar)
                            item[p.key] = specReplace(item[p.key]);
                        if (eve.getType(p.values) === 'array') {
                            return p.values.some(function (v) {
                                if (p.isNumeric)
                                    return item[p.key] == v;
                                else
                                    return item[p.key].toString().toUpperCase() == v.toString().toUpperCase();
                            });
                        } else {
                            if (p.values) {
                                if (p.isNumeric) {
                                    return item[p.key] == p.values;
                                } else {
                                    return item[p.key].toString().toUpperCase() == p.values.toString().toUpperCase();
                                }
                            }
                        }
                    }
                });
                if (propMatch) return item;
            } else {
                if (item[props.key]) {
                    if (props.replaceChar)
                        item[props.key] = specReplace(item[props.key]);
                    if (eve.getType(props.values) === 'array') {
                        let valueMatch = props.values.some(function (v) {
                            if (props.isNumeric)
                                return item[props.key] == v;
                            else
                                return item[props.key].toString().toUpperCase() == v.toString().toUpperCase();
                        });
                        if (valueMatch) return item;
                    } else {
                        if (props.isNumeric) {
                            if (item[props.key] == props.values) return item;
                        } else {
                            if (item[props.key].toString().toUpperCase() == props.values.toString().toUpperCase()) return item;
                        }
                    }
                }
            }

        }

        return null;
    };

    //gets color for ranged legends.
    eve.matchRange = function (value, legendItems, key) {
        for (let i = 0; i < legendItems.length; i++) {
            let l = legendItems[i];
            if (value >= l.minValue && value <= l.maxValue) {
                return { color: l[key], index: i };
            }
        }
    };

    //finds an matching range for the value in array and returns corresponding key value
    eve.findRange = function (value, arr, key) {
        for (let i = 0; i < arr.length; i++) {
            let l = arr[i];
            if (value >= l.minValue && value <= l.maxValue) {
                return l[key];
            }
        }
    };

    //gets color for grouped legends.
    eve.matchGroup = function (value, legendItems, key) {
        for (let i = 0; i < legendItems.length; i++) {
            let l = legendItems[i];
            if (value == l.value) {
                return l[key];
            }
        }
    };

    //gets unique values in array of objects
    eve.getUniqueValues = function (data, prop) {
        if (prop == null)
            return _.uniq(data);

        //get unique values from data using underscore
        return _.uniq(_.map(data, function (d) {
            return d[prop];
        }));
    };

    //helper function for detecting MS browsers
    eve.detectMS = function () {
        let ua = window.navigator.userAgent;

        if (ua.indexOf('MSIE ') > 0) {
            // IE 10 or older => return true
            return true;
        }

        if (ua.indexOf('Trident/') > 0) {
            // IE 11 => return true
            return true;
        }

        if (ua.indexOf('Edge/') > 0) {
            // Edge (IE 12+) => return version number
            return true;
        }

        // other browser
        return false;
    }

    //helper function for detecting MS browsers
    eve.detectIE = function () {
        let ua = window.navigator.userAgent;

        if (ua.indexOf('MSIE ') > 0) {
            // IE 10 or older => return true
            return true;
        }

        if (ua.indexOf('Trident/') > 0) {
            // IE 11 => return true
            return true;
        }

        // other browser
        return false;
    }

    //checks whether the given number is float
    eve.isFloat = function (val) {
        return Number(val) === val && val % 1 !== 0;
    };

    //formats given numbers
    eve.formatNumber = function (value, format) {
        //check whehter the format is null
        if (arguments.length === 0) return '';
        if (arguments.length === 1)
            format = '';
        if (!format)
            format = "";

        //declare needed variables
        let d3Equi = '',
            formatted = '',
            firstChar = format.substr(0, 1),
            lastChar = format.substr(format.length - 1, 1),
            inParantheses = firstChar === '(' && lastChar === ')',
            firstCharIsZero = firstChar === '0',
            lastCharIsZero = lastChar === '0',
            formatSplitted = [],
            decimalPlaces = 0,
            formatSign = 'f',
            hasCurrency = format.indexOf('[') > -1 && format.indexOf(']') > -1,
            currencyPos = format.indexOf('[') < 2 ? 'start' : 'end',
            currencyReg = /\[(.*)\]/i,
            currencySign = '',
            currencyStart = '',
            currencyEnd = '',
            hasThousands = format.indexOf('#,##') > -1;

        //check whether the format is empty then return plain
        if (format === '') {
            //check decimal places
            if (eve.isFloat(value))
                return parseFloat(value).toFixed(2);
            return value ? value.toString() : (value === 0 ? value.toString() : '');
        } else if (format === '0') {
            return d3.format('.0f')(value);
        }

        //check whether the format is in parantheses
        if (inParantheses)
            format = format.replaceAll("(", "").replaceAll(")", "");

        //check whether the format has currency
        if (hasCurrency) {
            //get currency sign
            currencySign = format.match(currencyReg)[1];

            //clear currency from format
            format = format.replaceAll('[' + currencySign + ']', '');

            //set currency start and end
            currencyStart = currencyPos === 'start' ? currencySign : '';
            currencyEnd = currencyPos === 'end' ? currencySign : '';
        }

        //remove thousands formatter
        format = hasThousands ? format.replaceAll('#,##', '') : format;

        //need to update first and last char
        firstChar = format.substr(0, 1);
        lastChar = format.substr(format.length - 1, 1);
        firstCharIsZero = firstChar === '0';
        lastCharIsZero = lastChar === '0';

        //remove first char from format
        if (!firstCharIsZero)
            format = format.replaceAll(firstChar, '');

        //remove last char from format
        if (!lastCharIsZero)
            format = format.replaceAll(lastChar, '');

        //split format to acquire decimal places
        formatSplitted = format.split('.');

        //set decimal places count
        decimalPlaces = formatSplitted.length === 2 ? formatSplitted[1].length : 0;

        //update format sign
        formatSign = lastChar === '0' ? 'f' : lastChar;

        //set d3 equivalent for given format
        d3Equi = (hasThousands ? ',' : '') + '.' + decimalPlaces + formatSign;

        //try to set formatting
        try {
            //set formatted value
            formatted = currencyStart + d3.format(d3Equi)(value) + currencyEnd;
            if (formatSign === 's')
                formatted = formatted.replaceAll('G', 'B');
        } catch (exp) {
            return d3.format('')(value);
        }

        //check whether the format was in parantheses
        if (inParantheses && value < 0)
            formatted = '(' + formatted + ')';

        //all formattings has done return the formatted value
        return formatted;
    };

    //adds date formatting
    eve.formatDate = function (value, format) {
        //check whehter the format is null
        if (arguments.length === 0) return '';
        if (!format)
            format = '%x';

        //declare needed variables
        let formatted = '',
            hasAM = format.indexOf('AM/PM'),
            yearFormat = '',
            monthFormat = '',
            dayFormat = '',
            hourFormat = '',
            minuteFormat = '',
            secondFormat = '';

        if (typeof value === "string")
            value = new Date(value);

        //clear am pm
        format = format.replaceAll('AM/PM', '%p');

        //set full year format
        if (format.indexOf('yyyy') > -1)
            format = format.replaceAll('yyyy', '%Y');

        //set abbr year format
        if (format.indexOf('yy') > -1)
            format = format.replaceAll('yy', '%y');

        //set full month name format
        if (format.indexOf('mmmm') > -1)
            format = format.replaceAll('mmmm', '%B');

        //set abbr month name format
        if (format.indexOf('mmm') > -1)
            format = format.replaceAll('mmm', '%b');

        //set minute format
        if (format.indexOf('mm') > -1)
            format = format.replaceAll('mm', '%m');

        //set full day name format
        if (format.indexOf('dddd') > -1)
            format = format.replaceAll('dddd', '%A');

        //set abbr day name format
        if (format.indexOf('ddd') > -1)
            format = format.replaceAll('ddd', '%a');

        //set numerical day format
        if (format.indexOf('d') > -1)
            format = format.replaceAll('d', '%e');

        //set hour format
        if (format.indexOf('hh') > -1) {
            if (hasAM)
                format = format.replaceAll('hh', '%I')
            else
                format = format.replaceAll('hh', '%H')
        }

        //set hour format
        if (format.indexOf('h') > -1) {
            if (hasAM)
                format = format.replaceAll('h', '%I')
            else
                format = format.replaceAll('h', '%H')
        }

        //set minute format
        format = format.replaceAll('%N', '%M');

        //set second format
        if (format.indexOf('ss') > -1)
            format = format.replaceAll('ss', '%S');

        //set formatted value
        formatted = d3.timeFormat(format)(value);

        //all formattings has done return the formatted value
        return formatted.trim();
    };

    //checks whether the vis data is valid
    eve.getVisDataType = function (data) {
        //get data type
        if (data == null)
            return null;

        //declare needed variables
        let dataType = eve.getType(data);

        //check whether the datatype is array
        if (dataType === 'array') {
            //get first record
            let firstRecord = data[0];
            let firstRecordType = eve.getType(firstRecord);

            //if first record can not be read then its an array
            if (!firstRecord)
                return "array";
            
            //check the first data has group and values key to determine if it is a multiples
            if (firstRecord.hasOwnProperty('group') && firstRecord.hasOwnProperty('values')) {
                //check values member is an array or object
                let valuesType = eve.getType(firstRecord.values);

                //check values type is an object
                if (valuesType === 'object') {
                    //check backward compatibility
                    if (firstRecord.values.dataArray) {
                        //check whether the first data has group and values key
                        if (firstRecord.values.dataArray.hasOwnProperty('links') && firstRecord.values.dataArray.hasOwnProperty('nodes'))
                            return 'multiplesSankey';

                        //check the type of dataArray
                        if (eve.getType(firstRecord.values.dataArray) === "array")
                            return "multiplesArray";
                    } else {
                        //check whether the first data has group and values key
                        if (firstRecord.values.hasOwnProperty('links') && firstRecord.values.hasOwnProperty('nodes'))
                            return 'multiplesSankey';
                    }

                    //if it is not a sankey type dataset then it is a tree based
                    return 'multiplesTree';
                }

                //get first value in
                return 'multiplesArray';
            }

            //so if data is not multiples and still it is a classical data array
            return 'classical';
        } else if (dataType === 'object') {
            //check whether the first data has group and values key
            if (data.hasOwnProperty('links') && data.hasOwnProperty('nodes'))
                return 'sankey';

            //if it is not a sankey type dataset then it is a tree based
            return 'tree';
        } else {
            return dataType;
        }

        //vis data type and data type should be same
        return null;
    };

    //parses the color and turns it to rgb if its not
    eve.parseColor = function (color) {
        return eve.getType(color) === 'string' ? (color.indexOf('#') !== -1 ? eve.hexToRgbString(color) : color) : color;
    };

    //renders the error message when vector tile request fails
    eve.renderVectorError = function (node) {
        let errText = d3.select(node).append('text')
            .style('font-size', '11px')
            .style('fill', 'red')
            .style('font-family', 'Tahoma, Arial, Helvetica, Ubuntu')
            .style('font-style', 'normal')
            .style('font-weight', 'bold')
            .style('text-anchor', 'middle')
            .text('Tile fetch failed. Please check your MapTiler information.')
            .attr('transform', 'translate(128,128)');
        errText.each(function () {
            let text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineIndex = 0,
                lineHeight = 1.1,
                y = text.attr("y"),
                dy = text.attr("dy") ? parseFloat(text.attr("dy")) : 0,
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");

            if (words.length > 1) {
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (lineIndex > 0 && tspan.node().getComputedTextLength() > 256) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        //lineHeight = lineIndex === 0 ? 0 : 1.1;
                        tspan = text.append("tspan")
                            .attr("x", 0)
                            .attr("y", y)
                            .attr("dy", lineHeight + dy + "em")
                            .text(word);
                    }
                    lineIndex++;
                }
            } else {
                //lineHeight = lineIndex === 0 ? 0 : 1.1;
                tspan = text.append("tspan")
                    .attr("x", 0)
                    .attr("y", y)
                    .attr("dy", dy + "em")
                    .text(words[0]);
            }
        });
    };

    //exports given json array as CSV
    eve.exportToCSV = function (data, fileTitle) {
        //check whether the file name is not empty
        if (fileTitle == null)
            fileTitle = "Visualization";

        //handle errors
        if (data == null || data.length <= 0)
            return;

        //set headers
        var headers = {};
        for (var key in data[0])
            headers[key] = key;

        //string builder for given row
        function convertToCSV(objArray) {
            var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
            var str = '';

            for (var i = 0; i < array.length; i++) {
                var line = '';
                var nullCheck = false;
                for (var index in array[i]) {
                    if (line != '' || nullCheck) line += ',';
                    nullCheck = false;
                    var val = array[i][index];
                    if (val != null)
                        line += val;
                    else
                        nullCheck = true;
                }

                str += line + '\r\n';
            }

            return str;
        }

        //exports given items
        function exportCSVFile(items) {
            //set headers
            if (headers)
                items.unshift(headers);

            // Convert Object to JSON
            var jsonObject = JSON.stringify(items);
            var csv = convertToCSV(jsonObject);
            var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

            var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            if (navigator.msSaveBlob) { // IE 10+
                navigator.msSaveBlob(blob, exportedFilenmae);
            } else {
                var link = document.createElement("a");
                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    var url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", exportedFilenmae);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        }

        //run the export functionality
        exportCSVFile(data);
    };

    //set xy chart template
    let tmpXY = [
        { x: 2001, col1: 15, col2: 25, col3: 10 },
        { x: 2002, col1: 5, col2: 10, col3: 2 },
        { x: 2003, col1: 7, col2: 40, col3: 61 },
        { x: 2004, col1: 11, col2: 12, col3: 13 },
        { x: 2005, col1: 17, col2: 5, col3: 9 }
    ];

    //set sliced chart template
    let tmpSliced = [
        { group: "Vysda", size: 25 },
        { group: "SpreadsheetWEB", size: 15 },
        { group: "Visart", size: 14 }
    ];

    //set map data
    let tmpMap = [
        { label: "AL", value: eve.randInt(1, 50) },
        { label: "AK", value: eve.randInt(1, 50) },
        { label: "AZ", value: eve.randInt(1, 50) },
        { label: "AR", value: eve.randInt(1, 50) },
        { label: "CA", value: eve.randInt(1, 50) },
        { label: "CO", value: eve.randInt(1, 50) },
        { label: "CT", value: eve.randInt(1, 50) },
        { label: "DE", value: eve.randInt(1, 50) },
        { label: "FL", value: eve.randInt(1, 50) },
        { label: "GA", value: eve.randInt(1, 50) },
        { label: "HI", value: eve.randInt(1, 50) },
        { label: "ID", value: eve.randInt(1, 50) },
        { label: "IL", value: eve.randInt(1, 50) },
        { label: "IN", value: eve.randInt(1, 50) },
        { label: "IA", value: eve.randInt(1, 50) },
        { label: "KS", value: eve.randInt(1, 50) },
        { label: "KY", value: eve.randInt(1, 50) },
        { label: "LA", value: eve.randInt(1, 50) },
        { label: "ME", value: eve.randInt(1, 50) },
        { label: "MD", value: eve.randInt(1, 50) },
        { label: "MA", value: eve.randInt(1, 50) },
        { label: "MI", value: eve.randInt(1, 50) },
        { label: "MN", value: eve.randInt(1, 50) },
        { label: "MS", value: eve.randInt(1, 50) },
        { label: "MO", value: eve.randInt(1, 50) },
        { label: "MT", value: eve.randInt(1, 50) },
        { label: "NE", value: eve.randInt(1, 50) },
        { label: "NV", value: eve.randInt(1, 50) },
        { label: "NH", value: eve.randInt(1, 50) },
        { label: "NJ", value: eve.randInt(1, 50) },
        { label: "NM", value: eve.randInt(1, 50) },
        { label: "NY", value: eve.randInt(1, 50) },
        { label: "NC", value: eve.randInt(1, 50) },
        { label: "ND", value: eve.randInt(1, 50) },
        { label: "OH", value: eve.randInt(1, 50) },
        { label: "OK", value: eve.randInt(1, 50) },
        { label: "OR", value: eve.randInt(1, 50) },
        { label: "PA", value: eve.randInt(1, 50) },
        { label: "RI", value: eve.randInt(1, 50) },
        { label: "SC", value: eve.randInt(1, 50) },
        { label: "SD", value: eve.randInt(1, 50) },
        { label: "TN", value: eve.randInt(1, 50) },
        { label: "TX", value: eve.randInt(1, 50) },
        { label: "UT", value: eve.randInt(1, 50) },
        { label: "VT", value: eve.randInt(1, 50) },
        { label: "VA", value: eve.randInt(1, 50) },
        { label: "WA", value: eve.randInt(1, 50) },
        { label: "WV", value: eve.randInt(1, 50) },
        { label: "WV", value: eve.randInt(1, 50) },
        { label: "WI", value: eve.randInt(1, 50) },
        { label: "WY", value: eve.randInt(1, 50) }
    ]

    //set latlong data
    let tmpLatLng = [
	    {
	        "latitude": -7.5,
	        "longitude": 164.9,
	        "group": "Group 1",
	        "isotime": "2012-12-26T12:00:00.000Z"
	    },
	    {
	        "latitude": -8.1,
	        "longitude": 164.2,
	        "group": "Group 1",
	        "isotime": "2012-12-26T18:00:00.000Z"
	    },
	    {
	        "latitude": -14,
	        "longitude": 114.3,
	        "group": "Group 2",
	        "isotime": "2012-12-27T00:00:00.000Z"
	    },
	    {
	        "latitude": -9,
	        "longitude": 164,
	        "group": "Group 1",
	        "isotime": "2012-12-27T00:00:00.000Z"
	    },
	    {
	        "latitude": -9.6,
	        "longitude": 163.3,
	        "group": "Group 1",
	        "isotime": "2012-12-27T06:00:00.000Z"
	    },
	    {
	        "latitude": -10.1,
	        "longitude": 162.5,
	        "group": "Group 1",
	        "isotime": "2012-12-27T12:00:00.000Z"
	    },
	    {
	        "latitude": -14,
	        "longitude": 112,
	        "group": "Group 2",
	        "isotime": "2012-12-27T16:00:00.000Z"
	    },
	    {
	        "latitude": -10.4,
	        "longitude": 161.9,
	        "group": "Group 1",
	        "isotime": "2012-12-27T18:00:00.000Z"
	    },
	    {
	        "latitude": -14.7,
	        "longitude": 111.7,
	        "group": "Group 2",
	        "isotime": "2012-12-28T00:00:00.000Z"
	    },
	    {
	        "latitude": -10.7,
	        "longitude": 161.4,
	        "group": "Group 1",
	        "isotime": "2012-12-28T00:00:00.000Z"
	    },
	    {
	        "latitude": -15.1,
	        "longitude": 111.7,
	        "group": "Group 2",
	        "isotime": "2012-12-28T03:00:00.000Z"
	    },
	    {
	        "latitude": -15.1,
	        "longitude": 111.7,
	        "group": "Group 2",
	        "isotime": "2012-12-28T06:00:00.000Z"
	    },
	    {
	        "latitude": -11,
	        "longitude": 160.9,
	        "group": "Group 1",
	        "isotime": "2012-12-28T06:00:00.000Z"
	    },
	    {
	        "latitude": -15.2,
	        "longitude": 111.7,
	        "group": "Group 2",
	        "isotime": "2012-12-28T10:00:00.000Z"
	    },
	    {
	        "latitude": -15.44,
	        "longitude": 111.46,
	        "group": "Group 2",
	        "isotime": "2012-12-28T12:00:00.000Z"
	    },
	    {
	        "latitude": -11.3,
	        "longitude": 160.5,
	        "group": "Group 1",
	        "isotime": "2012-12-28T12:00:00.000Z"
	    },
	    {
	        "latitude": -15.5,
	        "longitude": 111.4,
	        "group": "Group 2",
	        "isotime": "2012-12-28T12:30:00.000Z"
	    },
	    {
	        "latitude": -15.85,
	        "longitude": 111.33,
	        "group": "Group 2",
	        "isotime": "2012-12-28T15:00:00.000Z"
	    },
	    {
	        "latitude": -16.27,
	        "longitude": 111.23,
	        "group": "Group 2",
	        "isotime": "2012-12-28T18:00:00.000Z"
	    },
	    {
	        "latitude": -11.8,
	        "longitude": 160.2,
	        "group": "Group 1",
	        "isotime": "2012-12-28T18:00:00.000Z"
	    },
	    {
	        "latitude": -16.65,
	        "longitude": 111.05,
	        "group": "Group 2",
	        "isotime": "2012-12-28T19:39:00.000Z"
	    },
	    {
	        "latitude": -16.81,
	        "longitude": 110.96,
	        "group": "Group 2",
	        "isotime": "2012-12-28T21:00:00.000Z"
	    },
	    {
	        "latitude": -17,
	        "longitude": 110.85,
	        "group": "Group 2",
	        "isotime": "2012-12-28T22:34:00.000Z"
	    },
	    {
	        "latitude": -17.3,
	        "longitude": 110.7,
	        "group": "Group 2",
	        "isotime": "2012-12-29T00:00:00.000Z"
	    },
	    {
	        "latitude": -12.3,
	        "longitude": 159.9,
	        "group": "Group 1",
	        "isotime": "2012-12-29T00:00:00.000Z"
	    },
	    {
	        "latitude": -17.5,
	        "longitude": 110.6,
	        "group": "Group 2",
	        "isotime": "2012-12-29T03:00:00.000Z"
	    },
	    {
	        "latitude": -17.9,
	        "longitude": 110.3,
	        "group": "Group 2",
	        "isotime": "2012-12-29T06:00:00.000Z"
	    },
	    {
	        "latitude": -12.6,
	        "longitude": 159.9,
	        "group": "Group 1",
	        "isotime": "2012-12-29T06:00:00.000Z"
	    },
	    {
	        "latitude": -18.1,
	        "longitude": 110.15,
	        "group": "Group 2",
	        "isotime": "2012-12-29T07:30:00.000Z"
	    },
	    {
	        "latitude": -18.3,
	        "longitude": 110,
	        "group": "Group 2",
	        "isotime": "2012-12-29T09:00:00.000Z"
	    },
	    {
	        "latitude": -19,
	        "longitude": 110,
	        "group": "Group 2",
	        "isotime": "2012-12-29T12:00:00.000Z"
	    },
	    {
	        "latitude": -12.9,
	        "longitude": 160.2,
	        "group": "Group 1",
	        "isotime": "2012-12-29T12:00:00.000Z"
	    },
	    {
	        "latitude": -19.4,
	        "longitude": 110.1,
	        "group": "Group 2",
	        "isotime": "2012-12-29T15:00:00.000Z"
	    },
	    {
	        "latitude": -19.6,
	        "longitude": 110.1,
	        "group": "Group 2",
	        "isotime": "2012-12-29T16:26:00.000Z"
	    },
	    {
	        "latitude": -19.9,
	        "longitude": 110.2,
	        "group": "Group 2",
	        "isotime": "2012-12-29T18:00:00.000Z"
	    },
	    {
	        "latitude": -20.5,
	        "longitude": 110.2,
	        "group": "Group 2",
	        "isotime": "2012-12-29T21:00:00.000Z"
	    },
	    {
	        "latitude": -21.1,
	        "longitude": 110.2,
	        "group": "Group 2",
	        "isotime": "2012-12-30T00:00:00.000Z"
	    },
	    {
	        "latitude": -22.7,
	        "longitude": 110.1,
	        "group": "Group 2",
	        "isotime": "2012-12-30T06:00:00.000Z"
	    },
	    {
	        "latitude": -23.89,
	        "longitude": 109.62,
	        "group": "Group 2",
	        "isotime": "2012-12-30T12:00:00.000Z"
	    },
	    {
	        "latitude": -24.2,
	        "longitude": 109.5,
	        "group": "Group 2",
	        "isotime": "2012-12-30T13:38:00.000Z"
	    },
	    {
	        "latitude": -25.4,
	        "longitude": 109.2,
	        "group": "Group 2",
	        "isotime": "2012-12-30T17:14:00.000Z"
	    },
	    {
	        "latitude": -25.61,
	        "longitude": 109.04,
	        "group": "Group 2",
	        "isotime": "2012-12-30T18:00:00.000Z"
	    },
	    {
	        "latitude": -25.8,
	        "longitude": 108.9,
	        "group": "Group 2",
	        "isotime": "2012-12-30T18:43:00.000Z"
	    },
	    {
	        "latitude": -27.1,
	        "longitude": 108.2,
	        "group": "Group 2",
	        "isotime": "2012-12-31T00:00:00.000Z"
	    },
	    {
	        "latitude": -27.3,
	        "longitude": 108.1,
	        "group": "Group 2",
	        "isotime": "2012-12-31T01:30:00.000Z"
	    },
	    {
	        "latitude": -28.8,
	        "longitude": 108.3,
	        "group": "Group 2",
	        "isotime": "2012-12-31T07:30:00.000Z"
	    },
	    {
	        "latitude": -29.3,
	        "longitude": 108.5,
	        "group": "Group 2",
	        "isotime": "2012-12-31T10:30:00.000Z"
	    },
	    {
	        "latitude": -29.9,
	        "longitude": 108.65,
	        "group": "Group 2",
	        "isotime": "2012-12-31T12:00:00.000Z"
	    },
	    {
	        "latitude": -30.5,
	        "longitude": 108.8,
	        "group": "Group 2",
	        "isotime": "2012-12-31T13:30:00.000Z"
	    },
	    {
	        "latitude": -30.8,
	        "longitude": 108.8,
	        "group": "Group 2",
	        "isotime": "2012-12-31T16:30:00.000Z"
	    },
	    {
	        "latitude": -31.5,
	        "longitude": 109.92,
	        "group": "Group 2",
	        "isotime": "2012-12-31T19:30:00.000Z"
	    },
	    {
	        "latitude": -31.8,
	        "longitude": 110.5,
	        "group": "Group 2",
	        "isotime": "2012-12-31T21:30:00.000Z"
	    },
	    {
	        "latitude": -10,
	        "longitude": 125.8,
	        "group": "Group 2",
	        "isotime": "2013-01-05T00:00:00.000Z"
	    },
	    {
	        "latitude": -10,
	        "longitude": 126.3,
	        "group": "Group 2",
	        "isotime": "2013-01-05T06:00:00.000Z"
	    },
	    {
	        "latitude": -10.1,
	        "longitude": 126.4,
	        "group": "Group 2",
	        "isotime": "2013-01-05T12:00:00.000Z"
	    },
	    {
	        "latitude": -10.2,
	        "longitude": 126.3,
	        "group": "Group 2",
	        "isotime": "2013-01-05T18:00:00.000Z"
	    },
	    {
	        "latitude": -10.2,
	        "longitude": 125.8,
	        "group": "Group 2",
	        "isotime": "2013-01-06T00:00:00.000Z"
	    },
	    {
	        "latitude": -10.8,
	        "longitude": 125,
	        "group": "Group 2",
	        "isotime": "2013-01-06T06:00:00.000Z"
	    },
	    {
	        "latitude": -11,
	        "longitude": 124,
	        "group": "Group 2",
	        "isotime": "2013-01-06T12:00:00.000Z"
	    },
	    {
	        "latitude": -11.1,
	        "longitude": 122.5,
	        "group": "Group 2",
	        "isotime": "2013-01-06T18:00:00.000Z"
	    },
	    {
	        "latitude": -11.2,
	        "longitude": 122,
	        "group": "Group 2",
	        "isotime": "2013-01-06T21:00:00.000Z"
	    },
	    {
	        "latitude": -11.2,
	        "longitude": 121.7,
	        "group": "Group 2",
	        "isotime": "2013-01-07T00:00:00.000Z"
	    },
	    {
	        "latitude": -11.2,
	        "longitude": 121.3,
	        "group": "Group 2",
	        "isotime": "2013-01-07T03:00:00.000Z"
	    },
	    {
	        "latitude": -11.3,
	        "longitude": 121,
	        "group": "Group 2",
	        "isotime": "2013-01-07T06:00:00.000Z"
	    },
	    {
	        "latitude": -11.3,
	        "longitude": 120.8,
	        "group": "Group 2",
	        "isotime": "2013-01-07T09:00:00.000Z"
	    },
	    {
	        "latitude": -11.4,
	        "longitude": 120.5,
	        "group": "Group 2",
	        "isotime": "2013-01-07T12:00:00.000Z"
	    },
	    {
	        "latitude": -11.6,
	        "longitude": 120.2,
	        "group": "Group 2",
	        "isotime": "2013-01-07T15:00:00.000Z"
	    },
	    {
	        "latitude": -11.8,
	        "longitude": 120,
	        "group": "Group 2",
	        "isotime": "2013-01-07T18:00:00.000Z"
	    },
	    {
	        "latitude": -11.9,
	        "longitude": 119.8,
	        "group": "Group 2",
	        "isotime": "2013-01-07T21:00:00.000Z"
	    },
	    {
	        "latitude": -12,
	        "longitude": 119.3,
	        "group": "Group 2",
	        "isotime": "2013-01-08T00:00:00.000Z"
	    },
	    {
	        "latitude": -11.9,
	        "longitude": 119,
	        "group": "Group 2",
	        "isotime": "2013-01-08T03:00:00.000Z"
	    },
	    {
	        "latitude": -11.9,
	        "longitude": 118.4,
	        "group": "Group 2",
	        "isotime": "2013-01-08T06:00:00.000Z"
	    },
	    {
	        "latitude": -12.1,
	        "longitude": 118.1,
	        "group": "Group 2",
	        "isotime": "2013-01-08T09:00:00.000Z"
	    },
	    {
	        "latitude": -12.3,
	        "longitude": 117.8,
	        "group": "Group 2",
	        "isotime": "2013-01-08T12:00:00.000Z"
	    },
	    {
	        "latitude": -12.4,
	        "longitude": 117.4,
	        "group": "Group 2",
	        "isotime": "2013-01-08T15:00:00.000Z"
	    },
	    {
	        "latitude": -12.5,
	        "longitude": 117.1,
	        "group": "Group 2",
	        "isotime": "2013-01-08T18:00:00.000Z"
	    },
	    {
	        "latitude": -12.6,
	        "longitude": 116.8,
	        "group": "Group 2",
	        "isotime": "2013-01-08T21:00:00.000Z"
	    },
	    {
	        "latitude": -12.7,
	        "longitude": 116.6,
	        "group": "Group 2",
	        "isotime": "2013-01-09T00:00:00.000Z"
	    },
	    {
	        "latitude": -12.84,
	        "longitude": 116.48,
	        "group": "Group 2",
	        "isotime": "2013-01-09T03:00:00.000Z"
	    },
	    {
	        "latitude": -12.98,
	        "longitude": 116.35,
	        "group": "Group 2",
	        "isotime": "2013-01-09T06:00:00.000Z"
	    },
	    {
	        "latitude": -13.1,
	        "longitude": 116.21,
	        "group": "Group 2",
	        "isotime": "2013-01-09T09:00:00.000Z"
	    },
	    {
	        "latitude": -13.27,
	        "longitude": 116.07,
	        "group": "Group 2",
	        "isotime": "2013-01-09T12:00:00.000Z"
	    },
	    {
	        "latitude": -13.4,
	        "longitude": 116,
	        "group": "Group 2",
	        "isotime": "2013-01-09T15:00:00.000Z"
	    },
	    {
	        "latitude": -13.58,
	        "longitude": 115.95,
	        "group": "Group 2",
	        "isotime": "2013-01-09T18:00:00.000Z"
	    },
	    {
	        "latitude": -13.76,
	        "longitude": 115.91,
	        "group": "Group 2",
	        "isotime": "2013-01-09T21:00:00.000Z"
	    },
	    {
	        "latitude": -14,
	        "longitude": 115.8,
	        "group": "Group 2",
	        "isotime": "2013-01-10T00:00:00.000Z"
	    },
	    {
	        "latitude": -14.7,
	        "longitude": 115.7,
	        "group": "Group 2",
	        "isotime": "2013-01-10T03:00:00.000Z"
	    },
	    {
	        "latitude": -15.4,
	        "longitude": 115.4,
	        "group": "Group 2",
	        "isotime": "2013-01-10T06:00:00.000Z"
	    },
	    {
	        "latitude": -15.9,
	        "longitude": 115.1,
	        "group": "Group 2",
	        "isotime": "2013-01-10T09:00:00.000Z"
	    },
	    {
	        "latitude": -16.3,
	        "longitude": 114.9,
	        "group": "Group 2",
	        "isotime": "2013-01-10T12:00:00.000Z"
	    },
	    {
	        "latitude": -16.6,
	        "longitude": 114.7,
	        "group": "Group 2",
	        "isotime": "2013-01-10T15:00:00.000Z"
	    },
	    {
	        "latitude": -16.8,
	        "longitude": 114.3,
	        "group": "Group 2",
	        "isotime": "2013-01-10T18:00:00.000Z"
	    },
	    {
	        "latitude": -17,
	        "longitude": 114,
	        "group": "Group 2",
	        "isotime": "2013-01-10T21:00:00.000Z"
	    },
	    {
	        "latitude": -17.2,
	        "longitude": 113.8,
	        "group": "Group 2",
	        "isotime": "2013-01-11T00:00:00.000Z"
	    },
	    {
	        "latitude": -17.6,
	        "longitude": 113.1,
	        "group": "Group 2",
	        "isotime": "2013-01-11T06:00:00.000Z"
	    },
	    {
	        "latitude": -17.84,
	        "longitude": 112.82,
	        "group": "Group 2",
	        "isotime": "2013-01-11T09:00:00.000Z"
	    },
	    {
	        "latitude": -18.09,
	        "longitude": 112.54,
	        "group": "Group 2",
	        "isotime": "2013-01-11T12:00:00.000Z"
	    },
	    {
	        "latitude": -18.25,
	        "longitude": 112.4,
	        "group": "Group 2",
	        "isotime": "2013-01-11T15:00:00.000Z"
	    },
	    {
	        "latitude": -18.43,
	        "longitude": 112.1,
	        "group": "Group 2",
	        "isotime": "2013-01-11T18:00:00.000Z"
	    },
	    {
	        "latitude": -18.52,
	        "longitude": 112,
	        "group": "Group 2",
	        "isotime": "2013-01-11T21:00:00.000Z"
	    },
	    {
	        "latitude": -18.7,
	        "longitude": 112,
	        "group": "Group 2",
	        "isotime": "2013-01-12T00:00:00.000Z"
	    },
	    {
	        "latitude": -18.9,
	        "longitude": 111.9,
	        "group": "Group 2",
	        "isotime": "2013-01-12T03:00:00.000Z"
	    },
	    {
	        "latitude": -19.2,
	        "longitude": 111.8,
	        "group": "Group 2",
	        "isotime": "2013-01-12T06:00:00.000Z"
	    },
	    {
	        "latitude": -19.5,
	        "longitude": 111.6,
	        "group": "Group 2",
	        "isotime": "2013-01-12T09:00:00.000Z"
	    },
	    {
	        "latitude": -19.8,
	        "longitude": 111.5,
	        "group": "Group 2",
	        "isotime": "2013-01-12T12:00:00.000Z"
	    },
	    {
	        "latitude": -20.22,
	        "longitude": 111.35,
	        "group": "Group 2",
	        "isotime": "2013-01-12T15:00:00.000Z"
	    },
	    {
	        "latitude": -20.52,
	        "longitude": 111.2,
	        "group": "Group 2",
	        "isotime": "2013-01-12T18:00:00.000Z"
	    },
	    {
	        "latitude": -20.83,
	        "longitude": 111.1,
	        "group": "Group 2",
	        "isotime": "2013-01-12T21:00:00.000Z"
	    },
	    {
	        "latitude": -21.3,
	        "longitude": 111,
	        "group": "Group 2",
	        "isotime": "2013-01-13T00:00:00.000Z"
	    },
	    {
	        "latitude": -21.8,
	        "longitude": 110.7,
	        "group": "Group 2",
	        "isotime": "2013-01-13T03:00:00.000Z"
	    },
	    {
	        "latitude": -22.3,
	        "longitude": 110.4,
	        "group": "Group 2",
	        "isotime": "2013-01-13T06:00:00.000Z"
	    },
	    {
	        "latitude": -22.8,
	        "longitude": 110.2,
	        "group": "Group 2",
	        "isotime": "2013-01-13T09:00:00.000Z"
	    },
	    {
	        "latitude": -23.3,
	        "longitude": 110,
	        "group": "Group 2",
	        "isotime": "2013-01-13T12:00:00.000Z"
	    },
	    {
	        "latitude": -23.7,
	        "longitude": 109.85,
	        "group": "Group 2",
	        "isotime": "2013-01-13T15:00:00.000Z"
	    },
	    {
	        "latitude": -24.2,
	        "longitude": 109.7,
	        "group": "Group 2",
	        "isotime": "2013-01-13T18:00:00.000Z"
	    },
	    {
	        "latitude": -24.7,
	        "longitude": 109.65,
	        "group": "Group 2",
	        "isotime": "2013-01-13T21:00:00.000Z"
	    },
	    {
	        "latitude": -25.2,
	        "longitude": 109.6,
	        "group": "Group 2",
	        "isotime": "2013-01-14T00:00:00.000Z"
	    },
	    {
	        "latitude": -26.3,
	        "longitude": 109.7,
	        "group": "Group 2",
	        "isotime": "2013-01-14T06:00:00.000Z"
	    },
	    {
	        "latitude": -27.6,
	        "longitude": 109.4,
	        "group": "Group 2",
	        "isotime": "2013-01-14T12:00:00.000Z"
	    },
	    {
	        "latitude": -28.18,
	        "longitude": 109.3,
	        "group": "Group 2",
	        "isotime": "2013-01-14T15:00:00.000Z"
	    },
	    {
	        "latitude": -29.28,
	        "longitude": 109.1,
	        "group": "Group 2",
	        "isotime": "2013-01-14T18:00:00.000Z"
	    },
	    {
	        "latitude": -29.9,
	        "longitude": 109.1,
	        "group": "Group 2",
	        "isotime": "2013-01-15T00:00:00.000Z"
	    },
	    {
	        "latitude": -31,
	        "longitude": 109.4,
	        "group": "Group 2",
	        "isotime": "2013-01-15T06:00:00.000Z"
	    },
	    {
	        "latitude": -14,
	        "longitude": 138,
	        "group": "Group 1",
	        "isotime": "2013-01-17T12:00:00.000Z"
	    },
	    {
	        "latitude": -15.5,
	        "longitude": 138.5,
	        "group": "Group 1",
	        "isotime": "2013-01-17T18:00:00.000Z"
	    },
	    {
	        "latitude": -16.4,
	        "longitude": 138.5,
	        "group": "Group 1",
	        "isotime": "2013-01-18T00:00:00.000Z"
	    },
	    {
	        "latitude": -16.8,
	        "longitude": 138.5,
	        "group": "Group 1",
	        "isotime": "2013-01-18T06:00:00.000Z"
	    },
	    {
	        "latitude": -16.7,
	        "longitude": 137.9,
	        "group": "Group 1",
	        "isotime": "2013-01-18T12:00:00.000Z"
	    },
	    {
	        "latitude": -16.59,
	        "longitude": 136.75,
	        "group": "Group 1",
	        "isotime": "2013-01-18T18:00:00.000Z"
	    },
	    {
	        "latitude": -17.3,
	        "longitude": 135.4,
	        "group": "Group 1",
	        "isotime": "2013-01-19T00:00:00.000Z"
	    },
	    {
	        "latitude": -17.3,
	        "longitude": 135,
	        "group": "Group 1",
	        "isotime": "2013-01-19T03:00:00.000Z"
	    },
	    {
	        "latitude": -17.2,
	        "longitude": 134.7,
	        "group": "Group 2",
	        "isotime": "2013-01-19T06:00:00.000Z"
	    },
	    {
	        "latitude": -16.9,
	        "longitude": 134.6,
	        "group": "Group 2",
	        "isotime": "2013-01-19T12:00:00.000Z"
	    },
	    {
	        "latitude": -16.5,
	        "longitude": 134.7,
	        "group": "Group 2",
	        "isotime": "2013-01-19T18:00:00.000Z"
	    },
	    {
	        "latitude": -16.4,
	        "longitude": 135.8,
	        "group": "Group 1",
	        "isotime": "2013-01-20T00:00:00.000Z"
	    },
	    {
	        "latitude": -16.32,
	        "longitude": 136.41,
	        "group": "Group 1",
	        "isotime": "2013-01-20T03:00:00.000Z"
	    },
	    {
	        "latitude": -16.69,
	        "longitude": 123.45,
	        "group": "Group 2",
	        "isotime": "2013-01-20T06:00:00.000Z"
	    },
	    {
	        "latitude": -15.8,
	        "longitude": 136.4,
	        "group": "Group 1",
	        "isotime": "2013-01-20T06:00:00.000Z"
	    },
	    {
	        "latitude": -16.89,
	        "longitude": 123.19,
	        "group": "Group 2",
	        "isotime": "2013-01-20T09:00:00.000Z"
	    },
	    {
	        "latitude": -16.2,
	        "longitude": 137,
	        "group": "Group 1",
	        "isotime": "2013-01-20T10:00:00.000Z"
	    },
	    {
	        "latitude": -17.04,
	        "longitude": 123.02,
	        "group": "Group 2",
	        "isotime": "2013-01-20T12:00:00.000Z"
	    },
	    {
	        "latitude": -16.3,
	        "longitude": 137.6,
	        "group": "Group 1",
	        "isotime": "2013-01-20T12:00:00.000Z"
	    },
	    {
	        "latitude": -17.25,
	        "longitude": 122.9,
	        "group": "Group 2",
	        "isotime": "2013-01-20T15:00:00.000Z"
	    },
	    {
	        "latitude": -17.55,
	        "longitude": 122.74,
	        "group": "Group 2",
	        "isotime": "2013-01-20T18:00:00.000Z"
	    },
	    {
	        "latitude": -15.7,
	        "longitude": 139,
	        "group": "Group 1",
	        "isotime": "2013-01-20T18:00:00.000Z"
	    },
	    {
	        "latitude": -15.7,
	        "longitude": 139.8,
	        "group": "Group 1",
	        "isotime": "2013-01-20T21:00:00.000Z"
	    },
	    {
	        "latitude": -18,
	        "longitude": 122.5,
	        "group": "Group 2",
	        "isotime": "2013-01-21T00:00:00.000Z"
	    },
	    {
	        "latitude": -15.84,
	        "longitude": 140.16,
	        "group": "Group 1",
	        "isotime": "2013-01-21T00:00:00.000Z"
	    },
	    {
	        "latitude": -15.9,
	        "longitude": 140.4,
	        "group": "Group 1",
	        "isotime": "2013-01-21T02:00:00.000Z"
	    },
	    {
	        "latitude": -18.2,
	        "longitude": 122.3,
	        "group": "Group 2",
	        "isotime": "2013-01-21T03:00:00.000Z"
	    },
	    {
	        "latitude": -15.78,
	        "longitude": 140.6,
	        "group": "Group 1",
	        "isotime": "2013-01-21T03:00:00.000Z"
	    },
	    {
	        "latitude": -18.4,
	        "longitude": 122,
	        "group": "Group 2",
	        "isotime": "2013-01-21T06:00:00.000Z"
	    },
	    {
	        "latitude": -15.8,
	        "longitude": 141,
	        "group": "Group 1",
	        "isotime": "2013-01-21T06:00:00.000Z"
	    },
	    {
	        "latitude": -15.8,
	        "longitude": 141.1,
	        "group": "Group 1",
	        "isotime": "2013-01-21T08:30:00.000Z"
	    },
	    {
	        "latitude": -18.6,
	        "longitude": 121.7,
	        "group": "Group 2",
	        "isotime": "2013-01-21T09:00:00.000Z"
	    },
	    {
	        "latitude": -15.8,
	        "longitude": 141.1,
	        "group": "Group 1",
	        "isotime": "2013-01-21T09:00:00.000Z"
	    },
	    {
	        "latitude": -18.8,
	        "longitude": 121.4,
	        "group": "Group 2",
	        "isotime": "2013-01-21T12:00:00.000Z"
	    },
	    {
	        "latitude": -15.4,
	        "longitude": 141.4,
	        "group": "Group 1",
	        "isotime": "2013-01-21T12:00:00.000Z"
	    },
	    {
	        "latitude": -19.19,
	        "longitude": 121.15,
	        "group": "Group 2",
	        "isotime": "2013-01-21T15:00:00.000Z"
	    },
	    {
	        "latitude": -15.3,
	        "longitude": 141.6,
	        "group": "Group 1",
	        "isotime": "2013-01-21T15:00:00.000Z"
	    },
	    {
	        "latitude": -19.23,
	        "longitude": 120.95,
	        "group": "Group 2",
	        "isotime": "2013-01-21T18:00:00.000Z"
	    },
	    {
	        "latitude": -15,
	        "longitude": 141.7,
	        "group": "Group 1",
	        "isotime": "2013-01-21T18:00:00.000Z"
	    },
	    {
	        "latitude": -19.3,
	        "longitude": 120.5,
	        "group": "Group 2",
	        "isotime": "2013-01-21T21:00:00.000Z"
	    },
	    {
	        "latitude": -14.65,
	        "longitude": 141.84,
	        "group": "Group 1",
	        "isotime": "2013-01-21T21:00:00.000Z"
	    },
	    {
	        "latitude": -19.4,
	        "longitude": 120.1,
	        "group": "Group 2",
	        "isotime": "2013-01-22T00:00:00.000Z"
	    },
	    {
	        "latitude": -14.29,
	        "longitude": 142.1,
	        "group": "Group 1",
	        "isotime": "2013-01-22T00:00:00.000Z"
	    },
	    {
	        "latitude": -19.5,
	        "longitude": 119.8,
	        "group": "Group 2",
	        "isotime": "2013-01-22T03:00:00.000Z"
	    },
	    {
	        "latitude": -14,
	        "longitude": 142.6,
	        "group": "Group 1",
	        "isotime": "2013-01-22T03:00:00.000Z"
	    },
	    {
	        "latitude": -19.7,
	        "longitude": 119.4,
	        "group": "Group 2",
	        "isotime": "2013-01-22T06:00:00.000Z"
	    },
	    {
	        "latitude": -14.14,
	        "longitude": 143.27,
	        "group": "Group 1",
	        "isotime": "2013-01-22T06:00:00.000Z"
	    },
	    {
	        "latitude": -19.8,
	        "longitude": 118.8,
	        "group": "Group 2",
	        "isotime": "2013-01-22T09:00:00.000Z"
	    },
	    {
	        "latitude": -19.9,
	        "longitude": 118.55,
	        "group": "Group 2",
	        "isotime": "2013-01-22T12:00:00.000Z"
	    },
	    {
	        "latitude": -14.9,
	        "longitude": 144.7,
	        "group": "Group 1",
	        "isotime": "2013-01-22T12:00:00.000Z"
	    },
	    {
	        "latitude": -19.9,
	        "longitude": 118.35,
	        "group": "Group 2",
	        "isotime": "2013-01-22T13:00:00.000Z"
	    },
	    {
	        "latitude": -19.93,
	        "longitude": 118.1,
	        "group": "Group 2",
	        "isotime": "2013-01-22T14:00:00.000Z"
	    },
	    {
	        "latitude": -19.9,
	        "longitude": 117.9,
	        "group": "Group 2",
	        "isotime": "2013-01-22T15:00:00.000Z"
	    },
	    {
	        "latitude": -19.8,
	        "longitude": 117.9,
	        "group": "Group 2",
	        "isotime": "2013-01-22T18:00:00.000Z"
	    },
	    {
	        "latitude": -15.3,
	        "longitude": 144.9,
	        "group": "Group 1",
	        "isotime": "2013-01-22T18:00:00.000Z"
	    },
	    {
	        "latitude": -19.9,
	        "longitude": 117.8,
	        "group": "Group 2",
	        "isotime": "2013-01-22T21:00:00.000Z"
	    },
	    {
	        "latitude": -15.7,
	        "longitude": 144.7,
	        "group": "Group 1",
	        "isotime": "2013-01-22T21:00:00.000Z"
	    },
	    {
	        "latitude": -20.1,
	        "longitude": 117.7,
	        "group": "Group 2",
	        "isotime": "2013-01-23T00:00:00.000Z"
	    },
	    {
	        "latitude": -15.9,
	        "longitude": 144.6,
	        "group": "Group 1",
	        "isotime": "2013-01-23T00:00:00.000Z"
	    },
	    {
	        "latitude": -20.3,
	        "longitude": 117.5,
	        "group": "Group 2",
	        "isotime": "2013-01-23T03:00:00.000Z"
	    },
	    {
	        "latitude": -16.2,
	        "longitude": 144.5,
	        "group": "Group 1",
	        "isotime": "2013-01-23T03:00:00.000Z"
	    },
	    {
	        "latitude": -20.6,
	        "longitude": 117.3,
	        "group": "Group 2",
	        "isotime": "2013-01-23T06:00:00.000Z"
	    },
	    {
	        "latitude": -16.6,
	        "longitude": 144.6,
	        "group": "Group 1",
	        "isotime": "2013-01-23T06:00:00.000Z"
	    },
	    {
	        "latitude": -21,
	        "longitude": 117.1,
	        "group": "Group 2",
	        "isotime": "2013-01-23T09:00:00.000Z"
	    },
	    {
	        "latitude": -16.8,
	        "longitude": 144.8,
	        "group": "Group 1",
	        "isotime": "2013-01-23T09:00:00.000Z"
	    },
	    {
	        "latitude": -17,
	        "longitude": 145.02,
	        "group": "Group 1",
	        "isotime": "2013-01-23T12:00:00.000Z"
	    },
	    {
	        "latitude": -17.3,
	        "longitude": 145.3,
	        "group": "Group 1",
	        "isotime": "2013-01-23T15:00:00.000Z"
	    },
	    {
	        "latitude": -17.8,
	        "longitude": 145.3,
	        "group": "Group 1",
	        "isotime": "2013-01-23T18:00:00.000Z"
	    },
	    {
	        "latitude": -18.4,
	        "longitude": 145.6,
	        "group": "Group 1",
	        "isotime": "2013-01-23T21:00:00.000Z"
	    },
	    {
	        "latitude": -18.8,
	        "longitude": 146.2,
	        "group": "Group 1",
	        "isotime": "2013-01-24T00:00:00.000Z"
	    },
	    {
	        "latitude": -19.4,
	        "longitude": 146.6,
	        "group": "Group 1",
	        "isotime": "2013-01-24T03:00:00.000Z"
	    },
	    {
	        "latitude": -19.9,
	        "longitude": 146.9,
	        "group": "Group 1",
	        "isotime": "2013-01-24T06:00:00.000Z"
	    },
	    {
	        "latitude": -20.71,
	        "longitude": 147.8,
	        "group": "Group 1",
	        "isotime": "2013-01-24T12:00:00.000Z"
	    },
	    {
	        "latitude": -21.1,
	        "longitude": 147.9,
	        "group": "Group 1",
	        "isotime": "2013-01-24T15:00:00.000Z"
	    },
	    {
	        "latitude": -21.3,
	        "longitude": 148,
	        "group": "Group 1",
	        "isotime": "2013-01-24T18:00:00.000Z"
	    },
	    {
	        "latitude": -22,
	        "longitude": 148.5,
	        "group": "Group 1",
	        "isotime": "2013-01-25T00:00:00.000Z"
	    },
	    {
	        "latitude": -22.8,
	        "longitude": 149,
	        "group": "Group 1",
	        "isotime": "2013-01-25T04:00:00.000Z"
	    },
	    {
	        "latitude": -23,
	        "longitude": 149,
	        "group": "Group 1",
	        "isotime": "2013-01-25T06:00:00.000Z"
	    },
	    {
	        "latitude": -23,
	        "longitude": 149,
	        "group": "Group 1",
	        "isotime": "2013-01-25T12:00:00.000Z"
	    },
	    {
	        "latitude": -23,
	        "longitude": 148.6,
	        "group": "Group 1",
	        "isotime": "2013-01-26T00:00:00.000Z"
	    },
	    {
	        "latitude": -23.1,
	        "longitude": 148.7,
	        "group": "Group 1",
	        "isotime": "2013-01-26T03:00:00.000Z"
	    },
	    {
	        "latitude": -23.4,
	        "longitude": 148.9,
	        "group": "Group 1",
	        "isotime": "2013-01-26T06:00:00.000Z"
	    },
	    {
	        "latitude": -23.7,
	        "longitude": 149.1,
	        "group": "Group 1",
	        "isotime": "2013-01-26T09:00:00.000Z"
	    },
	    {
	        "latitude": -23.7,
	        "longitude": 149.3,
	        "group": "Group 1",
	        "isotime": "2013-01-26T12:00:00.000Z"
	    },
	    {
	        "latitude": -23.9,
	        "longitude": 149.6,
	        "group": "Group 1",
	        "isotime": "2013-01-26T15:00:00.000Z"
	    },
	    {
	        "latitude": -24.2,
	        "longitude": 150,
	        "group": "Group 1",
	        "isotime": "2013-01-26T18:00:00.000Z"
	    },
	    {
	        "latitude": -24.7,
	        "longitude": 150,
	        "group": "Group 1",
	        "isotime": "2013-01-26T21:00:00.000Z"
	    },
	    {
	        "latitude": -25.2,
	        "longitude": 150,
	        "group": "Group 1",
	        "isotime": "2013-01-26T23:00:00.000Z"
	    },
	    {
	        "latitude": -25.7,
	        "longitude": 150,
	        "group": "Group 1",
	        "isotime": "2013-01-27T00:00:00.000Z"
	    },
	    {
	        "latitude": -26,
	        "longitude": 150,
	        "group": "Group 1",
	        "isotime": "2013-01-27T01:00:00.000Z"
	    },
	    {
	        "latitude": -26.3,
	        "longitude": 150,
	        "group": "Group 1",
	        "isotime": "2013-01-27T02:00:00.000Z"
	    },
	    {
	        "latitude": -26.6,
	        "longitude": 150.3,
	        "group": "Group 1",
	        "isotime": "2013-01-27T05:00:00.000Z"
	    },
	    {
	        "latitude": -26.8,
	        "longitude": 150.6,
	        "group": "Group 1",
	        "isotime": "2013-01-27T09:00:00.000Z"
	    },
	    {
	        "latitude": -26.9,
	        "longitude": 150.9,
	        "group": "Group 1",
	        "isotime": "2013-01-27T12:00:00.000Z"
	    },
	    {
	        "latitude": -27,
	        "longitude": 150.9,
	        "group": "Group 1",
	        "isotime": "2013-01-27T15:00:00.000Z"
	    },
	    {
	        "latitude": -26.9,
	        "longitude": 151.1,
	        "group": "Group 1",
	        "isotime": "2013-01-27T18:00:00.000Z"
	    },
	    {
	        "latitude": -27.1,
	        "longitude": 150.8,
	        "group": "Group 1",
	        "isotime": "2013-01-27T21:00:00.000Z"
	    },
	    {
	        "latitude": -27.3,
	        "longitude": 151.1,
	        "group": "Group 1",
	        "isotime": "2013-01-28T00:00:00.000Z"
	    },
	    {
	        "latitude": -27.9,
	        "longitude": 151.1,
	        "group": "Group 1",
	        "isotime": "2013-01-28T03:00:00.000Z"
	    },
	    {
	        "latitude": -28.9,
	        "longitude": 150.9,
	        "group": "Group 1",
	        "isotime": "2013-01-28T06:00:00.000Z"
	    },
	    {
	        "latitude": -30,
	        "longitude": 151,
	        "group": "Group 1",
	        "isotime": "2013-01-28T09:00:00.000Z"
	    },
	    {
	        "latitude": -31.1,
	        "longitude": 151.1,
	        "group": "Group 1",
	        "isotime": "2013-01-28T12:00:00.000Z"
	    },
	    {
	        "latitude": -13.3,
	        "longitude": 122.5,
	        "group": "Group 2",
	        "isotime": "2013-02-22T00:00:00.000Z"
	    },
	    {
	        "latitude": -13.3,
	        "longitude": 122.3,
	        "group": "Group 2",
	        "isotime": "2013-02-22T03:00:00.000Z"
	    },
	    {
	        "latitude": -13.5,
	        "longitude": 121.5,
	        "group": "Group 2",
	        "isotime": "2013-02-22T06:00:00.000Z"
	    },
	    {
	        "latitude": -13.7,
	        "longitude": 121.1,
	        "group": "Group 2",
	        "isotime": "2013-02-22T09:00:00.000Z"
	    },
	    {
	        "latitude": -14.26,
	        "longitude": 120.3,
	        "group": "Group 2",
	        "isotime": "2013-02-22T12:00:00.000Z"
	    },
	    {
	        "latitude": -14.9,
	        "longitude": 119.6,
	        "group": "Group 2",
	        "isotime": "2013-02-22T18:00:00.000Z"
	    },
	    {
	        "latitude": -15.5,
	        "longitude": 118.8,
	        "group": "Group 2",
	        "isotime": "2013-02-23T00:00:00.000Z"
	    },
	    {
	        "latitude": -15.6,
	        "longitude": 118.5,
	        "group": "Group 2",
	        "isotime": "2013-02-23T06:00:00.000Z"
	    },
	    {
	        "latitude": -15.8,
	        "longitude": 118.45,
	        "group": "Group 2",
	        "isotime": "2013-02-23T12:00:00.000Z"
	    },
	    {
	        "latitude": -15.9,
	        "longitude": 118.46,
	        "group": "Group 2",
	        "isotime": "2013-02-23T13:13:00.000Z"
	    },
	    {
	        "latitude": -16.3,
	        "longitude": 118.4,
	        "group": "Group 2",
	        "isotime": "2013-02-23T16:25:00.000Z"
	    },
	    {
	        "latitude": -16.4,
	        "longitude": 118.4,
	        "group": "Group 2",
	        "isotime": "2013-02-23T18:00:00.000Z"
	    },
	    {
	        "latitude": -16.7,
	        "longitude": 118.3,
	        "group": "Group 2",
	        "isotime": "2013-02-24T00:00:00.000Z"
	    },
	    {
	        "latitude": -16.9,
	        "longitude": 118.2,
	        "group": "Group 2",
	        "isotime": "2013-02-24T03:00:00.000Z"
	    },
	    {
	        "latitude": -17.1,
	        "longitude": 118.2,
	        "group": "Group 2",
	        "isotime": "2013-02-24T06:00:00.000Z"
	    },
	    {
	        "latitude": -17.2,
	        "longitude": 118.3,
	        "group": "Group 2",
	        "isotime": "2013-02-24T09:00:00.000Z"
	    },
	    {
	        "latitude": -17.3,
	        "longitude": 118.45,
	        "group": "Group 2",
	        "isotime": "2013-02-24T12:00:00.000Z"
	    },
	    {
	        "latitude": -17.45,
	        "longitude": 118.6,
	        "group": "Group 2",
	        "isotime": "2013-02-24T15:00:00.000Z"
	    },
	    {
	        "latitude": -17.5,
	        "longitude": 118.7,
	        "group": "Group 2",
	        "isotime": "2013-02-24T18:00:00.000Z"
	    },
	    {
	        "latitude": -17.55,
	        "longitude": 118.8,
	        "group": "Group 2",
	        "isotime": "2013-02-24T21:00:00.000Z"
	    },
	    {
	        "latitude": -17.6,
	        "longitude": 118.85,
	        "group": "Group 2",
	        "isotime": "2013-02-25T00:00:00.000Z"
	    },
	    {
	        "latitude": -17.7,
	        "longitude": 118.95,
	        "group": "Group 2",
	        "isotime": "2013-02-25T03:00:00.000Z"
	    },
	    {
	        "latitude": -17.8,
	        "longitude": 119,
	        "group": "Group 2",
	        "isotime": "2013-02-25T06:00:00.000Z"
	    },
	    {
	        "latitude": -18.1,
	        "longitude": 119.05,
	        "group": "Group 2",
	        "isotime": "2013-02-25T09:00:00.000Z"
	    },
	    {
	        "latitude": -18.3,
	        "longitude": 119.1,
	        "group": "Group 2",
	        "isotime": "2013-02-25T12:00:00.000Z"
	    },
	    {
	        "latitude": -18.5,
	        "longitude": 119.1,
	        "group": "Group 2",
	        "isotime": "2013-02-25T15:00:00.000Z"
	    },
	    {
	        "latitude": -18.7,
	        "longitude": 119.2,
	        "group": "Group 2",
	        "isotime": "2013-02-25T18:00:00.000Z"
	    },
	    {
	        "latitude": -18.9,
	        "longitude": 119.2,
	        "group": "Group 2",
	        "isotime": "2013-02-25T21:00:00.000Z"
	    },
	    {
	        "latitude": -18.9,
	        "longitude": 119.2,
	        "group": "Group 2",
	        "isotime": "2013-02-26T00:00:00.000Z"
	    },
	    {
	        "latitude": -19.15,
	        "longitude": 119.1,
	        "group": "Group 2",
	        "isotime": "2013-02-26T03:00:00.000Z"
	    },
	    {
	        "latitude": -19.2,
	        "longitude": 119.1,
	        "group": "Group 2",
	        "isotime": "2013-02-26T06:00:00.000Z"
	    },
	    {
	        "latitude": -19.2,
	        "longitude": 119.1,
	        "group": "Group 2",
	        "isotime": "2013-02-26T09:00:00.000Z"
	    },
	    {
	        "latitude": -19.2,
	        "longitude": 119.1,
	        "group": "Group 2",
	        "isotime": "2013-02-26T12:00:00.000Z"
	    },
	    {
	        "latitude": -19.2,
	        "longitude": 119.1,
	        "group": "Group 2",
	        "isotime": "2013-02-26T15:00:00.000Z"
	    },
	    {
	        "latitude": -19.25,
	        "longitude": 119.15,
	        "group": "Group 2",
	        "isotime": "2013-02-26T18:00:00.000Z"
	    },
	    {
	        "latitude": -19.3,
	        "longitude": 119.2,
	        "group": "Group 2",
	        "isotime": "2013-02-26T21:00:00.000Z"
	    },
	    {
	        "latitude": -19.3,
	        "longitude": 119.3,
	        "group": "Group 2",
	        "isotime": "2013-02-27T00:00:00.000Z"
	    },
	    {
	        "latitude": -19.6,
	        "longitude": 119.4,
	        "group": "Group 2",
	        "isotime": "2013-02-27T03:00:00.000Z"
	    },
	    {
	        "latitude": -19.8,
	        "longitude": 119.5,
	        "group": "Group 2",
	        "isotime": "2013-02-27T06:00:00.000Z"
	    },
	    {
	        "latitude": -20,
	        "longitude": 119.6,
	        "group": "Group 2",
	        "isotime": "2013-02-27T09:00:00.000Z"
	    },
	    {
	        "latitude": -20.2,
	        "longitude": 119.8,
	        "group": "Group 2",
	        "isotime": "2013-02-27T12:00:00.000Z"
	    },
	    {
	        "latitude": -20.4,
	        "longitude": 120,
	        "group": "Group 2",
	        "isotime": "2013-02-27T15:00:00.000Z"
	    },
	    {
	        "latitude": -20.6,
	        "longitude": 120.1,
	        "group": "Group 2",
	        "isotime": "2013-02-27T18:00:00.000Z"
	    },
	    {
	        "latitude": -20.9,
	        "longitude": 120.3,
	        "group": "Group 2",
	        "isotime": "2013-02-27T21:00:00.000Z"
	    },
	    {
	        "latitude": -21.1,
	        "longitude": 120.35,
	        "group": "Group 2",
	        "isotime": "2013-02-28T00:00:00.000Z"
	    },
	    {
	        "latitude": -21.7,
	        "longitude": 120.5,
	        "group": "Group 2",
	        "isotime": "2013-02-28T03:00:00.000Z"
	    },
	    {
	        "latitude": -22,
	        "longitude": 120.55,
	        "group": "Group 2",
	        "isotime": "2013-02-28T06:00:00.000Z"
	    },
	    {
	        "latitude": -13,
	        "longitude": 135,
	        "group": "Group 1",
	        "isotime": "2013-03-10T06:00:00.000Z"
	    },
	    {
	        "latitude": -12.8,
	        "longitude": 135.3,
	        "group": "Group 1",
	        "isotime": "2013-03-10T09:00:00.000Z"
	    },
	    {
	        "latitude": -12.7,
	        "longitude": 135.8,
	        "group": "Group 1",
	        "isotime": "2013-03-10T12:00:00.000Z"
	    },
	    {
	        "latitude": -12.5,
	        "longitude": 136.3,
	        "group": "Group 1",
	        "isotime": "2013-03-10T15:00:00.000Z"
	    },
	    {
	        "latitude": -12.2,
	        "longitude": 136.8,
	        "group": "Group 1",
	        "isotime": "2013-03-10T18:00:00.000Z"
	    },
	    {
	        "latitude": -12,
	        "longitude": 137.3,
	        "group": "Group 1",
	        "isotime": "2013-03-10T21:00:00.000Z"
	    },
	    {
	        "latitude": -12,
	        "longitude": 137.3,
	        "group": "Group 1",
	        "isotime": "2013-03-11T00:00:00.000Z"
	    },
	    {
	        "latitude": -12.1,
	        "longitude": 136.9,
	        "group": "Group 1",
	        "isotime": "2013-03-11T03:00:00.000Z"
	    },
	    {
	        "latitude": -12.2,
	        "longitude": 136.8,
	        "group": "Group 1",
	        "isotime": "2013-03-11T06:00:00.000Z"
	    },
	    {
	        "latitude": -12.3,
	        "longitude": 136.9,
	        "group": "Group 1",
	        "isotime": "2013-03-11T09:00:00.000Z"
	    },
	    {
	        "latitude": -12.5,
	        "longitude": 138,
	        "group": "Group 1",
	        "isotime": "2013-03-11T12:00:00.000Z"
	    },
	    {
	        "latitude": -12.5,
	        "longitude": 138.4,
	        "group": "Group 1",
	        "isotime": "2013-03-11T15:00:00.000Z"
	    },
	    {
	        "latitude": -12.4,
	        "longitude": 138.7,
	        "group": "Group 1",
	        "isotime": "2013-03-11T18:00:00.000Z"
	    },
	    {
	        "latitude": -12.3,
	        "longitude": 138.8,
	        "group": "Group 1",
	        "isotime": "2013-03-11T21:00:00.000Z"
	    },
	    {
	        "latitude": -12,
	        "longitude": 138.9,
	        "group": "Group 1",
	        "isotime": "2013-03-12T00:00:00.000Z"
	    },
	    {
	        "latitude": -11.5,
	        "longitude": 139,
	        "group": "Group 1",
	        "isotime": "2013-03-12T03:00:00.000Z"
	    },
	    {
	        "latitude": -11.4,
	        "longitude": 139.5,
	        "group": "Group 1",
	        "isotime": "2013-03-12T06:00:00.000Z"
	    },
	    {
	        "latitude": -11.3,
	        "longitude": 139.8,
	        "group": "Group 1",
	        "isotime": "2013-03-12T09:00:00.000Z"
	    },
	    {
	        "latitude": -11,
	        "longitude": 140.3,
	        "group": "Group 1",
	        "isotime": "2013-03-12T12:00:00.000Z"
	    },
	    {
	        "latitude": -11.3,
	        "longitude": 141.2,
	        "group": "Group 1",
	        "isotime": "2013-03-12T15:00:00.000Z"
	    },
	    {
	        "latitude": -11.6,
	        "longitude": 141.9,
	        "group": "Group 1",
	        "isotime": "2013-03-12T18:00:00.000Z"
	    },
	    {
	        "latitude": -11.6,
	        "longitude": 142.5,
	        "group": "Group 1",
	        "isotime": "2013-03-12T21:00:00.000Z"
	    },
	    {
	        "latitude": -11.6,
	        "longitude": 143.1,
	        "group": "Group 1",
	        "isotime": "2013-03-13T00:00:00.000Z"
	    },
	    {
	        "latitude": -11.9,
	        "longitude": 143.6,
	        "group": "Group 1",
	        "isotime": "2013-03-13T03:00:00.000Z"
	    },
	    {
	        "latitude": -12.3,
	        "longitude": 144.4,
	        "group": "Group 1",
	        "isotime": "2013-03-13T06:00:00.000Z"
	    },
	    {
	        "latitude": -12.33,
	        "longitude": 145.25,
	        "group": "Group 1",
	        "isotime": "2013-03-13T09:00:00.000Z"
	    },
	    {
	        "latitude": -12.19,
	        "longitude": 146.45,
	        "group": "Group 1",
	        "isotime": "2013-03-13T12:00:00.000Z"
	    },
	    {
	        "latitude": -12.75,
	        "longitude": 147.14,
	        "group": "Group 1",
	        "isotime": "2013-03-13T15:00:00.000Z"
	    },
	    {
	        "latitude": -13.27,
	        "longitude": 147.5,
	        "group": "Group 1",
	        "isotime": "2013-03-13T18:00:00.000Z"
	    },
	    {
	        "latitude": -13.72,
	        "longitude": 148.18,
	        "group": "Group 1",
	        "isotime": "2013-03-13T21:00:00.000Z"
	    },
	    {
	        "latitude": -14.19,
	        "longitude": 148.5,
	        "group": "Group 1",
	        "isotime": "2013-03-14T00:00:00.000Z"
	    },
	    {
	        "latitude": -14.68,
	        "longitude": 149.27,
	        "group": "Group 1",
	        "isotime": "2013-03-14T03:00:00.000Z"
	    },
	    {
	        "latitude": -14.9,
	        "longitude": 149.9,
	        "group": "Group 1",
	        "isotime": "2013-03-14T06:00:00.000Z"
	    },
	    {
	        "latitude": -15.2,
	        "longitude": 150.5,
	        "group": "Group 1",
	        "isotime": "2013-03-14T09:00:00.000Z"
	    },
	    {
	        "latitude": -15.3,
	        "longitude": 151.1,
	        "group": "Group 1",
	        "isotime": "2013-03-14T12:00:00.000Z"
	    },
	    {
	        "latitude": -15.4,
	        "longitude": 151.7,
	        "group": "Group 1",
	        "isotime": "2013-03-14T15:00:00.000Z"
	    },
	    {
	        "latitude": -15.35,
	        "longitude": 152.09,
	        "group": "Group 1",
	        "isotime": "2013-03-14T18:00:00.000Z"
	    },
	    {
	        "latitude": -15.46,
	        "longitude": 152.86,
	        "group": "Group 1",
	        "isotime": "2013-03-14T21:00:00.000Z"
	    },
	    {
	        "latitude": -15.81,
	        "longitude": 153.28,
	        "group": "Group 1",
	        "isotime": "2013-03-15T00:00:00.000Z"
	    },
	    {
	        "latitude": -15.9,
	        "longitude": 153.6,
	        "group": "Group 1",
	        "isotime": "2013-03-15T03:00:00.000Z"
	    },
	    {
	        "latitude": -16.1,
	        "longitude": 154,
	        "group": "Group 1",
	        "isotime": "2013-03-15T06:00:00.000Z"
	    },
	    {
	        "latitude": -16.2,
	        "longitude": 154.1,
	        "group": "Group 1",
	        "isotime": "2013-03-15T09:00:00.000Z"
	    },
	    {
	        "latitude": -16.3,
	        "longitude": 154.2,
	        "group": "Group 1",
	        "isotime": "2013-03-15T12:00:00.000Z"
	    },
	    {
	        "latitude": -16.5,
	        "longitude": 154.3,
	        "group": "Group 1",
	        "isotime": "2013-03-15T18:00:00.000Z"
	    },
	    {
	        "latitude": -16.8,
	        "longitude": 154.2,
	        "group": "Group 1",
	        "isotime": "2013-03-15T21:00:00.000Z"
	    },
	    {
	        "latitude": -16.9,
	        "longitude": 154.1,
	        "group": "Group 1",
	        "isotime": "2013-03-16T00:00:00.000Z"
	    },
	    {
	        "latitude": -17.1,
	        "longitude": 154,
	        "group": "Group 1",
	        "isotime": "2013-03-16T03:00:00.000Z"
	    },
	    {
	        "latitude": -17.1,
	        "longitude": 153.9,
	        "group": "Group 1",
	        "isotime": "2013-03-16T06:00:00.000Z"
	    },
	    {
	        "latitude": -17.4,
	        "longitude": 153.7,
	        "group": "Group 1",
	        "isotime": "2013-03-16T12:00:00.000Z"
	    },
	    {
	        "latitude": -17.7,
	        "longitude": 153.5,
	        "group": "Group 1",
	        "isotime": "2013-03-16T18:00:00.000Z"
	    },
	    {
	        "latitude": -18.4,
	        "longitude": 153.3,
	        "group": "Group 1",
	        "isotime": "2013-03-17T00:00:00.000Z"
	    },
	    {
	        "latitude": -18.7,
	        "longitude": 153,
	        "group": "Group 1",
	        "isotime": "2013-03-17T06:00:00.000Z"
	    },
	    {
	        "latitude": -18.9,
	        "longitude": 152.6,
	        "group": "Group 1",
	        "isotime": "2013-03-17T12:00:00.000Z"
	    },
	    {
	        "latitude": -19.1,
	        "longitude": 152.3,
	        "group": "Group 1",
	        "isotime": "2013-03-17T18:00:00.000Z"
	    },
	    {
	        "latitude": -19.1,
	        "longitude": 152.1,
	        "group": "Group 1",
	        "isotime": "2013-03-18T00:00:00.000Z"
	    },
	    {
	        "latitude": -19.3,
	        "longitude": 152,
	        "group": "Group 1",
	        "isotime": "2013-03-18T06:00:00.000Z"
	    },
	    {
	        "latitude": -19.1,
	        "longitude": 151.7,
	        "group": "Group 1",
	        "isotime": "2013-03-18T12:00:00.000Z"
	    },
	    {
	        "latitude": -19.1,
	        "longitude": 151.4,
	        "group": "Group 1",
	        "isotime": "2013-03-18T18:00:00.000Z"
	    },
	    {
	        "latitude": -19,
	        "longitude": 150.9,
	        "group": "Group 1",
	        "isotime": "2013-03-19T00:00:00.000Z"
	    },
	    {
	        "latitude": -19.6,
	        "longitude": 150.5,
	        "group": "Group 1",
	        "isotime": "2013-03-19T06:00:00.000Z"
	    },
	    {
	        "latitude": -19.6,
	        "longitude": 149.9,
	        "group": "Group 1",
	        "isotime": "2013-03-19T12:00:00.000Z"
	    },
	    {
	        "latitude": -19.3,
	        "longitude": 149.3,
	        "group": "Group 1",
	        "isotime": "2013-03-19T18:00:00.000Z"
	    },
	    {
	        "latitude": -18.6,
	        "longitude": 148.9,
	        "group": "Group 1",
	        "isotime": "2013-03-19T21:00:00.000Z"
	    },
	    {
	        "latitude": -18.3,
	        "longitude": 148.6,
	        "group": "Group 1",
	        "isotime": "2013-03-20T00:00:00.000Z"
	    },
	    {
	        "latitude": -18.2,
	        "longitude": 148.3,
	        "group": "Group 1",
	        "isotime": "2013-03-20T03:00:00.000Z"
	    },
	    {
	        "latitude": -18.1,
	        "longitude": 148,
	        "group": "Group 1",
	        "isotime": "2013-03-20T06:00:00.000Z"
	    },
	    {
	        "latitude": -18,
	        "longitude": 147.06,
	        "group": "Group 1",
	        "isotime": "2013-03-20T12:00:00.000Z"
	    },
	    {
	        "latitude": -17.6,
	        "longitude": 146.1,
	        "group": "Group 1",
	        "isotime": "2013-03-20T18:00:00.000Z"
	    },
	    {
	        "latitude": -7,
	        "longitude": 99,
	        "group": "Group 2",
	        "isotime": "2013-04-07T06:00:00.000Z"
	    },
	    {
	        "latitude": -9.34,
	        "longitude": 101.32,
	        "group": "Group 2",
	        "isotime": "2013-04-08T02:11:00.000Z"
	    },
	    {
	        "latitude": -9.5,
	        "longitude": 101.4,
	        "group": "Group 2",
	        "isotime": "2013-04-08T06:00:00.000Z"
	    },
	    {
	        "latitude": -9.76,
	        "longitude": 101.92,
	        "group": "Group 2",
	        "isotime": "2013-04-08T12:00:00.000Z"
	    },
	    {
	        "latitude": -10.43,
	        "longitude": 102.1,
	        "group": "Group 2",
	        "isotime": "2013-04-08T18:00:00.000Z"
	    },
	    {
	        "latitude": -11.5,
	        "longitude": 102.4,
	        "group": "Group 2",
	        "isotime": "2013-04-09T00:00:00.000Z"
	    },
	    {
	        "latitude": -12.3,
	        "longitude": 102.7,
	        "group": "Group 2",
	        "isotime": "2013-04-09T06:00:00.000Z"
	    },
	    {
	        "latitude": -13.2,
	        "longitude": 103.2,
	        "group": "Group 2",
	        "isotime": "2013-04-09T12:00:00.000Z"
	    },
	    {
	        "latitude": -14.1,
	        "longitude": 103.4,
	        "group": "Group 2",
	        "isotime": "2013-04-09T18:00:00.000Z"
	    },
	    {
	        "latitude": -14.9,
	        "longitude": 103.4,
	        "group": "Group 2",
	        "isotime": "2013-04-10T00:00:00.000Z"
	    },
	    {
	        "latitude": -15.6,
	        "longitude": 103.7,
	        "group": "Group 2",
	        "isotime": "2013-04-10T06:00:00.000Z"
	    },
	    {
	        "latitude": -16.2,
	        "longitude": 104.1,
	        "group": "Group 2",
	        "isotime": "2013-04-10T12:00:00.000Z"
	    },
	    {
	        "latitude": -16.6,
	        "longitude": 104.5,
	        "group": "Group 2",
	        "isotime": "2013-04-10T18:00:00.000Z"
	    },
	    {
	        "latitude": -17.5,
	        "longitude": 104.6,
	        "group": "Group 2",
	        "isotime": "2013-04-11T00:00:00.000Z"
	    },
	    {
	        "latitude": -18.6,
	        "longitude": 104.6,
	        "group": "Group 2",
	        "isotime": "2013-04-11T06:00:00.000Z"
	    },
	    {
	        "latitude": -19.83,
	        "longitude": 105.06,
	        "group": "Group 2",
	        "isotime": "2013-04-11T12:00:00.000Z"
	    },
	    {
	        "latitude": -20.99,
	        "longitude": 105.3,
	        "group": "Group 2",
	        "isotime": "2013-04-11T18:00:00.000Z"
	    },
	    {
	        "latitude": -8.84,
	        "longitude": 152.86,
	        "group": "Group 1",
	        "isotime": "2013-04-25T12:00:00.000Z"
	    },
	    {
	        "latitude": -9.09,
	        "longitude": 152.86,
	        "group": "Group 1",
	        "isotime": "2013-04-25T18:00:00.000Z"
	    },
	    {
	        "latitude": -9.78,
	        "longitude": 153.59,
	        "group": "Group 1",
	        "isotime": "2013-04-26T00:00:00.000Z"
	    },
	    {
	        "latitude": -9.8,
	        "longitude": 153.7,
	        "group": "Group 1",
	        "isotime": "2013-04-26T06:00:00.000Z"
	    },
	    {
	        "latitude": -10.02,
	        "longitude": 153.97,
	        "group": "Group 1",
	        "isotime": "2013-04-26T12:00:00.000Z"
	    },
	    {
	        "latitude": -10.2,
	        "longitude": 154.3,
	        "group": "Group 1",
	        "isotime": "2013-04-26T18:00:00.000Z"
	    },
	    {
	        "latitude": -10.7,
	        "longitude": 154.1,
	        "group": "Group 1",
	        "isotime": "2013-04-27T00:00:00.000Z"
	    },
	    {
	        "latitude": -10.8,
	        "longitude": 154.5,
	        "group": "Group 1",
	        "isotime": "2013-04-27T06:00:00.000Z"
	    },
	    {
	        "latitude": -11.1,
	        "longitude": 154.5,
	        "group": "Group 1",
	        "isotime": "2013-04-27T12:00:00.000Z"
	    },
	    {
	        "latitude": -11.8,
	        "longitude": 154.6,
	        "group": "Group 1",
	        "isotime": "2013-04-27T18:00:00.000Z"
	    },
	    {
	        "latitude": -12.2,
	        "longitude": 154.2,
	        "group": "Group 1",
	        "isotime": "2013-04-28T00:00:00.000Z"
	    },
	    {
	        "latitude": -12.5,
	        "longitude": 153.9,
	        "group": "Group 1",
	        "isotime": "2013-04-28T06:00:00.000Z"
	    },
	    {
	        "latitude": -12.7,
	        "longitude": 153.7,
	        "group": "Group 1",
	        "isotime": "2013-04-28T12:00:00.000Z"
	    },
	    {
	        "latitude": -12.8,
	        "longitude": 153.5,
	        "group": "Group 1",
	        "isotime": "2013-04-28T18:00:00.000Z"
	    },
	    {
	        "latitude": -12.8,
	        "longitude": 153.3,
	        "group": "Group 1",
	        "isotime": "2013-04-29T00:00:00.000Z"
	    },
	    {
	        "latitude": -13.17,
	        "longitude": 152.87,
	        "group": "Group 1",
	        "isotime": "2013-04-29T06:00:00.000Z"
	    },
	    {
	        "latitude": -13.52,
	        "longitude": 152.05,
	        "group": "Group 1",
	        "isotime": "2013-04-29T12:00:00.000Z"
	    },
	    {
	        "latitude": -13.69,
	        "longitude": 151.59,
	        "group": "Group 1",
	        "isotime": "2013-04-29T15:00:00.000Z"
	    },
	    {
	        "latitude": -13.73,
	        "longitude": 151.12,
	        "group": "Group 1",
	        "isotime": "2013-04-29T18:00:00.000Z"
	    },
	    {
	        "latitude": -13.65,
	        "longitude": 150.6,
	        "group": "Group 1",
	        "isotime": "2013-04-29T21:00:00.000Z"
	    },
	    {
	        "latitude": -13.8,
	        "longitude": 150.2,
	        "group": "Group 1",
	        "isotime": "2013-04-30T00:00:00.000Z"
	    },
	    {
	        "latitude": -13.9,
	        "longitude": 149.9,
	        "group": "Group 1",
	        "isotime": "2013-04-30T03:00:00.000Z"
	    },
	    {
	        "latitude": -14,
	        "longitude": 149.5,
	        "group": "Group 1",
	        "isotime": "2013-04-30T06:00:00.000Z"
	    },
	    {
	        "latitude": -14.1,
	        "longitude": 149.2,
	        "group": "Group 1",
	        "isotime": "2013-04-30T09:00:00.000Z"
	    },
	    {
	        "latitude": -14.1,
	        "longitude": 148.8,
	        "group": "Group 1",
	        "isotime": "2013-04-30T12:00:00.000Z"
	    },
	    {
	        "latitude": -14.1,
	        "longitude": 148.5,
	        "group": "Group 1",
	        "isotime": "2013-04-30T15:00:00.000Z"
	    },
	    {
	        "latitude": -14.1,
	        "longitude": 148.2,
	        "group": "Group 1",
	        "isotime": "2013-04-30T18:00:00.000Z"
	    },
	    {
	        "latitude": -13.9,
	        "longitude": 147.9,
	        "group": "Group 1",
	        "isotime": "2013-04-30T21:00:00.000Z"
	    },
	    {
	        "latitude": -13.8,
	        "longitude": 147.5,
	        "group": "Group 1",
	        "isotime": "2013-05-01T00:00:00.000Z"
	    },
	    {
	        "latitude": -13.6,
	        "longitude": 147.1,
	        "group": "Group 1",
	        "isotime": "2013-05-01T03:00:00.000Z"
	    },
	    {
	        "latitude": -13.5,
	        "longitude": 146.5,
	        "group": "Group 1",
	        "isotime": "2013-05-01T06:00:00.000Z"
	    },
	    {
	        "latitude": -13.4,
	        "longitude": 146,
	        "group": "Group 1",
	        "isotime": "2013-05-01T09:00:00.000Z"
	    },
	    {
	        "latitude": -13.2,
	        "longitude": 145.5,
	        "group": "Group 1",
	        "isotime": "2013-05-01T12:00:00.000Z"
	    },
	    {
	        "latitude": -13.1,
	        "longitude": 145.2,
	        "group": "Group 1",
	        "isotime": "2013-05-01T15:00:00.000Z"
	    },
	    {
	        "latitude": -12.9,
	        "longitude": 144.8,
	        "group": "Group 1",
	        "isotime": "2013-05-01T17:00:00.000Z"
	    }
    ];

    //creates template visualization
    eve.template = function (container, type, height, width) {
        //set templating colors
        let baseColors = eve.clone(eve.colors);
        let tmpColors = ["#999999", "#666666", "#333333", "#111111", "#000000"];
        let options = {
            isTemp: true,
            animation: {
                duration: 0,
                delay: 0,
                enabled: false,
                easing: 'linear',
                effect: 'default'
            },
            container: container,
            backColor: "transparent",
            xField: "",
            data: [],
            series: [],
            legend: {
                enabled: false
            },
            xAxis: {
                color: "#cccccc",
                gridLineColor: "#cccccc",
                labelFontColor: "#cccccc",
                title: "X Axis",
                titleFontColor: "#cccccc"
            },
            yAxis: {
                color: "#cccccc",
                gridLineColor: "#cccccc",
                labelFontColor: "#cccccc",
                title: "Y Axis",
                titleFontColor: "#cccccc",
                stacked: true
            },
            width: width ? width : "auto",
            height: height ? height : "auto"
        };

        //set eve colors
        eve.colors = tmpColors;

        //switch chart type
        switch (type) {
            case "areaChart":
            case "barChart":
            case "bubbleChart":
            case "columnChart":
            case "lineChart":
            case "radarChart":
            case "scatterChart":
                {
                    //set options
                    options.data = tmpXY;
                    options.xField = "x";

                    //set series
                    options.series = [];
                    options.series.push({
                        yField: "col1",
                        showBullets: false,
                        sizeField: type === "bubbleChart" ? "col3" : ""
                    });
                    options.series.push({
                        yField: "col2",
                        showBullets: false,
                        sizeField: type === "bubbleChart" ? "col3" : ""
                    });

                    //create xy chart
                    eve[type](options);
                }
                break;
            case "pieChart":
            case "donutChart":
            case "funnelChart":
            case "pyramidChart":
                {
                    //set options
                    options.data = tmpSliced;
                    options.xField = "group";

                    //set series
                    options.series = [];
                    options.series.push({
                        valueField: "size",
                        titleField: "group"
                    });

                    //create sliced chart
                    eve[type](options);
                }
                break;
            case "standardMap":
            case "tileMap":
            case "ddCartogram":
            case "contCartogram":
                {
                    //set options
                    options.data = tmpMap;

                    //set series
                    options.series = [];
                    options.hideZoom = true;
                    options.series.push({
                        map: "USA",
                        labelField: "label",
                        valueField: "value",
                    });
                    
                    //set gradient legend
                    options.legend = {
                        type: "gradient",
                        enabled: false,
                        gradientColors: ["#999999", "#333333"]
                    };

                    //create sliced chart
                    eve[type](options);
                }
                break;
            case "locationMap":
                {
                    //set options
                    options.data = tmpLatLng;

                    //iterate dataset
                    options.data.forEach(function (d) {
                        d.measure = eve.randInt(1, 50);
                    });

                    //set series
                    options.series = [];
                    options.hideZoom = true;
                    options.series.push({
                        latField: "latitude",
                        longField: "longitude",
                        valueField: "measure"
                    });

                    //set legend
                    options.legend = {
                        type: "scaled",
                        enabled: false,
                        legendColors: [{
                            text: "",
                            value: "all",
                            color: "#666666"
                        }]
                    };

                    //create sliced chart
                    eve[type](options);
                }
                break;
            case "routeMap":
                {
                    //set options
                    options.data = tmpLatLng;

                    //iterate dataset
                    options.data.forEach(function (d) {
                        d.measure = eve.randInt(1, 50);
                    });

                    //set series
                    options.series = [];
                    options.hideZoom = true;
                    options.series.push({
                        latField: "latitude",
                        longField: "longitude",
                        orderField: "isotime"
                    });

                    //set legend
                    options.legend = {
                        type: "default",
                        enabled: false,
                        legendColors: [{
                            text: "",
                            value: "all",
                            color: "#666666"
                        }]
                    };

                    //create sliced chart
                    eve[type](options);
                }
                break;
            case "densityMap":
                {
                    //set options
                    options.data = tmpLatLng;

                    //iterate dataset
                    options.data.forEach(function (d) {
                        d.measure = eve.randInt(1, 50);
                    });

                    //set series
                    options.series = [];
                    options.hideZoom = true;
                    options.series.push({
                        latField: "latitude",
                        longField: "longitude",
                        valueField: "measure",
                        expression: "sum"
                    });

                    //set legend
                    options.legend = {
                        type: "gradient",
                        enabled: false,
                        gradientColors: ["#eeeeee", "#cccccc", "#666666", "#333333"]
                    };

                    //create sliced chart
                    eve[type](options);
                }
                break;
        }

        //back to base colors
        eve.colors = baseColors;
    };

    //set property
    eve.mobile = eve.isMobile();

    //listen document resize event
    /*
    $(window).resize(function (event) {
        eve.visualizations.forEach(function (vis) {
            //set element id
            let el = $('#' + vis.container);

            //clear contents
            if (el.length > 0) {
                //clear the content
                el.html("");

                //re-render the vis
                eve[vis.type](vis);
            }
        });
    });
    */

    //amd loader, nodejs or browser check
    if (typeof amd !== 'undefined') {
        //define eve
        define(function () {
            return eve;
        });
    } else if (typeof module === 'object' && module.exports) {
        //export eve as node module
        module.exports = eve;
    } else {
        //bind eve into window
        window.eve = eve;
    }
}).call(this);