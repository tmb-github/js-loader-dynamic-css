/*!
 enqueue.module.js - v2.0.1

 Copyright (c) 2018-2019 Thomas M. Brodhead <https://bmt-systems.com>
 Released under the MIT license

 Date: 2019-06-27
*/

/*
Import this module in the loader.module.js and use the enqueue() and run()
methods to load all executable scripts synchronously.
*/

// for holding the queue of scripts:
let scriptObjects = [];

// to translate camelCase custom data keys into kebob-case attribute names:
function camelCaseToKebobCase(str) {
	return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}

// to delete all scripts with unique class name:
function deleteDynamicScripts() {
	Array.prototype.forEach.call(document.querySelectorAll('.dynamicScript'), function (script) {
		script.parentNode.removeChild(script);
	});
}

// to fill the scriptObjects array:
function enqueue(object) {
	scriptObjects.push(object);
}

// to load the enqueued script to the DOM synchronously:
function loadScriptsSynchronously() {

// retrieve the first script attribute object in array & remove it from array:
	let attributeObject = scriptObjects.shift();

// create a fragment and a script element:
	let fragment = document.createDocumentFragment();
	let script = document.createElement('script');

// append script to fragment first; edit its attributes while attached to fragment:
	fragment.appendChild(script);

// retrieve attributes and values as key/value pairs in the object,
// setting the attributes on the script element:
	Object.keys(attributeObject).forEach(function (key) {
		script[key] = attributeObject[key];
// custom data attributes must be translated from camelCase to kebob-case:
		if (key.substring(0, 4) === 'data') {
			script.setAttribute(camelCaseToKebobCase(key), attributeObject[key]);
		}
	});

// Even though 'text/javascript' is the default, state it explicitly for subsequent logic:
	if ((!script.hasAttribute('type')) || (script.type === '')) {
		script.setAttribute('type', 'text/javascript');
	}

// add unique class name to the script:
	script.classList.add('dynamicScript');

// if there are scripts remaining in the queue and the current script is executable:
	if ((scriptObjects.length > 0) && ((script.type === 'text/javascript') || (script.type === 'module'))) {
// ...use the 'onload' event of the script to load the next enqueued script:
		script.onload = loadScriptsSynchronously;
// ...but in case the script cannot be loaded, use the 'onerror' event...
		script.onerror = function (e) {
// ...to log error info...
			console.log(script.src + ' could not load:');
			console.log(e);
// ...and to continue loading subsequent scripts:
			loadScriptsSynchronously();
		};
	}

// append the fragment regardless of script type:
	document.body.appendChild(fragment);

// if there are scripts remaining in the queue and the appended script was non-executable:
	if ((scriptObjects.length > 0) && ((script.type !== 'text/javascript') && (script.type !== 'module'))) {
// proceed to the next script in the queue:
		loadScriptsSynchronously();
	}
}

function run() {
// Load all enqueued scripts synchronously:
	loadScriptsSynchronously();

// When the window is loaded, delete the dynamic scripts:
	window.onload = deleteDynamicScripts;
}

export default Object.freeze({enqueue, run});