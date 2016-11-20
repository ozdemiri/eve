//declare variables
var dataStack = [],
    vis = null,
    visType = 'wordCloud',
    updateDuration = 0,
    updateInterval = 0,
    randomData = null;

//declare visualization option
var visOptions = {
    animation: {
        duration: 500,
        delay: 10,
        easing: 'linear'
    },
    border: { color: 'transparent', size: 0, style: 'solid' },
    container: 'dvVisualization',
    data: null,
    height: 'auto',
    legend: {
        enabled: true,
        type: 'default',
        fontColor: '#333333',
        fontFamily: 'Tahoma',
        fontSize: 12,
        fontStyle: 'normal',
        icon: 'square',
        iconColor: '',
        position: 'right',
        rangeList: [],
        gradientStopCount: 'auto',
        gradientColors: [],
        numberFormat: ''
    },
    margin: { left: 5, top: 5, right: 5, bottom: 5 },
    series: [],
    title: {
        content: '',
        fontColor: '#333333',
        fontFamily: 'Tahoma',
        fontSize: 13,
        fontStyle: 'normal',
        position: 'topCenter'
    },
    tooltip: {
        backColor: '#ffffff',
        borderColor: '#61c9f6',
        borderRadius: 3,
        borderSize: 1,
        borderStyle: 'solid',
        enabled: true,
        fontColor: '#333333',
        fontFamily: 'Tahoma',
        fontSize: 12,
        fontStyle: 'normal',
        format: '',
        opacity: 0.9,
        padding: 10
    },
    trends: [],
    xAxis: {
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
        logarithmic: false,
        startsFromZero: false,
        locked: false,
        min: null,
        max: null,
        tickCount: 'auto',
        title: '',
        titleFontColor: '#666666',
        titleFontFamily: 'Tahoma',
        titleFontSize: 11,
        titleFontStyle: 'bold',
        thickness: 1,
        enabled: true,
        stacked: true,
        position: 'left',
        stackType: 'normal'
    },
    xField: '',
    width: 'auto',
    yAxis: {
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
        logarithmic: false,
        startsFromZero: false,
        locked: false,
        min: null,
        max: null,
        tickCount: 'auto',
        title: '',
        titleFontColor: '#666666',
        titleFontFamily: 'Tahoma',
        titleFontSize: 11,
        titleFontStyle: 'bold',
        thickness: 1,
        enabled: true,
        stacked: true,
        position: 'left',
        stackType: 'normal'
    },
    zoomable: false
};

//creates and randomizes calendarmap data
function calendarMapData() {
    //clear data
    dataStack = [];

    //iterate to create data stack
    for (var i = 0; i <= 100; i++) {
        //randomize a date
        var year = eve.randInt(2014, 2016),
            month = eve.randInt(0, 11),
            day = eve.randInt(0, 59),
            hour = eve.randInt(0, 59),
            min = eve.randInt(0, 59),
            sec = eve.randInt(0, 59);

        //declare data model
        var dataModel = {};

        //set data model
        dataModel.date = new Date(year, month, day, hour, min, sec);
        dataModel.measure = eve.randInt(0, 1000);
        
        //push the current model into the data stack
        dataStack.push(dataModel);
    }
    
    //return generated data
    return dataStack;
}

//creates and randomizes xy chart data with group
function xyChartData() {
    //clear data
    dataStack = [];

    //iterate to create data stack
    for (var i = 0; i <= 100; i++) {
        //declare data model
        var dataModel = {};

        //set data model x value
        dataModel.xValue = eve.randInt(0, 1000);
        dataModel.sizeValue = eve.randInt(0, 10000);

        //iterate to 5 to create columns
        for (var k = 0; k <= 4; k++) {
            //set column
            dataModel['Group' + (k + 1)] = eve.randInt(0, 250000);
        }

        //push the current data model into the data stack
        dataStack.push(dataModel);
    }

    //return generated data
    return dataStack;
}

//creates and randomizes xy chart data with group
function xyChartData2() {
    //clear data
    dataStack = [];

    //iterate to create data stack
    for (var i = 0; i <= 100; i++) {
        //declare data model
        var dataModel = {};

        //set data model x value
        dataModel.xValue = eve.randInt(0, 1000);
        dataModel.sizeValue = eve.randInt(0, 10000);

        //iterate to 5 to create columns
        for (var k = 0; k <= 3; k++) {
            //set column
            dataModel['Group' + (k + 1)] = eve.randInt(0, 250000);
        }

        //push the current data model into the data stack
        dataStack.push(dataModel);
    }

    //return generated data
    return dataStack;
}

//creates and randomizes sliced data
function barData() {
    //clear data
    dataStack = [];

    //iterate to create data stack
    for (var i = 1; i <= 10; i++) {
        //declare data model
        var dataModel = {};

        //set data model x value
        dataModel.xValue = 'Value ' + i;
        dataModel.col1 = eve.randInt(0, 10000);
        dataModel.col2 = eve.randInt(0, 10000);
        dataModel.col3 = eve.randInt(0, 10000);

        //push the current data model into the data stack
        dataStack.push(dataModel);
    }

    //return generated data
    return dataStack;
}

//creates and randomizes sliced data
function slicedData() {
    //clear data
    dataStack = [];

    //iterate to create data stack
    for (var i = 1; i <= 10; i++) {
        //declare data model
        var dataModel = {};

        //set data model x value
        dataModel.xValue = 'Group ' + i;
        dataModel.sizeValue = eve.randInt(0, 10000);

        //push the current data model into the data stack
        dataStack.push(dataModel);
    }

    //return generated data
    return dataStack;
}

//creates and randomizes timeline data
function timelineData() {
    //clear data
    dataStack = [];

    //iterate to create data stack
    for (var i = 0; i <= 100; i++) {
        //randomize a date
        var year = eve.randInt(2014, 2016),
            month = eve.randInt(0, 11),
            day = eve.randInt(0, 59),
            hour = eve.randInt(0, 59),
            min = eve.randInt(0, 59),
            sec = eve.randInt(0, 59);

        //declare data model
        var dataModel = {};

        //set data model
        dataModel.label = 'Label ' + i;
        dataModel.group = 'Group ' + eve.randInt(1, 5);
        dataModel.start = new Date(year, month, day, hour, min, sec);
        dataModel.end = d3.timeMonth.offset(dataModel.start, eve.randInt(1, 10));

        //push the current model into the data stack
        dataStack.push(dataModel);
    }
    return dataStack;
}

//creates and randomizes timeline data
function ganttData() {
    //clear data
    dataStack = [];

    //iterate to create data stack
    for (var i = 0; i <= 10; i++) {
        //randomize a date
        var year = eve.randInt(2015 , 2016),
            month = eve.randInt(0, 11),
            day = eve.randInt(0, 59),
            hour = eve.randInt(0, 59),
            min = eve.randInt(0, 59),
            sec = eve.randInt(0, 59);

        //declare data model
        var dataModel = {};

        //set data model
        dataModel.label = 'Label ' + i;
        dataModel.group = 'Group ' + eve.randInt(1, 5);
        dataModel.start = new Date(year, month, day, hour, min, sec);
        dataModel.end = d3.timeMonth.offset(dataModel.start, eve.randInt(1, 10));

        //push the current model into the data stack
        dataStack.push(dataModel);
    }
    return dataStack;
}

//creates and randomizes bullet data
function bulletData() {
    //clear data
    dataStack = [];

    //iterate to create data stack
    for (var i = 1; i <= 10; i++) {
        //declare data model
        var dataModel = {};

        //set data model x value
        dataModel.xValue = 'Group ' + i;
        dataModel.measureValue = eve.randInt(0, 100000);
        dataModel.markerValue = eve.randInt(0, 100000);
        dataModel.range1 = eve.randInt(0, 100000);
        dataModel.range2 = eve.randInt(100000, 125000);

        //push the current data model into the data stack
        dataStack.push(dataModel);
    }

    //return generated data
    return dataStack;
}

