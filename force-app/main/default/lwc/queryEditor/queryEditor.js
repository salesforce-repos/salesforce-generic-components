import { LightningElement, track, api, wire } from "lwc";
import getAllObject from "@salesforce/apex/QueryEditorController.getAllObject";
import getAllfields from "@salesforce/apex/QueryEditorController.getAllfields";
import fetchData from "@salesforce/apex/QueryEditorController.fetchData";
import getPicklistValuesFromApex from "@salesforce/apex/QueryEditorController.getPicklistValuesFromApex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getObjectInfo } from "lightning/uiObjectInfoApi";
import { getRecord } from "lightning/uiRecordApi";
import UserId from "@salesforce/user/Id";
import State from "@salesforce/schema/User.State";
import Country from "@salesforce/schema/User.Country";
import PostalCode from "@salesforce/schema/User.PostalCode";
import ProfileName from "@salesforce/schema/User.Profile.Name";

import {
  filterWrapper,
  operations,
  fieldTypeSettings,
  booleanOptions
} from "c/commonLibrary";

export default class QueryEditor extends LightningElement {
  selectedObject = "";
  @track objectData = [];
  @track objectList = [];
  @track fieldList = [];
  @track fieldOptions = [];
  @track selectedFields = [];
  @track selectedColumnsMap = [];
  @track queryData = [];
  @track columnsToSearch = [];
  @track fieldPickerStyle;
  @track fieldDetails = [];
  @track filters = filterWrapper;
  @track objectInfo;
  orderByField = "";
  orderByDirection = "";
  isLoading = false;
  @track selectedRows = [];
  userProfileName;
  billingCountry;
  billingPostalCode;
  billingStateCode;

  orderByDirections = [
    { label: "ASC", value: "ASC" },
    { label: "DESC", value: "DESC" }
  ];

  limit;

  labels = {
    chooseFields: "Return which fields:",
    availableFields: "Add fields",
    generatedQuery: "Return Records meeting the following conditions:",
    whereClauses: "Create the where clauses to your query below",
    orderBy: "Order the number of results by:",
    incompatibleObject:
      "The soql string that was passed in was incompatible with the provided object type name",
    lockObjectButNoSoqlNoObject:
      "You need to either specify the object type, pass in an existing soql string, or allow the user to choose the object type",
    buttonRemoveAll: "Remove All"
  };

  get selectedObjectClass() {
    return !this.selectedObject
      ? "slds-col slds-size--8-of-12"
      : "slds-col slds-size--8-of-12 slds-p-left--small slds-p-top_medium slds-border_top slds-border_right slds-border_bottom slds-border_left";
  }
  billingState;
  @wire(getRecord, {
    recordId: UserId,
    fields: [State, ProfileName, Country, PostalCode]
  })
  userDetails({ error, data }) {
    if (error) {
      console.error("Error in fetching State of User:" + JSON.stringify(error));
    } else if (data) {
      console.log("fetching State of User:" + JSON.stringify(data));

      if (data.fields.State.value != null) {
        this.billingState = data.fields.State.value;
      }

      if (data.fields.Country.value != null) {
        this.billingCountry = data.fields.Country.value;
      }

      if (data.fields.Country.value != null) {
        this.billingPostalCode = data.fields.PostalCode.value;
      }

      if (data.fields.Profile.value != null) {
        this.userProfileName = data.fields.Profile.value.fields.Name.value;
      }
    }
  }

  @wire(getAllObject, { profileName: "$userProfileName" })
  objectDetails({ data, error }) {
    if (data) {
      this.objectData = data;
      /*this.selectedFields.push(
        ...["Id", "BillingCity", "BillingState", "Phone"]
      );*/
      for (var key in data) {
        this.objectList.push({ label: data[key], value: key });
      }

      this.objectList = this.sortData(this.objectList);
    }
    if (error) console.error(error);
  }

