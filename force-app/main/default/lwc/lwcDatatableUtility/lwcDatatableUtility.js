import { LightningElement, api, track } from "lwc";
const DELAY = 300;
const recordsPerPage = [10, 25, 50, 75, 100];
const pageNumber = 1;
const SHOWDIV = "visibility:visible";
const HIDEDIV = "visibility:hidden";
const DEFAULTHEIGHT = "300";

const action = [
  {
    type: "button-icon",
    initialWidth: 15,
    typeAttributes: {
      iconName: "utility:edit",
      iconClass: "slds-var-m-left_xx-small",
      variant: "bare",
      name: "edit",
      title: "Edit Record",
      disabled: false,
      value: "test"
    }
  },
  {
    type: "button-icon",
    initialWidth: 15,
    typeAttributes: {
      iconName: "utility:delete",
      iconClass: "slds-m-left_xx-small",
      variant: "bare",
      name: "delete",
      title: "Delete Record",
      disabled: false,
      value: "test"
    }
  }
];

export default class LwcDatatableUtility extends LightningElement {
  // Input Attributes from Parent Componant
  @api keyField;
  @api showSearchBox = false; //Show/hide search box; valid values are true/false
  @api showPagination; //Show/hide pagination; valid values are true/false
  @api pageSizeOptions = recordsPerPage; //Page size options; valid values are array of integers
  @api totalRecords; //Total no.of records; valid type is Integer
  @api maxRowSelection; //All records available in the data table; valid type is Array
  @api canDelete = false;
  @api editable = false;
  @api objectName;

  @track _columns = [];
  @track _records = [];
  @track action = action;

  @api records;

  @api
  get columns() {
    return this._columns;
  }

  set columns(value) {
    console.log("@@ columns " + JSON.stringify(value));
    this._columns = JSON.parse(JSON.stringify(value));
  }

  @api
  /*get records() {
    return this._records;
  }

  set records(value) {
    console.log("@@ columns " + JSON.stringify(value));
    this._records = JSON.parse(JSON.stringify(value));
  }*/
  tableHeightStyle = "height: " + DEFAULTHEIGHT + "px;"; // Set Default Height as 300px
  @api
  get tableHeight() {
    return this.tableHeightStyle;
  }

  set tableHeight(value) {
    this.tableHeightStyle = "height: " + value + "px;";
  }

  pageSize; //No.of records to be displayed per page
  totalPages; //Total no.of pages
  pageNumber = pageNumber; //Page number
  searchKey; //Search Input
  paginationVisibility = SHOWDIV;
  rowNumberOffset; //Row number
  preSelected; //preSelectedOnDisplay
  recordsToDisplay = []; //Records to be displayed on the page

  filteredRecords = []; //Filtered records available in the data table; valid type is Array
  selectedRecords = []; //OverallSelected records  in the data table; valid type is Array
  pageSelectedRecords = []; //Page Selected rows  in the data table; valid type is Array
  filtredNum; // Total no.of Filtered records; valid type is Integer
  totalSelected = 0;
  refreshCurrentData;
  //SORT
  defaultSortDirection = "asc";
  sortDirection = "asc";
  sortedBy;

  //Called after the component finishes inserting to DOM
  connectedCallback() {
    if (this.pageSizeOptions && this.pageSizeOptions.length > 0)
      this.pageSize = this.pageSizeOptions[0];
    else {
      this.pageSize = this.totalRecords;
      this.showPagination = false;
    }
    this.paginationVisibility =
      this.showPagination === false ? HIDEDIV : SHOWDIV;
    this.filteredRecords = this.records;
    this.filtredNum = this.totalRecords;
    this.setRecordsOnPage();
    //this.createActionButton();
  }

  createActionButton = () => {
    if (
      this._columns !== undefined &&
      this.editable !== undefined &&
      this.editable
    ) {
      console.log("@@ action " + JSON.stringify(this.action));
      this._columns = [...this._columns, this.action[0]];
    }
    if (
      this._columns !== undefined &&
      this.canDelete !== undefined &&
      this.canDelete
    ) {
      this._columns = [...this._columns, this.action[1]];
    }
  };

  handleRecordsPerPage(event) {
    this.pageSize = event.target.value;
    this.setRecordsOnPage();
  }

  previousPage() {
    this.pageNumber = this.pageNumber - 1;
    this.setRecordsOnPage();
  }
  nextPage() {
    this.pageNumber = this.pageNumber + 1;
    this.setRecordsOnPage();
  }

  handleFirst() {
    this.pageNumber = 1;
    this.setRecordsOnPage();
  }

  handleLast() {
    this.pageNumber = this.totalPages;
    this.setRecordsOnPage();
  }

  @api
  setRecordsOnPage() {
    this.recordsToDisplay = [];
    if (!this.pageSize) this.pageSize = this.filtredNum;

    this.totalPages = Math.ceil(this.filtredNum / this.pageSize);

    this.setPaginationControls();
    for (
      let i = (this.pageNumber - 1) * this.pageSize;
      i < this.pageNumber * this.pageSize;
      i++
    ) {
      if (i === this.filtredNum) break;
      this.recordsToDisplay.push(this.filteredRecords[i]);
    }

    this.preSelected = [];
    this.selectedRecords.forEach((item) => {
      if (item.selected) this.preSelected.push(item.Id);
    });
    let paginatedRecords = new Object();
    paginatedRecords.recordsToDisplay = this.recordsToDisplay;
    paginatedRecords.preSelected = this.preSelected;
    if (this.maxRowSelection === "1") {
      this.totalSelected = 0;
    }
    if (this.selectedRecords && this.selectedRecords.length > 0) {
      this.refreshCurrentData = true;
    }
  }