//creates and randomizes abacus data
function abacusData() {
    //clear data
    dataStack = [];

    //iterate to create data stack
    for (var i = 2000; i <= 2016; i++) {
        //declare data model
        var dataModel = {};

        //set data model x value
        dataModel.xValue = i;
        
        //iterate to 5 to create columns
        for (var k = 0; k <= 4; k++) {
            //set column
            dataModel['Group' + (k + 1)] = eve.randInt(0, 250000);
        }

        //push the current data model into the data stack
        dataStack.push(dataModel);
    }

    //return generated data
    return dataStack;
}

//creates and randomizes network data
function networkData() {
    //clear data
    dataStack = [];

    //iterate to create data stack
    for (var i = 0; i <= 100; i++) {
        //declare data model
        var dataModel = {};

        //set data model x value
        dataModel.xValue = eve.randInt(2000, 2016);
        dataModel.groupValue = 'Group ' + eve.randInt(1, 5);
        dataModel.measureValue = eve.randInt(0, 100000);

        //push the current data model into the data stack
        dataStack.push(dataModel);
    }

    //return generated data
    return dataStack;
}

//creates and randomizes location data
function locationData() {
    //clear data
    dataStack = [];

    //iterate to create data stack
    for (var i = 0; i <= 100; i++) {
        //declare data model
        var dataModel = {};

        //set data model x value
        dataModel.lat = eve.randDecimal(-41, -42);
        dataModel.lng = eve.randDecimal(174, 175);
        dataModel.groupValue = 'Group ' + eve.randInt(1, 5);
        dataModel.measureValue = eve.randInt(0, 100000);

        //push the current data model into the data stack
        dataStack.push(dataModel);
    }

    //return generated data
    return dataStack;
}

//creates and randomized bump data
function bumpData() {
    //clear data
    dataStack = [];

    //iterate to create data stack
    for (var i = 1; i <= 10; i++) {
        //declare data model
        var dataModel = {};

        //set data model x value
        dataModel.xValue = 'Team ' + i;
        
        //iterate years
        for (var k = 1990; k <= 2016; k++) {
            //set years columns
            dataModel[k.toString()] = eve.randInt(1, 10);
        }

        //push the current data model into the data stack
        dataStack.push(dataModel);
    }

    //return generated data
    return dataStack;
}

//creates and randomizes chord data
function chordData() {
    return [
        { "state": "CA", "department": "Administration", "basesalary": "1083536" },
            { "state": "CA", "department": "Accounting", "basesalary": "495693" },
            { "state": "CA", "department": "Customer Support", "basesalary": "389162" },
            { "state": "CA", "department": "Sales", "basesalary": "426959" },
            { "state": "CA", "department": "R&D", "basesalary": "931010" },
            { "state": "CA", "department": "Marketing", "basesalary": "177500" },
            { "state": "CA", "department": "Human Resources", "basesalary": "41000" },
            { "state": "FL", "department": "Marketing", "basesalary": "135900" },
            { "state": "FL", "department": "Administration", "basesalary": "591690" },
            { "state": "FL", "department": "Accounting", "basesalary": "349979" },
            { "state": "FL", "department": "Customer Support", "basesalary": "120400" },
            { "state": "FL", "department": "Human Resources", "basesalary": "458182" },
            { "state": "FL", "department": "IT", "basesalary": "274250" },
            { "state": "IL", "department": "Accounting", "basesalary": "615480" },
            { "state": "IL", "department": "Human Resources", "basesalary": "51000" },
            { "state": "IL", "department": "Marketing", "basesalary": "373344" },
            { "state": "IL", "department": "R&D", "basesalary": "725465" },
            { "state": "IL", "department": "Sales", "basesalary": "396228" },
            { "state": "IL", "department": "IT", "basesalary": "928621" },
            { "state": "IL", "department": "Administration", "basesalary": "345000" },
            { "state": "MA", "department": "Customer Support", "basesalary": "929702" },
            { "state": "MA", "department": "Marketing", "basesalary": "1248136" },
            { "state": "MA", "department": "Administration", "basesalary": "1792198" },
            { "state": "MA", "department": "Finance", "basesalary": "2055184" },
            { "state": "MA", "department": "IT", "basesalary": "2870423" },
            { "state": "MA", "department": "Human Resources", "basesalary": "879950" },
            { "state": "MA", "department": "Sales", "basesalary": "2030180" },
            { "state": "MA", "department": "Accounting", "basesalary": "1218364" },
            { "state": "MA", "department": "R&D", "basesalary": "2333572" },
            { "state": "NY", "department": "IT", "basesalary": "222650" },
            { "state": "NY", "department": "Human Resources", "basesalary": "381428" },
            { "state": "NY", "department": "Customer Support", "basesalary": "104000" },
            { "state": "NY", "department": "Marketing", "basesalary": "333831" },
            { "state": "NY", "department": "Sales", "basesalary": "256100" },
            { "state": "NY", "department": "Accounting", "basesalary": "294222" },
            { "state": "NY", "department": "Finance", "basesalary": "387932" }
    ];
}

//update chord diagram data
function updateChordData(data) {
    data.forEach(function (d) {
        d.basesalary = eve.randInt(1, 1000000);
    });
    return data;
}

//creates and randomizes bubble force data
function bubbleForceData() {
    return [{ "source": "CA", "cluster": 0, "clusterName": "Administration", "measure": "1083536" }, { "source": "CA", "cluster": 1, "clusterName": "Accounting", "measure": "495693" }, { "source": "CA", "cluster": 2, "clusterName": "Customer Support", "measure": "389162" }, { "source": "CA", "cluster": 3, "clusterName": "Sales", "measure": "426959" }, { "source": "CA", "cluster": 4, "clusterName": "R&D", "measure": "931010" }, { "source": "CA", "cluster": 5, "clusterName": "Marketing", "measure": "177500" }, { "source": "CA", "cluster": 6, "clusterName": "Human Resources", "measure": "41000" }, { "source": "FL", "cluster": 5, "clusterName": "Marketing", "measure": "135900" }, { "source": "FL", "cluster": 0, "clusterName": "Administration", "measure": "591690" }, { "source": "FL", "cluster": 1, "clusterName": "Accounting", "measure": "349979" }, { "source": "FL", "cluster": 2, "clusterName": "Customer Support", "measure": "120400" }, { "source": "FL", "cluster": 6, "clusterName": "Human Resources", "measure": "458182" }, { "source": "FL", "cluster": 7, "clusterName": "IT", "measure": "274250" }, { "source": "IL", "cluster": 1, "clusterName": "Accounting", "measure": "615480" }, { "source": "IL", "cluster": 6, "clusterName": "Human Resources", "measure": "51000" }, { "source": "IL", "cluster": 5, "clusterName": "Marketing", "measure": "373344" }, { "source": "IL", "cluster": 4, "clusterName": "R&D", "measure": "725465" }, { "source": "IL", "cluster": 3, "clusterName": "Sales", "measure": "396228" }, { "source": "IL", "cluster": 7, "clusterName": "IT", "measure": "928621" }, { "source": "IL", "cluster": 0, "clusterName": "Administration", "measure": "345000" }, { "source": "MA", "cluster": 2, "clusterName": "Customer Support", "measure": "929702" }, { "source": "MA", "cluster": 5, "clusterName": "Marketing", "measure": "1248136" }, { "source": "MA", "cluster": 0, "clusterName": "Administration", "measure": "1792198" }, { "source": "MA", "cluster": 8, "clusterName": "Finance", "measure": "2055184" }, { "source": "MA", "cluster": 7, "clusterName": "IT", "measure": "2870423" }, { "source": "MA", "cluster": 6, "clusterName": "Human Resources", "measure": "879950" }, { "source": "MA", "cluster": 3, "clusterName": "Sales", "measure": "2030180" }, { "source": "MA", "cluster": 1, "clusterName": "Accounting", "measure": "1218364" }, { "source": "MA", "cluster": 4, "clusterName": "R&D", "measure": "2333572" }, { "source": "NY", "cluster": 7, "clusterName": "IT", "measure": "222650" }, { "source": "NY", "cluster": 6, "clusterName": "Human Resources", "measure": "381428" }, { "source": "NY", "cluster": 2, "clusterName": "Customer Support", "measure": "104000" }, { "source": "NY", "cluster": 5, "clusterName": "Marketing", "measure": "333831" }, { "source": "NY", "cluster": 3, "clusterName": "Sales", "measure": "256100" }, { "source": "NY", "cluster": 1, "clusterName": "Accounting", "measure": "294222" }, { "source": "NY", "cluster": 8, "clusterName": "Finance", "measure": "387932" }];
}

