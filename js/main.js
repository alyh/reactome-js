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
    url: "http://reactomews.oicr.on.ca:8080/ReactomeRESTfulAPI/RESTfulWS/pathwayDiagram/" + id + "/XML",
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

      model.addReactionNodes();

      var utils = new RendererUtils();

      utils.setFixedPostiosn(model);
      var force = d3.layout.force()
        .nodes(model.getNodes())
        .links(utils.getLinks(model))
        .size([width, height]).gravity(0).charge(-500)
        //      .linkDistance(60)
        //    .gravity(0).theta(0).charge(-30)//.friction(1)
        .on("tick", tick) //.alpha(0)
        .start();

      var s = Math.min(($(window).height() * 0.9) / (height - minHeight), ($(window).width() / (width - minWidth)));
      var zoom = d3.behavior.zoom().scaleExtent([2 * s / 3, 6]);

      var svg = d3.select("#svgcontainer").append("svg")
        .attr('class', 'pathwaysvg')
        .attr("viewBox", "0 0 " + $(window).width() + " " + $(window).height() * 0.9)
        .attr("preserveAspectRatio", "xMidYMid") //.append("g")
        .append("g")
        .call(zoom).on("mousedown.zoom", null)
        .on("dblclick.zoom", null)
        .append("g");

      //      d3.select('.pathwaysvg').on('mousedown', function () {
      //        d3.select('.pathwaysvg').attr('class', 'pathwaysvg');
      //        d3.select('.pathwaysvg').classed('cursor-grab', true);
      //      });
      //
      //      d3.select('.pathwaysvg').on('mouseup', function () {
      //        d3.select('.pathwaysvg').attr('class', 'pathwaysvg');
      //      });

      var oldScale = 0,
        buffer = "0.2";
      zoom.on("zoom", function () {
        if (!d3.event) return;

        //        if (oldScale > d3.event.scale) {
        //          d3.select('.pathwaysvg').classed('cursor-zoom-out', true);
        //        } else if (oldScale < d3.event.scale) {
        //          d3.select('.pathwaysvg').classed('cursor-zoom-in', true);
        //        }

        svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        oldScale = d3.event.scale;
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

      var path = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class", function (d) {
          return "link " + d.type;
        });

      var circle = svg.selectAll("rect")
        .data(force.nodes()).enter()
        .append("rect")
        .attr({
//          x: function (d) {
//            return d.position.x;
//          },
//          y: function (d) {
//            return d.position.y;
//          },
          width: function (d) {
            return d.size ? d.size.width : '5';
          },
          height: function (d) {
            return d.size ?  d.size.height : '5';
          }
        })
        .style("fill", function (d) {
          //          console.log(d);
          return d.type === "ReactionNode" ? 'black' : 'red'
        })
        .call(force.drag); //.on("mousedown.zoom", null);
      //svg.append("g").selectAll("circle")
      //        .data(force.nodes())
      //        .enter().append("circle")
      //        .attr("r", 10)
      //        //.attr("height",10)
      //        .call(force.drag);

      function tick() {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
        //  text.attr("transform", transform);
      }

      function linkArc(d) {
        //        console.log(model.getReactionById(d.target.id).base);
        return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
        ///  return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
      }

      function transform(d) {
        if(d.size)
          return "translate(" + (+d.x - (+d.size.width/2)) + "," + (+d.y - (+d.size.height/2))+ ")";
        else
          return "translate(" + d.x+ "," + d.y+ ")";
      }

      //     console.log(model.getNodes());

    }
  });
}
