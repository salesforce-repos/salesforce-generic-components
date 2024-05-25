import { LightningElement, track, api, wire } from "lwc";

export default class DynamicTable extends LightningElement {
  @api objectData = [];
  @api selectedColumns = [];
}