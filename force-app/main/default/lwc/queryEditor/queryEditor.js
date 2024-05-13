import { LightningElement, track, api, wire } from "lwc";
import getAllObject from "@salesforce/apex/QueryEditorController.getAllObject";
import getAllfields from "@salesforce/apex/QueryEditorController.getObjectFields";
import fetchData from "@salesforce/apex/QueryEditorController.fetchData";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class QueryEditor extends LightningElement {
  selectedObject = "";
  @track objectData = [];
  @track objectList = [];
  @track fieldList = [];
  @track fieldOptions = [];
  selectedFields = "";
  @track selectedColumnsMap = [];
  @track queryData = [];

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

  getFieldDetails() {
    getAllfields({ sObjectName: this.selectedObject })
      .then((result) => {
        this.fieldDetails = result;
        this.fieldOptions = [];
        this.selectedColumnsMap = [];
        this.queryData = [];
        this.selectedFields = "";
        this.fieldDetails.forEach((field) => {
          this.fieldOptions.push({ label: field.label, value: field.name });
        });
      })
      .catch((error) => {
        console.error(error);
        const evt = new ShowToastEvent({
          title: "Error",
          message: "Error While Fetching Fields.",
          variant: "error",
          mode: "dismissable",
        });
        this.dispatchEvent(evt);
      });
  }

  handleObjectChange(event) {
    if (event.detail) {
      let payload = event.detail.payload;
      const value = payload.value;
      this.selectedObject = value;

      this.getFieldDetails();
    }
  }

  handleFieldChange(event) {
    this.selectedFields = event.detail.value;
  }

  fetchResults(event) {
    if (event.detail) {
      let soqlQuery = event.detail.payload.soqlQuery;

      fetchData({ soqlQuery: soqlQuery })
        .then((result) => {
          //this.queryData = result;

          if (result.length === 0) {
            const evt = new ShowToastEvent({
              title: "Info",
              message: "No Records Found.",
              variant: "info",
              mode: "dismissable",
            });
            this.dispatchEvent(evt);
            this.queryData = [];
            return;
          }

          let columnsToDisplay = this.fieldOptions.filter((obj) =>
            this.selectedFields.includes(obj.value)
          );

          this.selectedColumnsMap = [];
          columnsToDisplay.forEach((column) => {
            this.selectedColumnsMap.push({
              label: column.label,
              fieldName: column.value,
            });
          });

          let allrecords = [];
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
        })
        .catch((error) => {
          console.error(error);
          const evt = new ShowToastEvent({
            title: "Error",
            message: "Unable To Fetch Data",
            variant: "error",
            mode: "dismissable",
          });
          this.dispatchEvent(evt);
        });
    }
  }
}
