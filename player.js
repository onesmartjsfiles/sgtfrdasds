/*
 *******************************************************************************
 * Copyright (c) 2013 Mautilus, s.r.o. (Czech Republic)
 * All rights reserved
 *  
 * Questions and comments should be directed https://github.com/mautilus/sdk/issues
 *
 * You may obtain a copy of the License at LICENSE.txt
 *******************************************************************************
 */

/**
 * Samsung Player class
 * 
 * @author Mautilus s.r.o.
 * @class Device_Android_Player
 * @extends Player
 */

Device_Android_Player = (function(Events, Deferrable) {
    var Device_Android_Player = {};

    $.extend(true, Device_Android_Player, Deferrable, {
        /**
         * @inheritdoc Player#initNative
         */
        initNative: function(config) {
            // var scope = this;
            console.log('PLAYER ANDROID initNative');
            // this.streaminfoready = false;
            // this.deinitNative();            
            this.PLAYER = window.ExoPlayer;
            this.state(this.STATE_PREPARING);
        },

        /**
         * Internal player timer
         * 
         * @private
         */
        tick: function() {
            var scope = this;
            if (this.currentState == this.STATE_PLAYING) {
                this.PLAYER.getState(
                    function(e) {
                        // console.log("Player event", e);
                        // scope.duration = e.duration;
                        var position = parseInt(e.position);
                        scope.currentTime = position;
                        scope.onTimeUpdate(position);
                    },
                    function(e) { console.log("Failed to get state", e)}
                )
            }
        },

        /**
         * Call native API, override this method with your device player
         *
         * @private
         * @param {String} cmd Command
         * @param {Object} [attrs]
         */
        native: function(cmd, attrs) {
            var scope = this;

            if (cmd === 'play') {
                if (attrs && attrs.url) {
                    this.Vheight = 'A';
                    this.Vwidth = 'N';
                    this.total_audio = 1;
                    this.total_subtitle = 0;
                    this.audios = [];
                    this.subtitles = [];                    
                    this.streaminfoready = false;
                    // url = attrs.url;
                    // this._seekOnPlay = null; // clear

                    var successCallback = function(success) {
                        // console.log("success", success)
                        // /*
                        //     START_EVENT
                        //     STOP_EVENT
                        //     KEY_EVENT
                        //     TOUCH_EVENT
                        //     LOADING_EVENT
                        //     STATE_CHANGED_EVENT
                        //     POSITION_DISCONTINUITY_EVENT
                        //     SEEK_EVENT
                        //     PLAYER_ERROR_EVENT
                        //     TIMELINE_EVENT
                        // */

                        if (scope.ticker) {
                            clearInterval(scope.ticker);
                        }
                        scope.ticker = setInterval(function() {
                            scope.tick();
                        }, 1000);

                        // if (success.eventType == "STOP_EVENT") {
                        //     return this.PLAYER.close();
                        // }

                        // scope.onDurationChange(scope.el.duration * 1000);
                        if (success.eventType == "STATE_CHANGED_EVENT") {
                            // console.log("STATE_CHANGED_EVENT : ", success);
                            if (success.playWhenReady == 'false') {
                                // scope.OnBufferingStart();
                                scope.state(scope.STATE_BUFFERING);
                            } else {
                                // scope.OnBufferingComplete();
                                scope.trigger('onbufferingcomplete');
                            }

                            switch (success.playbackState) {
                                case 'STATE_ENDED' :
                                    scope.onEnd();
                                break;
                                case 'STATE_READY' :                                    
                                    if (success.duration < 0 && success.position > 1) {
                                        scope.onDurationChange(0);
                                    }

                                    if (success.playWhenReady == 'true') {
                                        scope.state(scope.STATE_PLAYING);
                                    } else {
                                        scope.state(scope.STATE_PAUSED);
                                    }

                                    if (success.playWhenReady == 'true' && success.totalTracks > 1 && scope.streaminfoready === false) {
                                        // fill total track and track build
                                        console.log("Build from STATE_CHANGED_EVENT : ", success);
                                        scope.buildTracks(success);
                                        console.log("build Tracks completed");
                                    }
                                    // scope.state(scope.STATE_PLAYING);
                                break;
                                default : 
                                    // scope.state(success.playbackState);
                                break;
                            }

                            // scope.state(success.playbackState);
                        } else 
                        if (success.eventType == "TIMELINE_EVENT") {
                            console.log('TIMELINE_EVENT : ', success);
                            if (success.periodDuration0 > 1) {
                                scope.onDurationChange(success.periodDuration0);
                            }
                        } else 
                        // if (success.eventType == "LOADING_EVENT") {
                        //     scope.onTimeUpdate(success.position);
                        // } else 
                        // if (success.eventType == "START_EVENT") {
                        //     console.log("START_EVENT : ", success);
                        // } else 
                        // if (success.eventType == "TOUCH_EVENT") {
                        //     scope.trigger('key', Control.key.ENTER);
                        //     // Control.onKeyDown(success);
                        // } else 
                        if (success.eventType == "PLAYER_ERROR_EVENT") {
                            scope.state(scope.STATE_ERROR);
                            scope.onError(0, success.errorMessage);
                        }
                    };

                    var errorCallback = function(error) {
                        console.log("err", error);
                        scope.state(scope.STATE_ERROR);
                        scope.onError(0, error);
                    };

                    var params = {
                        url: attrs.url,
                        seekTo : attrs.position ? parseInt(attrs.position) : -1,
                        showBuffering: true, 
                        // userAgent: 'Exoplayer',
                        // plugin_controls_visible: true, 
                    };
                    console.log('attrs', attrs);

                    try {
                        this.PLAYER.show(params, successCallback, errorCallback);
                        // this.PLAYER.setStream(attrs.url, successCallback, errorCallback);
                        // this.PLAYER.playPause();

                        if (attrs.position) {
                            this.PLAYER.seekTo(parseInt(attrs.position));
                        }
                    } catch (e) {
                        this.state(this.STATE_ERROR);
                        this.onError(0, 'Error Loading Player');
                    }

                } else {
                    this.PLAYER.play();
                }

                // console.log('play');
                return true;
            } else if (cmd === 'pause') {
                this.PLAYER.pause();                
                this.state(this.STATE_PAUSED);
                // console.log('pause');
                return true;
            } else if (cmd === 'stop') {
                this.PLAYER.stop();
                // this.PLAYER.close();
                this.state(this.STATE_ENDED);
                // console.log('stop');
                return true;
            } else if (cmd === 'seek') {
                // console.log('seek');
                this.PLAYER.seekTo(attrs.position);
                return true;
            } else if (cmd === 'playbackSpeed') {
            } else if (cmd === 'show') { 
            } else if (cmd === 'hide') {
            } else if (cmd === 'setVideoDimensions') {
            } else if (cmd === 'audioTrack') {
                this.PLAYER.setSubtitleTrack(parseInt(attrs.index));
                console.log("audioTrack", parseInt(attrs.index));
                return true;
            } else if (cmd === 'subtitle') {
                if (attrs.sub_id == 'off') {
                    this.PLAYER.subTitleOff();
                    // this.PLAYER.setSubtitleTrack(0);
                    console.log("subtitle", attrs.sub_id);
                    return true;
                }

                this.PLAYER.setSubtitleTrack(parseInt(attrs.sub_id));
                console.log("subtitle", parseInt(attrs.sub_id));
                return true;


            } else if (cmd === 'mute') {
            } else if (cmd === 'unmute') {
            }
        },
        /**
         * Function is binded on duration change event
         * @param {Number} duration Content duration
         * @fires durationchange
         * @private
         */
        onDurationChange: function(duration) {
            this.state(this.STATE_READY);
            this.duration = Math.round(duration);
            this.trigger('durationchange', this.duration);

            console.info("Player Info >>>\n" +
                " URL: " + this.url + "\n" +
                // " Audios: " + JSON.stringify(this.PLAYER.getAudios()) + "\n" +
                // " Duration fn: " + JSON.stringify(this.PLAYER.getDuration()) + "\n" +
                // " Subtitles: " + JSON.stringify(this.PLAYER.getTotalTrackInfo()) + "\n" +
                " Duration: " + this.duration
            );

            // this.trigger('onstreaminfoready');
        },
        /**
         * De-init player
         *
         * @private
         */
        deinit: function() {
            this.reset();
            this.deinitNative();
        },
        /**
         * De-init native player
         *
         * @private
         */
        deinitNative: function() {
            clearInterval(this.ticker);

            try {
                this.PLAYER.close();
            } catch (e) {

            }
        },

        /**
         * Get ESN id
         * 
         * @private
         */
        getESN: function() {
            return Device.getUID();
        },
        /**
         * Set audio track by its index
         *
         * @param {Number} index (0..)
         */
        audioTrack: function(index) {
            this.native('audioTrack', {
                index: index
            });
        },
        /**
         * Set subtitle by its index
         *
         * @param {Number} index (0..)
         */
        subtitle: function(sub_id) {
            this.native('subtitle', {
                sub_id: sub_id
            });
        },
        /**
         * get Total Audios
         */
        getAudios: function() {
            // console.log('total_audio', this.total_audio);            
            return this.total_audio;
        },
        /**
         * get Total Subtitles
         */
        getSubtitles: function() {
            // console.log('total_subtitle', this.total_subtitle);
            return this.total_subtitle;
        },
        /**
         * get available Audios
         */
        availableAudios: function() {
            var audios = this.audios.sort(function(a, b){
                return a.id - b.id;
            });
            console.log('audios', audios);
            return audios;
            // var audios = [];
            // audios.push({id: 1, lang: 'Default', codec : ''});
            // return audios;
        },
        /**
         * get Total available Subtitle
         */
        availableSubtitles: function() {
            var subtitles = this.subtitles.sort(function(a, b){
                return a.id - b.id;
            });
            console.log('subtitles', subtitles);
            return subtitles;
            // return this.subtitles;
            // var subtitles = [];
            // return subtitles;
        },
        /**
         * Set Total Audios
         */
        getResolution: function() {
            //var video = this.el.videoTracks;
            var width = this.Vwidth || 'N';
            var height = this.Vheight || 'A';
            return width + '|' + height;
        },
        CountObj: function(obj) {
            var size = 0,
                key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        },
        setAspectRation: function(size) {
            if (!size) {
                return;
            }

            return false;
        },
        buildTracks: function(data) {
            if (!data) {
                return;
            }

            // console.log("build Tracks");
            this.total_audio = data.TOTAL_AUD;
            this.total_subtitle = data.TOTAL_SUB;

            var audiotrack = 1;
            var subtitletrack = 1;
            // for (var i = 0; i < TrackInfo.length; i++) {
            for (key in data) {
                if (key.indexOf("audio") >= 0) {                    
                    data[key] = data[key].replaceAll("'", '"');
                    // console.log(data[key]);
                    TrackInfo = JSON.parse(data[key]);
                    var audio = CodeToLanguage[TrackInfo.language] || 'Audio ' + (audiotrack);
                    var codecs = TrackInfo.codec == 'null' ? '' : ' - ' + TrackInfo.codec;
                    this.audios.push({id: TrackInfo.id, lang: audio, codec : codecs});
                    audiotrack++;
                } else if (key.indexOf("subtitle") >= 0) {
                    data[key] = data[key].replaceAll("'", '"');
                    // console.log(data[key]);
                    TrackInfo = JSON.parse(data[key]);
                    var subtitle = CodeToLanguage[TrackInfo.language] || 'Subtitle ' + (subtitletrack);
                    var codecs = TrackInfo.codec == 'null' ? '' : ' - ' + TrackInfo.codec;
                    this.subtitles.push({id: TrackInfo.id, lang: subtitle, codec : codecs});
                    subtitletrack++;
                }
            }

            this.streaminfoready = true;
            this.trigger('onstreaminfoready');
            return false;
        },
        sampleJson: function() {
            return {
                audio_1: "{'id' : 2,'language' : und,'codec' : null,'selected' : 1,'format' : audio/mp4a-latm,'label' : null}",
                audio_8: "{'id' : 10,'language' : eng,'codec' : null,'selected' : 0,'format' : audio/mp4a-latm,'label' : null}",
                bufferPercentage: "5",
                controllerVisible: "true",
                duration: "46665",
                eventType: "STATE_CHANGED_EVENT",
                playWhenReady: "true",
                playbackState: "STATE_READY",
                position: "-47",
                subtitle_2: "{'id' : 3,'language' : eng,'codec' : null,'selected' : 1,'format' : application/x-subrip,'label' : null}",
                subtitle_3: "{'id' : 4,'language' : hun,'codec' : null,'selected' : 0,'format' : application/x-subrip,'label' : null}",
                subtitle_4: "{'id' : 5,'language' : ger,'codec' : null,'selected' : 0,'format' : application/x-subrip,'label' : null}",
                subtitle_5: "{'id' : 6,'language' : fre,'codec' : null,'selected' : 0,'format' : application/x-subrip,'label' : null}",
                subtitle_6: "{'id' : 8,'language' : spa,'codec' : null,'selected' : 0,'format' : application/x-subrip,'label' : null}",
                subtitle_7: "{'id' : 9,'language' : ita,'codec' : null,'selected' : 0,'format' : application/x-subrip,'label' : null}",
                subtitle_9: "{'id' : 11,'language' : jpn,'codec' : null,'selected' : 0,'format' : application/x-subrip,'label' : null}",
                subtitle_10: "{'id' : 7,'language' : und,'codec' : null,'selected' : 0,'format' : application/x-subrip,'label' : null}",
                totalTracks: "11",
                TOTAL_AUD: "2",
                TOTAL_SUB: "8",
                track_0: "{'id' : 1,'language' : null,'codec' : null,'selected' : 0,'format' : video/avc,'label' : null}",
                // plugin_controls_visible: true, 
            };
        }
    });

    return Device_Android_Player;

})(Events, Deferrable);