var blessed = require('blessed'),
    contrib = require('blessed-contrib'),
    fs = require('fs'),
    path = require('path')

var screen = blessed.screen()

//create layout and widgets

var tree = contrib.tree({
    parent: screen,
	  width: '20%',
    height: '40%',
    style: {
        text: "red"
    },
    template: {
        lines: false
    },
    label: 'Filesystem Tree'
});


var topright = blessed.terminal({
    parent: screen,
    cursor: 'block',
    cursorBlink: true,
    screenKeys: false,
    label: ' multiplex.js ',
    left: '19%+1',
    top: 0,
    width: '80%+1',
    height: '70%',
    border: 'line',
    style: {
        fg: 'default',
        bg: 'default',
        focus: {
            border: {
                fg: 'green'
            }
        }
    }
});
var bottomleft = blessed.terminal({

    parent: screen,
    cursor: 'block',
    cursorBlink: true,
    screenKeys: false,
    label: ' multiplex.js ',
    left: 0,
    top: '68%+1',
    width: '70%',
    height: '30%+1',
    border: 'line',
    style: {
        fg: 'red',
        bg: 'grey',
        focus: {
            border: {
                fg: 'green'
            }
        }
    }
});
var bottomright = blessed.terminal({
    parent: screen,
    cursor: 'block',
    cursorBlink: true,
    screenKeys: false,
    label: ' multiplex.js ',
    left: '70%-1',
    top: '68%+1',
    width: '30%+1',
    height: '30%+1',
    border: 'line',
    style: {
        fg: 'red',
        bg: 'grey',
        focus: {
            border: {
                fg: 'green'
            }
        }
    }
});

[tree, topright, bottomleft, bottomright].forEach(function(term) {
    term.enableDrag(function(mouse) {
        return !!mouse.ctrl;
    });
    term.on('title', function(title) {
        screen.title = title;
        term.setLabel(' ' + title + ' ');
        screen.render();
    });
    term.on('click', term.focus.bind(term));
});
//file explorer
var explorer = {
    name: '/'
        // Custom function used to recursively determine the node path
        ,
    getPath: function(self) {
            // If we don't have any parent, we are at tree root, so return the base case
            if (!self.parent)
                return '';
            // Get the parent node path and add this node name
            return self.parent.getPath(self.parent) + '/' + self.name;
        }
        // Child generation function
        ,
    children: function(self) {
        var result = {};
        var selfPath = self.getPath(self);
        try {
            // List files in this directory
            var children = fs.readdirSync(selfPath + '/');

            // childrenContent is a property filled with self.children() result
            // on tree generation (tree.setData() call)
            if (!self.childrenContent) {
                for (var child in children) {
                    child = children[child];
                    var completePath = selfPath + '/' + child;
                    if (fs.lstatSync(completePath).isDirectory()) {
                        // If it's a directory we generate the child with the children generation function
                        result[child] = {
                            name: child,
                            getPath: self.getPath,
                            extended: false,
                            children: self.children
                        };
                    } else {
                        // Otherwise children is not set (you can also set it to "{}" or "null" if you want)
                        result[child] = {
                            name: child,
                            getPath: self.getPath,
                            extended: false
                        };
                    }
                }
            } else {
                result = self.childrenContent;
            }
        } catch (e) {}
        return result;
    }
}

//set tree
tree.setData(explorer);

// Handling select event. Every custom property that was added to node is 
// available like the "node.getPath" defined above
tree.on('select', function(node) {
    var path = node.getPath(node);
    var data = [];

    // The filesystem root return an empty string as a base case
    if (path == '')
        path = '/';

    // Add data to right array
    data.push([path]);
    data.push(['']);
    try {
        // Add results
        data = data.concat(JSON.stringify(fs.lstatSync(path), null, 2).split("\n").map(function(e) {
            return [e]
        }));
    } catch (e) {}

    screen.render();
});





tree.key('C-c', function() {
    tree.destroy();
});
bottomleft.key('C-c', function() {
    bottomleft.destroy();
});
bottomright.key('C-c', function() {
    bottomright.destroy();
});

screen.key('C-q', function() {
    return screen.destroy();
});

screen.program.key('S-tab', function() {
    screen.focusNext();
    screen.render();
});

screen.key(['tab'], function(ch, key) {
    if (screen.focused == tree.rows)
        tree.focus();
});

topright.focus()
screen.render()
