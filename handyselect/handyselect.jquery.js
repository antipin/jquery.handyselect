/*! Copyright (c) 2010 Alex Antipin (http://alex.antipin.com)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version 1.0
 *
 */

(function($) {
  
  /**
   * Singlton object to handle document click event
   */
  $.handyselectSinglton = {
    
    isDocumentClickAttached: false,
    
    activeHandySelect: null,
    
    init: function() {
      
      // Attach document click event handler
      // We using here static property in order to attach handler only once
      if (this.isDocumentClickAttached == false) {
        
        var self = this;
        
        $(document).click( function(e) {
          
          var targetIsPopup = false;
          var maxDeepth = 5;
          var currentDepth = 1;
          $(e.target).parents().map(function() {
            if (currentDepth > maxDeepth) {
              return;
            }
            if ($(this).hasClass('handyselect')) {
              targetIsPopup = true;
              return;
            }
            currentDepth++;
            
          });
          
          // If click is somewhere out of active popup
          if (!targetIsPopup && self.activeHandySelect) {
            self.activeHandySelect.togglePopup({forceHide: true});
          }
          
        });
      
        // Change static property
        this.isDocumentClickAttached = true;

      }
      
    }
    
  }
  
  
  
  $.fn.handyselect = function(givenOptions) {
      
      classHandySelect = function($select, o) {
        
        // This synonim
        var self = this;
        // Popup state (open/closed)
        var isPopupShowed = false;
        // DOM element pointers
        var $handyselect = null;
        var $selector = null;
        var $popup = null;
        var $optionsWrapper = null;
        var $options = null;
        var $optionAny = null;
        var $controls = null;
        var $controlsOk = null;
        // Misc
        var selectorHeight = 0;
        // Some init actions
        this.id = o.id;
        
        
        
        
        /**
         * selected options class
         * it store selected options
         * and provide add, remove and get methods
         */
        var classOptions = function(parent) {
          
          var self = this;
          
          var options = {
            all: {},
            selected: []
          }
          
          
          /**
           * Get values from original select element
           */
          var getRawOptions = function() {
          
            var rawAllOptions = []
            var rawSelectedOptions = []
            
            // Fill in options array
            $('option', $select).each(function(key, value) {
              var $value = $(value);
              rawAllOptions.push({
                value: $value.attr('value'),
                label: $value.html()
              });
            });
            
            // Fill in selected options array
            $('option:selected', $select).each(function(key, value) {
              rawSelectedOptions.push(
                $(value).attr('value')
              );
            });
            
            return { all: rawAllOptions, selected: rawSelectedOptions }
          }
          
          
          /**
           * Change option value for not multiple select
           */
          var changeSingeValue = function(clickedValue) {
            
            // Get current value
            var currentValue = options.selected[0];
            
            // If user clicked different option
            // We should unselect current and select clicked option
            if (clickedValue != currentValue) {
              
              // Update array of selected items
              options.selected = [];
              options.selected.push(clickedValue);
              
              // Add selection to newly selected option
              options.all[clickedValue].element.addClass('handyselect-option-selected');
              // Remove selection from current selected option
              options.all[currentValue].element.removeClass('handyselect-option-selected');
              
            }
            
            // Close popup after click on sibngle select
            parent.togglePopup({forceHide: true});
          
          }
          
          
          /**
           * Change option value for multiple select
           */
          var changeMultipleValue = function(clickedValue) {
            
            // New option has been clicked
            // We shoud select it
            if ($.inArray(clickedValue, options.selected) == -1) {
              
              // Update array of selected items
              options.selected.push(clickedValue);
              
              // Add selection to newly selected option
              options.all[clickedValue].element.addClass('handyselect-option-selected');
              
            }

            // Selected option has been clicked
            // We should unselect it
            else {
              
              // Remove option value from array of selected items
              for (var i = 0; i < options.selected.length; i++) {
                if (options.selected[i] == clickedValue) {
                  options.selected.splice(i,1);
                  break;
                }
              }
              
              // Remove selection from unselected option
              options.all[clickedValue].element.removeClass('handyselect-option-selected');
              
            }
          }
          
          
          /**
           * Option click handler
           */
          var optionClickHandler = function(option) {
            var clickedValue = option.data('value');
            self.changeValue({'clickedValue': clickedValue});
          }
          
          
          /**
           * Update everything after changing state of handyselect
           *   - Setting Selector content
           *   - Sync with hidden select element
           */
          var update = function(params) {
            
            // If no options selected
            // show Any label text
            if (options.selected.length == 0) {
              selectorValue = o.labelAnySelected;
            } else {
            
              // 'options' mode means we show some or all of selected options label
              if (o.selectorMode == 'options') {
                
                var selectorValue = []
                
                var optionsReversed = options.selected.reverse();
                
                // Place to selectorValue only required number of selected items
                for (var i = 0; i < optionsReversed.length; i++ ) {
                  if (i > o.selectedOptionsToDisplay - 1) break;
                  var currentIndex = optionsReversed[i]
                  selectorValue.push(options.all[currentIndex].label);
                }
                
                selectorValue = selectorValue.join(', ')
                
                if (options.selected.length > o.selectedOptionsToDisplay) {
                   selectorValue += o.labelEtc;
                }
              

              }
              
              // 'count' mode means we show number of selected options label
              else if (o.selectorMode == 'count') {
                selectorValue = o.labelSelectorCount.replace('%d', options.selected.length);
              }
            }
            
            $selector.html(selectorValue);
            
            // Save selector height
            selectorHeight = $selector.outerHeight();
            
            // Synic with native form select field
            $select.val(self.getSelected());
          }
          
          
          /**
           * Here we build DOM elements for options
           * It's almost init method
           */
          this.build = function() {
            
            var rawOptions = getRawOptions();
            
            // Generate array with selected items
            options.selected = rawOptions.selected;
            
            // Create popup options (LI)
            options.all_length = rawOptions.all.length;
            
            for (var i = 0; i < rawOptions.all.length; i++ ) {
              
              var current = {
                value: rawOptions.all[i].value,
                label: rawOptions.all[i].label
              }
              
              // Create list item (wrapper for icon and label)
              var optionElement = document.createElement('li');
              var $option = $(optionElement);
              
              // Create label
              var optionLabel = document.createElement('span');
              var $optionLabel = $(optionLabel);
              $optionLabel.addClass('handyselect-label');
              $optionLabel.html(current.label);
              
              // Create icon
              var optionIcon = document.createElement('ins');
              var $optionIcon = $(optionIcon);

              // Append DOM element to options wrapper              
              $option.append($optionIcon);
              $option.append($optionLabel);
              $optionsWrapper.append($option);
              
              // Add option to option storage
              options.all[current.value] = {
                value: current.value,
                label: current.label,
                element: $option,
              }
              
              // Attach value as data
              $option.data('value', current.value);
            }
            
            // Set height and width for $optionsWrapper according to o.Size option
            // Get height of one option
            var optionSize = {
              height: $option.outerHeight(true),
              //width: optionMaxWidth
              width: $option.outerWidth(true)
            }
            
            if (options.all_length > o.size) {
              
              // Calculate and set height for optionsWrapper
              $optionsWrapper.height(optionSize.height * o.size);
              
              // 20px - is a scroll bar width. By the way, is there any way to find out exact scrollbar width?
              optionSize.width += 20; 
              
              // Add overflow auto CSS property
              $optionsWrapper.css({overflow: 'auto'});
            }
            
            // Set options wrapper width
            $optionsWrapper.width(optionSize.width);
            
            // Set default states for elements
            //$popup.css({ top: $handyselect.outerHeight() });
            $popup.hide();
            
            // Get options DOM elements
            $options = $('.handyselect-options li', $handyselect)
              .not('.handyselect-option-ignore');
            
            // Attach event handlers on DOM elements
            $selector.click(function() {
              selectedOptionsClickHandler($(this));
            });
            
            $options
            .click(function() {
              optionClickHandler($(this));
            })
            .mouseover(function() {
              $(this).addClass('handyselect-option-hover');
            })
            .mouseout(function() {
              $(this).removeClass('handyselect-option-hover');
            });
            
            // Add selection to selected classes
            for (var i = 0; i < options.selected.length; i++) {
              var selectedIndex = options.selected[i];
              options.all[selectedIndex].element.addClass('handyselect-option-selected');
            }
            
            update();
          }
          
          
          /**
           * Returns selected values.
           * String for single select and array for multiply select
           * It's almost init method
           */
          this.getSelected = function() {
            if (o.multiple) {
              return options.selected;
            }
            else {
              return options.selected[0];
            }
          }
          
          
          /**
           * Change option value(s) method
           */
          this.changeValue = function(params) {
            
            params = params || {}
              
            // Change state ti opposite of defined option
            if (params.clickedValue !== undefined) {
              // Single selection
              if (!o.multiple) {
                changeSingeValue(params.clickedValue);
              }
              // Multiple selection
              else {
                changeMultipleValue(params.clickedValue);
              }
            }
            
            // This delete all selected items
            if (params.unselectAll == true) {
              
              // Remove option value from array of selected items
              for (var i = 0; i < options.selected.length; i++) {
                // Remove css selection from unselected option
                options.all[options.selected[i]].element.removeClass('handyselect-option-selected');
              }
              // Remove value from array of selected items
              options.selected = [];

            }
            
            // Synic with native form select field
            update();
            
            // Prepare param for onChange callback
            // ... add labels to output
            
            // Call onChange callback
            o.onChange(self.getSelected());
          }
          
        }
        
        
        /**
         * Synchronization of hidden select element to handy select
         *
         * TODO:
         * Implement forward synchronization: from original select to handyselect
         * in order to process properly programmatiaclly value changing of original select element
         */
        var syncOriginalToHandySelect = function() {
          
        }
        
        
        
        /**
         * Select click handler
         */
        var selectedOptionsClickHandler = function(target) {
          self.togglePopup();
        }
      
        
        
        /**
         * Any click handler
         */
        var anyClickHandler = function() {
          options.changeValue({'unselectAll': true});
        }
        
        
        
        /**
         * Controls OK click handler
         */
        var constrolsOkClickHandler = function() {
          self.togglePopup({forceHide: true});
        }        
        
        
        /**
         * Popup toggler
         */
        this.togglePopup = function(params) {
          
          // Force hiding popup
          if (params != undefined && params.forceHide) {
            $popup.hide();
            isPopupShowed = false;
            return
          }
          
          // Hide popup if it showed
          if (isPopupShowed) {
            $popup.hide();
            isPopupShowed = false;
          }
          
          // Show popup if it hidden
          else {
            
            // If something elese opend - close it
            if ($.handyselectSinglton.activeHandySelect != null) {
              $.handyselectSinglton.activeHandySelect.togglePopup({forceHide: true});
              $.handyselectSinglton.activeHandySelect = null;
            }
            
            $popup.css({top: selectorHeight + 'px'})
            $popup.show();
            isPopupShowed = true;
            
            $.handyselectSinglton.activeHandySelect = self;
          }
        }
        
        
        /**
         *  It wraps select, hide it and build handyselect
         */
        this.buildHandySelect = function() {
          
          // Hide original select element
          $select.hide();
          
          // Wrap original selec element
          $select.wrap('<span class="handyselect" id="' + o.id + '"/>');
          // Get wrapper DOM element
          $handyselect = $select.parent();
          if (o.multiple) $handyselect.addClass('handyselect-multiple');
          // Create selected options placeholder (SPAN)
          var selector = document.createElement('span');
          // Convert DOM element into jQuery religion
          $selector = $(selector);
          $selector.addClass('handyselect-selector');
          // Append DOM element to handyselect wrapper
          $handyselect.append($selector);
          // Create popup (UL)
          var popup = document.createElement('div');
          // Convert DOM element into jQuery religion
          $popup = $(popup);
          $popup.addClass('handyselect-popup');
          $handyselect.append($popup);
          
          // Create options wrapper (UL)
          var optionsWrapper = document.createElement('ul');
          // Convert DOM element into jQuery religion
          $optionsWrapper = $(optionsWrapper);
          $optionsWrapper.addClass('handyselect-options');
          // Append DOM element to handyselect wrapper
          $popup.append($optionsWrapper);
          
          options.build();
          
          // Add "Any" option and "OK" control to multiple selectors
          if (o.multiple) {
            
            // Prepend any option
            var optionAny = document.createElement('span');
            $optionAny = $(optionAny);
            $optionAny.addClass('handyselect-option-any');
            $optionAny.addClass('handyselect-option-ignore');
            $optionAny.html(o.labelAnySelected);
            $popup.prepend($optionAny);
            
            // Append controls
            var controls = document.createElement('span');
            $controls = $(controls);
            $controls.addClass('handyselect-controls');
            $controls.addClass('handyselect-option-ignore');
            var controlsOk = document.createElement('span');
            $controlsOk = $(controlsOk);
            $controlsOk.addClass('handyselect-controls-ok');
            $controlsOk.html(o.labelControlsOK);
            $controls.append($controlsOk);
            $popup.append($controls);
            
            // Attach events handler
            $optionAny.click(function() {
              anyClickHandler();
            });
            
            $controlsOk.click(function() {
              constrolsOkClickHandler();
            });
            
          }
          
          // We should listen change event of original select element
          // And change tineSelect selected options array
          $select.change(function() {
            syncOriginalToHandySelect();
          });
          
        }
        
        
        /**
         *  Initializatoin
         */
        // init Options class
        var options = new classOptions(self);
        
        // It wraps select, hide it and build handyselect
        this.buildHandySelect();
        
      }
      
      
      /**
       * Init document click handler
       */
      $.handyselectSinglton.init();
      
      
      /**
       * Plugin initialization
       */
      return this.each(function(key, value) {
        
        givenOptions = givenOptions || {};
        
        var $this = $(this);
        
        var o = $.extend({
          // Params getted from DOM elements
          id: $this.attr('id') + '-wrapper',
          name: $this.attr('name'),
          disabled: $this.attr('disabled'),
          multiple: $this.attr('multiple'),
          size: $this.attr('size'),
          options: [],
          selectedOptions: []
        }, givenOptions || {});
        
        // Validate input options, set some defaults
        o.onChange = o.onChange || function() {};
        o.size = o.size ? Math.abs(o.size) : 10;
        
        o.labelAnySelected = o.labelAnySelected || 'Any...';
        o.labelEtc = o.labelEtc || '...';
        o.labelSelectorCount = o.labelSelectorCount || 'Selected %d item(s)';
        o.labelControlsOK = o.labelControlsOK || 'Ok';
        
        o.selectorMode = o.selectorMode || 'options';
        o.selectedOptionsToDisplay = (o.selectedOptionsToDisplay == 'all') ? 9999 : Math.abs(o.selectedOptionsToDisplay);
        
        // Init handyselect class
        var handyselect = new classHandySelect($this, o);
        
      });
      
   }


})(jQuery);