//update bubble force
function updateBubbleForce(data) {
    data.forEach(function (d) {
        d.measure = eve.randInt(1, 5000000);
    });
    return data;
}

//creates and randomizes network force data
function networkForceData() {
    return [{"state":"CA","full_name":"Kelly Queen","department":"Sales","base_salary":"426959"},{"state":"CA","full_name":"Ryan  Mesko","department":"Administration","base_salary":"844536"},{"state":"CA","full_name":"Cassandra Perry","department":"R&D","base_salary":"338798"},{"state":"CA","full_name":"Sara Webb","department":"R&D","base_salary":"73500"},{"state":"CA","full_name":"Katherine Battah","department":"Customer Support","base_salary":"389162"},{"state":"CA","full_name":"John  Michael","department":"Marketing","base_salary":"177500"},{"state":"CA","full_name":"Benny Melendez","department":"Human Resources","base_salary":"41000"},{"state":"CA","full_name":"Cristhian Roth","department":"Administration","base_salary":"239000"},{"state":"CA","full_name":"Joeanne Melendez","department":"R&D","base_salary":"345652"},{"state":"CA","full_name":"Michelle  Shevlin","department":"R&D","base_salary":"173060"},{"state":"CA","full_name":"Harman Abraha","department":"Accounting","base_salary":"495693"},{"state":"FL","full_name":"Matthew H. Rios","department":"Marketing","base_salary":"135900"},{"state":"FL","full_name":"Joshua Daniel","department":"Administration","base_salary":"215158"},{"state":"FL","full_name":"Ann Sharp","department":"IT","base_salary":"274250"},{"state":"FL","full_name":"Shireen Battah","department":"Accounting","base_salary":"137450"},{"state":"FL","full_name":"Alyssa Adefioye","department":"Customer Support","base_salary":"120400"},{"state":"FL","full_name":"Ernest Talia","department":"Administration","base_salary":"110000"},{"state":"FL","full_name":"Jacqueline N. Gappy","department":"Human Resources","base_salary":"458182"},{"state":"FL","full_name":"Rebecca L. Haight","department":"Accounting","base_salary":"212529"},{"state":"FL","full_name":"Richard  Garza","department":"Administration","base_salary":"176532"},{"state":"FL","full_name":"William Melendez","department":"Administration","base_salary":"90000"},{"state":"IL","full_name":"Michelle  Greenwell","department":"Administration","base_salary":"200000"},{"state":"IL","full_name":"Elena Miriam Woodburn","department":"R&D","base_salary":"337565"},{"state":"IL","full_name":"Johnathan A Wilhite","department":"Marketing","base_salary":"147914"},{"state":"IL","full_name":"Alicia A. Elmasian","department":"Human Resources","base_salary":"51000"},{"state":"IL","full_name":"Brian Tomasevic","department":"Administration","base_salary":"145000"},{"state":"IL","full_name":"Tony Merrick","department":"R&D","base_salary":"321000"},{"state":"IL","full_name":"Ricardo Bergman","department":"R&D","base_salary":"66900"},{"state":"IL","full_name":"Cindy Summerville","department":"IT","base_salary":"592296"},{"state":"IL","full_name":"Erik G. Rinehart","department":"IT","base_salary":"336325"},{"state":"IL","full_name":"Brian M Stucki","department":"Sales","base_salary":"396228"},{"state":"IL","full_name":"Bryan Anderson","department":"Accounting","base_salary":"615480"},{"state":"IL","full_name":"Saif Perrine","department":"Marketing","base_salary":"89430"},{"state":"IL","full_name":"Marylou M. Diaz","department":"Marketing","base_salary":"136000"},{"state":"MA","full_name":"Janalee Eggleston","department":"R&D","base_salary":"312232"},{"state":"MA","full_name":"Rosa I. Peralta","department":"IT","base_salary":"389295"},{"state":"MA","full_name":"Julia  Hegwood","department":"Sales","base_salary":"524126"},{"state":"MA","full_name":"Alexis Ripley","department":"Administration","base_salary":"606370"},{"state":"MA","full_name":"James Oberndorfer","department":"Sales","base_salary":"80000"},{"state":"MA","full_name":"Tiffany M Blake","department":"IT","base_salary":"38000"},{"state":"MA","full_name":"Rose Moreno","department":"Finance","base_salary":"33600"},{"state":"MA","full_name":"Laura S Greenwell","department":"Human Resources","base_salary":"210400"},{"state":"MA","full_name":"Elena Miriam Takahashi","department":"IT","base_salary":"270650"},{"state":"MA","full_name":"Ernest Trent","department":"Marketing","base_salary":"108100"},{"state":"MA","full_name":"Benny Erwin","department":"Sales","base_salary":"500490"},{"state":"MA","full_name":"Gabriel R. Self","department":"IT","base_salary":"621186"},{"state":"MA","full_name":"Jena Coon","department":"Sales","base_salary":"111800"},{"state":"MA","full_name":"Corine M. Henderson","department":"R&D","base_salary":"303000"},{"state":"MA","full_name":"Matthew W Yamaguchi","department":"Sales","base_salary":"151694"},{"state":"MA","full_name":"Melissa Torruella","department":"Customer Support","base_salary":"171180"},{"state":"MA","full_name":"Ricardo Sherrell","department":"IT","base_salary":"130600"},{"state":"MA","full_name":"Kevin Nevandro","department":"Sales","base_salary":"123000"},{"state":"MA","full_name":"Micah Chokeir","department":"IT","base_salary":"530808"},{"state":"MA","full_name":"Donna K. Bulgar","department":"IT","base_salary":"70700"},{"state":"MA","full_name":"Jessica Rodriguez","department":"Human Resources","base_salary":"94000"},{"state":"MA","full_name":"James Wilson","department":"Accounting","base_salary":"401446"},{"state":"MA","full_name":"Moriel Caldwell","department":"R&D","base_salary":"388920"},{"state":"MA","full_name":"Natalie H. Zeidell","department":"IT","base_salary":"258000"},{"state":"MA","full_name":"Jonathan C. Parnell","department":"Marketing","base_salary":"384036"},{"state":"MA","full_name":"Steven  Bolin","department":"Accounting","base_salary":"365820"},{"state":"MA","full_name":"Stacy L Chen","department":"Human Resources","base_salary":"484850"},{"state":"MA","full_name":"Eric W. Kilbride","department":"Administration","base_salary":"120650"},{"state":"MA","full_name":"Alison Johnson","department":"Marketing","base_salary":"681000"},{"state":"MA","full_name":"Laura Aguirre","department":"Accounting","base_salary":"314948"},{"state":"MA","full_name":"Krisaundra Hightower","department":"Finance","base_salary":"275955"},{"state":"MA","full_name":"Elena Miriam Hillen","department":"IT","base_salary":"561184"},{"state":"MA","full_name":"Kelley Reneau","department":"Accounting","base_salary":"73150"},{"state":"MA","full_name":"Margaret Pavlovich","department":"Finance","base_salary":"53300"},{"state":"MA","full_name":"Ian Helmer","department":"Marketing","base_salary":"36000"},{"state":"MA","full_name":"Ryan Kennedy","department":"Customer Support","base_salary":"758522"},{"state":"MA","full_name":"Yvette Hurtado","department":"Finance","base_salary":"281411"},{"state":"MA","full_name":"Natalie H. Woodford","department":"R&D","base_salary":"227046"},{"state":"MA","full_name":"Micah Talia","department":"R&D","base_salary":"426382"},{"state":"MA","full_name":"Bryan Brier","department":"Finance","base_salary":"267818"},{"state":"MA","full_name":"Jeremiah De Grazia","department":"Finance","base_salary":"455760"},{"state":"MA","full_name":"Roshan Coon","department":"Human Resources","base_salary":"65700"},{"state":"MA","full_name":"Grant Tomasevic","department":"R&D","base_salary":"48000"},{"state":"MA","full_name":"Julie Harken","department":"Sales","base_salary":"539070"},{"state":"MA","full_name":"Willow Nevandro","department":"Administration","base_salary":"385972"},{"state":"MA","full_name":"Ahlam Aby","department":"Accounting","base_salary":"63000"},{"state":"MA","full_name":"Stephen H. Thomas","department":"Finance","base_salary":"226040"},{"state":"MA","full_name":"Christopher Battah","department":"Human Resources","base_salary":"25000"},{"state":"MA","full_name":"Joshua Johnson","department":"Finance","base_salary":"317520"},{"state":"MA","full_name":"Jacqueline N. Hildebrand","department":"Finance","base_salary":"143780"},{"state":"MA","full_name":"Martie Elmasian","department":"R&D","base_salary":"627992"},{"state":"MA","full_name":"Saxton Peterson","department":"Marketing","base_salary":"39000"},{"state":"MA","full_name":"Jesse Wooten","department":"Administration","base_salary":"679206"},{"state":"NY","full_name":"Joshua Fields","department":"Sales","base_salary":"140700"},{"state":"NY","full_name":"Julie Yost","department":"Finance","base_salary":"387932"},{"state":"NY","full_name":"Rebecca Negrete","department":"Accounting","base_salary":"294222"},{"state":"NY","full_name":"Rikkie J Mahone","department":"Marketing","base_salary":"333831"},{"state":"NY","full_name":"Manuel Steele","department":"Human Resources","base_salary":"381428"},{"state":"NY","full_name":"Heela Kraft","department":"IT","base_salary":"45000"},{"state":"NY","full_name":"Tamara Pacheco","department":"IT","base_salary":"177650"},{"state":"NY","full_name":"Matthew Tait","department":"Customer Support","base_salary":"104000"},{"state":"NY","full_name":"Genevieve   Knapp","department":"Sales","base_salary":"115400"}]; 
}

