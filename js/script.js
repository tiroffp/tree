// from https://github.com/justincy/d3-pedigree-examples
//https://bl.ocks.org/jjzieve/a743242f46321491a950
// TODO implement selection with expanded info (popover? display below?)
//TODO get the images for the brothers
//TODO maybe space everybody by class w/ colored regions and labels along the top
/*  ALPHA CLASS | BETA CLASS | GAMMA CLASS | DELTA CLASS
*     founder-------------------little
*     founder---------------------------------little
*                  _-little
*     founder-----|
*                 --little
*     founder-------little--------------------little
*
*/
$(document).ready(function () {
    "use strict";
    var svgWidth = 1000, svgHeight = 500,
        boxWidth = 400, boxHeight = 125,
        initScale = 1, initPosx = -100, initPosy = 250,
        curSelectedLineage = [], aniDur = 1000;
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
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .call(zoom)
            .on("dblclick.zoom", null)
            .append("g")
            // Left padding of tree so that the whole root node is on the screen.
            // TODO: find a better way
            .attr({
                transform: "translate(" + initPosx + "," + initPosy
                            + ") scale(" + initScale + ")",
                class: "main"
            });

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
        drawTree();

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
        drawTree();
    }
    //Function to render the tree
    function drawTree() {
        var nodes = tree.nodes(allbros.Wooglin).filter(function (d) {return d.name !== "Wooglin"}),
         links = tree.links(nodes).filter(function (d) {return d.source.name !== "Wooglin"});
        // Update nodes
        var node = svg.selectAll("g.person")
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
        //inner box so i can use d3plus to wrap the text within
        nodeEnter.append("rect")
                .attr({
                    x: -(boxWidth / 2) + 10,
                    y: -(boxHeight / 2) + 10,
                    width: boxWidth - 20,
                    height: boxHeight - 20,
                    class: function (d) { return "inner id" + d.roleNumber}
                })
        // Draw the person"s name and position it inside the box
        //TODO wrap the text after doing the to-do above
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
            .attr("class", function (d) { return "name id" + d.roleNumber })
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

        // Wrap text (honestly not sure why it seems to work for all text)
        d3.selectAll("text").call(wrap, boxWidth);

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
            .duration(aniDur)
            .attr({
                transform: function (d) {
                    return "translate(" + d.y + "," + d.x + ")";
                },
                opacity: 1
            })
        // Remove nodes we aren"t showing anymore
        node.exit()
            .transition()
            .duration(aniDur)
            .attr({
                transform: function (d) {
                    return "translate(" + d.parent.y + "," + d.parent.x + ")"
                },
                opacity: 0
            })
            .remove();

        // Update links
        var link = svg.selectAll("path.link")
            .data(links, function (d) { return d.target.roleNumber; });
        // Add new links
        link.enter().append("path")
            .attr({
                class: "link",
                opacity: 0
            });
        // Update the links
        link.transition()
            .duration(aniDur)
            .attr({
                d: elbow,
                opacity: 1
            });
        // Remove any links we don"t need anymore
        // if part of the tree was collapsed
        link.exit()
            .transition()
            .duration(aniDur)
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

    // get the data to put in selectbox
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
        drawTree();
        centerOn(paths[paths.length - 1]);
    }
    /////////////////
    //GEOMETRY NOTES:
    //  master group tranlation point is the top right corner
    //      (transtlating to 10,10 moves top left corner to 10 10)
    //  node boxes coordinates are on the middle of the top boundery of the boxes
    //      node x & y are reversed to make the tree go left to right
    // honestly not even sure how the scaling is incorperated - probably will find a bug with it
    //      too scared to swap the zoom tranform order (scale -> translate) to svg order (translate -> scale)
    //      bc it appears to be working for now
    //BREAK GLASS IN CASE OF CONFUSION:
    // var svgTrans = d3.transform(d3.select(".main").attr("transform"))
    // console.log('current box',
    // -svgTrans.translate[0], "to", (svgWidth / svgTrans.scale[0]) - svgTrans.translate[0],
    // ",",
    // -svgTrans.translate[1] - (svgHeight/2), "to", (svgHeight / svgTrans.scale[1]) -  svgTrans.translate[1])
    /////////////////////
    //if there is a lineage selected, center it
    function centerOn(node) {
        var scale = d3.transform(d3.select(".main").attr("transform")).scale, x, y
        //zoom to 0.5 if zoomed out further than that, also make scale an int not array
        scale[0]<0.5?scale=0.5:scale=scale[0]
        y = svgHeight/2 - ((node.x  + (boxHeight/2)) * scale),
        x = svgWidth/2 - (node.y * scale)
        //TODO make this a tween that does some fancy zoom in-and-out while transitioning
        svg.transition()
            .duration(aniDur)
            .ease("cubic-in-out")
            .attr({
                transform: "translate(" + x + "," + y + ") scale(" + scale + ")"
            })
        // set so next scroll/zoom won't jump back to svg's previous position
        zoom.scale(scale).translate([x,y])
    }

    //Text wrapping woo
    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 24,
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy);
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", -dy).text(word);
                }
            }
            // find corresponding rect and reszie
            d3.select(this.parentNode.children[1]).attr('height', 24 * (lineNumber+1));
        });
    }
});
