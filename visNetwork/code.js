var svg = d3.select("svg"),
    width = +svg.node().getBoundingClientRect().width,
    height = +svg.node().getBoundingClientRect().height;

// svg objects
var links;
var nodes;
// the data - an object with nodes and links
var graph;
var toggle = 0;
var ltoggle = 0;
var tiptoggle = 0;
var linkedByIndex = [];
var nodeIndexName = [];


// load the data
// var filename = $('#net_select').val()
var filename = "net.json"
load(filename)

//d3.json("miserables.json", function(error, _graph) {
// d3.json($('#net_select').val(), function(error, _graph) {
//   if (error) throw error;
//   graph = _graph;
//   initializeDisplay();
//   initializeSimulation();
// });
//////////// TOOLTIP ////////////
var tooltip = new Tooltip("vis-tooltip", 230)

//////////// FORCE SIMULATION ////////////

// force simulator
var simulation = d3.forceSimulation();

//////////// ADD ZOOM ////////////

//add encompassing group for the zoom
var g = svg.append("g")
    .attr("class", "everything");

//add zoom capabilities ===> not working
var zoom_handler = d3.zoom()
    .on("zoom", zoom_actions);

zoom_handler(svg);

console.log(nodeIndexName);
console.log(nodes);

// values for all forces
forceProperties = {
    center: {
        x: 0.5,
        y: 0.5
    },
    charge: {
        enabled: true,
        strength: -30,
        distanceMin: 1,
        distanceMax: 2000
    },
    collide: {
        enabled: true,
        strength: .7,
        iterations: 1,
        radius: 5
    },
    forceX: {
        enabled: false,
        strength: .1,
        x: .5
    },
    forceY: {
        enabled: false,
        strength: .1,
        y: .5
    },
    link: {
        enabled: true,
        distance: 30,
        iterations: 1
    }
}
var radius = 5;


//////////// FUNCTIONS ////////////
// set up the simulation and event to update locations after each tick
function load(file){
  d3.json(file, reInit);
}

function initializeSimulation() {
  simulation.nodes(graph.nodes);
  initializeForces();
  simulation.on("tick", ticked);
}

// add forces to the simulation
function initializeForces() {
    // add forces and associate each with a name
    simulation
        .force("link", d3.forceLink())
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide())
        .force("center", d3.forceCenter())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY());
    // apply properties to each of the forces
    updateForces();
}

// apply new force properties
function updateForces() {
    // get each force by name and update the properties
    simulation.force("center")
        .x(width * forceProperties.center.x)
        .y(height * forceProperties.center.y);
    simulation.force("charge")
        .strength(forceProperties.charge.strength * forceProperties.charge.enabled)
        .distanceMin(forceProperties.charge.distanceMin)
        .distanceMax(forceProperties.charge.distanceMax);
    simulation.force("collide")
        .strength(forceProperties.collide.strength * forceProperties.collide.enabled)
        .radius(forceProperties.collide.radius)
        .iterations(forceProperties.collide.iterations);
    simulation.force("forceX")
        .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
        .x(width * forceProperties.forceX.x);
    simulation.force("forceY")
        .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
        .y(height * forceProperties.forceY.y);
    simulation.force("link")
        .id(function(d) {return d.id;})
        .distance(forceProperties.link.distance)
        .iterations(forceProperties.link.iterations)
        .links(forceProperties.link.enabled ? graph.links : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    simulation.alpha(1).restart();
}



//////////// DISPLAY ////////////

// generate the svg objects and force simulation
function initializeDisplay() {
  // set the data and properties of link lines
  link = svg.append("g")
        .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line");

  // set the data and properties of node circles
  node = svg.append("g")
        .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

  // node tooltip
  node.append("title")
//      .text(function(d) { return d.id; });
        .text(function(d) { return d.id + "-" + d.name; });

  // Display Node information on click
  // node.on("mouseover", showDetails)
      // .on("mouseout", hideDetails)

  node.exit().remove();


  // visualize the graph
  updateDisplay();
}

// update the display based on the forces (but not positions)
function updateDisplay() {
    node
        .attr("r", forceProperties.collide.radius)
        .attr("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
        .attr("stroke-width", forceProperties.charge.enabled==false ? 0 : Math.abs(forceProperties.charge.strength)/15);

    link
        .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
        .attr("opacity", forceProperties.link.enabled ? 1 : 0);
}

// update the display positions after each simulation tick
function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })
        .on("click",showLinkDetails)
        // .on("mouseout",hideDetails)
        // .on("click",showLinkDetails)
        ;

    node
        // .attr("cx", function(d) { return d.x; })
        // .attr("cy", function(d) { return d.y; });
        .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); })
        .on("click",showNodeInfo)
        .on("dblclick", showNodeDetails)
        .on("mouseout", hideDetails);
    d3.select('#alpha_value').style('flex-basis', (simulation.alpha()*100) + '%');

}

// $(document).click(function() {
//     alert('clicked outside');
// });                                                                    

//////////// UI EVENTS ////////////

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0.0001);
  d.fx = null;
  d.fy = null;
}