//update network fodce
function updateNetworkForceData(data) {
    data.forEach(function (d) {
        d.base_salary = eve.randInt(1, 5000000);
    });
    return data;
}

//creaets and randomizes circle packing data
function circlePackingData() {
    return {
   "name":"Diagram 2",
   "depth":0,
   "children":[
      { "name":"CA", "size":3544860, "depth":1, "children":[ {"name":"Sales","size":426959,"depth":1}, {"name":"Customer Support","size":389162,"depth":1}, {"name":"Accounting","size":495693,"depth":1}, {"name":"Human Resources","size":41000,"depth":1}, {"name":"R&D","size":931010,"depth":1}, {"name":"Marketing","size":177500,"depth":1}, {"name":"Administration","size":1083536,"depth":1}
         ]
      },{"name":"FL","size":1930401,"depth":1,"children":[{"name":"Accounting","size":349979,"depth":1},{"name":"IT","size":274250,"depth":1},{"name":"Customer Support","size":120400,"depth":1},{"name":"Administration","size":591690,"depth":1},{"name":"Human Resources","size":458182,"depth":1},{"name":"Marketing","size":135900,"depth":1}]},{"name":"IL","size":3435138,"depth":1,"children":[{"name":"IT","size":928621,"depth":1},{"name":"Accounting","size":615480,"depth":1},{"name":"Human Resources","size":51000,"depth":1},{"name":"Sales","size":396228,"depth":1},{"name":"Administration","size":345000,"depth":1},{"name":"R&D","size":725465,"depth":1},{"name":"Marketing","size":373344,"depth":1}]},{"name":"MA","size":15357709,"depth":1,"children":[{"name":"R&D","size":2333572,"depth":1},{"name":"Customer Support","size":929702,"depth":1},{"name":"Administration","size":1792198,"depth":1},{"name":"IT","size":2870423,"depth":1},{"name":"Accounting","size":1218364,"depth":1},{"name":"Finance","size":2055184,"depth":1},{"name":"Sales","size":2030180,"depth":1},{"name":"Human Resources","size":879950,"depth":1},{"name":"Marketing","size":1248136,"depth":1}]},{"name":"NY","size":1980163,"depth":1,"children":[{"name":"IT","size":222650,"depth":1},{"name":"Marketing","size":333831,"depth":1},{"name":"Human Resources","size":381428,"depth":1},{"name":"Accounting","size":294222,"depth":1},{"name":"Sales","size":256100,"depth":1},{"name":"Finance","size":387932,"depth":1},{"name":"Customer Support","size":104000,"depth":1}]}]};
}

//update circle packing data
function updateCirclePackingData(data) {
    //iterate all data
    try {
        if (data.children) {
            data.children.forEach(function (currentData) {
                //check whether the current data has size
                if (currentData.size)
                    currentData.size = eve.randInt(1, 5000000);

                //check whether the current data has children
                if (currentData.children)
                    currentData.children = updateCirclePackingData(currentData.children);
            });
        }
    } catch (e) {
        console.log(e);
    }

    //return updated data
    return data;
}

//gets heatmap data
function heatmapData() {
    return [{"state":"CA","department":"Sales","base_salary":"426959"},{"state":"CA","department":"Customer Support","base_salary":"389162"},{"state":"CA","department":"Accounting","base_salary":"495693"},{"state":"CA","department":"Human Resources","base_salary":"41000"},{"state":"CA","department":"R&D","base_salary":"931010"},{"state":"CA","department":"Marketing","base_salary":"177500"},{"state":"CA","department":"Administration","base_salary":"1083536"},{"state":"FL","department":"Accounting","base_salary":"349979"},{"state":"FL","department":"IT","base_salary":"274250"},{"state":"FL","department":"Customer Support","base_salary":"120400"},{"state":"FL","department":"Administration","base_salary":"591690"},{"state":"FL","department":"Human Resources","base_salary":"458182"},{"state":"FL","department":"Marketing","base_salary":"135900"},{"state":"IL","department":"IT","base_salary":"928621"},{"state":"IL","department":"Accounting","base_salary":"615480"},{"state":"IL","department":"Human Resources","base_salary":"51000"},{"state":"IL","department":"Sales","base_salary":"396228"},{"state":"IL","department":"Administration","base_salary":"345000"},{"state":"IL","department":"R&D","base_salary":"725465"},{"state":"IL","department":"Marketing","base_salary":"373344"},{"state":"MA","department":"R&D","base_salary":"2333572"},{"state":"MA","department":"Customer Support","base_salary":"929702"},{"state":"MA","department":"Administration","base_salary":"1792198"},{"state":"MA","department":"IT","base_salary":"2870423"},{"state":"MA","department":"Accounting","base_salary":"1218364"},{"state":"MA","department":"Finance","base_salary":"2055184"},{"state":"MA","department":"Sales","base_salary":"2030180"},{"state":"MA","department":"Human Resources","base_salary":"879950"},{"state":"MA","department":"Marketing","base_salary":"1248136"},{"state":"NY","department":"IT","base_salary":"222650"},{"state":"NY","department":"Marketing","base_salary":"333831"},{"state":"NY","department":"Human Resources","base_salary":"381428"},{"state":"NY","department":"Accounting","base_salary":"294222"},{"state":"NY","department":"Sales","base_salary":"256100"},{"state":"NY","department":"Finance","base_salary":"387932"},{"state":"NY","department":"Customer Support","base_salary":"104000"}];
}

