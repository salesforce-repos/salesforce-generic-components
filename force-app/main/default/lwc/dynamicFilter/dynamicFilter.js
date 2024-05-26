import { LightningElement, api, wire, track } from "lwc";

import getPickListvaluesByFieldName from "@salesforce/apex/QueryEditorController.getOptionsForSelectedPicklistField";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { filterWrapper } from "c/commonLibrary";
export default class DynamicFilter extends LightningElement {
  @api objectApiName; // Input property to accept custom object API name
  @api fieldOptions; // Input property to accept fields information
  @api fieldDetails;
  @api selectedFields;
  @api
  get filters() {
    return this._filters;
  }

  set filters(value) {
    this._filters = JSON.parse(JSON.stringify(value));
  }

  error = false;
  @track currentPicklistField;
  currentIndex;
  @track _filters = [];

  @track logicOptions = [
    { label: "AND", value: "AND" },
    { label: "OR", value: "OR" },
    { label: "Custom", value: "Custom" }
  ];

  selectedLogicOption = "AND";
  customLogic = "";

  operations = [
    {
      label: "Equals",
      value: "=",
      types:
        "String,Picklist,Url,Email,TextArea,Reference,Phone,Date,DateTime,Currency,Double,Boolean,Int,Address,NestedField"
    },
    {
      label: "Not Equals",
      value: "!=",
      types:
        "String,Picklist,Url,Email,TextArea,Reference,Phone,Date,DateTime,Currency,Double,Boolean,Int,Address,NestedField"
    },
    {
      label: "Less Than",
      value: "<",
      types: "Date,DateTime,Currency,Double,Int,NestedField"
    },
    {
      label: "Greater Than",
      value: ">",
      types: "Date,DateTime,Currency,Double,Int,NestedField"
    },
    {
      label: "Less Than Or Equals",
      value: "<=",
      types: "Date,DateTime,Currency,Double,Int,NestedField"
    },
    {
      label: "Greater Than Or Equals",
      value: ">=",
      types: "Date,DateTime,Currency,Double,Int,NestedField"
    },
    {
      label: "LIKE",
      value: "LIKE",
      types: "String,Url,Email,Reference,Phone,NestedField,Address"
    },
    {
      label: "NOT LIKE",
      value: "NOT LIKE",
      types: "String,Url,Email,Reference,Phone,Address,NestedField"
    }
    /*{
      label: "IN",
      value: " IN ",
      types: "String,Url,Email,Phone,Currency,Address,NestedField"
    }*/
  ];

  fieldTypeSettings = {
    String: {
      inputType: "text",
      dataTransformationFunction: "wrapInQuotes",
      isType: true
    },
    Picklist: {
      inputType: "text",
      dataTransformationFunction: "wrapInQuotes",
      isType: false,
      showPicklistInput: true
    },
    Email: {
      inputType: "text",
      dataTransformationFunction: "wrapInQuotes",
      isType: true
    },
    Currency: {
      inputType: "number",
      dataTransformationFunction: null,
      isType: true
    },
    Address: {
      inputType: null,
      dataTransformationFunction: null,
      isType: true
    },
    Double: {
      inputType: "number",
      dataTransformationFunction: null,
      isType: true
    },
    TextArea: {
      inputType: "text",
      dataTransformationFunction: "wrapInQuotes",
      isType: true
    },
    Reference: {
      inputType: "text",
      dataTransformationFunction: "wrapInQuotes",
      isType: true
    },
    DateTime: {
      inputType: "datetime",
      dataTransformationFunction: null,
      isType: true
    },
    Phone: {
      inputType: "text",
      dataTransformationFunction: "wrapInQuotes",
      isType: true
    },
    Boolean: {
      inputType: "checkbox",
      dataTransformationFunction: "transformBoolean",
      isType: false,
      showBooleanInput: true
    },
    Date: { inputType: "date", dataTransformationFunction: null, isType: true },
    Int: {
      inputType: "number",
      dataTransformationFunction: null,
      isType: true
    },
    Url: {
      inputType: "url",
      dataTransformationFunction: "wrapInQuotes",
      isType: true
    }
  };

  //@track filters = filterWrapper; // Array to store filter objects { field, operator, value, condition }
  soqlQuery;

  booleanOptions = [
    { label: "True", value: "true" },
    { label: "False", value: "false" }
  ];

  async getPicklistValuesForSelectedPicklistField() {
    await getPickListvaluesByFieldName({
      selectedObjectName: this.objectApiName,
      selectedField: this.currentPicklistField
    })
      .then((result) => {
        if (result) {
          this._filters[this.currentIndex].options = result;
          this._filters[this.currentIndex].valueDisabled = false;
        }
      })
      .catch((error) => {
        console.error("Error in getting pickist values " + error);
      });
  }

  get isCustomLogic() {
    return this.selectedLogicOption === "Custom" ? true : false;
  }

