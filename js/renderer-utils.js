var RendererUtils = function () {

}

RendererUtils.prototype.getLineNodes = function (model) {
  var nodes = [];
  var reactions = model.getReactions();

  reactions.forEach(function (reaction) {
    reaction.base.forEach(function (point) {
      nodes.push(point);
    });
    reaction.nodes.forEach(function (node) {
      node.base.forEach(function (point) {
        nodes.push(point);
      });
    });
  });

  return nodes;
};

RendererUtils.prototype.getLinks = function (model) {
  var nodes = model.getNodes();
  var reactions = model.getReactions();

  var links = [];

  nodes.forEach(function (node) {
    if (node.type !== 'ReactionNode') {
      node.reactions.forEach(function (nodeReaction) {
        links.push({
          source: node,
          target: model.getReactionById(nodeReaction).reactionNode
        });
      });
    }

  });

  return links;
};

RendererUtils.prototype.setFixedPostiosn = function (model) {
  model.getNodes().forEach(function (elem) {
    if(elem.type === 'ReactionNode'){
      elem.x = elem.position.x;
      elem.y = elem.position.y;
    }else{
      elem.x = +elem.position.x+ +elem.size.width/2;
      elem.y =  +elem.position.y+ +elem.size.height/2;
      elem.fixed = true;
    }
  });
};