// update size-related forces
d3.select(window).on("resize", function(){
    width = +svg.node().getBoundingClientRect().width;
    height = +svg.node().getBoundingClientRect().height;
    updateForces();
});

// convenience function to update everything (run after UI input)
function updateAll() {
    updateForces();
    updateDisplay();
}

// Added functions (by R. Azondekon)
function reInit(error, _graph){
  if (error) throw error;
  graph = _graph;
  var links = _graph.links;
  var nodes = _graph.nodes;
  console.log(graph);
  // console.log(nodes);
  // for (i = 0; i < _graph.nodes.length; i++) {
  //     linkedByIndex[i + "," + i] = 1;
  // };
  // console.log(nodes);
  nodes.forEach(function(d){
    nodeIndexName[d.id]=d.name;
  });
  links.forEach(function (l) {
    // console.log(l.source+"-"+l.target);
      linkedByIndex[l.source + "," + l.target] = true;
  });
  // graph.links.forEach(function(d){
  //   linkedByIndex['${d.source.index},${d.target.index}'] = true;
  // });                                                                                             
  initializeDisplay();
  initializeSimulation();
}

function reload(file){
  d3.selectAll("svg > *").remove();
  load(file);
}

function zoom_actions(){
    g.attr("transform", d3.event.transform);
}

// graph functions
// var linkedByIndex = [];                         
// var color = d3.scaleOrdinal(d3.schemeCategory10);                                                   
// var nodeColors = d3.scaleOrdinal(d3.schemeCategory10);                                                   

function neighboring(a, b) {
    return linkedByIndex[a.id + "," + b.id];
}

// function strokeFor(d){
//   d3.rgb(d.id).darker().toString();
// }
// Tootltip functions

function showNodeDetails (d,i){
  d3.select("#info").remove();
  d3.selectAll(".highlighted").style("stroke","black");
  if(toggle == 0){
    // var content = '<p class="main">' + '<b>Name:</b> '+ d.name + '</span></p>';
    // content += '<hr class="tooltip-hr">';
    // content += '<p class="main">' + '<b>Total publications:</b> ' + parseInt(d.numPub) + '</span></p>';
    // content += '<p class="main">' + '<b>Times Cited:</b> ' + parseInt(d.timesCited) + '</span></p>';
    // content += '<p class="main">' + '<b>Affiliation:</b> ' + d.place + '</span></p>';
    // content += '<p class="main">' + '<b>City:</b> ' + d.affil + '</span></p>';
    // content += '<p class="main">' + '<b>Country:</b> ' + d.country + '</span></p>';
    // tooltip.showTooltip(content,d3.event);

  // // # higlight connected links
    if (link) {
      link.style("stroke", function(l) {
        if ((l.source === d) || (l.target === d)) { return "black"; } else { return "#aaa"; }
      })
      .attr("class", function(l) {
        if ((l.source === d) || (l.target === d)) { return "highlighted"; } else { return "noHighlight"; }
      })
        .style("stroke-opacity", function(l) {
          if ((l.source === d) || (l.target === d)) { return 1; } else { return 0.25; }
        })
        .style("stroke-width", function(l) {
          if ((l.source === d) || (l.target === d)) { return 3; } else { return 1; }
        });
    }

    // link.each(function(l) {
    //   if ((l.source === d) || (l.target === d)) {
    //      return d3.select(this).attr("stroke", "#555");
    //    }
    //  });

    // highlight neighboring nodes
    // node information from
    //     .attr("r", forceProperties.collide.radius)
    //     .attr("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
    //     .attr("stroke-width", forceProperties.charge.enabled==false ? 0 : Math.abs(forceProperties.charge.strength)/15);

    // watch out - don't mess with node if search is currently matching
    node
      .style("stroke", function(n) {
      // if (n.searched || neighboring(d, n)) { return "#555"; } else { return strokeFor(n); }
      if (neighboring(d, n) | neighboring(n, d)) { return "blue"; }
      else { return "red"; }
    })
      .style("stroke-width", function(n) {
        if (neighboring(d, n) | neighboring(n, d)) { return 4; }
        else { return Math.abs(forceProperties.charge.strength)/15; }
    })
    .style("fill", function(n) {
      if (neighboring(d, n) | neighboring(n, d)) { return "white"; }
      else { return "black"; }
  })
      .attr("r", function(n) {
      if (neighboring(d, n) | neighboring(n, d)) {
        return 1.2*forceProperties.collide.radius;
      } else { return forceProperties.collide.radius; }
    });

    // highlight the node being moused over
    d3.select(this)
      .style("fill","blue")
      .style("stroke-width",Math.abs(forceProperties.charge.strength)/15)
      .style("stroke",'white')
      .style("stroke-width", 2.0).attr("r", 2*forceProperties.collide.radius);
    toggle = 1;
  } else {
  link
      .style("stroke-width", 1)
      .style("stroke-opacity",1);
  // higlight connected links
  // link.attr("stroke", function(l) {
  //   if ((l.source === d) || (l.target === d)) { return "#555"; } else { return "#aaa"; }
  // })
  //   .attr("stroke-opacity", function(l) {
  //     if ((l.source === d) || (l.target === d)) { return 1; } else { return 0; }
  //   });

  node
      .attr("r", forceProperties.collide.radius)
      .style("stroke-width", Math.abs(forceProperties.charge.strength)/15)
      .style("fill","black")
      .style("stroke","red");
      toggle = 0;
      // tooltip.hideTooltip();
    }
}

