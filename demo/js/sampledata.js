var stock = [
  { date: '1/1/2009', open: 31.02, high: 31.02, low: 29.92, close: 30.18, signal: 'short', ret: 4.51010886469673 },
  { date: '1/2/2009', open: 28.7, high: 30.05, low: 28.45, close: 30.04, signal: 'short', ret: -4.89396411092985 },
  { date: '1/3/2009', open: 30.04, high: 30.13, low: 28.3, close: 29.63, signal: 'short', ret: -0.322580645161295 },
  { date: '1/4/2009', open: 29.62, high: 31.79, low: 29.62, close: 31.02, signal: 'short', ret: 3.68663594470045 },
  { date: '1/5/2009', open: 29.39, high: 30.81, low: 28.85, close: 29.62, signal: 'short', ret: 6.08424336973478 },
  { date: '1/8/2009', open: 30.84, high: 31.82, low: 26.41, close: 29.77, signal: 'short', ret: 1.2539184952978 },
  { date: '1/9/2009', open: 29.77, high: 29.77, low: 27.79, close: 28.27, signal: 'short', ret: -5.02431118314424 },
  { date: '1/10/2009', open: 26.9, high: 29.74, low: 26.9, close: 28.46, signal: 'short', ret: -5.46623794212217 },
  { date: '1/11/2009', open: 27.36, high: 28.11, low: 26.81, close: 28.11, signal: 'short', ret: -8.3743842364532 },
  { date: '1/12/2009', open: 28.08, high: 28.5, low: 27.73, close: 28.15, signal: 'short', ret: -5.52763819095477 },
  { date: '1/15/2009', open: 29.7, high: 31.09, low: 29.64, close: 30.81, signal: 'long', ret: 3.4920634920635 },
  { date: '1/16/2009', open: 30.81, high: 32.75, low: 30.07, close: 32.68, signal: 'short', ret: 0.155038759689914 },
  { date: '1/17/2009', open: 31.19, high: 32.77, low: 30.64, close: 31.54, signal: 'short', ret: 5.82822085889571 },
  { date: '1/18/2009', open: 31.54, high: 31.54, low: 29.6, close: 30.03, signal: 'short', ret: 8.17610062893082 },
  { date: '1/19/2009', open: 29.16, high: 29.32, low: 27.56, close: 27.99, signal: 'short', ret: 8.59872611464968 },
  { date: '1/22/2009', open: 30.4, high: 32.05, low: 30.3, close: 31.17, signal: 'short', ret: 15.4907975460123 },
  { date: '1/23/2009', open: 31.3, high: 31.54, low: 27.83, close: 30.58, signal: 'short', ret: 11.7370892018779 },
  { date: '1/24/2009', open: 30.58, high: 30.58, low: 28.79, close: 29.05, signal: 'long', ret: -10.4234527687296 },
  { date: '1/25/2009', open: 29.45, high: 29.56, low: 26.3, close: 26.36, signal: 'long', ret: 0 },
  { date: '1/26/2009', open: 27.09, high: 27.22, low: 25.76, close: 25.93, signal: 'long', ret: 0 },
  { date: '1/29/2009', open: 25.93, high: 27.18, low: 25.29, close: 25.35, signal: 'long', ret: 5.26315789473684 },
  { date: '1/30/2009', open: 25.36, high: 27.38, low: 25.02, close: 26.35, signal: 'long', ret: 6.73758865248228 },
  { date: '2/1/2009', open: 25.73, high: 26.31, low: 24.8, close: 26.22, signal: 'long', ret: 7.83645655877341 },
  { date: '2/2/2009', open: 26.22, high: 28.62, low: 26.22, close: 27.95, signal: 'long', ret: 2.76422764227643 },
  { date: '2/6/2009', open: 30.32, high: 30.6, low: 28.99, close: 29, signal: 'short', ret: -2.14521452145214 },
  { date: '2/7/2009', open: 29, high: 30.94, low: 28.9, close: 30.85, signal: 'short', ret: 3.03514376996805 },
  { date: '2/8/2009', open: 30.85, high: 33.05, low: 30.43, close: 31.3, signal: 'short', ret: 5.68720379146919 },
  { date: '2/9/2009', open: 30.23, high: 30.49, low: 29.28, close: 29.78, signal: 'short', ret: 8.22784810126583 },
  { date: '2/10/2009', open: 29.78, high: 30.34, low: 28.82, close: 29.02, signal: 'short', ret: 8.64779874213836 },
  { date: '2/13/2009', open: 28.36, high: 29.24, low: 25.42, close: 26.31, signal: 'short', ret: 7.32899022801303 },
  { date: '2/14/2009', open: 26.31, high: 26.84, low: 24.99, close: 25.02, signal: 'short', ret: 7.30897009966778 },
  { date: '2/15/2009', open: 25.05, high: 26.06, low: 23.83, close: 25.89, signal: 'neutral', ret: 0 },
  { date: '2/16/2009', open: 25.96, high: 26.18, low: 24.51, close: 25.42, signal: 'long', ret: -9.82758620689656 },
  { date: '2/17/2009', open: 25.42, high: 25.55, low: 23.88, close: 24.34, signal: 'long', ret: -10.8433734939759 },
  { date: '2/20/2009', open: 25.06, high: 25.42, low: 24.26, close: 24.4, signal: 'long', ret: -7.55711775043936 },
  { date: '2/21/2009', open: 24.28, high: 25.14, low: 23.81, close: 23.87, signal: 'long', ret: -2.5089605734767 },
  { date: '2/22/2009', open: 24.05, high: 24.14, low: 23.24, close: 23.47, signal: 'long', ret: 0.915750915750916 },
  { date: '2/23/2009', open: 23.71, high: 24.05, low: 23.21, close: 23.43, signal: 'long', ret: 2.47148288973383 },
  { date: '2/24/2009', open: 23.87, high: 23.87, low: 23, close: 23.09, signal: 'long', ret: 4.22264875239922 },
  { date: '2/27/2009', open: 24.06, high: 24.86, low: 24.02, close: 24.28, signal: 'long', ret: -0.189393939393929 },
  { date: '2/28/2009', open: 24.28, high: 25.61, low: 24.28, close: 25.01, signal: 'long', ret: -4.37956204379562 }
];

