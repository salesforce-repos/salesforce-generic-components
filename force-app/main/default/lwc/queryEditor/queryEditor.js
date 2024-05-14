import { LightningElement, track, api, wire } from "lwc";
import getAllObject from "@salesforce/apex/QueryEditorController.getAllObject";
import getAllfields from "@salesforce/apex/QueryEditorController.getObjectFields";
import fetchData from "@salesforce/apex/QueryEditorController.fetchData";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getObjectInfo } from "lightning/uiObjectInfoApi";

export default class QueryEditor extends LightningElement {
  selectedObject = "";
  @track objectData = [];
  @track objectList = [];
  @track fieldList = [];
  @track fieldOptions = [];
  selectedFields = "";
  @track selectedColumnsMap = [];
  @track queryData = [];
  @track columnsToSearch = [];
  @track fieldPickerStyle;
  @track fieldDetails = [];
  @track objectInfo;
  orderByField = "";
  orderByDirection = "";
  isLoading = false;

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
      ? "slds-col slds-size--9-of-12"
      : "slds-col slds-size--9-of-12 slds-p-left--small slds-p-top_medium slds-border_top slds-border_right slds-border_bottom slds-border_left";
  }

  handleFieldSelected(event) {
    // this.notifyAssignee = event.target.checked === true;
    console.log("@@ event.detail.value " + event.detail.value);
    this._selectedFields = this.toggle(
      this._selectedFields,
      event.detail.value,
      true
    );
    //this.prepareFieldDescriptors();
    //this.buildQuery();
  }

  handleRemoveAll(event) {
    this._selectedFields = [];
    this.prepareFieldDescriptors();
    this._queryString = "";
    this.buildQuery();
  }

  handleAddAll(event) {
    this._selectedFields = this.fieldOptions.map(
      (curOption) => curOption.value
    );
    this.prepareFieldDescriptors();
    this.buildQuery();
  }

  handleFieldRemove(event) {
    this._selectedFields = this.toggle(
      this._selectedFields,
      event.detail.value
    );
    if (!this._selectedFields || !this._selectedFields.length) {
      this._queryString = "";
    }
    this.prepareFieldDescriptors();
    this.buildQuery();
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

  toggle(array, element, skipIfPersists) {
    if (array && element) {
      if (array.includes(element)) {
        if (skipIfPersists) {
          this.flashSelectedField(element);
          return array;
        } else {
          return array.filter((curElement) => curElement != element);
        }
      } else {
        array.push(element);
        return array;
      }
    } else {
      return array;
    }
  }

  @wire(getAllObject)
  objectDetails({ data, error }) {
    if (data) {
      this.objectData = data;
      for (var key in data) {
        this.objectList.push({ label: data[key], value: key });
      }
    }
    if (error) console.error(error);
  }

  @wire(getObjectInfo, { objectApiName: "$selectedObject" })
  _getObjectInfo({ error, data }) {
    if (error) {
      showToast("Error", getErrorMessage(error), "error");
    } else if (data) {
      this.isLoading = true;
      this.objectInfo = data;
      const allowedDataTypes = ["String", "Currency"];

      console.log("@@ data " + JSON.stringify(data));
      this.fieldDetails = Object.values(data.fields).map((field) => ({
        label: `${field.label}`,
        value: field.apiName,
        dataType: field.dataType,
        selected: false
      }));

      this.fieldOptions = Object.values(data.fields).map((field) => ({
        label: `${field.label}`,
        value: field.apiName
      }));

      this.isLoading = false;
      /*this.fieldOptions = Object.values(data.fields)
        .filter((field) => allowedDataTypes.includes(field.dataType))
        .map((field) => ({
          label: `${field.label}`,
          value: field.apiName
        }));*/
    }
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

  getFieldDetails() {
    getAllfields({ sObjectName: this.selectedObject })
      .then((data) => {
        this.fieldDetails = data;
        this.fieldOptions = [];
        this.selectedColumnsMap = [];
        this.queryData = [];
        this.selectedFields = "";
        const allowedDataTypes = ["String", "Currency"];

        console.log("@@ data " + JSON.stringify(data));
        /*this.fieldDetails = Object.values(data.fields).map((field) => ({
          label: `${field.label}`,
          value: field.apiName,
          dataType: field.dataType,
          selected: false
        }));*/

        this.fieldOptions = Object.values(data.fields).map((field) => ({
          label: `${field.label}`,
          value: field.name
        }));

        /*this.fieldOptions = Object.values(data.fields)
          .filter((field) => allowedDataTypes.includes(field.dataType))
          .map((field) => ({
            label: `${field.label}`,
            value: field.apiName
          }));*/
      })
      .catch((error) => {
        console.error(error);
        const evt = new ShowToastEvent({
          title: "Error",
          message: "Error While Fetching Fields.",
          variant: "error",
          mode: "dismissable"
        });
        this.dispatchEvent(evt);
      });
  }

  handleObjectChange(event) {
    this.selectedObject = event.detail.value;
    //this.getFieldDetails();
    /*if (event.detail) {
      let payload = event.detail.payload;
      const value = payload.value;
      this.selectedObject = value;

      this.getFieldDetails();
    }*/
  }

  handleFieldChange(event) {
    //this.selectedFields = event.detail.value;
    const itemName = event.target.label;
    const isChecked = event.target.checked;
    let index = event.currentTarget.dataset.index;
    this.fieldDetails[index].selected = isChecked;
  }

  handleFetchResults(event) {
    console.log("@@ in r");

    this.template.querySelector("c-dynamic-filter").generateSOQLQuery();
  }

  fetchResults(event) {
    console.log("@@ in ev " + JSON.stringify(event.detail));
    try {
      if (event.detail) {
        const selectedFieldsString = this.fieldDetails
          .filter((item) => item.selected) // Filter the objects where checked is true
          .map((item) => item.value) // Extract the names from the filtered objects
          .join(", ");

        const selectedColumns = this.fieldDetails.filter((item) => {
          return item.selected;
        });

        let soql =
          "SELECT Id, " +
          selectedFieldsString +
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

        console.log("@@ li " + this.limit);
        if (this.limit) {
          soql += " LIMIT ";
          soql += this.limit;
        } else {
          soql += " LIMIT 50000";
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

            /*let columnsToDisplay = this.fieldOptions.filter((obj) =>
              this.selectedFields.includes(obj.value)
            );

            this.columnsToSearch = columnsToDisplay;
*/
            this.selectedColumnsMap = [];
            selectedColumns.forEach((column) => {
              this.selectedColumnsMap.push({
                label: column.label,
                fieldName: column.value
              });
            });

            let allrecords = [];
            this.queryData = [];
            for (let i = 0; i < result.length; i++) {
              let rowData = result[i];
              let row = rowData;
              row.Id = rowData.Id;
              for (let col in this.selectedColumnsMap) {
                if (col.fieldName != "Id") {
                  row[col.fieldName] = rowData[col.fieldName];
                }
              }
              allrecords.push(row);
            }

            this.queryData = allrecords;
            console.log("@@ query data " + JSON.stringify(this.queryData));
            console.log(
              "@@ selectedColumnsMap " + JSON.stringify(this.selectedColumnsMap)
            );
          })
          .catch((error) => {
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
}