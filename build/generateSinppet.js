var fs = require('fs');
var path = require('path');
var wxml = require('wux-weapp-snippets/snippets/wxml.json');
var script = require('wux-weapp-snippets/snippets/srcipt.json');

// Sublime Code Snippet
var SNIPPET = `<snippet>
	<content><![CDATA[
{{contents}}
]]></content>
	<tabTrigger>{{trigger}}</tabTrigger>
	<scope>{{scope}}</scope>
	<description>Wux Weapp: {{description}}</description>
</snippet>`;

// Regular
var MATCH = /\${\d\|(.*?)\|}/gi;
var MATCH$1 = /\${\d\|/;
var MATCH$2 = /\|}/;
var MATCH$3 = /\|(.*?)\|/;
var MATCH$4 = /[(\$)wux(\-)]+/;

// Path
var ROOT_PATH = path.join(__dirname, '../snippets');
var WXML_PATH = path.join(ROOT_PATH, 'wxml');
var SCRIPT_PATH = path.join(ROOT_PATH, 'script');

// Delete Folder
deleteFolder(ROOT_PATH);

// Write wxml
Object.keys(wxml).forEach((function (key) {
	var value = wxml[key];
	var folderPath = path.join(WXML_PATH, key.split(':')[0].replace(MATCH$4, ''));
	var files = render(value, wxml);
	mkdirs(folderPath, function () {
		if (files.length > 0) {
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				var fileName = path.join(folderPath, file.trigger.replace(/:/, '-') + '.sublime-snippet');
				var fileString = inspectFile(SNIPPET, Object.assign({}, file, { scope: 'text.html' }));
				writeFile(fileName, fileString);
			}
		}
	});
}));

// Write script
Object.keys(script).forEach((function (key) {
	var value = script[key];
	var folderPath = path.join(SCRIPT_PATH, key.split(':')[0].replace(MATCH$4, '').toLowerCase());
	var files = render(value, script);
	mkdirs(folderPath, function () {
		if (files.length > 0) {
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				var fileName = path.join(folderPath, file.name + '.sublime-snippet');
				var fileString = inspectFile(SNIPPET, Object.assign({}, file, { scope: 'source.js' }));
				writeFile(fileName, fileString);
			}
		}
	});
}));

/**
 * Delete Folder
 */
function deleteFolder(path) {
	var files = [];
	if (fs.existsSync(path)) {
	    files = fs.readdirSync(path);
	    files.forEach(function (file, index) {
	        var curPath = path + "/" + file;
	        if (fs.statSync(curPath).isDirectory()) {
	            deleteFolder(curPath);
	        } else {
	            fs.unlinkSync(curPath);
	        }
	    });
	    fs.rmdirSync(path);
	}
}

/**
 * Create Folder
 */
function mkdirs(dirname, callback) {
    fs.exists(dirname, function (exists) {
        if (exists) {
            callback();
        } else {
            mkdirs(path.dirname(dirname), function () {
                fs.mkdir(dirname, callback);
            });
        }
    });
}

/**
 * Write File
 */
function writeFile(fileName, fileString) {
	fs.writeFile(fileName, fileString, function (err) {
	  if (err) {
	    console.error('error writeFile:', err);
	  }
	});
}

/**
 * Inspect File
 */
function inspectFile(snippet, options) {
	return snippet.replace(/{{contents}}/g, options.contents)
		.replace(/{{trigger}}/g, options.trigger)
		.replace(/{{scope}}/g, options.scope)
		.replace(/{{description}}/g, options.description)
}

/**
 * 匹配指定条件的文件
 */
function matchFile(body) {
	var result = [];
	var match = body.match(MATCH);
	if (match && match.length > 0) {
		for (var i = 0; i < match.length; i++) {
			var values = match[i].replace(MATCH$1, '').replace(MATCH$2, '').split(',')
			if (values.length > 0) {
				result.push(values)
			}
		}
	}
	return result;
}

/**
 * 获取数组元素的所有排列情况
 */
function doExchange(arr) {
    var len = arr.length;
    if (len >= 2) {
        var len1 = arr[0].length;
        var len2 = arr[1].length;
        var lenBoth = len1 * len2;
        var items = new Array(lenBoth);
        var index = 0;
        for (var i = 0; i < len1; i++) {
            for (var j = 0; j < len2; j++) {
                if (arr[0][i] instanceof Array) {
                    items[index] = arr[0][i].concat(arr[1][j]);
                } else {
                    items[index] = [arr[0][i]].concat(arr[1][j]);
                }
                index++;
            }
        }
        var newArr = new Array(len - 1);
        for (var i = 2; i < arr.length; i++) {
            newArr[i - 1] = arr[i];
        }
        newArr[0] = items;
        return doExchange(newArr);
    } else {
        return arr[0];
    }
}

/**
 * 替换字符串
 */
function replace(str, match, values) {
	if (match && match.length > 0) {
		for (var i = 0; i < match.length; i++) {
			str = str.replace(MATCH$3, ':' + values[i])
		}
	}
	return str
}

/**
 * 获取指定格式的值
 */
function render(value, source) {
	var result = [];
	var body = Array.isArray(value.body) ? value.body.join('\n') : value.body
	var match = matchFile(body);
	var getName = function (name) {
		return name.replace(/:/, '-').replace(MATCH$4, '').toLowerCase();
	};

	if (match && match.length > 0) {
		var names = doExchange(match);
		if (names.length > 0) {
			result.push({
				name: getName(value.prefix),
				trigger: value.prefix.replace(/\$/, ''),
				contents: replace(body, match, names.map(function(v) { return Array.isArray(v) ? v[0] : v })),
				description: value.description,
			})

			for (var i = 0; i < names.length; i++) {
				var values = Array.isArray(names[i]) ? names[i] : [names[i]];
				var contents = replace(body, match, values)
				var trigger = value.prefix + (value.prefix.indexOf(':') === -1 ? ':' : '-') + values.join('-')
				if (source[trigger]) break
				result.push({
					name: getName(trigger),
					trigger: trigger.replace(/\$/, ''),
					contents: contents,
					description: value.description,
				})
			}
		}
	} else {
		result.push({
			name: getName(value.prefix),
			trigger: value.prefix.replace(/\$/, ''),
			contents: body,
			description: value.description,
		})
	}

	return result;
}