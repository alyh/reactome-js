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

RendererUtils.prototype.setFixedPositions = function (model) {
  model.getNodes().forEach(function (elem) {
    if(elem.type === 'ReactionNode'){
      elem.x = +elem.position.x;
      elem.y = +elem.position.y;
      elem.fixed = true;
    }else{
      elem.x = +elem.position.x+ +elem.size.width/2;
      elem.y =  +elem.position.y+ +elem.size.height/2;
      elem.fixed = true;
    }
    console.log(elem);
  });
};

RendererUtils.prototype.seperateCompartments = function(nodes){
  var compartments = [];
  for(var i=0;i<nodes.length;i++){
    if(nodes[i].type === 'RenderableCompartment'){
      compartments.push(nodes[i]);
      nodes.splice(i,1);
      i--;
    }
  }
  return compartments;
}
