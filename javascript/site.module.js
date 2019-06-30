/*!
 site.module.js - v2.0.1

 Copyright (c) 2018-2019 Thomas M. Brodhead <https://bmt-systems.com>
 Released under the MIT license

 Date: 2019-06-27
*/

import o from './appendToCSS.module.js';

let cssRulesDisplay = document.querySelector('#css-rules-display');
let h3 = document.querySelector('h3');
let h3FontSize = parseFloat(window.getComputedStyle(h3).getPropertyValue('font-size'));

// retrieve nonce, here using default 'meta[name=web_author]' as the selector:
o.getNonce();

function logStyleSheets() {
	let rules = '<code>';
	let count = 0;
	Array.prototype.forEach.call(document.querySelectorAll('STYLE'), function (element) {
		let dynamicStyleSheet = element.sheet;
		Object.keys(dynamicStyleSheet.cssRules).forEach(function (key) {
			rules = rules + dynamicStyleSheet.cssRules[key].cssText + '<br>';
			count += 1;
		});
	});
// For the example code at this site, there will be a maximum of 5 lines of CSS
// Pad-out to 5 lines if ever less than that:
	while (count <= 4) {
		rules = rules + '<br>';
		count += 1;
	}
	rules = rules + '</code>';
	cssRulesDisplay.innerHTML = rules;
}

// Set event listeners:

document.querySelector('#background-color-selector').addEventListener('input', function (ignore) {
	o.appendToCSS(':root', '{ --background-color: ' + event.target.value + '; }');
	logStyleSheets();
}, false);

document.querySelector('#plus-1px').addEventListener('click', function (ignore) {
	h3FontSize += 1;
	o.appendToCSS(':root', '{ --font-size: ' + h3FontSize + 'px; }');
	logStyleSheets();
}, false);

document.querySelector('#minus-1px').addEventListener('click', function (ignore) {
	h3FontSize -= 1;
	o.appendToCSS(':root', '{ --font-size: ' + h3FontSize + 'px; }');
	logStyleSheets();
}, false);

// Write out the initial CSS:

logStyleSheets();
