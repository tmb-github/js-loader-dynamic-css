/*!
 appendToCSS.module.js - v2.0.1

 Copyright (c) 2018-2019 Thomas M. Brodhead <https://bmt-systems.com>
 Released under the MIT license

 Date: 2019-06-27
*/

/*

PURPOSE:

This code allows styles to be written to dynamic style sheets with ease,
eliminating the need for inline styles and allowing for a strict style-src CSP.

USAGE:

o is the object exported from this module. There are 2 public methods:

o.getNonce(selector);
o.appendToCSS(selector, declaration[, sheetIdName]);

o.getNonce() is mandatory if a style-src CSP is in use.
The selector defaults to 'meta[name=web_author]'.
o.getNonce() must be invoked BEFORE o.appendToCSS() is invoked.

In o.appendToCSS, the selector is a string such as:

':root'
'.my-class-1 .your-class-2 a:hover'
'input:checked + label'

...and the declaration one or more stylings:

'{ --background-color: red; }'
'{ color: red; box-shadow: 12px 12px 2px 1px rgba(0, 0, 255, .2); }'
'{font-size: 18px; padding: 5px 9px; transition: all .15s ease}'

Hence:

o.appendToCSS(':root', '{ --background-color: red; }');
o.appendToCSS('.my-class-1 .your-class-2 a:hover', '{ color: red; box-shadow: 12px 12px 2px 1px rgba(0, 0, 255, .2); }');
o.appendToCSS('input:checked + label', '{font-size: 18px; padding: 5px 9px; transition: all .15s ease}');

NB: Use exactly one space character between terms, so do NOT do this:

'{color:red;	box-shadow:12px 12px 2px 1px rgba(0,0,  255,.2);	}'

...but instead write this:

'{ color: red; box-shadow: 12px 12px 2px 1px rgba(0, 0, 255, .2); }'

The routine corrects for this, but it is best to write it in the expected format.

The optional third parameter, the sheetIdName, defaults to 'dynamic-style-element'

NB: When adding a new rule, if an identical selector + declaration rule is found,
it will be deleted IF AND ONLY IF the only difference between
the new rule and the existing rule is the values of declarations.
If even a single attribute (e.g., 'background-color') exists in the new rule
but not the old rule (or vice-versa), then the existing rule is retained and the
new rule is added to a new sheet at the end of the sequence of sheets.

This allows an existing rule to be updated by a process of deleting the old rule with
its value(s) and replacing it with a new rule with its values.

This eliminates the need for dynamic inline style rules.

If noncing styles with CSP, write the nonce not only to the STYLE element
in the HTML, but also to a data-nonce attribute on a dedicated element somewhere
in the DOM that is certain to exist and be selectable with ease.

The default location for this is META element in the HEAD with attribute name=web_author
(with content=[your name or organization name]) and the nonce stored in a
data-nonce attribute. E.g.:

<meta name=web_author content="BMT Systems, Inc." data-nonce="BZxPdf9pjXBz9vaY5yi5i/nXA9CLjsaYyjIJyg1k">

The nonce will be retrieved by this routine and used when constructing original,
dynamic sheets, which will only have effect if the nonce is employed. The routine
will delete that attribute from the META element so it cannot be retrieved by an attacker.

So that the routine has access to the nonce, you MUST call the o.getNonce() method once
(and once only) before executing the o.appendToCSS() method (which may be invoked any
number of times).

*/

// Two private global variables:

let dynamicStyleSheet;
let nonce;

// Two public and exported methods:

