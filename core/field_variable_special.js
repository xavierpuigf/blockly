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
 * @fileoverview Variable input field.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';
goog.provide('Blockly.FieldVariableSpecial');

goog.require('Blockly.FieldDropdown');
goog.require('Blockly.Msg');
goog.require('Blockly.Variables');
goog.require('goog.string');

/**
 * Class for a variable's dropdown field.
 * @param {?string} varname The default name for the variable.  If null,
 *     a unique variable name will be generated.
 * @param {Function=} opt_validator A function that is executed when a new
 *     option is selected.  Its sole argument is the new option value.
 * @extends {Blockly.FieldDropdown}
 * @constructor
 */


//var variablesforObjects = {};


Blockly.FieldVariableSpecial = function(varname, type, variablesforObjects, opt_validator) {
  
  this.type = type;
  this.variablesforObjects = variablesforObjects;
  Blockly.FieldVariableSpecial.superClass_.constructor.call(this,
      Blockly.FieldVariableSpecial.dropdownCreate, opt_validator);
  var variableList =
        Blockly.FieldVariableSpecial.getVariablesWithType(this.type, this.variablesforObjects);

  this.setValue(variableList[0] || '');
};

goog.inherits(Blockly.FieldVariableSpecial, Blockly.FieldDropdown);

/**
 * Sets a new change handler for angle field.
 * @param {Function} handler New change handler, or null.
 */
Blockly.FieldVariableSpecial.prototype.setValidator = function(handler) {
  var wrappedHandler;
  if (handler) {
    // Wrap the user's change handler together with the variable rename handler.
    wrappedHandler = function(value) {
      var v1 = handler.call(this, value);
      if (v1 === null) {
        var v2 = v1;
      } else {
        if (v1 === undefined) {
          v1 = value;
        }
        var v2 = Blockly.FieldVariableSpecial.dropdownChange.call(this, v1);
        if (v2 === undefined) {
          v2 = v1;
        }
      }
      return v2 === value ? undefined : v2;
    };
  } else {
    wrappedHandler = Blockly.FieldVariableSpecial.dropdownChange;
  }
  Blockly.FieldVariableSpecial.superClass_.setValidator.call(this, wrappedHandler);
};

/**
 * Install this dropdown on a block.
 */
Blockly.FieldVariableSpecial.prototype.init = function() {
  if (this.fieldGroup_) {
    // Dropdown has already been initialized once.
    return;
  }
  Blockly.FieldVariableSpecial.superClass_.init.call(this);
  if (!this.getValue()) {
    // Variables without names get uniquely named for this workspace.
    var workspace =
        this.sourceBlock_.isInFlyout ?
            this.sourceBlock_.workspace.targetWorkspace :
            this.sourceBlock_.workspace;
    this.setValue(Blockly.Variables.generateUniqueName(workspace));
  }
};

/**
 * Get the variable's name (use a variableDB to convert into a real name).
 * Unline a regular dropdown, variables are literal and have no neutral value.
 * @return {string} Current text.
 */
Blockly.FieldVariableSpecial.prototype.getValue = function() {
  return this.getText();
};

/**
 * Set the variable name.
 * @param {string} newValue New text.
 */
Blockly.FieldVariableSpecial.prototype.setValue = function(newValue) {
  if (this.sourceBlock_ && Blockly.Events.isEnabled()) {
    Blockly.Events.fire(new Blockly.Events.Change(
        this.sourceBlock_, 'field', this.name, this.value_, newValue));
  }
  this.value_ = newValue;
  this.setText(newValue);
};

/**
 * Return a sorted list of variable names for variable dropdown menus.
 * Include a special option at the end for creating a new variable name.
 * @return {!Array.<string>} Array of variable names.
 * @this {!Blockly.FieldVariable}
 */
Blockly.FieldVariableSpecial.dropdownCreate = function() {
  //if (this.sourceBlock_ && this.sourceBlock_.workspace) {
  console.log('HERE fieldvar');
  
  if (this.sourceBlock_){
    this.type = this.sourceBlock_.getFieldValue('TYPE');
  }
  var variableList =
      Blockly.FieldVariableSpecial.getVariablesWithType(this.type, this.variablesforObjects);//Blockly.Variables.allVariables(this.sourceBlock_.workspace);

  if (variableList.length == 0){
    //var all_variables = Blockly.FieldVariableSpecial.getAllVariables(this.variablesforObjects);
    var all_variables = variableList;
    var newtext = (all_variables.length+1).toString();
    this.variablesforObjects[this.type] = all_variables.length+1;
    variableList.push(newtext); 
  }
  variableList.sort(goog.string.caseInsensitiveCompare);
  Blockly.Msg.NEW_VARIABLE = 'New item...'
  //variableList.push(Blockly.Msg.NEW_VARIABLE);
  
  // Variables are not language-specific, use the name as both the user-facing
  // text and the internal representation.
  var options = [];
  for (var x = 0; x < variableList.length; x++) {
    options[x] = [variableList[x], variableList[x]];
  }
  return options;
};

/**
 * Event handler for a change in variable name.
 * Special case the 'New variable...' and 'Rename variable...' options.
 * In both of these special cases, prompt the user for a new name.
 * @param {string} text The selected dropdown menu option.
 * @return {null|undefined|string} An acceptable new variable name, or null if
 *     change is to be either aborted (cancel button) or has been already
 *     handled (rename), or undefined if an existing variable was chosen.
 * @this {!Blockly.FieldVariable}
 */
Blockly.FieldVariableSpecial.dropdownChange = function(text) {
  //var all_variables = Blockly.FieldVariableSpecial.getAllVariables();
  var all_variables = Blockly.FieldVariableSpecial.getVariablesWithType(this.type, this.variablesforObjects);
  var variable_num = all_variables.length+1;
  var workspace = this.sourceBlock_.workspace;
  if (text == Blockly.Msg.NEW_VARIABLE) {
    text = variable_num.toString();
    // Since variables are case-insensitive, ensure that if the new variable
    // matches with an existing variable, the new case prevails throughout.
    if (text) {
      workspace.variablesforObjects[this.type] = workspace.variablesforObjects[this.type]+1;
      Blockly.Variables.renameVariable(text, text, workspace);
      return text;
    }
    return null;
  }
  return undefined;
};
Blockly.FieldVariableSpecial.getAllVariables = function(variablesforObjects){
  // Not used for now
  var res = [];
  for (var prop in variablesforObjects){
    res.push(prop);
  }
  return res;
}
Blockly.FieldVariableSpecial.getVariablesWithType = function(type,variablesforObjects){
  var res = [];
  var num_vars = variablesforObjects[type];
  for (var i = 0; i < num_vars; i++) res.push((i+1).toString());
  // for (var prop in variablesforObjects){
  //   if (variablesforObjects[prop] == type){
  //     res.push(prop);
  //   }
  // }
  return res;
}


