/*!
 defer.module.js - v2.0.1

 Copyright (c) 2018-2019 Thomas M. Brodhead <https://bmt-systems.com>
 Released under the MIT license

 Date: 2019-06-27
*/
/*

defer.module.js works with enqueue.module.js and loader.module.js

defer.module.js is the only JavaScript file needed to be written directly to your HTML:

<script src="[directory path]defer.module.js" type=module nonce="[nonce value]"></script>

It appends the loader.module.js file to the DOM.
loader.module.js calls enqueue.module.js, which contains the enqueue and run functions
needed for loading all necessary scripts synchronously.

You only need to edit loader.module.js.
*/

function deferJS() {
	let script = document.createElement('script');
	let fragment = document.createDocumentFragment();
	fragment.appendChild(script);
// The loader.module.js script will load all necessary scripts synchronously.
// It imports the enqueue and run routines from enqueue.module.js.
// Since it is a descendant script of this nonced script, it and all
// the scripts it loads will be trusted by CSP 3 Strict Dynamic:
	script.src = 'javascript/loader.module.js';
	script.type = 'module';
	script.classList.add('dynamicScript');
	script.crossOrigin = 'anonymous';
	document.body.appendChild(fragment);
}

function selfDestruct() {
	let script = document.currentScript || document.scripts[document.scripts.length - 1];
	if (script.parentNode) {
		script.parentNode.removeChild(script);
	}
}

if (window.addEventListener) {
	window.addEventListener('DOMContentLoaded', deferJS, false);
} else if (document.onreadystatechange) {
	document.onreadystatechange = function () {
		if (document.readyState === 'interactive') {
			deferJS();
		}
	};
} else {
	window.onload = deferJS;
}

// We no longer need this SCRIPT element once it's been run...delete and keep the DOM lean:
selfDestruct();
