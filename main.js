$.ajax({
    type: "GET",
	url: "http://reactomews.oicr.on.ca:8080/ReactomeRESTfulAPI/RESTfulWS/pathwayHierarchy/homo+sapiens",
	dataType: "xml",
	success:function(xml){

      var pathways = $(xml).find('Pathway').each(function(){
        if(this.attributes.length > 2){
           $('#pathway').append('<option value='+$(this.attributes[0])[0].nodeValue+'>'+$(this.attributes[1])[0].nodeValue+'</option>');
        }
      });

      render(2173782);
      $('#pathway').change(function(e){
        d3.select('#svgcontainer').selectAll('*').remove();
        render(this.value);
        $('#proof').attr('action','http://www.reactome.org/PathwayBrowser/#DIAGRAM='+this.value);
      });

      $('#reactinput').keypress(function (e) {
        if (e.which == 13) {
          $.ajax({
            type: "GET",
            url: "http://reactomews.oicr.on.ca:8080/ReactomeRESTfulAPI/RESTfulWS/queryById/Pathway/"+$('#reactinput').val(),
            dataType: "xml",
            success: function(xml) {
              d3.select('#svgcontainer').selectAll('*').remove();
              console.log($($(xml)[0].children[0])[0].children[1].textContent);
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

window.onkeyup = function(e) {
   var key = e.keyCode ? e.keyCode : e.which;

   if (key == 37 && count > 1) {
     count = count - 1;
     $('#pathway').prop('selectedIndex', count);
     var value = $('#pathway').val();
      d3.select('#svgcontainer').selectAll('*').remove();
      render(value);
      $('#proof').attr('action','http://www.reactome.org/PathwayBrowser/#DIAGRAM='+value);
   }else if (key == 39) {
     count = count + 1;
     $('#pathway').prop('selectedIndex', count);
     var value = $('#pathway').val();
      d3.select('#svgcontainer').selectAll('*').remove();
      render(value);
      $('#proof').attr('action','http://www.reactome.org/PathwayBrowser/#DIAGRAM='+value);
   }
}

function render(id){
  $.ajax({
      type: "GET",
      url: "http://reactomews.oicr.on.ca:8080/ReactomeRESTfulAPI/RESTfulWS/pathwayDiagram/"+id+"/XML",
      dataType: "xml",
      success: function(xml) {
        var collection =  $(xml).find('Nodes')[0].children;
        var scale = 0.7, height=0, width=0, minHeight=10000, minWidth=100000;
        var labels = [], nodes = [], geneArrows = [];

        for (var i=0;i<collection.length;i++) {
          var text = collection[i].textContent.trim();
          var type = collection[i].tagName.substring(collection[i].tagName.lastIndexOf('.')+1);
          var bounds = collection[i].attributes['bounds'].nodeValue.split(' ');
          var textPosition = collection[i].attributes['textPosition']?
              collection[i].attributes['textPosition'].nodeValue.split(' '):
              collection[i].attributes['bounds'].nodeValue.split(' ');
          var hasBorder =  false;

          if(collection[i].attributes['insets']){
            var border = collection[i].attributes['insets'].nodeValue.split(' ');
            hasBorder = true;
          }

          height =  Math.max(height, (+bounds[1]+ +bounds[3]));
          width =  Math.max(width, (+bounds[0]+ +bounds[2]));
          minHeight =  Math.min(minHeight, (+bounds[1]));
          minWidth =  Math.min(minWidth, (+bounds[0]));

          if(type === 'RenderableCompartment'){
            nodes.unshift({
              x:bounds[0], y:bounds[1], width:bounds[2], height:bounds[3],
              type:type, text:text, textPosition: textPosition, isBorder:false
            });
            if(hasBorder){
              nodes.unshift({
                x:border[0], y:border[1], width:border[2], height:border[3],
                type:type, isBorder:true
              });
            }
          }else{
            nodes.push({
              x:bounds[0], y:bounds[1], width:bounds[2], height:bounds[3],
              type:type, text:text, textPosition: textPosition, isBorder:false
            });
            if(['RenderableEntitySet','ProcessNode'].indexOf(type) >= 0){
              nodes.push({
                x:+bounds[0]+3, y:+bounds[1]+3, width:+bounds[2]-6, height:+bounds[3]-6,
                type:type, isBorder:true
              });
            }else if(type === 'RenderableGene'){
              geneArrows.push({x:(+bounds[0] + +bounds[2]), y:bounds[1]});
            }
          }
        }
        height =  height * scale, width = width * scale, minHeight =  minHeight * scale, minWidth =  minWidth*scale;

        var s = Math.min(($(window).height()*0.9)/(height-minHeight),($(window).width()/(width-minWidth)));
        var zoom = d3.behavior.zoom().scaleExtent([2*s/3,6]);

        var svg = d3.select("#svgcontainer").append("svg")
                  .attr('class','pathwaysvg')
                  .attr("viewBox","0 0 "+$(window).width()+" "+$(window).height()*0.9)
                  .attr("preserveAspectRatio","xMidYMid").append("g")
                  .append("g")
                  .call(zoom)
                  .on("dblclick.zoom", null)
                  .append("g");

        defineDefs(svg);

        d3.select('.pathwaysvg').on('mousedown',function(){
          d3.select('.pathwaysvg').attr('class','pathwaysvg');
          d3.select('.pathwaysvg').classed('cursor-grab',true);
        });

        d3.select('.pathwaysvg').on('mouseup',function(){
          d3.select('.pathwaysvg').attr('class','pathwaysvg');
        });

        var oldScale = 0, buffer = "0.2";
        zoom.on("zoom", function() {
          if(!d3.event) return;

          if(oldScale > d3.event.scale){
            d3.select('.pathwaysvg').classed('cursor-zoom-out',true);
          }else if(oldScale < d3.event.scale){
            d3.select('.pathwaysvg').classed('cursor-zoom-in',true);
          }

          svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
          oldScale = d3.event.scale;
        });

        zoom.on("zoomend", function() {
          d3.select('.pathwaysvg').attr('class','pathwaysvg');
        });

        s= s*0.95;
        var offsetX = ($(window).width() - (width-minWidth)*s)/2;
        var offsetY = ($(window).height()*0.9 - (height-minHeight)*s)/2;


        zoom.scale(s).translate([-minWidth*s + offsetX,-minHeight*s+offsetY]);
        svg.attr("transform", "translate("+[-minWidth*s + offsetX,-minHeight*s+offsetY]+")scale(" +s+ ")");

        svg.append('rect').attr({
            'class':'svg-invisible-backdrop',
            'x':0,
            'y':0,
            'width':width*scale,
            'height':height*scale,
          }).style({
            'fill':'gold',
            'opacity':0
          });

        d3.select('.pathwaysvg').on('dblclick',function(){
          zoom.scale(s).translate([-minWidth*s + offsetX,-minHeight*s+offsetY]);
          svg.transition().attr("transform", "translate("+[-minWidth*s + offsetX,-minHeight*s+offsetY]+")scale(" +s+ ")");
        });

        renderNodes(svg, nodes, scale);

        for (var i=0;i<nodes.length;i++) {
          if (nodes[i].isBorder) {
            nodes.splice(i,1);
          }
        }

        renderGeneArrows(svg, geneArrows, scale);

        renderNodeText(svg, nodes, scale);

        collection =  $(xml).find('Edges')[0].children;

        var edges = [];

        var generateLine = function(points, color,type){
          for(var j=0;j<points.length-1;j++){
            var point1 = points[j].trim().split(' ');
            var point2 = points[j+1].trim().split(' ');

            edges.push({
              x1: point1[0], y1: point1[1],
              x2: point2[0], y2: point2[1],
              isLast: j===0,
              marker: type,
              color:color
            });
          }
        }

        for (var i=0;i<collection.length;i++) {
          var points = collection[i].attributes['points'].nodeValue.split(',');

          var base = [];
          if(collection[i].tagName.indexOf('Renderable') < 0 && collection[i].tagName !== 'org.gk.render.FlowLine') continue;

          var reactionType = collection[i].attributes['reactionType']?collection[i].attributes['reactionType'].nodeValue:'missing';

          for(var j=0;j<points.length-1;j++){
            var point1 = points[j].trim().split(' ');
            var point2 = points[j+1].trim().split(' ');
            base[j] = {x:point1[0],y:point1[1]};
            if(j==points.length-2){
              base[j+1] = {x:point2[0],y:point2[1]};
            }

            if(j>0 && j<points.length-1){
              labels.push({x:point1[0],y:point1[1],reactionType:reactionType})
            }
          }

          generateLine(points,'black',collection[i].tagName.substring(collection[i].tagName.lastIndexOf('.')+1));

          var inputs = 0, outputs = 0;

          for(var j=0;j<4;j++){
            var name = collection[i].children[j] ? collection[i].children[j].children[0]['nodeName'] : 'nothing';

            if(['Input','Output','Catalyst','Activator','Inhibitor'].indexOf(name) < 0){
              continue;
            }
            points = Array.prototype.slice.call(collection[i].children[j].children);

            for(var k=0;k<points.length;k++){
              if(!points[k].getAttribute('points')){
                break;
              }
              var subPoints = points[k].getAttribute('points').split(',');

              switch(name){
                case 'Input':
                  subPoints.push(base[0].x+' '+base[0].y);
                  generateLine(subPoints,'red','Input');
                  inputs = inputs + 1;
                  break;
                case 'Output':
                  subPoints.push(base[(base.length-1)].x+' '+base[(base.length-1)].y);
                  generateLine(subPoints,'green','Output');
                  outputs = outputs + 1;
                  break;
                case 'Activator':
                  subPoints.push(base[(base.length-2)].x+' '+base[(base.length-2)].y);
                  subPoints.reverse();
                  generateLine(subPoints,'blue','Activator');
                  break;
                case 'Catalyst':
                  subPoints.push(base[(base.length-2)].x+' '+base[(base.length-2)].y);
                  subPoints.reverse();
                  generateLine(subPoints,'purple','Catalyst');
                  break;
                case 'Inhibitor':
                  subPoints.push(base[(base.length-2)].x+' '+base[(base.length-2)].y);
                  generateLine(subPoints,'orange','Inhibitor');
                  break;
              }
            }
          }

          if(inputs > 0 && outputs === 0){
            generateLine(
              [base[(base.length-1)].x+' '+base[(base.length-1)].y,
               base[(base.length-2)].x+' '+base[(base.length-2)].y],'pink','Output');
          }
        }

        renderEdges(svg,edges,scale);

        renderReactionLabels(svg, labels, scale);
      }
  });
}

var strokeColor = '#1693c0';

function defineDefs(svg){
  var defs = [
    {
      id:'Output',
      element:'path',
      attr:{
        d:'M0,-7L14,0L0,7',
        stroke:strokeColor
      },
      style:{
        fill:strokeColor
      },
      viewBox: '0 -7 14 14',
      refX: '9'
    },
    {
      id:'FlowLine',
      element:'path',
      attr:{
        d:'M0,-5L-10,0L0,5',
        stroke:strokeColor
      },
      style:{
        fill:strokeColor
      },
      viewBox:  '-10 -5 15 10',
      refX: '-7'
    },
    {
      id:'Activator',
      element:'path',
      attr:{
        d:'M0,-5L10,0L0,5L0,-5',
        stroke:strokeColor
      },
      style:{
        fill:'white'
      },
      viewBox:'0 -6 13 13',
      refX:'24'
    },
    {
      id:'RenderableInteraction',
      element:'path',
      attr:{
        d:'M0,-5L-10,0L0,5L0,-5',
        stroke:strokeColor
      },
      style:{
        fill:'white'
      },
      viewBox:  '-10 -5 15 10',
      refX: '-7'
    },
    {
      id:'Catalyst',
      element:'circle',
      attr:{
        'cx':5,'cy':0,'r':5
      },
      style:{
        fill:'white',
        stroke:strokeColor,
        'stroke-width':'1.5px'
      },
      viewBox:'0 -6 13 13',
      refX:'24'
    },
    {
      id:'GeneArrow',
      element:'path',
      attr:{
        d:'M0,-8L17,0L0,8',
        stroke:'black'
      },
      style:{
        fill:'black'
      },
      viewBox:'0 -10 20 20',
      refX:'5'
    }
  ];

  for(var i=0;i<defs.length;i++){
    svg.append('svg:defs').append('svg:marker')
    .attr('id', defs[i].id)
    .attr('viewBox', defs[i].viewBox)
    .attr('refX', defs[i].refX)
    .attr('markerWidth', 8)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append(defs[i].element)
    .attr(defs[i].attr).style(defs[i].style);
  }
}

function renderReactionLabels(svg, data, scale){
  var size = 8;
  var circular = ['Association','Dissociation','Binding'];
  var filled = ['Association','Binding'];

  svg.selectAll('.RenderableReactionLabel').data(data).enter().append('rect')
  .attr({
    'class':'RenderableReationLabel',
    'x':function(d){return d.x*scale - (size/2);},
    'y':function(d){return d.y*scale - (size/2);},
    'rx':function(d){return circular.indexOf(d.reactionType)>=0?(size/2):'';},
    'ry':function(d){return circular.indexOf(d.reactionType)>=0?(size/2):'';},
    'width':size,
    'height':size,
    'stroke':function(d){return strokeColor}
  })
  .style('fill',function(d){return filled.indexOf(d.reactionType)>=0?strokeColor:'white'})

  svg.selectAll('.ReactionLabelText').data(data).enter().append('text')
  .attr({
    'class':'ReactionLabelText',
    'x':function(d){return d.x*scale - (size/4);},
    'y':function(d){return d.y*scale + (size/4);},
    'font-weight':'bold',
    'font-size':'6px',
    'fill':strokeColor
  }).text(function(d){
    if(d.reactionType === 'Omitted Process'){
      return '\\\\';
    }else if(d.reactionType === 'Uncertain'){
      return '?';
    }else{
      return '';
    }
  });
}

function renderNodeText(svg, data, scale){
  svg.selectAll('.RenderableText').data(data).enter().append('foreignObject').attr({
      'class':function(d){return d.type+"Text RenderableText";},
      'x':function(d){return d.type==='RenderableCompartment'?d.textPosition[0]*scale:d.x*scale;},
      'y':function(d){return d.type==='RenderableCompartment'?d.textPosition[1]*scale:d.y*scale;},
      'width':function(d){return d.width*scale;},
      'height':function(d){return d.height*scale;},
      'pointer-events':'none',
      'fill':'none'
    }).append("xhtml:body")//.append('div')
    .attr('class',function(d){return d.type==='RenderableCompartment'?'':'RenderableNodeText'})
    .html(function(d){return "<table class='RenderableNodeTextCell'><tr><td valign='middle'>"+d.text+"</td></tr></table>";});
}

function renderNodes(svg, data, scale){
  var octs = [];
  var rects = data.slice();
  for(var i=0;i<rects.length;i++) {
    if(rects[i].type === 'RenderableComplex'){
      octs.push(rects[i]);
      rects.splice(i,1);
      i=i-1;
    }
  }

  svg.selectAll('.RenderableRect').data(rects).enter().append('rect').attr({
        'class':function(d){return d.isBorder?"RenderableRect RenderableBorder "+d.type:"RenderableRect "+d.type;},
        'x':function(d){return d.x*scale;},
        'y':function(d){return d.y*scale;},
        'width':function(d){return d.width*scale;},
        'height':function(d){return d.height*scale;},
        'rx':function(d){
          switch(d.type){
            case 'RenderableGene':
            case 'RenderableEntitySet':
            case 'RenderableEntity':
              return 0;
            case 'RenderableChemical':
              return d.width*scale/2;
            default:
              return 3;
          }
        },
        'ry':function(d){
          switch(d.type){
            case 'RenderableGene':
            case 'RenderableEntitySet':
            case 'RenderableEntity':
              return 0;
            case 'RenderableChemical':
              return d.width*scale/2;
            default:
              return 3;
          }
        },
        'stroke-dasharray':function(d){
          if(d.type==='RenderableGene')
            return 0+' '+(scale*d.width+1)+' '+(+d.height+ +d.width)*scale+' 0';
          else
            return '';
        }
      }).on('mouseover',function(e){
        if(d3.select(this).attr('class').indexOf('RenderableCompartment') < 0){
          d3.select(this).attr('fill-old',d3.select(this).style('fill')).style('fill','white');
        }
      }).on('mouseout',function(e){
        if(d3.select(this).attr('class').indexOf('RenderableCompartment') < 0){
          d3.select(this).style('fill',d3.select(this).attr('fill-old'));
        }
      });

  var getPointsMap = function(x,y,w,h,a){
    var points = [{x:+x+ +a,y:+y},
                 {x:+x+ +w- +a,y:+y},
                 {x:+x+ +w,y:+y+ +a},
                 {x:+x+ +w,y:+y+ +h- +a},
                 {x:+x+ +w- +a,y:+y+ +h},
                 {x:+x+ +a,y:+y+ +h},
                 {x:+x,y:+y+ +h- +a},
                 {x:+x,y:+y+ +a}]
    var val = "";
    points.forEach(function (elem) {
      val= val+elem.x+","+elem.y+" ";
    });
    return val;
  }

  svg.selectAll('.RenderableOct').data(octs).enter().append('polygon')
    .attr({
      class:'RenderableOct RenderableComplex',
      points:function(d){return getPointsMap(d.x*scale,d.y*scale,d.width*scale,d.height*scale,3);},
      stroke:'Red',
      'stroke-width':1
    }).on('mouseover',function(e){
        d3.select(this).attr('fill-old',d3.select(this).style('fill')).style('fill','white');
    }).on('mouseout',function(e){
      d3.select(this).style('fill',d3.select(this).attr('fill-old'));
    });
}

function renderEdges(svg, data, scale){

  var isStartMarker = function(type){return ['FlowLine','RenderableInteraction'].indexOf(type)>=0;}

  svg.selectAll('line').data(data).enter().append('line').attr({
    'class':'RenderableStroke',
    'x2':function(d){return d.x1*scale;},
    'y2':function(d){return d.y1*scale;},
    'x1':function(d){return d.x2*scale;},
    'y1':function(d){return d.y2*scale;},
  }).attr('stroke',function(d){return d.color;})
    .style('marker-start',function(d){return d.isLast && isStartMarker(d.marker)?'url(#'+d.marker+')':'';})
    .style('marker-end',function(d){return d.isLast && !isStartMarker(d.marker)?'url(#'+d.marker+')':'';});
}

function renderGeneArrows(svg, data, scale){
  svg.selectAll('line').data(data).enter().append('line').attr({
    'class':'RenderableGene',
    'x1':function(d){return d.x*scale - 0.5;},
    'y1':function(d){return d.y*scale +1;},
    'x2':function(d){return d.x*scale + 3.5;},
    'y2':function(d){return d.y*scale + 1;},
  }).attr('stroke','black')
    .style('marker-end','url(#GeneArrow)');
}
