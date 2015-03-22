var PathwayModel = function () {
  this.nodes = [];
  this.reactions = [];
}

PathwayModel.prototype.parse = function (xml) {
  var model = this;

  // Parse all the nodes first
  var collection = $(xml).find('Nodes')[0].children;

  for (var i = 0; i < collection.length; i++) {

    var bounds = collection[i].attributes['bounds'].nodeValue.split(' ');
    var textPosition = collection[i].attributes['textPosition'] ?
      collection[i].attributes['textPosition'].nodeValue.split(' ') :
      collection[i].attributes['bounds'].nodeValue.split(' ');

    this.nodes.push({
      position: {
        x: bounds[0],
        y: bounds[1]
      },
      size: {
        width: bounds[2],
        height: bounds[3]
      },
      type: collection[i].tagName.substring(collection[i].tagName.lastIndexOf('.') + 1),
      id: collection[i].attributes['id'].nodeValue,
      reactomeId: collection[i].attributes['reactomeId'] ? collection[i].attributes['reactomeId'].nodeValue : 'missing',
      text: {
        content: collection[i].textContent.trim(),
        position: {
          x: textPosition[0],
          y: textPosition[1]
        }
      },
      reactions: []
    });

  }

  // Parse all the reactions
  collection = $(xml).find('Edges')[0].children;

  for (var i = 0; i < collection.length; i++) {
    var points = collection[i].attributes['points'].nodeValue.split(',');

    var base = [],
      nodes = [];

    // Curated "base" line of the reaction
    for (var j = 0; j < points.length; j++) {
      var point = points[j].trim().split(' ');
      base.push({
        x: point[0],
        y: point[1]
      });
    }

    // Add nodes that are attached to reaction including their type
    for (var j = 0; j < collection[i].children.length; j++) {
      var name = collection[i].children[j] ? collection[i].children[j].children[0]['nodeName'] : 'missing';

      if (['Input', 'Output', 'Catalyst', 'Activator', 'Inhibitor'].indexOf(name) < 0) {
        continue;
      }
      var subReactions = Array.prototype.slice.call(collection[i].children[j].children);

      // How a node connects is also a curated line, add that
      for (var k = 0; k < subReactions.length; k++) {
        if (subReactions[k].getAttribute('points')) {
          var subBase = [];
          subReactions[k].getAttribute('points').split(',').forEach(function (elem) {
            var point = elem.trim().split(' ');
            subBase.push({
              x: point[0],
              y: point[1]
            });
          });
        }

        nodes.push({
          type: name,
          base: subBase,
          id: subReactions[k].getAttribute('id')
        });
      }
    }

    this.reactions.push({
      base: base,
      nodes: nodes,
      reactomeId: collection[i].attributes['reactomeId'] ? collection[i].attributes['reactomeId'].nodeValue : 'missing',
      id: collection[i].attributes['id'].nodeValue,
      type: collection[i].attributes['reactionType'] ? collection[i].attributes['reactionType'].nodeValue : 'missing'
    });
  }

  // Add list of reactions a node is involved in nodes array
  this.reactions.forEach(function (reaction) {
    reaction.nodes.forEach(function (reactionNode) {
      model.nodes.forEach(function (node) {
        if (node.id === reactionNode.id) node.reactions.push(reaction.id);
      });
    });
  });
};

PathwayModel.prototype.getNodeById = function (id) {
  this.nodes.forEach(function (node) {
    if (node.id === id) return node;
  });
}

PathwayModel.prototype.getReactionById = function (id) {
  this.reactions.forEach(function (reaction) {
    if (reaction.id === id) return reaction;
  });
}

PathwayModel.prototype.getNodes = function () {
  return this.nodes;
};

PathwayModel.prototype.getReactions = function () {
  return this.reactions;
};
