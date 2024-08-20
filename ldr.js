var host = 'http://tizen.smartone-iptv.com/';
var subdomain = 'tizen'; //String(/:\/\/([^\/]+)/.exec(window.location.href)[1].split('.')[0] || window.location.host.split('.')[0]); // 
var stop_loading = false;
/*define object that will wrap our logic*/
var ScriptLoader = {
    // Stop: false,

    LoadFile: function (url, type, callback) {
        console.log('stop_loading', stop_loading)
        var self = this;
        if (stop_loading) {
            return false;
        }

        var link = url + type + '?v=' + Date.now();

        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (type === 'js') self.AddScript(xhr.responseText, callback);
                    if (type === 'css') self.AddCss(link, callback);
                } else {
                    console.error('error loading' + link);
                    if (console) console.error(xhr.statusText);
                }
            }
        };
        xhr.open("GET", link, false);/*last parameter defines if call is async or not*/
        xhr.send(null);
    },

    AddScript: function (code, callback) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.textContent = code;
        if (callback) {
            this.loadConfig();
        }

        document.getElementsByTagName("head")[0].appendChild(script);
    },

    AddCss: function (url, callback) {
        var link = document.createElement("link");
        link.type = 'text/css';
        link.rel  = 'stylesheet';
        link.href = url;

        document.getElementsByTagName("head")[0].appendChild(link);
    },

    loadConfig: function() {
        console.log('load config');
        var device = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
        $(document).ready(function() {
            if (typeof CONFIG !== 'undefined') {
                CONFIG[device] = true;
            }
        });
        stop_loading = true;
    },
};            
// Globals
ScriptLoader.LoadFile(host + atob('Y3NzL2Jvb3RzdHJhcC5taW4u'), 'css'); // css/bootstrap.min.            
ScriptLoader.LoadFile(host + atob('anMvanF1ZXJ5Lg=='), 'js'); // js/jquery.
ScriptLoader.LoadFile(host + atob('anMvYm9vdHN0cmFwLmJ1bmRsZS5taW4u'), 'js'); // js/bootstrap.bundle.min.
// CSS
ScriptLoader.LoadFile(host + atob('Y3NzL2ltcG9ydC4='), 'css'); // css/import.
ScriptLoader.LoadFile(host + atob('Y3NzL2dsb2JhbC5taW4u'), 'css'); // css/global.min.
// Javascripts
ScriptLoader.LoadFile(host + atob('anMvaW1wb3J0Lg=='), 'js'); // js/import.
ScriptLoader.LoadFile(host + atob('anMvY29uZmlnLg=='), 'js'); // js/config.
ScriptLoader.LoadFile(host + atob('anMvc291cmNlLm1pbi4=') + subdomain + '.', 'js'); // js/source.min.vewd.
ScriptLoader.LoadFile(host + atob('anMvYXBwLm1pbi4='), 'js', 'true'); // js/app.min.
