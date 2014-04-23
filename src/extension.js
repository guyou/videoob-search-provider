/* Videoob Search Provider for Gnome Shell
 *
 * 2014 Guilhem Bonnefille <guilhem.bonnefille@gmail.com>
 *
 * This programm is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 */

const Main          = imports.ui.main;
const Search        = imports.ui.search;
const SearchDisplay = imports.ui.searchDisplay;
const Gio           = imports.gi.Gio;
const GLib          = imports.gi.GLib;
const Lang          = imports.lang;
const Shell         = imports.gi.Shell;
const IconGrid      = imports.ui.iconGrid;
const Util          = imports.misc.util;
const St            = imports.gi.St;
const Atk           = imports.gi.Atk;

/* let xdg-open pick the appropriate program to open/execute the file */
const DEFAULT_EXEC = 'videoob';
/* Limit search results, since number of displayed items is limited */
const MAX_RESULTS = 40;
const MAX_ROWS = 3; // this is currently ignored, but bug report is filed : https://bugzilla.gnome.org/show_bug.cgi?id=687474
const ICON_SIZE = 25;

var videoobSearchProvider = null;

/*
 * "id": "3qVJLOK_zao@youtube"
 * "title": "GNOME Shell 3.8 search redesign"
 * "url": null
 * "ext": null
 * "author": "Cosimo Cecchi"
 * "description": null
 * "date": null
 * "size": null
 * "rating": null
 * "rating_max": null
 * "nsfw": false
 * "thumbnail": {"id": "https://i.ytimg.com/vi/3qVJLOK_zao/0.jpg", "title": null, "url": "https://i.ytimg.com/vi/3qVJLOK_zao/0.jpg", "ext": null, "author": null, "description": null, "date": null, "size": null, "rating": null, "rating_max": null, "nsfw": false, "thumbnail": null, "data": null}
 * "data": null
 * "duration": "0:00:45"
 */

const VideoobSearchProvider = new Lang.Class({
    Name: 'VideoobSearchProvider',
    Extends: Search.SearchProvider,

    _init : function() {
        this.appInfo = Gio.DesktopAppInfo.new("qvideoob.desktop");
        var actor = new SearchDisplay.ListSearchResults(this);
        //Search.SearchProvider.prototype._init.call(this, "Videos from Videoob");
    },

    getResultMetas: function(resultIds,callback) {
        let metas = [];
        for (let i = 0; i < resultIds.length; i++) {
            metas.push(this.getResultMeta(resultIds[i]));
        }
        callback(metas);
//        return metas;
    },

    getResultMeta : function(resultId) {
        let description = "";
        if (resultId.description)
            description += resultId.description;
        if (resultId.duration)
            description += " (" + resultId.duration +")";
        return {
            'id': resultId,
            'name': resultId.title,
            'description': description,
            'createIcon': function(size) {
                let thumbnail = null;
                if (resultId.thumbnail != null) {
                    thumbnail = resultId.thumbnail.url;
                    let textureCache = St.TextureCache.get_default();
                    var icon = textureCache.load_uri_async(thumbnail, ICON_SIZE, ICON_SIZE);
                    return icon;
                } else
                    return null;
            }
        };
      },

    activateResult : function(result) {
        // Action executed when clicked on result
        var id = result.id;
        Util.spawn([DEFAULT_EXEC, "play", id]);
    },

    getInitialResultSet : function(terms) {
        // terms holds array of search items
        // check if 1st search term is >2 letters else drop the request
        if(terms[0].length < 3) {
            return [];
        }

        let r = GLib.spawn_command_line_sync(DEFAULT_EXEC+' -f json search '+terms);
        // TODO test r[0]
        let result = JSON.parse(r[1]);
        //global.log(String.format("Found {length}", {length: result.length}));
        global.log("Found " + result.length);

        return this.searchSystem.pushResults(this, result );
    },

    getSubsearchResultSet : function(previousResults, terms) {
        // check if 1st search term is >2 letters else drop the request
        if(terms[0].length < 3) {  
            return [];
        }
        return this.getInitialResultSet(terms);
    },    
    
});

function init(meta) {
}

function enable() {
    global.log("Videoob enabled");
    videoobSearchProvider = new VideoobSearchProvider();
    Main.overview.addSearchProvider(videoobSearchProvider);
}

function disable() {
    Main.overview.removeSearchProvider(videoobSearchProvider);
    videoobSearchProvider = null;
    global.log("Videoob disabled");
}