function appendToCSS(selector, declarations, sheetIdName = 'dynamic-style-element') {
	let fragment;
	let sameArrayContents;
	let isNumeric;
	let lastCssRuleIndex;
	let position;
	let propertiesArray;
	let propertiesMatch;
	let regex;
	let regexMatch;
	let rule;
	let selectorExists;
	let styleElement;

// ***** HELPER FUNCTIONS ***** //

	isNumeric = function (value) {
		return !Number.isNaN(value - parseFloat(value));
	};

	lastCssRuleIndex = function (sheet) {
		return sheet.cssRules.length;
	};

	sameArrayContents = function (array1, array2) {
		return (array1.length === array2.length) && (array1.every(function (value, index) {
			return value === array2[index];
		}));
	};

// ***** MAIN ROUTINE ***** //

// FIRST: If dynamicStyleSheet variable with unique ID doesn't yet exist, create it
// ('#dynamic-style-element' using the default third parameter of appendToCSS):
	if (!document.querySelector('#' + sheetIdName)) {
		fragment = document.createDocumentFragment();
		styleElement = document.createElement('style');
		fragment.appendChild(styleElement);
// Add unique ID:
		styleElement.setAttribute('id', sheetIdName);
// if a nonce is in use, set the nonce attribute to it:
		if (nonce) {
			styleElement.setAttribute('nonce', nonce);
		}
// Append it to the head.
		document.head.appendChild(fragment);
// Save the reference to the sheet.
		dynamicStyleSheet = styleElement.sheet;
	}

// Next, reconstruct the 'selector' argument with only one space character between consecutive attributes:
	selector = selector.split(/\s+/).join(' ');

// Next, reconstruct the 'declarations' argument using the correct formatting,
// e.g., '{ max-height: 10px; color: blue; }'
// So, first remove all '{' and '}' characters and trim the result:
	declarations = declarations.replace(/[{}]/g, '').trim();
// Next, ensure that the last style property ends in a semicolon:
	if (declarations.substr((declarations.length - 1), 1) !== ';') {
		declarations += ';';
	}
// Then reconstruct the declarations argument with a single space character between each attribute:
	declarations = '{ ' + declarations.split(/\s+/).join(' ') + ' }';

// Now construct the CSS rule from the properly formatted 'selector' and 'declarations' arguments:
	rule = selector + ' ' + declarations;

// Now, extract the properties ('margin-top', etc.) from the declarations block.
// NB: The values are unimportant.
// Finds strings of non-white-space characters ending in colons; add them to propertiesArray:
	regex = /(\S+):(?!\S+)/g;
	propertiesArray = [];
	regexMatch = regex.exec(declarations);
	while (regexMatch !== null) {
		propertiesArray.push(regexMatch[1]);
		regexMatch = regex.exec(declarations);
	}

// Next, see whether the selector already exists in the dynamic style sheet.
// Set variables, assuming failure (to be revised on success):
	selectorExists = false;
	propertiesMatch = false;

// Cycle through the dynamic style sheet;
// look for matching selectors, and then determine whether the style settings are different or not:
	Object.keys(dynamicStyleSheet.cssRules).forEach(function (key) {
		let sheetPropertiesArray;
		let sheetSelector;

// Does the selector text match?
// If so, then are there the same properties ('margin-left', etc.) in the rule set?
// --> We want to replace an existing rule-set if the selector is the same and all of the properties are the same, regardless of their attributes!

// Each sheet has a selector (e.g., 'body .my-class')
// For that selector, reconstruct the rule:
		sheetSelector = dynamicStyleSheet.cssRules[key].selectorText;

// Does the sheetSelector match the selector in the rule set being processed
		if (sheetSelector === selector) {
// Fill sheetPropertiesArray with all properties (but not values!) for the sheetSelector under consideration:
			sheetPropertiesArray = [];
// The initial indices in the array are numeric; they have our declarations, and we want those only.
// In order to break from the forEach loop once we reach the non-numeric indices, we'll need to throw
// an exception in a try/catch block to get out of it early:
			try {
				Object.keys(dynamicStyleSheet.cssRules[key].style).forEach(function (index) {
					if (isNumeric(index)) {
						sheetPropertiesArray.push(dynamicStyleSheet.cssRules[key].style[index]);
					} else {
						throw 'End of numeric indices.';
					}
				});
			} catch (ignore) {
// For testing only:
				//console.log(ignore);
			}
// If the set of properties (but not values!) is the same between the rule-set being processed
// and the rule-set in the sheet, then we've got a match:
			if (sameArrayContents(propertiesArray, sheetPropertiesArray)) {
				selectorExists = true;
				propertiesMatch = true;
// 'position' records the location in the dynamic styleSheet where the rule to be deleted is located:
				position = key;
			}
		}
	});

// Now, armed with this info, we may proceed:
// If the selector exists:
	if (selectorExists) {
// And the properties are identical (irrespective of the values!):
		if (propertiesMatch) {
// Delete the old rule...
			dynamicStyleSheet.deleteRule(position);
// ...and add the new one at the end of the sheet, using our helper function (lastCssRuleIndex):
			dynamicStyleSheet.insertRule(rule, lastCssRuleIndex(dynamicStyleSheet));
		}
	} else {
// If the selector isn't there at all, just add the new rule to the end of the sheet:
		dynamicStyleSheet.insertRule(rule, lastCssRuleIndex(dynamicStyleSheet));
	}

}

// If using style-src CSP, you must invoke getNonce() with either the default selector
// or an original selector for retrieving (and then deleting) the nonce needed for the
// dynamic style sheets.

// Default: look for web_author META tag and collect data-nonce value from it if present:
function getNonce(selector = 'meta[name=web_author]') {
	let elementWithDataNonce = document.querySelector(selector);
	if (elementWithDataNonce && Boolean(elementWithDataNonce.dataset.nonce)) {
		nonce = elementWithDataNonce.dataset.nonce;
// delete the dataNonce attribute to hide from an attacker:
		delete elementWithDataNonce.dataset.nonce;
	}
}

export default Object.freeze({appendToCSS, getNonce});