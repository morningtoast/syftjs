/*
	Syft Quick Filtering
	2014 - Brian Vaughn, @morningtoast

	Inspired by PourOver but it was more than I needed, so I made this.

	This class will filter through a dataset based on specified search criteria.
	Intended for use on single-page search/filter views.

	+ Requires Underscore JS - http://underscorejs.org

	Syntax:

	1. Load dataset
		Syft.load(str jsonUrl); // Grab JSON dataset from URL
		OR
		Syft.load(array myDataObject); // When dataset already exists as an object


	2. Apply filters

		Syft.contains(str attributeKey, str valueToFind, bool exactMatchOnly [false]);

		Syft.range(str attributeKey, int minValue, int minMax, bool isInclusive [false]);


	3. Sort/Paginate

		Syft.sort(str attributeKey, bool reverseOrder [false]);
		Syft.rsort(str attributeKey); // Shortcut for .sort() with reverse

		Syft.paginate(int recordsPerPage);


	4. Do something with results

		Current filtered results are always accessible via array
		Syft.results

		Loop through the results as you need to display results. Combine with jQuery or whatever.


	5. Filter again

		Syft.new();

		You only need to load() your dataset once.
		For every new filter action you should run .new() and then start with Step 2.

*/
var Syft = {
	results:[],
	source: false,

	load: function(detect, callback) {
		if (_.isString(detect)) {
			// Argument is URL, fetch and then init
			this.fetch(detect, callback);
		} else {
			// Argument is object, use init
			this.local(detect);

			if (callback) {	callback(); }
		}
	},

	fetch: function(url, callback) {
		var xmlhttp = new XMLHttpRequest();
		var self    = this;

	    xmlhttp.onreadystatechange = function() {
	        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
	        	self.local(JSON.parse(xmlhttp.responseText));

	        	if (callback) { callback(); }
	        }
	    }

	    xmlhttp.open("GET", url, true);
	    xmlhttp.send();
	},

	local: function(dataset) {
		this.source  = dataset.slice();
		this.results = dataset.slice(); // Dupes from original set
	},

	new: function() {
		this.results = this.source.slice();
	},

	_checkString: function(haystack, needle, exactMatch) {
		success  = false;
		haystack = haystack.toLowerCase();
		needle   = needle.toLowerCase();		

		if (exactMatch || !isNaN(needle)) { // NaN check allows for single number to be searched for
			if (haystack == needle) { success = true; }
		} else {
			if (haystack.indexOf(needle) >= 0) { success = true; }
		}

		return(success);
	},

	_checkRange: function(number, min, max, exclusive) {
		success = false;

		if (exclusive) {
			if (number > min && number < max) { success = true; }
		} else {
			if (number >= min && number <= max) { success = true; }
		}

		return(success);
	},

	_trim: function(removeList) {
		var self       = this;
		var newResults = [];

		_.each(removeList, function(pos) {
			self.results[pos] = false;
		});

		_.each(this.results, function(row, key) {
			if (row) { newResults.push(row); }
		});

		this.results = newResults;
	},


	contains: function(attribute, find, strict) {
		var searchSet;
		var nonmatch = [];
		var self = this;

		if (_.isArray(find)) {
			searchSet = find;
		} else {
			searchSet = [];
			searchSet.push(String(find));
		}

		_.each(searchSet, function(term, ka) {
			_.each(self.results, function(record, resultKey) {
				var attributeValue = record[attribute];
		
				if (_.isArray(attributeValue)) {
					var matches = 0;

					if (!strict) {
						_.each(attributeValue, function(value, kc) {
							if (self._checkString(value, term, strict)) { matches += 1; }
						});
					} else {
						if (_.contains(attributeValue, term)) { matches += 1; }
					}

					if (matches <= 0) {	nonmatch.push(resultKey); }
				} else {
					// Attribute is not an array, just do compares		
					if (!self._checkString(attributeValue, term, strict)) {
						nonmatch.push(resultKey);
					}
				}
				
			});
		});

		this._trim(nonmatch);
	},

	exact: function(attribute, find) {
		this.contains(attribute, find, true);
	},

	range: function(attribute, min, max, inclusive) {
		var min      = parseInt(min);
		var max      = parseInt(max);
		var nonmatch = [];
		var self     = this;
		_.each(this.results, function(v,k) {
			if (!self._checkRange(v[attribute], min, max, inclusive)) {
				nonmatch.push(k);
			}
		});

		this._trim(nonmatch);
	},

	sort: function(attribute, reverse) {
		if (reverse) {
			this.results = _.sortBy(this.results, attribute).reverse();
		} else {
			this.results = _.sortBy(this.results, attribute);
		}
	},

	rsort: function(attribute) {
		this.sort(attribute, true);
	},

	paginate: function(setSize) {
		var paginated = [];
		var size      = this.results.length;
		var offset    = 0;
		var loops     = Math.round(size / setSize);

		if (!setSize) { setSize = 10; }

		// Loop through full results and chunk into array sets
		for (a=0; a < loops; a+=1) {
			console.log("chunking "+offset+", "+(offset+setSize));
			paginated.push(this.results.slice(offset, (offset+setSize)));
			offset += setSize;
		}
	}
}