  addFilter() {
    this._filters.push({
      sequence: this._filters.length + 1,
      field: "",
      operator: "",
      value: "",
      condition: "AND",
      fieldType: "",
      showPicklistInput: false,
      showBooleanInput: false,
      booleanOptions: [],
      options: [],
      selectedValues: [],
      operatorOptions: [],
      isType: true,
      formatter: "",
      operatorDisabled: true,
      valueDisabled: true
    });
  }

  clearFilterData(index) {
    this._filters[index].field = "";
    this._filters[index].operator = "";
    this._filters[index].value = "";
    this._filters[index].fieldType = "";
    this._filters[index].showPicklistInput = false;
    this._filters[index].showBooleanInput = false;
    this._filters[index].options = [];
    this._filters[index].selectedValues = [];
    this._filters[index].operatorOptions = [];
    this._filters[index].isType = true;
    this._filters[index].formatter = "";
  }

  removeFilter(event) {
    let index = event.currentTarget.dataset.index;
    if (this._filters.length === 1) {
      this.clearFilterData(0);
      return;
    }

    let defaultFilters = JSON.parse(JSON.stringify(this._filters));
    if (defaultFilters.length > 1) {
      defaultFilters.splice(index, 1);
      defaultFilters.forEach(function (item, ind) {
        item.sequence = ind + 1;
      });
      this._filters = defaultFilters;
    }
  }