  @wire(getObjectInfo, { objectApiName: "$selectedObject" })
  _getObjectInfo({ error, data }) {
    if (error) {
      console.error(error);
    } else if (data) {
      //this.template.querySelector("c-dynamic-filter").resetAll();
      this.isLoading = true;
      this.objectInfo = data;

      getAllfields({
        sObjectName: this.selectedObject,
        profileName: this.userProfileName
      })
        .then((result) => {
          let sequence = 1;
          let filterArray = [];

          var filterWrapper = [];
          var picklistFields = [];

          const allowedDataTypes = new Set([
            "String",
            "Picklist",
            "Url",
            "Email",
            "Reference",
            "Phone",
            "Date",
            "DateTime",
            "Currency",
            "Double",
            "Boolean",
            "Int",
            "Address"
          ]);

          const fields = Object.values(data.fields);

          let fieldDetails = [];
          let fieldOptionsList = [];

          const fieldAPINames = new Set(
            result.map((obj) => obj.Field_API_Name__c)
          );

          var filteredFields = fields.filter((obj) =>
            fieldAPINames.has(obj.apiName)
          );

          this.selectedFields = result
            .filter((obj) => obj.Selected_Field__c === true)
            .map((obj) => obj.Field_API_Name__c);

          // 2. Add properties from array1 to filteredArray
          filteredFields = filteredFields.map((element) => {
            const matchingItem = result.find(
              (item) => item.Field_API_Name__c === element.apiName
            );
            return {
              ...element,
              ...matchingItem
            };
          });

          for (const field of filteredFields) {
            if (allowedDataTypes.has(field.dataType)) {
              const fieldOption = {
                label: field.label,
                value: field.apiName,
                dataType: field.dataType
              };
              fieldOptionsList.push(fieldOption);
            }
            if (field.apiName !== "Id" && field.apiName !== "Name") {
              const fieldDetail = {
                label: field.label,
                value: field.apiName,
                dataType: field.dataType,
                selected: false
              };
              fieldDetails.push(fieldDetail);
            }

            if (field.Filter_Field__c) {
              const filter = {};
              filter.sequence = sequence;
              filter.field = field.apiName;
              filter.operator = field.Operator__c;
              filter.value = field?.Filter_Value__c;
              filter.fieldType = fieldTypeSettings[field.dataType].inputType;
              filter.showPicklistInput =
                fieldTypeSettings[field.dataType]?.hasOwnProperty(
                  "showPicklistInput"
                ) || false;

              if (filter.showPicklistInput) {
                picklistFields.push(field.apiName);
              }

              filter.showBooleanInput =
                fieldTypeSettings[field.dataType]?.hasOwnProperty(
                  "showBooleanInput"
                ) || false;

              filter.booleanOptions = filter.showBooleanInput
                ? booleanOptions
                : [];

              filter.options = [];
              filter.selectedValues = [];
              filter.operatorOptions = operations.filter((operation) =>
                operation.types.includes(field.dataType)
              );

              filter.isType = fieldTypeSettings[field.dataType].isType;
              filter.formatter = "";
              filter.operatorDisabled = false;
              filter.valueDisabled = false;

              // map filter values based on criteria
              if (
                field.Value_Criteria__c &&
                field.Value_Criteria__c === "Fetch User State"
              ) {
                filter.value = this.billingState;
              } else if (
                field.Value_Criteria__c &&
                field.Value_Criteria__c === "Fetch User Country"
              ) {
                filter.value = this.billingCountry;
              } else if (
                field.Value_Criteria__c &&
                field.Value_Criteria__c === "Fetch User Postal Code"
              ) {
                filter.value = this.billingPostalCode;
              }

              filterWrapper.push(filter);
              sequence++;
            }
          }

          fieldDetails.sort((a, b) => a.label.localeCompare(b.label));
          fieldOptionsList.sort((a, b) => a.label.localeCompare(b.label));

          this.fieldDetails = fieldDetails;
          this.fieldOptions = fieldOptionsList;

          if (picklistFields.length > 0) {
            getPicklistValuesFromApex({
              selectedObjectName: this.selectedObject,
              picklistFields: picklistFields
            })
              .then((result) => {
                console.log("Result", JSON.stringify(result));
                const entries = Object.entries(result);
                const lookup = Object.fromEntries(entries);

                // Iterate over the array and assign the list to the options property
                // where the apiName matches the key in the lookup object
                filterWrapper.forEach((obj) => {
                  if (lookup[obj.field]) {
                    obj.options = lookup[obj.field];
                    obj.selectedValues = obj?.value?.split(",");
                  }
                });

                console.log("@@ fil " + JSON.stringify(filterWrapper));
                this.filters = filterWrapper;
              })
              .catch((error) => {
                console.error("Error:", error);
              });
          } else {
            this.filters = filterWrapper;
          }

          this.isLoading = false;
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }

  handleOrderByChanged(event) {
    this.orderByField = event.detail.value;
  }

  handleDirectionChanged(event) {
    this.orderByDirection = event.detail.value;
  }

  handleLimitChanged(event) {
    this.limit = event.detail.value;
  }

  sortData(data) {
    data.sort((a, b) => {
      if (a.label < b.label) {
        return -1;
      }
      if (a.label > b.label) {
        return 1;
      }
      return 0;
    });
    return data;
  }

  addAllFields() {
    this.fieldDetails.forEach((field) => {
      field.selected = true;
    });
  }

  removeAllFields() {
    this.fieldDetails.forEach((field) => {
      field.selected = false;
    });
  }

  get conditionBuilderStyle() {
    return !this.selectedObject ? "display: none" : "";
  }

  get fieldOptionsWithNone() {
    return [...[{ label: "--NONE--", value: "" }], ...this.fieldOptions];
  }

  handleObjectChange(event) {
    this.selectedObject = event.detail.value;
    this.filters = [];
    this.queryData = [];
    /*const filterWrapperAccount = [
      {
        sequence: 1,
        field: "BillingState",
        operator: " LIKE ",
        value: this.billingState,
        condition: "AND",
        fieldType: "text",
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
      }
    ];
    this.filters = filterWrapperAccount;*/
  }

  handleFieldChange(event) {
    this.selectedFields = event.detail.value;

    /*const isChecked = event.target.checked;
    let index = event.currentTarget.dataset.index;
    this.fieldDetails[index].selected = isChecked;*/
  }

  handleFetchResults(event) {
    this.template.querySelector("c-dynamic-filter").generateSOQLQuery();
  }

  fetchResults(event) {
    try {
      this.queryData = [];
      if (event.detail) {
        /*const selectedFieldsString = this.fieldDetails
          .filter((item) => item.selected) // Filter the objects where checked is true
          .map((item) => item.value) // Extract the names from the filtered objects
          .join(", ");*/

        /*const selectedColumns = this.fieldDetails.filter((item) => {
          return this.selectedFields.includes(item.value);
        });*/

        const selectedColumns = this.fieldDetails
          .filter((item) => this.selectedFields.includes(item.value))
          .sort((a, b) => {
            const indexA = this.selectedFields.indexOf(a.value);
            const indexB = this.selectedFields.indexOf(b.value);
            return indexA - indexB;
          });

        if (selectedColumns.length === 0) {
          const evt = new ShowToastEvent({
            title: "Error",
            message: "Select atleast 1 field to display.",
            variant: "error",
            mode: "dismissable"
          });
          this.dispatchEvent(evt);
          return;
        }

        let soql =
          "SELECT Id,Name, " +
          this.selectedFields +
          " FROM " +
          this.selectedObject +
          " ";
        let whereClaue = event.detail.payload.whereClaue;

        let showWhere = event.detail.payload.showWhere;

        if (showWhere) {
          soql += "WHERE ";
          soql += whereClaue;
        }

        if (this.orderByField) {
          soql += "ORDER BY " + this.orderByField;
          soql +=
            " " + this.orderByDirection !== ""
              ? ` ${this.orderByDirection}`
              : "ASC";
        }

        if (this.limit) {
          soql += " LIMIT ";
          soql += this.limit;
        } else {
          soql += " LIMIT 5000";
        }

        //soqlQuery += " LIMIT 50000";

        console.log("@@ soql " + soql);

        fetchData({ soqlQuery: soql })
          .then((result) => {
            //this.queryData = result;

            if (result.length === 0) {
              const evt = new ShowToastEvent({
                title: "Info",
                message: "No Records Found.",
                variant: "info",
                mode: "dismissable"
              });
              this.dispatchEvent(evt);
              this.queryData = [];
              return;
            }

            this.selectedColumnsMap = [];
            selectedColumns.forEach((column) => {
              this.selectedColumnsMap.push({
                label: column.label,
                fieldName: column.value
              });
            });

            // Find the object in fieldOptions with the provided label
            let apiName = "Name";
            const foundValue = this.fieldOptions.find(
              (option) => option.value === apiName
            );

            // Get the value of the found option, if it exists
            const label = foundValue ? foundValue.label : "Name";

            this.selectedColumnsMap.unshift({
              label: label,
              fieldName: "urlLink",
              type: "url",
              typeAttributes: {
                label: { fieldName: "Name" },
                target: "_blank"
              }
            });

            let allrecords = [];
            this.queryData = [];

            result.forEach((res) => {
              res.urlLink = "/" + res.Id;
            });

            this.queryData = result;
          })
          .catch((error) => {
            if (
              error.body.message.includes("AND") ||
              error.body.message.includes("OR")
            ) {
              this.template.querySelector("c-dynamic-filter").throwError();
            }
            console.error(error);

            const evt = new ShowToastEvent({
              title: "Error",
              message: "Unable To Fetch Data",
              variant: "error",
              mode: "dismissable"
            });
            this.dispatchEvent(evt);
          });
      }
    } catch (error) {
      console.error(error);
    }
  }

  get showDatatable() {
    return this.queryData.length > 0;
  }

  handlePaginatorChange(event) {
    this.recordsToDisplay = event.detail.recordsToDisplay;
    this.preSelected = event.detail.preSelected;
    if (this.recordsToDisplay && this.recordsToDisplay > 0) {
      this.rowNumberOffset = this.recordsToDisplay[0].rowNumber - 1;
    } else {
      this.rowNumberOffset = 0;
    }
  }

  handleAllSelectedRows(event) {
    this.selectedRows = [];
    const selectedItems = event.detail;
    /*let items = [];
    selectedItems.forEach((item) => {
      this.showActionButton = true;
      console.log(item);
      items.push(item);
    });*/
    this.selectedRows = selectedItems;
    console.log("Selected Rows are " + JSON.stringify(this.selectedRows));
  }
}