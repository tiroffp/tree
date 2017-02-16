// from https://github.com/justincy/d3-pedigree-examples
//https://bl.ocks.org/jjzieve/a743242f46321491a950
$(document).ready(function () {
    "use strict";
    var boxWidth = 300, boxHeight = 100,
        initScale = 0.5, initPosx = -100, initPosy = 250,
        curSelectedLineage = [];
    // Setup zoom and pan
    var zoom = d3.behavior.zoom()
            .scaleExtent([0.15, 1])
            .on("zoom", function () {
                svg.attr("transform", "translate(" + d3.event.translate
                         + ") scale(" + d3.event.scale + ")");
            })
            // Offset so that first pan and zoom does not jump back to the origin
            .translate([initPosx, initPosy])
            .scale(initScale);

    var svg = d3.select("body").append("svg")
            .attr("width", 1000)
            .attr("height", 500)
            .call(zoom)
            .on("dblclick.zoom", null)
            .append("g")
            // Left padding of tree so that the whole root node is on the screen.
            // TODO: find a better way
            .attr("transform", "translate(" + initPosx + "," + initPosy
                  + ") scale(" + initScale + ")");

    var tree = d3.layout.tree()
            // Using nodeSize we are able to control
            // the separation between nodes. If we used
            // the size parameter instead then d3 would
            // calculate the separation dynamically to fill
            // the available space.
            .nodeSize([boxHeight + 150, boxWidth + 150])
            // By default, cousins are drawn further apart than siblings.
            // By returning the same value in all cases, we draw cousins
            // the same distance apart as siblings.
            .separation(function () {
                return 0.5;
            })
            .children(function (person) {
                // If the person is collapsed then tell d3
                // that they don"t have any littles.
                if (person.collapsed) {
                    return;
                }
                return person.littles;
            });

    var allbros = {"Wooglin":
                    {"name": "Wooglin",
                     "littles": [],
                     "collapsed": false,
                     "display": "nope"
                    }
                  };

    function parse(brother, index) {
          brother.roleNumber =+ brother.roleNumber
        allbros[brother.name] = brother;
        allbros[brother.name].collapsed = true;
        var big = allbros[brother.big];
        if (big) {
            (big.littles || (big.littles = []))
                .push(brother);
        } else {
         //add the brother to the root family node if it exists, or create a new family node and add the brother
            if (!allbros[brother.family]) {
                var root = {"name": brother.family,
                            "littles": [],
                            "roleNumber": 10032000 + index, //bunk id bc all nodes need roleNumber
                            "collapsed": true,
                            "big": "Wooglin"};
                allbros.Wooglin.littles.push(root);
                allbros[brother.family] = root;
            }
            allbros[brother.family].littles.push(brother);
        }
    }
    d3.csv("data/info.csv", parse, function (error, useless) {
        if (error) {
            return console.error(error);
        }
        var Wooglin = allbros.Wooglin;
        var select2_data = extract_select2_data(Wooglin);
        $("#search").select2({
            data: select2_data,
            containerCssClass: "search"
        });
        draw();

    });
    /**
    * Update a person"s state when they are clicked.
    */
    function togglePerson(person) {
        if (person.collapsed) {
            person.collapsed = false;
        } else {
            collapse(person);
        }
        draw();
    }
    //Function to render the tree
    function draw() {
        var nodes = tree.nodes(allbros.Wooglin).filter(function (d) {return d.name !== "Wooglin"}),
         links = tree.links(nodes).filter(function (d) {return d.source.name !== "Wooglin"});
        // Update nodes
        var node = svg.selectAll("g.person")
            // The function we are passing provides d3 with an id
            // so that it can track when data is being added and removed.
            // This is not necessary if the tree will only be drawn once
            // as in the basic example.
            .data(nodes, function (person) { return person.roleNumber; });
        // Add any new nodes
        var nodeEnter = node.enter().append("g")
            .attr("class", "person")
            .classed("nolittles", function (d) {return typeof d.littles === "undefined"})
            .on("click", togglePerson);
        // Draw the rectangle person boxes
        nodeEnter.append("rect")
            .attr({
                x: -(boxWidth / 2),
                y: -(boxHeight / 2),
                width: boxWidth,
                height: boxHeight
            })
        // Draw the person"s name and position it inside the box
        nodeEnter.append("text")
            .attr("dx", function (d) {
                if (d.image) {
                    return -(boxWidth / 2) + boxHeight + 10;
                }
                return -(boxWidth / 2) + 25;
            })
            .attr("dy", function (d) {
                if (d.image) {
                    return -(boxHeight / 2) + 25;
                }
                return 0;
            })
            .attr("text-anchor", "start")
            .attr("class", "name")
            .text(function (d) {
                return d.name;
            });

        nodeEnter.append("text")
            .attr("dx", function (d) {
                if (d.image) {
                    return -(boxWidth / 2) + boxHeight + 10;
                }
                return -(boxWidth / 2) + 25;
            })
            .attr("dy", function (d) {
                if (d.image) {
                    return -(boxHeight / 2) + 45;
                }
                return 0;
            })
            .attr("text-anchor", "start")
            .attr("class", "degree")
            .text(function (d) {
                return d.degree;
            });
        nodeEnter.append("text")
            .attr("dx", function (d) {
                if (d.image) {
                    return -(boxWidth / 2) + boxHeight + 10;
                }
                return -(boxWidth / 2) + 25;
            })
            .attr("dy", function (d) {
                if (d.image) {
                    return -(boxHeight / 2) + 60;
                }
                return 0;
            })
            .attr("text-anchor", "start")
            .attr("class", "degree")
            .text(function (d) {
                return d.graduationYear;
            });

        nodeEnter.append("image")
            .attr("xlink:href", function (d) { return d.image; })
            .attr({
                x: -(boxWidth / 2) + 1,
                y: -(boxHeight / 2) + 1,
                width: boxHeight - 2,
                height: boxHeight - 2
            });

        nodeEnter.attr({
                transform: function (d) {
                    return "translate(" + d.parent.y + "," + d.parent.x + ")"
                },
                opacity: 0,
            });

        // Update visually which nodes are part of the selected brothers lineage
        node.classed("found", function (d) {
                return curSelectedLineage.includes(d.roleNumber)
            })
            // Update the position of both old and new nodes
            .transition()
            .duration(1000)
            .attr({
                transform: function (d) {
                    return "translate(" + d.y + "," + d.x + ")";
                },
                opacity: 1
            })
        // Remove nodes we aren"t showing anymore
        node.exit()
            .transition()
            .duration(1000)
            .attr({
                transform: function (d) {
                    return "translate(" + d.parent.y + "," + d.parent.x + ")"
                },
                opacity: 0
            })
            .remove();

        // Update links
        var link = svg.selectAll("path.link")
            // The function we are passing provides d3 with an id
            // so that it can track when data is being added and removed.
            // This is not necessary if the tree will only be drawn once
            // as in the basic example.
            .data(links, function (d) { return d.target.roleNumber; });
        // Add new links
        link.enter().append("path")
            .attr({
                class: "link",
                opacity: 0
            });
        // Update the links
        link.transition()
            .duration(1000)
            .attr({
                d: elbow,
                opacity: 1
            });
        // Remove any links we don"t need anymore
        // if part of the tree was collapsed
        link.exit()
            .transition()
            .duration(1000)
            .attr({
                opacity: 0
            })
            .remove();
    }
    /**
    * Collapse person (hide their ancestors). We recursively
    * collapse the ancestors so that when the person is
    * expanded it will only reveal one generation. If we don"t
    * recursively collapse the ancestors then when
    * the person is clicked on again to expand, all ancestors
    * that were previously showing will be shown again.
    * If you want that behavior then just remove the recursion
    * by removing the if block.
    */
    function collapse(person) {
        person.collapsed = true;
        if (person.littles) {
            person.littles.forEach(collapse);
        }
    }

    /**
    * Custom path function that creates straight connecting lines.
    * Calculate start and end position of links.
    * Instead of drawing to the center of the node,
    * draw to the border of the person profile box.
    * That way drawing order doesn"t matter. In other
    * words, if we draw to the center of the node
    * then we have to draw the links first and the
    * draw the boxes on top of them.
    */
    function elbow(d) {
        var sourceX = d.source.x,
            sourceY = d.source.y + (boxWidth / 2),
            targetX = d.target.x,
            targetY = d.target.y - (boxWidth / 2);

        return "M" + sourceY + "," + sourceX
            + "H" + (sourceY + (targetY - sourceY) / 2)
            + "V" + targetX
            + "H" + targetY;
    }
    //////////////////////////
    // THINGS FOR SEARCHING //
    //////////////////////////
    //basically a way to get the path to an object
    function searchTree(obj, search, path) {
        if (obj.name === search) { //if search is found return, add the object to the path and return it
            path.push(obj);
            return path;
        } else if (obj.littles) {
            var littles = obj.littles;
            for (var i=0;i<littles.length;i++) {
                path.push(obj);// we assume this path is the right one
                var found = searchTree(littles[i],search,path);
                if (found) {// we were right, this should return the bubbled-up path from the first if statement
                    return found;
                } else {//we were wrong, remove this parent from the path and continue iterating
                    path.pop();
                }
            }
        } else {//not the right object, return false so it will continue to iterate in the loop
            return false;
        }
    }

    // get the data out of selectbox (???)
    function processTree(node, leaves, index) {
        //hack to only add actual brothers and not woog/family nodes
        if (node.class) {
            leaves.push({id:node.roleNumber,text:node.name})
        }
        if (node.littles) {
            for (var i = 0;i<node.littles.length;i++) {
                index = processTree(node.littles[i],leaves,index)[0];
            }
        }
        return [index, leaves]
    }
    function extract_select2_data(root) {
        //call the recursive processing function
        var result = processTree(root, [], 0)
        //alphabetize data
        var searchbox_entries = result[1].sort(function (a,b) {
            return (a.text > b.text) ? 1 : ((b.text > a.text) ? -1 : 0);
        });
        return searchbox_entries;
    }
    //attach search box listener
    $("#search").on("select2-selecting", function (e) {
        var paths = searchTree(allbros.Wooglin, e.object.text,[]);
        if(paths !== "undefined"){
            openPaths(paths, e.object.text);
        } else {
            alert(e.object.text+" not found!");
        }
    })
    function openPaths(paths, target){
        for(var i =0;i<paths.length;i++){
            var node = paths[i]
            //if children are hidden: open them, otherwise: don't do anything
            //don't expand the search target
            if(node.collapsed && node.name != target ){
                node.collapsed = false
            }
        }
        curSelectedLineage = paths.map(function(x) {return x.roleNumber});
        draw();
    }
});