  handleFieldChange(event) {
    try {
      let index = event.currentTarget.dataset.index;
      const { value } = event.target;
      this.clearFilterData(index);
      this._filters[index].field = value;

      // Get field type
      const fieldDetail = this.fieldOptions.find(
        (field) => field.value === value
      );

      if (fieldDetail) {
        try {
          this._filters[index].fieldType =
            this.fieldTypeSettings[fieldDetail.dataType].inputType;

          this._filters[index].operatorOptions = this.operations.filter(
            (operation) => operation.types.includes(fieldDetail.dataType)
          );

          this._filters[index].operatorDisabled = false;

          this._filters[index].isType =
            this.fieldTypeSettings[fieldDetail.dataType].isType;

          this._filters[index].showPicklistInput =
            this.fieldTypeSettings[fieldDetail.dataType]?.hasOwnProperty(
              "showPicklistInput"
            ) || false;

          if (this._filters[index].showPicklistInput) {
            if (this._filters[index].options.length === 0) {
              this.currentIndex = index;
              this.currentPicklistField = this._filters[index].field;
              this.getPicklistValuesForSelectedPicklistField();
            }
            //this._filters[index].options = fieldDetail.picklistOptions;
          } else {
            this._filters[index].valueDisabled = false;
          }

          this._filters[index].showBooleanInput =
            this.fieldTypeSettings[fieldDetail.dataType]?.hasOwnProperty(
              "showBooleanInput"
            ) || false;

          if (this._filters[index].showBooleanInput) {
            this._filters[index].booleanOptions = this.booleanOptions;
          }
        } catch (err) {
          console.error(err);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  handleOperatorChange(event) {
    const { value } = event.target;
    this._filters[event.currentTarget.dataset.index].operator = value;
  }

  handleValueChange(event) {
    const { value } = event.target;
    this._filters[event.currentTarget.dataset.index].value = value;
  }

  handleConditionChange(event) {
    const { value } = event.target;
    this._filters[event.currentTarget.dataset.index].condition = value;
  }

  @api
  generateSOQLQuery() {
    if (this.error) {
      const evt = new ShowToastEvent({
        title: "Error",
        message: "Fix all the errors.",
        variant: "error",
        mode: "dismissable"
      });
      this.dispatchEvent(evt);
      return;
    }

    console.log("@@ filter is " + JSON.stringify(this._filters));

    try {
      let showWhere = false;
      let soqlWhere = "";
      let completeConditions = this._filters.filter(
        (curCondition) => curCondition.field
      );
      if (completeConditions && completeConditions.length) {
        const All_Combobox_Valid = [
          ...this.template.querySelectorAll("lightning-combobox")
        ].reduce((validSoFar, input_Field_Reference) => {
          input_Field_Reference.reportValidity();
          return validSoFar && input_Field_Reference.checkValidity();
        }, true);

        if (All_Combobox_Valid) {
          soqlWhere += " ";
          if (!this.isCustomLogic) {
            showWhere = true;
            soqlWhere += completeConditions
              .map((curCompleteCondition) => {
                return this.buildCondition(curCompleteCondition);
              })
              .join(" " + this.selectedLogicOption + " ");

            this.fireEvent(soqlWhere, showWhere);
          } else {
            if (this.isValid()) {
              showWhere = true;
              let customLogicLocal = this.buildCustomLogic(this.customLogic);
              if (customLogicLocal) {
                for (let i = 0; i < completeConditions.length; i++) {
                  const regex = new RegExp("\\$" + (i + 1) + "_", "gi");
                  customLogicLocal = customLogicLocal.replace(
                    regex,
                    this.buildCondition(completeConditions[i])
                  );
                }
              }
              soqlWhere += customLogicLocal ? customLogicLocal : "";
              this.fireEvent(soqlWhere, showWhere);
            }
          }
        }
      } else {
        this.fireEvent(soqlWhere, showWhere);
      }
    } catch (err) {
      console.error(err);
    }
  }

  fireEvent(soqlWhere, showWhere) {
    this.dispatchEvent(
      new CustomEvent("fetchresults", {
        detail: {
          payload: {
            whereClaue: soqlWhere,
            showWhere: showWhere
          }
        }
      })
    );
  }

  formatClause(field, operator, value, type) {
    let clause = `  `;
    if (type === "text") {
      console.log("@@ operator " + operator);
      if (operator === "LIKE" || operator === "NOT LIKE") {
        return `'%${value}%'`;
      } else {
        return `'${value}'`;
      }
    }

    return `'${value}'`;
  }

  handleMultiSelect(event) {
    if (event.detail) {
      let payload = event.detail.payload;
      console.log("@@ payload " + JSON.stringify(payload));
      this._filters[payload.index].selectedValues = payload.values;
    }
  }

  handleLogicOptionChange(event) {
    this.selectedLogicOption = event.detail.value;
    this.error = false;
  }

  handleCustomLogicChange(event) {
    this.customLogic = event.detail.value;
  }

  handleValidateBrackets(event) {
    const customLogicInput = this.template.querySelector(".customLogic");

    let isValidBracket = false;

    if (this.customLogic !== "") {
      isValidBracket = this.validateBrackets(this.customLogic);
    }

    this.error = !isValidBracket;
    customLogicInput.setCustomValidity(this.error ? "Brackets Mis-Match" : "");
    customLogicInput.reportValidity();
  }

  validateBrackets(str) {
    try {
      const stack = [];

      for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (char === "(") {
          stack.push(char);
        } else if (char === ")") {
          if (stack.length === 0 || stack[stack.length - 1] !== "(") {
            return false;
          }
          stack.pop();
        }
      }

      return stack.length === 0;
    } catch (error) {
      console.error(error);
    }
  }

  buildCustomLogic(customLogic) {
    if (customLogic) {
      const matcher = new RegExp("\\d+", "gi");
      let matched = customLogic.match(matcher);
      if (matched) {
        matched.forEach((curMatch) => {
          customLogic = customLogic.replace(curMatch, "$" + curMatch + "_");
        });
      }
    }
    return customLogic;
  }

  buildCondition(filter) {
    let soqlWhere = " ";

    let value = filter.value !== "" ? filter.value : "''";

    if (filter.showPicklistInput) {
      if (filter.selectedValues.length === 0) {
        soqlWhere += `${filter.field} ${filter.operator} ''`;
      } else {
        const values = filter.selectedValues.join("', '");
        let operator = filter.operator === "=" ? "IN" : "NOT IN";
        soqlWhere += `${filter.field} ${operator} ('${values}')`;
      }
    } else if (filter.fieldType === "text") {
      soqlWhere +=
        filter.operator.trim() === "NOT LIKE"
          ? `(NOT ${filter.field} LIKE  ${this.formatClause(
              filter.field,
              filter.operator,
              filter.value,
              "text"
            )})`
          : `${filter.field} ${filter.operator} ${this.formatClause(
              filter.field,
              filter.operator,
              filter.value,
              "text"
            )}`;
    } else if (filter.showBooleanInput) {
      const booleanValue = filter.value === "true" ? true : false;
      soqlWhere += `${filter.field} ${filter.operator} ${booleanValue}`;
    } else {
      soqlWhere += `${filter.field} ${filter.operator} ${value}`;
    }

    return soqlWhere;
  }

  isValid() {
    if (this.selectedLogicOption === "Custom") {
      let customLogicInput = this.template.querySelector(".customLogic");
      let hasError = false;
      if (this.customLogic) {
        let matched = this.customLogic.match(new RegExp("\\d+", "gi"), "(");
        if (!matched) {
          hasError = true;
        }
        if (customLogicInput && !hasError) {
          for (let i = 1; i <= this._filters.length; i++) {
            matched = matched.filter((curElement) => curElement !== "" + i);
            if (!this.customLogic || !this.customLogic.includes(i)) {
              hasError = true;
              break;
            }
          }
          if (matched.length) {
            hasError = true;
          }
        }
      } else {
        hasError = true;
      }
      if (hasError) {
        customLogicInput.setCustomValidity("Invalid custom conditions");
      } else {
        customLogicInput.setCustomValidity("");
      }
      customLogicInput.reportValidity();
      return !hasError;
    }

    return true;
  }

  @api
  throwError() {
    if (this.selectedLogicOption === "Custom") {
      let customLogicInput = this.template.querySelector(".customLogic");
      customLogicInput.setCustomValidity("Invalid custom conditions");
      customLogicInput.reportValidity();
    }
  }

  @api
  resetAll() {
    console.log("@@ in reset");
    this._filters = [];
    this.selectedLogicOption = "AND";
    this.customLogic = "";
    this.currentIndex = 0;
    this.currentPicklistField = "";
    this._filters = filterWrapper;
    console.log("@@ in " + JSON.stringify(filterWrapper));
  }
}