  setPaginationControls() {
    // Previous/Next buttons visibility by Total pages
    if (this.totalPages === 1) {
      this.showPrevious = HIDEDIV;
      this.showNext = HIDEDIV;
    } else if (this.totalPages > 1) {
      this.showPrevious = SHOWDIV;
      this.showNext = SHOWDIV;
    }
    // Previous/Next buttons visibility by Page number
    if (this.pageNumber <= 1) {
      this.pageNumber = 1;
      this.showPrevious = HIDEDIV;
    } else if (this.pageNumber >= this.totalPages) {
      this.pageNumber = this.totalPages;
      this.showNext = HIDEDIV;
    }
    // Previous/Next buttons visibility by Pagination visibility
    if (this.paginationVisibility === HIDEDIV) {
      this.showPrevious = HIDEDIV;
      this.showNext = HIDEDIV;
    }
  }

  handleKeyChange(event) {
    window.clearTimeout(this.delayTimeout);
    const searchKey = event.target.value;
    if (searchKey) {
      this.delayTimeout = setTimeout(() => {
        //this.paginationVisibility = HIDEDIV;
        this.setPaginationControls();

        this.searchKey = searchKey;
        //Use other field name here in place of 'Name' field if you want to search by other field
        //this.recordsToDisplay = this.records.filter(rec => rec.includes(searchKey));
        //Search with any column value (Updated as per the feedback)
        this.filteredRecords = this.records.filter((rec) =>
          JSON.stringify(rec).toLowerCase().includes(searchKey.toLowerCase())
        );
        this.filtredNum = this.filteredRecords.length;
        this.setRecordsOnPage();
      }, DELAY);
    } else {
      this.filteredRecords = this.records;
      this.filtredNum = this.totalRecords;
      this.paginationVisibility = SHOWDIV;
      this.setRecordsOnPage();
    }
  }

  handelRowsSelected(selectedRows) {
    console.log(selectedRows.length);
    this.totalSelected = 0;
    this.pageSelectedRecords = [];
    if (
      this.maxRowSelection != "1" &&
      this.recordsToDisplay &&
      this.recordsToDisplay.length > 0 &&
      ((selectedRows.length === 0 && !this.refreshCurrentData) ||
        selectedRows.length > 0)
    ) {
      this.recordsToDisplay.forEach((item) => {
        var row = new Object();
        row.Id = item.Id;
        if (selectedRows.includes(item.Id)) {
          row.selected = true;
        } else {
          row.selected = false;
        }
        this.pageSelectedRecords.push(row);
      });
    }
    // To store previous row Selection
    if (this.selectedRecords.length == 0) {
      this.selectedRecords = this.pageSelectedRecords;
    }
    this.selectedRecords = this.mergeObjectArray(
      this.selectedRecords,
      this.pageSelectedRecords,
      "Id"
    );
    if (
      this.maxRowSelection === "1" &&
      selectedRows &&
      selectedRows.length > 0
    ) {
      this.totalSelected = 1;
    } else {
      let i = 0;
      this.selectedRecords.forEach((item) => {
        if (item.selected) {
          i++;
          this.totalSelected = i;
        }
      });
      //this.totalSelected = this.totalSelected ===1 && selectedRows.length ===0? 0: this.totalSelected;
    }
    const filterSelected = this.selectedRecords.filter(
      ({ selected }) => selected === true
    );
    this.dispatchEvent(
      new CustomEvent("setselectedrecords", { detail: this.selectedRecords })
    ); //Send records to display on table to the parent component
    this.refreshCurrentData = false;
  }

  mergeObjectArray(firstArray, secondArray, prop) {
    var reduced = firstArray.filter(
      (aitem) => !secondArray.find((bitem) => aitem[prop] === bitem[prop])
    );
    //let arr3 = arr1.map((item, i) => Object.assign({}, item, arr2[i]));
    return reduced.concat(secondArray);
  }

  getSelectedRows(event) {
    const selectedRows = event.detail.selectedRows;
    let selectedRecordIds = [];
    // Display that fieldName of the selected rows
    for (let i = 0; i < selectedRows.length; i++) {
      selectedRecordIds.push(selectedRows[i].Id);
    }
    this.handelRowsSelected(selectedRecordIds);
  }

  handelSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    const cloneData = [...this.filteredRecords];
    cloneData.sort(this.sortBy(sortedBy, sortDirection === "asc" ? 1 : -1));
    this.filteredRecords = cloneData;
    this.sortDirection = sortDirection;
    this.sortedBy = sortedBy;
    this.setRecordsOnPage();
  }

  sortBy(field, reverse, primer) {
    const key = primer
      ? function (x) {
          return primer(x[field]);
        }
      : function (x) {
          return x[field];
        };

    return function (a, b) {
      a = key(a);
      b = key(b);
      return reverse * ((a > b) - (b > a));
    };
  }

  handleRowAction = (event) => {
    const action = event.detail.action;
    const row = event.detail.row;
    console.log("@@ row " + JSON.stringify(row));
    if (row && this.objectName) {
      this.recordId = row.Id;
      if (action.name === "edit") {
        if (this.template.querySelector("c-common-dialog")) {
          this.template.querySelector("c-common-dialog").openmodal();
        }
      }
      if (action.name === "delete") {
        this.deleteRecordById();
      }
    }
  };
}