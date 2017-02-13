// from https://github.com/justincy/d3-pedigree-examples
//https://bl.ocks.org/jjzieve/a743242f46321491a950
$(document).ready(function () {
    "use strict";
    var boxWidth = 300, boxHeight = 100;
    // Setup zoom and pan
    var zoom = d3.behavior.zoom()
            .scaleExtent([0.2, 1])
            .on("zoom", function () {
                svg.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
            })
            // Offset so that first pan and zoom does not jump back to the origin
            .translate([150, 200]);

    var svg = d3.select("body").append("svg")
            .attr("width", 1000)
            .attr("height", 500)
            .call(zoom)
            .append("g")
            // Left padding of tree so that the whole root node is on the screen.
            // TODO: find a better way
            .attr("transform", "translate(150,200)");

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
                     "collapsed": true,
                     "roleNumber": 0
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
        var select2_data = extract_select2_data(Wooglin, [], 0)[1];//I know, not the prettiest...
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
    function draw(selected) {
        var nodes = tree.nodes(allbros.Wooglin), links = tree.links(nodes);
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
            .on("click", togglePerson);

        // Draw the rectangle person boxes
        nodeEnter.append("rect")
            .attr({
                x: -(boxWidth / 2),
                y: -(boxHeight / 2),
                width: boxWidth,
                height: boxHeight
            })
            .attr("id", function (d) {
                if (typeof selected !== "undefined") {
                    console.log(selected)
                    if (selected.includes(d.roleNumber)) {
                        return "found";
                    } else {
                        return "notfound";
                    }
                }
            });

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
            .attr("x", -(boxWidth / 2) + 1)
            .attr("y", -(boxHeight / 2) + 1)
            .attr("width", boxHeight - 2)
            .attr("height", boxHeight - 2);

        // Update the position of both old and new nodes
        node.attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });

        // Remove nodes we aren"t showing anymore
        node.exit().remove();

        // Update links
        var link = svg.selectAll("path.link")
            // The function we are passing provides d3 with an id
            // so that it can track when data is being added and removed.
            // This is not necessary if the tree will only be drawn once
            // as in the basic example.
            .data(links, function (d) { return d.target.roleNumber; });
        // Add new links
        link.enter().append("path")
            .attr("class", "link");
        // Remove any links we don"t need anymore
        // if part of the tree was collapsed
        link.exit().remove();
        // Update the links positions (old and new)
        link.attr("d", elbow);
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
        if (person.little) {
            person.little.forEach(collapse);
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
    function extract_select2_data(node,leaves,index) {
        if (node.littles) {
            for (var i = 0;i<node.littles.length;i++) {
                index = extract_select2_data(node.littles[i],leaves,index)[0];
            }
        } else {
            leaves.push({id:node.roleNumber,text:node.name});
        }
            return [index,leaves];
        }
    //attach search box listener
    $("#search").on("select2-selecting", function (e) {
        var paths = searchTree(allbros.Wooglin, e.object.text,[]);
        console.log(paths)
        if(paths !== "undefined"){
            openPaths(paths);
        } else {
            alert(e.object.text+" not found!");
        }
    })
    function openPaths(paths){
        for(var i =0;i<paths.length;i++){
            if(paths[i].id !== "1"){//i.e. not root
                if(paths[i].collapsed){ //if children are hidden: open them, otherwise: don"t do anything
                    paths[i].collapsed = false
                }
            }
        }
        draw(paths.map(function(x) {return x.roleNumber}));
    }
});
