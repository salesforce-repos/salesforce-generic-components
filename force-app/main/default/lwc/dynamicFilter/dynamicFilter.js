import { LightningElement, api, wire, track } from "lwc";
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import getPickListvaluesByFieldName from "@salesforce/apex/QueryEditorController.getOptionsForSelectedPicklistField";

export default class DynamicFilter extends LightningElement {
  @api objectApiName; // Input property to accept custom object API name
  @api fieldOptions; // Input property to accept fields information
  @api fieldDetails;
  @api selectedFields;
  @api objectInfo;

  @track currentPicklistField;
  currentIndex;

  @track logicOptions = [
    { label: "AND", value: "AND" },
    { label: "OR", value: "OR" },
    { label: "Custom", value: "Custom" }
  ];

  selectedLogicOption = "AND";
  customLogic;

  operations = [
    {
      label: "equals",
      value: " = ",
      types:
        "String,Picklist,Url,Email,TextArea,Reference,Phone,Date,DateTime,Currency,Double,Boolean,Int,Address,NestedField"
    },
    {
      label: "not equals",
      value: " != ",
      types:
        "String,Picklist,Url,Email,TextArea,Reference,Phone,Date,DateTime,Currency,Double,Boolean,Int,Address,NestedField"
    },
    {
      label: "less than",
      value: " < ",
      types: "Date,DateTime,Currency,Double,Int,Address,NestedField"
    },
    {
      label: "greater than",
      value: " > ",
      types: "Date,DateTime,Currency,Double,Int,Address,NestedField"
    },
    {
      label: "less than or equals",
      value: " <= ",
      types: "Date,DateTime,Currency,Double,Int,Address,NestedField"
    },
    {
      label: "greater than or equals",
      value: " >= ",
      types: "Phone,Date,DateTime,Currency,Double,Int,Address,NestedField"
    },
    {
      label: "LIKE",
      value: " LIKE ",
      types: "String,Url,Email,Reference,Phone,NestedField"
    },
    {
      label: "NOT IN",
      value: " NOT IN ",
      types: "String,Url,Email,Reference,Phone,Currency,,Address,NestedField"
    },
    {
      label: "IN",
      value: " IN ",
      types: "String,Url,Email,Phone,Currency,Address,NestedField"
    }
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

  @track filters = [
    {
      sequence: 1,
      field: "",
      operator: "",
      value: "",
      condition: "AND",
      fieldType: "",
      showPicklistInput: false,
      showBooleanInput: false,
      options: [],
      booleanOptions: [],
      selectedValues: [],
      operatorOptions: [],
      isType: true,
      formatter: "",
      operatorDisabled: true,
      valueDisabled: true
    }
  ]; // Array to store filter objects { field, operator, value, condition }
  soqlQuery;
  conditionOptions = [
    { label: "AND", value: "AND" },
    { label: "OR", value: "OR" }
  ];

  defaultOperators = [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" }
  ];

  piclistOperators = [
    { label: "Equals", value: "IN" },
    { label: "Not Equals", value: "NOT IN" }
  ];

  booleanOptions = [
    { label: "True", value: "true" },
    { label: "False", value: "false" }
  ];

  numberOperatorOptions = [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
    { label: "Greater Than", value: ">" },
    { label: "Less Than", value: "<" },
    { label: "Greater Than or Equal To", value: ">=" },
    { label: "Less Than or Equal To", value: "<=" }
    // Add more number operator options as needed
  ];

  stringOperatorOptions = [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
    { label: "LIKE", value: "LIKE" },
    { label: "NOT LIKE", value: "NOT LIKE" }
    // Add more string operator options as needed
  ];

  dateOperatorOptions = [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
    { label: "Greater Than", value: ">" },
    { label: "Less Than", value: "<" },
    { label: "Greater Than or Equal To", value: ">=" },
    { label: "Less Than or Equal To", value: "<=" }
    // Add more date operator options as needed
  ];

  dateTimeOperatorOptions = [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
    { label: "Greater Than", value: ">" },
    { label: "Less Than", value: "<" },
    { label: "Greater Than or Equal To", value: ">=" },
    { label: "Less Than or Equal To", value: "<=" }
    // Add more datetime operator options as needed
  ];

  async getPicklistValuesForSelectedPicklistField() {
    await getPickListvaluesByFieldName({
      selectedObjectName: this.objectApiName,
      selectedField: this.currentPicklistField
    })
      .then((result) => {
        if (result) {
          this.filters[this.currentIndex].options = result;
          this.filters[this.currentIndex].valueDisabled = false;
          console.log(
            "@@ result " +
              JSON.stringify(this.filters[this.currentIndex].options)
          );
        }
      })
      .catch((error) => {
        console.error("Error in getting pickist values " + error);
      });
  }

  connectedCallback() {
    // Initialize with one empty filter object
    //this.addFilter();
  }

  get isCustomLogic() {
    return this.selectedLogicOption === "Custom" ? true : false;
  }

  addFilter() {
    this.filters.push({
      sequence: this.filters.length + 1,
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
    this.filters[index].field = "";
    this.filters[index].operator = "";
    this.filters[index].value = "";
    this.filters[index].fieldType = "";
    this.filters[index].showPicklistInput = false;
    this.filters[index].showBooleanInput = false;
    this.filters[index].options = [];
    this.filters[index].selectedValues = [];
    this.filters[index].operatorOptions = [];
    this.filters[index].isType = true;
    this.filters[index].formatter = "";
  }

  removeFilter(event) {
    let index = event.currentTarget.dataset.index;
    // this.filters.splice(index, 1);

    if (this.filters.length === 1) {
      this.clearFilterData(0);
    }

    //let ruleId = event.target.dataset.id;
    let defaultFilters = JSON.parse(JSON.stringify(this.filters));
    if (defaultFilters.length > 1) {
      defaultFilters.splice(index, 1);
      defaultFilters.forEach(function (item, ind) {
        item.sequence = ind + 1;
      });
      this.filters = defaultFilters;
    }
  }

  handleFieldChange(event) {
    let index = event.currentTarget.dataset.index;
    const { value } = event.target;
    this.clearFilterData(index);
    this.filters[index].field = value;

    // Get field type
    const fieldDetail = this.fieldDetails.find(
      (field) => field.value === value
    );

    console.log("@@ fieldDetail " + JSON.stringify(fieldDetail));
    if (fieldDetail) {
      try {
        this.filters[index].fieldType =
          this.fieldTypeSettings[fieldDetail.dataType].inputType;

        this.filters[index].operatorOptions = this.operations.filter(
          (operation) => operation.types.includes(fieldDetail.dataType)
        );

        this.filters[index].operatorDisabled = false;

        this.filters[index].isType =
          this.fieldTypeSettings[fieldDetail.dataType].isType;

        this.filters[index].showPicklistInput =
          this.fieldTypeSettings[fieldDetail.dataType]?.hasOwnProperty(
            "showPicklistInput"
          ) || false;

        if (this.filters[index].showPicklistInput) {
          if (this.filters[index].options.length === 0) {
            this.currentIndex = index;
            this.currentPicklistField = this.filters[index].field;
            this.getPicklistValuesForSelectedPicklistField();
            console.log("@@ current " + this.currentPicklistField);
            console.log("@ obj in dynamic " + JSON.stringify(this.objectInfo));
          }
          //this.filters[index].options = fieldDetail.picklistOptions;
        } else {
          this.filters[index].valueDisabled = false;
        }

        this.filters[index].showBooleanInput =
          this.fieldTypeSettings[fieldDetail.dataType]?.hasOwnProperty(
            "showBooleanInput"
          ) || false;

        if (this.filters[index].showBooleanInput) {
          this.filters[index].booleanOptions = this.booleanOptions;
        }
      } catch (err) {
        console.error(err);
      }
    }
    //this.checkDataType(fieldDetail, index);
  }

  handleOperatorChange(event) {
    const { value } = event.target;
    this.filters[event.currentTarget.dataset.index].operator = value;
  }

  handleValueChange(event) {
    const { value } = event.target;
    this.filters[event.currentTarget.dataset.index].value = value;
  }

  handleConditionChange(event) {
    const { value } = event.target;
    this.filters[event.currentTarget.dataset.index].condition = value;
  }

  @api
  generateSOQLQuery() {
    console.log("@@ called");
    try {
      let showWhere = false;
      //let soql =
      //"SELECT Id, " + this.selectedFields + " FROM " + this.objectApiName + " ";
      let soqlWhere = "";
      if (!this.isCustomLogic) {
        if (this.filters && this.filters.length > 0) {
          //showWhere = true;
          //oql += `WHERE `;
        }
        this.filters.forEach((filter, index) => {
          if (index > 0) {
            soqlWhere += ` ${this.selectedLogicOption} `;
          }
          if (
            filter.field &&
            filter.operator &&
            (filter.value || filter.selectedValues.length > 0)
          ) {
            if (index === 0) {
              showWhere = true;
            }

            if (filter.showPicklistInput) {
              const values = filter.selectedValues.join("', '");
              let operator = filter.operator === " = " ? "IN" : "NOT IN";

              soqlWhere += `${filter.field} ${operator} ('${values}')`;
            } else if (filter.fieldType === "text") {
              soqlWhere += `${filter.field} ${filter.operator} ${this.formatClause(
                filter.field,
                filter.operator,
                filter.value,
                "text"
              )}`;
            } else if (filter.showBooleanInput) {
              const booleanValue = filter.value === "true" ? true : false;
              soqlWhere += `${filter.field} ${filter.operator} ${booleanValue}`;
            } else {
              soqlWhere += `${filter.field} ${filter.operator} ${filter.value}`;
            }
          }
        });
        this.soqlQuery = soqlWhere;

        // Check if there is anything after "WHERE"
        /*let whereIndex = this.soqlQuery.indexOf("WHERE ");
        if (
          whereIndex !== -1 &&
          whereIndex + "WHERE ".length !== this.soqlQuery.length
        ) {
          // If there is something after "WHERE", do nothing
        } else {
          // If there is nothing after "WHERE", remove "WHERE" from the string
          this.soqlQuery = this.soqlQuery.replace(" WHERE", "");
        }*/

        console.log("@@ before event");

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
    } catch (err) {
      console.error(err);
    }
  }

  formatClause(field, operator, value, type) {
    let clause = `  `;
    if (type === "text") {
      if (operator === "LIKE" || operator === "NOT LIKE") {
        return `'%${value}%'`;
      } else {
        return `'${value}'`;
      }
    }

    return `'${value}'`;
  }

  checkDataType(fieldDetail, index) {
    let fieldType = fieldDetail.dataType;
    if (
      fieldType === "ID" ||
      fieldType === "REFERENCE" ||
      fieldType === "STRING" ||
      fieldType === "URL"
    ) {
      this.filters[index].operatorOptions = this.stringOperatorOptions;
      this.filters[index].isType = true;
      this.filters[index].fieldType = "text";
    } else if (fieldType === "BOOLEAN") {
      this.filters[index].showBooleanInput = true;
      this.filters[index].options = [...this.booleanOptions];
      this.filters[index].operatorOptions = this.defaultOperators;
      this.filters[index].isType = false;
    } else if (fieldType === "PICKLIST") {
      this.filters[index].showPicklistInput = true;
      this.filters[index].options = [...fieldDetail.picklistOptions];
      this.filters[index].operatorOptions = this.piclistOperators;
      this.filters[index].isType = false;
    } else if (fieldType === "DOUBLE" || fieldType === "INTEGER") {
      this.filters[index].operatorOptions = this.numberOperatorOptions;
      this.filters[index].isType = true;
      this.filters[index].fieldType = "number";
    } else if (fieldType === "PHONE") {
      this.filters[index].operatorOptions = this.defaultOperators;
    } else if (fieldType === "CURRENCY") {
      this.filters[index].operatorOptions = this.numberOperatorOptions;
      this.filters[index].isType = true;
      this.filters[index].fieldType = "number";
      this.filters[index].formatter = "currency";
    } else if (fieldType === "DATETIME") {
      this.filters[index].operatorOptions = this.dateOperatorOptions;
      this.filters[index].isType = true;
      this.filters[index].fieldType = "datetime";
    } else if (fieldType === "DATE") {
      this.filters[index].operatorOptions = this.dateOperatorOptions;
      this.filters[index].isType = true;
      this.filters[index].fieldType = "date";
    }
  }

  handleMultiSelect(event) {
    if (event.detail) {
      let payload = event.detail.payload;
      this.filters[payload.index].selectedValues = payload.values;
    }
  }

  handleLogicOptionChange(event) {
    this.selectedLogicOption = event.detail.value;
  }

  handleCustomLogicChange(event) {
    this.customLogic = event.detail.value;
  }
}