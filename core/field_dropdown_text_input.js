/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Text input field.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.FieldDropdownText');

goog.require('Blockly.Field');
goog.require('Blockly.Msg');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.userAgent');


/**
 * Class for an editable text field.
 * @param {string} text The initial content of the field.
 * @param {Function=} opt_validator An optional function that is called
 *     to validate any constraints on what the user entered.  Takes the new
 *     text as an argument and returns either the accepted text, a replacement
 *     text, or null to abort the change.
 * @extends {Blockly.Field}
 * @constructor
 */
Blockly.FieldDropdownText = function(menuGenerator, opt_validator, validator_final) {
  this.validator_final = validator_final;
  this.menuGenerator_ = menuGenerator;
  Blockly.FieldDropdownText.superClass_.constructor.call(this, menuGenerator()[0][0],
      opt_validator);
};
goog.inherits(Blockly.FieldDropdownText, Blockly.Field);

Blockly.FieldDropdownText.prototype.init = function() {
  if (this.fieldGroup_) {
    // Dropdown has already been initialized once.
    return;
  }
  // Add dropdown arrow: "option ▾" (LTR) or "▾ אופציה" (RTL)
  this.arrow_ = Blockly.createSvgElement('tspan', {}, null);
  this.arrow_.appendChild(document.createTextNode(
      this.sourceBlock_.RTL ? Blockly.FieldDropdown.ARROW_CHAR + ' ' :
          ' ' + Blockly.FieldDropdown.ARROW_CHAR));

  Blockly.FieldDropdown.superClass_.init.call(this);
  // Force a reset of the text to add the arrow.
  var text = this.text_;
  this.text_ = null;
  this.setText(text);
};

Blockly.FieldDropdownText.prototype.setText = function(text) {
  if (this.sourceBlock_ && this.arrow_) {
    // Update arrow's colour.
    this.arrow_.style.fill = this.sourceBlock_.getColour();
  }
  if (text === null || text === this.text_) {
    // No change if null.
    return;
  }
  this.text_ = text;
  this.updateTextNode_();

  if (this.textElement_) {
    // Insert dropdown arrow.
    if (this.sourceBlock_.RTL) {
      this.textElement_.insertBefore(this.arrow_, this.textElement_.firstChild);
    } else {
      this.textElement_.appendChild(this.arrow_);
    }
  }

  if (this.sourceBlock_ && this.sourceBlock_.rendered) {
    this.sourceBlock_.render();
    this.sourceBlock_.bumpNeighbours_();
  }
};

/**
 * Point size of text.  Should match blocklyText's font-size in CSS.
 */
Blockly.FieldDropdownText.FONTSIZE = 11;

/**
 * Mouse cursor style when over the hotspot that initiates the editor.
 */
Blockly.FieldDropdownText.prototype.CURSOR = 'text'; // text

/**
 * Allow browser to spellcheck this field.
 * @private
 */
Blockly.FieldDropdownText.prototype.spellcheck_ = true;

/**
 * Close the input widget if this input is being deleted.
 */
Blockly.FieldDropdownText.prototype.dispose = function() {
  Blockly.WidgetDiv.hideIfOwner(this);
  Blockly.FieldDropdownText.superClass_.dispose.call(this);
};

/**
 * Set the text in this field.
 * @param {?string} text New text.
 * @override
 */
Blockly.FieldDropdownText.prototype.setValue = function(text) {
  if (text === null) {
    return;  // No change if null.
  }
  if (this.sourceBlock_ && this.validator_) {
	var validated = null;
	if (this.action_dict != null && text in this.action_dict){
		var validated = this.validator_(this.action_dict[text]);
	}
    // If the new text is invalid, validation returns null.
    // In this case we still want to display the illegal result.
    //if (validated !== null && validated !== undefined) {
     // text = validated;
    //}
  }
  Blockly.Field.prototype.setValue.call(this, text);
};

/**
 * Set whether this field is spellchecked by the browser.
 * @param {boolean} check True if checked.
 */
Blockly.FieldDropdownText.prototype.setSpellcheck = function(check) {
  this.spellcheck_ = check;
};

/**
 * Show the inline free-text editor on top of the text.
 * @param {boolean=} opt_quietInput True if editor should be created without
 *     focus.  Defaults to false.
 * @private
 */
