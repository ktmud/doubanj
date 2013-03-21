//var DEFAULT_COLORS = ["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"];
//var DEFAULT_COLORS = ["", "", "", "", ""];
//var DEFAULT_COLORS = ["#d9ceb2", "#948c75", "#d5ded9", "#7a6a53", "#99b2b7"];
var DEFAULT_COLORS = ["#009ecf", "#ff7050", "#90e939", "#63dae0", "#ffa03f", "#8fbe00", "#78c0a8","#ed303c"];
//var DEFAULT_COLORS = ["#00a8c6", "#40c0cb", "#f9f2e7", "#aee239", "#8fbe00"];
//var DEFAULT_COLORS = ["#c02942", "#542437", "#ecd078", "#d95b43", "#53777a"];
//var DEFAULT_COLORS = ["#a8dba8", "#79bd9a",];
//var DEFAULT_COLORS = ["#d1f2a5", "#effab4", "#ffc48c", "#ff9f80", "#f56991"];

function d3_colors(list) {
  //return d3.scale.category10();
  return d3.scale.ordinal().range(list);
}

function timeFormat(formats) {
  return function(date) {
    var i = formats.length - 1, f = formats[i];
    while (!f[1](date)) f = formats[--i];
    return f[0](date);
  };
}

var customTimeFormat = timeFormat([
  [d3.time.format("%Y"), function() { return true; }],
  [d3.time.format("%B"), function(d) { return d.getMonth(); }],
  [d3.time.format("%b %d"), function(d) { return d.getDate() != 1; }],
  [d3.time.format("%a %d"), function(d) { return d.getDay() && d.getDate() != 1; }],
  [d3.time.format("%I %p"), function(d) { return d.getHours(); }],
  [d3.time.format("%I:%M"), function(d) { return d.getMinutes(); }],
  [d3.time.format(":%S"), function(d) { return d.getSeconds(); }],
  [d3.time.format(".%L"), function(d) { return d.getMilliseconds(); }]
]);

