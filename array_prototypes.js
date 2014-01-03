/*	array_prototypes.js
 *	Created by Ranganadh Paramkusam on 03/11/2012
*/
//	These are the prototypes of Array.

//	Removing values in an array using indices
/*
	var sample_array = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
	sample_array.remove(0,4);	// removing by indices. This will remove from 'a' (element at 0th position) to 'e' (including element at 4th position)
*/
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};


//	Finding element from an array and returning its index (works for multiple elements and return indices in an array)
/*
	var sample_array = ["d", "s", "k", "g", "f", "b", "v", "u", "s", "r", "k", "g", "b", "s", "u", "d", "j", "d", "g", "h", "s", "k", "g", "f", "b", "e", "u", "d", "r"];
	sample_array.find('d');		//	returns [0, 15, 17, 27];
*/

Array.prototype.find = function(searchStr) {
	var returnArray = false;
	for (i=0; i<this.length; i++) {
		if (typeof(searchStr) == 'function') {
			if (searchStr.test(this[i])) {
				if (!returnArray) { returnArray = [] }
					returnArray.push(i);
				}
			} else {
				if (this[i]===searchStr) {
					if (!returnArray) { returnArray = [] }
						returnArray.push(i);
			}
		}
	}
	return returnArray;
}