//update heatmap data
function updateHeatMapData(data) {
    data.forEach(function(d) {
        d.base_salary = eve.randInt(1, 1000000);
    });
    return data;
}

//gets wordcloud data
function wordCloudData() {
    var data = [{ "text": "ahlam", "size": 1 }, { "text": "aby", "size": 1 }, { "text": "alexis", "size": 8 }, { "text": "ripley", "size": 8 }, { "text": "alicia", "size": 1 }, { "text": "a", "size": 6 }, { "text": "elmasian", "size": 10 }, { "text": "alison", "size": 7 }, { "text": "johnson", "size": 10 }, { "text": "alyssa", "size": 2 }, { "text": "adefioye", "size": 2 }, { "text": "ann", "size": 3 }, { "text": "sharp", "size": 3 }, { "text": "benny", "size": 7 }, { "text": "erwin", "size": 6 }, { "text": "melendez", "size": 11 }, { "text": "brian", "size": 9 }, { "text": "m", "size": 15 }, { "text": "stucki", "size": 8 }, { "text": "tomasevic", "size": 2 }, { "text": "bryan", "size": 13 }, { "text": "anderson", "size": 8 }, { "text": "brier", "size": 5 }, { "text": "cassandra", "size": 5 }, { "text": "perry", "size": 5 }, { "text": "christopher", "size": 1 }, { "text": "battah", "size": 9 }, { "text": "cindy", "size": 8 }, { "text": "summerville", "size": 8 }, { "text": "corine", "size": 4 }, { "text": "henderson", "size": 4 }, { "text": "cristhian", "size": 4 }, { "text": "roth", "size": 4 }, { "text": "donna", "size": 2 }, { "text": "k", "size": 2 }, { "text": "bulgar", "size": 2 }, { "text": "elena", "size": 15 }, { "text": "miriam", "size": 15 }, { "text": "hillen", "size": 8 }, { "text": "takahashi", "size": 3 }, { "text": "woodburn", "size": 4 }, { "text": "eric", "size": 4 }, { "text": "w", "size": 7 }, { "text": "kilbride", "size": 4 }, { "text": "erik", "size": 5 }, { "text": "g", "size": 5 }, { "text": "rinehart", "size": 5 }, { "text": "ernest", "size": 3 }, { "text": "talia", "size": 6 }, { "text": "trent", "size": 2 }, { "text": "gabriel", "size": 7 }, { "text": "r", "size": 7 }, { "text": "self", "size": 7 }, { "text": "genevieve", "size": 3 }, { "text": "knapp", "size": 3 }, { "text": "grant", "size": 1 }, { "text": "harman", "size": 6 }, { "text": "abraha", "size": 6 }, { "text": "heela", "size": 1 }, { "text": "kraft", "size": 1 }, { "text": "ian", "size": 1 }, { "text": "helmer", "size": 1 }, { "text": "jacqueline", "size": 9 }, { "text": "n", "size": 9 }, { "text": "gappy", "size": 6 }, { "text": "hildebrand", "size": 3 }, { "text": "james", "size": 8 }, { "text": "oberndorfer", "size": 1 }, { "text": "wilson", "size": 7 }, { "text": "janalee", "size": 8 }, { "text": "eggleston", "size": 8 }, { "text": "jena", "size": 2 }, { "text": "coon", "size": 4 }, { "text": "jeremiah", "size": 7 }, { "text": "de", "size": 7 }, { "text": "grazia", "size": 7 }, { "text": "jesse", "size": 8 }, { "text": "wooten", "size": 8 }, { "text": "jessica", "size": 1 }, { "text": "rodriguez", "size": 1 }, { "text": "joeanne", "size": 8 }, { "text": "johnathan", "size": 5 }, { "text": "wilhite", "size": 5 }, { "text": "john", "size": 2 }, { "text": "michael", "size": 2 }, { "text": "jonathan", "size": 6 }, { "text": "c", "size": 6 }, { "text": "parnell", "size": 6 }, { "text": "joshua", "size": 11 }, { "text": "daniel", "size": 6 }, { "text": "fields", "size": 2 }, { "text": "julia", "size": 9 }, { "text": "hegwood", "size": 9 }, { "text": "julie", "size": 12 }, { "text": "harken", "size": 6 }, { "text": "yost", "size": 6 }, { "text": "katherine", "size": 4 }, { "text": "kelley", "size": 2 }, { "text": "reneau", "size": 2 }, { "text": "kelly", "size": 8 }, { "text": "queen", "size": 8 }, { "text": "kevin", "size": 2 }, { "text": "nevandro", "size": 11 }, { "text": "krisaundra", "size": 4 }, { "text": "hightower", "size": 4 }, { "text": "laura", "size": 7 }, { "text": "aguirre", "size": 4 }, { "text": "s", "size": 3 }, { "text": "greenwell", "size": 6 }, { "text": "manuel", "size": 7 }, { "text": "steele", "size": 7 }, { "text": "margaret", "size": 2 }, { "text": "pavlovich", "size": 2 }, { "text": "martie", "size": 9 }, { "text": "marylou", "size": 2 }, { "text": "diaz", "size": 2 }, { "text": "matthew", "size": 8 }, { "text": "h", "size": 13 }, { "text": "rios", "size": 2 }, { "text": "tait", "size": 3 }, { "text": "yamaguchi", "size": 3 }, { "text": "melissa", "size": 4 }, { "text": "torruella", "size": 4 }, { "text": "micah", "size": 13 }, { "text": "chokeir", "size": 8 }, { "text": "michelle", "size": 6 }, { "text": "shevlin", "size": 3 }, { "text": "moriel", "size": 3 }, { "text": "caldwell", "size": 3 }, { "text": "natalie", "size": 8 }, { "text": "woodford", "size": 4 }, { "text": "zeidell", "size": 4 }, { "text": "rebecca", "size": 9 }, { "text": "l", "size": 11 }, { "text": "haight", "size": 4 }, { "text": "negrete", "size": 5 }, { "text": "ricardo", "size": 4 }, { "text": "bergman", "size": 2 }, { "text": "sherrell", "size": 2 }, { "text": "richard", "size": 6 }, { "text": "garza", "size": 6 }, { "text": "rikkie", "size": 6 }, { "text": "j", "size": 6 }, { "text": "mahone", "size": 6 }, { "text": "rosa", "size": 5 }, { "text": "i", "size": 5 }, { "text": "peralta", "size": 5 }, { "text": "rose", "size": 2 }, { "text": "moreno", "size": 2 }, { "text": "roshan", "size": 2 }, { "text": "ryan", "size": 14 }, { "text": "kennedy", "size": 8 }, { "text": "mesko", "size": 6 }, { "text": "saif", "size": 3 }, { "text": "perrine", "size": 3 }, { "text": "sara", "size": 2 }, { "text": "webb", "size": 2 }, { "text": "saxton", "size": 1 }, { "text": "peterson", "size": 1 }, { "text": "shireen", "size": 4 }, { "text": "stacy", "size": 7 }, { "text": "chen", "size": 7 }, { "text": "stephen", "size": 3 }, { "text": "thomas", "size": 3 }, { "text": "steven", "size": 7 }, { "text": "bolin", "size": 7 }, { "text": "tamara", "size": 2 }, { "text": "pacheco", "size": 2 }, { "text": "tiffany", "size": 1 }, { "text": "blake", "size": 1 }, { "text": "tony", "size": 3 }, { "text": "merrick", "size": 3 }, { "text": "william", "size": 2 }, { "text": "willow", "size": 9 }, { "text": "yvette", "size": 6 }, { "text": "hurtado", "size": 6 }];
    var start = eve.randInt(0, 150);
    var stack = [];
    for (var i = start; i < (start + 25); i++) {
        stack.push(data[i]);
    }
    return stack;
}

