$.ajax({
  type: "GET",
  url: "list.xml",
  dataType: "xml",
  success: function (xml) {

    var pathways = $(xml).find('Pathway').each(function () {
      if (this.attributes.length > 2) {
        $('#pathway').append('<option value=' + $(this.attributes[0])[0].nodeValue + '>' + $(this.attributes[1])[0].nodeValue + '</option>');
      }
    });

    render(2173782);
    $('#pathway').change(function (e) {
      d3.select('#svgcontainer').selectAll('*').remove();
      render(this.value);
      $('#proof').attr('action', 'http://www.reactome.org/PathwayBrowser/#DIAGRAM=' + this.value);
    });

    $('#reactinput').keypress(function (e) {
      if (e.which == 13) {
        $.ajax({
          type: "GET",
          url: "http://reactomews.oicr.on.ca:8080/ReactomeRESTfulAPI/RESTfulWS/queryById/Pathway/" + $('#reactinput').val(),
          dataType: "xml",
          success: function (xml) {
            d3.select('#svgcontainer').selectAll('*').remove();
            render($($(xml)[0].children[0])[0].children[1].textContent);
          }
        });
        $('#reactinput').val('');
        return false;
      }
    });
  }
});
var count = 1;

window.onkeyup = function (e) {
  var key = e.keyCode ? e.keyCode : e.which;

  if (key == 37 && count > 1) {
    count = count - 1;
    $('#pathway').prop('selectedIndex', count);
    var value = $('#pathway').val();
    d3.select('#svgcontainer').selectAll('*').remove();
    render(value);
    $('#proof').attr('action', 'http://www.reactome.org/PathwayBrowser/#DIAGRAM=' + value);
  } else if (key == 39) {
    count = count + 1;
    $('#pathway').prop('selectedIndex', count);
    var value = $('#pathway').val();
    d3.select('#svgcontainer').selectAll('*').remove();
    render(value);
    $('#proof').attr('action', 'http://www.reactome.org/PathwayBrowser/#DIAGRAM=' + value);
  }
}

function render(id) {
  $.ajax({
    type: "GET",
    url: "http://www.reactome.org/ReactomeRESTfulAPI/RESTfulWS/pathwayDiagram/"+id+"/xml",
    dataType: "xml",
    success: function (xml) {
      var model = new PathwayModel();
      var t0 = performance.now();
      model.parse(xml);
      var t1 = performance.now();
      console.log("Took " + (t1 - t0) + " ms");
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

      var s = Math.min(($(window).height() * 0.9) / (height - minHeight), ($(window).width() / (width - minWidth)));
      var zoom = d3.behavior.zoom().scaleExtent([2 * s / 3, 6]);

      var svg = d3.select("#svgcontainer").append("svg")
        .attr('class', 'pathwaysvg')
        .attr("viewBox", "0 0 " + $(window).width() + " " + $(window).height() * 0.9)
        .attr("preserveAspectRatio", "xMidYMid")
        .append("g")
        .call(zoom)
        .on("dblclick.zoom", null)
        .append("g");

      zoom.on("zoom", function () {
        svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      });

      zoom.on("zoomend", function () {
        d3.select('.pathwaysvg').attr('class', 'pathwaysvg');
      });

      s = s * 0.95;
      var offsetX = ($(window).width() - (width - minWidth) * s) / 2;
      var offsetY = ($(window).height() * 0.9 - (height - minHeight) * s) / 2;


      zoom.scale(s).translate([-minWidth * s + offsetX, -minHeight * s + offsetY]);
      svg.attr("transform", "translate(" + [-minWidth * s + offsetX, -minHeight * s + offsetY] + ")scale(" + s + ")");

      svg.append('rect').attr({
        'class': 'svg-invisible-backdrop',
        'x': 0,
        'y': 0,
        'width': width,
        'height': height,
      }).style({
        'fill': 'gold',
        'opacity': 0
      });

      d3.select('.pathwaysvg').on('dblclick', function () {
        zoom.scale(s).translate([-minWidth * s + offsetX, -minHeight * s + offsetY]);
        svg.transition().attr("transform", "translate(" + [-minWidth * s + offsetX, -minHeight * s + offsetY] + ")scale(" + s + ")");
      });

      var renderer = new Renderer(svg);
      var rendererUtils = new RendererUtils();

      renderer.renderNodes(rendererUtils.unshiftCompartments(model.getNodes()));
      renderer.renderEdges(rendererUtils.generateLines(model.getReactions()));

    }
  });
}