Blockly.FieldDropdownText.prototype.showEditor_ = function(opt_quietInput) {
  this.workspace_ = this.sourceBlock_.workspace;
  this.action_dict = Array();
  var quietInput = opt_quietInput || false;
  if (!quietInput && (goog.userAgent.MOBILE || goog.userAgent.ANDROID ||
                      goog.userAgent.IPAD)) {
    // Mobile browsers have issues with in-line textareas (focus & keyboards).
    var newValue = window.prompt(Blockly.Msg.CHANGE_VALUE_TITLE, this.text_);
    if (this.sourceBlock_ && this.validator_) {
      var override = this.validator_(newValue);
	  //var override = undefined;
      if (override !== undefined) {
        newValue = override;
      }
    }
	console.log('Show editor');
    this.setValue(newValue);
    return;
  }
  if (this.sourceBlock_.isInFlyout) return
  Blockly.WidgetDiv.show(this, this.sourceBlock_.RTL, this.widgetDispose_());
  var div = Blockly.WidgetDiv.DIV;
  // Create the input.
  var htmlInput = goog.dom.createDom('input', 'blocklyHtmlInput');
  htmlInput.setAttribute('spellcheck', this.spellcheck_);
  var fontSize =
      (Blockly.FieldDropdownText.FONTSIZE * this.workspace_.scale) + 'pt';
  div.style.fontSize = fontSize;
  htmlInput.style.fontSize = fontSize;
  /** @type {!HTMLInputElement} */
  var select = goog.dom.createDom('select');
  //var input_list = goog.dom.createDom(goog.dom.TagName.DATALIST);
  //input_list.appendChild(select);
  var results = this.menuGenerator_();
  var tags = new Array();
  for (var i = 0; i < results.length; i++){
	  var option = goog.dom.createDom(goog.dom.TagName.OPTION);
	  option.setAttribute('value', results[i][0]);
	  option.innerHTML = results[i][0];
	  this.action_dict[results[i][0]] = results[i][1];
	  tags.push(results[i][0])
  }
  tags.sort(); 
  
  //input_list.setAttribute('id', 'input_list');

  // Borrar?
  var NoResultsLabel = "No actions with this name"
  var blocks = this;
  $(htmlInput).autocomplete({
	  source: function(request, response){
          var matcher2 = new RegExp(
			  "^" + $.ui.autocomplete.escapeRegex( request.term )+'$', "i" );
    	  var matcher = new RegExp( "" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
		  var res = $.grep( tags, function( item ){
			  var aux = matcher.test( item );
			  return aux
		  });
            var res2 = $.grep( tags, function( item ){
              var aux = matcher2.test( item );
              return aux
            });
            if (res.length == 0){
              res = [NoResultsLabel];
            }

		  response(res);
	  },
	select: function (event, ui) {
		if (ui.item.label === NoResultsLabel) {
			event.preventDefault();
		}
		else {
			var name = ui.item;
			this.value = name.label;
			blocks.setValue(name.label);
			var validate = blocks.validator_(blocks.action_dict[name.label]);
			console.log(validate);
			blocks.validator_final(blocks.action_dict[name.label]);
			Blockly.WidgetDiv.hide();
		}
	},
	focus: function (event, ui) {
		console.log('focus');
		if (ui.item.label === NoResultsLabel) {
			event.preventDefault();
		}
	}, minLength: 0
  }).data("ui-autocomplete")._renderItem =  function( ul, item ) {
            // Replace the matched text with a custom span. This
            // span uses the class found in the "highlightClass" option.
             var newText = String(item.value).replace(
                new RegExp("^" + $.ui.autocomplete.escapeRegex( this.term ), "i"),
                "<strong>$&</strong>");
            return $("<li></li>")
                .data("ui-item.autocomplete", item)
                .append("<a>" + newText + "</a>")
                .appendTo(ul);
              
          };

    $(htmlInput).click(function(){
    	$(this).autocomplete("search", "");
    });


  htmlInput.setAttribute('list', 'input_list');
  Blockly.FieldDropdownText.htmlInput_ = htmlInput;
  div.appendChild(htmlInput);

  htmlInput.value = htmlInput.defaultValue = this.text_;
  htmlInput.oldValue_ = null;
  this.validate_();
  this.resizeEditor_();
  if (!quietInput) {
    htmlInput.focus();
    htmlInput.select();
  }/*
  $( document ).ready(function() {
    $(htmlInput).on('input',function(){
		//this.pattern = `[\\w\\s+#]{${this.value.length}}`;
		//this.pattern = `[\\w\\s+#]{${0}}`;
		
		var value = this.value;
		if($('#input_list option').filter(function(){
			return this.value === value;        
		}).length){
			console.log(blocks.action_dict);
			console.log(blocks.action_dict[value], 'input');
			blocks.validator_final(
				blocks.action_dict[value]);
			Blockly.WidgetDiv.hide();
		}
   });
  });*/
  // Bind to keydown -- trap Enter without IME and Esc to hide.
  htmlInput.onKeyDownWrapper_ =
      Blockly.bindEvent_(htmlInput, 'focus', this, this.focus());
  htmlInput.onKeyDownWrapper_ =
      Blockly.bindEvent_(htmlInput, 'keydown', this, this.onHtmlInputKeyDown_);
  // Bind to keyup -- trap */Enter; resize after every keystroke.
  htmlInput.onKeyUpWrapper_ =
      Blockly.bindEvent_(htmlInput, 'keyup', this, this.onHtmlInputChange_);
  // Bind to keyPress -- repeatedly resize when holding down a key.
  htmlInput.onKeyPressWrapper_ =
      Blockly.bindEvent_(htmlInput, 'keypress', this, this.onHtmlInputChange_);
  htmlInput.onWorkspaceChangeWrapper_ = this.resizeEditor_.bind(this);
  this.workspace_.addChangeListener(htmlInput.onWorkspaceChangeWrapper_);
};

/**
 * Handle key down to the editor.
 * @param {!Event} e Keyboard event.
 * @private
 */
Blockly.FieldDropdownText.prototype.focus = function (){
	var htmlInput = Blockly.FieldDropdownText.htmlInput_;
	$(htmlInput).autocomplete("search", "");
	if (htmlInput.value == 'Select action'){
		htmlInput.value = '';
		this.resizeEditor_();
	}
}
Blockly.FieldDropdownText.prototype.onHtmlInputKeyDown_ = function(e) {
  var htmlInput = Blockly.FieldDropdownText.htmlInput_;
  var tabKey = 9, enterKey = 13, escKey = 27;
  var htmlInput = Blockly.FieldDropdownText.htmlInput_;
  if (e.keyCode == enterKey) {
    var validate = this.validator_(this.action_dict[htmlInput.value]);
	if (validate) {
		this.validator_final(this.action_dict[htmlInput.value]);
		Blockly.WidgetDiv.hide();
	}
  } else if (e.keyCode == escKey) {
    htmlInput.value = htmlInput.defaultValue;
    Blockly.WidgetDiv.hide();
  } else if (e.keyCode == tabKey) {
    Blockly.WidgetDiv.hide();
    this.sourceBlock_.tab(this, !e.shiftKey);
    e.preventDefault();
  }
};

/**
 * Handle a change to the editor.
 * @param {!Event} e Keyboard event.
 * @private
 */
Blockly.FieldDropdownText.prototype.onHtmlInputChange_ = function(e) {
  var htmlInput = Blockly.FieldDropdownText.htmlInput_;
  // Update source block.
  var text = htmlInput.value;
  if (text !== htmlInput.oldValue_) {
    htmlInput.oldValue_ = text;
    this.setValue(text);
    this.validate_();
  } else if (goog.userAgent.WEBKIT) {
    // Cursor key.  Render the source block to show the caret moving.
    // Chrome only (version 26, OS X).
    this.sourceBlock_.render();
  }
  this.resizeEditor_();
};

/**
 * Check to see if the contents of the editor validates.
 * Style the editor accordingly.
 * @private
 */
Blockly.FieldDropdownText.prototype.validate_ = function() {
  var valid = true;
  goog.asserts.assertObject(Blockly.FieldDropdownText.htmlInput_);
  var htmlInput = Blockly.FieldDropdownText.htmlInput_;
  if (this.sourceBlock_ && this.validator_) {
    valid = this.validator_(this.action_dict[htmlInput.value]);
  }
  if (valid == null && htmlInput.value.length > 0 && htmlInput.value != 'Select action') {
    Blockly.addClass_(htmlInput, 'blocklyInvalidInput');
  } else {
    Blockly.removeClass_(htmlInput, 'blocklyInvalidInput');
  }
};

/**
 * Resize the editor and the underlying block to fit the text.
 * @private
 */
Blockly.FieldDropdownText.prototype.resizeEditor_ = function() {
  var div = Blockly.WidgetDiv.DIV;
  var bBox = this.fieldGroup_.getBBox();
  //var extra_w = 15.0;
  //bBox.width += extra_w;
  div.style.width = (bBox.width) * this.workspace_.scale + 'px';
  div.style.height = bBox.height * this.workspace_.scale + 'px';
  //this.sourceBlock_.width = 200;
  $('select').width(div.style.width);
  $('select').height(div.style.height);
  var xy = this.getAbsoluteXY_();
  // In RTL mode block fields and LTR input fields the left edge moves,
  // whereas the right edge is fixed.  Reposition the editor.
  if (this.sourceBlock_.RTL) {
    var borderBBox = this.getScaledBBox_();
    xy.x += borderBBox.width ;
    xy.x -= div.offsetWidth;
  }
  // Shift by a few pixels to line up exactly.
  //xy.y += 1;
  if (goog.userAgent.GECKO && Blockly.WidgetDiv.DIV.style.top) {
    // Firefox mis-reports the location of the border by a pixel
    // once the WidgetDiv is moved into position.
    xy.x -= 1;
    xy.y -= 1;
  }
  if (goog.userAgent.WEBKIT) {
    xy.y -= 3;
  }
  div.style.left = xy.x + 'px';
  div.style.top = xy.y + 'px';
};

/**
 * Close the editor, save the results, and dispose of the editable
 * text field's elements.
 * @return {!Function} Closure to call on destruction of the WidgetDiv.
 * @private
 */
Blockly.FieldDropdownText.prototype.widgetDispose_ = function() {
  var thisField = this;
  return function() {
    var htmlInput = Blockly.FieldDropdownText.htmlInput_;
    // Save the edit (if it validates).
    var text = htmlInput.value;
	console.log('dispose');
    if (thisField.sourceBlock_ && thisField.validator_) {
      var text1 = thisField.validator_(thisField.action_dict[text]);
      if (text1 === null) {
        // Invalid edit.
        text = htmlInput.defaultValue;
      } /*else if (text1 !== undefined) {
        // Validation function has changed the text.
        text = text1;
      }*/
    }
    thisField.setValue(text);
    thisField.sourceBlock_.rendered && thisField.sourceBlock_.render();
    Blockly.unbindEvent_(htmlInput.onKeyDownWrapper_);
    Blockly.unbindEvent_(htmlInput.onKeyUpWrapper_);
    Blockly.unbindEvent_(htmlInput.onKeyPressWrapper_);
    thisField.workspace_.removeChangeListener(
        htmlInput.onWorkspaceChangeWrapper_);
    Blockly.FieldDropdownText.htmlInput_ = null;
    // Delete style properties.
    var style = Blockly.WidgetDiv.DIV.style;
    style.width = 'auto';
    style.height = 'auto';
    style.fontSize = '';
  };
};

/**
 * Ensure that only a number may be entered.
 * @param {string} text The user's text.
 * @return {?string} A string representing a valid number, or null if invalid.
 */
Blockly.FieldDropdownText.numberValidator = function(text) {
  if (text === null) {
    return null;
  }
  text = String(text);
  // TODO: Handle cases like 'ten', '1.203,14', etc.
  // 'O' is sometimes mistaken for '0' by inexperienced users.
  text = text.replace(/O/ig, '0');
  // Strip out thousands separators.
  text = text.replace(/,/g, '');
  var n = parseFloat(text || 0);
  return isNaN(n) ? null : String(n);
};

/**
 * Ensure that only a nonnegative integer may be entered.
 * @param {string} text The user's text.
 * @return {?string} A string representing a valid int, or null if invalid.
 */
Blockly.FieldDropdownText.nonnegativeIntegerValidator = function(text) {
  var n = Blockly.FieldDropdownText.numberValidator(text);
  if (n) {
    n = String(Math.max(0, Math.floor(n)));
  }
  return n;
};