function showNodeInfo(d,i){
  var content = '<p class="main">' + '<b>Name:</b> '+ nodeIndexName[d.id] + '</span></p>';
  content += '<hr class="tooltip-hr">';
  content += '<p class="main">' + '<b>Total publications:</b> ' + parseInt(d.numPub) + '</span></p>';
  content += '<p class="main">' + '<b>Times Cited:</b> ' + parseInt(d.timesCited) + '</span></p>';
  content += '<p class="main">' + '<b>Affiliation:</b> ' + d.place + '</span></p>';
  content += '<p class="main">' + '<b>City:</b> ' + d.affil + '</span></p>';
  content += '<p class="main">' + '<b>Country:</b> ' + d.country + '</span></p>';
  tooltip.showTooltip(content,d3.event);
}


function hideDetails(d,i){
    tooltip.hideTooltip();
      // watch out - don't mess with node if search is currently matching
      // link
      //     .style("stroke-width", 1)
      //     .style("stroke-opacity",1);
      // // higlight connected links
      // // link.attr("stroke", function(l) {
      // //   if ((l.source === d) || (l.target === d)) { return "#555"; } else { return "#aaa"; }
      // // })
      // //   .attr("stroke-opacity", function(l) {
      // //     if ((l.source === d) || (l.target === d)) { return 1; } else { return 0; }
      // //   });
      //
      // node
      //     .attr("r", forceProperties.collide.radius)
      //     .style("stroke-width", Math.abs(forceProperties.charge.strength)/15)
      //     .style("fill","black")
      //     .style("stroke","red");

      // node.style("stroke", function(n) { if (!n.searched) { return strokeFor(n); } else { return "#555"; } })
      //   .style("stroke-width", function(n) { if (!n.searched) { return 1.0; } else { return 2.0; } });
      // if (link) {
      //   return link.attr("stroke", "#ddd")
      //     .attr("stroke-opacity", 0.8);
    }
style="overflow:scroll; height:400px;"


function showLinkDetails (l){
  // if(ltoggle == 0){
    if(d3.select(this).style("stroke")=="black"){
      d3.selectAll(".highlighted").style("stroke","black");
      var title = l.title.split('|||');
      var journal = l.journal.split('|||');
      // var subject = l.subject.split('|||');
      var doi = l.doi.split('|||');
      var wosid = l.wosid.split('|||');
      var year = l.year.split('|||');
      var content = '<p class="main">' + '<b>' + l.source.name + '<-->' + l.target.name +
                    '</b> </span></p>';
      content += '<p class="bottom-space">  </p>';
      // content += '<hr class="tooltip-hr">';
      content += '<p class="main">' + '<b>Total papers:</b> ' + l.weight + '</span></p>';
      // content += '<p class="main">' + '<b>Total times Cited:</b> ' + l.timesCited + '</span></p>';
      content += '<hr class="tooltip-hr">';
      for (var i = 0; i < title.length; i++) {
        content += '<p class="main">' + '<b>Title:</b> ' + title[i] + '</p>';
        content += '<p class="main">' + '<b>Journal:</b> ' + journal[i] + '</p>';
        content += '<p class="main">' + '<b>DOI: </b><a  target="_blank" href="http://doi.org/' + doi[i] + '">'
                + doi[i] +'</a></span></p>';
        content += '<p class="main">' + '<b>WOS Accession #:</b> ' + wosid[i] + '</p>';
        content += '<p class="main">' + '<b>Publication Year:</b> ' + year[i] + '</span></p>';
        content += '<p class="bottom-space">  </p>';
        content += '<hr class="tooltip-hr">';
      }

      // d3.select('#info').data(data).remove().append("text").text(content);
      d3.select(this).style("stroke","blue");
      d3.select("#info").remove();

        d3.select("#linkInfo")
          .append("div")
          .attr("id", "info")
          .style("overflow","scroll")
          .style("height","800px")
          .append("text")
          .html(content);
      }
  //   ltoggle = 1;
  // } else {
  // link
      // d3.select("#yes").style("stroke","black");
  // higlight connected links
  // link.attr("stroke", function(l) {
  //   if ((l.source === d) || (l.target === d)) { return "#555"; } else { return "#aaa"; }
  // })
  //   .attr("stroke-opacity", function(l) {
  //     if ((l.source === d) || (l.target === d)) { return 1; } else { return 0; }
  // //   });
  //
  // node
  //     .attr("r", forceProperties.collide.radius)
  //     .style("stroke-width", Math.abs(forceProperties.charge.strength)/15)
  //     .style("fill","black")
  //     .style("stroke","red");
  //     toggle = 0;
  //     tooltip.hideTooltip();
    // }
}
