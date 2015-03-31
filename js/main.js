var controller = new ReactomePathway({
  width: $(window).width(),
  height: ($(window).height() * 0.9),
  container: "#svgcontainer",
  onClick: function (d) {
    console.log(d);
  }
});

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
    url: "http://www.reactome.org/ReactomeRESTfulAPI/RESTfulWS/pathwayDiagram/" + id + "/xml",
    dataType: "xml",
    success: function (xml) {
      controller.render(xml);
    }
  });
}
