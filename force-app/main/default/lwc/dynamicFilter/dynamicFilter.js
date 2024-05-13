import { LightningElement, api, wire, track } from "lwc";

export default class DynamicFilter extends LightningElement {
  @api objectApiName; // Input property to accept custom object API name
  @api fieldOptions; // Input property to accept fields information
  @api fieldDetails;
  @api selectedFields;
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
      selectedValues: [],
      operatorOptions: [],
      isType: true,
      formatter: "",
    },
  ]; // Array to store filter objects { field, operator, value, condition }
  soqlQuery;
  conditionOptions = [
    { label: "AND", value: "AND" },
    { label: "OR", value: "OR" },
  ];

  defaultOperators = [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
  ];

  piclistOperators = [
    { label: "Equals", value: "IN" },
    { label: "Not Equals", value: "NOT IN" },
  ];

  booleanOptions = [
    { label: "True", value: "true" },
    { label: "False", value: "false" },
  ];

  numberOperatorOptions = [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
    { label: "Greater Than", value: ">" },
    { label: "Less Than", value: "<" },
    { label: "Greater Than or Equal To", value: ">=" },
    { label: "Less Than or Equal To", value: "<=" },
    // Add more number operator options as needed
  ];

  stringOperatorOptions = [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
    { label: "LIKE", value: "LIKE" },
    { label: "NOT LIKE", value: "NOT LIKE" },
    // Add more string operator options as needed
  ];

  dateOperatorOptions = [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
    { label: "Greater Than", value: ">" },
    { label: "Less Than", value: "<" },
    { label: "Greater Than or Equal To", value: ">=" },
    { label: "Less Than or Equal To", value: "<=" },
    // Add more date operator options as needed
  ];

  dateTimeOperatorOptions = [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
    { label: "Greater Than", value: ">" },
    { label: "Less Than", value: "<" },
    { label: "Greater Than or Equal To", value: ">=" },
    { label: "Less Than or Equal To", value: "<=" },
    // Add more datetime operator options as needed
  ];

  connectedCallback() {
    // Initialize with one empty filter object
    //this.addFilter();
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
      options: [],
      selectedValues: [],
      operatorOptions: [],
      isType: true,
      formatter: "",
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
    const fieldDetail = this.fieldDetails.find((field) => field.name === value);
    this.checkDataType(fieldDetail, index);
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

  generateSOQLQuery() {
    let soql =
      "SELECT Id, " + this.selectedFields + " FROM " + this.objectApiName + " ";
    if (this.filters && this.filters.length > 0) {
      soql += `WHERE `;
    }
    this.filters.forEach((filter, index) => {
      if (index > 0) {
        soql += ` ${filter.condition} `;
      }
      if (
        filter.field &&
        filter.operator &&
        (filter.value || filter.selectedValues.length > 0)
      ) {
        if (filter.showPicklistInput) {
          const values = filter.selectedValues.join("', '");
          soql += `${filter.field} ${filter.operator} ('${values}')`;
        } else if (filter.fieldType === "text") {
          soql += `${filter.field} ${filter.operator} ${this.formatClause(
            filter.field,
            filter.operator,
            filter.value,
            "text"
          )}`;
        } else if (filter.showBooleanInput) {
          const booleanValue = filter.value === "true" ? true : false;
          soql += `${filter.field} ${filter.operator} ${booleanValue}`;
        } else {
          soql += `${filter.field} ${filter.operator} ${filter.value}`;
        }
      }
    });
    this.soqlQuery = soql;

    // Check if there is anything after "WHERE"
    let whereIndex = this.soqlQuery.indexOf("WHERE ");
    if (
      whereIndex !== -1 &&
      whereIndex + "WHERE ".length !== this.soqlQuery.length
    ) {
      // If there is something after "WHERE", do nothing
    } else {
      // If there is nothing after "WHERE", remove "WHERE" from the string
      this.soqlQuery = this.soqlQuery.replace(" WHERE", "");
    }

    this.dispatchEvent(
      new CustomEvent("fetchresults", {
        detail: {
          payload: {
            soqlQuery: this.soqlQuery,
          },
        },
      })
    );
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
}
