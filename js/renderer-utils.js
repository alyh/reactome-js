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
    var outputs = 0;
    
    reactions[i].nodes.forEach(function (node) {
      if(!node.base || node.base.length === 0) return;
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
          outputs =  outputs +1;
          break;
        case 'Activator':
          base.push(reactions[i].base[(reactions[i].base.length - 2)]);
          base.reverse();
          generateLine(base, 'blue', 'Activator');
          break;
        case 'Catalyst':
          base.push(reactions[i].base[(reactions[i].base.length - 2)]);
          base.reverse();
          generateLine(base, 'purple', 'Catalyst');
          break;
        case 'Inhibitor':
          base.push(reactions[i].base[(reactions[i].base.length - 2)]);
          generateLine(base, 'orange', 'Inhibitor');
          break;
        }

    });
    generateLine(reactions[i].base,outputs==0?'hotpink':'black',outputs==0?'Output':reactions[i].type);
  }

  return lines;
}
