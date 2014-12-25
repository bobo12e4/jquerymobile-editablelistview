/*!
 * jQuery Mobile Editable Listview Plugin
 * https://github.com/baig/jquerymobile-editablelistview
 *
 * Copyright 2014 (c) Wasif Hasan Baig
 *
 * Released under the MIT license
 * https://github.com/baig/jquerymobile-editablelistview/blob/master/LICENSE.txt
 */

(function ($, undefined) {

    "use strict";

    $.widget("mobile.listview", $.mobile.listview, {

        // Declaring some private instace state variables
        _created: false,
        _origDom: null,
        _editMode: false,
        _counter: 1,
        _dataItemName: "item",
        _evt: null,
        _clickHandler: null,
        
        // The options hash
        options: {
            editable: false,
            editableType: 'simple',
            editableForm: '',

            title: "View list items",
            emptyTitle: "No items to view",
            editLabel: "Edit",
            addLabel: "Add",
            doneLabel: "Done",
            addIcon: "plus",
            editIcon: "edit",
            doneIcon: "check",

            buttonTheme: 'a',
            buttonCorner: true,
            buttonShadow: true,

            itemIcon: false,

            collapsed: false,
            expandedIcon: 'carat-d',
            collapsedIcon: 'carat-r'
        },

        _beforeListviewRefresh: function () {

            // Returning immediately if `data-editable="false"`
            if (!this.options.editable) return;

            var $el = this.element,
                opts = this.options,
                $origDom = this._origDom,
                dataItemName = this._dataItemName,
                counter = this._counter,
                ui, $orig, $origLis,
                evt = this._evt,
                $lis = $el.find("li"),
                $markup = this._$markup;

            // saving original DOM structure if there is a discrepency in the number
            // of list items between `this.element` and `this._origDom` or if the
            // or if the `this._origDom` is null
            // Note: list item length count ignores the list item housing the
            //       text box
            // Fix for Bug #4
            if (!this._created) {
                if ($el.find('li').not('li.ui-editable-temp').length !== ($origDom === null ? -1 : $origDom.find('li').length)) {

                    $origDom = $el.clone();

                    // Assign each list item a unique number value
                    $.each($origDom.children('li'), function (idx, val) {
                        $(val).attr("data-" + dataItemName, counter);
                        counter++;
                    });

                    // Incrementing the counter that is used to assign unique value to `data-item` attribute on each list item
                    this._counter = counter;

                    // Removing all css classes to get the original DOM structure
                    $origDom.removeClass("ui-listview ui-shadow ui-corner-all ui-listview-inset ui-group-theme-" + this.options.theme)
                        .find("li")
                        .removeClass("ui-li-static ui-body-inherit ui-first-child ui-last-child ui-li-has-alt")
                        .end()
                        .find("a")
                        .removeClass("ui-link")
                        .end();

                    // Caching the original DOM to the widget instance
                    this._origDom = $origDom;
                }
            }
            
            // ## Creation
            if (!this._created) {
                // Wrapping the list structure inside Collapsible
                var wrapper = this._wrapCollapsible();

                ui = {
                    wrapper: wrapper,
                    header: wrapper.find('h1'),
                    button: wrapper.find('h1 + a, h1 + button'),
                    content: wrapper.find('div.ui-collapsible-content'),
                };

                $.extend(this, {
                    _ui: ui,
                    _newItems: [],
                    _items: [],
                });

                ui.header.addClass('ui-btn-icon-left');

                evt = this._evt = $._data(ui.header.parent()[0], "events");
                this._clickHandler = evt.click[0].handler;

                this._attachEditEventButtons();

                this._created = true;
            }

            if (this._editMode) {
                
                ui = this._ui;
                $orig = $origDom.clone();
                $origLis = $orig.find('li');
                
                if ($orig.find('li.ui-editable-temp').length === 0) {
                    // Checking if text content of <li> is wrapped inside <a>
                    if ($orig.find('a').length === 0) {
                        // wrapping contents of <li> inside <a>
                        $origLis.wrapInner('<a></a>')
                        
                    }

                    // appending another <a> inside <li>; this is the delete button
                    $origLis.append('<a class="ui-editable-btn-del">Delete</a>');

                    this.option("splitIcon", "minus");

                    if (opts.editableType === 'complex') {
                            $orig.prepend('<li class="ui-editable-temp"></li>');
                            $orig.find("li.ui-editable-temp").append(ui.form);
                    }
                    if (opts.editableType === 'simple') {
                        $orig.prepend($markup.listTextInput);
                    }
                }
                
                $lis.remove();
                
                $el.append($orig.find('li'));

                // Disabling the click event on header when list is in `Edit` mode
                evt.click[0].handler = $.noop;
            } else {
                
                // Re-enabling the click event handler when the list is in `View` mode
                evt.click[0].handler = this._clickHandler;
                
                // Removing `Edit` mode `Li`s
                $lis.filter(".ui-editable-temp").hide()
                $lis.not(".ui-editable-temp").remove()

                if (opts.itemIcon) {
                    $el.append($origDom.clone().find('li'));
                } else {
                    $el.append($origDom.clone().find('li').attr("data-icon", "false"));
                }
            }

            // Updating the header title, header button label and icon based on the list contents and its state (`Edit` or `View`)
            this._updateHeader();
        },

        _afterListviewRefresh: function () {
             // Returning immediately if `data-editable="false"`
            if (!this.options.editable) return;
            
            this._attachDetachEventHandlers();
        },

        // Detaching form from the DOM if the listview is initialized programmatically
        _init: function () {

            // Returning immediately if `data-editable="false"`
            if (!this.options.editable) return;

            var $el = this.element,
                opts = this.options,
                ui = this._ui;

            if (!ui.form) {

                if (this.options.editableType === 'complex') {

                    if (opts.editableForm.length === 0) {
                        throw new Error("Form not specified for the Complex Editable Listview type.")
                    }

                    var form = $el.closest(':jqmData(role="page")').find('#' + opts.editableForm);

                    if (form.is("form, div") && form.attr("data-editable-form")) {
                        ui.form = form.detach();
                    } else {
                        throw new Error("Reference Error: the form's id should match the \"data-editable-form\" attribute on ul and the form element itself should have data-editable-form=\"true\" attribute.")
                    }
                }
            }
        },

        _wrapCollapsible: function () {
            var $el = this.element,
                opts = this.options,
                isListEmpty = this._isListEmpty();

            $el.wrap('<div data-role="collapsible"></div>');
            $el.parent().prepend(this._$markup.header(opts));

            $el.parents($.mobile['collapsible'].initSelector)
                .not($.mobile.page.prototype.keepNativeSelector())['collapsible']({
                    collapsed: opts.collapsed,
                    expandedIcon: opts.expandedIcon,
                    collapsedIcon: opts.collapsedIcon
                });

            return $el.parent().parent();
        },

        _attachEditEventButtons: function () {
            if (this._isListEmpty()) {
                this._ui.header.off("click");
            }

            this._on(this.element.parent().parent().find('.ui-collapsible-heading a, .ui-collapsible-heading button'), {
                "click": "_onEditButtonTapped"
            });
        },

        // --(start)-- Event Handlers --

        _onEditButtonTapped: function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            var editMode = this._editMode = !this._editMode,
                $collapsible = this.element.parents(":jqmData(role='collapsible')");

            editMode ? $collapsible.collapsible("expand") : $collapsible.collapsible("collapse");

            this.refresh();
            
            if (!editMode) {
                this._triggerListChange(e);
            }
        },

        _updateHeader: function () {
            var ui = this._ui,
                opts = this.options,
                isListEmpty = this._isListEmpty();

            // Update List Header Title
            ui.header.text(isListEmpty ? opts.emptyTitle : opts.title);

            // Change "Edit" button state, icon and label
            ui.button.removeClass('ui-icon-minus ui-icon-' + opts.doneIcon + ' ui-icon-' + opts.addIcon + ' ui-icon-' + opts.editIcon)
                .addClass('ui-icon-' + (this._editMode ? opts.doneIcon : isListEmpty ? opts.addIcon : opts.editIcon))
                .text(this._editMode ? opts.doneLabel : isListEmpty ? opts.addLabel : opts.editLabel);

        },

        // _triggerListChange
        _triggerListChange: function (e) {
            this._trigger('change', e, {
                items: this._newItems,
                length: this.length(),
            });
            this._items = this._items.concat(this._newItems)
            this._newItems = []
        },

        // --(end)-- Event Handlers --

        // --(start)-- Event Handler Helper Functions --

        _attachDetachEventHandlers: function () {
            this._enableInsertListItemEvent();
            this._enableListItemDeleteEvent();

            //            this._enableListItemEditing() // v0.2
        },


        _enableInsertListItemEvent: function () {
            var $addBtn, $clearBtn, $textField,
                opts = this.options,
                editableType = opts.editableType,
                $content = this._ui.content;

            if (this._editMode) {
                $addBtn = (editableType === 'simple') ? $content.find('li.ui-editable-temp a#item-add') : $content.find("li:first-child [data-add-button='true']"),
                $clearBtn = (editableType === 'complex') ? $content.find("li:first-child [data-clear-button='true']") : null,
                $textField = (editableType === 'simple') ? $content.find('input[type=text]') : null;

                this._off( $addBtn, "tap" );
                this._on($addBtn, {
                    "tap": "_insertListItem"
                });

                if ($clearBtn !== null) {
                    this._off( $clearBtn, "tap" );
                    this._on($clearBtn, {
                        "tap": "_clearTextFields"
                    });
                }

                if ($textField !== null) {
                    this._off( $textField, "keyup" );
                    this._on($textField, {
                        "keyup": "_insertListItem"
                    });
                }
            }
        },

        _clearTextFields: function (e) {
            e.preventDefault();
            
            var inputs = $(e.target).parents('li').find('[data-item-name]');

            $.each(inputs, function (idx, val) {
                $(val).val("");
            });
        },

        _enableListItemDeleteEvent: function () {
            this._editMode
            ? this._on(this._ui.content.find('a.ui-editable-btn-del'), { "click": "_deleteListItem" })
            : this._off(this._ui.content.find('a.ui-editable-btn-del'), "click");
        },


        // TODO v0.2
        /*_enableListItemEditing: function() {},*/

        _insertListItem: function (e) {
            e.preventDefault();
            
            var $el = this.element,
                itemObj = {};
            
            // returning immediately if keyup keycode does not match keyCode.ENTER i.e. 13
            if (e.type !== "tap" && e.keyCode !== $.mobile.keyCode.ENTER) return;

            if (this.options.editableType === 'complex') {
                
                var liTemplate = '',
                    proceed = true,
                    $inputs = $(e.target).parents('li').find('[data-item-name]');

                $.each($inputs, function (idx, val) {
                    var $input = $(val),
                        template = $input.data("item-template"),
                        inputType = $input.attr("type"),
                        itemName = $input.data("item-name"),
                        value = null;
                        
                    switch(inputType) {
                        case "text":
                        case "number":
                            value = $input.val()
                            itemObj[itemName] = value
                            $input.val("")
                            break
                        case "checkbox":
                            value = $input.is(":checked")
                            itemObj[itemName] = value
                            break
                        case "radio":
                            var itemName = $input.attr("name")
                            var $radios = $el.find("li:first-child input[data-item-name='" + itemName + "']").filter(":radio")
                            $radios.each(function() {
                                var $this = $(this)
                                if ( $this.is( ":checked" ) ) {
                                    value = $this.data("item-display-value")
                                    itemObj[itemName] = $this.val()
                                }
                            })
                            break
                    }
                    
                    if (!value && inputType !== "checkbox") {
                        proceed = false;
                    }
                    
                    var renderedTemplate = template.replace(/%%/, value)
                    
                    liTemplate += ( liTemplate.indexOf(renderedTemplate) === -1 )
                                  ? renderedTemplate    // Add only if not already present
                                  : ''                  // Skip if value already present in liTemplate
                });

                // Not proceeding to add if any input value is empty
                if (!proceed) return;
                
                this._newItems.push(itemObj)

                liTemplate = $("<li><a>" + liTemplate + "</a></li>");

                liTemplate.attr("data-" + this._dataItemName, this._counter);
                this._counter++;
                
                this._origDom.prepend(liTemplate);
                
                this.refresh();

            }

            if (this.options.editableType === 'simple') {
                
                var $target = $(e.target),
                    $input = (e.type === "keyup") ? $target : $target.prev().find('input'),
                    inputTextString = $input.val();

                // Inserting list item only if input string is not empty
                if (!!inputTextString) {
                    $input.val(""); // Clearing the input text field
                    
                    
                    var liTemplate = this._isListEmpty()
                                     ? $('<li></li>') // simple static list template is list is empty
                                     : this._origDom.find('li').first().clone(); //

                    liTemplate.attr("data-" + this._dataItemName, this._counter);
                    this._counter++;

                    if (liTemplate.children().length === 0) {
                        liTemplate.text(inputTextString);
                    } else {
                        liTemplate.children('a').text(inputTextString);
                    }
                    
                    this._newItems.push(inputTextString)

                    this._origDom.prepend(liTemplate)
                    
                    this.refresh()
                }
            }
        },

        _deleteListItem: function (e) {
            var $parentTarget = $(e.currentTarget).parent(),
                itemNum = $parentTarget.data(this._dataItemName);

            this._origDom.find("li[data-" + this._dataItemName + "=\"" + itemNum + "\"]")
                .remove();

            $parentTarget.remove();
            this._updateHeader();
            e.preventDefault();
            e.stopPropagation();
        },

        // --(end)-- Event Handler Helper Functions --

        /*
        _destroy: function() {
            var ui = this._ui,
                opts = this.options,
                $ul = ui.content.filter('ul'),
                $li = $ul.find('li'),
                items = this.items()

            // Not doing anything if DOM was already enhanced
            if ( opts.enhanced ) {
                return this;
            }

            ui.header.remove()
            ui.content = ui.content.unwrap().unwrap()

            $ul.removeClass("ui-listview ui-corner-all ui-shadow ui-collapsible-collapsed")
            $ul.find('a').remove()
            this._removeFirstLastClasses($li)
            $li.removeClass('ui-li-has-alt')
            $li.each( function(idx, val) {
                this.textContent = items[idx]
            })

            return ui
        },*/

        _isListEmpty: function () {
            return (this.element.find('li').not('li.ui-editable-temp').length === 0) ? true : false;
        },

        _$markup: {

            listTextInput: "<li class='ui-editable-temp ui-btn' style='padding: 0.3em 0.8em;'>" +
                "<div class='ui-editable-flex'>" +
                "<div style='background-color: white; padding: 0;' class='ui-editable-flex-item-left ui-editable-border-left ui-input-text ui-btn ui-shadow-inset'>" +
                "<input type='text'>" +
                "</div>" +
                "<a id='item-add' style='height: auto' class='ui-editable-flex-item-right ui-editable-border-right ui-btn ui-shadow ui-btn-icon-notext ui-icon-plus'>Add</a>" +
                "</div>" +
                "</li>",

            header: function (opts) {
                return "<div data-role='header'>" +
                    "<h1>List Items</h1>" +
                    "<button class='ui-btn ui-mini ui-btn-inline ui-btn-right ui-btn-icon-right ui-icon-edit " +
                    "ui-btn-" + opts.buttonTheme + " " +
                    (opts.buttonCorner ? "ui-corner-all " : "") +
                    (opts.buttonShadow ? "ui-shadow " : "") +
                    "'>Edit</button>" +
                    "</div>";
            }
        },

        // Public API
        
        length: function () {
            return this.element.find('li').not('.ui-editable-temp').length;
        },

        items: function () {
            // stringifying and parsing to returned a cloned copy with no internal object references
            return JSON.parse(JSON.stringify(this._items));
        },

        widget: function () {
            return this._ui.wrapper;
        }

    });

}(jQuery));
