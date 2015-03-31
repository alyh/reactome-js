var ReactomePathway = function (config) {
  this.config = config;
}

ReactomePathway.prototype.render = function (xml) {
  var config = this.config;
  var model = new PathwayModel();
  var t0 = performance.now();
  model.parse(xml);
  var t1 = performance.now();
  console.log("Parsed in " + (t1 - t0).toFixed(3) + " ms");

  var height = 0,
    width = 0,
    minHeight = 10000,
    minWidth = 100000;

  model.getNodes().forEach(function (node) {
    height = Math.max(+node.position.y + +node.size.height, height);
    width = Math.max(+node.position.x + +node.size.width, width);
    minHeight = Math.min(node.position.y, minHeight);
    minWidth = Math.min(node.position.x, minWidth);
  });

  var s = Math.min(config.height / (height - minHeight), config.width / (width - minWidth));
  var zoom = d3.behavior.zoom().scaleExtent([2 * s / 3, 6]);

  var svg = d3.select(config.container).append("svg")
    .attr('class', 'pathwaysvg')
    .attr("viewBox", "0 0 " + config.width + " " + config.height)
    .attr("preserveAspectRatio", "xMidYMid")
    .append("g")
    .call(zoom)
    .on("dblclick.zoom", null)
    .append("g");

  zoom.on("zoom", function () {
    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  });

  // Set initial positioning and zoom
  s = s * 0.95;
  var offsetX = (config.width - (width - minWidth) * s) / 2;
  var offsetY = (config.height - (height - minHeight) * s) / 2;

  zoom.scale(s).translate([-minWidth * s + offsetX, -minHeight * s + offsetY]);
  svg.attr("transform", "translate(" + [-minWidth * s + offsetX, -minHeight * s + offsetY] + ")scale(" + s + ")");

  // So that the whole thing can be dragged around
  svg.append('rect').attr({
    'class': 'svg-invisible-backdrop',
    'x': 0,
    'y': 0,
    'width': width,
    'height': height,
  }).style('opacity', 0);

  // Reset view on double click
  d3.select('.pathwaysvg').on('dblclick', function () {
    zoom.scale(s).translate([-minWidth * s + offsetX, -minHeight * s + offsetY]);
    svg.transition().attr("transform", "translate(" + [-minWidth * s + offsetX, -minHeight * s + offsetY] + ")scale(" + s + ")");
  });

  // Render everything
  var renderer = new Renderer(svg);
  var rendererUtils = new RendererUtils();

  t0 = performance.now();
  renderer.renderNodes(rendererUtils.unshiftCompartments(model.getNodes()));
  renderer.renderEdges(rendererUtils.generateLines(model.getReactions()));
  t1 = performance.now();


  console.log("Rendered in " + (t1 - t0).toFixed(3) + " ms");
};