//gets sankey data
function sankeyData() {
    return { "nodes": [{ "node": 0, "name": "CA" }, { "node": 1, "name": "Human Resources" }, { "node": 2, "name": "Los Angeles" }, { "node": 3, "name": "Marketing" }, { "node": 4, "name": "Accounting" }, { "node": 5, "name": "R&D" }, { "node": 6, "name": "Sales" }, { "node": 7, "name": "Administration" }, { "node": 8, "name": "Customer Support" }, { "node": 9, "name": "FL" }, { "node": 10, "name": "IT" }, { "node": 11, "name": "Miami" }, { "node": 12, "name": "IL" }, { "node": 13, "name": "Chicago" }, { "node": 14, "name": "MA" }, { "node": 15, "name": "Finance" }, { "node": 16, "name": "Boston" }, { "node": 17, "name": "NY" }, { "node": 18, "name": "New York" }], "links": [{ "source": 0, "target": 1, "value": 41000 }, { "source": 0, "target": 3, "value": 177500 }, { "source": 0, "target": 4, "value": 495693 }, { "source": 0, "target": 5, "value": 931010 }, { "source": 0, "target": 6, "value": 426959 }, { "source": 0, "target": 7, "value": 1083536 }, { "source": 0, "target": 8, "value": 389162 }, { "source": 1, "target": 2, "value": 41000 }, { "source": 3, "target": 2, "value": 177500 }, { "source": 4, "target": 2, "value": 495693 }, { "source": 5, "target": 2, "value": 931010 }, { "source": 6, "target": 2, "value": 426959 }, { "source": 7, "target": 2, "value": 1083536 }, { "source": 8, "target": 2, "value": 389162 }, { "source": 9, "target": 10, "value": 274250 }, { "source": 9, "target": 1, "value": 458182 }, { "source": 9, "target": 7, "value": 591690 }, { "source": 9, "target": 8, "value": 120400 }, { "source": 9, "target": 4, "value": 349979 }, { "source": 9, "target": 3, "value": 135900 }, { "source": 10, "target": 11, "value": 274250 }, { "source": 1, "target": 11, "value": 458182 }, { "source": 7, "target": 11, "value": 591690 }, { "source": 8, "target": 11, "value": 120400 }, { "source": 4, "target": 11, "value": 349979 }, { "source": 3, "target": 11, "value": 135900 }, { "source": 12, "target": 1, "value": 51000 }, { "source": 12, "target": 5, "value": 725465 }, { "source": 12, "target": 6, "value": 396228 }, { "source": 12, "target": 10, "value": 928621 }, { "source": 12, "target": 4, "value": 615480 }, { "source": 12, "target": 3, "value": 373344 }, { "source": 12, "target": 7, "value": 345000 }, { "source": 1, "target": 13, "value": 51000 }, { "source": 5, "target": 13, "value": 725465 }, { "source": 6, "target": 13, "value": 396228 }, { "source": 10, "target": 13, "value": 928621 }, { "source": 4, "target": 13, "value": 615480 }, { "source": 3, "target": 13, "value": 373344 }, { "source": 7, "target": 13, "value": 345000 }, { "source": 14, "target": 15, "value": 2055184 }, { "source": 14, "target": 4, "value": 1218364 }, { "source": 14, "target": 7, "value": 1792198 }, { "source": 14, "target": 6, "value": 2030180 }, { "source": 14, "target": 1, "value": 879950 }, { "source": 14, "target": 5, "value": 2333572 }, { "source": 14, "target": 8, "value": 929702 }, { "source": 14, "target": 3, "value": 1248136 }, { "source": 14, "target": 10, "value": 2870423 }, { "source": 15, "target": 16, "value": 2055184 }, { "source": 4, "target": 16, "value": 1218364 }, { "source": 7, "target": 16, "value": 1792198 }, { "source": 6, "target": 16, "value": 2030180 }, { "source": 1, "target": 16, "value": 879950 }, { "source": 5, "target": 16, "value": 2333572 }, { "source": 8, "target": 16, "value": 929702 }, { "source": 3, "target": 16, "value": 1248136 }, { "source": 10, "target": 16, "value": 2870423 }, { "source": 17, "target": 4, "value": 294222 }, { "source": 17, "target": 8, "value": 104000 }, { "source": 17, "target": 15, "value": 387932 }, { "source": 17, "target": 6, "value": 256100 }, { "source": 17, "target": 1, "value": 381428 }, { "source": 17, "target": 10, "value": 222650 }, { "source": 17, "target": 3, "value": 333831 }, { "source": 4, "target": 18, "value": 294222 }, { "source": 8, "target": 18, "value": 104000 }, { "source": 15, "target": 18, "value": 387932 }, { "source": 6, "target": 18, "value": 256100 }, { "source": 1, "target": 18, "value": 381428 }, { "source": 10, "target": 18, "value": 222650 }, { "source": 3, "target": 18, "value": 333831 }] };
}

//updates sankey data
function updateSankeyData(data) {
    data.links.forEach(function (d) {
        d.value = eve.randInt(1, 1000000);
    });
    return data;
};

//gets parallel lines data
function parallelLinesData() {
    return [{ "department": "Accounting", "state": "NY", "basesalary": "294222", "bonus": 22625.8, "totalcompensation": 327858.9 }, { "department": "Accounting", "state": "MA", "basesalary": "1218364", "bonus": 100677.2, "totalcompensation": 1348722.92 }, { "department": "Accounting", "state": "IL", "basesalary": "615480", "bonus": 38934, "totalcompensation": 674928 }, { "department": "Accounting", "state": "CA", "basesalary": "495693", "bonus": 47703.96, "totalcompensation": 555252.68 }, { "department": "Accounting", "state": "FL", "basesalary": "349979", "bonus": 26629.34, "totalcompensation": 390593.29 }, { "department": "Administration", "state": "IL", "basesalary": "345000", "bonus": 30660, "totalcompensation": 381790 }, { "department": "Administration", "state": "CA", "basesalary": "1083536", "bonus": 90452.8, "totalcompensation": 1205308.6 }, { "department": "Administration", "state": "FL", "basesalary": "591690", "bonus": 37672.04, "totalcompensation": 644911.92 }, { "department": "Administration", "state": "MA", "basesalary": "1792198", "bonus": 148540.1, "totalcompensation": 1980726.16 }, { "department": "Customer Support", "state": "CA", "basesalary": "389162", "bonus": 30979.84, "totalcompensation": 429057.82 }, { "department": "Customer Support", "state": "NY", "basesalary": "104000", "bonus": 12480, "totalcompensation": 118430 }, { "department": "Customer Support", "state": "FL", "basesalary": "120400", "bonus": 10908, "totalcompensation": 133078 }, { "department": "Customer Support", "state": "MA", "basesalary": "929702", "bonus": 85310.52, "totalcompensation": 1037949.56 }, { "department": "Finance", "state": "NY", "basesalary": "387932", "bonus": 39739.56, "totalcompensation": 437306.52 }, { "department": "Finance", "state": "MA", "basesalary": "2055184", "bonus": 168876.77, "totalcompensation": 2267518.52 }, { "department": "Human Resources", "state": "IL", "basesalary": "51000", "bonus": 6120, "totalcompensation": 58650 }, { "department": "Human Resources", "state": "FL", "basesalary": "458182", "bonus": 32507.98, "totalcompensation": 504365.4 }, { "department": "Human Resources", "state": "MA", "basesalary": "879950", "bonus": 75162.5, "totalcompensation": 976755 }, { "department": "Human Resources", "state": "NY", "basesalary": "381428", "bonus": 29935.24, "totalcompensation": 425332.76 }, { "department": "Human Resources", "state": "CA", "basesalary": "41000", "bonus": 2870, "totalcompensation": 45510 }, { "department": "IT", "state": "MA", "basesalary": "2870423", "bonus": 236527.14, "totalcompensation": 3173069.68 }, { "department": "IT", "state": "FL", "basesalary": "274250", "bonus": 27682.5, "totalcompensation": 305610 }, { "department": "IT", "state": "NY", "basesalary": "222650", "bonus": 17088.5, "totalcompensation": 245091.5 }, { "department": "IT", "state": "IL", "basesalary": "928621", "bonus": 78052.4, "totalcompensation": 1025072.87 }, { "department": "Marketing", "state": "IL", "basesalary": "373344", "bonus": 34172.26, "totalcompensation": 419855 }, { "department": "Marketing", "state": "FL", "basesalary": "135900", "bonus": 6795, "totalcompensation": 148072 }, { "department": "Marketing", "state": "NY", "basesalary": "333831", "bonus": 26137.37, "totalcompensation": 371685.21 }, { "department": "Marketing", "state": "CA", "basesalary": "177500", "bonus": 17750, "totalcompensation": 200645 }, { "department": "Marketing", "state": "MA", "basesalary": "1248136", "bonus": 101413.96, "totalcompensation": 1374662.4 }, { "department": "R&D", "state": "CA", "basesalary": "931010", "bonus": 75056.32, "totalcompensation": 1022517.62 }, { "department": "R&D", "state": "MA", "basesalary": "2333572", "bonus": 202356.68, "totalcompensation": 2605700.24 }, { "department": "R&D", "state": "IL", "basesalary": "725465", "bonus": 76465.65, "totalcompensation": 822844.9 }, { "department": "Sales", "state": "CA", "basesalary": "426959", "bonus": 39685.28, "totalcompensation": 1142144.28 }, { "department": "Sales", "state": "NY", "basesalary": "256100", "bonus": 23444, "totalcompensation": 531544 }, { "department": "Sales", "state": "MA", "basesalary": "2030180", "bonus": 163156.38, "totalcompensation": 4327536.38 }, { "department": "Sales", "state": "IL", "basesalary": "396228", "bonus": 31568.88, "totalcompensation": 1004796.88 }];
}

