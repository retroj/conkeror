/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2010 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

/**
 * array_p returns true if its argument is an array, otherwise false.
 */
function array_p (ob) {
    return ob && ob.constructor == Array || false;
}

/**
 * make_array returns its argument unchanged if it is already an array, an
 * empty array if its argument is undefined, otherwise an array containing
 * its object as the sole element.
 */
function make_array (ob) {
    if (array_p(ob))
        return ob;
    if (ob === undefined)
        return [];
    return [ob];
}

/**
 * remove_duplicates_filter returns a function that can be used in
 * Array.filter.  It removes duplicates.  Optional argument cmp is a
 * comparison function to test equality.  The default comparison function
 * tests equality of the string representation of the objects, making it
 * unsuitable for use filtering a list of objects of compound data types.
 */
function remove_duplicates_filter (cmp) {
    if (cmp) {
        let acc = [];
        return function (x) {
            if (acc.some(function (y) cmp(x, y)))
                return false;
            acc.push(x);
            return true;
        };
    }
    let acc = {};
    return function (x) {
        if (acc[x]) return false;
        acc[x] = 1;
        return true;
    };
}


/**
 * Given an array, switches places on the subarrays at index i1 to i2 and j1 to
 * j2. Leaves the rest of the array unchanged.
 */
function switch_subarrays (arr, i1, i2, j1, j2) {
    return arr.slice(0, i1) +
        arr.slice(j1, j2) +
        arr.slice(i2, j1) +
        arr.slice(i1, i2) +
        arr.slice(j2, arr.length);
}


/**
 * splice_ranges: Given an ordered array of non-overlapping ranges,
 * represented as elements of [start, end], insert a new range into the
 * array, extending, replacing, or merging existing ranges as needed.
 * Mutates `arr' in place, but returns the reference to it.
 *
 * Examples:
 *
 * splice_range([[1,3],[4,6], 5, 8)
 *  => [[1,3],[4,8]]
 *
 * splice_range([[1,3],[4,6],[7,10]], 2, 8)
 *  => [[1,10]]
 */
function splice_range (arr, start, end) {
    for (var i = 0; i < arr.length; ++i) {
        let [n,m] = arr[i];
        if (start > m)
            continue;
        if (end < n) {
            arr.splice(i, 0, [start, end]);
            break;
        }
        if (start < n)
            arr[i][0] = start;

        if (end >= n) {
            /*
             * The range we are inserting overlaps the current
             * range. We need to scan right to see if it also contains any other
             * ranges entirely, and remove them if necessary.
             */
            var j = i;
            while (j < arr.length && end >= arr[j][0])
                j++;
            j--;
            arr[i][1] = Math.max(end, arr[j][1]);
            arr.splice(i + 1, j - i);
            break;
        }
    }
    if (start > arr[arr.length - 1][1])
        arr.push([start, end]);
    return arr;
}

provide("array");
