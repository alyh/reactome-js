var RendererUtils = function () {

}

RendererUtils.prototype.unshiftCompartments = function (nodes) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].type === 'RenderableCompartment') {
      nodes.unshift(nodes[i]);
      nodes.splice(i + 1, 1);
    }
  }
  return nodes;
}

RendererUtils.prototype.generateLines = function (reactions) {
  var lines = [];
  var generateLine = function (points, color, type) {
    for (var j = 0; j < points.length - 1; j++) {
      lines.push({
        x1: points[j].x,
        y1: points[j].y,
        x2: points[j+1].x,
        y2: points[j+1].y,
        isLast: j === points.length-2,
        marker: type,
        color: color
      });
    }
  }

  for (var i = 0; i < reactions.length; i++) {

    generateLine(reactions[i].base, 'black',reactions[i].type);

    reactions[i].nodes.forEach(function (node) {
      if(!node.base) return;
      var base =  node.base.slice();
      switch (node.type) {
        case 'Input':
          base.push(reactions[i].base[0]);
          generateLine(base, 'red', 'Input');
          break;
        case 'Output':
          base.push(reactions[i].base[(reactions[i].base.length - 1)]);

          base.reverse();
          generateLine(base, 'green', 'Output');
          break;
        case 'Activator':
          base.push(reactions[i].base[(reactions[i].base.length - 1)]);
          base.reverse();
          generateLine(base, 'blue', 'Activator');
          break;
        case 'Catalyst':
          base.push(reactions[i].base[(reactions[i].base.length - 1)]);
          base.reverse();
          generateLine(base, 'purple', 'Catalyst');
          break;
        case 'Inhibitor':
          base.push(reactions[i].base[(reactions[i].base.length - 1)]);
          generateLine(base, 'orange', 'Inhibitor');
          break;
        }

    });
  }

  return lines;
}