//updates parallel lines data
function updateParallelLinesData(data) {
    data.forEach(function (d) {
        d.basesalary = eve.randInt(1, 1000000);
        d.bonus = eve.randInt(1, 1000000);
        d.totalcompensation = eve.randInt(1, 1000000);
    });
    return data;
}

//gets multiples data
function multiplesData() {
    return [
    {
        "group": "CA",
        "values": [
            { "year": 2001, "basesalary": "129000" },
            { "year": 2002, "basesalary": "139000" },
            { "year": 2003, "basesalary": "347000" },
            { "year": 2004, "basesalary": "430000" },
            { "year": 2005, "basesalary": "452000" },
            { "year": 2006, "basesalary": "539260" },
            { "year": 2007, "basesalary": "704700" },
            { "year": 2008, "basesalary": "803900" }
        ]
    },
    {
        "group": "FL",
        "values": [
            { "year": 2003, "basesalary": "154000" },
            { "year": 2004, "basesalary": "212500" },
            { "year": 2005, "basesalary": "260500" },
            { "year": 2006, "basesalary": "315360" },
            { "year": 2007, "basesalary": "421241" },
            { "year": 2008, "basesalary": "566800" }
        ]
    },
    {
        "group": "IL",
        "values": [
            { "year": 2001, "basesalary": "277000" },
            { "year": 2002, "basesalary": "285000" },
            { "year": 2003, "basesalary": "421000" },
            { "year": 2004, "basesalary": "356000" },
            { "year": 2005, "basesalary": "432000" },
            { "year": 2006, "basesalary": "416920" },
            { "year": 2007, "basesalary": "548818" },
            { "year": 2008, "basesalary": "698400" }
        ]
    },
    {
        "group": "MA",
        "values": [
            { "year": 2000, "basesalary": "352000" },
            { "year": 2001, "basesalary": "853000" },
            { "year": 2002, "basesalary": "1056000" },
            { "year": 2003, "basesalary": "1367000" },
            { "year": 2004, "basesalary": "1558000" },
            { "year": 2005, "basesalary": "1788000" },
            { "year": 2006, "basesalary": "2430990" },
            { "year": 2007, "basesalary": "2753519" },
            { "year": 2008, "basesalary": "3199200" }
        ]
    },
    {
        "group": "NY",
        "values": [
            { "year": 2002, "basesalary": "77000" },
            { "year": 2003, "basesalary": "190000" },
            { "year": 2004, "basesalary": "259000" },
            { "year": 2005, "basesalary": "305000" },
            { "year": 2006, "basesalary": "363170" },
            { "year": 2007, "basesalary": "358293" },
            { "year": 2008, "basesalary": "427700" }
        ]
    }
    ];
}

//updates multiple data
function updateMultiplesData(data) {
    data.forEach(function (currentSet) {
        currentSet.values.forEach(function (d) {
            d.basesalary = eve.randInt(0, 500000);
        });
    });
    return data;
}

//gets random data
function getRandomData(index) {
    //set random data
    randomData = null;
    
    //switch visuailzation type to create visualization
    switch (visType) {
        case 'areaChart':
        case 'bubbleChart':
        case 'lineChart':
        case 'scatterChart':
            randomData = index % 2 === 0 ? xyChartData() : xyChartData2();
            break;
        case 'barChart':
        case 'columnChart':
        case 'radarChart':
            randomData = barData();
            break;
        case 'donutChart':
        case 'funnelChart':
        case 'pieChart':
        case 'pyramidChart':
            randomData = slicedData();
            break;
        case 'streamGraph':
        case 'abacus':
            randomData = abacusData();
            break;
        case 'bullet':
            randomData = bulletData();
            break;
        case 'bump':
            randomData = bumpData();
            break;
        case 'calendarmap':
            randomData = calendarMapData();
            break;
        case 'multiples':
            randomData = updateMultiplesData(visOptions.data);
            break;
        case 'networkMatrix':
            randomData = networkData();
            break;
        case 'timeline':
            randomData = timelineData();
            break;
        case 'gantt':
            randomData = ganttData();
            break;
        case 'circleClusters':
            randomData = barData();
            break;
        case 'circlePacking':
        case 'dendrogram':
        case 'force':
        case 'sunburst':
        case 'treemap':
            randomData = updateCirclePackingData(visOptions.data);
            break;
        case 'chord':
        case 'cooccurenceMatrix':
            randomData = updateChordData(visOptions.data);
            break;
        case 'heatmap':
            randomData = updateHeatMapData(visOptions.data);
            break;
        case 'wordCloud':
            randomData = wordCloudData();
            break;
        case 'sankey':
            randomData = updateSankeyData(visOptions.data);
            break;
        case 'parallelLines':
            randomData = updateParallelLinesData(visOptions.data);
            break;
        case 'bubbleForce':
            randomData = updateBubbleForce(visOptions.data);
            break;
        case 'networkForce':
            randomData = updateNetworkForceData(visOptions.data);
            break;
        case 'standardGauge':
        case 'dialGauge':
        case 'digitalGauge':
            randomData = eve.randInt(1, 1000000);
            break;
    }
    
    //return genrated random data
    return randomData;
}

