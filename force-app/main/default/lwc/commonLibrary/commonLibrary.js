import { ShowToastEvent } from "lightning/platformShowToastEvent";

const showMessage = (page, t, m, type) => {
  const toastEvt = new ShowToastEvent({
    title: t,
    message: m,
    variant: type
  });
  page.dispatchEvent(toastEvt);
};
const arrayContainsValue = (arr, key, val) => {
  var records = [];
  for (var i = 0; i < arr.length; i++) {
    if (
      typeof arr[i][key] !== "undefined" &&
      arr[i][key].toLowerCase().includes(val.toLowerCase())
    ) {
      records.push(arr[i]);
    }
  }
  return records;
};

const findRowIndexById = (data, id) => {
  let ret = -1;
  data.some((row, index) => {
    if (row.Id === id) {
      ret = index;
      return true;
    }
    return false;
  });
  return ret;
};
const isNotBlank = (checkString) => {
  return (
    checkString !== "" && checkString !== null && checkString !== undefined
  );
};

const filterWrapper = [
  {
    sequence: 1,
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
  }
];

const operations = [
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

const standardObjectOptions = [
  { value: "Account", label: "Account" },
  { value: "AccountPartner", label: "Account Partner" },
  { value: "Asset", label: "Asset" },
  { value: "AssetRelationship", label: "Asset Relationship" },
  { value: "AssignedResource", label: "Assigned Resource" },
  { value: "Campaign", label: "Campaign" },
  { value: "CampaignMember", label: "Campaign Member" },
  { value: "Case", label: "Case" },
  { value: "Contact", label: "Contact" },
  { value: "ContactRequest", label: "Contact Request" },
  { value: "ContentDocument", label: "File" },
  { value: "ContentVersion", label: "File" },
  { value: "ContentWorkspace", label: "Library" },
  { value: "Contract", label: "Contract" },
  { value: "ContractContactRole", label: "Contract Contact Role" },
  { value: "Image", label: "Image" },
  { value: "Individual", label: "Individual" },
  { value: "Lead", label: "Lead" },
  { value: "MaintenanceAsset", label: "Maintenance Asset" },
  { value: "MaintenancePlan", label: "Maintenance Plan" },
  { value: "Note", label: "Note" },
  { value: "OperatingHours", label: "Operating Hours" },
  { value: "Opportunity", label: "Opportunity" },
  { value: "OpportunityLineItem", label: "Opportunity Product" },
  { value: "OpportunityPartner", label: "Opportunity Partner" },
  { value: "Order", label: "Order" },
  { value: "OrderItem", label: "Order Product" },
  { value: "Partner", label: "Partner" },
  { value: "Pricebook2", label: "Price Book" },
  { value: "PricebookEntry", label: "Price Book Entry" },
  { value: "Product2", label: "Product" },
  { value: "RecordType", label: "Record Type" },
  { value: "ResourceAbsence", label: "Resource Absence" },
  { value: "ResourcePreference", label: "Resource Preference" },
  { value: "ReturnOrder", label: "Return Order" },
  { value: "ReturnOrderLineItem", label: "Return Order Line Item" },
  { value: "ServiceAppointment", label: "Service Appointment" },
  { value: "ServiceCrew", label: "Service Crew" },
  { value: "ServiceCrewMember", label: "Service Crew Member" },
  { value: "ServiceResource", label: "Service Resource" },
  { value: "ServiceResourceCapacity", label: "Resource Capacity" },
  { value: "ServiceResourceSkill", label: "Service Resource Skill" },
  { value: "ServiceTerritory", label: "Service Territory" },
  { value: "ServiceTerritoryLocation", label: "Service Territory Location" },
  { value: "ServiceTerritoryMember", label: "Service Territory Member" },
  { value: "Shift", label: "Shift" },
  { value: "Shipment", label: "Shipment" },
  { value: "SkillRequirement", label: "Skill Requirement" },
  { value: "TimeSheet", label: "Time Sheet" },
  { value: "TimeSheetEntry", label: "Time Sheet Entry" },
  { value: "TimeSlot", label: "Time Slot" },
  { value: "User", label: "User" },
  { value: "WorkOrder", label: "Work Order" },
  { value: "WorkOrderLineItem", label: "Work Order Line Item" },
  { value: "WorkType", label: "Work Type" }
];

const fieldTypeSettings = {
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

const booleanOptions = [
  { label: "True", value: "true" },
  { label: "False", value: "false" }
];

export {
  showMessage,
  arrayContainsValue,
  findRowIndexById,
  isNotBlank,
  standardObjectOptions,
  filterWrapper,
  operations,
  fieldTypeSettings,
  booleanOptions
};