var stock2 = [
  { date: '1/1/2009', open: 31.02, high: 39.02, low: 29.92, close: 30.18, signal: 'short', ret: 4.51010886469673 },
  { date: '1/2/2009', open: 28.7, high: 35.05, low: 28.45, close: 30.04, signal: 'short', ret: -4.89396411092985 },
  { date: '1/3/2009', open: 30.04, high: 32.13, low: 28.3, close: 29.63, signal: 'short', ret: -0.322580645161295 },
  { date: '1/4/2009', open: 29.62, high: 34.79, low: 29.62, close: 31.02, signal: 'short', ret: 3.68663594470045 },
  { date: '1/5/2009', open: 29.39, high: 36.81, low: 28.85, close: 29.62, signal: 'short', ret: 6.08424336973478 },
  { date: '1/8/2009', open: 30.84, high: 37.82, low: 26.41, close: 29.77, signal: 'short', ret: 1.2539184952978 },
  { date: '1/9/2009', open: 29.77, high: 32.77, low: 27.79, close: 28.27, signal: 'short', ret: -5.02431118314424 },
  { date: '1/10/2009', open: 26.9, high: 33.74, low: 26.9, close: 28.46, signal: 'short', ret: -5.46623794212217 },
  { date: '1/11/2009', open: 27.36, high: 29.11, low: 26.81, close: 28.11, signal: 'short', ret: -8.3743842364532 },
  { date: '1/12/2009', open: 28.08, high: 29.5, low: 27.73, close: 28.15, signal: 'short', ret: -5.52763819095477 },
  { date: '1/15/2009', open: 29.7, high: 35.09, low: 29.64, close: 30.81, signal: 'long', ret: 3.4920634920635 },
  { date: '1/16/2009', open: 30.81, high: 39.75, low: 30.07, close: 32.68, signal: 'short', ret: 0.155038759689914 },
  { date: '1/17/2009', open: 31.19, high: 33.77, low: 30.64, close: 31.54, signal: 'short', ret: 5.82822085889571 },
  { date: '1/18/2009', open: 31.54, high: 32.54, low: 29.6, close: 30.03, signal: 'short', ret: 8.17610062893082 },
  { date: '1/19/2009', open: 29.16, high: 32.32, low: 27.56, close: 27.99, signal: 'short', ret: 8.59872611464968 },
  { date: '1/22/2009', open: 30.4, high: 35.05, low: 30.3, close: 31.17, signal: 'short', ret: 15.4907975460123 },
  { date: '1/23/2009', open: 31.3, high: 34.54, low: 27.83, close: 30.58, signal: 'short', ret: 11.7370892018779 },
  { date: '1/24/2009', open: 30.58, high: 31.58, low: 28.79, close: 29.05, signal: 'long', ret: -10.4234527687296 },
  { date: '1/25/2009', open: 29.45, high: 29.56, low: 26.3, close: 26.36, signal: 'long', ret: 0 },
  { date: '1/26/2009', open: 27.09, high: 28.22, low: 25.76, close: 25.93, signal: 'long', ret: 0 },
  { date: '1/29/2009', open: 25.93, high: 29.18, low: 25.29, close: 25.35, signal: 'long', ret: 5.26315789473684 },
  { date: '1/30/2009', open: 25.36, high: 28.38, low: 25.02, close: 26.35, signal: 'long', ret: 6.73758865248228 },
  { date: '2/1/2009', open: 25.73, high: 29.31, low: 24.8, close: 26.22, signal: 'long', ret: 7.83645655877341 },
  { date: '2/2/2009', open: 26.22, high: 29.62, low: 26.22, close: 27.95, signal: 'long', ret: 2.76422764227643 },
  { date: '2/6/2009', open: 30.32, high: 30.6, low: 28.99, close: 29, signal: 'short', ret: -2.14521452145214 },
  { date: '2/7/2009', open: 29, high: 30.94, low: 28.9, close: 30.85, signal: 'short', ret: 3.03514376996805 },
  { date: '2/8/2009', open: 30.85, high: 33.05, low: 30.43, close: 31.3, signal: 'short', ret: 5.68720379146919 },
  { date: '2/9/2009', open: 30.23, high: 30.49, low: 29.28, close: 29.78, signal: 'short', ret: 8.22784810126583 },
  { date: '2/10/2009', open: 29.78, high: 30.34, low: 28.82, close: 29.02, signal: 'short', ret: 8.64779874213836 },
  { date: '2/13/2009', open: 28.36, high: 29.24, low: 25.42, close: 26.31, signal: 'short', ret: 7.32899022801303 },
  { date: '2/14/2009', open: 26.31, high: 26.84, low: 24.99, close: 25.02, signal: 'short', ret: 7.30897009966778 },
  { date: '2/15/2009', open: 25.05, high: 26.06, low: 23.83, close: 25.89, signal: 'neutral', ret: 0 },
  { date: '2/16/2009', open: 25.96, high: 26.18, low: 24.51, close: 25.42, signal: 'long', ret: -9.82758620689656 },
  { date: '2/17/2009', open: 25.42, high: 25.55, low: 23.88, close: 24.34, signal: 'long', ret: -10.8433734939759 },
  { date: '2/20/2009', open: 25.06, high: 25.42, low: 24.26, close: 24.4, signal: 'long', ret: -7.55711775043936 },
  { date: '2/21/2009', open: 24.28, high: 25.14, low: 23.81, close: 23.87, signal: 'long', ret: -2.5089605734767 },
  { date: '2/22/2009', open: 24.05, high: 24.14, low: 23.24, close: 23.47, signal: 'long', ret: 0.915750915750916 },
  { date: '2/23/2009', open: 23.71, high: 24.05, low: 23.21, close: 23.43, signal: 'long', ret: 2.47148288973383 },
  { date: '2/24/2009', open: 23.87, high: 23.87, low: 23, close: 23.09, signal: 'long', ret: 4.22264875239922 },
  { date: '2/27/2009', open: 24.06, high: 24.86, low: 24.02, close: 24.28, signal: 'long', ret: -0.189393939393929 },
  { date: '2/28/2009', open: 24.28, high: 25.61, low: 24.28, close: 25.01, signal: 'long', ret: -4.37956204379562 }
];

//normalize countries
function normalizeCountries(data) {
    data.each(function (d) {
        d.population = parseFloat(d.population);
        d.alpha = parseFloat(d.alpha);
        d.marker = parseFloat(d.marker);
        d.value = parseFloat(d.value);
        d.range1 = parseFloat(d.range1);
        d.range2 = parseFloat(d.range2);
        d.range3 = parseFloat(d.range3);
        d.error = parseFloat(d.error);
    });
    return data;
};

//normalie series
function normalizeSeries(data) {
    data.each(function (d) {
        d.date = new Date(d.date);
        d.id = parseInt(d.id);
        d.serie1 = parseFloat(d.serie1);
        d.serie2 = parseFloat(d.serie2);
        d.serie3 = parseFloat(d.serie3);
        d.serie4 = parseFloat(d.serie4);
        d.serie5 = parseFloat(d.serie5);
    });
    return data;
};

//normalie series
function normalizePerformance(data) {
    data.each(function (d) {
        d.value = parseFloat(d.value);
    });
    return data;
};

//normalie stock
function normalizeStock(data) {
    return data;
};