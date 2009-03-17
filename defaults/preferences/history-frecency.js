/* Disable history frecency calculation. xulrunner sometimes consumes
 * unreasonable amounts of CPU time if this preference is not set.
 * As conkeror does not use the frecency stat, it is disabled by
 * default. See also:
 *
 * http://kb.mozillazine.org/Places.frecency.updateIdleTime
 */
pref("places.frecency.updateIdleTime", 0);