//handle document ready
$(document).ready(function () {
    //handle click event
    $('#btnUpdate').click(function () {
        //clear series
        visOptions.series = [];

        //get update duration
        updateDuration = parseInt($('#txtUpdateDuration').val());

        //switch visuailzation type to create visualization
        switch (visType) {
            case 'barChart':
            case 'columnChart':
            case 'radarChart':
                {
                    //set visualization data and series
                    visOptions.data = barData();
                    visOptions.xField = 'xValue';
                    visOptions.series = [
                        { yField: 'col1' },
                        { yField: 'col2' },
                        { yField: 'col3' }
                    ];
                    visOptions.tooltip.format = '{x} - {y}';
                }
                break;
            case 'areaChart':
            case 'bubbleChart':
            case 'lineChart':
            case 'scatterChart':
                {
                    //set visualization data and series
                    visOptions.data = xyChartData();
                    visOptions.xField = 'xValue';
                    visOptions.series = [
                        {
                            yField: 'Group1',
                            sizeField: 'sizeValue'
                        },
                        {
                            yField: 'Group2',
                            sizeField: 'sizeValue'
                        },
                        {
                            yField: 'Group3',
                            sizeField: 'sizeValue'
                        },
                        {
                            yField: 'Group4',
                            sizeField: 'sizeValue'
                        },
                        {
                            yField: 'Group5',
                            sizeField: 'sizeValue'
                        }
                    ];
                    visOptions.yAxis.stacked = false;
                    visOptions.tooltip.format = '{x} - {y} - {group} - {size}';
                }
                break;
            case 'donutChart':
            case 'funnelChart':
            case 'pieChart':
            case 'pyramidChart':
                {
                    //set visualization data and series
                    visOptions.data = slicedData();
                    visOptions.xField = 'xValue';
                    visOptions.series = [
                        { sizeField: 'sizeValue' }
                    ];
                    visOptions.yAxis.stacked = false;
                    visOptions.tooltip.format = '{x} - {size}';
                    visOptions.legend.position = 'bottom';
                }
                break;
            case 'calendarmap':
                {
                    //set visualization data and series
                    visOptions.data = calendarMapData();
                    visOptions.series.push({
                        dateField: 'date',
                        measureField: 'measure'
                    });
                    visOptions.legend.type = 'gradient';
                    visOptions.legend.position = 'bottom';
                    visOptions.legend.gradientColors = [eve.colors[0], eve.colors[1], eve.colors[2]];
                    visOptions.tooltip.format = '{date}: {measure}';
                }
                break;
            case 'circlePacking':
                {
                    //set visualization data and series
                    visOptions.data = circlePackingData();
                    visOptions.series.push({
                        labelField: 'name',
                        sizeField: 'size'
                    });
                    visOptions.legend.type = 'gradient';
                    visOptions.legend.position = 'bottom';
                    visOptions.legend.gradientColors = ['#ffffff', eve.colors[1]];
                }
                break;
            case 'treemap':
                {
                    //set visualization data and series
                    visOptions.data = circlePackingData();
                    visOptions.series.push({
                        labelField: 'name',
                        sizeField: 'size'
                    });
                    visOptions.legend.type = 'gradient';
                    visOptions.legend.position = 'bottom';
                    visOptions.legend.gradientColors = [eve.colors[0], eve.colors[1]];
                }
                break;
            case 'force':
                {
                    //set visualization data and series
                    visOptions.data = circlePackingData();
                    visOptions.series.push({
                        labelField: 'name',
                        sizeField: 'size'
                    });
                }
                break;
            case 'bubbleForce':
                {
                    //set visualization data and series
                    visOptions.data = bubbleForceData();
                    visOptions.series.push({
                        sourceField: 'source',
                        groupField: 'clusterName',
                        measureField: 'measure'
                    });
                    visOptions.legend.type = 'gradient';
                    visOptions.legend.position = 'bottom';
                    visOptions.legend.gradientColors = [eve.colors[0], eve.colors[1]];
                }
                break;
            case 'networkForce':
                {
                    //set visualization data and series
                    visOptions.data = networkForceData();
                    visOptions.series.push({
                        sourceField: 'state',
                        targetField: 'full_name',
                        groupField: 'department',
                        measureField: 'base_salary'
                    });
                    visOptions.legend.enabled = false;
                    visOptions.legend.type = 'gradient';
                    visOptions.legend.position = 'bottom';
                    visOptions.legend.gradientColors = [eve.colors[0], eve.colors[1]];
                }
                break;
            case 'sunburst':
                {
                    //set visualization data and series
                    visOptions.data = circlePackingData();
                    visOptions.series.push({
                        labelField: 'name',
                        sizeField: 'size'
                    });
                    visOptions.legend.enabled = false;
                }
                break;
            case 'parallelLines':
                {
                    //set visualization data and series
                    visOptions.data = parallelLinesData();
                    visOptions.series.push({
                        sourceField: 'state',
                        groupField: 'department',
                        measureField: 'basesalary,bonus,totalcompensation'
                    });
                }
                break;
            case 'dendrogram':
                {
                    //set visualization data and series
                    visOptions.data = circlePackingData();
                    visOptions.series.push({
                        labelField: 'name',
                        sizeField: 'size',
                        direction: 'radial'
                    });
                }
                break;
            case 'bump':
                {
                    //set visualization data and series
                    visOptions.data = bumpData();
                    visOptions.series.push({ sourceField: 'xValue', dataType: 'numeric' });
                    visOptions.tooltip.format = '{source} was {measure} at leauge in {group}';
                }
                break;
            case 'multiples':
                {
                    //set visualization data and series
                    visOptions.data = multiplesData();
                    visOptions.series.push({
                        type: 'area',
                        multipleField: 'group',
                        xField: 'year',
                        yField: 'basesalary',
                        groupField: ''
                    });
                    visOptions.tooltip.format = '{x} - {y} - {group}';
                }
                break;
            case 'chord':
                {
                    //set visualization data and series
                    visOptions.data = chordData();
                    visOptions.series.push({
                        sourceField: 'state',
                        targetField: 'department',
                        measureField: 'basesalary',
                        expression: 'sum'
                    });
                }
                break;
            case 'cooccurenceMatrix':
                {
                    //set visualization data and series
                    visOptions.data = chordData();
                    visOptions.series.push({
                        sourceField: 'state',
                        targetField: 'department',
                        measureField: 'basesalary'
                    });
                    visOptions.legend.type = 'gradient';
                    visOptions.legend.position = 'bottom';
                    visOptions.legend.gradientColors = [eve.colors[0], eve.colors[1]];
                }
                break;
            case 'heatmap':
                {
                    //set visualization data and series
                    visOptions.data = heatmapData();
                    visOptions.series.push({
                        sourceField: 'state',
                        targetField: 'department',
                        measureField: 'base_salary'
                    });
                    visOptions.legend.type = 'gradient';
                    visOptions.legend.position = 'bottom';
                    visOptions.legend.gradientColors = [eve.colors[0], eve.colors[1]];
                }
                break;
            case 'wordCloud':
                {
                    //set visualization data and series
                    visOptions.data = wordCloudData();
                    visOptions.series.push({
                        sourceField: 'text',
                        measureField: 'size'
                    });
                    visOptions.legend.type = 'gradient';
                    visOptions.legend.position = 'bottom';
                    visOptions.legend.gradientColors = [eve.colors[0], eve.colors[1]];
                }
                break;
            case 'circleClusters':
                {
                    //set visualization data and series
                    visOptions.data = barData();
                    visOptions.series.push({ sourceField: 'xValue' });
                }
                break;
            case 'gantt':
                {
                    //set visualization data and series
                    visOptions.data = ganttData();
                    visOptions.series.push({
                        startField: 'start',
                        endField: 'end',
                        sourceField: 'label',
                        groupField: 'group'
                    });
                }
                break;
            case 'sankey':
                {
                    //set visualization data and series
                    visOptions.data = sankeyData();
                    visOptions.series.push({
                        sourceField: 'name',
                        measureField: 'value'
                    });
                }
                break;
            case 'standardGauge':
            case 'dialGauge':
            case 'digitalGauge':
                {
                    visOptions.data = eve.randInt(1, 1000000);
                    visOptions.series.push({
                        minRange: 0,
                        maxRange: 1000000,
                        title: 'Ismail',
                        labelFormat: 'vay amk'
                    });
                    visOptions.trends = [
                        {
                            start: 0,
                            end: 150000,
                            title: 't1',
                            color: eve.colors[1]
                        },
                        {
                            start: 150001,
                            end: 450000,
                            title: 't2',
                            color: eve.colors[2]
                        },
                        {
                            start: 450001,
                            end: 750000,
                            title: 't3',
                            color: eve.colors[3]
                        }
                    ];
                }
                break;
        }

        //create visualization
        if (visType)
            vis = eve[visType](visOptions);

        //check whether the animation has set
        if (updateDuration > 0 && vis) {
            //create an automatized update
            var index = 0;
            updateInterval = setInterval(function () {
                vis.update(getRandomData(index));
                index++;
            }, updateDuration * 1000);
        }
    });

    //initialize
    $('#btnUpdate').click();
})