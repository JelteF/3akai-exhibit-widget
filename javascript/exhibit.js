/*
 * Licensed to the Sakai Foundation (SF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The SF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

// load the master sakai object to access all Sakai OAE API methods
require(['jquery', 'sakai/sakai.api.core',
        'http://api.simile-widgets.org/exhibit/3.0.0rc1/extensions/time/time-extension.js',
        'http://api.simile-widgets.org/exhibit/3.0.0rc1/exhibit-api.js'
        ], function($, sakai) {
    /**
     * @name sakai.exhibit
     *
     * @class exhibit
     *
     * @description
     * exhibit is a widget that displays data from a JSON file in a clear way.
     * This is done by using the Exhibit library from MIT
     *
     * @version 0.0.1
     * @param {String} tuid Unique id of the widget
     * @param {Boolean} showSettings Show the settings of the widget or not
     */
    sakai_global.exhibit = function(tuid, showSettings) {

        /////////////////////////////
        // Configuration variables //
        /////////////////////////////
        var DEFAULT_DATA_URL = '/devwidgets/exhibit/nobelists.json';
        var DEFAULT_LAYOUT_URL = '/devwidgets/exhibit/layout.json';

        // DOM jQuery Objects
        var $rootel = $('#' + tuid); //unique container for each widget instance
        var $mainContainer = $('#exhibit_main', $rootel);
        var $settingsContainer = $('#exhibit_settings', $rootel);
        var $settingsForm = $('#exhibit_settings_form', $rootel);
        var $cancelSettings = $('#exhibit_cancel_settings', $rootel);
        var $dataURL = $('#exhibit_data_url', $rootel);
        var $layoutURL = $('#exhibit_layout_url', $rootel);
        var $topPanels = $('#top_panel_table', $rootel);
        var $detailedView = $('#detailed_view', $rootel);
        var $viewHolder = $('#view_holder', $rootel);

        ///////////////////////
        // Utility functions //
        ///////////////////////

        /**
         * Checks if the provided profile or query is non-empty and returns it
         * if that is the case. If it is empty it returns the DEFAULT_DATA_URL
         *
         * @param {String} dataURL The JSON URL
         */
        var checkData = function(dataURL) {
            return (dataURL && $.trim(dataURL)) ? $.trim(dataURL) : DEFAULT_DATA_URL;
        };

        var checkLayout = function(layoutURL) {
            return (layoutURL && $.trim(layoutURL)) ? $.trim(layoutURL) : DEFAULT_LAYOUT_URL;
        };

        /**
         * Gets the data from the server using an asynchronous request
         *
         * @param {Object} callback Function to call when the request returns. This
         * function will be sent a String with the preferred profile or channel.
         */
        var getPreferredInput = function(callback) {
            // get the data associated with this widget
            sakai.api.Widgets.loadWidgetData(tuid, function(success, data) {
                if (success) {
                    // fetching the data succeeded, send it to the callback function
                    callback(checkData(data.dataURL), checkLayout(data.layoutURL));
                } else {
                    // fetching the data failed, we use the DEFAULT_COLOR
                    callback(DEFAULT_DATA_URL, DEFAULT_LAYOUT_URL);
                }
            });
        };

        /////////////////////////
        // Main View functions //
        /////////////////////////

        /**
         * Shows the Main view that contains the exhibit widget
         *
         * @param {String} dataURL The URL of the JSON file
         */

        var showMainView = function(dataURL, layoutURL){
            var atributes = {"href" : dataURL, "type" : "application/json",
                "rel" : "exhibit-data"};
            var existingFile = sakai.api.Util.include.checkForTag("link", atributes);
            $.getJSON(layoutURL, parseLayout);
            //If it is already added don't add it again
            if(!existingFile){
                sakai.api.Util.include.insertTag("link", atributes);
            }
            $mainContainer.show();
        }



        var parseLayout = function(json){
            //create top panels
            var topPanelString = '<tr>';
            var detailedViewString = '<tr>';
            var thumbnailViewString = '<div id="thumbnail_view" ex:role="view"'+
                'ex:viewClass="Thumbnail" ex:showAll="true"';

            for (var i = 0; i < json.topPanels.length; i++){
                topPanelString += '<td><div ex:role="facet" ex:expression=".' +
                    json.topPanels[i].expression + '" ex:facetLabel="' +
                    json.topPanels[i].label + '"></div></td>)';
            }
            topPanelString += '</tr>';
            $topPanels.html(topPanelString);

            //create detailed view
            for (var i = 0; i < json.detailedView.length; i++){
                detailedViewString += '<td>' +
                    getCellContent(json.detailedView[i]) + '</td>';
            }
            detailedViewString += '</tr>';
            $detailedView.html(detailedViewString);

            //create thumbnail view
            thumbnailViewString += 'ex:orders=".' + json.thumbnailView.stdOrder +
                '" ex:possibleOrders=".' + json.thumbnailView.orders[0];
            for(var i = 1; i < json.thumbnailView.orders; i++){
                thumbnailViewString += ', .' + json.thumbnailView.orders[i];
            }
            thumbnailViewString += '"><div ex:role="exhibit-lens" class="' +
                'exhibit-thumbnail" style="display: none;">'
            for(var i = 0; i < json.thumbnailView.cell.length; i++){
                thumbnailViewString += getCellContent(json.thumbnailView.cell[i]);
            }
            thumbnailViewString += '</div></div>';
            $viewHolder.append(thumbnailViewString);
        }



        var getCellContent = function (item){
            var pre = item.prepend != undefined ? item.prepend : '';
            var app = item.append != undefined ? item.append : '';
            if (item.type == 'img'){
                return pre + '<img ex:src-content=".' + item.src + '" />' + app;
            }

            if (item.type == 'head'){
                return pre + '<div ex:content=".' + item.name +
                    '" class="head"></div>' + app;
            }

            if (item.type == 'group'){
                var grouptxt = pre + '<div>'
                for (var i = 0; i < item.content.length; i++){
                    grouptxt += getCellContent(item.content[i]);
                }
                return grouptxt + '</div>' + app;
            }

            if (item.type == 'i'){
                return pre + '<i ex:content=".' + item.name + '"></i>' + app;
            }

            if (item.type == 'if-exists'){
                return '<div ex:if-exists=".' + item.name + '" class="' +
                    item.name + '">' + getCellContent(item.yes) + '</div>';
            }

            return pre + '<' + item.type + ' ex:content=".' + item.name +
                '" class="' + item.name + '"></' + item.type + '>' + app;
        }
/*
        var parseDetailedView(index, value){
            $detailedView.append('<td>');
            $.each(value.content, getCellContent
            if (value.type ==  "img"){
                $detailedView.append('<img ex:src-content=".' + value.src +
                    '" />');
                return;
            }

            if (value.type == "name"){
                $detailedView.append('<div ex:content=".' + value.txt +
                    '" class="name"></div>');
                return;
            }

            if (value.type == "group"){
                $detailedView.append(value.pre + '<div>');
                $.each(value.content, parseDetailedView);
                $detailedView.append('</div>');
                return;
            }

            if (value.type == "i"){
                $detailedView.append(value.pre + '<i ex:content=".' +
                value.txt + '"></i>');
                return;
            }
        }
*/

        /////////////////////////////
        // Settings View functions //
        /////////////////////////////

        /**
         * Sets the Settings view to the right settings
         *
         * @param {String} dataURL The profile or query string
         */
        var renderSettings = function(dataURL, layoutURL) {
            $dataURL.val(checkData(dataURL));
            $layoutURL.val(checkLayout(layoutURL));
        };


        ////////////////////
        // Event Handlers //
        ////////////////////

        $settingsForm.on('submit', function(ev) {
            // get the selected input
            var dataURL = $dataURL.val();
            var layoutURL = $layoutURL.val();
            // save the selected input
            sakai.api.Widgets.saveWidgetData(tuid, {
                dataURL: dataURL,
                layoutURL: layoutURL
            },
                function(success, data) {
                    if (success) {
                        // Settings finished, switch to Main view
                        sakai.api.Widgets.Container.informFinish(tuid, 'exhibit');
                    }
                }
            );
            return false
        });

        $cancelSettings.on('click', function() {
            sakai.api.Widgets.Container.informFinish(tuid, 'exhibit');
        });


        /////////////////////////////
        // Initialization function //
        /////////////////////////////

        /**
         * Initialization function DOCUMENTATION
         */
        var doInit = function() {
            if (showSettings) {
                getPreferredInput(renderSettings);

                $settingsContainer.show();
            } else {
                    getPreferredInput(showMainView);
            }
        };
        // run the initialization function when the widget object loads
        doInit();
    };

    // inform Sakai OAE that this widget has loaded and is ready to run
    sakai.api.Widgets.widgetLoader.informOnLoad('exhibit');
});
